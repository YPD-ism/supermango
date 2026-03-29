import type { WebClient } from "@slack/web-api";

export interface PollOptions {
  channel: string;
  timestamp: string;
  timeoutMs: number;
  intervalMs?: number;
}

/**
 * Poll until a specific reaction appears on a message.
 * Returns true if found within timeout, false otherwise.
 */
export async function waitForReaction(
  client: WebClient,
  reactionName: string,
  opts: PollOptions,
): Promise<boolean> {
  const { channel, timestamp, timeoutMs, intervalMs = 3000 } = opts;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await client.reactions.get({
      channel,
      timestamp,
      full: true,
    });

    const reactions = (res.message as { reactions?: Array<{ name: string }> })
      ?.reactions;
    if (reactions?.some((r) => r.name === reactionName)) {
      return true;
    }

    await sleep(intervalMs);
  }
  return false;
}

/**
 * Poll until thread replies appear on a message.
 * Returns the thread messages (excluding the parent) or empty array on timeout.
 */
export async function waitForThreadReplies(
  client: WebClient,
  opts: PollOptions & { minReplies?: number },
): Promise<Array<{ text?: string; blocks?: unknown[] }>> {
  const { channel, timestamp, timeoutMs, intervalMs = 3000, minReplies = 1 } = opts;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await client.conversations.replies({
      channel,
      ts: timestamp,
      limit: 20,
    });

    const messages = res.messages ?? [];
    // First message is the parent; rest are replies
    const replies = messages.slice(1);
    if (replies.length >= minReplies) {
      return replies.map((m) => ({ text: m.text, blocks: m.blocks }));
    }

    await sleep(intervalMs);
  }
  return [];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
