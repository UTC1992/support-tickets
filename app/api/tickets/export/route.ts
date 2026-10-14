import { assertBackOffice, BackOfficeAccessError } from "@/lib/auth/back-office";
import buildTicketWorkbook from "@/features/tickets/services/ticket-export-service";
import parseTicketFilters from "@/features/tickets/services/ticket-filter-service";
import { getErrorMessage, jsonResponse } from "@/lib/http/json";
import { listTicketsForExport } from "@/lib/services/tickets";

const GET = async (request: Request) => {
  try {
    await assertBackOffice();
    const { searchParams } = new URL(request.url);
    const tickets = await listTicketsForExport(parseTicketFilters(searchParams));
    const workbook = await buildTicketWorkbook(tickets);
    const date = new Date().toISOString().slice(0, 10);

    return new Response(new Uint8Array(workbook), {
      headers: {
        "Content-Disposition": `attachment; filename="soportes-exitcomp-${date}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    const status = error instanceof BackOfficeAccessError ? error.status : 400;
    return jsonResponse({ error: getErrorMessage(error) }, { status });
  }
};

export { GET };
