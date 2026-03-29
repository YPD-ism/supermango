import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockGetUser = vi.fn();

const chain: Record<string, ReturnType<typeof vi.fn>> = {};
chain.select = mockSelect.mockReturnValue(chain);
chain.eq = mockEq.mockReturnValue(chain);
chain.order = mockOrder.mockReturnValue(chain);

const mockFrom = vi.fn().mockReturnValue(chain);

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}));

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/channels");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new Request(url);
}

describe("GET /api/channels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue(chain);
    mockEq.mockReturnValue(chain);
    mockOrder.mockReturnValue(chain);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "auth-user-1" } },
      error: null,
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { GET } = await import("@/app/api/channels/route");
    const response = await GET(makeRequest());

    expect(response.status).toBe(401);
  });

  it("returns channels for authenticated user", async () => {
    const channels = [
      { id: "ch-1", name: "general", workspace_id: "ws-1" },
      { id: "ch-2", name: "random", workspace_id: "ws-1" },
    ];
    mockOrder.mockResolvedValue({ data: channels, error: null });

    const { GET } = await import("@/app/api/channels/route");
    const response = await GET(makeRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(2);
  });

  it("filters by workspace_id when provided", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    const { GET } = await import("@/app/api/channels/route");
    await GET(makeRequest({ workspace_id: "ws-1" }));

    expect(mockEq).toHaveBeenCalledWith("workspace_id", "ws-1");
  });

  it("returns all channels when workspace_id is not provided", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    const { GET } = await import("@/app/api/channels/route");
    await GET(makeRequest());

    const eqCalls = mockEq.mock.calls.map((c: unknown[]) => c[0]);
    expect(eqCalls).not.toContain("workspace_id");
  });

  it("queries channels table with name ordering", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    const { GET } = await import("@/app/api/channels/route");
    await GET(makeRequest());

    expect(mockFrom).toHaveBeenCalledWith("channels");
    expect(mockSelect).toHaveBeenCalledWith("id, name, workspace_id");
    expect(mockOrder).toHaveBeenCalledWith("name");
  });

  it("returns 500 on database error", async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const { GET } = await import("@/app/api/channels/route");
    const response = await GET(makeRequest());

    expect(response.status).toBe(500);
  });
});
