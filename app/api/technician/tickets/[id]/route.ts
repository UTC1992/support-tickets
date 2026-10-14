import { assertTechnician, TechnicianAccessError } from "@/lib/auth/technician";
import { getErrorMessage, jsonResponse } from "@/lib/http/json";
import { updateTechnicianTicket } from "@/lib/services/tickets";

type TechnicianTicketRouteContext = {
  params: Promise<{ id: string }>;
};

const PATCH = async (request: Request, context: TechnicianTicketRouteContext) => {
  try {
    const { profile, technician } = await assertTechnician();
    const { id } = await context.params;
    const payload = await request.json();
    const ticket = await updateTechnicianTicket(
      id,
      technician.id,
      profile.id,
      payload,
    );

    return jsonResponse({ ticket });
  } catch (error) {
    const message = getErrorMessage(error);
    const status = error instanceof TechnicianAccessError
      ? error.status
      : message === "Assigned ticket not found"
        ? 404
        : 400;

    return jsonResponse({ error: message }, { status });
  }
};

export { PATCH };
