import { Suspense, type ReactNode } from "react";
import PageLoading from "@/features/navigation/components/PageLoading";
import PlatformAdminAccess from "@/features/navigation/components/PlatformAdminAccess";

type SuperAdminLayoutProps = { children: ReactNode };

const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => (
  <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-6"><PageLoading /></main>}>
    <PlatformAdminAccess>{children}</PlatformAdminAccess>
  </Suspense>
);

export default SuperAdminLayout;
