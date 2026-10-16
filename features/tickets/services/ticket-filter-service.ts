import type { TicketFilters } from "@/lib/services/tickets";

const parseTicketFilters = (searchParams: URLSearchParams): TicketFilters => ({
  from: searchParams.get("from"),
  limit: searchParams.get("limit"),
  page: searchParams.get("page"),
  search: searchParams.get("search"),
  status: searchParams.get("status"),
  supportTypeId: searchParams.get("supportTypeId"),
  technicianId: searchParams.get("technicianId"),
  to: searchParams.get("to"),
  sectorId: searchParams.get("sectorId"),
});

export default parseTicketFilters;
