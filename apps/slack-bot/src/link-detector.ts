import { extractUrls } from "./extract-urls.js";

interface SlackMessageEvent {
  type: string;
  channel_type?: string;
  text?: string;
  channel: string;
  ts: string;
  user?: string;
  subtype?: string;
}

/**
 * Determine if a Slack message event should be processed for link summarization.
 *
 * Returns true when:
 * - The message is from a public channel or private channel (not DM/mpim)
 * - The message has no subtype (regular user message)
 * - The message text contains at least one URL
 */
export function shouldProcessMessage(event: SlackMessageEvent): boolean {
  // Ignore messages with subtypes (bot_message, message_changed, etc.)
  if (event.subtype) {
    return false;
  }

  // Only process public channels and private channels (groups)
  const allowedTypes = ["channel", "group"];
  if (!event.channel_type || !allowedTypes.includes(event.channel_type)) {
    return false;
  }

  // Check for URLs in message text
  if (!event.text) {
    return false;
  }

  const urls = extractUrls(event.text);
  return urls.length > 0;
}
