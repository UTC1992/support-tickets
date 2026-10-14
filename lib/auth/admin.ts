import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export class AdminAccessError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminAccessError";
    this.status = status;
  }
}

export const assertAdmin = async () => {
  const user = await getCurrentUser();

  if (!user) {
    throw new AdminAccessError("Debes iniciar sesión", 401);
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, fullName: true, role: true, isActive: true },
  });

  if (!profile?.isActive || profile.role !== "admin") {
    throw new AdminAccessError("No tienes permisos de administrador", 403);
  }

  return profile;
};

const requireAdmin = async () => {
  try {
    await connection();
    return await assertAdmin();
  } catch (error) {
    if (error instanceof AdminAccessError && error.status === 401) {
      redirect("/login?redirectTo=/admin");
    }

    redirect("/access-denied");
  }
};

export default requireAdmin;
