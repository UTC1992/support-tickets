import "server-only";

import type { AppRole, Prisma } from "@/generated/prisma/client";
import { assertAdmin } from "@/lib/auth/admin";
import prisma from "@/lib/db/prisma";

const resources = ["zones", "technicians", "support-types", "profiles"] as const;
export type AdminResource = (typeof resources)[number];

export class AdminResourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminResourceError";
  }
}

export const parseAdminResource = (value: string) => {
  if (!resources.includes(value as AdminResource)) {
    throw new AdminResourceError("Recurso no valido");
  }
  return value as AdminResource;
};

export const createAdminResource = async (resource: AdminResource, input: unknown) => {
  await assertAdmin();
  const payload = readObject(input);

  switch (resource) {
    case "zones":
      return prisma.zone.create({ data: { name: readRequiredString(payload, "name") }, include: { _count: { select: { tickets: true } } } });
    case "technicians":
      return prisma.technician.create({ data: { name: readRequiredString(payload, "name"), phone: readOptionalString(payload, "phone") }, include: { _count: { select: { tickets: true } } } });
    case "support-types":
      return prisma.supportType.create({ data: { name: readRequiredString(payload, "name"), exportGroup: readRequiredString(payload, "exportGroup") }, include: { _count: { select: { tickets: true } } } });
    case "profiles":
      return prisma.profile.create({ data: { id: readUuid(payload, "id"), fullName: readRequiredString(payload, "fullName"), role: readRole(payload) } });
  }
};

export const updateAdminResource = async (resource: AdminResource, id: string, input: unknown) => {
  const actor = await assertAdmin();
  const payload = readObject(input);

  switch (resource) {
    case "zones":
      return prisma.zone.update({ where: { id }, data: catalogUpdate(payload), include: { _count: { select: { tickets: true } } } });
    case "technicians":
      return prisma.technician.update({ where: { id }, data: { ...catalogUpdate(payload), ...(has(payload, "phone") ? { phone: readOptionalString(payload, "phone") ?? null } : {}) }, include: { _count: { select: { tickets: true } } } });
    case "support-types":
      return prisma.supportType.update({ where: { id }, data: { ...catalogUpdate(payload), ...(has(payload, "exportGroup") ? { exportGroup: readRequiredString(payload, "exportGroup") } : {}) }, include: { _count: { select: { tickets: true } } } });
    case "profiles": {
      const data: Prisma.ProfileUpdateInput = {};
      if (has(payload, "fullName")) data.fullName = readRequiredString(payload, "fullName");
      if (has(payload, "role")) data.role = readRole(payload);
      if (has(payload, "isActive")) data.isActive = readBoolean(payload, "isActive");
      if (actor.id === id && (data.role !== undefined && data.role !== "admin" || data.isActive === false)) {
        throw new AdminResourceError("No puedes quitar tu propio acceso de administrador");
      }
      return prisma.profile.update({ where: { id }, data });
    }
  }
};

export const deleteAdminResource = async (resource: AdminResource, id: string) => {
  const actor = await assertAdmin();

  if (resource === "profiles") {
    if (actor.id === id) throw new AdminResourceError("No puedes eliminar tu propio perfil");
    await prisma.profile.delete({ where: { id } });
    return;
  }

  if (resource === "zones") await prisma.zone.delete({ where: { id } });
  if (resource === "technicians") await prisma.technician.delete({ where: { id } });
  if (resource === "support-types") await prisma.supportType.delete({ where: { id } });
};

const readObject = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new AdminResourceError("Los datos enviados no son validos");
  return input as Record<string, unknown>;
};

const has = (payload: Record<string, unknown>, key: string) => key in payload;

const readRequiredString = (payload: Record<string, unknown>, key: string) => {
  const value = payload[key];
  if (typeof value !== "string" || !value.trim()) throw new AdminResourceError(`${key} es obligatorio`);
  return value.trim();
};

const readOptionalString = (payload: Record<string, unknown>, key: string) => {
  const value = payload[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new AdminResourceError(`${key} no es valido`);
  return value.trim();
};

const readBoolean = (payload: Record<string, unknown>, key: string) => {
  if (typeof payload[key] !== "boolean") throw new AdminResourceError(`${key} no es valido`);
  return payload[key];
};

const readUuid = (payload: Record<string, unknown>, key: string) => {
  const value = readRequiredString(payload, key);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new AdminResourceError("El ID de usuario no es un UUID valido");
  return value;
};

const readRole = (payload: Record<string, unknown>) => {
  const role = readRequiredString(payload, "role");
  if (!["admin", "office", "technician"].includes(role)) throw new AdminResourceError("El rol no es valido");
  return role as AppRole;
};

const catalogUpdate = (payload: Record<string, unknown>) => ({
  ...(has(payload, "name") ? { name: readRequiredString(payload, "name") } : {}),
  ...(has(payload, "isActive") ? { isActive: readBoolean(payload, "isActive") } : {}),
});
