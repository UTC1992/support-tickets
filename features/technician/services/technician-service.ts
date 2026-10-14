import "server-only";

import requireTechnician from "@/lib/auth/technician";
import prisma from "@/lib/db/prisma";

const listAssignedTickets = async () => {
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

export default listAssignedTickets;
