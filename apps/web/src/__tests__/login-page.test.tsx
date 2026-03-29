import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const mockHandleSlackLogin = vi.fn();

vi.mock("@/lib/auth", () => ({
  handleSlackLogin: (...args: unknown[]) => mockHandleSlackLogin(...args),
}));

import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  beforeEach(() => {
    cleanup();
    mockHandleSlackLogin.mockClear();
  });

  it("renders the Slack login button", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("button", { name: /slack.*로그인/i })
    ).toBeDefined();
  });

  it("calls handleSlackLogin on click", () => {
    render(<LoginPage />);

    const button = screen.getByRole("button", { name: /slack.*로그인/i });
    fireEvent.click(button);

    expect(mockHandleSlackLogin).toHaveBeenCalled();
  });
});
