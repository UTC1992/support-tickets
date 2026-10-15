import "server-only";

import createSupabaseAdminClient from "@/lib/auth/supabase-admin";
import { assertPlatformAdmin } from "@/lib/auth/platform-admin";
import prisma from "@/lib/db/prisma";

export class TenantResourceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "TenantResourceError";
    this.status = status;
  }
}

export const listTenants = async () => {
  await assertPlatformAdmin();
  return prisma.tenant.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { profiles: true, tickets: true } } },
  });
};

export const createTenant = async (input: unknown) => {
  await assertPlatformAdmin();
  const payload = readObject(input);
  const name = readRequiredString(payload, "name");
  const slug = readSlug(payload);
  const ownerName = readRequiredString(payload, "ownerName");
  const ownerEmail = readEmail(payload);
  const password = readPassword(payload);
  const supabaseAdmin = createSupabaseAdminClient();
  const authResult = await supabaseAdmin.auth.admin.createUser({
    email: ownerEmail,
    email_confirm: true,
    password,
    user_metadata: {
      auth_method: "email",
      full_name: ownerName,
      must_change_password: true,
      role: "owner",
    },
  });

  if (authResult.error || !authResult.data.user) {
    throw new TenantResourceError(
      authResult.error?.message.toLowerCase().includes("already")
        ? "Ya existe una cuenta con ese correo"
        : "No se pudo crear la cuenta del propietario",
    );
  }

  try {
    return await prisma.tenant.create({
      data: {
        name,
        slug,
        profiles: {
          create: {
            id: authResult.data.user.id,
            fullName: ownerName,
            role: "owner",
          },
        },
      },
      include: { _count: { select: { profiles: true, tickets: true } } },
    });
  } catch {
    await supabaseAdmin.auth.admin.deleteUser(authResult.data.user.id);
    throw new TenantResourceError("No se pudo crear la empresa; revisa que el identificador sea único");
  }
};

export const updateTenant = async (id: string, input: unknown) => {
  await assertPlatformAdmin();
  const payload = readObject(input);

  if (has(payload, "slug")) {
    throw new TenantResourceError("El identificador de la empresa no se puede modificar");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!tenant) throw new TenantResourceError("La empresa no existe", 404);

  try {
    return await prisma.tenant.update({
      where: { id },
      data: {
        ...(has(payload, "name") ? { name: readRequiredString(payload, "name") } : {}),
        ...(has(payload, "isActive") ? { isActive: readBoolean(payload, "isActive") } : {}),
      },
      include: { _count: { select: { profiles: true, tickets: true } } },
    });
  } catch {
    throw new TenantResourceError("No se pudo actualizar la empresa");
  }
};

const readObject = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TenantResourceError("Los datos enviados no son válidos");
  }

  return input as Record<string, unknown>;
};

const has = (payload: Record<string, unknown>, key: string) => key in payload;

const readRequiredString = (payload: Record<string, unknown>, key: string) => {
  const value = payload[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new TenantResourceError(`${key} es obligatorio`);
  }
  return value.trim();
};

const readSlug = (payload: Record<string, unknown>) => {
  const slug = readRequiredString(payload, "slug").toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new TenantResourceError("El identificador solo admite letras, números y guiones");
  }
  return slug;
};

const readEmail = (payload: Record<string, unknown>) => {
  const email = readRequiredString(payload, "ownerEmail").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new TenantResourceError("El correo no es válido");
  }
  return email;
};

const readPassword = (payload: Record<string, unknown>) => {
  const password = readRequiredString(payload, "password");
  if (password.length < 8) {
    throw new TenantResourceError("La contraseña temporal debe tener al menos 8 caracteres");
  }
  return password;
};

const readBoolean = (payload: Record<string, unknown>, key: string) => {
  if (typeof payload[key] !== "boolean") {
    throw new TenantResourceError(`${key} no es válido`);
  }
  return payload[key];
};
