import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SetPasswordForm from "@/features/auth/components/SetPasswordForm";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
  signOut: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mocks.refresh,
    replace: mocks.replace,
  }),
}));
vi.mock("@/lib/auth/supabase-browser", () => ({
  default: () => ({
    auth: {
      signOut: mocks.signOut,
      updateUser: mocks.updateUser,
    },
  }),
}));

const submitPassword = () => {
  fireEvent.change(screen.getByLabelText("Contraseña"), {
    target: { value: "NuevaClave123" },
  });
  fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
    target: { value: "NuevaClave123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Guardar contraseña" }));
};

describe("SetPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantiene la sesion y navega al inicio despues de cambiar la contrasena", async () => {
    mocks.updateUser.mockResolvedValue({ error: null });
    render(<SetPasswordForm />);

    submitPassword();

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/"));
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("recupera el formulario cuando Supabase rechaza la peticion", async () => {
    mocks.updateUser.mockRejectedValue(new Error("network error"));
    render(<SetPasswordForm />);

    submitPassword();

    expect(await screen.findByText("No se pudo cambiar la contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar contraseña" })).toBeEnabled();
  });
});
