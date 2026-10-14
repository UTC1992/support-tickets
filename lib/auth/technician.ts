import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

const requireTechnician = async () => {
  await connection();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirectTo=/technician/tickets");
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, fullName: true, role: true, isActive: true },
  });

  if (!profile?.isActive || profile.role !== "technician") {
    redirect("/access-denied");
  }

  const technician = await prisma.technician.findUnique({
    where: { userId: user.id },
    select: { id: true, name: true, isActive: true },
  });

  if (!technician?.isActive) {
    redirect("/access-denied");
  }

  return { profile, technician };
};

export default requireTechnician;
