// @linkdigest/shared — Supabase client, types, and utilities

export {
  createSupabaseClient,
  getSupabaseUrl,
  getSupabaseAnonKey,
  type TypedSupabaseClient,
} from "./supabase.js";

export type {
  Database,
  MessageStatus,
  Workspace,
  Channel,
  User,
  Message,
  Url,
  Tag,
} from "./types.js";
