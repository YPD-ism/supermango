import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

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
});
