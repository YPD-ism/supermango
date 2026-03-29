import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    auth: { signInWithOAuth: mockSignInWithOAuth },
  })),
}));

import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  beforeEach(() => {
    cleanup();
    mockSignInWithOAuth.mockClear();
  });

  it("renders the Slack login button", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("button", { name: /slack.*로그인/i })
    ).toBeDefined();
  });

  it("calls signInWithOAuth with slack_oidc on click", () => {
    render(<LoginPage />);

    const button = screen.getByRole("button", { name: /slack.*로그인/i });
    fireEvent.click(button);

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: "slack_oidc",
      options: {
        redirectTo: expect.stringContaining("/auth/callback"),
      },
    });
  });
});
