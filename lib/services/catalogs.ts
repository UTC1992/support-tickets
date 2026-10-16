import prisma from "@/lib/db/prisma";

const listCatalogs = async (tenantId: string) => {
  const [sectors, supportTypes, technicians] = await Promise.all([
    prisma.sector.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.supportType.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.technician.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    sectors,
    supportTypes,
    technicians,
    statuses: [
      "pending",
      "assigned",
      "in_progress",
      "completed",
      "not_completed",
      "rescheduled",
      "cancelled",
    ],
    priorities: ["low", "normal", "high", "urgent"],
  };
};

export default listCatalogs;
