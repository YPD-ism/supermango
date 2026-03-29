import { createClient } from "@supabase/supabase-js";

// Untyped client — the Database types restrict UPDATE on messages (RLS-derived),
// but service role needs to bypass that for share_token updates.
export function createSupabaseServiceClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
