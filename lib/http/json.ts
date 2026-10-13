export const jsonResponse = <T>(data: T, init?: ResponseInit) => {
  return Response.json(data, init);
};

export const errorResponse = (message: string, status = 400) => {
  return jsonResponse({ error: message }, { status });
};

export const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : "Unexpected error";
};
