import { beforeEach, describe, expect, it, vi } from "vitest";
import { signInWithPassword } from "@/features/auth/services/auth-service";

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
}));

vi.mock("@/lib/auth/supabase-browser", () => ({
  default: () => ({
    auth: { signInWithPassword: mocks.signInWithPassword },
  }),
}));

describe("signInWithPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("autentica el telefono sin caracteres de formato", async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: null });

    await signInWithPassword(" 099 999-9999 ", "Clave123");

    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "593999999999@phone.exitcomp.app",
      password: "Clave123",
    });
  });
});
