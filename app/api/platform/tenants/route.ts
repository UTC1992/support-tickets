import { createTenant, listTenants, TenantResourceError } from "@/features/tenants/services/tenant-service";
import { PlatformAdminAccessError } from "@/lib/auth/platform-admin";
import { getErrorMessage, jsonResponse } from "@/lib/http/json";

const GET = async () => {
  try {
    return jsonResponse({ items: await listTenants() });
  } catch (error) {
    const status = error instanceof PlatformAdminAccessError ? error.status : 400;
    return jsonResponse({ error: getErrorMessage(error) }, { status });
  }
};

const POST = async (request: Request) => {
  try {
    const item = await createTenant(await request.json());
    return jsonResponse({ item }, { status: 201 });
  } catch (error) {
    const status = error instanceof PlatformAdminAccessError || error instanceof TenantResourceError
      ? error.status
      : 400;
    return jsonResponse({ error: getErrorMessage(error) }, { status });
  }
};

export { GET, POST };
