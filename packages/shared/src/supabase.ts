import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types.js";

export type TypedSupabaseClient = SupabaseClient<Database>;

interface CreateClientOptions {
  isServiceRole?: boolean;
}

/**
 * Create a typed Supabase client with the given URL and key.
 * Pass `isServiceRole: true` for server-side operations that bypass RLS.
 */
export function createSupabaseClient(
  url: string,
  key: string,
  options?: CreateClientOptions
): TypedSupabaseClient {
  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: !options?.isServiceRole,
      persistSession: !options?.isServiceRole,
    },
  });
}

/** Read SUPABASE_URL from environment, throwing if unset. */
export function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL;
  if (!url) throw new Error("Missing environment variable: SUPABASE_URL");
  return url;
}

/** Read SUPABASE_ANON_KEY from environment, throwing if unset. */
export function getSupabaseAnonKey(): string {
  const key = process.env.SUPABASE_ANON_KEY;
  if (!key) throw new Error("Missing environment variable: SUPABASE_ANON_KEY");
  return key;
}
