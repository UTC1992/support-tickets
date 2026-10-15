import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CatalogManager from "@/features/catalogs/components/CatalogManager";

vi.mock("@/lib/services/admin-resource-api-service", () => ({
  createAdminResourceRequest: vi.fn(),
  deleteAdminResourceRequest: vi.fn(),
  updateAdminResourceRequest: vi.fn(),
}));

describe("CatalogManager", () => {
  it("solicita solamente el nombre al crear un tipo de soporte", () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CatalogManager
          initialItems={[]}
          resource="support-types"
          itemLabel="tipo"
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Anadir tipo" }));

    expect(screen.getByLabelText("Nombre")).toBeRequired();
    expect(screen.queryByLabelText("Grupo para Excel")).not.toBeInTheDocument();
  });
});
