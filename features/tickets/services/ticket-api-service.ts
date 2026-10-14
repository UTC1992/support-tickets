import type { TicketFilterValues, TicketPageData } from "@/features/tickets/types";

type TicketPayload = Record<string, unknown>;

const requestTicket = async <T>(path: string, method: "POST" | "PATCH", body: TicketPayload) => {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "No se pudo guardar el soporte");
  return result.ticket as T;
};

export const createTicketRequest = <T>(body: TicketPayload) => requestTicket<T>("/api/tickets", "POST", body);
export const updateTicketRequest = <T>(id: string, body: TicketPayload) => requestTicket<T>(`/api/tickets/${id}`, "PATCH", body);
export const listTicketsRequest = async (filters: TicketFilterValues) => {
  const searchParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "") {
      searchParams.set(key === "pageSize" ? "limit" : key, String(value));
    }
  });
  const response = await fetch(`/api/tickets?${searchParams.toString()}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "No se pudieron cargar los soportes");
  return result as TicketPageData;
};

export const getTicketExportUrl = (filters: TicketFilterValues) => {
  const searchParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (key !== "page" && key !== "pageSize" && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return `/api/tickets/export${query ? `?${query}` : ""}`;
};

export const deleteTicketRequest = async (id: string) => {
  const response = await fetch(`/api/tickets/${id}`, { method: "DELETE" });
  if (response.ok) return;
  const result = await response.json();
  throw new Error(result.error ?? "No se pudo eliminar el soporte");
};
