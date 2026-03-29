import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExchangeCodeForSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

describe("GET /auth/callback", () => {
  beforeEach(() => {
    mockExchangeCodeForSession.mockReset();
  });

  it("exchanges code for session and redirects to /feed", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });

    const { GET } = await import("@/app/auth/callback/route");
    const url = new URL("http://localhost:3000/auth/callback?code=test-code");
    const request = new Request(url);

    const response = await GET(request);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("test-code");
    // Should redirect to /feed
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/feed");
  });

  it("redirects to /login on missing code", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const url = new URL("http://localhost:3000/auth/callback");
    const request = new Request(url);

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });

  it("redirects to /login on exchange error", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: new Error("Invalid code"),
    });

    const { GET } = await import("@/app/auth/callback/route");
    const url = new URL("http://localhost:3000/auth/callback?code=bad-code");
    const request = new Request(url);

    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
  });
});
