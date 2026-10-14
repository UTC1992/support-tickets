export type UserItem = {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  role: "admin" | "office" | "technician";
  isActive: boolean;
  createdAt: string;
};

export type UserAuthMethod = "email" | "phone";
