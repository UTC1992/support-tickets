export type CatalogOption = { id: string; name: string };

export type TicketItem = {
  id: string;
  clientName: string;
  clientPhone: string | null;
  clientIp: string | null;
  address: string | null;
  sectorId: string | null;
  supportTypeId: string | null;
  technicianId: string | null;
  status: string;
  priority: string;
  intakeDate: string;
  scheduledAt: string | null;
  completedAt: string | null;
  observation: string | null;
  technicianNotes: string | null;
  resultNotes: string | null;
  sector: CatalogOption | null;
  supportType: CatalogOption | null;
  technician: CatalogOption | null;
};

export type TicketCatalogs = {
  sectors: CatalogOption[];
  supportTypes: CatalogOption[];
  technicians: CatalogOption[];
};

export type TicketPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type TicketPageData = {
  tickets: TicketItem[];
  pagination: TicketPagination;
};

export type TicketFilterValues = {
  from: string;
  page: number;
  pageSize: number;
  search: string;
  status: string;
  supportTypeId: string;
  technicianId: string;
  to: string;
  sectorId: string;
};

export type TicketFilterField = Exclude<keyof TicketFilterValues, "page" | "pageSize">;

export type TechnicianTicketFilterValues = Pick<
  TicketFilterValues,
  "page" | "pageSize" | "search" | "status"
>;
