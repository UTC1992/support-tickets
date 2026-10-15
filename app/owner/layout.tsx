import { Suspense, type ReactNode } from "react";
import OwnerAccess from "@/features/navigation/components/OwnerAccess";
import PageLoading from "@/features/navigation/components/PageLoading";

type OwnerLayoutProps = { children: ReactNode };

const OwnerLayout = ({ children }: OwnerLayoutProps) => (
  <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-6"><PageLoading /></main>}>
    <OwnerAccess>{children}</OwnerAccess>
  </Suspense>
);

export default OwnerLayout;
