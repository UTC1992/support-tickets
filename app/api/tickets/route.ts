import { getErrorMessage, jsonResponse } from "@/lib/http/json";
import { createTicket, listTickets } from "@/lib/services/tickets";

export async function GET(request: Request) {
  try {
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
    return jsonResponse({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const ticket = await createTicket(payload);
    return jsonResponse({ ticket }, { status: 201 });
  } catch (error) {
    return jsonResponse({ error: getErrorMessage(error) }, { status: 400 });
  }
}
