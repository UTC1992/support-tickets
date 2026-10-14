import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OfficeShell from "@/features/navigation/components/OfficeShell";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname }));

describe("OfficeShell", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/office");
  });

  it("muestra solo la navegacion operativa de oficina", () => {
    render(<OfficeShell userName="Maria Oficina"><p>Contenido</p></OfficeShell>);

    expect(screen.getByText("Maria Oficina")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /inicio/i })).toHaveAttribute("href", "/office");
    expect(screen.getByRole("link", { name: /soportes/i })).toHaveAttribute("href", "/office/tickets");
    expect(screen.queryByRole("link", { name: /usuarios/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /zonas/i })).not.toBeInTheDocument();
    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });
});
