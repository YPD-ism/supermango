import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchContent, type ContentResult } from "../jina-reader.js";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.stubEnv("JINA_API_KEY", "test-api-key");
  mockFetch.mockReset();
});

describe("fetchContent", () => {
  it("extracts markdown content from a single URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve("# Hello World\n\nSome content here."),
    });

    const results = await fetchContent(["https://example.com/article"]);

    expect(results).toHaveLength(1);
    expect(results[0].url).toBe("https://example.com/article");
    expect(results[0].success).toBe(true);
    expect(results[0].content).toBe("# Hello World\n\nSome content here.");
    expect(results[0].error).toBeUndefined();
  });

  it("calls Jina Reader API with correct URL and headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve("content"),
    });

    await fetchContent(["https://example.com/page"]);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://r.jina.ai/https://example.com/page",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
          Accept: "text/markdown",
        }),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("processes multiple URLs concurrently", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("Content A"),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("Content B"),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("Content C"),
      });

    const results = await fetchContent([
      "https://a.com",
      "https://b.com",
      "https://c.com",
    ]);

    expect(results).toHaveLength(3);
    expect(results[0].content).toBe("Content A");
    expect(results[1].content).toBe("Content B");
    expect(results[2].content).toBe("Content C");
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("limits to maximum 5 URLs", async () => {
    for (let i = 0; i < 5; i++) {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(`Content ${i}`),
      });
    }

    const urls = Array.from({ length: 8 }, (_, i) => `https://example.com/${i}`);
    const results = await fetchContent(urls);

    expect(results).toHaveLength(5);
    expect(mockFetch).toHaveBeenCalledTimes(5);
  });

  it("handles HTTP error responses (404)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve("Not Found"),
    });

    const results = await fetchContent(["https://example.com/missing"]);

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(false);
    expect(results[0].error).toContain("404");
    expect(results[0].content).toBeUndefined();
  });

  it("handles HTTP error responses (paywall/403)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: () => Promise.resolve("Forbidden"),
    });

    const results = await fetchContent(["https://example.com/paywalled"]);

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(false);
    expect(results[0].error).toContain("403");
  });

  it("handles network/timeout errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("fetch failed"));

    const results = await fetchContent(["https://example.com/timeout"]);

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(false);
    expect(results[0].error).toContain("fetch failed");
  });

  it("handles mixed success and failure results", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("Good content"),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve("Server Error"),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("Also good"),
      });

    const results = await fetchContent([
      "https://a.com",
      "https://b.com",
      "https://c.com",
    ]);

    expect(results).toHaveLength(3);
    expect(results[0].success).toBe(true);
    expect(results[0].content).toBe("Good content");
    expect(results[1].success).toBe(false);
    expect(results[1].error).toContain("500");
    expect(results[2].success).toBe(true);
    expect(results[2].content).toBe("Also good");
  });

  it("returns empty array for empty URL list", async () => {
    const results = await fetchContent([]);
    expect(results).toHaveLength(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
