import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import buildTicketWorkbook from "@/features/tickets/services/ticket-export-service";

const baseTicket = {
  id: "ticket-1",
  clientName: "Cliente Uno",
  clientPhone: "0999999999",
  clientIp: "10.0.0.1",
  sector: "Centro",
  status: "completed",
  priority: "normal",
  intakeDate: new Date("2026-10-14T00:00:00.000Z"),
  scheduledAt: null,
  completedAt: new Date("2026-10-14T15:00:00.000Z"),
  observation: "Sin internet",
  technicianNotes: "Router reiniciado",
  resultNotes: "Servicio restablecido",
  zone: { name: "Saquisili" },
  technician: { name: "Tecnico Uno" },
  supportType: { name: "Soporte tecnico", exportGroup: "SOPORTE TECNICO" },
};

describe("buildTicketWorkbook", () => {
  it("crea hojas por grupo y conserva todos los datos operativos", async () => {
    const buffer = await buildTicketWorkbook([
      baseTicket,
      {
        ...baseTicket,
        id: "ticket-2",
        clientName: "Cliente Dos",
        supportType: { name: "Retiro", exportGroup: "RETIRO DE EQUIPOS" },
      },
    ]);
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;
    await workbook.xlsx.load(arrayBuffer);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "SOPORTE TECNICO",
      "RETIRO DE EQUIPOS",
    ]);
    expect(workbook.getWorksheet("SOPORTE TECNICO")?.getRow(4).values).toEqual([
      undefined,
      "F. DE INGRESO",
      "IP CLIENTE",
      "NOMBRES Y APELLIDOS",
      "CELULAR",
      "SECTOR / ZONA",
      "TIPO DE SOPORTE",
      "ESTADO",
      "PRIORIDAD",
      "TECNICO",
      "F. PROGRAMADA",
      "F. FINALIZACION",
      "OBSERVACION",
      "NOTAS TECNICAS",
      "RESULTADO",
    ]);
    expect(workbook.getWorksheet("SOPORTE TECNICO")?.getCell("C5").value).toBe("Cliente Uno");
  });
});
