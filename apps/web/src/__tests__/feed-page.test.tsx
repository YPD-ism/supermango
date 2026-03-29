import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    auth: { signOut: vi.fn().mockResolvedValue({}) },
  })),
}));

describe("FeedPage", () => {
  beforeEach(() => {
    cleanup();
    mockGetUser.mockReset();
  });

  it("renders user email and logout button", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", email: "test@test.com" } },
    });

    const { default: FeedPage } = await import("@/app/feed/page");
    const page = await FeedPage();
    render(page);

    expect(screen.getByText(/test@test.com/)).toBeDefined();
    expect(screen.getByText(/로그아웃/)).toBeDefined();
  });
});
