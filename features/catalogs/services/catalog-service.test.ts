import { describe, expect, it, vi } from "vitest";
import { listTechnicians } from "@/features/catalogs/services/catalog-service";
import prisma from "@/lib/db/prisma";

vi.mock("@/lib/auth/admin", () => ({ default: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({
  default: {
    technician: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

describe("listTechnicians", () => {
  it("lista solamente técnicos activos", async () => {
    await listTechnicians();

    expect(prisma.technician.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { isActive: true },
    }));
  });
});
