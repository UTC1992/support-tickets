import { getErrorMessage, jsonResponse } from "@/lib/http/json";
import { listCatalogs } from "@/lib/services/catalogs";

export async function GET() {
  try {
    const catalogs = await listCatalogs();
    return jsonResponse(catalogs);
  } catch (error) {
    return jsonResponse({ error: getErrorMessage(error) }, { status: 500 });
  }
}
