import { describe, it, expect, vi } from "vitest";
import { shouldProcessMessage } from "../link-detector.js";

describe("shouldProcessMessage", () => {
  it("returns true for channel message with URLs", () => {
    const event = {
      type: "message" as const,
      channel_type: "channel",
      text: "Check <https://example.com>",
      channel: "C123",
      ts: "1234567890.123456",
      user: "U123",
    };
    expect(shouldProcessMessage(event)).toBe(true);
  });

  it("returns true for group (private channel) message with URLs", () => {
    const event = {
      type: "message" as const,
      channel_type: "group",
      text: "Check <https://example.com>",
      channel: "G123",
      ts: "1234567890.123456",
      user: "U123",
    };
    expect(shouldProcessMessage(event)).toBe(true);
  });

  it("returns false for DM messages", () => {
    const event = {
      type: "message" as const,
      channel_type: "im",
      text: "Check <https://example.com>",
      channel: "D123",
      ts: "1234567890.123456",
      user: "U123",
    };
    expect(shouldProcessMessage(event)).toBe(false);
  });

  it("returns false for mpim (group DM) messages", () => {
    const event = {
      type: "message" as const,
      channel_type: "mpim",
      text: "Check <https://example.com>",
      channel: "G123",
      ts: "1234567890.123456",
      user: "U123",
    };
    expect(shouldProcessMessage(event)).toBe(false);
  });

  it("returns false for messages without URLs", () => {
    const event = {
      type: "message" as const,
      channel_type: "channel",
      text: "Hello everyone!",
      channel: "C123",
      ts: "1234567890.123456",
      user: "U123",
    };
    expect(shouldProcessMessage(event)).toBe(false);
  });

  it("returns false for bot messages (subtype message_changed etc.)", () => {
    const event = {
      type: "message" as const,
      channel_type: "channel",
      text: "Check <https://example.com>",
      channel: "C123",
      ts: "1234567890.123456",
      user: "U123",
      subtype: "bot_message",
    };
    expect(shouldProcessMessage(event)).toBe(false);
  });

  it("returns false for message_changed subtypes", () => {
    const event = {
      type: "message" as const,
      channel_type: "channel",
      text: "Check <https://example.com>",
      channel: "C123",
      ts: "1234567890.123456",
      user: "U123",
      subtype: "message_changed",
    };
    expect(shouldProcessMessage(event)).toBe(false);
  });
});
