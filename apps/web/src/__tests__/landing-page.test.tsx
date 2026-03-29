import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const mockHandleSlackLogin = vi.fn();

vi.mock("@/lib/auth", () => ({
  handleSlackLogin: (...args: unknown[]) => mockHandleSlackLogin(...args),
}));

import LandingPage from "@/app/page";

describe("LandingPage", () => {
  beforeEach(() => {
    cleanup();
    mockHandleSlackLogin.mockClear();
  });

  it("renders the service name", () => {
    render(<LandingPage />);
    expect(screen.getByText(/Supermango/)).toBeDefined();
  });

  it("renders service introduction content", () => {
    render(<LandingPage />);
    // Should have description of what the service does
    expect(screen.getAllByText(/Slack/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/요약/).length).toBeGreaterThan(0);
  });

  it("renders the Slack login button", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("button", { name: /slack.*로그인/i })
    ).toBeDefined();
  });

  it("calls handleSlackLogin on click", () => {
    render(<LandingPage />);
    const button = screen.getByRole("button", { name: /slack.*로그인/i });
    fireEvent.click(button);

    expect(mockHandleSlackLogin).toHaveBeenCalled();
  });

  it("has dark background styling", () => {
    render(<LandingPage />);
    const main = screen.getByRole("main");
    expect(main).toBeDefined();
  });
});
