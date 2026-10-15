import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { AppRole } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export class UserManagerAccessError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "UserManagerAccessError";
    this.status = status;
  }
}

export const assertUserManager = async () => {
  const user = await getCurrentUser();

  if (!user) throw new UserManagerAccessError("Debes iniciar sesión", 401);

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
    || (profile.role !== "owner" && profile.role !== "admin")
  ) {
    throw new UserManagerAccessError("No tienes permisos para gestionar usuarios", 403);
  }

  const managedRole: AppRole = profile.role === "owner" ? "admin" : "technician";
  return { ...profile, managedRole };
};

const requireUserManager = async () => {
  try {
    await connection();
    return await assertUserManager();
  } catch (error) {
    if (error instanceof UserManagerAccessError && error.status === 401) {
      redirect("/login");
    }

    redirect("/access-denied");
  }
};

export default requireUserManager;
