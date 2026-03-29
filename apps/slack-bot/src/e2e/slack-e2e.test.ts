/**
 * Slack Bot E2E Test
 *
 * Sends real messages to a Slack test channel and verifies the bot's
 * reaction and thread reply flow. Requires:
 *   - SLACK_TEST_USER_TOKEN: A user token (xoxp-*) with chat:write scope
 *   - SLACK_TEST_CHANNEL_ID: Channel where the bot is present
 *   - The bot must be running and listening
 *
 * Run: pnpm test:e2e:slack
 */
import { describe, it, expect, afterAll } from "vitest";
import { WebClient } from "@slack/web-api";
import { waitForReaction, waitForThreadReplies } from "./poll-helpers.js";

const userToken = process.env.SLACK_TEST_USER_TOKEN;
const channelId = process.env.SLACK_TEST_CHANNEL_ID;

if (!userToken || !channelId) {
  throw new Error(
    "Missing SLACK_TEST_USER_TOKEN or SLACK_TEST_CHANNEL_ID env vars",
  );
}

const userClient = new WebClient(userToken);

// Track messages for cleanup
const sentMessageTimestamps: string[] = [];

afterAll(async () => {
  // Clean up: delete all test messages
  for (const ts of sentMessageTimestamps) {
    try {
      await userClient.chat.delete({ channel: channelId!, ts });
    } catch {
      // Best-effort cleanup — ignore errors
    }
  }
});

async function sendTestMessage(text: string): Promise<string> {
  const res = await userClient.chat.postMessage({
    channel: channelId!,
    text,
  });
  const ts = res.ts!;
  sentMessageTimestamps.push(ts);
  return ts;
}

describe("Slack Bot E2E", () => {
  it(
    "processes a valid link: 👀 → ✅ → summary thread → 🖼️ → card images",
    async () => {
      // Send a message with a valid URL
      const ts = await sendTestMessage(
        "[e2e-test] https://example.com Check this link",
      );

      const pollOpts = { channel: channelId!, timestamp: ts };

      // 1. Wait for 👀 or ✅ (👀 is transient — may already be replaced by ✅)
      const hasEyesOrCheck = await waitForReaction(userClient, "eyes", {
        ...pollOpts,
        timeoutMs: 30_000,
        intervalMs: 2000,
      }).then(async (found) => {
        if (found) return true;
        // eyes may have been removed already; check for ✅
        return waitForReaction(userClient, "white_check_mark", {
          ...pollOpts,
          timeoutMs: 5000,
          intervalMs: 1000,
        });
      });
      expect(hasEyesOrCheck).toBe(true);

      // 2. Wait for ✅ reaction (summary complete) — 60s timeout
      const hasSummaryReaction = await waitForReaction(
        userClient,
        "white_check_mark",
        { ...pollOpts, timeoutMs: 60_000, intervalMs: 3000 },
      );
      expect(hasSummaryReaction).toBe(true);

      // 3. Verify summary thread reply exists
      const summaryReplies = await waitForThreadReplies(userClient, {
        ...pollOpts,
        timeoutMs: 10_000,
        intervalMs: 2000,
        minReplies: 1,
      });
      expect(summaryReplies.length).toBeGreaterThanOrEqual(1);
      // Summary should contain bullet points
      const summaryText = summaryReplies[0].text ?? "";
      expect(summaryText.length).toBeGreaterThan(0);

      // 4. Wait for 🖼️ reaction (card images complete) — 120s timeout
      const hasCardReaction = await waitForReaction(
        userClient,
        "frame_with_picture",
        { ...pollOpts, timeoutMs: 120_000, intervalMs: 5000 },
      );
      expect(hasCardReaction).toBe(true);

      // 5. Verify card image thread replies (3 card images + 1 summary = 4 replies)
      const allReplies = await waitForThreadReplies(userClient, {
        ...pollOpts,
        timeoutMs: 10_000,
        intervalMs: 2000,
        minReplies: 4,
      });
      expect(allReplies.length).toBeGreaterThanOrEqual(4);

      // Check that at least some replies have image blocks
      const imageReplies = allReplies.filter((r) =>
        Array.isArray(r.blocks) &&
        r.blocks.some(
          (b: { type?: string }) => b.type === "image",
        ),
      );
      expect(imageReplies.length).toBeGreaterThanOrEqual(3);
    },
    { timeout: 180_000 },
  );

  it(
    "handles invalid URL: 👀 → ❌ → error thread",
    async () => {
      // Send a message with an invalid/unreachable URL
      const ts = await sendTestMessage(
        "[e2e-test] https://this-url-does-not-exist-at-all-12345.invalid/page",
      );

      const pollOpts = { channel: channelId!, timestamp: ts };

      // 1. Wait for processing to start (👀 or ❌)
      const hasEyesOrX = await waitForReaction(userClient, "eyes", {
        ...pollOpts,
        timeoutMs: 30_000,
        intervalMs: 2000,
      }).then(async (found) => {
        if (found) return true;
        return waitForReaction(userClient, "x", {
          ...pollOpts,
          timeoutMs: 5000,
          intervalMs: 1000,
        });
      });
      expect(hasEyesOrX).toBe(true);

      // 2. Wait for ❌ reaction (failure) — 60s timeout
      const hasFailReaction = await waitForReaction(userClient, "x", {
        ...pollOpts,
        timeoutMs: 60_000,
        intervalMs: 3000,
      });
      expect(hasFailReaction).toBe(true);

      // 3. Verify error message in thread
      const replies = await waitForThreadReplies(userClient, {
        ...pollOpts,
        timeoutMs: 10_000,
        intervalMs: 2000,
        minReplies: 1,
      });
      expect(replies.length).toBeGreaterThanOrEqual(1);
      // Error message should contain failure indicator
      const errorText = replies[0].text ?? "";
      expect(errorText).toContain("❌");
    },
    { timeout: 120_000 },
  );
});
