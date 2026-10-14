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

const phoneUser = {
  id: "technician-1",
  email: null,
  phone: "+593999999999",
  fullName: "Tecnico Uno",
  role: "technician" as const,
  isActive: true,
  createdAt: "2026-10-14T00:00:00.000Z",
};

const renderPhoneUserManager = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <UserManager initialUsers={[phoneUser]} currentUserId="admin-1" />
    </QueryClientProvider>,
  );
};

describe("UserManager", () => {
  it("solicita una contrasena temporal al crear un usuario con correo", () => {
    renderUserManager();

    fireEvent.click(screen.getByRole("button", { name: "Crear usuario" }));

    expect(screen.getByLabelText("Correo")).toBeRequired();
    expect(screen.getByLabelText("Contraseña temporal")).toBeRequired();
    expect(screen.getByLabelText("Rol")).toBeInTheDocument();
  });

  it("permite editar y normaliza el telefono de acceso", () => {
    renderPhoneUserManager();

    expect(screen.getByText(/0999999999/)).toBeInTheDocument();
    expect(screen.queryByText(/\+593999999999/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Editar Tecnico Uno" }));
    const phone = screen.getByLabelText("Teléfono");
    fireEvent.change(phone, { target: { value: " 098 765-4321 " } });
    fireEvent.blur(phone);

    expect(phone).toHaveValue("0987654321");
  });
});
