import { AdminAccessError } from "@/lib/auth/admin";
import { jsonResponse } from "@/lib/http/json";
import { AdminResourceError, createAdminResource, parseAdminResource } from "@/features/admin/services/admin-resource-service";

type RouteContext = { params: Promise<{ resource: string }> };

const POST = async (request: Request, context: RouteContext) => {
  try {
    const { resource } = await context.params;
    const item = await createAdminResource(
      parseAdminResource(resource),
      await request.json(),
      { origin: new URL(request.url).origin },
    );
    return jsonResponse({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAccessError) return jsonResponse({ error: error.message }, { status: error.status });
    if (error instanceof AdminResourceError) return jsonResponse({ error: error.message }, { status: 400 });
    return jsonResponse({ error: "No se pudo crear el registro" }, { status: 400 });
  }
};

export { POST };
