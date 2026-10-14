import "server-only";

import requireAdmin from "@/lib/auth/admin";
import createSupabaseAdminClient from "@/lib/auth/supabase-admin";
import prisma from "@/lib/db/prisma";

export const getAdminDashboard = async () => {
  await requireAdmin();
  const [total, open, unassigned, completed] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: { in: ["pending", "assigned", "in_progress", "rescheduled"] } } }),
    prisma.ticket.count({ where: { technicianId: null } }),
    prisma.ticket.count({ where: { status: "completed" } }),
  ]);
  return { total, open, unassigned, completed };
};

export const listAdminTickets = async () => {
  await requireAdmin();
  return prisma.ticket.findMany({
    take: 50,
    orderBy: [{ intakeDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true, clientName: true, clientPhone: true, clientIp: true,
      sector: true, status: true, priority: true, intakeDate: true,
      scheduledAt: true, completedAt: true, observation: true,
      technicianNotes: true, resultNotes: true,
      zoneId: true, supportTypeId: true, technicianId: true,
      zone: { select: { id: true, name: true } },
      supportType: { select: { id: true, name: true } },
      technician: { select: { id: true, name: true } },
    },
  });
};

export const getAdminTicketCatalogs = async () => {
  await requireAdmin();
  const [zones, supportTypes, technicians] = await Promise.all([
    prisma.zone.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.supportType.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.technician.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { zones, supportTypes, technicians };
};

export const listAdminTechnicians = async () => {
  await requireAdmin();
  return prisma.technician.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true, isActive: true, _count: { select: { tickets: true } } },
  });
};

export const listAdminZones = async () => {
  await requireAdmin();
  return prisma.zone.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, isActive: true, _count: { select: { tickets: true } } },
  });
};

export const listAdminSupportTypes = async () => {
  await requireAdmin();
  return prisma.supportType.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, exportGroup: true, isActive: true, _count: { select: { tickets: true } } },
  });
};

export const listAdminUsers = async () => {
  await requireAdmin();
  const profiles = await prisma.profile.findMany({
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, role: true, isActive: true, createdAt: true },
  });
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw new Error("No se pudieron consultar los usuarios de Supabase Auth");
  }

  const identities = new Map(
    data.users.map((user) => [
      user.id,
      { email: user.email ?? null, phone: user.phone ?? null },
    ]),
  );
  return profiles.map((profile) => ({
    ...profile,
    email: identities.get(profile.id)?.email ?? null,
    phone: identities.get(profile.id)?.phone ?? null,
  }));
};
