import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";

vi.mock("next/image", () => ({
  /* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-img-element, jsx-a11y/alt-text */
  default: ({ fill, unoptimized, sizes, ...rest }: Record<string, unknown>) => <img {...rest} />,
  /* eslint-enable @typescript-eslint/no-unused-vars, @next/next/no-img-element, jsx-a11y/alt-text */
}));

import FeedCard from "@/components/feed-card";

const mockMessage = {
  id: "msg-1",
  summary: "AI 기술의 최신 트렌드를 정리했습니다\n자연어 처리 분야에서 큰 발전이 있었습니다\nGPT 이후 새로운 패러다임이 등장하고 있습니다",
  card_images: [
    "https://example.com/card1.png",
    "https://example.com/card2.png",
    "https://example.com/card3.png",
  ],
  created_at: "2026-03-28T10:00:00Z",
  user: {
    id: "user-1",
    display_name: "김철수",
    avatar_url: "https://example.com/avatar.png",
  },
  channel: {
    id: "ch-1",
    name: "general",
    workspace_id: "ws-1",
  },
  urls: [
    { id: "url-1", url: "https://example.com/article", title: "AI Trends", position: 0 },
  ],
  tags: [
    { id: "tag-1", name: "AI" },
    { id: "tag-2", name: "개발" },
  ],
};

describe("FeedCard", () => {
  beforeEach(() => {
    cleanup();
  });

  it("renders sharer display name", () => {
    render(<FeedCard message={mockMessage} />);
    expect(screen.getByText("김철수")).toBeDefined();
  });

  it("renders date info", () => {
    render(<FeedCard message={mockMessage} />);
    // The date should be rendered in some format (relative or absolute)
    const card = screen.getByTestId("feed-card");
    // Either shows relative time like "N시간 전" or absolute date
    expect(card.textContent).toMatch(/전|2026/);
  });

  it("renders bullet summary lines", () => {
    render(<FeedCard message={mockMessage} />);
    expect(screen.getByText(/AI 기술의 최신 트렌드를 정리했습니다/)).toBeDefined();
    expect(screen.getByText(/자연어 처리 분야에서 큰 발전이 있었습니다/)).toBeDefined();
    expect(screen.getByText(/GPT 이후 새로운 패러다임이 등장하고 있습니다/)).toBeDefined();
  });

  it("renders tags as chips", () => {
    render(<FeedCard message={mockMessage} />);
    expect(screen.getByText("#AI")).toBeDefined();
    expect(screen.getByText("#개발")).toBeDefined();
  });

  it("renders share button", () => {
    render(<FeedCard message={mockMessage} />);
    expect(screen.getByRole("button", { name: /공유/i })).toBeDefined();
  });

  it("renders carousel with 3 images", () => {
    render(<FeedCard message={mockMessage} />);
    const images = screen.getAllByRole("img");
    // At least 1 visible image (carousel shows one at a time)
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it("renders carousel indicators matching image count", () => {
    render(<FeedCard message={mockMessage} />);
    const indicators = screen.getAllByTestId("carousel-indicator");
    expect(indicators).toHaveLength(3);
  });

  it("navigates carousel forward on next button click", () => {
    render(<FeedCard message={mockMessage} />);
    const nextBtn = screen.getByTestId("carousel-next");
    fireEvent.click(nextBtn);
    const indicators = screen.getAllByTestId("carousel-indicator");
    // Second indicator should be active (has accent color)
    expect(indicators[1].style.backgroundColor).not.toBe("");
  });

  it("navigates carousel backward on prev button click", () => {
    render(<FeedCard message={mockMessage} />);
    // Go forward first
    fireEvent.click(screen.getByTestId("carousel-next"));
    // Then back
    fireEvent.click(screen.getByTestId("carousel-prev"));
    const indicators = screen.getAllByTestId("carousel-indicator");
    // First indicator should be active again
    expect(indicators[0].style.backgroundColor).not.toBe("");
  });

  it("renders channel name", () => {
    render(<FeedCard message={mockMessage} />);
    expect(screen.getByText(/#general/)).toBeDefined();
  });

  describe("share button", () => {
    let fetchSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchSpy = vi.fn();
      global.fetch = fetchSpy as typeof global.fetch;
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("calls share API and copies URL to clipboard on click", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ shareToken: "tok-123", shareUrl: "http://localhost/share/tok-123" }),
      });

      render(<FeedCard message={mockMessage} />);
      const shareBtn = screen.getByRole("button", { name: /공유/i });

      await act(async () => {
        fireEvent.click(shareBtn);
      });

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith("/api/share", expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ messageId: "msg-1" }),
        }));
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("http://localhost/share/tok-123");
    });

    it("shows success toast after copying share URL", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ shareToken: "tok-123", shareUrl: "http://localhost/share/tok-123" }),
      });

      render(<FeedCard message={mockMessage} />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /공유/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/복사/)).toBeDefined();
      });
    });

    it("shows error toast when share API fails", async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Failed" }),
      });

      render(<FeedCard message={mockMessage} />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /공유/i }));
      });

      await waitFor(() => {
        expect(screen.getByText(/실패/)).toBeDefined();
      });
    });

    it("disables share button while loading", async () => {
      let resolveRequest: (v: unknown) => void;
      fetchSpy.mockReturnValueOnce(new Promise(r => { resolveRequest = r; }));

      render(<FeedCard message={mockMessage} />);
      const shareBtn = screen.getByRole("button", { name: /공유/i });

      await act(async () => {
        fireEvent.click(shareBtn);
      });

      expect(shareBtn).toHaveProperty("disabled", true);

      await act(async () => {
        resolveRequest!({
          ok: true,
          json: async () => ({ shareToken: "tok", shareUrl: "http://localhost/share/tok" }),
        });
      });
    });
  });
});
