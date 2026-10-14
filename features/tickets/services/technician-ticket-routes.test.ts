import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/technician/tickets/route";
import { PATCH } from "@/app/api/technician/tickets/[id]/route";

const mocks = vi.hoisted(() => ({
  assertTechnician: vi.fn(),
  listTechnicianTickets: vi.fn(),
  updateTechnicianTicket: vi.fn(),
}));

vi.mock("@/lib/auth/technician", () => ({
  assertTechnician: mocks.assertTechnician,
  TechnicianAccessError: class TechnicianAccessError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock("@/lib/services/tickets", () => ({
  listTechnicianTickets: mocks.listTechnicianTickets,
  updateTechnicianTicket: mocks.updateTechnicianTicket,
}));

describe("rutas de soportes del tecnico", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assertTechnician.mockResolvedValue({
      profile: { id: "user-1" },
      technician: { id: "technician-1" },
    });
    mocks.listTechnicianTickets.mockResolvedValue({
      tickets: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    mocks.updateTechnicianTicket.mockResolvedValue({ id: "ticket-1" });
  });

  it("lista exclusivamente los soportes del tecnico autenticado", async () => {
    await GET(new Request("http://localhost/api/technician/tickets?status=assigned&technicianId=otro"));

    expect(mocks.listTechnicianTickets).toHaveBeenCalledWith(
      "technician-1",
      expect.objectContaining({ status: "assigned" }),
    );
  });

  it("actualiza el soporte usando la identidad del tecnico autenticado", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/technician/tickets/ticket-1", {
        method: "PATCH",
        body: JSON.stringify({ status: "in_progress" }),
      }),
      { params: Promise.resolve({ id: "ticket-1" }) },
    );

    expect(mocks.updateTechnicianTicket).toHaveBeenCalledWith(
      "ticket-1",
      "technician-1",
      "user-1",
      { status: "in_progress" },
    );
    expect(response.status).toBe(200);
  });
});
