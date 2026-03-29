import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ContentResult } from "../jina-reader.js";
import type { SummaryResult } from "../gemini-summarizer.js";

// Mock dependencies
vi.mock("../jina-reader.js", () => ({
  fetchContent: vi.fn(),
  MAX_URLS: 5,
}));
vi.mock("../gemini-summarizer.js", () => ({
  summarizeContent: vi.fn(),
}));
vi.mock("../db.js", () => ({
  saveSummaryResult: vi.fn(),
}));

import { fetchContent } from "../jina-reader.js";
import { summarizeContent } from "../gemini-summarizer.js";
import { saveSummaryResult } from "../db.js";
import {
  runSummaryPipeline,
  formatSummaryMessage,
  type PipelineContext,
  type PipelineResult,
} from "../summary-pipeline.js";

const mockFetchContent = vi.mocked(fetchContent);
const mockSummarizeContent = vi.mocked(summarizeContent);
const mockSaveSummaryResult = vi.mocked(saveSummaryResult);

function makeContext(overrides?: Partial<PipelineContext>): PipelineContext {
  return {
    urls: ["https://example.com/article"],
    channelId: "C123",
    messageTs: "1234567890.123456",
    userId: "U123",
    teamId: "T123",
    ...overrides,
  };
}

describe("runSummaryPipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveSummaryResult.mockResolvedValue();
  });

  it("returns summary and tags on success", async () => {
    mockFetchContent.mockResolvedValue([
      { url: "https://example.com/article", success: true, content: "Article content" },
    ]);
    mockSummarizeContent.mockResolvedValue({
      success: true,
      summary: ["요약 1", "요약 2", "요약 3"],
      tags: ["개발", "AI"],
    });

    const result = await runSummaryPipeline(makeContext());

    expect(result.success).toBe(true);
    expect(result.summary).toEqual(["요약 1", "요약 2", "요약 3"]);
    expect(result.tags).toEqual(["개발", "AI"]);
  });

  it("calls fetchContent with the provided URLs", async () => {
    const urls = ["https://a.com", "https://b.com"];
    mockFetchContent.mockResolvedValue([
      { url: "https://a.com", success: true, content: "A" },
      { url: "https://b.com", success: true, content: "B" },
    ]);
    mockSummarizeContent.mockResolvedValue({
      success: true,
      summary: ["1", "2", "3"],
      tags: ["tag"],
    });

    await runSummaryPipeline(makeContext({ urls }));

    expect(mockFetchContent).toHaveBeenCalledWith(urls);
  });

  it("passes only successful content to summarizer", async () => {
    mockFetchContent.mockResolvedValue([
      { url: "https://a.com", success: true, content: "Content A" },
      { url: "https://b.com", success: false, error: "HTTP 404" },
    ]);
    mockSummarizeContent.mockResolvedValue({
      success: true,
      summary: ["1", "2", "3"],
      tags: [],
    });

    await runSummaryPipeline(
      makeContext({ urls: ["https://a.com", "https://b.com"] }),
    );

    expect(mockSummarizeContent).toHaveBeenCalledWith([
      { url: "https://a.com", content: "Content A" },
    ]);
  });

  it("fails when all content extractions fail", async () => {
    mockFetchContent.mockResolvedValue([
      { url: "https://a.com", success: false, error: "HTTP 500" },
    ]);

    const result = await runSummaryPipeline(makeContext({ urls: ["https://a.com"] }));

    expect(result.success).toBe(false);
    expect(result.error).toContain("콘텐츠를 추출할 수 없습니다");
  });

  it("fails when summarizer fails", async () => {
    mockFetchContent.mockResolvedValue([
      { url: "https://a.com", success: true, content: "Content" },
    ]);
    mockSummarizeContent.mockResolvedValue({
      success: false,
      error: "Gemini API error",
    });

    const result = await runSummaryPipeline(makeContext({ urls: ["https://a.com"] }));

    expect(result.success).toBe(false);
    expect(result.error).toContain("요약 생성에 실패했습니다");
  });

  it("indicates skipped URLs when more than 5 provided", async () => {
    const urls = Array.from({ length: 7 }, (_, i) => `https://example.com/${i}`);
    mockFetchContent.mockResolvedValue(
      urls.slice(0, 5).map((url) => ({ url, success: true, content: `Content for ${url}` })),
    );
    mockSummarizeContent.mockResolvedValue({
      success: true,
      summary: ["1", "2", "3"],
      tags: [],
    });

    const result = await runSummaryPipeline(makeContext({ urls }));

    expect(result.success).toBe(true);
    expect(result.skippedUrlCount).toBe(2);
  });

  it("sets skippedUrlCount to 0 when 5 or fewer URLs", async () => {
    mockFetchContent.mockResolvedValue([
      { url: "https://a.com", success: true, content: "Content" },
    ]);
    mockSummarizeContent.mockResolvedValue({
      success: true,
      summary: ["1", "2", "3"],
      tags: [],
    });

    const result = await runSummaryPipeline(makeContext());

    expect(result.skippedUrlCount).toBe(0);
  });

  it("saves result to DB on success", async () => {
    mockFetchContent.mockResolvedValue([
      { url: "https://a.com", success: true, content: "Content" },
    ]);
    mockSummarizeContent.mockResolvedValue({
      success: true,
      summary: ["1", "2", "3"],
      tags: ["tag1"],
    });

    const ctx = makeContext();
    await runSummaryPipeline(ctx);

    expect(mockSaveSummaryResult).toHaveBeenCalledWith({
      teamId: ctx.teamId,
      channelId: ctx.channelId,
      userId: ctx.userId,
      messageTs: ctx.messageTs,
      urls: ctx.urls,
      summary: ["1", "2", "3"],
      tags: ["tag1"],
    });
  });

  it("still returns success even if DB save fails", async () => {
    mockFetchContent.mockResolvedValue([
      { url: "https://a.com", success: true, content: "Content" },
    ]);
    mockSummarizeContent.mockResolvedValue({
      success: true,
      summary: ["1", "2", "3"],
      tags: [],
    });
    mockSaveSummaryResult.mockRejectedValue(new Error("DB error"));

    const result = await runSummaryPipeline(makeContext());

    // Pipeline succeeds even if DB save fails — summary was posted to Slack
    expect(result.success).toBe(true);
  });
});

describe("formatSummaryMessage", () => {
  it("formats summary as bullet points", () => {
    const msg = formatSummaryMessage(["요약 1줄", "요약 2줄", "요약 3줄"], 0);
    expect(msg).toBe("• 요약 1줄\n• 요약 2줄\n• 요약 3줄");
  });

  it("appends skipped URL notice when count > 0", () => {
    const msg = formatSummaryMessage(["A", "B", "C"], 3);
    expect(msg).toContain("요약되지 않은 링크 3개");
  });

  it("does not append notice when skippedCount is 0", () => {
    const msg = formatSummaryMessage(["A", "B", "C"], 0);
    expect(msg).not.toContain("요약되지 않은");
  });
});
