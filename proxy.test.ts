import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import proxy from "@/proxy";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
}));

vi.mock("@/lib/auth/supabase-proxy", () => ({
  default: () => ({
    getResponse: () => NextResponse.next(),
    supabase: { auth: { getUser: mocks.getUser } },
  }),
}));

const requestPasswordPage = () => proxy(
  new NextRequest("http://localhost/set-password"),
);

describe("proxy de cambio de contrasena", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envia al inicio cuando el cambio obligatorio ya termino", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { user_metadata: { must_change_password: false } } },
    });

    const response = await requestPasswordPage();

    expect(response.headers.get("location")).toBe("http://localhost/");
  });

  it("envia al login cuando no existe una sesion", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const response = await requestPasswordPage();

    expect(response.headers.get("location")).toBe("http://localhost/login");
  });
});
