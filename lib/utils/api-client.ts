export async function readApiResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const raw = await response.text();

  if (!raw) {
    return {} as T;
  }

  if (contentType.includes("application/json")) {
    return JSON.parse(raw) as T;
  }

  if (raw.trim().startsWith("{") || raw.trim().startsWith("[")) {
    return JSON.parse(raw) as T;
  }

  const looksLikeHtml = /<!doctype html>|<html/i.test(raw);

  throw new Error(
    looksLikeHtml
      ? "The server returned an HTML error page instead of JSON. Check the deployed route, runtime logs, or proxy configuration."
      : "The server returned an unexpected response format.",
  );
}
