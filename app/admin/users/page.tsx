import { Suspense } from "react";
import PageHeader from "@/features/navigation/components/PageHeader";
import PageLoading from "@/features/navigation/components/PageLoading";
import UserManager from "@/features/users/components/UserManager";
import listUsers, { listAvailableTechnicians } from "@/features/users/services/user-service";
import requireAdmin from "@/lib/auth/admin";

const UsersContent = async () => {
  const [users, availableTechnicians, currentUser] = await Promise.all([
    listUsers(),
    listAvailableTechnicians(),
    requireAdmin(),
  ]);
  const initialUsers = users.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }));
  return <><PageHeader title="Accesos técnicos" description="Técnicos autorizados para ingresar al sistema." /><UserManager initialUsers={initialUsers} currentUserId={currentUser.id} managedRole="technician" availableTechnicians={availableTechnicians} /></>;
};

const UsersPage = () => <Suspense fallback={<PageLoading />}><UsersContent /></Suspense>;

export default UsersPage;
