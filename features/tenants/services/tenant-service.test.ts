import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTenant, listTenants, updateTenant } from "@/features/tenants/services/tenant-service";
import { assertPlatformAdmin } from "@/lib/auth/platform-admin";
import prisma from "@/lib/db/prisma";

const mocks = vi.hoisted(() => ({
  createAuthUser: vi.fn(),
  deleteAuthUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/platform-admin", () => ({ assertPlatformAdmin: vi.fn() }));
vi.mock("@/lib/auth/supabase-admin", () => ({
  default: vi.fn(() => ({
    auth: { admin: { createUser: mocks.createAuthUser, deleteUser: mocks.deleteAuthUser } },
  })),
}));
vi.mock("@/lib/db/prisma", () => ({
  default: {
    tenant: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("tenant service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertPlatformAdmin).mockResolvedValue({ userId: "platform-1", isActive: true });
    vi.mocked(prisma.tenant.findMany).mockResolvedValue([]);
    mocks.createAuthUser.mockResolvedValue({
      data: { user: { id: "owner-1" } },
      error: null,
    });
    vi.mocked(prisma.tenant.create).mockResolvedValue({ id: "tenant-1" } as never);
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({ id: "tenant-1" } as never);
    vi.mocked(prisma.tenant.update).mockResolvedValue({ id: "tenant-1" } as never);
  });

  it("protege el listado con la identidad global", async () => {
    await listTenants();
    expect(assertPlatformAdmin).toHaveBeenCalledOnce();
  });

  it("crea la empresa y su propietario inicial", async () => {
    await createTenant({
      name: "Empresa Uno",
      slug: "empresa-uno",
      ownerName: "Propietario Uno",
      ownerEmail: "OWNER@EXAMPLE.COM",
      password: "Temporal123",
    });

    expect(mocks.createAuthUser).toHaveBeenCalledWith(expect.objectContaining({
      email: "owner@example.com",
      user_metadata: expect.objectContaining({ role: "owner" }),
    }));
    expect(prisma.tenant.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        name: "Empresa Uno",
        slug: "empresa-uno",
        profiles: {
          create: expect.objectContaining({ id: "owner-1", role: "owner" }),
        },
      }),
    }));
  });

  it("actualiza el nombre de una empresa", async () => {
    await updateTenant("tenant-1", {
      name: "Exitcomp Telecom",
    });

    expect(prisma.tenant.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "tenant-1" },
      data: {
        name: "Exitcomp Telecom",
      },
    }));
  });

  it("rechaza modificar el identificador", async () => {
    await expect(updateTenant("tenant-1", {
      slug: "exitcomp-telecom",
    })).rejects.toThrow("El identificador de la empresa no se puede modificar");

    expect(prisma.tenant.update).not.toHaveBeenCalled();
  });
});
