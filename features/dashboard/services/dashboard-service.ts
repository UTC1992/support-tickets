import "server-only";

import requireBackOffice from "@/lib/auth/back-office";
import prisma from "@/lib/db/prisma";

const getDashboardSummary = async () => {
  await requireBackOffice();
  const [total, open, unassigned, completed] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: { in: ["pending", "assigned", "in_progress", "rescheduled"] } } }),
    prisma.ticket.count({ where: { technicianId: null } }),
    prisma.ticket.count({ where: { status: "completed" } }),
  ]);

  return { total, open, unassigned, completed };
};

export default getDashboardSummary;
