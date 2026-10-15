import "server-only";

import ExcelJS from "exceljs";

type ExportRelation = { name: string } | null;

type TicketExportItem = {
  clientName: string;
  clientPhone: string | null;
  clientIp: string | null;
  sector: string | null;
  status: string;
  priority: string;
  intakeDate: Date;
  scheduledAt: Date | null;
  completedAt: Date | null;
  observation: string | null;
  technicianNotes: string | null;
  resultNotes: string | null;
  zone: ExportRelation;
  technician: ExportRelation;
  supportType: ExportRelation;
};

const statusLabels: Record<string, string> = {
  pending: "PENDIENTE",
  assigned: "ASIGNADO",
  in_progress: "EN PROGRESO",
  completed: "REALIZADO",
  not_completed: "NO REALIZADO",
  rescheduled: "REPROGRAMADO",
  cancelled: "CANCELADO",
};

const priorityLabels: Record<string, string> = {
  low: "BAJA",
  normal: "NORMAL",
  high: "ALTA",
  urgent: "URGENTE",
};

const headers = [
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
];

const sheetName = (value: string) => {
  const sanitized = value.replace(/[\\/*?:[\]]/g, " ").trim();
  return (sanitized || "SIN CLASIFICAR").slice(0, 31);
};

const addTicketSheet = (
  workbook: ExcelJS.Workbook,
  name: string,
  group: string,
  tickets: TicketExportItem[],
) => {
  const worksheet = workbook.addWorksheet(name, {
    pageSetup: { fitToPage: true, orientation: "landscape", paperSize: 9 },
    views: [{ state: "frozen", ySplit: 4 }],
  });

  worksheet.mergeCells("A1:N1");
  worksheet.getCell("A1").value = "SOPORTES EXITCOMP";
  worksheet.getCell("A1").font = { bold: true, name: "Arial", size: 14, color: { argb: "FF073763" } };
  worksheet.getCell("A1").alignment = { horizontal: "center" };

  worksheet.mergeCells("A2:N2");
  worksheet.getCell("A2").value = `FECHA DE EXPORTACION: ${new Intl.DateTimeFormat("es-EC").format(new Date())}`;
  worksheet.getCell("A2").font = { bold: true, name: "Arial", size: 10 };

  worksheet.mergeCells("A3:N3");
  worksheet.getCell("A3").value = group.toUpperCase();
  worksheet.getCell("A3").font = { bold: true, name: "Arial", size: 12, color: { argb: "FFFF6D01" } };

  const headerRow = worksheet.getRow(4);
  headerRow.values = headers;
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, name: "Arial", size: 10, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF073763" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFFFFFFF" } },
      left: { style: "thin", color: { argb: "FFFFFFFF" } },
      right: { style: "thin", color: { argb: "FFFFFFFF" } },
      top: { style: "thin", color: { argb: "FFFFFFFF" } },
    };
  });

  tickets.forEach((ticket) => {
    const row = worksheet.addRow([
      ticket.intakeDate,
      ticket.clientName,
      ticket.clientPhone ?? "",
      ticket.zone?.name ?? ticket.sector ?? "",
      ticket.supportType?.name ?? "",
      ticket.observation ?? "",
      ticket.technician?.name ?? "SIN ASIGNAR",
      statusLabels[ticket.status] ?? ticket.status.toUpperCase(),
      priorityLabels[ticket.priority] ?? ticket.priority.toUpperCase(),
      ticket.clientIp ?? "",
      ticket.scheduledAt,
      ticket.completedAt,
      ticket.technicianNotes ?? "",
      ticket.resultNotes ?? "",
    ]);

    row.height = 30;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: "Calibri", size: 10, color: { argb: "FF000000" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFA4C2F4" } };
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFB7C9E2" } },
        left: { style: "hair", color: { argb: "FFB7C9E2" } },
        right: { style: "hair", color: { argb: "FFB7C9E2" } },
        top: { style: "hair", color: { argb: "FFB7C9E2" } },
      };
    });
    row.getCell(1).numFmt = "dd/mm/yyyy";
    row.getCell(3).numFmt = "@";
    row.getCell(10).numFmt = "@";
    [11, 12].forEach((column) => {
      row.getCell(column).numFmt = "dd/mm/yyyy hh:mm";
    });
  });

  const widths = [14, 30, 15, 24, 22, 36, 20, 16, 12, 16, 18, 18, 30, 30];
  widths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });
  worksheet.autoFilter = { from: "A4", to: "N4" };
};

const buildTicketWorkbook = async (tickets: TicketExportItem[]) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Exitcomp";
  workbook.created = new Date();

  const groups = new Map<string, TicketExportItem[]>();
  tickets.forEach((ticket) => {
    const group = ticket.supportType?.name.trim().toUpperCase() || "SIN CLASIFICAR";
    groups.set(group, [...(groups.get(group) ?? []), ticket]);
  });

  if (groups.size === 0) {
    groups.set("SIN DATOS", []);
  }

  const usedNames = new Set<string>();
  groups.forEach((groupTickets, group) => {
    const baseName = sheetName(group);
    let name = baseName;
    let suffix = 2;
    while (usedNames.has(name.toLowerCase())) {
      const ending = ` ${suffix}`;
      name = `${baseName.slice(0, 31 - ending.length)}${ending}`;
      suffix += 1;
    }
    usedNames.add(name.toLowerCase());
    addTicketSheet(workbook, name, group, groupTickets);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

export default buildTicketWorkbook;
