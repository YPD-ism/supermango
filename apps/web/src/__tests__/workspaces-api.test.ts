import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockGetUser = vi.fn();

const chain: Record<string, ReturnType<typeof vi.fn>> = {};
chain.select = mockSelect.mockReturnValue(chain);
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

describe("GET /api/workspaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue(chain);
    mockOrder.mockReturnValue(chain);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "auth-user-1" } },
      error: null,
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { GET } = await import("@/app/api/workspaces/route");
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns workspaces for authenticated user", async () => {
    const workspaces = [
      { id: "ws-1", name: "Team Alpha", icon_url: "icon1.png" },
      { id: "ws-2", name: "Team Beta", icon_url: null },
    ];
    mockOrder.mockResolvedValue({ data: workspaces, error: null });

    const { GET } = await import("@/app/api/workspaces/route");
    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(2);
    expect(body.data[0].name).toBe("Team Alpha");
  });

  it("queries workspaces table with name ordering", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });

    const { GET } = await import("@/app/api/workspaces/route");
    await GET();

    expect(mockFrom).toHaveBeenCalledWith("workspaces");
    expect(mockSelect).toHaveBeenCalledWith("id, name, icon_url");
    expect(mockOrder).toHaveBeenCalledWith("name");
  });

  it("returns 500 on database error", async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const { GET } = await import("@/app/api/workspaces/route");
    const response = await GET();

    expect(response.status).toBe(500);
  });
});
