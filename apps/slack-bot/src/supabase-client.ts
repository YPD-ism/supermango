import { createSupabaseClient } from "@linkdigest/shared";

export function getServiceRoleClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("SUPABASE_URL environment variable is not set");
  if (!key)
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
  return createSupabaseClient(url, key, { isServiceRole: true });
}
