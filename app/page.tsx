import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import getRoleHomePath from "@/features/navigation/services/role-home-service";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

const HomeRedirect = async () => {
  await connection();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const platformAdmin = await prisma.platformAdmin.findUnique({
    where: { userId: user.id },
    select: { isActive: true },
  });

  if (platformAdmin?.isActive) {
    redirect("/super-admin");
  }

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      role: true,
      isActive: true,
      tenant: { select: { isActive: true } },
    },
  });

  if (!profile?.isActive || !profile.tenant.isActive) {
    redirect("/access-denied");
  }

  redirect(getRoleHomePath(profile.role));
};

const Home = () => (
  <Suspense fallback={null}>
    <HomeRedirect />
  </Suspense>
);

export default Home;
