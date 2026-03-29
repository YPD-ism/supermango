import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.0-flash";

export interface ContentInput {
  url: string;
  content: string;
}

export interface SummaryResult {
  success: boolean;
  summary?: string[];
  tags?: string[];
  error?: string;
}

function buildPrompt(contents: ContentInput[]): string {
  const contentBlocks = contents
    .map(
      (c, i) =>
        `[URL ${i + 1}] ${c.url}\n${c.content}`,
    )
    .join("\n\n---\n\n");

  return `아래 URL들의 콘텐츠를 읽고, 전체 내용을 합산하여 한국어로 불릿 3줄 요약과 관련 태그를 생성해주세요.

규칙:
- summary: 정확히 3개의 문장으로 핵심 내용을 요약 (각 문장은 한 줄)
- tags: 내용과 관련된 키워드 태그 (최소 1개, 최대 5개)
- JSON 형식으로만 응답

응답 형식:
{"summary": ["요약1", "요약2", "요약3"], "tags": ["태그1", "태그2"]}

콘텐츠:
${contentBlocks}`;
}

export async function summarizeContent(
  contents: ContentInput[],
): Promise<SummaryResult> {
  if (contents.length === 0) {
    return { success: false, error: "No content to summarize" };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });

  try {
    const prompt = buildPrompt(contents);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const parsed = JSON.parse(text) as {
      summary: string[];
      tags: string[];
    };

    if (
      !Array.isArray(parsed.summary) ||
      !Array.isArray(parsed.tags)
    ) {
      return {
        success: false,
        error: "Invalid response format from Gemini",
      };
    }

    return {
      success: true,
      summary: parsed.summary,
      tags: parsed.tags,
    };
  } catch (err) {
    if (err instanceof SyntaxError) {
      return {
        success: false,
        error: "Failed to parse Gemini response as JSON",
      };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
