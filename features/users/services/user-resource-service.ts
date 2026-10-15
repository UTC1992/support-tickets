import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import createSupabaseAdminClient from "@/lib/auth/supabase-admin";
import { assertUserManager } from "@/lib/auth/user-manager";
import prisma from "@/lib/db/prisma";
import normalizePhone, { getPhoneAuthEmail } from "@/lib/services/phone";

export class UserResourceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "UserResourceError";
    this.status = status;
  }
}

export const createUser = async (input: unknown) => {
  const actor = await assertUserManager();
  const payload = readObject(input);
  const expectedAuthMethod = actor.managedRole === "admin" ? "email" : "phone";
  const authMethod = readAuthMethod(payload);

  if (authMethod !== expectedAuthMethod) {
    throw new UserResourceError("El método de acceso no corresponde al rol permitido");
  }

  assertRequestedRole(payload, actor.managedRole);
  const technician = actor.managedRole === "technician"
    ? await findAvailableTechnician(
        actor.tenantId,
        readRequiredString(payload, "technicianId"),
      )
    : null;
  const fullName = technician?.name ?? readRequiredString(payload, "fullName");
  const email = authMethod === "email" ? readEmail(payload) : null;
  const phone = technician ? normalizePhone(technician.phone) : null;
  const password = readPassword(payload);

  if (technician && !/^\+593\d{8,9}$/.test(phone ?? "")) {
    throw new UserResourceError("El técnico seleccionado no tiene un teléfono válido");
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const authResult = await supabaseAdmin.auth.admin.createUser({
    ...(email
      ? { email, email_confirm: true }
      : { email: getPhoneAuthEmail(phone!), email_confirm: true }),
    password,
    user_metadata: {
      auth_method: authMethod,
      full_name: fullName,
      ...(phone ? { login_phone: phone } : {}),
      must_change_password: true,
      role: actor.managedRole,
    },
  });

  if (authResult.error || !authResult.data.user) {
    const identifier = email ? "correo" : "teléfono";
    throw new UserResourceError(
      authResult.error?.message.toLowerCase().includes("already")
        ? `Ya existe una cuenta con ese ${identifier}`
        : `No se pudo crear la cuenta con ${identifier}`,
    );
  }

  const userId = authResult.data.user.id;

  try {
    const profile = await prisma.$transaction(async (tx) => {
      const createdProfile = await tx.profile.create({
        data: {
          id: userId,
          tenantId: actor.tenantId,
          fullName,
          role: actor.managedRole,
        },
      });

      if (technician) {
        await tx.technician.update({
          where: { id: technician.id, tenantId: actor.tenantId },
          data: { userId },
        });
      }

      return createdProfile;
    });

    return { ...profile, email, phone };
  } catch {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new UserResourceError("No se pudo crear el perfil del usuario");
  }
};

const findAvailableTechnician = async (tenantId: string, technicianId: string) => {
  const technician = await prisma.technician.findFirst({
    where: {
      id: technicianId,
      tenantId,
      isActive: true,
      userId: null,
      phone: { not: null },
    },
    select: { id: true, name: true, phone: true },
  });

  if (!technician?.phone) {
    throw new UserResourceError("El técnico seleccionado no está disponible");
  }

  return { ...technician, phone: technician.phone };
};

export const updateUser = async (id: string, input: unknown) => {
  const actor = await assertUserManager();
  const target = await requireManagedTarget(id, actor.tenantId, actor.managedRole);
  const payload = readObject(input);
  assertRequestedRole(payload, actor.managedRole);

  const data: Prisma.ProfileUpdateInput = {};
  const phone = actor.managedRole === "technician" && has(payload, "phone")
    ? readPhone(payload)
    : undefined;

  if (has(payload, "fullName")) data.fullName = readRequiredString(payload, "fullName");
  if (has(payload, "isActive")) data.isActive = readBoolean(payload, "isActive");

  if (phone) {
    const duplicate = (await findTechniciansByPhone(actor.tenantId, phone)).find(
      (technician) => technician.userId
        ? technician.userId !== id
        : technician.isActive,
    );

    if (duplicate) throw new UserResourceError("Ese teléfono ya está registrado");
  }

  const supabaseAdmin = phone ? createSupabaseAdminClient() : null;
  let previousEmail: string | null = null;
  let previousMetadata: Record<string, unknown> = {};
  let authIdentifierChanged = false;

  if (phone && supabaseAdmin) {
    const authResult = await supabaseAdmin.auth.admin.getUserById(id);

    if (authResult.error || !authResult.data.user) {
      throw new UserResourceError("No se pudo consultar la cuenta del usuario");
    }

    previousEmail = authResult.data.user.email ?? null;
    previousMetadata = authResult.data.user.user_metadata;
    const phoneAuthEmail = getPhoneAuthEmail(phone);

    if (
      previousEmail !== phoneAuthEmail
      || authResult.data.user.user_metadata.login_phone !== phone
    ) {
      const updateResult = await supabaseAdmin.auth.admin.updateUserById(id, {
        email: phoneAuthEmail,
        email_confirm: true,
        user_metadata: {
          ...authResult.data.user.user_metadata,
          auth_method: "phone",
          login_phone: phone,
          role: actor.managedRole,
        },
      });

      if (updateResult.error) {
        const message = updateResult.error.message.toLowerCase();
        throw new UserResourceError(
          message.includes("already") || message.includes("registered")
            ? "Ese teléfono ya está registrado"
            : "No se pudo actualizar el teléfono de acceso",
        );
      }

      authIdentifierChanged = true;
    }
  }

  try {
    const profile = await prisma.$transaction(async (tx) => {
      const updatedProfile = await tx.profile.update({
        where: {
          id: target.id,
          tenantId: actor.tenantId,
          role: actor.managedRole,
        },
        data,
      });

      if (actor.managedRole === "technician") {
        const technician = await tx.technician.findFirst({
          where: { tenantId: actor.tenantId, userId: id },
        });

        if (technician) {
          await tx.technician.update({
            where: { id: technician.id, tenantId: actor.tenantId },
            data: {
              name: updatedProfile.fullName,
              isActive: updatedProfile.isActive,
              ...(phone ? { phone } : {}),
            },
          });
        } else {
          await tx.technician.create({
            data: {
              tenantId: actor.tenantId,
              userId: id,
              name: updatedProfile.fullName,
              phone: phone ?? null,
              isActive: updatedProfile.isActive,
            },
          });
        }
      }

      return updatedProfile;
    });

    return phone ? { ...profile, phone } : profile;
  } catch {
    if (authIdentifierChanged && previousEmail && supabaseAdmin) {
      await supabaseAdmin.auth.admin.updateUserById(id, {
        email: previousEmail,
        email_confirm: true,
        user_metadata: previousMetadata,
      });
    }

    throw new UserResourceError("No se pudo actualizar el usuario");
  }
};

export const resetUserPassword = async (id: string, input: unknown) => {
  const actor = await assertUserManager();
  await requireManagedTarget(id, actor.tenantId, actor.managedRole);
  const password = readPassword(readObject(input));
  const supabaseAdmin = createSupabaseAdminClient();
  const authResult = await supabaseAdmin.auth.admin.getUserById(id);

  if (authResult.error || !authResult.data.user) {
    throw new UserResourceError("No se pudo consultar la cuenta del usuario");
  }

  const updateResult = await supabaseAdmin.auth.admin.updateUserById(id, {
    password,
    user_metadata: {
      ...authResult.data.user.user_metadata,
      must_change_password: true,
    },
  });

  if (updateResult.error) {
    throw new UserResourceError("No se pudo restablecer la contraseña");
  }
};

export const deleteUser = async (id: string) => {
  const actor = await assertUserManager();
  await requireManagedTarget(id, actor.tenantId, actor.managedRole);
  const technician = actor.managedRole === "technician"
    ? await prisma.technician.findFirst({
        where: { tenantId: actor.tenantId, userId: id },
        select: { id: true },
      })
    : null;
  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

  if (error) throw new UserResourceError("No se pudo eliminar la cuenta");

  if (technician) {
    await prisma.technician.update({
      where: { id: technician.id, tenantId: actor.tenantId },
      data: { isActive: false, phone: null },
    });
  }
};

const requireManagedTarget = async (
  id: string,
  tenantId: string,
  role: "admin" | "technician",
) => {
  const target = await prisma.profile.findFirst({
    where: { id, tenantId, role },
    select: { id: true },
  });

  if (!target) throw new UserResourceError("El usuario no existe", 404);
  return target;
};

const readObject = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new UserResourceError("Los datos enviados no son válidos");
  }

  return input as Record<string, unknown>;
};

