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
  supportType: { name: "Soporte tecnico" },
};

describe("buildTicketWorkbook", () => {
  it("crea hojas por grupo y conserva todos los datos operativos", async () => {
    const buffer = await buildTicketWorkbook([
      baseTicket,
      {
        ...baseTicket,
        id: "ticket-2",
        clientName: "Cliente Dos",
        supportType: { name: "Retiro" },
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
      "RETIRO",
    ]);
    const supportSheet = workbook.getWorksheet("SOPORTE TECNICO");
    expect(supportSheet?.getCell("A1").value).toBe("SOPORTES EXITCOMP");
    expect(supportSheet?.getCell("A2").value).toMatch(/^FECHA DE EXPORTACION: /);
    expect(supportSheet?.getCell("A3").value).toBe("SOPORTE TECNICO");
    expect(supportSheet?.getRow(4).values).toEqual([
      undefined,
      "F. DE INGRESO",
      "NOMBRES Y APELLIDOS",
      "CELULAR",
      "SECTOR",
      "TIPO DE SOPORTE",
      "OBSERVACION",
      "TECNICO",
      "ESTADO",
      "PRIORIDAD",
      "IP CLIENTE",
      "F. PROGRAMADA",
      "F. FINALIZACION",
      "NOTAS TECNICAS",
      "RESULTADO",
    ]);
    expect(supportSheet?.getCell("B5").value).toBe("Cliente Uno");
    expect(supportSheet?.getCell("A5").numFmt).toBe("dd/mm/yyyy");
    expect(supportSheet?.getCell("C5").numFmt).toBe("@");
    expect(supportSheet?.getCell("K5").numFmt).toBe("dd/mm/yyyy hh:mm");
    expect(supportSheet?.getCell("L5").numFmt).toBe("dd/mm/yyyy hh:mm");
  });
});
