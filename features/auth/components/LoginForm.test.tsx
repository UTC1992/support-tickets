import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LoginForm from "@/features/auth/components/LoginForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/auth/services/auth-service", () => ({
  signInWithPassword: vi.fn(),
}));

describe("LoginForm", () => {
  it("quita el formato visual del telefono al salir del campo", () => {
    render(<LoginForm />);
    const identifier = screen.getByLabelText("Correo o teléfono");

    fireEvent.change(identifier, { target: { value: " 099 999-9999 " } });
    fireEvent.blur(identifier);

    expect(identifier).toHaveValue("0999999999");
  });

  it("permite mostrar y ocultar la contraseña", () => {
    render(<LoginForm />);
    const password = screen.getByLabelText("Contraseña");

    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(password).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByRole("button", { name: "Ocultar contraseña" }));
    expect(password).toHaveAttribute("type", "password");
  });
});
