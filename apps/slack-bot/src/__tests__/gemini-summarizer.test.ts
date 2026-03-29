import { describe, it, expect, vi, beforeEach } from "vitest";
import { summarizeContent, type SummaryResult } from "../gemini-summarizer.js";

// Mock @google/generative-ai
const mockGenerateContent = vi.fn();
vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return { generateContent: mockGenerateContent };
      }
    },
  };
});

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");
  mockGenerateContent.mockReset();
});

function mockGeminiResponse(text: string) {
  mockGenerateContent.mockResolvedValueOnce({
    response: {
      text: () => text,
    },
  });
}

describe("summarizeContent", () => {
  it("generates a 3-bullet summary and tags from content", async () => {
    mockGeminiResponse(
      JSON.stringify({
        summary: [
          "AI 기술이 빠르게 발전하고 있다",
          "GPT-4는 멀티모달 기능을 지원한다",
          "개발자 도구 생태계가 확장되고 있다",
        ],
        tags: ["AI", "GPT-4", "개발"],
      }),
    );

    const result = await summarizeContent([
      { url: "https://example.com/ai", content: "# AI Article\n\nLong content about AI..." },
    ]);

    expect(result.success).toBe(true);
    expect(result.summary).toHaveLength(3);
    expect(result.tags).toEqual(["AI", "GPT-4", "개발"]);
    expect(result.error).toBeUndefined();
  });

  it("combines multiple URL contents into a single summary", async () => {
    mockGeminiResponse(
      JSON.stringify({
        summary: [
          "여러 기술 트렌드를 다루고 있다",
          "프론트엔드와 백엔드 모두 발전 중이다",
          "클라우드 네이티브 접근이 주류가 되고 있다",
        ],
        tags: ["프론트엔드", "백엔드", "클라우드"],
      }),
    );

    const result = await summarizeContent([
      { url: "https://a.com", content: "Frontend content..." },
      { url: "https://b.com", content: "Backend content..." },
      { url: "https://c.com", content: "Cloud content..." },
    ]);

    expect(result.success).toBe(true);
    expect(result.summary).toHaveLength(3);
    expect(result.tags).toHaveLength(3);
    // Verify all contents were passed to the model
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg).toContain("https://a.com");
    expect(callArg).toContain("https://b.com");
    expect(callArg).toContain("https://c.com");
  });

  it("handles API failure and returns error", async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error("API quota exceeded"));

    const result = await summarizeContent([
      { url: "https://example.com", content: "Some content" },
    ]);

    expect(result.success).toBe(false);
    expect(result.error).toContain("API quota exceeded");
    expect(result.summary).toBeUndefined();
    expect(result.tags).toBeUndefined();
  });

  it("throws if GEMINI_API_KEY is not set", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");

    await expect(
      summarizeContent([
        { url: "https://example.com", content: "content" },
      ]),
    ).rejects.toThrow("GEMINI_API_KEY");

    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("handles malformed JSON response from Gemini", async () => {
    mockGeminiResponse("This is not valid JSON");

    const result = await summarizeContent([
      { url: "https://example.com", content: "Some content" },
    ]);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("handles empty content array", async () => {
    const result = await summarizeContent([]);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });

  it("passes content with URL labels in the prompt", async () => {
    mockGeminiResponse(
      JSON.stringify({
        summary: ["요약 1", "요약 2", "요약 3"],
        tags: ["태그"],
      }),
    );

    await summarizeContent([
      { url: "https://example.com/article", content: "Article content here" },
    ]);

    const callArg = mockGenerateContent.mock.calls[0][0];
    expect(callArg).toContain("https://example.com/article");
    expect(callArg).toContain("Article content here");
  });
});
