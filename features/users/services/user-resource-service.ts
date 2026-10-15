import "server-only";

import type { AppRole, Prisma } from "@/generated/prisma/client";
import { assertAdmin } from "@/lib/auth/admin";
import createSupabaseAdminClient from "@/lib/auth/supabase-admin";
import prisma from "@/lib/db/prisma";
import normalizePhone, { getPhoneAuthEmail } from "@/lib/services/phone";

export class UserResourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserResourceError";
  }
}

export const createUser = async (input: unknown) => {
  await assertAdmin();
  const payload = readObject(input);
  const fullName = readRequiredString(payload, "fullName");
  const authMethod = readAuthMethod(payload);
  const role = authMethod === "phone" ? "technician" : readRole(payload);
  const email = authMethod === "email" ? readEmail(payload) : null;
  const phone = authMethod === "phone" ? readPhone(payload) : null;
  const password = readPassword(payload);
  const supabaseAdmin = createSupabaseAdminClient();
  const matchingTechnicians = phone ? await findTechniciansByPhone(phone) : [];
  const linkedTechnician = matchingTechnicians.find((technician) => technician.userId);
  const availableTechnician = matchingTechnicians.find((technician) => !technician.userId);

  if (linkedTechnician) {
    throw new UserResourceError("Ese teléfono ya está registrado");
  }

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
      role,
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
        data: { id: userId, fullName, role },
      });

      if (role === "technician") {
        if (availableTechnician) {
          await tx.technician.update({
            where: { id: availableTechnician.id },
            data: { userId, name: fullName, phone, isActive: true },
          });
        } else {
          await tx.technician.create({
            data: { userId, name: fullName, phone, isActive: true },
          });
        }
      }

      return createdProfile;
    });

    return { ...profile, email, phone };
  } catch {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new UserResourceError("No se pudo crear el perfil del usuario");
  }
};

export const updateUser = async (id: string, input: unknown) => {
  const actor = await assertAdmin();
  const payload = readObject(input);
  const data: Prisma.ProfileUpdateInput = {};
  const phone = has(payload, "phone") ? readPhone(payload) : undefined;
  if (has(payload, "fullName")) data.fullName = readRequiredString(payload, "fullName");
  if (has(payload, "role")) data.role = readRole(payload);
  if (has(payload, "isActive")) data.isActive = readBoolean(payload, "isActive");
  if (actor.id === id && (data.role !== undefined && data.role !== "admin" || data.isActive === false)) {
    throw new UserResourceError("No puedes quitar tu propio acceso de administrador");
  }

  if (phone) {
    const duplicate = (await findTechniciansByPhone(phone)).find(
      (technician) => technician.userId
        ? technician.userId !== id
        : technician.isActive,
    );

    if (duplicate) {
      throw new UserResourceError("Ese teléfono ya está registrado");
    }
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
      const updatedProfile = await tx.profile.update({ where: { id }, data });
      const technician = await tx.technician.findUnique({ where: { userId: id } });

      if (updatedProfile.role === "technician") {
        if (technician) {
          await tx.technician.update({
            where: { id: technician.id },
            data: {
              name: updatedProfile.fullName,
              isActive: updatedProfile.isActive,
              ...(phone ? { phone } : {}),
            },
          });
        } else {
          await tx.technician.create({
            data: {
              userId: id,
              name: updatedProfile.fullName,
              phone: phone ?? null,
              isActive: updatedProfile.isActive,
            },
          });
        }
      } else if (technician) {
        await tx.technician.update({
          where: { id: technician.id },
          data: { isActive: false, ...(phone ? { phone } : {}) },
        });
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
  await assertAdmin();
  const payload = readObject(input);
  const password = readPassword(payload);
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
  const actor = await assertAdmin();
  if (actor.id === id) throw new UserResourceError("No puedes eliminar tu propio perfil");

  const technician = await prisma.technician.findUnique({
    where: { userId: id },
    select: { id: true },
  });
  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) throw new UserResourceError("No se pudo eliminar la cuenta");

  if (technician) {
    await prisma.technician.update({
      where: { id: technician.id },
      data: { isActive: false, phone: null },
    });
  }
};

const readObject = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new UserResourceError("Los datos enviados no son validos");
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
  if (typeof payload[key] !== "boolean") throw new UserResourceError(`${key} no es valido`);
  return payload[key];
};

const readEmail = (payload: Record<string, unknown>) => {
  const email = readRequiredString(payload, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new UserResourceError("El correo no es valido");
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

const findTechniciansByPhone = async (phone: string) => {
  const technicians = await prisma.technician.findMany({
    where: { phone: { not: null } },
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

const readRole = (payload: Record<string, unknown>) => {
  const role = readRequiredString(payload, "role");
  if (!["admin", "office", "technician"].includes(role)) {
    throw new UserResourceError("El rol no es valido");
  }
  return role as AppRole;
};
