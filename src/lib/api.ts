const configuredApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return configuredApiBaseUrl
    ? `${configuredApiBaseUrl}${normalizedPath}`
    : normalizedPath;
}

export async function readApiJson<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();

  if (!contentType.toLowerCase().includes("application/json")) {
    if (
      rawBody.startsWith("<!DOCTYPE") ||
      rawBody.startsWith("<html") ||
      rawBody.startsWith("<")
    ) {
      throw new Error(
        "The frontend reached an HTML page instead of the API. Make sure the backend server is running and set VITE_API_BASE_URL if needed.",
      );
    }

    throw new Error(fallbackMessage);
  }

  let data: any;
  try {
    data = JSON.parse(rawBody);
  } catch {
    throw new Error(fallbackMessage);
  }

  if (!response.ok) {
    throw new Error(data?.error || fallbackMessage);
  }

  return data as T;
}
