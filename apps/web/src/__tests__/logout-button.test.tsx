import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

const mockSignOut = vi.fn().mockResolvedValue({});
const mockPush = vi.fn();

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    auth: { signOut: mockSignOut },
  })),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush })),
}));

import LogoutButton from "@/components/logout-button";

describe("LogoutButton", () => {
  beforeEach(() => {
    cleanup();
    mockSignOut.mockClear();
    mockPush.mockClear();
  });

  it("renders logout button", () => {
    render(<LogoutButton />);
    expect(screen.getByText(/로그아웃/)).toBeDefined();
  });

  it("calls signOut and redirects to /login on click", async () => {
    render(<LogoutButton />);

    fireEvent.click(screen.getByText(/로그아웃/));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });
});
