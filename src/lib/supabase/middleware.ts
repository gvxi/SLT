import { getAuthUser } from "@/lib/supabase/server";

type AuthResult =
  | { user: Awaited<ReturnType<typeof getAuthUser>>; error: null }
  | { user: null; error: Response };

export async function requireAuth(request: Request): Promise<AuthResult> {
  const user = await getAuthUser(request);
  if (!user) {
    return {
      user: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  return { user, error: null };
}
