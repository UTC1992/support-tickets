import "server-only";

import requireAdmin from "@/lib/auth/admin";
import createSupabaseAdminClient from "@/lib/auth/supabase-admin";
import prisma from "@/lib/db/prisma";

const listUsers = async () => {
  await requireAdmin();
  const profiles = await prisma.profile.findMany({
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, role: true, isActive: true, createdAt: true },
  });
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw new Error("No se pudieron consultar los usuarios de Supabase Auth");
  }

  const identities = new Map(
    data.users.map((user) => [
      user.id,
      { email: user.email ?? null, phone: user.phone ?? null },
    ]),
  );

  return profiles.map((profile) => ({
    ...profile,
    email: identities.get(profile.id)?.email ?? null,
    phone: identities.get(profile.id)?.phone ?? null,
  }));
};

export default listUsers;
