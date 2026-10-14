import { Suspense } from "react";
import PageHeader from "@/features/navigation/components/PageHeader";
import PageLoading from "@/features/navigation/components/PageLoading";
import UserManager from "@/features/users/components/UserManager";
import listUsers from "@/features/users/services/user-service";
import requireAdmin from "@/lib/auth/admin";

const UsersContent = async () => {
  const [users, currentUser] = await Promise.all([listUsers(), requireAdmin()]);
  const initialUsers = users.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }));
  return <><PageHeader title="Usuarios" description="Perfiles autorizados para acceder al sistema." /><UserManager initialUsers={initialUsers} currentUserId={currentUser.id} /></>;
};

const UsersPage = () => <Suspense fallback={<PageLoading />}><UsersContent /></Suspense>;

export default UsersPage;
