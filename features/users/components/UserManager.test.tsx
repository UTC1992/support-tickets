import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UserManager from "@/features/users/components/UserManager";
import { resetUserPasswordRequest } from "@/lib/services/admin-resource-api-service";

vi.mock("@/lib/services/admin-resource-api-service", () => ({
  createAdminResourceRequest: vi.fn(),
  deleteAdminResourceRequest: vi.fn(),
  resetUserPasswordRequest: vi.fn(),
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

  it("permite asignar una nueva contrasena temporal", async () => {
    vi.mocked(resetUserPasswordRequest).mockResolvedValue(undefined);
    renderPhoneUserManager();

    fireEvent.click(screen.getByRole("button", {
      name: "Restablecer contraseña de Tecnico Uno",
    }));
    fireEvent.change(screen.getByLabelText("Nueva contraseña temporal"), {
      target: { value: "Temporal456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Restablecer contraseña" }));

    await waitFor(() => {
      expect(resetUserPasswordRequest).toHaveBeenCalledWith(
        "technician-1",
        "Temporal456",
      );
    });
    expect(await screen.findByText("Contraseña restablecida correctamente.")).toBeInTheDocument();
  });
});
