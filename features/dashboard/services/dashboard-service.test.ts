import { beforeEach, describe, expect, it, vi } from "vitest";
import requireBackOffice from "@/lib/auth/back-office";
import prisma from "@/lib/db/prisma";
import getDashboardSummary from "@/features/dashboard/services/dashboard-service";

vi.mock("@/lib/auth/back-office", () => ({ default: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({
  default: {
    ticket: {
      count: vi.fn(),
    },
  },
}));

describe("getDashboardSummary", () => {
  beforeEach(() => {
    vi.mocked(requireBackOffice).mockReset();
    vi.mocked(prisma.ticket.count).mockReset();
  });

  it("valida el acceso de oficina antes de consultar el resumen", async () => {
    vi.mocked(prisma.ticket.count)
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(5);

    await expect(getDashboardSummary()).resolves.toEqual({
      total: 12,
      open: 7,
      unassigned: 3,
      completed: 5,
    });
    expect(requireBackOffice).toHaveBeenCalledOnce();
    expect(vi.mocked(requireBackOffice).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(prisma.ticket.count).mock.invocationCallOrder[0],
    );
  });
});
