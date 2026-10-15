export type TenantItem = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  _count: { profiles: number; tickets: number };
};
