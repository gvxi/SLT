import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Client-side Supabase — lazy singleton so it is never evaluated at build time.
let _client: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}

/** @deprecated Use getSupabaseBrowser() instead */
export const supabaseBrowser = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseBrowser() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
