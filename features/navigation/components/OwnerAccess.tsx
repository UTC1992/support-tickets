import type { ReactNode } from "react";
import OwnerShell from "@/features/navigation/components/OwnerShell";
import requireOwner from "@/lib/auth/owner";

type OwnerAccessProps = { children: ReactNode };

const OwnerAccess = async ({ children }: OwnerAccessProps) => {
  const profile = await requireOwner();
  return (
    <OwnerShell userName={profile.fullName} tenantName={profile.tenant.name}>
      {children}
    </OwnerShell>
  );
};

export default OwnerAccess;
