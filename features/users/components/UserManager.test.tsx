import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UserManager from "@/features/users/components/UserManager";

vi.mock("@/lib/services/admin-resource-api-service", () => ({
  createAdminResourceRequest: vi.fn(),
  deleteAdminResourceRequest: vi.fn(),
  updateAdminResourceRequest: vi.fn(),
}));

const renderUserManager = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <UserManager initialUsers={[]} currentUserId="admin-1" />
    </QueryClientProvider>,
  );
};

describe("UserManager", () => {
  it("solicita una contrasena temporal al crear un usuario con correo", () => {
    renderUserManager();

    fireEvent.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(screen.getByLabelText("Correo")).toBeRequired();
    expect(screen.getByLabelText("Contrasena temporal")).toBeRequired();
    expect(screen.getByLabelText("Rol")).toBeInTheDocument();
  });
});
