import { createClient } from "@supabase/supabase-js";

export type AuthedUser = { id: string; email: string | null; token: string };

/**
 * Verifies the Supabase bearer token on an incoming API request.
 * Returns the user when valid, otherwise a 401 Response to return directly.
 */
export async function requireApiUser(
  request: Request,
): Promise<{ user: AuthedUser } | { response: Response }> {
  const unauthorized = {
    response: new Response(
      JSON.stringify({ error: "Sign in to use Claimly's assistant." }),
      { status: 401, headers: { "content-type": "application/json" } },
    ),
  };

  const auth = request.headers.get("authorization");
  const token = auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) return unauthorized;

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return unauthorized;
    return { user: { id: data.user.id, email: data.user.email ?? null, token } };
  } catch {
    return unauthorized;
  }
}
