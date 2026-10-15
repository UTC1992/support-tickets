import { AdminAccessError } from "@/lib/auth/admin";
import { UserManagerAccessError } from "@/lib/auth/user-manager";
import { jsonResponse } from "@/lib/http/json";
import { CatalogResourceError, deleteCatalogResource, parseCatalogResource, updateCatalogResource } from "@/features/catalogs/services/catalog-resource-service";
import { deleteUser, updateUser, UserResourceError } from "@/features/users/services/user-resource-service";

type RouteContext = { params: Promise<{ resource: string; id: string }> };

const PATCH = async (request: Request, context: RouteContext) => {
  try {
    const { resource, id } = await context.params;
    const payload = await request.json();
    const item = resource === "profiles"
      ? await updateUser(id, payload)
      : await updateCatalogResource(parseCatalogResource(resource), id, payload);
    return jsonResponse({ item });
  } catch (error) {
    if (error instanceof AdminAccessError) return jsonResponse({ error: error.message }, { status: error.status });
    if (error instanceof UserManagerAccessError) return jsonResponse({ error: error.message }, { status: error.status });
    if (error instanceof CatalogResourceError || error instanceof UserResourceError) {
      return jsonResponse({ error: error.message }, { status: error instanceof UserResourceError ? error.status : 400 });
    }
    return jsonResponse({ error: "No se pudo actualizar el registro" }, { status: 400 });
  }
};

const DELETE = async (_request: Request, context: RouteContext) => {
  try {
    const { resource, id } = await context.params;
    if (resource === "profiles") {
      await deleteUser(id);
    } else {
      await deleteCatalogResource(parseCatalogResource(resource), id);
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof AdminAccessError) return jsonResponse({ error: error.message }, { status: error.status });
    if (error instanceof UserManagerAccessError) return jsonResponse({ error: error.message }, { status: error.status });
    if (error instanceof CatalogResourceError || error instanceof UserResourceError) {
      return jsonResponse({ error: error.message }, { status: error instanceof UserResourceError ? error.status : 400 });
    }
    return jsonResponse({ error: "No se pudo eliminar el registro" }, { status: 400 });
  }
};

export { DELETE, PATCH };
