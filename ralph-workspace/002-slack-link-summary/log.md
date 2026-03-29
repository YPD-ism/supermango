### [Coder] Round 1
- **Task:** Slack Bot 기본 설정 및 링크 감지
- **Status:** DONE
- **Files changed:**
  - `apps/slack-bot/package.json` — added vitest dev dependency and test script
  - `apps/slack-bot/src/extract-urls.ts` — URL extraction utility (Slack-formatted and plain URLs)
  - `apps/slack-bot/src/link-detector.ts` — shouldProcessMessage filter (channel type, subtype, URL presence)
  - `apps/slack-bot/src/index.ts` — wired message listener with 👀 reaction on link detection
  - `apps/slack-bot/src/__tests__/extract-urls.test.ts` — 8 tests for URL extraction
  - `apps/slack-bot/src/__tests__/link-detector.test.ts` — 7 tests for message filtering
- **What was done:** Implemented URL extraction from Slack message text (handles `<url>`, `<url|label>`, and plain URLs with deduplication). Created `shouldProcessMessage` to filter only public/private channel messages with URLs, ignoring DMs, mpim, bot messages, and subtypes. Wired into Bolt `app.message()` handler that adds 👀 reaction on link detection.
- **Self-validation:**
  - ✅ Socket Mode로 Slack에 정상 연결된다 — App configured with socketMode: true, appToken, app.start()
  - ✅ URL이 포함된 채널 메시지를 감지한다 — extractUrls + shouldProcessMessage filter, 15 unit tests passing
  - ✅ 감지 시 원본 메시지에 👀 리액션을 추가한다 — client.reactions.add({ name: "eyes" }) in handler
  - ✅ DM 메시지는 무시한다 — shouldProcessMessage rejects "im" and "mpim" channel types, tested
- **CLAUDE.md update:** Added slack-bot test command

### [Reviewer] Round 1
- **Task:** Slack Bot 기본 설정 및 링크 감지
- **Status:** PASS
- **CLAUDE.md update:** N/A — no new patterns or gotchas discovered
- **Task DONE**

### [Coder] Round 2
- **Task:** Jina Reader 콘텐츠 추출
- **Status:** DONE
- **Files changed:**
  - `apps/slack-bot/src/jina-reader.ts` — Jina Reader content extraction service (fetchContent, ContentResult type)
  - `apps/slack-bot/src/__tests__/jina-reader.test.ts` — 9 tests for content extraction
  - `apps/slack-bot/vitest.config.ts` — exclude dist/ from test discovery (pre-flight fix)
- **What was done:** Implemented `fetchContent()` that calls Jina Reader API (`https://r.jina.ai/{url}`) with Bearer auth and `Accept: text/markdown` header. Fetches URLs concurrently via `Promise.all`, limits to 5 URLs max, handles HTTP errors and network failures gracefully. Each result includes url, success flag, content (on success), and error message (on failure). Uses `AbortSignal.timeout(30s)` for request timeouts.
- **Self-validation:**
  - ✅ URL을 Jina Reader API로 보내 마크다운 콘텐츠를 받아온다 — fetchContent calls r.jina.ai with Accept: text/markdown, 9 unit tests passing
  - ✅ 최대 5개 URL만 처리한다 — urls.slice(0, MAX_URLS) with MAX_URLS=5, tested with 8 URLs → 5 results
  - ✅ 타임아웃, 404, 페이월 등 실패 케이스를 처리한다 — HTTP errors (404, 403, 500) and network errors return {success: false, error: "..."}, tested
- **CLAUDE.md update:** N/A — Jina Reader API usage is straightforward, no non-obvious gotchas discovered
