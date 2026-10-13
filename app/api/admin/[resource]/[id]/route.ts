import { AdminAccessError } from "@/lib/auth/admin";
import { jsonResponse } from "@/lib/http/json";
import { AdminResourceError, deleteAdminResource, parseAdminResource, updateAdminResource } from "@/features/admin/services/admin-resource-service";

type RouteContext = { params: Promise<{ resource: string; id: string }> };

const PATCH = async (request: Request, context: RouteContext) => {
  try {
    const { resource, id } = await context.params;
    const item = await updateAdminResource(parseAdminResource(resource), id, await request.json());
    return jsonResponse({ item });
  } catch (error) {
    if (error instanceof AdminAccessError) return jsonResponse({ error: error.message }, { status: error.status });
    if (error instanceof AdminResourceError) return jsonResponse({ error: error.message }, { status: 400 });
    return jsonResponse({ error: "No se pudo actualizar el registro" }, { status: 400 });
  }
};

const DELETE = async (_request: Request, context: RouteContext) => {
  try {
    const { resource, id } = await context.params;
    await deleteAdminResource(parseAdminResource(resource), id);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof AdminAccessError) return jsonResponse({ error: error.message }, { status: error.status });
    if (error instanceof AdminResourceError) return jsonResponse({ error: error.message }, { status: 400 });
    return jsonResponse({ error: "No se pudo eliminar el registro" }, { status: 400 });
  }
};

export { DELETE, PATCH };
