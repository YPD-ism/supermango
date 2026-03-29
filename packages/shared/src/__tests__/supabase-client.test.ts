import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Supabase client", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("createSupabaseClient creates a client with given URL and key", async () => {
    const { createSupabaseClient } = await import("../supabase.js");
    const client = createSupabaseClient(
      "https://test.supabase.co",
      "test-anon-key"
    );
    expect(client).toBeDefined();
    expect(client.from).toBeTypeOf("function");
    expect(client.auth).toBeDefined();
  });

  it("createSupabaseClient creates a service role client when isServiceRole is true", async () => {
    const { createSupabaseClient } = await import("../supabase.js");
    const client = createSupabaseClient(
      "https://test.supabase.co",
      "test-service-role-key",
      { isServiceRole: true }
    );
    expect(client).toBeDefined();
    expect(client.from).toBeTypeOf("function");
  });

  it("getSupabaseUrl and getSupabaseAnonKey read from environment variables", async () => {
    process.env.SUPABASE_URL = "https://env-test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "env-anon-key";

    const { getSupabaseUrl, getSupabaseAnonKey } = await import(
      "../supabase.js"
    );
    expect(getSupabaseUrl()).toBe("https://env-test.supabase.co");
    expect(getSupabaseAnonKey()).toBe("env-anon-key");
  });

  it("getSupabaseUrl throws when SUPABASE_URL is not set", async () => {
    delete process.env.SUPABASE_URL;

    const { getSupabaseUrl } = await import("../supabase.js");
    expect(() => getSupabaseUrl()).toThrow("SUPABASE_URL");
  });

  it("getSupabaseAnonKey throws when SUPABASE_ANON_KEY is not set", async () => {
    delete process.env.SUPABASE_ANON_KEY;

    const { getSupabaseAnonKey } = await import("../supabase.js");
    expect(() => getSupabaseAnonKey()).toThrow("SUPABASE_ANON_KEY");
  });
});
