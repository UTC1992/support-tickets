import type { ReactNode } from "react";
import TechnicianShell from "@/features/navigation/components/TechnicianShell";
import requireTechnician from "@/lib/auth/technician";

type TechnicianAccessProps = { children: ReactNode };

const TechnicianAccess = async ({ children }: TechnicianAccessProps) => {
  const { profile } = await requireTechnician();
  return <TechnicianShell technicianName={profile.fullName}>{children}</TechnicianShell>;
};

export default TechnicianAccess;
