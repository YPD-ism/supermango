import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/image", () => ({
  /* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-img-element, jsx-a11y/alt-text */
  default: ({ fill, unoptimized, sizes, ...rest }: Record<string, unknown>) => <img {...rest} />,
  /* eslint-enable @typescript-eslint/no-unused-vars, @next/next/no-img-element, jsx-a11y/alt-text */
}));

import FeedList from "@/components/feed-list";

const makeFeedMessage = (id: string, createdAt: string) => ({
  id,
  summary: "요약 1줄\n요약 2줄\n요약 3줄",
  card_images: [
    "https://example.com/card1.png",
    "https://example.com/card2.png",
    "https://example.com/card3.png",
  ],
  created_at: createdAt,
  user: { id: "user-1", display_name: "김철수", avatar_url: "https://example.com/avatar.png" },
  channel: { id: "ch-1", name: "general", workspace_id: "ws-1" },
  urls: [{ id: "url-1", url: "https://example.com", title: "Example", position: 0 }],
  tags: [{ id: "tag-1", name: "개발" }],
});

let intersectionCallback: (entries: Array<{ isIntersecting: boolean }>) => void;

class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
    intersectionCallback = callback;
  }
}

// Helper: route-based fetch mock. Feed responses are queued; filter APIs return empty data.
function setupFetchMock(feedResponses: Array<{ ok: boolean; data?: unknown[]; nextCursor?: string | null }>) {
  const feedQueue = [...feedResponses];
  const emptyOk = { ok: true, json: () => Promise.resolve({ data: [] }) };

  (fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
    if (typeof url === "string" && url.includes("/api/feed")) {
      const next = feedQueue.shift();
      if (!next) return Promise.resolve(emptyOk);
      if (!next.ok) return Promise.resolve({ ok: false, status: 500 });
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: next.data ?? [], nextCursor: next.nextCursor ?? null }),
      });
    }
    // workspaces/channels API — return empty data
    return Promise.resolve(emptyOk);
  });
}

// Variant that hangs on the Nth feed call
function setupFetchMockWithHang(feedResponses: Array<{ ok: boolean; data?: unknown[]; nextCursor?: string | null }>, hangOnIndex: number) {
  const feedQueue = [...feedResponses];
  let feedCallIndex = 0;
  const emptyOk = { ok: true, json: () => Promise.resolve({ data: [] }) };

  (fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
    if (typeof url === "string" && url.includes("/api/feed")) {
      const idx = feedCallIndex++;
      if (idx === hangOnIndex) return new Promise(() => {}); // hang
      const next = feedQueue.shift();
      if (!next) return Promise.resolve(emptyOk);
      if (!next.ok) return Promise.resolve({ ok: false, status: 500 });
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: next.data ?? [], nextCursor: next.nextCursor ?? null }),
      });
    }
    return Promise.resolve(emptyOk);
  });
}

