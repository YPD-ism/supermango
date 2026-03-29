/**
 * Extract URLs from Slack message text.
 *
 * Slack formats URLs as <https://url> or <https://url|label>.
 * Plain https:// URLs may also appear in text.
 */
export function extractUrls(text: string): string[] {
  const urls: string[] = [];

  // Match Slack-formatted URLs: <https://...|label> or <https://...>
  const slackUrlRegex = /<(https?:\/\/[^|>]+)(?:\|[^>]*)?>/g;
  let match: RegExpExecArray | null;

  // Track which portions of text are covered by Slack-formatted URLs
  const coveredRanges: Array<[number, number]> = [];

  while ((match = slackUrlRegex.exec(text)) !== null) {
    urls.push(match[1]);
    coveredRanges.push([match.index, match.index + match[0].length]);
  }

  // Match plain URLs not inside angle brackets
  const plainUrlRegex = /https?:\/\/[^\s<>]+/g;
  while ((match = plainUrlRegex.exec(text)) !== null) {
    const pos = match.index;
    const isCovered = coveredRanges.some(
      ([start, end]) => pos >= start && pos < end,
    );
    if (!isCovered) {
      urls.push(match[0]);
    }
  }

  // Deduplicate while preserving order
  return [...new Set(urls)];
}
