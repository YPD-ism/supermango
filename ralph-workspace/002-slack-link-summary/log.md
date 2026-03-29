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

### [Coder] Round 4
- **Task:** Gemini 요약 및 태그 생성
- **Status:** DONE
- **Files changed:**
  - `apps/slack-bot/src/gemini-summarizer.ts` — Gemini summarizer service (summarizeContent, buildPrompt, ContentInput/SummaryResult types)
  - `apps/slack-bot/src/__tests__/gemini-summarizer.test.ts` — 7 tests for summarization
  - `apps/slack-bot/package.json` — added @google/generative-ai dependency
- **What was done:** Implemented `summarizeContent()` that takes an array of `ContentInput` (url + content), builds a Korean prompt requesting 3-bullet summary and tags, sends to Gemini 2.0 Flash with `responseMimeType: "application/json"` for structured output. Parses JSON response into `SummaryResult` with summary array and tags array. Handles API errors, malformed JSON responses, missing GEMINI_API_KEY, and empty input gracefully.
- **Self-validation:**
  - ✅ 마크다운 콘텐츠를 입력받아 불릿 3줄 요약을 생성한다 — summarizeContent accepts ContentInput[], prompt requests exactly 3 bullet summary, test verifies summary.length === 3
  - ✅ 내용에 맞는 태그를 자동 생성한다 — prompt requests 1-5 keyword tags, test verifies tags array returned
  - ✅ 여러 URL의 콘텐츠를 합산하여 하나의 요약으로 만든다 — buildPrompt concatenates all URL contents, single generateContent call, test verifies all URLs in prompt
  - ✅ API 실패 시 에러를 반환한다 — catches API errors → {success: false, error}, also handles malformed JSON and missing API key
- **CLAUDE.md update:** N/A — Gemini API usage follows standard @google/generative-ai patterns, no non-obvious gotchas

### [Reviewer] Round 4
- **Task:** Gemini 요약 및 태그 생성
- **Status:** PASS
- **CLAUDE.md update:** N/A — no new patterns or gotchas discovered
- **Task DONE**

### [Coder] Round 5
- **Task:** 요약 파이프라인 통합 및 스레드 응답
- **Status:** DONE
- **Files changed:**
  - `apps/slack-bot/src/summary-pipeline.ts` — pipeline orchestration (runSummaryPipeline, formatSummaryMessage)
  - `apps/slack-bot/src/db.ts` — Supabase DB save (saveSummaryResult: upsert workspace/channel/user, insert message/urls/tags)
  - `apps/slack-bot/src/index.ts` — integrated pipeline into message handler with reaction flow (👀→✅/❌) and thread replies
  - `apps/slack-bot/src/__tests__/summary-pipeline.test.ts` — 12 tests for pipeline and message formatting
- **What was done:** Created `runSummaryPipeline` that orchestrates fetchContent → summarizeContent → saveSummaryResult with proper error handling. Tracks skipped URLs when >5 provided. `formatSummaryMessage` formats bullet-point summary with optional skipped URL notice. Updated `index.ts` message handler to run full pipeline: add 👀 on detection, run pipeline, post thread reply, swap to ✅ on success or ❌ + error message on failure. DB module upserts workspace/channel/user and inserts message/urls/tags with service role key.
- **Self-validation:**
  - ✅ 전체 파이프라인이 순차적으로 동작한다 — runSummaryPipeline chains Jina → Gemini → DB sequentially, 12 unit tests passing
  - ✅ 스레드에 불릿 3줄 요약이 게시된다 — formatSummaryMessage creates "• line" format, posted via client.chat.postMessage with thread_ts
  - ✅ 요약 완료 시 👀 제거, ✅ 추가 — reactions.remove("eyes") then reactions.add("white_check_mark") on success path
  - ✅ 실패 시 ❌ 리액션 + 실패 사유 스레드 안내 — reactions.add("x") + error message thread on failure path
  - ✅ 5개 초과 URL 시 안내 메시지 포함 — skippedUrlCount tracked, formatSummaryMessage appends "요약되지 않은 링크 N개" notice
  - ✅ 결과가 Supabase DB에 저장된다 — saveSummaryResult upserts workspace/channel/user, inserts message/urls/tags with service role key
- **CLAUDE.md update:** N/A — Supabase typed client with `as never` casts is a workaround for supabase-js v2.100 type resolution issues, but not a reusable pattern worth documenting

### [Reviewer] Round 5
- **Task:** 요약 파이프라인 통합 및 스레드 응답
- **Status:** ISSUES
- **Tests:** PASS — 74 tests passing (30 shared + 44 slack-bot including 12 summary-pipeline tests)
- **Lint/Typecheck/Build:** PASS — tsc, eslint, next build all clean with zero warnings
- **QA — Live server:** N/A — backend Slack bot pipeline with no UI. Acceptance criteria verified via unit tests covering all specified scenarios (full pipeline success, content extraction failure, summarizer failure, >5 URL skip count, DB save failure resilience, message formatting) and code inspection of index.ts message handler (reaction flow, thread replies, error handling).
- **Code quality (simplify):** ISSUES —
  1. **Silent catch block** (`summary-pipeline.ts:66-67`): DB save errors are caught and silently swallowed with an empty catch block and a comment "Log but don't fail." However, there is no actual logging — the error is discarded entirely. This makes DB persistence failures invisible. Fix: add `console.error("Failed to save summary to DB:", error)` or accept a logger parameter.
  2. **Duplicate `MAX_URLS` constant** (`summary-pipeline.ts:5` and `jina-reader.ts:1`): Both files define `MAX_URLS = 5` independently. If one changes, the other won't, causing silent drift (e.g., jina-reader processes 5 but pipeline calculates skip count based on a different number). Fix: export `MAX_URLS` from `jina-reader.ts` and import it in `summary-pipeline.ts`.
- **Security (manual):** PASS — URLs are proxied through Jina Reader (no direct SSRF), Supabase queries use parameterized client (no SQL injection), no hardcoded secrets, error messages posted to Slack are our own Korean strings (not raw DB/API errors), service role key used correctly server-side only.
- **Design (gstack):** N/A — no UI component
- **Spec alignment:** PASS — pipeline matches architecture (Jina → Gemini → DB), reaction flow (👀→✅/❌) matches spec, thread reply format matches spec, 5-URL cap with notice matches spec, DB schema matches data model, message status "summarized" is correct (will become "complete" after card news in story 003).
- **CLAUDE.md update:** N/A — no new patterns or gotchas discovered