const has = (payload: Record<string, unknown>, key: string) => key in payload;

const readRequiredString = (payload: Record<string, unknown>, key: string) => {
  const value = payload[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new UserResourceError(`${key} es obligatorio`);
  }

  return value.trim();
};

const readBoolean = (payload: Record<string, unknown>, key: string) => {
  if (typeof payload[key] !== "boolean") {
    throw new UserResourceError(`${key} no es válido`);
  }

  return payload[key];
};

const readEmail = (payload: Record<string, unknown>) => {
  const email = readRequiredString(payload, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new UserResourceError("El correo no es válido");
  }
  return email;
};

const readPhone = (payload: Record<string, unknown>) => {
  const phone = normalizePhone(readRequiredString(payload, "phone"));
  if (!/^\+593\d{8,9}$/.test(phone)) {
    throw new UserResourceError("El teléfono ecuatoriano no es válido");
  }
  return phone;
};

const findTechniciansByPhone = async (tenantId: string, phone: string) => {
  const technicians = await prisma.technician.findMany({
    where: { tenantId, phone: { not: null } },
    select: { id: true, isActive: true, phone: true, userId: true },
  });

  return technicians.filter(
    (technician) => technician.phone && normalizePhone(technician.phone) === phone,
  );
};

const readPassword = (payload: Record<string, unknown>) => {
  const password = readRequiredString(payload, "password");
  if (password.length < 8) {
    throw new UserResourceError("La contraseña temporal debe tener al menos 8 caracteres");
  }
  return password;
};

const readAuthMethod = (payload: Record<string, unknown>) => {
  const method = readRequiredString(payload, "authMethod");
  if (method !== "email" && method !== "phone") {
    throw new UserResourceError("El método de acceso no es válido");
  }
  return method;
};

const assertRequestedRole = (
  payload: Record<string, unknown>,
  allowedRole: "admin" | "technician",
) => {
  if (has(payload, "role") && payload.role !== allowedRole) {
    throw new UserResourceError("No puedes asignar ese rol", 403);
  }
};
