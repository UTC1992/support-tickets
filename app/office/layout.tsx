import { Suspense, type ReactNode } from "react";
import OfficeAccess from "@/features/navigation/components/OfficeAccess";
import PageLoading from "@/features/navigation/components/PageLoading";

type OfficeLayoutProps = { children: ReactNode };

const OfficeLayout = ({ children }: OfficeLayoutProps) => (
  <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-6"><PageLoading /></main>}>
    <OfficeAccess>{children}</OfficeAccess>
  </Suspense>
);

export default OfficeLayout;
