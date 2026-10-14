import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export class BackOfficeAccessError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BackOfficeAccessError";
    this.status = status;
  }
}

export const assertBackOffice = async () => {
  const user = await getCurrentUser();

  if (!user) {
    throw new BackOfficeAccessError("Debes iniciar sesion", 401);
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, fullName: true, role: true, isActive: true },
  });

  if (!profile?.isActive || !["admin", "office"].includes(profile.role)) {
    throw new BackOfficeAccessError("No tienes permisos para gestionar soportes", 403);
  }

  return profile;
};

const requireBackOffice = async () => {
  try {
    await connection();
    return await assertBackOffice();
  } catch (error) {
    if (error instanceof BackOfficeAccessError && error.status === 401) {
      redirect("/login");
    }

    redirect("/access-denied");
  }
};

export default requireBackOffice;
