import { Suspense } from "react";
import UserManager from "@/features/admin/components/UserManager";
import AdminLoading from "@/features/admin/components/AdminLoading";
import AdminPageHeader from "@/features/admin/components/AdminPageHeader";
import { listAdminUsers } from "@/features/admin/services/admin-service";
import requireAdmin from "@/lib/auth/admin";

const UsersContent = async () => {
  const [users, currentUser] = await Promise.all([listAdminUsers(), requireAdmin()]);
  const initialUsers = users.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }));
  return <><AdminPageHeader title="Usuarios" description="Perfiles autorizados para acceder al sistema." /><UserManager initialUsers={initialUsers} currentUserId={currentUser.id} /></>;
};

const UsersPage = () => <Suspense fallback={<AdminLoading />}><UsersContent /></Suspense>;

export default UsersPage;
