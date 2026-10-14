import parseTicketFilters from "@/features/tickets/services/ticket-filter-service";
import { assertTechnician, TechnicianAccessError } from "@/lib/auth/technician";
import { getErrorMessage, jsonResponse } from "@/lib/http/json";
import { listTechnicianTickets } from "@/lib/services/tickets";

const GET = async (request: Request) => {
  try {
    const { technician } = await assertTechnician();
    const { searchParams } = new URL(request.url);
    const filters = parseTicketFilters(searchParams);
    const result = await listTechnicianTickets(technician.id, filters);

    return jsonResponse(result);
  } catch (error) {
    const status = error instanceof TechnicianAccessError ? error.status : 400;
    return jsonResponse({ error: getErrorMessage(error) }, { status });
  }
};

export { GET };
