import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("next/server", async () => {
  const actual: Record<string, unknown> = {};
  return {
    ...actual,
    NextResponse: {
      next: vi.fn(({ request }: { request: { headers: Headers } }) => ({
        cookies: {
          set: vi.fn(),
        },
        headers: request.headers,
      })),
      redirect: vi.fn((url: URL) => ({
        type: "redirect",
        url: url.toString(),
      })),
    },
  };
});

function createMockRequest(pathname: string) {
  const url = `http://localhost:3000${pathname}`;
  return {
    nextUrl: new URL(url),
    url,
    headers: new Headers(),
    cookies: {
      getAll: vi.fn().mockReturnValue([]),
      set: vi.fn(),
    },
  };
}

describe("middleware", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    mockGetUser.mockReset();
    vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "test-anon-key");
  });

  it("redirects unauthenticated users from /feed to /login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { middleware } = await import("@/middleware");
    const request = createMockRequest("/feed");
    const response = await middleware(request as never);

    expect(response).toHaveProperty("type", "redirect");
    expect(response).toHaveProperty(
      "url",
      expect.stringContaining("/login")
    );
  });

  it("allows authenticated users to access /feed", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@test.com" } },
    });

    const { middleware } = await import("@/middleware");
    const request = createMockRequest("/feed");
    const response = await middleware(request as never);

    expect(response).not.toHaveProperty("type", "redirect");
  });

  it("redirects authenticated users from /login to /feed", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@test.com" } },
    });

    const { middleware } = await import("@/middleware");
    const request = createMockRequest("/login");
    const response = await middleware(request as never);

    expect(response).toHaveProperty("type", "redirect");
    expect(response).toHaveProperty(
      "url",
      expect.stringContaining("/feed")
    );
  });

  it("allows unauthenticated users to access /login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { middleware } = await import("@/middleware");
    const request = createMockRequest("/login");
    const response = await middleware(request as never);

    expect(response).not.toHaveProperty("type", "redirect");
  });

  it("allows unauthenticated users to access public routes like /", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { middleware } = await import("@/middleware");
    const request = createMockRequest("/");
    const response = await middleware(request as never);

    expect(response).not.toHaveProperty("type", "redirect");
  });

  it("redirects authenticated users from / to /feed", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@test.com" } },
    });

    const { middleware } = await import("@/middleware");
    const request = createMockRequest("/");
    const response = await middleware(request as never);

    expect(response).toHaveProperty("type", "redirect");
    expect(response).toHaveProperty(
      "url",
      expect.stringContaining("/feed")
    );
  });
});
