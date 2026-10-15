import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TenantManager from "@/features/tenants/components/TenantManager";
import { updateTenantRequest } from "@/features/tenants/services/tenant-api-service";

vi.mock("@/features/tenants/services/tenant-api-service", () => ({
  createTenantRequest: vi.fn(),
  updateTenantRequest: vi.fn(),
}));

const tenant = {
  id: "tenant-1",
  name: "Exitcomp",
  slug: "exitcomp",
  isActive: true,
  createdAt: "2026-10-15T00:00:00.000Z",
  _count: { profiles: 3, tickets: 10 },
};

describe("TenantManager", () => {
  it("desactiva una empresa y muestra el resultado", async () => {
    vi.mocked(updateTenantRequest).mockResolvedValue({ ...tenant, isActive: false });
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TenantManager initialTenants={[tenant]} />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Desactivar Exitcomp" }));

    await waitFor(() => {
      expect(updateTenantRequest).toHaveBeenCalledWith("tenant-1", { isActive: false });
    });
    expect(await screen.findByText("Exitcomp está inactiva.")).toBeInTheDocument();
    expect(screen.getByText(/Inactiva/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Activar Exitcomp" })).toBeInTheDocument();
  });

  it("edita solamente el nombre de una empresa", async () => {
    vi.mocked(updateTenantRequest).mockResolvedValue({
      ...tenant,
      name: "Exitcomp Telecom",
    });
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TenantManager initialTenants={[tenant]} />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Editar Exitcomp" }));
    fireEvent.change(screen.getByLabelText("Nombre de la empresa"), {
      target: { value: "Exitcomp Telecom" },
    });
    expect(screen.queryByLabelText("Identificador")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(updateTenantRequest).toHaveBeenCalledWith("tenant-1", {
        name: "Exitcomp Telecom",
      });
    });
    expect(await screen.findByText("Exitcomp Telecom se actualizó correctamente.")).toBeInTheDocument();
    expect(screen.getByText(/exitcomp/)).toBeInTheDocument();
  });
});
