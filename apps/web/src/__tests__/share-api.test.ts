import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockGetUser = vi.fn();

// Chain for read queries (select → eq → single)
const readChain: Record<string, ReturnType<typeof vi.fn>> = {};
readChain.select = mockSelect.mockReturnValue(readChain);
readChain.eq = mockEq.mockReturnValue(readChain);
readChain.single = mockSingle;

const mockFrom = vi.fn().mockReturnValue(readChain);

// Service role chain for updates (update → eq)
const mockServiceUpdate = vi.fn();
const mockServiceEq = vi.fn();

const serviceChain: Record<string, ReturnType<typeof vi.fn>> = {};
serviceChain.update = mockServiceUpdate.mockReturnValue(serviceChain);
serviceChain.eq = mockServiceEq;

const mockServiceFrom = vi.fn().mockReturnValue(serviceChain);

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock("@/lib/supabase/service", () => ({
  createSupabaseServiceClient: vi.fn().mockReturnValue({
    from: mockServiceFrom,
  }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}));

// --- Helpers ---

function makeShareRequest(body: Record<string, unknown> = {}) {
  return new Request("http://localhost:3000/api/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// --- Tests ---

describe("POST /api/share", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue(readChain);
    mockEq.mockReturnValue(readChain);
    mockServiceUpdate.mockReturnValue(serviceChain);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "auth-user-1" } },
      error: null,
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { POST } = await import("@/app/api/share/route");
    const response = await POST(makeShareRequest({ messageId: "msg-1" }));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 when messageId is missing", async () => {
    const { POST } = await import("@/app/api/share/route");
    const response = await POST(makeShareRequest({}));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 404 when message is not found", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } });

    const { POST } = await import("@/app/api/share/route");
    const response = await POST(makeShareRequest({ messageId: "msg-nonexistent" }));

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns existing share_token if message already has one", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "msg-1", share_token: "existing-token" },
      error: null,
    });

    const { POST } = await import("@/app/api/share/route");
    const response = await POST(makeShareRequest({ messageId: "msg-1" }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.shareToken).toBe("existing-token");
    expect(body.shareUrl).toContain("existing-token");
    // Should NOT call update when token already exists
    expect(mockServiceFrom).not.toHaveBeenCalled();
  });

  it("generates and saves new share_token when message has none", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "msg-1", share_token: null },
      error: null,
    });
    mockServiceEq.mockResolvedValue({ error: null });

    const { POST } = await import("@/app/api/share/route");
    const response = await POST(makeShareRequest({ messageId: "msg-1" }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.shareToken).toBeDefined();
    expect(body.shareUrl).toContain(body.shareToken);
    // Should update via service role client
    expect(mockServiceFrom).toHaveBeenCalledWith("messages");
    expect(mockServiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ share_token: expect.any(String) })
    );
    expect(mockServiceEq).toHaveBeenCalledWith("id", "msg-1");
  });

  it("queries messages table with message ID", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "msg-1", share_token: "tok" },
      error: null,
    });

    const { POST } = await import("@/app/api/share/route");
    await POST(makeShareRequest({ messageId: "msg-1" }));

    expect(mockFrom).toHaveBeenCalledWith("messages");
    expect(mockSelect).toHaveBeenCalledWith("id, share_token");
    expect(mockEq).toHaveBeenCalledWith("id", "msg-1");
  });

  it("returns 500 when database update fails", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "msg-1", share_token: null },
      error: null,
    });
    mockServiceEq.mockResolvedValue({
      error: { message: "Update failed" },
    });

    const { POST } = await import("@/app/api/share/route");
    const response = await POST(makeShareRequest({ messageId: "msg-1" }));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns share URL with /share/ path prefix", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "msg-1", share_token: "my-token", status: "complete" },
      error: null,
    });

    const { POST } = await import("@/app/api/share/route");
    const response = await POST(makeShareRequest({ messageId: "msg-1" }));

    const body = await response.json();
    expect(body.shareUrl).toMatch(/\/share\/my-token$/);
  });
});
