import { prisma } from "@/lib/db/prisma";

export async function listCatalogs() {
  const [zones, supportTypes, technicians] = await Promise.all([
    prisma.zone.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.supportType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.technician.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    zones,
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
}
