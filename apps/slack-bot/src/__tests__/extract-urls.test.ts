import { describe, it, expect } from "vitest";
import { extractUrls } from "../extract-urls.js";

describe("extractUrls", () => {
  it("extracts a single URL from message text", () => {
    const text = "Check this out: https://example.com/article";
    expect(extractUrls(text)).toEqual(["https://example.com/article"]);
  });

  it("extracts multiple URLs from message text", () => {
    const text =
      "Read https://example.com and https://blog.example.com/post";
    expect(extractUrls(text)).toEqual([
      "https://example.com",
      "https://blog.example.com/post",
    ]);
  });

  it("extracts URLs from Slack's angle-bracket format", () => {
    const text = "Link: <https://example.com/page>";
    expect(extractUrls(text)).toEqual(["https://example.com/page"]);
  });

  it("extracts URLs from Slack's label format", () => {
    const text = "Link: <https://example.com|example.com>";
    expect(extractUrls(text)).toEqual(["https://example.com"]);
  });

  it("returns empty array when no URLs found", () => {
    const text = "No links here, just text";
    expect(extractUrls(text)).toEqual([]);
  });

  it("deduplicates identical URLs", () => {
    const text = "https://example.com and https://example.com again";
    expect(extractUrls(text)).toEqual(["https://example.com"]);
  });

  it("ignores non-http URLs like mailto:", () => {
    const text = "Email me at mailto:test@example.com";
    expect(extractUrls(text)).toEqual([]);
  });

  it("handles mixed Slack-formatted and plain URLs", () => {
    const text =
      "<https://example.com|Example> and https://blog.example.com";
    expect(extractUrls(text)).toEqual([
      "https://example.com",
      "https://blog.example.com",
    ]);
  });
});
