import "server-only";

import requireBackOffice from "@/lib/auth/back-office";
import requireTechnician from "@/lib/auth/technician";
import prisma from "@/lib/db/prisma";

export const listManagedTickets = async () => {
  await requireBackOffice();

  return prisma.ticket.findMany({
    take: 50,
    orderBy: [{ intakeDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      clientName: true,
      clientPhone: true,
      clientIp: true,
      sector: true,
      status: true,
      priority: true,
      intakeDate: true,
      scheduledAt: true,
      completedAt: true,
      observation: true,
      technicianNotes: true,
      resultNotes: true,
      zoneId: true,
      supportTypeId: true,
      technicianId: true,
      zone: { select: { id: true, name: true } },
      supportType: { select: { id: true, name: true } },
      technician: { select: { id: true, name: true } },
    },
  });
};

export const getTicketCatalogs = async () => {
  await requireBackOffice();
  const [zones, supportTypes, technicians] = await Promise.all([
    prisma.zone.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.supportType.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.technician.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return { zones, supportTypes, technicians };
};

export const listAssignedTickets = async () => {
  const { technician } = await requireTechnician();

  return prisma.ticket.findMany({
    where: { technicianId: technician.id },
    orderBy: [{ scheduledAt: "asc" }, { intakeDate: "desc" }],
    take: 100,
    select: {
      id: true,
      clientName: true,
      clientPhone: true,
      clientIp: true,
      sector: true,
      status: true,
      priority: true,
      intakeDate: true,
      scheduledAt: true,
      observation: true,
      technicianNotes: true,
      zone: { select: { name: true } },
      supportType: { select: { name: true } },
    },
  });
};
