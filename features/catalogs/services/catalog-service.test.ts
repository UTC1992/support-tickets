import { describe, expect, it, vi } from "vitest";
import requireAdmin from "@/lib/auth/admin";
import {
  listSectors,
  listTechnicians,
} from "@/features/catalogs/services/catalog-service";
import prisma from "@/lib/db/prisma";

vi.mock("@/lib/auth/admin", () => ({ default: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({
  default: {
    sector: { findMany: vi.fn().mockResolvedValue([]) },
    technician: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

describe("listTechnicians", () => {
  it("lista solamente técnicos activos", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ tenantId: "tenant-1" } as never);
    await listTechnicians();

    expect(prisma.technician.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: "tenant-1", isActive: true },
    }));
  });

  it("lista los sectores de la empresa", async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ tenantId: "tenant-1" } as never);
    await listSectors();

    expect(prisma.sector.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: "tenant-1" },
    }));
  });
});
