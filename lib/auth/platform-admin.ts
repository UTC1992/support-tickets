import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export class PlatformAdminAccessError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PlatformAdminAccessError";
    this.status = status;
  }
}

export const assertPlatformAdmin = async () => {
  const user = await getCurrentUser();

  if (!user) throw new PlatformAdminAccessError("Debes iniciar sesión", 401);

  const platformAdmin = await prisma.platformAdmin.findUnique({
    where: { userId: user.id },
    select: { userId: true, isActive: true },
  });

  if (!platformAdmin?.isActive) {
    throw new PlatformAdminAccessError("No tienes permisos globales", 403);
  }

  return platformAdmin;
};

const requirePlatformAdmin = async () => {
  try {
    await connection();
    return await assertPlatformAdmin();
  } catch (error) {
    if (error instanceof PlatformAdminAccessError && error.status === 401) {
      redirect("/login?redirectTo=/super-admin");
    }

    redirect("/access-denied");
  }
};

export default requirePlatformAdmin;
