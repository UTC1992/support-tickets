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

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true, isActive: true },
  });

  if (!profile?.isActive) {
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
