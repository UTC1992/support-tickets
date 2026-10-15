import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

const requireDashboardAccess = async () => {
  await connection();
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      tenantId: true,
      fullName: true,
      role: true,
      isActive: true,
      tenant: { select: { name: true, isActive: true } },
    },
  });

  if (
    !profile?.isActive
    || !profile.tenant.isActive
    || !["owner", "admin"].includes(profile.role)
  ) {
    redirect("/access-denied");
  }

  return profile;
};

export default requireDashboardAccess;
