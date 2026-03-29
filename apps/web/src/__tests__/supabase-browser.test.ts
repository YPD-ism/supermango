import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn().mockReturnValue({ auth: {} }),
}));

describe("createSupabaseBrowserClient", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("creates a browser client with env vars", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    const { createBrowserClient } = await import("@supabase/ssr");
    const { createSupabaseBrowserClient } = await import(
      "@/lib/supabase/browser"
    );

    createSupabaseBrowserClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key"
    );
  });

  it("returns the same singleton instance", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    const { createSupabaseBrowserClient } = await import(
      "@/lib/supabase/browser"
    );

    const client1 = createSupabaseBrowserClient();
    const client2 = createSupabaseBrowserClient();

    expect(client1).toBe(client2);
  });
});
