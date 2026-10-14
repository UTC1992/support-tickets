import type { ReactNode } from "react";
import OfficeShell from "@/features/navigation/components/OfficeShell";
import requireOffice from "@/lib/auth/office";

type OfficeAccessProps = { children: ReactNode };

const OfficeAccess = async ({ children }: OfficeAccessProps) => {
  const profile = await requireOffice();
  return <OfficeShell userName={profile.fullName}>{children}</OfficeShell>;
};

export default OfficeAccess;
