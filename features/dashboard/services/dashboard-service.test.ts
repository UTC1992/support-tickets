import { beforeEach, describe, expect, it, vi } from "vitest";
import requireDashboardAccess from "@/lib/auth/dashboard";
import prisma from "@/lib/db/prisma";
import getDashboardSummary from "@/features/dashboard/services/dashboard-service";

vi.mock("@/lib/auth/dashboard", () => ({ default: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({
  default: {
    ticket: {
      count: vi.fn(),
    },
  },
}));

describe("getDashboardSummary", () => {
  beforeEach(() => {
    vi.mocked(requireDashboardAccess).mockReset();
    vi.mocked(requireDashboardAccess).mockResolvedValue({ tenantId: "tenant-1" } as never);
    vi.mocked(prisma.ticket.count).mockReset();
  });

  it("limita el resumen al tenant del owner o administrador", async () => {
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
    expect(requireDashboardAccess).toHaveBeenCalledOnce();
    expect(prisma.ticket.count).toHaveBeenNthCalledWith(1, {
      where: { tenantId: "tenant-1" },
    });
    expect(vi.mocked(requireDashboardAccess).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(prisma.ticket.count).mock.invocationCallOrder[0],
    );
  });
});
