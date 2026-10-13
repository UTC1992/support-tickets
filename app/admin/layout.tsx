import { Suspense, type ReactNode } from "react";
import AdminAccess from "@/features/admin/components/AdminAccess";
import AdminLoading from "@/features/admin/components/AdminLoading";

type AdminLayoutProps = { children: ReactNode };

const AdminLayout = ({ children }: AdminLayoutProps) => (
  <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-6"><AdminLoading /></main>}>
    <AdminAccess>{children}</AdminAccess>
  </Suspense>
);

export default AdminLayout;
