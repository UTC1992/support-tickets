type RequestOptions = {
  method: "POST" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
};

const request = async <T>(path: string, options: RequestOptions) => {
  const response = await fetch(path, {
    method: options.method,
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) return undefined as T;

  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "No se pudo completar la operacion");
  return result.item as T;
};

export const createAdminItem = <T>(resource: string, body: Record<string, unknown>) => request<T>(`/api/admin/${resource}`, { method: "POST", body });
export const updateAdminItem = <T>(resource: string, id: string, body: Record<string, unknown>) => request<T>(`/api/admin/${resource}/${id}`, { method: "PATCH", body });
export const deleteAdminItem = (resource: string, id: string) => request<void>(`/api/admin/${resource}/${id}`, { method: "DELETE" });
