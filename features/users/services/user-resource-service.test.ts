import { beforeEach, describe, expect, it, vi } from "vitest";
import createSupabaseAdminClient from "@/lib/auth/supabase-admin";
import prisma from "@/lib/db/prisma";
import {
  createUser,
  deleteUser,
  resetUserPassword,
  updateUser,
} from "@/features/users/services/user-resource-service";

const mocks = vi.hoisted(() => ({
  assertUserManager: vi.fn(),
  createAuthUser: vi.fn(),
  createProfile: vi.fn(),
  createTechnician: vi.fn(),
  deleteAuthUser: vi.fn(),
  findTechnician: vi.fn(),
  findTechnicianByUser: vi.fn(),
  findProfile: vi.fn(),
  getAuthUser: vi.fn(),
  updateAuthUser: vi.fn(),
  updateProfile: vi.fn(),
  updateTechnician: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/user-manager", () => ({ assertUserManager: mocks.assertUserManager }));
vi.mock("@/lib/auth/supabase-admin", () => ({
  default: vi.fn(() => ({
    auth: {
      admin: {
        createUser: mocks.createAuthUser,
        deleteUser: mocks.deleteAuthUser,
        getUserById: mocks.getAuthUser,
        updateUserById: mocks.updateAuthUser,
      },
    },
  })),
}));
vi.mock("@/lib/db/prisma", () => ({
  default: {
    profile: { findFirst: mocks.findProfile },
    technician: {
      findMany: vi.fn(),
      findFirst: mocks.findTechnician,
      update: mocks.updateTechnician,
    },
    $transaction: vi.fn(async (callback) => callback({
      profile: {
        create: mocks.createProfile,
        update: mocks.updateProfile,
      },
      technician: {
        create: mocks.createTechnician,
        findFirst: mocks.findTechnicianByUser,
        update: mocks.updateTechnician,
      },
    })),
  },
}));

describe("user resource service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.assertUserManager.mockResolvedValue({
      id: "owner-1",
      tenantId: "tenant-1",
      role: "owner",
      managedRole: "admin",
    });
    mocks.findProfile.mockResolvedValue({ id: "user-1" });
    mocks.createAuthUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mocks.createProfile.mockResolvedValue({
      id: "user-1",
      fullName: "Usuario Administrador",
      role: "admin",
      isActive: true,
    });
    vi.mocked(prisma.technician.findMany).mockResolvedValue([]);
    mocks.getAuthUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: null,
          phone: "+593999999999",
          user_metadata: { role: "technician" },
        },
      },
      error: null,
    });
    mocks.updateAuthUser.mockResolvedValue({
      data: { user: { id: "user-1", phone: "+593987654321" } },
      error: null,
    });
    mocks.updateProfile.mockResolvedValue({
      id: "user-1",
      fullName: "Tecnico Uno",
      role: "technician",
      isActive: true,
    });
    mocks.findTechnicianByUser.mockResolvedValue({
      id: "technician-1",
      userId: "user-1",
      phone: "+593999999999",
    });
    mocks.deleteAuthUser.mockResolvedValue({ error: null });
    mocks.findTechnician.mockResolvedValue(null);
  });

  it("permite al propietario crear administradores por correo", async () => {
    await createUser({
      authMethod: "email",
      email: "USUARIO@EXAMPLE.COM",
      fullName: "Usuario Administrador",
      password: "Temporal123",
      role: "admin",
    });

    expect(createSupabaseAdminClient).toHaveBeenCalledOnce();
    expect(mocks.createAuthUser).toHaveBeenCalledWith({
      email: "usuario@example.com",
      email_confirm: true,
      password: "Temporal123",
      user_metadata: {
        auth_method: "email",
        full_name: "Usuario Administrador",
        must_change_password: true,
        role: "admin",
      },
    });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });

  it("crea el acceso con los datos del tecnico seleccionado", async () => {
    mocks.assertUserManager.mockResolvedValue({
      id: "admin-1",
      tenantId: "tenant-1",
      role: "admin",
      managedRole: "technician",
    });
    mocks.createProfile.mockResolvedValue({
      id: "user-1",
      fullName: "Tecnico Uno",
      role: "technician",
      isActive: true,
    });
    mocks.findTechnician.mockResolvedValue({
      id: "technician-1",
      tenantId: "tenant-1",
      userId: null,
      phone: "+593999999999",
      name: "Tecnico Uno",
      isActive: true,
    });

    await createUser({
      authMethod: "phone",
      password: "Temporal123",
      technicianId: "technician-1",
    });

    expect(mocks.createAuthUser).toHaveBeenCalledWith(expect.objectContaining({
      email: "593999999999@phone.exitcomp.app",
      email_confirm: true,
      user_metadata: expect.objectContaining({
        auth_method: "phone",
        login_phone: "+593999999999",
        full_name: "Tecnico Uno",
      }),
    }));
    expect(mocks.updateTechnician).toHaveBeenCalledWith({
      where: { id: "technician-1", tenantId: "tenant-1" },
      data: { userId: "user-1" },
    });
  });

  it("rechaza un tecnico que no esta disponible en la empresa", async () => {
    mocks.assertUserManager.mockResolvedValue({
      id: "admin-1",
      tenantId: "tenant-1",
      role: "admin",
      managedRole: "technician",
    });

    await expect(createUser({
      authMethod: "phone",
      password: "Temporal123",
      technicianId: "technician-from-another-tenant",
    })).rejects.toThrow("El técnico seleccionado no está disponible");

    expect(mocks.createAuthUser).not.toHaveBeenCalled();
  });

  it("actualiza el telefono en Supabase y en el tecnico asociado", async () => {
    mocks.assertUserManager.mockResolvedValue({
      id: "admin-1",
      tenantId: "tenant-1",
      role: "admin",
      managedRole: "technician",
    });
    await updateUser("user-1", { phone: "098 765-4321" });

    expect(mocks.updateAuthUser).toHaveBeenCalledWith("user-1", expect.objectContaining({
      email: "593987654321@phone.exitcomp.app",
      email_confirm: true,
      user_metadata: expect.objectContaining({
        auth_method: "phone",
        login_phone: "+593987654321",
      }),
    }));
    expect(mocks.updateTechnician).toHaveBeenCalledWith({
      where: { id: "technician-1", tenantId: "tenant-1" },
      data: expect.objectContaining({ phone: "+593987654321" }),
    });
  });

  it("rechaza un telefono que ya pertenece a otro tecnico", async () => {
    mocks.assertUserManager.mockResolvedValue({ id: "admin-1", tenantId: "tenant-1", role: "admin", managedRole: "technician" });
    vi.mocked(prisma.technician.findMany).mockResolvedValue([{
      id: "technician-2",
      tenantId: "tenant-1",
      userId: "user-2",
      phone: "+593 98 765 4321",
      name: "Tecnico Dos",
      isActive: true,
      createdAt: new Date("2026-10-14T00:00:00.000Z"),
      updatedAt: new Date("2026-10-14T00:00:00.000Z"),
    }]);

    await expect(updateUser("user-1", {
      phone: "0987654321",
    })).rejects.toThrow("Ese teléfono ya está registrado");

    expect(mocks.updateAuthUser).not.toHaveBeenCalled();
  });

  it("ignora el telefono liberado de un tecnico inactivo", async () => {
    mocks.assertUserManager.mockResolvedValue({ id: "admin-1", tenantId: "tenant-1", role: "admin", managedRole: "technician" });
    vi.mocked(prisma.technician.findMany).mockResolvedValue([{
      id: "technician-deleted",
      tenantId: "tenant-1",
      userId: null,
      phone: "+593987654321",
      name: "Técnico eliminado",
      isActive: false,
      createdAt: new Date("2026-10-14T00:00:00.000Z"),
      updatedAt: new Date("2026-10-14T00:00:00.000Z"),
    }]);

    await updateUser("user-1", { phone: "0987654321" });

    expect(mocks.updateAuthUser).toHaveBeenCalledOnce();
  });

  it("libera el telefono del tecnico al eliminar fisicamente su usuario", async () => {
    mocks.assertUserManager.mockResolvedValue({ id: "admin-1", tenantId: "tenant-1", role: "admin", managedRole: "technician" });
    mocks.findTechnician.mockResolvedValue({ id: "technician-1" });

    await deleteUser("user-1");

    expect(mocks.deleteAuthUser).toHaveBeenCalledWith("user-1");
    expect(mocks.updateTechnician).toHaveBeenCalledWith({
      where: { id: "technician-1", tenantId: "tenant-1" },
      data: { isActive: false, phone: null },
    });
  });

  it("restablece la contrasena y obliga a cambiarla en el siguiente ingreso", async () => {
    mocks.assertUserManager.mockResolvedValue({ id: "admin-1", tenantId: "tenant-1", role: "admin", managedRole: "technician" });
    mocks.getAuthUser.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          user_metadata: {
            auth_method: "phone",
            full_name: "Técnico Uno",
            must_change_password: false,
          },
        },
      },
      error: null,
    });

    await resetUserPassword("user-1", { password: "Temporal456" });

    expect(mocks.assertUserManager).toHaveBeenCalledOnce();
    expect(mocks.updateAuthUser).toHaveBeenCalledWith("user-1", {
      password: "Temporal456",
      user_metadata: {
        auth_method: "phone",
        full_name: "Técnico Uno",
        must_change_password: true,
      },
    });
  });

  it("rechaza una contrasena temporal menor a ocho caracteres", async () => {
    mocks.assertUserManager.mockResolvedValue({ id: "admin-1", tenantId: "tenant-1", role: "admin", managedRole: "technician" });
    await expect(resetUserPassword("user-1", {
      password: "Corta1",
    })).rejects.toThrow("La contraseña temporal debe tener al menos 8 caracteres");

    expect(mocks.updateAuthUser).not.toHaveBeenCalled();
  });

  it("rechaza administrar un usuario de otra empresa", async () => {
    mocks.assertUserManager.mockResolvedValue({ id: "admin-1", tenantId: "tenant-1", role: "admin", managedRole: "technician" });
    mocks.findProfile.mockResolvedValue(null);

    await expect(updateUser("user-from-tenant-2", {
      fullName: "Usuario externo",
    })).rejects.toThrow("El usuario no existe");

    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });

  it("rechaza que el propietario cree un rol diferente a administrador", async () => {
    await expect(createUser({
      authMethod: "email",
      email: "tecnico@example.com",
      fullName: "Técnico",
      password: "Temporal123",
      role: "technician",
    })).rejects.toThrow("No puedes asignar ese rol");

    expect(mocks.createAuthUser).not.toHaveBeenCalled();
  });
});
