import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/db/prisma";
import { updateTechnicianTicket } from "@/lib/services/tickets";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  historyCreate: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  default: {
    $transaction: vi.fn(async (callback) => callback({
      ticket: {
        findFirst: mocks.findFirst,
        update: mocks.update,
      },
      ticketHistory: { create: mocks.historyCreate },
    })),
  },
}));

describe("updateTechnicianTicket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findFirst.mockResolvedValue({
      id: "ticket-1",
      status: "assigned",
      technicianId: "technician-1",
    });
    mocks.update.mockResolvedValue({
      id: "ticket-1",
      status: "in_progress",
      sector: null,
      supportType: null,
      technician: { id: "technician-1", name: "Tecnico" },
    });
  });

  it("permite iniciar solo un soporte asignado al tecnico", async () => {
    await updateTechnicianTicket(
      "ticket-1",
      "tenant-1",
      "technician-1",
      "user-1",
      { status: "in_progress", clientName: "No debe cambiar" },
    );

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { id: "ticket-1", tenantId: "tenant-1", technicianId: "technician-1" },
    });
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "in_progress" }),
      where: { id: "ticket-1", tenantId: "tenant-1", technicianId: "technician-1" },
    }));
    expect(mocks.historyCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tenantId: "tenant-1", actorId: "user-1", eventType: "technician_updated" }),
    }));
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });

  it("rechaza actualizar un soporte que no pertenece al tecnico", async () => {
    mocks.findFirst.mockResolvedValue(null);

    await expect(updateTechnicianTicket(
      "ticket-2",
      "tenant-1",
      "technician-1",
      "user-1",
      { status: "in_progress" },
    )).rejects.toThrow("Assigned ticket not found");

    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("exige resultado al completar un soporte", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "ticket-1",
      status: "in_progress",
      technicianId: "technician-1",
    });

    await expect(updateTechnicianTicket(
      "ticket-1",
      "tenant-1",
      "technician-1",
      "user-1",
      { status: "completed", resultNotes: "" },
    )).rejects.toThrow("resultNotes is required");
  });

  it("exige una nueva fecha al reprogramar", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "ticket-1",
      status: "in_progress",
      technicianId: "technician-1",
    });

    await expect(updateTechnicianTicket(
      "ticket-1",
      "tenant-1",
      "technician-1",
      "user-1",
      { status: "rescheduled", resultNotes: "Cliente ausente" },
    )).rejects.toThrow("scheduledAt is required");
  });
});
