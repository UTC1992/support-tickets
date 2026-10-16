import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { assertAdmin } from "@/lib/auth/admin";
import prisma from "@/lib/db/prisma";
import normalizePhone from "@/lib/services/phone";

const catalogResources = ["sectors", "technicians", "support-types"] as const;
export type CatalogResource = (typeof catalogResources)[number];

export class CatalogResourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogResourceError";
  }
}

export const parseCatalogResource = (value: string) => {
  if (!catalogResources.includes(value as CatalogResource)) {
    throw new CatalogResourceError("Recurso no valido");
  }

  return value as CatalogResource;
};

export const createCatalogResource = async (resource: CatalogResource, input: unknown) => {
  const actor = await assertAdmin();
  const payload = readObject(input);
  const phone = resource === "technicians" ? readOptionalPhone(payload) : undefined;

  if (phone) await assertUniqueTechnicianPhone(actor.tenantId, phone);

  switch (resource) {
    case "sectors":
      return prisma.sector.create({ data: { tenantId: actor.tenantId, name: readRequiredString(payload, "name") }, include: { _count: { select: { tickets: true } } } });
    case "technicians":
      return prisma.technician.create({ data: { tenantId: actor.tenantId, name: readRequiredString(payload, "name"), phone }, include: { _count: { select: { tickets: true } } } });
    case "support-types":
      return prisma.supportType.create({ data: { tenantId: actor.tenantId, name: readRequiredString(payload, "name") }, include: { _count: { select: { tickets: true } } } });
  }
};

export const updateCatalogResource = async (resource: CatalogResource, id: string, input: unknown) => {
  const actor = await assertAdmin();
  await assertCatalogBelongsToTenant(resource, id, actor.tenantId);
  const payload = readObject(input);
  const phone = resource === "technicians" && has(payload, "phone")
    ? readOptionalPhone(payload)
    : undefined;

  if (phone) await assertUniqueTechnicianPhone(actor.tenantId, phone, id);

  switch (resource) {
    case "sectors":
      return prisma.sector.update({ where: { id, tenantId: actor.tenantId }, data: catalogUpdate(payload), include: { _count: { select: { tickets: true } } } });
    case "technicians":
      return prisma.technician.update({ where: { id, tenantId: actor.tenantId }, data: { ...catalogUpdate(payload), ...(has(payload, "phone") ? { phone: phone ?? null } : {}) }, include: { _count: { select: { tickets: true } } } });
    case "support-types":
      return prisma.supportType.update({ where: { id, tenantId: actor.tenantId }, data: catalogUpdate(payload), include: { _count: { select: { tickets: true } } } });
  }
};

export const deleteCatalogResource = async (resource: CatalogResource, id: string) => {
  const actor = await assertAdmin();
  await assertCatalogBelongsToTenant(resource, id, actor.tenantId);

  const where = { id, tenantId: actor.tenantId };
  if (resource === "sectors") await prisma.sector.delete({ where });
  if (resource === "technicians") await prisma.technician.delete({ where });
  if (resource === "support-types") await prisma.supportType.delete({ where });
};

const readObject = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new CatalogResourceError("Los datos enviados no son validos");
  }

  return input as Record<string, unknown>;
};

const has = (payload: Record<string, unknown>, key: string) => key in payload;

const readRequiredString = (payload: Record<string, unknown>, key: string) => {
  const value = payload[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new CatalogResourceError(`${key} es obligatorio`);
  }

  return value.trim();
};

const readOptionalString = (payload: Record<string, unknown>, key: string) => {
  const value = payload[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new CatalogResourceError(`${key} no es valido`);
  return value.trim();
};

const readOptionalPhone = (payload: Record<string, unknown>) => {
  const value = readOptionalString(payload, "phone");
  if (!value) return undefined;
  const phone = normalizePhone(value);

  if (!/^\+593\d{8,9}$/.test(phone)) {
    throw new CatalogResourceError("El teléfono ecuatoriano no es válido");
  }

  return phone;
};

const assertUniqueTechnicianPhone = async (tenantId: string, phone: string, currentId?: string) => {
  const technicians = await prisma.technician.findMany({
    where: { tenantId, phone: { not: null } },
    select: { id: true, phone: true },
  });
  const duplicate = technicians.some(
    (technician) => technician.id !== currentId
      && technician.phone
      && normalizePhone(technician.phone) === phone,
  );

  if (duplicate) {
    throw new CatalogResourceError("Ese teléfono ya está registrado");
  }
};

const assertCatalogBelongsToTenant = async (
  resource: CatalogResource,
  id: string,
  tenantId: string,
) => {
  const where = { id, tenantId };
  const item = resource === "sectors"
    ? await prisma.sector.findFirst({ where, select: { id: true } })
    : resource === "technicians"
      ? await prisma.technician.findFirst({ where, select: { id: true } })
      : await prisma.supportType.findFirst({ where, select: { id: true } });

  if (!item) throw new CatalogResourceError("El registro no existe");
};

const readBoolean = (payload: Record<string, unknown>, key: string) => {
  if (typeof payload[key] !== "boolean") {
    throw new CatalogResourceError(`${key} no es valido`);
  }

  return payload[key];
};

const catalogUpdate = (payload: Record<string, unknown>): Prisma.SectorUpdateInput => ({
  ...(has(payload, "name") ? { name: readRequiredString(payload, "name") } : {}),
  ...(has(payload, "isActive") ? { isActive: readBoolean(payload, "isActive") } : {}),
});
