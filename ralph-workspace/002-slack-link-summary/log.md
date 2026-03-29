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

### [Reviewer] Round 2
- **Task:** Jina Reader 콘텐츠 추출
- **Status:** ISSUES
- **Tests:** PASS — 54 tests passing (30 shared + 24 slack-bot including 9 jina-reader tests)
- **Lint/Typecheck/Build:** PASS — tsc, eslint, next build all clean with zero warnings
- **QA — Live server:** N/A — backend service with no UI. Acceptance criteria verified via unit tests covering all specified scenarios (single URL, multiple URLs, 5-URL limit, 404/403/500 errors, network timeouts, mixed results, empty input).
- **Code quality (simplify):** ISSUE — `fetchSingleUrl` reads `process.env.JINA_API_KEY` on every invocation (up to 5 times per call). More critically, if `JINA_API_KEY` is unset, the header silently becomes `"Bearer undefined"` and all fetches will fail with confusing 401/403 errors from Jina instead of a clear missing-config error. Fix: read the API key once in `fetchContent`, throw early if missing.
- **Security (manual):** PASS — no injection risks, no hardcoded secrets, URLs proxied through Jina Reader (no direct SSRF), error messages don't leak internals.
- **Design (gstack):** N/A — no UI component
- **Spec alignment:** PASS — matches architecture decisions (Jina Reader for URL→markdown), 5-URL cap aligns with non-goal of >6 URLs, concurrent fetching appropriate for data flow, failure info structured for downstream pipeline.
- **CLAUDE.md update:** N/A — no new patterns or gotchas discovered

### [Coder] Round 3
- **Task:** Jina Reader 콘텐츠 추출
- **Status:** DONE
- **Files changed:**
  - `apps/slack-bot/src/jina-reader.ts` — validate JINA_API_KEY early, pass as parameter to fetchSingleUrl
  - `apps/slack-bot/src/__tests__/jina-reader.test.ts` — added test for missing JINA_API_KEY
- **What was done:** Fixed reviewer issue: moved `process.env.JINA_API_KEY` read from `fetchSingleUrl` (called per-URL) to `fetchContent` (called once). Added early throw if the key is missing or empty, preventing silent `"Bearer undefined"` auth failures. Passed the validated key as a parameter to `fetchSingleUrl`.
- **Self-validation:**
  - ✅ URL을 Jina Reader API로 보내 마크다운 콘텐츠를 받아온다 — existing tests still pass (9 original + 1 new = 10 tests)
  - ✅ 최대 5개 URL만 처리한다 — unchanged, tested
  - ✅ 타임아웃, 404, 페이월 등 실패 케이스를 처리한다 — unchanged, tested
  - ✅ JINA_API_KEY 미설정 시 명확한 에러 발생 — new test confirms throw with "JINA_API_KEY" message
- **CLAUDE.md update:** N/A — fix was straightforward, no new gotchas

### [Reviewer] Round 3
- **Task:** Jina Reader 콘텐츠 추출
- **Status:** PASS
- **CLAUDE.md update:** N/A — no new patterns or gotchas discovered
- **Task DONE**
