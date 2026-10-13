import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { getErrorMessage, jsonResponse } from "@/lib/http/json";
import { createTicket, listTickets } from "@/lib/services/tickets";

const GET = async (request: Request) => {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const tickets = await listTickets({
      status: searchParams.get("status"),
      technicianId: searchParams.get("technicianId"),
      zoneId: searchParams.get("zoneId"),
      supportTypeId: searchParams.get("supportTypeId"),
      search: searchParams.get("search"),
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      limit: searchParams.get("limit"),
    });

    return jsonResponse({ tickets });
  } catch (error) {
    const status = error instanceof UnauthorizedError ? 401 : 400;
    return jsonResponse({ error: getErrorMessage(error) }, { status });
  }
};

const POST = async (request: Request) => {
  try {
    await requireUser();
    const payload = await request.json();
    const ticket = await createTicket(payload);
    return jsonResponse({ ticket }, { status: 201 });
  } catch (error) {
    const status = error instanceof UnauthorizedError ? 401 : 400;
    return jsonResponse({ error: getErrorMessage(error) }, { status });
  }
};

export { GET, POST };
