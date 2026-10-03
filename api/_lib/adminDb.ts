import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role Supabase client for server-side writes/reads that RLS no longer
// grants to the public anon key (visit_logs SELECT/DELETE, comment moderation,
// song-request moderation). The key lives ONLY in the server-side env var
// GOV_SUPABASE_SERVICE_ROLE_KEY — never a VITE_* var, so Vite can never inline
// it into the browser bundle.
//
// Returns null when either value is missing so every caller fails closed
// (refuses the request) instead of silently falling back to the anon key.
export function getAdminDb(): SupabaseClient | null {
  const url = process.env.VITE_GOV_SUPABASE_URL;
  const serviceKey = process.env.GOV_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
