export type UserItem = {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  role: "admin" | "technician";
  isActive: boolean;
  createdAt: string;
};

export type UserAuthMethod = "email" | "phone";

export type ManagedUserRole = UserItem["role"];
