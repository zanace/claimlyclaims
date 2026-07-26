import { supabase } from "@/integrations/supabase/client";

/** fetch() that attaches the signed-in user's bearer token to Claimly API routes. */
export async function authFetch(input: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
