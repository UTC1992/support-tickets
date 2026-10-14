import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DashboardSummary from "@/features/dashboard/components/DashboardSummary";

describe("DashboardSummary", () => {
  it("presenta el resumen operativo y enlaza a los soportes", () => {
    render(
      <DashboardSummary
        summary={{ total: 12, open: 7, unassigned: 3, completed: 5 }}
        ticketsHref="/office/tickets"
        description="Estado operativo de los soportes."
      />,
    );

    expect(screen.getByRole("heading", { name: "Resumen" })).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toSatisfy((links: HTMLElement[]) =>
      links.every((link) => link.getAttribute("href") === "/office/tickets"),
    );
  });
});
