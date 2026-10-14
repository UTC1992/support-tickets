import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TicketManager from "@/features/tickets/components/TicketManager";

vi.mock("@/features/tickets/services/ticket-api-service", () => ({
  createTicketRequest: vi.fn(),
  deleteTicketRequest: vi.fn(),
  updateTicketRequest: vi.fn(),
}));

const ticket = {
  id: "ticket-1",
  clientName: "Cliente de prueba",
  clientPhone: null,
  clientIp: null,
  sector: null,
  zoneId: null,
  supportTypeId: null,
  technicianId: null,
  status: "pending",
  priority: "normal",
  intakeDate: "2026-10-14T00:00:00.000Z",
  scheduledAt: null,
  completedAt: null,
  observation: null,
  technicianNotes: null,
  resultNotes: null,
  zone: null,
  supportType: null,
  technician: null,
};

const catalogs = { zones: [], supportTypes: [], technicians: [] };

describe("TicketManager", () => {
  it("oculta la eliminacion cuando el usuario no tiene permiso", () => {
    render(<TicketManager initialTickets={[ticket]} catalogs={catalogs} canDelete={false} />);

    expect(screen.getByRole("button", { name: /editar soporte/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /eliminar soporte/i })).not.toBeInTheDocument();
  });
});
