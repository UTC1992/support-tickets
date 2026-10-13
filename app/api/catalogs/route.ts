import { getErrorMessage, jsonResponse } from "@/lib/http/json";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import listCatalogs from "@/lib/services/catalogs";

const GET = async () => {
  try {
    await requireUser();
    const catalogs = await listCatalogs();
    return jsonResponse(catalogs);
  } catch (error) {
    const status = error instanceof UnauthorizedError ? 401 : 500;
    return jsonResponse({ error: getErrorMessage(error) }, { status });
  }
};

export { GET };
