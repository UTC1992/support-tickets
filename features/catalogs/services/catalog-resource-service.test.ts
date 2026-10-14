import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCatalogResource,
  updateCatalogResource,
} from "@/features/catalogs/services/catalog-resource-service";
import prisma from "@/lib/db/prisma";

const mocks = vi.hoisted(() => ({
  createTechnician: vi.fn(),
  updateTechnician: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({ assertAdmin: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({
  default: {
    technician: {
      create: mocks.createTechnician,
      findMany: vi.fn(),
      update: mocks.updateTechnician,
    },
  },
}));

describe("catalog technician phones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.technician.findMany).mockResolvedValue([]);
  });

  it("guarda el telefono nacional sin espacios en formato interno", async () => {
    await createCatalogResource("technicians", {
      name: "Tecnico Uno",
      phone: " 099 999-9999 ",
    });

    expect(mocks.createTechnician).toHaveBeenCalledWith(expect.objectContaining({
      data: { name: "Tecnico Uno", phone: "+593999999999" },
    }));
  });

  it("rechaza un telefono repetido aunque tenga otro formato", async () => {
    vi.mocked(prisma.technician.findMany).mockResolvedValue([{
      id: "technician-1",
      userId: null,
      name: "Tecnico Uno",
      phone: "+593 99 999 9999",
      isActive: true,
      createdAt: new Date("2026-10-14T00:00:00.000Z"),
      updatedAt: new Date("2026-10-14T00:00:00.000Z"),
    }]);

    await expect(createCatalogResource("technicians", {
      name: "Tecnico Dos",
      phone: "0999999999",
    })).rejects.toThrow("Ese teléfono ya está registrado");
  });

  it("permite conservar el mismo telefono al editar su tecnico", async () => {
    vi.mocked(prisma.technician.findMany).mockResolvedValue([{
      id: "technician-1",
      userId: null,
      name: "Tecnico Uno",
      phone: "+593999999999",
      isActive: true,
      createdAt: new Date("2026-10-14T00:00:00.000Z"),
      updatedAt: new Date("2026-10-14T00:00:00.000Z"),
    }]);

    await updateCatalogResource("technicians", "technician-1", {
      name: "Tecnico Uno",
      phone: "0999999999",
    });

    expect(mocks.updateTechnician).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ phone: "+593999999999" }),
    }));
  });
});
