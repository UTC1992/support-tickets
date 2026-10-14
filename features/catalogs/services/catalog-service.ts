import "server-only";

import requireAdmin from "@/lib/auth/admin";
import prisma from "@/lib/db/prisma";

export const listTechnicians = async () => {
  await requireAdmin();
  return prisma.technician.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true, isActive: true, _count: { select: { tickets: true } } },
  });
};

export const listZones = async () => {
  await requireAdmin();
  return prisma.zone.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, isActive: true, _count: { select: { tickets: true } } },
  });
};

export const listSupportTypes = async () => {
  await requireAdmin();
  return prisma.supportType.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, exportGroup: true, isActive: true, _count: { select: { tickets: true } } },
  });
};
