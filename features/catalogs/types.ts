export type CatalogResource = "sectors" | "technicians" | "support-types";

export type CatalogItem = {
  id: string;
  name: string;
  phone?: string | null;
  isActive: boolean;
  ticketCount: number;
};

export type CatalogSecondaryField = "phone";
