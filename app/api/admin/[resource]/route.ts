import { AdminAccessError } from "@/lib/auth/admin";
import { UserManagerAccessError } from "@/lib/auth/user-manager";
import { jsonResponse } from "@/lib/http/json";
import { CatalogResourceError, createCatalogResource, parseCatalogResource } from "@/features/catalogs/services/catalog-resource-service";
import { createUser, UserResourceError } from "@/features/users/services/user-resource-service";

type RouteContext = { params: Promise<{ resource: string }> };

const POST = async (request: Request, context: RouteContext) => {
  try {
    const { resource } = await context.params;
    const payload = await request.json();
    const item = resource === "profiles"
      ? await createUser(payload)
      : await createCatalogResource(parseCatalogResource(resource), payload);
    return jsonResponse({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAccessError) return jsonResponse({ error: error.message }, { status: error.status });
    if (error instanceof UserManagerAccessError) return jsonResponse({ error: error.message }, { status: error.status });
    if (error instanceof CatalogResourceError || error instanceof UserResourceError) {
      return jsonResponse({ error: error.message }, { status: error instanceof UserResourceError ? error.status : 400 });
    }
    return jsonResponse({ error: "No se pudo crear el registro" }, { status: 400 });
  }
};

export { POST };
