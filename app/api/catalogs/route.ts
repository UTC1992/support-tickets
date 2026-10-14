import { assertBackOffice, BackOfficeAccessError } from "@/lib/auth/back-office";
import { getErrorMessage, jsonResponse } from "@/lib/http/json";
import listCatalogs from "@/lib/services/catalogs";

const GET = async () => {
  try {
    await assertBackOffice();
    const catalogs = await listCatalogs();
    return jsonResponse(catalogs);
  } catch (error) {
    const status = error instanceof BackOfficeAccessError ? error.status : 500;
    return jsonResponse({ error: getErrorMessage(error) }, { status });
  }
};

export { GET };
