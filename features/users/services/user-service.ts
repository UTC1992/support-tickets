import "server-only";

import requireUserManager from "@/lib/auth/user-manager";
import createSupabaseAdminClient from "@/lib/auth/supabase-admin";
import prisma from "@/lib/db/prisma";

const listUsers = async () => {
  const actor = await requireUserManager();
  const profiles = await prisma.profile.findMany({
    where: { tenantId: actor.tenantId, role: actor.managedRole },
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
      user.user_metadata.auth_method === "phone" || user.phone
        ? {
            email: null,
            phone: user.user_metadata.login_phone ?? user.phone ?? null,
          }
        : { email: user.email ?? null, phone: null },
    ]),
  );

  return profiles.map((profile) => ({
    ...profile,
    role: profile.role as "admin" | "technician",
    email: identities.get(profile.id)?.email ?? null,
    phone: identities.get(profile.id)?.phone ?? null,
  }));
};

export default listUsers;
