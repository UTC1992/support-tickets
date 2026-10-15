import { beforeEach, describe, expect, it, vi } from "vitest";
import { assertUserManager } from "@/lib/auth/user-manager";
import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({
  default: { profile: { findUnique: vi.fn() } },
}));

describe("assertUserManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1" } as never);
  });

  it.each([
    ["owner", "admin"],
    ["admin", "technician"],
  ] as const)("permite que %s administre solamente %s", async (role, managedRole) => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      id: "user-1",
      tenantId: "tenant-1",
      fullName: "Usuario",
      role,
      isActive: true,
      tenant: { name: "Empresa", isActive: true },
    } as never);

    await expect(assertUserManager()).resolves.toEqual(expect.objectContaining({
      tenantId: "tenant-1",
      managedRole,
    }));
  });

  it("rechaza al técnico aunque pertenezca a una empresa activa", async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      id: "user-1",
      tenantId: "tenant-1",
      fullName: "Técnico",
      role: "technician",
      isActive: true,
      tenant: { name: "Empresa", isActive: true },
    } as never);

    await expect(assertUserManager()).rejects.toMatchObject({
      status: 403,
    });
  });

  it("rechaza usuarios de empresas inactivas", async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      id: "user-1",
      tenantId: "tenant-1",
      fullName: "Administrador",
      role: "admin",
      isActive: true,
      tenant: { name: "Empresa", isActive: false },
    } as never);

    await expect(assertUserManager()).rejects.toMatchObject({
      status: 403,
    });
  });
});
