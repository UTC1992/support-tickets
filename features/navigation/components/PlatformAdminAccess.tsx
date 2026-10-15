import type { ReactNode } from "react";
import PlatformAdminShell from "@/features/navigation/components/PlatformAdminShell";
import requirePlatformAdmin from "@/lib/auth/platform-admin";

type PlatformAdminAccessProps = { children: ReactNode };

const PlatformAdminAccess = async ({ children }: PlatformAdminAccessProps) => {
  await requirePlatformAdmin();
  return <PlatformAdminShell>{children}</PlatformAdminShell>;
};

export default PlatformAdminAccess;
