import { TenantResourceError, updateTenant } from "@/features/tenants/services/tenant-service";
import { PlatformAdminAccessError } from "@/lib/auth/platform-admin";
import { getErrorMessage, jsonResponse } from "@/lib/http/json";

type RouteContext = { params: Promise<{ id: string }> };

const PATCH = async (request: Request, context: RouteContext) => {
  try {
    const { id } = await context.params;
    return jsonResponse({ item: await updateTenant(id, await request.json()) });
  } catch (error) {
    const status = error instanceof PlatformAdminAccessError || error instanceof TenantResourceError
      ? error.status
      : 400;
    return jsonResponse({ error: getErrorMessage(error) }, { status });
  }
};

export { PATCH };
