import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export class OwnerAccessError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OwnerAccessError";
    this.status = status;
  }
}

export const assertOwner = async () => {
  const user = await getCurrentUser();

  if (!user) throw new OwnerAccessError("Debes iniciar sesión", 401);

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

  if (!profile?.isActive || !profile.tenant.isActive || profile.role !== "owner") {
    throw new OwnerAccessError("No tienes permisos de propietario", 403);
  }

  return profile;
};

const requireOwner = async () => {
  try {
    await connection();
    return await assertOwner();
  } catch (error) {
    if (error instanceof OwnerAccessError && error.status === 401) {
      redirect("/login?redirectTo=/owner");
    }

    redirect("/access-denied");
  }
};

export default requireOwner;
