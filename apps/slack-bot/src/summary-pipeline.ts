import { fetchContent, MAX_URLS } from "./jina-reader.js";
import { summarizeContent, type ContentInput } from "./gemini-summarizer.js";
import { saveSummaryResult } from "./db.js";

export interface PipelineContext {
  urls: string[];
  channelId: string;
  messageTs: string;
  userId: string;
  teamId: string;
}

export interface PipelineResult {
  success: boolean;
  summary?: string[];
  tags?: string[];
  skippedUrlCount: number;
  error?: string;
}

export async function runSummaryPipeline(
  ctx: PipelineContext,
): Promise<PipelineResult> {
  const skippedUrlCount = Math.max(0, ctx.urls.length - MAX_URLS);

  // 1. Fetch content via Jina Reader (already limits to 5 internally)
  const contentResults = await fetchContent(ctx.urls);

  // 2. Filter successful results
  const successfulContent: ContentInput[] = contentResults
    .filter((r) => r.success && r.content)
    .map((r) => ({ url: r.url, content: r.content! }));

  if (successfulContent.length === 0) {
    return {
      success: false,
      skippedUrlCount,
      error: "콘텐츠를 추출할 수 없습니다",
    };
  }

  // 3. Summarize with Gemini
  const summaryResult = await summarizeContent(successfulContent);

  if (!summaryResult.success) {
    return {
      success: false,
      skippedUrlCount,
      error: `요약 생성에 실패했습니다: ${summaryResult.error}`,
    };
  }

  // 4. Save to DB (best-effort — don't fail the pipeline if DB save fails)
  try {
    await saveSummaryResult({
      teamId: ctx.teamId,
      channelId: ctx.channelId,
      userId: ctx.userId,
      messageTs: ctx.messageTs,
      urls: ctx.urls,
      summary: summaryResult.summary!,
      tags: summaryResult.tags!,
    });
  } catch (error) {
    console.error("Failed to save summary to DB:", error);
  }

  return {
    success: true,
    summary: summaryResult.summary,
    tags: summaryResult.tags,
    skippedUrlCount,
  };
}

export function formatSummaryMessage(
  summary: string[],
  skippedUrlCount: number,
): string {
  const bullets = summary.map((line) => `• ${line}`).join("\n");

  if (skippedUrlCount > 0) {
    return `${bullets}\n\n> 📌 요약되지 않은 링크 ${skippedUrlCount}개가 있습니다 (최대 5개까지 요약)`;
  }

  return bullets;
}
