import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as GET_CATALOGS } from "@/app/api/catalogs/route";
import { GET as GET_TICKET_EXPORT } from "@/app/api/tickets/export/route";
import { GET as GET_TICKETS, POST as POST_TICKET } from "@/app/api/tickets/route";
import { GET as GET_TICKET, PATCH as PATCH_TICKET } from "@/app/api/tickets/[id]/route";
import { assertBackOffice } from "@/lib/auth/back-office";

const mocks = vi.hoisted(() => ({
  assertBackOffice: vi.fn(),
  createTicket: vi.fn(),
  getTicket: vi.fn(),
  listCatalogs: vi.fn(),
  listTickets: vi.fn(),
  listTicketsForExport: vi.fn(),
  updateTicket: vi.fn(),
}));

vi.mock("@/lib/auth/back-office", () => ({
  assertBackOffice: mocks.assertBackOffice,
  BackOfficeAccessError: class BackOfficeAccessError extends Error {
    status = 403;
  },
}));
vi.mock("@/lib/auth/admin", () => ({
  assertAdmin: vi.fn(),
  AdminAccessError: class AdminAccessError extends Error {
    status = 403;
  },
}));
vi.mock("@/lib/auth/session", () => ({
  requireUser: vi.fn(),
  UnauthorizedError: class UnauthorizedError extends Error {},
}));
vi.mock("@/lib/services/catalogs", () => ({ default: mocks.listCatalogs }));
vi.mock("@/lib/services/tickets", () => ({
  createTicket: mocks.createTicket,
  deleteTicket: vi.fn(),
  getTicket: mocks.getTicket,
  listTickets: mocks.listTickets,
  listTicketsForExport: mocks.listTicketsForExport,
  updateTicket: mocks.updateTicket,
}));
vi.mock("@/features/tickets/services/ticket-export-service", () => ({
  default: vi.fn().mockResolvedValue(Buffer.from("workbook")),
}));

describe("rutas operativas de soportes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listCatalogs.mockResolvedValue({ zones: [], supportTypes: [], technicians: [] });
    mocks.listTickets.mockResolvedValue([]);
    mocks.listTicketsForExport.mockResolvedValue([]);
    mocks.createTicket.mockResolvedValue({ id: "ticket-1" });
    mocks.getTicket.mockResolvedValue({ id: "ticket-1" });
    mocks.updateTicket.mockResolvedValue({ id: "ticket-1" });
  });

  it("protege el listado de catalogos", async () => {
    await GET_CATALOGS();
    expect(assertBackOffice).toHaveBeenCalledOnce();
  });

  it("protege el listado y la creacion de tickets", async () => {
    await GET_TICKETS(new Request("http://localhost/api/tickets"));
    await POST_TICKET(new Request("http://localhost/api/tickets", {
      method: "POST",
      body: JSON.stringify({ clientName: "Cliente" }),
    }));

    expect(assertBackOffice).toHaveBeenCalledTimes(2);
  });

  it("protege la exportacion de tickets", async () => {
    const response = await GET_TICKET_EXPORT(new Request("http://localhost/api/tickets/export?status=completed"));

    expect(assertBackOffice).toHaveBeenCalledOnce();
    expect(response.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(response.headers.get("content-disposition")).toMatch(
      /^attachment; filename="soportes-exitcomp-\d{4}-\d{2}-\d{2}\.xlsx"$/,
    );
  });

  it("protege la consulta y edicion individual de tickets", async () => {
    const context = { params: Promise.resolve({ id: "ticket-1" }) };
    await GET_TICKET(new Request("http://localhost/api/tickets/ticket-1"), context);
    await PATCH_TICKET(new Request("http://localhost/api/tickets/ticket-1", {
      method: "PATCH",
      body: JSON.stringify({ status: "assigned" }),
    }), context);

    expect(assertBackOffice).toHaveBeenCalledTimes(2);
  });
});
