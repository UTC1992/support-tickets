import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UserManager from "@/features/users/components/UserManager";
import {
  createAdminResourceRequest,
  resetUserPasswordRequest,
} from "@/lib/services/admin-resource-api-service";

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
      <UserManager initialUsers={[]} currentUserId="owner-1" managedRole="admin" />
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
      <UserManager initialUsers={[phoneUser]} currentUserId="admin-1" managedRole="technician" />
    </QueryClientProvider>,
  );
};

const availableTechnician = {
  id: "catalog-technician-1",
  name: "Técnico Disponible",
  phone: "+593987654321",
};

const renderTechnicianAccessManager = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <UserManager
        initialUsers={[]}
        currentUserId="admin-1"
        managedRole="technician"
        availableTechnicians={[availableTechnician]}
      />
    </QueryClientProvider>,
  );
};

describe("UserManager", () => {
  it("solicita una contrasena temporal al crear un usuario con correo", () => {
    renderUserManager();

    fireEvent.click(screen.getByRole("button", { name: "Crear administrador" }));

    expect(screen.getByLabelText("Correo")).toBeRequired();
    expect(screen.getByLabelText("Contraseña temporal")).toBeRequired();
    expect(screen.getByText("Rol: Administrador.")).toBeInTheDocument();
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

  it("crea el acceso seleccionando un tecnico existente", async () => {
    vi.mocked(createAdminResourceRequest).mockResolvedValue({
      ...phoneUser,
      id: "user-2",
      fullName: availableTechnician.name,
      phone: availableTechnician.phone,
    });
    renderTechnicianAccessManager();

    fireEvent.click(screen.getByRole("button", { name: "Crear acceso" }));

    expect(screen.getByRole("option", {
      name: "Técnico Disponible - 0987654321",
    })).toBeInTheDocument();
    expect(screen.queryByLabelText("Nombre completo")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Teléfono")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Técnico"), {
      target: { value: availableTechnician.id },
    });
    fireEvent.change(screen.getByLabelText("Contraseña temporal"), {
      target: { value: "Temporal123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(createAdminResourceRequest).toHaveBeenCalledWith("profiles", expect.objectContaining({
        technicianId: availableTechnician.id,
        password: "Temporal123",
        role: "technician",
      }));
    });
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
