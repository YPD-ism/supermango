import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// --- Mocks ---

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

const readChain: Record<string, ReturnType<typeof vi.fn>> = {};
readChain.select = mockSelect.mockReturnValue(readChain);
readChain.eq = mockEq.mockReturnValue(readChain);
readChain.single = mockSingle;

const mockServiceFrom = vi.fn().mockReturnValue(readChain);

vi.mock("@/lib/supabase/service", () => ({
  createSupabaseServiceClient: vi.fn().mockReturnValue({
    from: mockServiceFrom,
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: Record<string, unknown>) => <a {...props}>{children as React.ReactNode}</a>,
}));

vi.mock("next/image", () => ({
  /* eslint-disable @typescript-eslint/no-unused-vars, @next/next/no-img-element, jsx-a11y/alt-text */
  default: ({ fill, unoptimized, sizes, ...rest }: Record<string, unknown>) => <img {...rest} />,
  /* eslint-enable @typescript-eslint/no-unused-vars, @next/next/no-img-element, jsx-a11y/alt-text */
}));

// --- Test Data ---

const mockMessage = {
  id: "msg-1",
  summary: "AI 기술의 최신 트렌드를 정리했습니다\n자연어 처리 분야에서 큰 발전이 있었습니다\nGPT 이후 새로운 패러다임이 등장하고 있습니다",
  card_images: [
    "https://example.com/card1.png",
    "https://example.com/card2.png",
    "https://example.com/card3.png",
  ],
  created_at: "2026-03-28T10:00:00Z",
  share_token: "test-token-123",
  tags: [
    { id: "tag-1", name: "AI" },
    { id: "tag-2", name: "개발" },
  ],
};

// --- Tests ---

describe("SharePage", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockSelect.mockReturnValue(readChain);
    mockEq.mockReturnValue(readChain);
  });

  it("renders summary lines without user/date info", async () => {
    mockSingle.mockResolvedValue({ data: mockMessage, error: null });

    const { default: SharePage } = await import("@/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "test-token-123" }) });
    render(page);

    expect(screen.getByText(/AI 기술의 최신 트렌드를 정리했습니다/)).toBeDefined();
    expect(screen.getByText(/자연어 처리 분야에서 큰 발전이 있었습니다/)).toBeDefined();
    expect(screen.getByText(/GPT 이후 새로운 패러다임이 등장하고 있습니다/)).toBeDefined();
  });

  it("renders tags", async () => {
    mockSingle.mockResolvedValue({ data: mockMessage, error: null });

    const { default: SharePage } = await import("@/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "test-token-123" }) });
    render(page);

    expect(screen.getByText("#AI")).toBeDefined();
    expect(screen.getByText("#개발")).toBeDefined();
  });

  it("renders carousel images", async () => {
    mockSingle.mockResolvedValue({ data: mockMessage, error: null });

    const { default: SharePage } = await import("@/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "test-token-123" }) });
    render(page);

    const images = screen.getAllByRole("img");
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it("renders CTA button linking to landing page", async () => {
    mockSingle.mockResolvedValue({ data: mockMessage, error: null });

    const { default: SharePage } = await import("@/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "test-token-123" }) });
    render(page);

    const cta = screen.getByRole("link", { name: /써보기/i });
    expect(cta).toBeDefined();
    expect(cta.getAttribute("href")).toBe("/");
  });

  it("does not show user name or date", async () => {
    mockSingle.mockResolvedValue({ data: mockMessage, error: null });

    const { default: SharePage } = await import("@/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "test-token-123" }) });
    render(page);

    const content = document.body.textContent || "";
    expect(content).not.toContain("김철수");
    // No relative date like "N시간 전" or absolute date
    expect(content).not.toMatch(/\d+시간 전/);
  });

  it("shows error message for invalid token", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } });

    const { default: SharePage } = await import("@/app/share/[token]/page");
    const page = await SharePage({ params: Promise.resolve({ token: "invalid-token" }) });
    render(page);

    expect(screen.getByText(/유효하지 않/)).toBeDefined();
  });

  it("queries messages by share_token", async () => {
    mockSingle.mockResolvedValue({ data: mockMessage, error: null });

    const { default: SharePage } = await import("@/app/share/[token]/page");
    await SharePage({ params: Promise.resolve({ token: "test-token-123" }) });

    expect(mockServiceFrom).toHaveBeenCalledWith("messages");
    expect(mockEq).toHaveBeenCalledWith("share_token", "test-token-123");
  });
});

describe("generateMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue(readChain);
    mockEq.mockReturnValue(readChain);
  });

  it("returns OG title and description from message summary", async () => {
    mockSingle.mockResolvedValue({ data: mockMessage, error: null });

    const { generateMetadata } = await import("@/app/share/[token]/page");
    const metadata = await generateMetadata({ params: Promise.resolve({ token: "test-token-123" }) });

    expect(metadata.title).toBeDefined();
    expect(metadata.openGraph?.description).toContain("AI 기술의 최신 트렌드를 정리했습니다");
  });

  it("includes first card image as OG image", async () => {
    mockSingle.mockResolvedValue({ data: mockMessage, error: null });

    const { generateMetadata } = await import("@/app/share/[token]/page");
    const metadata = await generateMetadata({ params: Promise.resolve({ token: "test-token-123" }) });

    const images = metadata.openGraph?.images;
    expect(images).toBeDefined();
    expect(Array.isArray(images) ? images[0] : images).toMatchObject({
      url: "https://example.com/card1.png",
    });
  });

  it("returns fallback metadata for invalid token", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } });

    const { generateMetadata } = await import("@/app/share/[token]/page");
    const metadata = await generateMetadata({ params: Promise.resolve({ token: "bad" }) });

    expect(metadata.title).toBeDefined();
  });
});
