export type CatalogResource = "zones" | "technicians" | "support-types";

export type CatalogItem = {
  id: string;
  name: string;
  phone?: string | null;
  exportGroup?: string;
  isActive: boolean;
  ticketCount: number;
};

export type CatalogSecondaryField = "phone" | "exportGroup";
