import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/db/prisma";
import { listTechnicianTickets, listTickets } from "@/lib/services/tickets";

vi.mock("@/lib/db/prisma", () => ({
  default: {
    ticket: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("listTickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.ticket.findMany).mockResolvedValue([]);
    vi.mocked(prisma.ticket.count).mockResolvedValue(45);
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 45]);
  });

  it("devuelve una pagina y el total usando los filtros", async () => {
    const result = await listTickets("tenant-1", {
      limit: "20",
      page: "2",
      search: "cliente",
      status: "completed",
    });

    expect(prisma.ticket.findMany).toHaveBeenCalledWith(expect.objectContaining({
      include: {
        sector: true,
        supportType: true,
        technician: true,
      },
      skip: 20,
      take: 20,
      where: expect.objectContaining({
        tenantId: "tenant-1",
        status: "completed",
        OR: expect.arrayContaining([
          { address: { contains: "cliente", mode: "insensitive" } },
        ]),
      }),
    }));
    expect(result).toEqual({
      tickets: [],
      pagination: {
        page: 2,
        pageSize: 20,
        total: 45,
        totalPages: 3,
      },
    });
  });

  it("fuerza el tecnico autenticado aunque el cliente envie otro filtro", async () => {
    await listTechnicianTickets("tenant-1", "technician-authenticated", {
      technicianId: "technician-from-browser",
    });

    expect(prisma.ticket.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        tenantId: "tenant-1",
        technicianId: "technician-authenticated",
      }),
    }));
  });
});
