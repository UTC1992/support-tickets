import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TechnicianTicketManager from "@/features/tickets/components/TechnicianTicketManager";
import { updateTechnicianTicketRequest } from "@/features/tickets/services/technician-ticket-api-service";

vi.mock("@/features/tickets/services/technician-ticket-api-service", () => ({
  listTechnicianTicketsRequest: vi.fn(),
  updateTechnicianTicketRequest: vi.fn().mockResolvedValue({}),
}));

const ticket = {
  id: "ticket-1",
  clientName: "Cliente asignado",
  clientPhone: "0999999999",
  clientIp: "10.0.0.1",
  sector: "Centro",
  zoneId: "zone-1",
  supportTypeId: "support-1",
  technicianId: "technician-1",
  status: "assigned",
  priority: "high",
  intakeDate: "2026-10-14T00:00:00.000Z",
  scheduledAt: "2026-10-14T15:00:00.000Z",
  completedAt: null,
  observation: "Sin servicio",
  technicianNotes: null,
  resultNotes: null,
  zone: { id: "zone-1", name: "Centro" },
  supportType: { id: "support-1", name: "Revision" },
  technician: { id: "technician-1", name: "Tecnico" },
};

const renderManager = () => {
  vi.mocked(updateTechnicianTicketRequest).mockResolvedValue({
    ...ticket,
    status: "in_progress",
  });
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { staleTime: Infinity } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TechnicianTicketManager initialData={{
        tickets: [ticket],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }} />
    </QueryClientProvider>,
  );
};

describe("TechnicianTicketManager", () => {
  it("muestra los datos operativos y permite iniciar el soporte", async () => {
    renderManager();

    expect(screen.getByText("Cliente asignado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /llamar/i })).toHaveAttribute("href", "tel:0999999999");
    fireEvent.click(screen.getByRole("button", { name: /iniciar atención/i }));

    await waitFor(() => {
      expect(updateTechnicianTicketRequest).toHaveBeenCalledWith("ticket-1", {
        status: "in_progress",
      });
    });
  });

  it("abre un formulario limitado a la resolucion tecnica", () => {
    renderManager();

    fireEvent.click(screen.getByRole("button", { name: /registrar resultado/i }));

    expect(screen.getByRole("heading", { name: /actualizar soporte/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Estado")).toBeInTheDocument();
    expect(screen.getByLabelText("Notas tecnicas")).toBeInTheDocument();
    expect(screen.getByLabelText("Resultado")).toBeInTheDocument();
    expect(screen.queryByLabelText("Cliente")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Técnico")).not.toBeInTheDocument();
  });
});
