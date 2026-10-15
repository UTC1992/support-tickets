import type { TenantItem } from "@/features/tenants/types";

const readResponse = async <T>(response: Response) => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? "No se pudo completar la operación");
  return payload as T;
};

export const createTenantRequest = async (body: Record<string, unknown>) => {
  const response = await fetch("/api/platform/tenants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await readResponse<{ item: TenantItem }>(response)).item;
};

export const updateTenantRequest = async (id: string, body: Record<string, unknown>) => {
  const response = await fetch(`/api/platform/tenants/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await readResponse<{ item: TenantItem }>(response)).item;
};
