import "server-only";

import requireBackOffice from "@/lib/auth/back-office";
import requireTechnician from "@/lib/auth/technician";
import prisma from "@/lib/db/prisma";
import {
  listTechnicianTickets,
  listTickets,
} from "@/lib/services/tickets";

export const listManagedTickets = async () => {
  const profile = await requireBackOffice();
  return listTickets(profile.tenantId, { limit: "20", page: "1" });
};

export const getTicketCatalogs = async () => {
  const profile = await requireBackOffice();
  const [sectors, supportTypes, technicians] = await Promise.all([
    prisma.sector.findMany({ where: { tenantId: profile.tenantId, isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.supportType.findMany({ where: { tenantId: profile.tenantId, isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.technician.findMany({ where: { tenantId: profile.tenantId, isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return { sectors, supportTypes, technicians };
};

export const listAssignedTickets = async () => {
  const { profile, technician } = await requireTechnician();

  return listTechnicianTickets(profile.tenantId, technician.id, { limit: "20", page: "1" });
};
