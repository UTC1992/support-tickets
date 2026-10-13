import type { ReactNode } from "react";
import AdminShell from "@/features/admin/components/AdminShell";
import requireAdmin from "@/lib/auth/admin";

type AdminAccessProps = { children: ReactNode };

const AdminAccess = async ({ children }: AdminAccessProps) => {
  const profile = await requireAdmin();
  return <AdminShell userName={profile.fullName}>{children}</AdminShell>;
};

export default AdminAccess;
