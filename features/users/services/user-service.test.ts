import { beforeEach, describe, expect, it, vi } from "vitest";
import listUsers, {
  listAvailableTechnicians,
} from "@/features/users/services/user-service";
import requireUserManager from "@/lib/auth/user-manager";
import prisma from "@/lib/db/prisma";

const mocks = vi.hoisted(() => ({ listAuthUsers: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/user-manager", () => ({ default: vi.fn() }));
vi.mock("@/lib/auth/supabase-admin", () => ({
  default: vi.fn(() => ({ auth: { admin: { listUsers: mocks.listAuthUsers } } })),
}));
vi.mock("@/lib/db/prisma", () => ({
  default: {
    profile: { findMany: vi.fn() },
    technician: { findMany: vi.fn() },
  },
}));

describe("listUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUserManager).mockResolvedValue({
      tenantId: "tenant-1",
      managedRole: "technician",
    } as never);
    vi.mocked(prisma.profile.findMany).mockResolvedValue([]);
    vi.mocked(prisma.technician.findMany).mockResolvedValue([]);
    mocks.listAuthUsers.mockResolvedValue({ data: { users: [] }, error: null });
  });

  it("consulta solamente el rol administrable dentro de la empresa", async () => {
    await listUsers();

    expect(prisma.profile.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: "tenant-1", role: "technician" },
    }));
  });

  it("lista tecnicos activos con telefono y sin acceso", async () => {
    await listAvailableTechnicians();

    expect(prisma.technician.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: "tenant-1",
        isActive: true,
        phone: { not: null },
        userId: null,
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true },
    });
  });
});
