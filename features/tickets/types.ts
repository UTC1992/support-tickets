export type CatalogOption = { id: string; name: string };

export type TicketItem = {
  id: string;
  clientName: string;
  clientPhone: string | null;
  clientIp: string | null;
  sector: string | null;
  zoneId: string | null;
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
  zone: CatalogOption | null;
  supportType: CatalogOption | null;
  technician: CatalogOption | null;
};

export type TicketCatalogs = {
  zones: CatalogOption[];
  supportTypes: CatalogOption[];
  technicians: CatalogOption[];
};
