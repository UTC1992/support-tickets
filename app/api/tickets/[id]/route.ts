import { getErrorMessage, jsonResponse } from "@/lib/http/json";
import { getTicket, updateTicket } from "@/lib/services/tickets";

type TicketRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: TicketRouteContext) {
  try {
    const { id } = await context.params;
    const ticket = await getTicket(id);
    return jsonResponse({ ticket });
  } catch (error) {
    return jsonResponse({ error: getErrorMessage(error) }, { status: 404 });
  }
}

export async function PATCH(request: Request, context: TicketRouteContext) {
  try {
    const { id } = await context.params;
    const payload = await request.json();
    const ticket = await updateTicket(id, payload);
    return jsonResponse({ ticket });
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message === "Ticket not found" ? 404 : 400;
    return jsonResponse({ error: message }, { status });
  }
}
