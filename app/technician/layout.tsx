import { Suspense, type ReactNode } from "react";
import TechnicianAccess from "@/features/navigation/components/TechnicianAccess";

type TechnicianLayoutProps = { children: ReactNode };

const TechnicianLayout = ({ children }: TechnicianLayoutProps) => (
  <Suspense fallback={<main className="mx-auto max-w-3xl px-4 py-6"><div className="h-48 animate-pulse rounded-md bg-zinc-100" /></main>}>
    <TechnicianAccess>{children}</TechnicianAccess>
  </Suspense>
);

export default TechnicianLayout;
