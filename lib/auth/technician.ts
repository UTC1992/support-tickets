import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export class TechnicianAccessError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "TechnicianAccessError";
    this.status = status;
  }
}

export const assertTechnician = async () => {
  const user = await getCurrentUser();

  if (!user) {
    throw new TechnicianAccessError("Debes iniciar sesión", 401);
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, fullName: true, role: true, isActive: true },
  });

  if (!profile?.isActive || profile.role !== "technician") {
    throw new TechnicianAccessError("No tienes permisos de técnico", 403);
  }

  const technician = await prisma.technician.findUnique({
    where: { userId: user.id },
    select: { id: true, name: true, isActive: true },
  });

  if (!technician?.isActive) {
    throw new TechnicianAccessError("No tienes un técnico activo asociado", 403);
  }

  return { profile, technician };
};

const requireTechnician = async () => {
  try {
    await connection();
    return await assertTechnician();
  } catch (error) {
    if (error instanceof TechnicianAccessError && error.status === 401) {
      redirect("/login?redirectTo=/technician/tickets");
    }

    redirect("/access-denied");
  }
};

export default requireTechnician;
