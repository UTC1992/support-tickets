import "server-only";

import requireAdmin from "@/lib/auth/admin";
import prisma from "@/lib/db/prisma";

export const listTechnicians = async () => {
  const profile = await requireAdmin();
  return prisma.technician.findMany({
    where: { tenantId: profile.tenantId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true, isActive: true, _count: { select: { tickets: true } } },
  });
};

export const listSectors = async () => {
  const profile = await requireAdmin();
  return prisma.sector.findMany({
    where: { tenantId: profile.tenantId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, isActive: true, _count: { select: { tickets: true } } },
  });
};

export const listSupportTypes = async () => {
  const profile = await requireAdmin();
  return prisma.supportType.findMany({
    where: { tenantId: profile.tenantId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, isActive: true, _count: { select: { tickets: true } } },
  });
};
