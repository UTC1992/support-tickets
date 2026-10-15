import { AdminAccessError } from "@/lib/auth/admin";
import { jsonResponse } from "@/lib/http/json";
import {
  resetUserPassword,
  UserResourceError,
} from "@/features/users/services/user-resource-service";

type RouteContext = {
  params: Promise<{ resource: string; id: string }>;
};

const PATCH = async (request: Request, context: RouteContext) => {
  try {
    const { resource, id } = await context.params;
    if (resource !== "profiles") {
      return jsonResponse({ error: "Recurso no encontrado" }, { status: 404 });
    }

    await resetUserPassword(id, await request.json());
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return jsonResponse({ error: error.message }, { status: error.status });
    }
    if (error instanceof UserResourceError) {
      return jsonResponse({ error: error.message }, { status: 400 });
    }
    return jsonResponse(
      { error: "No se pudo restablecer la contraseña" },
      { status: 400 },
    );
  }
};

export { PATCH };
