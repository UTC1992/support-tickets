import { Suspense } from "react";
import PageHeader from "@/features/navigation/components/PageHeader";
import PageLoading from "@/features/navigation/components/PageLoading";
import UserManager from "@/features/users/components/UserManager";
import listUsers from "@/features/users/services/user-service";
import requireOwner from "@/lib/auth/owner";

const AdminsContent = async () => {
  const [users, currentUser] = await Promise.all([listUsers(), requireOwner()]);
  const initialUsers = users.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
  }));

  return (
    <>
      <PageHeader title="Administradores" description="Usuarios responsables de la operación de la empresa." />
      <UserManager initialUsers={initialUsers} currentUserId={currentUser.id} managedRole="admin" />
    </>
  );
};

const AdminsPage = () => (
  <Suspense fallback={<PageLoading />}>
    <AdminsContent />
  </Suspense>
);

export default AdminsPage;
