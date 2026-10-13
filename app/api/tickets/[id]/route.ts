import { AdminAccessError, assertAdmin } from "@/lib/auth/admin";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { getErrorMessage, jsonResponse } from "@/lib/http/json";
import { deleteTicket, getTicket, updateTicket } from "@/lib/services/tickets";

type TicketRouteContext = {
  params: Promise<{ id: string }>;
};

const GET = async (_request: Request, context: TicketRouteContext) => {
  try {
    await requireUser();
    const { id } = await context.params;
    const ticket = await getTicket(id);
    return jsonResponse({ ticket });
  } catch (error) {
    const status = error instanceof UnauthorizedError ? 401 : 404;
    return jsonResponse({ error: getErrorMessage(error) }, { status });
  }
};

const PATCH = async (request: Request, context: TicketRouteContext) => {
  try {
    await requireUser();
    const { id } = await context.params;
    const payload = await request.json();
    const ticket = await updateTicket(id, payload);
    return jsonResponse({ ticket });
  } catch (error) {
    const message = getErrorMessage(error);
    const status =
      error instanceof UnauthorizedError
        ? 401
        : message === "Ticket not found"
          ? 404
          : 400;
    return jsonResponse({ error: message }, { status });
  }
};

const DELETE = async (_request: Request, context: TicketRouteContext) => {
  try {
    await assertAdmin();
    const { id } = await context.params;
    await deleteTicket(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return jsonResponse({ error: error.message }, { status: error.status });
    }
    const status = getErrorMessage(error) === "Ticket not found" ? 404 : 400;
    return jsonResponse({ error: status === 404 ? "Soporte no encontrado" : "No se pudo eliminar el soporte" }, { status });
  }
};

export { DELETE, GET, PATCH };