describe("FeedList", () => {
  beforeEach(() => {
    cleanup();
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows skeleton cards while loading initially", () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));
    render(<FeedList />);
    const skeletons = screen.getAllByTestId("skeleton-card");
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders feed cards after successful fetch", async () => {
    const messages = [
      makeFeedMessage("msg-1", "2026-03-28T10:00:00Z"),
      makeFeedMessage("msg-2", "2026-03-28T09:00:00Z"),
    ];
    setupFetchMock([{ ok: true, data: messages, nextCursor: null }]);

    render(<FeedList />);

    await waitFor(() => {
      expect(screen.getAllByTestId("feed-card")).toHaveLength(2);
    });
  });

  it("shows empty state when no data", async () => {
    setupFetchMock([{ ok: true, data: [], nextCursor: null }]);

    render(<FeedList />);

    await waitFor(() => {
      expect(screen.getByText(/아직 공유된 링크가 없어요/)).toBeDefined();
      expect(screen.getByText(/봇을 초대/)).toBeDefined();
    });
  });

  it("shows error state with retry button on fetch failure", async () => {
    setupFetchMock([{ ok: false }]);

    render(<FeedList />);

    await waitFor(() => {
      expect(screen.getByText(/피드를 불러올 수 없습니다/)).toBeDefined();
      expect(screen.getByRole("button", { name: /재시도/ })).toBeDefined();
    });
  });

  it("retries fetch when retry button is clicked", async () => {
    setupFetchMock([
      { ok: false },
      { ok: true, data: [makeFeedMessage("msg-1", "2026-03-28T10:00:00Z")], nextCursor: null },
    ]);

    render(<FeedList />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /재시도/ })).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: /재시도/ }));

    await waitFor(() => {
      expect(screen.getAllByTestId("feed-card")).toHaveLength(1);
    });
  });

  it("loads more items when sentinel becomes visible", async () => {
    const page1 = [makeFeedMessage("msg-1", "2026-03-28T10:00:00Z")];
    const page2 = [makeFeedMessage("msg-2", "2026-03-28T09:00:00Z")];

    setupFetchMock([
      { ok: true, data: page1, nextCursor: "2026-03-28T10:00:00Z" },
      { ok: true, data: page2, nextCursor: null },
    ]);

    render(<FeedList />);

    await waitFor(() => {
      expect(screen.getAllByTestId("feed-card")).toHaveLength(1);
    });

    // Simulate sentinel becoming visible
    intersectionCallback([{ isIntersecting: true }]);

    await waitFor(() => {
      expect(screen.getAllByTestId("feed-card")).toHaveLength(2);
    });
  });

  it("does not load more when there is no nextCursor", async () => {
    setupFetchMock([{ ok: true, data: [makeFeedMessage("msg-1", "2026-03-28T10:00:00Z")], nextCursor: null }]);

    render(<FeedList />);

    await waitFor(() => {
      expect(screen.getAllByTestId("feed-card")).toHaveLength(1);
    });

    intersectionCallback([{ isIntersecting: true }]);

    // feed fetch should only be called once; filter APIs also call fetch
    const feedCalls = (fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
      (c: string[]) => typeof c[0] === "string" && c[0].includes("/api/feed")
    );
    expect(feedCalls).toHaveLength(1);
  });

  it("shows skeleton cards during next page load", async () => {
    const page1 = [makeFeedMessage("msg-1", "2026-03-28T10:00:00Z")];

    setupFetchMockWithHang(
      [{ ok: true, data: page1, nextCursor: "2026-03-28T10:00:00Z" }],
      1 // hang on second feed call
    );

    render(<FeedList />);

    await waitFor(() => {
      expect(screen.getAllByTestId("feed-card")).toHaveLength(1);
    });

    intersectionCallback([{ isIntersecting: true }]);

    await waitFor(() => {
      expect(screen.getAllByTestId("skeleton-card").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders filter controls", async () => {
    setupFetchMock([{ ok: true, data: [], nextCursor: null }]);

    render(<FeedList />);

    await waitFor(() => {
      expect(screen.getByLabelText("워크스페이스")).toBeDefined();
      expect(screen.getByLabelText("채널")).toBeDefined();
      expect(screen.getByPlaceholderText(/태그 검색/)).toBeDefined();
    });
  });

  it("re-fetches feed with filter params when filters change", async () => {
    const allCalls: string[] = [];

    (fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      allCalls.push(url);
      if (url.includes("/api/workspaces")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [{ id: "ws-1", name: "Alpha", icon_url: null }] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [], nextCursor: null }),
      });
    });

    render(<FeedList />);

    // Wait for initial load and workspaces to populate
    await waitFor(() => {
      expect(screen.getByText(/아직 공유된 링크가 없어요/)).toBeDefined();
      const select = screen.getByLabelText("워크스페이스") as HTMLSelectElement;
      expect(select.options.length).toBeGreaterThan(1);
    });

    const callCountBefore = allCalls.length;

    // Change workspace filter
    fireEvent.change(screen.getByLabelText("워크스페이스"), {
      target: { value: "ws-1" },
    });

    // Wait for a new fetch call that includes the filter param
    await waitFor(() => {
      const newCalls = allCalls.slice(callCountBefore);
      const hasFilteredCall = newCalls.some((url) => url.includes("workspace_id=ws-1"));
      expect(hasFilteredCall).toBe(true);
    }, { timeout: 3000 });
  });
});
