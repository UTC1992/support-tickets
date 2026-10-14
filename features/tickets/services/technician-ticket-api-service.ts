import type {
  TechnicianTicketFilterValues,
  TicketItem,
  TicketPageData,
} from "@/features/tickets/types";

type TechnicianTicketPayload = {
  resultNotes?: string;
  scheduledAt?: string | null;
  status?: string;
  technicianNotes?: string;
};

const readResponse = async <T>(response: Response, fallback: string) => {
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error ?? fallback);
  }

  return result as T;
};

export const listTechnicianTicketsRequest = async (
  filters: TechnicianTicketFilterValues,
) => {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "") {
      searchParams.set(key === "pageSize" ? "limit" : key, String(value));
    }
  });

  const response = await fetch(`/api/technician/tickets?${searchParams.toString()}`);
  return readResponse<TicketPageData>(response, "No se pudieron cargar tus soportes");
};

export const updateTechnicianTicketRequest = async (
  id: string,
  body: TechnicianTicketPayload,
) => {
  const response = await fetch(`/api/technician/tickets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await readResponse<{ ticket: TicketItem }>(
    response,
    "No se pudo actualizar el soporte",
  );

  return result.ticket;
};
