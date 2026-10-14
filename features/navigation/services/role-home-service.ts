import type { AppRole } from "@/generated/prisma/client";

const roleHomePaths: Record<AppRole, string> = {
  admin: "/admin",
  office: "/office",
  technician: "/technician/tickets",
};

const getRoleHomePath = (role: AppRole) => roleHomePaths[role];

export default getRoleHomePath;
