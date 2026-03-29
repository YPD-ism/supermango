import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitForReaction, waitForThreadReplies } from "../e2e/poll-helpers.js";

function makeMockClient() {
  return {
    reactions: {
      get: vi.fn(),
    },
    conversations: {
      replies: vi.fn(),
    },
  };
}

const defaultOpts = {
  channel: "C_TEST",
  timestamp: "1234567890.123456",
  timeoutMs: 500,
  intervalMs: 50,
};

describe("waitForReaction", () => {
  let client: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    client = makeMockClient();
  });

  it("returns true when reaction is found on first poll", async () => {
    client.reactions.get.mockResolvedValue({
      message: {
        reactions: [{ name: "eyes", count: 1 }],
      },
    });

    const result = await waitForReaction(
      client as unknown as Parameters<typeof waitForReaction>[0],
      "eyes",
      defaultOpts,
    );

    expect(result).toBe(true);
    expect(client.reactions.get).toHaveBeenCalledWith({
      channel: "C_TEST",
      timestamp: "1234567890.123456",
      full: true,
    });
  });

  it("returns true when reaction appears after retries", async () => {
    client.reactions.get
      .mockResolvedValueOnce({ message: { reactions: [] } })
      .mockResolvedValueOnce({
        message: { reactions: [{ name: "white_check_mark", count: 1 }] },
      });

    const result = await waitForReaction(
      client as unknown as Parameters<typeof waitForReaction>[0],
      "white_check_mark",
      defaultOpts,
    );

    expect(result).toBe(true);
    expect(client.reactions.get).toHaveBeenCalledTimes(2);
  });

  it("returns false on timeout when reaction never appears", async () => {
    client.reactions.get.mockResolvedValue({
      message: { reactions: [{ name: "other", count: 1 }] },
    });

    const result = await waitForReaction(
      client as unknown as Parameters<typeof waitForReaction>[0],
      "eyes",
      { ...defaultOpts, timeoutMs: 150 },
    );

    expect(result).toBe(false);
  });

  it("handles no reactions at all", async () => {
    client.reactions.get.mockResolvedValue({
      message: {},
    });

    const result = await waitForReaction(
      client as unknown as Parameters<typeof waitForReaction>[0],
      "eyes",
      { ...defaultOpts, timeoutMs: 100 },
    );

    expect(result).toBe(false);
  });
});

describe("waitForThreadReplies", () => {
  let client: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    client = makeMockClient();
  });

  it("returns replies when found", async () => {
    client.conversations.replies.mockResolvedValue({
      messages: [
        { text: "parent message", ts: "1234567890.123456" },
        { text: "• Line 1\n• Line 2\n• Line 3", ts: "1234567891.000000" },
      ],
    });

    const replies = await waitForThreadReplies(
      client as unknown as Parameters<typeof waitForThreadReplies>[0],
      defaultOpts,
    );

    expect(replies).toHaveLength(1);
    expect(replies[0].text).toContain("Line 1");
  });

  it("waits for minimum replies count", async () => {
    client.conversations.replies
      .mockResolvedValueOnce({
        messages: [
          { text: "parent", ts: "1" },
          { text: "reply1", ts: "2" },
        ],
      })
      .mockResolvedValueOnce({
        messages: [
          { text: "parent", ts: "1" },
          { text: "reply1", ts: "2" },
          { text: "reply2", ts: "3" },
          { text: "reply3", ts: "4" },
          { text: "reply4", ts: "5" },
        ],
      });

    const replies = await waitForThreadReplies(
      client as unknown as Parameters<typeof waitForThreadReplies>[0],
      { ...defaultOpts, minReplies: 4 },
    );

    expect(replies).toHaveLength(4);
    expect(client.conversations.replies).toHaveBeenCalledTimes(2);
  });

  it("returns empty array on timeout", async () => {
    client.conversations.replies.mockResolvedValue({
      messages: [{ text: "parent only", ts: "1" }],
    });

    const replies = await waitForThreadReplies(
      client as unknown as Parameters<typeof waitForThreadReplies>[0],
      { ...defaultOpts, timeoutMs: 100 },
    );

    expect(replies).toEqual([]);
  });

  it("handles missing messages field", async () => {
    client.conversations.replies.mockResolvedValue({});

    const replies = await waitForThreadReplies(
      client as unknown as Parameters<typeof waitForThreadReplies>[0],
      { ...defaultOpts, timeoutMs: 100 },
    );

    expect(replies).toEqual([]);
  });
});
