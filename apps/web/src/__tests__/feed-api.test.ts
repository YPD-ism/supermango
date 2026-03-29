import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockLt = vi.fn();
const mockGetUser = vi.fn();

// Chain builder: each method returns `chain` so calls can be chained in any order
const chain: Record<string, ReturnType<typeof vi.fn>> = {};
chain.select = mockSelect.mockReturnValue(chain);
chain.eq = mockEq.mockReturnValue(chain);
chain.order = mockOrder.mockReturnValue(chain);
chain.limit = mockLimit.mockReturnValue(chain);
chain.lt = mockLt.mockReturnValue(chain);

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

// --- Helpers ---

function makeFeedRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/feed");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new Request(url);
}

function mockMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: "msg-1",
    channel_id: "ch-1",
    user_id: "user-1",
    slack_message_ts: "1234567890.123456",
    summary: "Line 1\nLine 2\nLine 3",
    card_images: ["img1.png", "img2.png", "img3.png"],
    status: "complete",
    share_token: null,
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-03-20T10:00:00Z",
    user: {
      id: "user-1",
      display_name: "김철수",
      avatar_url: "avatar.png",
    },
    channel: {
      id: "ch-1",
      name: "general",
      workspace_id: "ws-1",
    },
    urls: [{ id: "url-1", url: "https://example.com", title: "Example", position: 0 }],
    tags: [{ id: "tag-1", name: "개발" }],
    ...overrides,
  };
}

// --- Tests ---

describe("GET /api/feed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset chain returns
    mockSelect.mockReturnValue(chain);
    mockEq.mockReturnValue(chain);
    mockOrder.mockReturnValue(chain);
    mockLimit.mockReturnValue(chain);
    mockLt.mockReturnValue(chain);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "auth-user-1" } },
      error: null,
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { GET } = await import("@/app/api/feed/route");
    const response = await GET(makeFeedRequest());

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns messages with related data for authenticated user", async () => {
    const messages = [mockMessage()];
    // The last method in the chain resolves the promise
    mockLimit.mockResolvedValue({ data: messages, error: null });

    const { GET } = await import("@/app/api/feed/route");
    const response = await GET(makeFeedRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe("msg-1");
    expect(body.data[0].user.display_name).toBe("김철수");
    expect(body.data[0].channel.name).toBe("general");
    expect(body.data[0].tags).toHaveLength(1);
    expect(body.data[0].urls).toHaveLength(1);
  });

  it("queries only status=complete messages", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const { GET } = await import("@/app/api/feed/route");
    await GET(makeFeedRequest());

    expect(mockFrom).toHaveBeenCalledWith("messages");
    expect(mockEq).toHaveBeenCalledWith("status", "complete");
  });

  it("orders messages by created_at descending", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const { GET } = await import("@/app/api/feed/route");
    await GET(makeFeedRequest());

    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("uses default limit of 20", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const { GET } = await import("@/app/api/feed/route");
    await GET(makeFeedRequest());

    // limit is pageSize + 1 to detect hasMore
    expect(mockLimit).toHaveBeenCalledWith(21);
  });

  it("supports cursor-based pagination via cursor param", async () => {
    const cursor = "2026-03-20T10:00:00Z";
    mockLimit.mockResolvedValue({ data: [], error: null });

    const { GET } = await import("@/app/api/feed/route");
    await GET(makeFeedRequest({ cursor }));

    expect(mockLt).toHaveBeenCalledWith("created_at", cursor);
  });

  it("returns nextCursor when there are more results", async () => {
    // Return 21 messages (pageSize + 1) to indicate hasMore
    const messages = Array.from({ length: 21 }, (_, i) =>
      mockMessage({
        id: `msg-${i}`,
        created_at: `2026-03-${String(20 - i).padStart(2, "0")}T10:00:00Z`,
      })
    );
    mockLimit.mockResolvedValue({ data: messages, error: null });

    const { GET } = await import("@/app/api/feed/route");
    const response = await GET(makeFeedRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    // Should return only 20 items (trim the extra one)
    expect(body.data).toHaveLength(20);
    // nextCursor is the created_at of the last returned item
    expect(body.nextCursor).toBe(body.data[19].created_at);
  });

  it("returns null nextCursor when no more results", async () => {
    const messages = [mockMessage()];
    mockLimit.mockResolvedValue({ data: messages, error: null });

    const { GET } = await import("@/app/api/feed/route");
    const response = await GET(makeFeedRequest());

    const body = await response.json();
    expect(body.nextCursor).toBeNull();
  });

  it("supports custom limit via query param (capped at 50)", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const { GET } = await import("@/app/api/feed/route");
    await GET(makeFeedRequest({ limit: "30" }));

    expect(mockLimit).toHaveBeenCalledWith(31); // 30 + 1
  });

  it("caps limit at 50", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const { GET } = await import("@/app/api/feed/route");
    await GET(makeFeedRequest({ limit: "100" }));

    expect(mockLimit).toHaveBeenCalledWith(51); // 50 + 1
  });

  it("returns 500 on database error", async () => {
    mockLimit.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    const { GET } = await import("@/app/api/feed/route");
    const response = await GET(makeFeedRequest());

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("selects messages with user, channel, urls, tags relations", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const { GET } = await import("@/app/api/feed/route");
    await GET(makeFeedRequest());

    expect(mockSelect).toHaveBeenCalledWith(
      expect.stringContaining("user:user_id")
    );
    expect(mockSelect).toHaveBeenCalledWith(
      expect.stringContaining("channel:channel_id")
    );
    expect(mockSelect).toHaveBeenCalledWith(
      expect.stringContaining("urls")
    );
    expect(mockSelect).toHaveBeenCalledWith(
      expect.stringContaining("tags")
    );
  });
});
