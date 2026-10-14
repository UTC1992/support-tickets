import { beforeEach, describe, expect, it, vi } from "vitest";
import createSupabaseAdminClient from "@/lib/auth/supabase-admin";
import prisma from "@/lib/db/prisma";
import { createUser } from "@/features/users/services/user-resource-service";

const mocks = vi.hoisted(() => ({
  assertAdmin: vi.fn(),
  createAuthUser: vi.fn(),
  createProfile: vi.fn(),
  deleteAuthUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/admin", () => ({ assertAdmin: mocks.assertAdmin }));
vi.mock("@/lib/auth/supabase-admin", () => ({
  default: vi.fn(() => ({
    auth: {
      admin: {
        createUser: mocks.createAuthUser,
        deleteUser: mocks.deleteAuthUser,
      },
    },
  })),
}));
vi.mock("@/lib/db/prisma", () => ({
  default: {
    technician: { findFirst: vi.fn() },
    $transaction: vi.fn(async (callback) => callback({
      profile: { create: mocks.createProfile },
      technician: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    })),
  },
}));

describe("createUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAuthUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mocks.createProfile.mockResolvedValue({
      id: "user-1",
      fullName: "Usuario Oficina",
      role: "office",
      isActive: true,
    });
  });

  it("crea usuarios de correo con contrasena temporal sin invitacion", async () => {
    await createUser({
      authMethod: "email",
      email: "USUARIO@EXAMPLE.COM",
      fullName: "Usuario Oficina",
      password: "Temporal123",
      role: "office",
    });

    expect(createSupabaseAdminClient).toHaveBeenCalledOnce();
    expect(mocks.createAuthUser).toHaveBeenCalledWith({
      email: "usuario@example.com",
      email_confirm: true,
      password: "Temporal123",
      user_metadata: {
        full_name: "Usuario Oficina",
        must_change_password: true,
        role: "office",
      },
    });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });
});
