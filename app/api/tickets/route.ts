import { assertBackOffice, BackOfficeAccessError } from "@/lib/auth/back-office";
import parseTicketFilters from "@/features/tickets/services/ticket-filter-service";
import { getErrorMessage, jsonResponse } from "@/lib/http/json";
import { createTicket, listTickets } from "@/lib/services/tickets";

const GET = async (request: Request) => {
  try {
    const profile = await assertBackOffice();
    const { searchParams } = new URL(request.url);
    const result = await listTickets(profile.tenantId, parseTicketFilters(searchParams));

    return jsonResponse(result);
  } catch (error) {
    const status = error instanceof BackOfficeAccessError ? error.status : 400;
    return jsonResponse({ error: getErrorMessage(error) }, { status });
  }
};

const POST = async (request: Request) => {
  try {
    const profile = await assertBackOffice();
    const payload = await request.json();
    const ticket = await createTicket(profile.tenantId, profile.id, payload);
    return jsonResponse({ ticket }, { status: 201 });
  } catch (error) {
    const status = error instanceof BackOfficeAccessError ? error.status : 400;
    return jsonResponse({ error: getErrorMessage(error) }, { status });
  }
};

export { GET, POST };
