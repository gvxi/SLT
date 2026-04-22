import { supabaseBrowser } from "@/lib/supabase/client";

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const { data } = await supabaseBrowser.auth.getSession();
  const token = data.session?.access_token;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const response = await fetch(`/api/${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({ error: response.statusText }))) as Record<string, unknown>;
    const err = body.error;
    const message = typeof err === "string" ? err : (JSON.stringify(err) ?? "Request failed");
    throw new Error(message);
  }

  return response;
}
