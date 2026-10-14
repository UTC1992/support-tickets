import "server-only";

import type { AppRole, Prisma } from "@/generated/prisma/client";
import { assertAdmin } from "@/lib/auth/admin";
import createSupabaseAdminClient from "@/lib/auth/supabase-admin";
import prisma from "@/lib/db/prisma";

export class UserResourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserResourceError";
  }
}

type CreateUserOptions = {
  origin?: string;
};

export const createUser = async (input: unknown, options: CreateUserOptions = {}) => {
  await assertAdmin();
  const payload = readObject(input);
  const fullName = readRequiredString(payload, "fullName");
  const authMethod = readAuthMethod(payload);
  const role = authMethod === "phone" ? "technician" : readRole(payload);
  const email = authMethod === "email" ? readEmail(payload) : null;
  const phone = authMethod === "phone" ? readPhone(payload) : null;
  const password = authMethod === "phone" ? readPassword(payload) : null;
  const supabaseAdmin = createSupabaseAdminClient();

  if (phone) {
    const linkedTechnician = await prisma.technician.findFirst({
      where: { phone, userId: { not: null } },
      select: { id: true },
    });
    if (linkedTechnician) {
      throw new UserResourceError("Ese telefono ya esta vinculado a otro tecnico");
    }
  }

  const authResult = email
    ? await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName, role },
        redirectTo: options.origin ? `${options.origin}/set-password` : undefined,
      })
    : await supabaseAdmin.auth.admin.createUser({
        phone: phone!,
        password: password!,
        phone_confirm: true,
        user_metadata: {
          full_name: fullName,
          must_change_password: true,
          role,
        },
      });

  if (authResult.error || !authResult.data.user) {
    const identifier = email ? "correo" : "telefono";
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
        const existingTechnician = phone
          ? await tx.technician.findFirst({ where: { phone, userId: null } })
          : null;

        if (existingTechnician) {
          await tx.technician.update({
            where: { id: existingTechnician.id },
            data: { userId, name: fullName, isActive: true },
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
  if (has(payload, "fullName")) data.fullName = readRequiredString(payload, "fullName");
  if (has(payload, "role")) data.role = readRole(payload);
  if (has(payload, "isActive")) data.isActive = readBoolean(payload, "isActive");
  if (actor.id === id && (data.role !== undefined && data.role !== "admin" || data.isActive === false)) {
    throw new UserResourceError("No puedes quitar tu propio acceso de administrador");
  }

  return prisma.$transaction(async (tx) => {
    const profile = await tx.profile.update({ where: { id }, data });
    const technician = await tx.technician.findUnique({ where: { userId: id } });

    if (profile.role === "technician") {
      if (technician) {
        await tx.technician.update({
          where: { id: technician.id },
          data: { name: profile.fullName, isActive: profile.isActive },
        });
      } else {
        await tx.technician.create({
          data: { userId: id, name: profile.fullName, isActive: profile.isActive },
        });
      }
    } else if (technician) {
      await tx.technician.update({
        where: { id: technician.id },
        data: { isActive: false },
      });
    }

    return profile;
  });
};

export const deleteUser = async (id: string) => {
  const actor = await assertAdmin();
  if (actor.id === id) throw new UserResourceError("No puedes eliminar tu propio perfil");

  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) throw new UserResourceError("No se pudo eliminar la cuenta");
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
  const phone = readRequiredString(payload, "phone").replace(/[\s()-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    throw new UserResourceError("El telefono debe incluir el codigo de pais, por ejemplo +593999999999");
  }
  return phone;
};

const readPassword = (payload: Record<string, unknown>) => {
  const password = readRequiredString(payload, "password");
  if (password.length < 8) {
    throw new UserResourceError("La contrasena temporal debe tener al menos 8 caracteres");
  }
  return password;
};

const readAuthMethod = (payload: Record<string, unknown>) => {
  const method = readRequiredString(payload, "authMethod");
  if (method !== "email" && method !== "phone") {
    throw new UserResourceError("El metodo de acceso no es valido");
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
