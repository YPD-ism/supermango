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
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: messages, nextCursor: null }),
    });

    render(<FeedList />);

    await waitFor(() => {
      expect(screen.getAllByTestId("feed-card")).toHaveLength(2);
    });
  });

  it("shows empty state when no data", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [], nextCursor: null }),
    });

    render(<FeedList />);

    await waitFor(() => {
      expect(screen.getByText(/아직 공유된 링크가 없어요/)).toBeDefined();
      expect(screen.getByText(/봇을 초대/)).toBeDefined();
    });
  });

  it("shows error state with retry button on fetch failure", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<FeedList />);

    await waitFor(() => {
      expect(screen.getByText(/피드를 불러올 수 없습니다/)).toBeDefined();
      expect(screen.getByRole("button", { name: /재시도/ })).toBeDefined();
    });
  });

  it("retries fetch when retry button is clicked", async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [makeFeedMessage("msg-1", "2026-03-28T10:00:00Z")], nextCursor: null }),
      });

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

    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: page1, nextCursor: "2026-03-28T10:00:00Z" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: page2, nextCursor: null }),
      });

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
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [makeFeedMessage("msg-1", "2026-03-28T10:00:00Z")], nextCursor: null }),
    });

    render(<FeedList />);

    await waitFor(() => {
      expect(screen.getAllByTestId("feed-card")).toHaveLength(1);
    });

    intersectionCallback([{ isIntersecting: true }]);

    // fetch should only have been called once (initial load)
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("shows skeleton cards during next page load", async () => {
    const page1 = [makeFeedMessage("msg-1", "2026-03-28T10:00:00Z")];

    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: page1, nextCursor: "2026-03-28T10:00:00Z" }),
      })
      .mockReturnValueOnce(new Promise(() => {})); // hang on second fetch

    render(<FeedList />);

    await waitFor(() => {
      expect(screen.getAllByTestId("feed-card")).toHaveLength(1);
    });

    intersectionCallback([{ isIntersecting: true }]);

    await waitFor(() => {
      expect(screen.getAllByTestId("skeleton-card").length).toBeGreaterThanOrEqual(1);
    });
  });
});
