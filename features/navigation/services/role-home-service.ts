import type { AppRole } from "@/generated/prisma/client";

const roleHomePaths: Record<AppRole, string> = {
  owner: "/owner",
  admin: "/admin",
  technician: "/technician/tickets",
};

const getRoleHomePath = (role: AppRole) => roleHomePaths[role];

export default getRoleHomePath;
