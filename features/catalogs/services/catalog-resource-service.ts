import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { assertAdmin } from "@/lib/auth/admin";
import prisma from "@/lib/db/prisma";

const catalogResources = ["zones", "technicians", "support-types"] as const;
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
  await assertAdmin();
  const payload = readObject(input);

  switch (resource) {
    case "zones":
      return prisma.zone.create({ data: { name: readRequiredString(payload, "name") }, include: { _count: { select: { tickets: true } } } });
    case "technicians":
      return prisma.technician.create({ data: { name: readRequiredString(payload, "name"), phone: readOptionalString(payload, "phone") }, include: { _count: { select: { tickets: true } } } });
    case "support-types":
      return prisma.supportType.create({ data: { name: readRequiredString(payload, "name"), exportGroup: readRequiredString(payload, "exportGroup") }, include: { _count: { select: { tickets: true } } } });
  }
};

export const updateCatalogResource = async (resource: CatalogResource, id: string, input: unknown) => {
  await assertAdmin();
  const payload = readObject(input);

  switch (resource) {
    case "zones":
      return prisma.zone.update({ where: { id }, data: catalogUpdate(payload), include: { _count: { select: { tickets: true } } } });
    case "technicians":
      return prisma.technician.update({ where: { id }, data: { ...catalogUpdate(payload), ...(has(payload, "phone") ? { phone: readOptionalString(payload, "phone") ?? null } : {}) }, include: { _count: { select: { tickets: true } } } });
    case "support-types":
      return prisma.supportType.update({ where: { id }, data: { ...catalogUpdate(payload), ...(has(payload, "exportGroup") ? { exportGroup: readRequiredString(payload, "exportGroup") } : {}) }, include: { _count: { select: { tickets: true } } } });
  }
};

export const deleteCatalogResource = async (resource: CatalogResource, id: string) => {
  await assertAdmin();

  if (resource === "zones") await prisma.zone.delete({ where: { id } });
  if (resource === "technicians") await prisma.technician.delete({ where: { id } });
  if (resource === "support-types") await prisma.supportType.delete({ where: { id } });
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

const readBoolean = (payload: Record<string, unknown>, key: string) => {
  if (typeof payload[key] !== "boolean") {
    throw new CatalogResourceError(`${key} no es valido`);
  }

  return payload[key];
};

const catalogUpdate = (payload: Record<string, unknown>): Prisma.ZoneUpdateInput => ({
  ...(has(payload, "name") ? { name: readRequiredString(payload, "name") } : {}),
  ...(has(payload, "isActive") ? { isActive: readBoolean(payload, "isActive") } : {}),
});
