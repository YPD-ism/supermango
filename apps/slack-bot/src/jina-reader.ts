export const MAX_URLS = 5;
const TIMEOUT_MS = 30_000;
const JINA_READER_BASE = "https://r.jina.ai/";

export interface ContentResult {
  url: string;
  success: boolean;
  content?: string;
  error?: string;
}

async function fetchSingleUrl(
  url: string,
  apiKey: string,
): Promise<ContentResult> {
  try {
    const response = await fetch(`${JINA_READER_BASE}${url}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "text/markdown",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        url,
        success: false,
        error: `HTTP ${response.status}`,
      };
    }

    const content = await response.text();
    return { url, success: true, content };
  } catch (err) {
    return {
      url,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function fetchContent(urls: string[]): Promise<ContentResult[]> {
  if (urls.length === 0) return [];

  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) {
    throw new Error("JINA_API_KEY environment variable is not set");
  }

  const limited = urls.slice(0, MAX_URLS);
  return Promise.all(limited.map((url) => fetchSingleUrl(url, apiKey)));
}
