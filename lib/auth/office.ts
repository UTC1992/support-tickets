import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export class OfficeAccessError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OfficeAccessError";
    this.status = status;
  }
}

export const assertOffice = async () => {
  const user = await getCurrentUser();

  if (!user) {
    throw new OfficeAccessError("Debes iniciar sesión", 401);
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, fullName: true, role: true, isActive: true },
  });

  if (!profile?.isActive || profile.role !== "office") {
    throw new OfficeAccessError("No tienes permisos de oficina", 403);
  }

  return profile;
};

const requireOffice = async () => {
  try {
    await connection();
    return await assertOffice();
  } catch (error) {
    if (error instanceof OfficeAccessError && error.status === 401) {
      redirect("/login?redirectTo=/office");
    }

    redirect("/access-denied");
  }
};

export default requireOffice;
