import "server-only";

import requireDashboardAccess from "@/lib/auth/dashboard";
import prisma from "@/lib/db/prisma";

const getDashboardSummary = async () => {
  const profile = await requireDashboardAccess();
  const tenantWhere = { tenantId: profile.tenantId };
  const [total, open, unassigned, completed] = await Promise.all([
    prisma.ticket.count({ where: tenantWhere }),
    prisma.ticket.count({ where: { ...tenantWhere, status: { in: ["pending", "assigned", "in_progress", "rescheduled"] } } }),
    prisma.ticket.count({ where: { ...tenantWhere, technicianId: null } }),
    prisma.ticket.count({ where: { ...tenantWhere, status: "completed" } }),
  ]);

  return { total, open, unassigned, completed };
};

export default getDashboardSummary;
