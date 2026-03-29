import { createSupabaseClient } from "@linkdigest/shared";

export function createSupabaseServiceClient() {
  return createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { isServiceRole: true }
  );
}
