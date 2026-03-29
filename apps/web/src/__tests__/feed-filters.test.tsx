import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

import FeedFilters from "@/components/feed-filters";

function mockFetchResponses(responses: Record<string, unknown>) {
  (fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
    for (const [pattern, data] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(data),
        });
      }
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) });
  });
}

const workspaces = [
  { id: "ws-1", name: "Team Alpha", icon_url: null },
  { id: "ws-2", name: "Team Beta", icon_url: null },
];

const channels = [
  { id: "ch-1", name: "general", workspace_id: "ws-1" },
  { id: "ch-2", name: "random", workspace_id: "ws-1" },
  { id: "ch-3", name: "dev", workspace_id: "ws-2" },
];

describe("FeedFilters", () => {
  beforeEach(() => {
    cleanup();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders workspace dropdown, channel dropdown, and tag search input", async () => {
    mockFetchResponses({
      "/api/workspaces": { data: workspaces },
      "/api/channels": { data: channels },
    });

    render(<FeedFilters onFilterChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByLabelText("워크스페이스")).toBeDefined();
      expect(screen.getByLabelText("채널")).toBeDefined();
      expect(screen.getByPlaceholderText(/태그 검색/)).toBeDefined();
    });
  });

  it("populates workspace dropdown with fetched workspaces", async () => {
    mockFetchResponses({
      "/api/workspaces": { data: workspaces },
      "/api/channels": { data: channels },
    });

    render(<FeedFilters onFilterChange={vi.fn()} />);

    await waitFor(() => {
      const select = screen.getByLabelText("워크스페이스") as HTMLSelectElement;
      const options = Array.from(select.options);
      expect(options.map((o) => o.text)).toContain("Team Alpha");
      expect(options.map((o) => o.text)).toContain("Team Beta");
    });
  });

  it("has 'all workspaces' default option", async () => {
    mockFetchResponses({
      "/api/workspaces": { data: workspaces },
      "/api/channels": { data: channels },
    });

    render(<FeedFilters onFilterChange={vi.fn()} />);

    await waitFor(() => {
      const select = screen.getByLabelText("워크스페이스") as HTMLSelectElement;
      expect(select.options[0].text).toMatch(/모든 워크스페이스/);
      expect(select.value).toBe("");
    });
  });

  it("calls onFilterChange with workspace_id when workspace is selected", async () => {
    const onFilterChange = vi.fn();
    mockFetchResponses({
      "/api/workspaces": { data: workspaces },
      "/api/channels": { data: channels },
    });

    render(<FeedFilters onFilterChange={onFilterChange} />);

    await waitFor(() => {
      expect(screen.getByLabelText("워크스페이스")).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText("워크스페이스"), {
      target: { value: "ws-1" },
    });

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ workspace_id: "ws-1" })
    );
  });

  it("populates channel dropdown with fetched channels", async () => {
    mockFetchResponses({
      "/api/workspaces": { data: workspaces },
      "/api/channels": { data: channels },
    });

    render(<FeedFilters onFilterChange={vi.fn()} />);

    await waitFor(() => {
      const select = screen.getByLabelText("채널") as HTMLSelectElement;
      const options = Array.from(select.options);
      expect(options.map((o) => o.text)).toContain("general");
      expect(options.map((o) => o.text)).toContain("random");
    });
  });

  it("has 'all channels' default option", async () => {
    mockFetchResponses({
      "/api/workspaces": { data: workspaces },
      "/api/channels": { data: channels },
    });

    render(<FeedFilters onFilterChange={vi.fn()} />);

    await waitFor(() => {
      const select = screen.getByLabelText("채널") as HTMLSelectElement;
      expect(select.options[0].text).toMatch(/모든 채널/);
      expect(select.value).toBe("");
    });
  });

  it("calls onFilterChange with channel_id when channel is selected", async () => {
    const onFilterChange = vi.fn();
    mockFetchResponses({
      "/api/workspaces": { data: workspaces },
      "/api/channels": { data: channels },
    });

    render(<FeedFilters onFilterChange={onFilterChange} />);

    await waitFor(() => {
      expect(screen.getByLabelText("채널")).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText("채널"), {
      target: { value: "ch-1" },
    });

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ channel_id: "ch-1" })
    );
  });

  it("filters channels by workspace when workspace is selected", async () => {
    mockFetchResponses({
      "/api/workspaces": { data: workspaces },
      "/api/channels": { data: channels },
    });

    render(<FeedFilters onFilterChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByLabelText("워크스페이스")).toBeDefined();
    });

    // Select workspace ws-2, which only has "dev" channel
    fireEvent.change(screen.getByLabelText("워크스페이스"), {
      target: { value: "ws-2" },
    });

    await waitFor(() => {
      const select = screen.getByLabelText("채널") as HTMLSelectElement;
      const options = Array.from(select.options).filter((o) => o.value !== "");
      expect(options).toHaveLength(1);
      expect(options[0].text).toBe("dev");
    });
  });

  it("calls onFilterChange with tag when tag input changes", async () => {
    const onFilterChange = vi.fn();
    mockFetchResponses({
      "/api/workspaces": { data: workspaces },
      "/api/channels": { data: channels },
    });

    render(<FeedFilters onFilterChange={onFilterChange} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/태그 검색/)).toBeDefined();
    });

    fireEvent.change(screen.getByPlaceholderText(/태그 검색/), {
      target: { value: "개발" },
    });

    // Should be called with the tag value (may be debounced, so wait)
    await waitFor(() => {
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ tag: "개발" })
      );
    });
  });

  it("resets channel selection when workspace changes", async () => {
    const onFilterChange = vi.fn();
    mockFetchResponses({
      "/api/workspaces": { data: workspaces },
      "/api/channels": { data: channels },
    });

    render(<FeedFilters onFilterChange={onFilterChange} />);

    await waitFor(() => {
      expect(screen.getByLabelText("채널")).toBeDefined();
    });

    // Select a channel
    fireEvent.change(screen.getByLabelText("채널"), {
      target: { value: "ch-1" },
    });

    // Change workspace — channel should reset
    fireEvent.change(screen.getByLabelText("워크스페이스"), {
      target: { value: "ws-2" },
    });

    const channelSelect = screen.getByLabelText("채널") as HTMLSelectElement;
    expect(channelSelect.value).toBe("");
  });
});
