import { createClient } from "@supabase/supabase-js";

// Client-side Supabase — used ONLY for auth operations (login, register, get session)
// Never use this for data queries — go through API routes instead
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
