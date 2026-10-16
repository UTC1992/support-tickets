import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TicketManager from "@/features/tickets/components/TicketManager";

vi.mock("@/features/tickets/services/ticket-api-service", () => ({
  createTicketRequest: vi.fn(),
  deleteTicketRequest: vi.fn(),
  getTicketExportUrl: vi.fn(() => "/api/tickets/export"),
  listTicketsRequest: vi.fn(),
  updateTicketRequest: vi.fn(),
}));

const ticket = {
  id: "ticket-1",
  clientName: "Cliente de prueba",
  clientPhone: null,
  clientIp: null,
  address: null,
  sectorId: null,
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
  sector: null,
  supportType: null,
  technician: null,
};

const catalogs = {
  sectors: [{ id: "sector-1", name: "Centro" }],
  supportTypes: [],
  technicians: [],
};
const initialData = {
  tickets: [ticket],
  pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
};

const renderTicketManager = (canDelete: boolean) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { staleTime: Infinity },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TicketManager initialData={initialData} catalogs={catalogs} canDelete={canDelete} />
    </QueryClientProvider>,
  );
};

describe("TicketManager", () => {
  it("oculta la eliminacion cuando el usuario no tiene permiso", () => {
    renderTicketManager(false);

    expect(screen.getByRole("button", { name: /editar soporte/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /eliminar soporte/i })).not.toBeInTheDocument();
  });

  it("permite exportar y consultar todos los datos del soporte", () => {
    renderTicketManager(false);

    expect(screen.getByRole("link", { name: /excel/i })).toHaveAttribute(
      "href",
      "/api/tickets/export",
    );

    fireEvent.click(screen.getByRole("button", { name: /ver soporte/i }));

    expect(screen.getByText("Detalle completo del soporte")).toBeInTheDocument();
    expect(screen.getByText("Fecha de finalización")).toBeInTheDocument();
    expect(screen.getByText("Notas del técnico")).toBeInTheDocument();
    expect(screen.getByText("Resultado")).toBeInTheDocument();
  });

  it("solicita direccion y sector al crear un soporte", () => {
    renderTicketManager(false);

    fireEvent.click(screen.getByRole("button", { name: /nuevo/i }));

    const form = within(screen.getByRole("dialog"));
    expect(form.getByLabelText("Dirección")).toBeInTheDocument();
    expect(form.getByLabelText("Sector")).toBeInTheDocument();
    expect(form.queryByLabelText("Zona")).not.toBeInTheDocument();
    expect(form.getByRole("option", { name: "Centro" })).toBeInTheDocument();
  });
});
