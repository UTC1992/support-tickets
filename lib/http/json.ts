export function jsonResponse<T>(data: T, init?: ResponseInit) {
  return Response.json(data, init);
}

export function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, { status });
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}
