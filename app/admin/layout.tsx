import { Suspense, type ReactNode } from "react";
import AdminAccess from "@/features/navigation/components/AdminAccess";
import PageLoading from "@/features/navigation/components/PageLoading";

type AdminLayoutProps = { children: ReactNode };

const AdminLayout = ({ children }: AdminLayoutProps) => (
  <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-6"><PageLoading /></main>}>
    <AdminAccess>{children}</AdminAccess>
  </Suspense>
);

export default AdminLayout;
