# Log: 카드뉴스 이미지 생성

### [Coder] Round 1
- **Task:** 카드뉴스 이미지 생성 서비스
- **Status:** DONE
- **Files changed:**
  - `apps/slack-bot/package.json` — added satori + @resvg/resvg-js dependencies
  - `apps/slack-bot/src/assets/NotoSansKR-Bold.ttf` — Noto Sans CJK KR Bold font (full Korean support)
  - `apps/slack-bot/src/card-image-generator.ts` — card news image generation service
  - `apps/slack-bot/src/__tests__/card-image-generator.test.ts` — 5 tests for the generator
- **What was done:**
  - Implemented `generateCardImages(summary: string[]): Promise<Buffer[]>` that takes a 3-line summary and produces 3 PNG images (1080x1080)
  - Design: deep navy gradient background (#0a1628 → #1a2744), yellow LinkDigest branding (top-left), card number indicator (top-right), centered bold white summary text, golden accent line (bottom)
  - Uses satori (JSX-like markup → SVG) + @resvg/resvg-js (SVG → PNG) — no browser/Puppeteer needed
  - Bundled Noto Sans CJK KR Bold (OTF, 17MB) for full Korean glyph coverage
  - Font data is cached after first load for performance
- **Self-validation:**
  - ✅ 3줄 요약을 입력받아 3장의 PNG 이미지를 생성한다 — test `returns exactly 3 PNG image buffers` passes
  - ✅ 각 이미지에 요약 1줄이 가독성 좋게 배치된다 — test `each buffer is a valid PNG` + visual inspection confirms centered text with proper font size
  - ✅ 디자인 톤이 spec의 비주얼 톤과 일치한다 — deep navy dark background, bold typography, yellow accent, verified via generated PNG screenshots
- **CLAUDE.md update:** N/A — no new project-wide patterns discovered; satori/resvg usage is internal to card-image-generator

### [Reviewer] Round 1
- **Task:** 카드뉴스 이미지 생성 서비스
- **Status:** PASS
- **Tests:** PASS — all 49 slack-bot tests pass, all 30 shared tests pass (79 total)
- **Lint/Typecheck/Build:** PASS — all clean with zero warnings
- **QA — Live server:** Verified by generating actual card images via script. All 3 acceptance criteria confirmed:
  - ✅ 3줄 요약 → 3장 PNG (156KB, 161KB, 158KB)
  - ✅ 각 이미지에 요약 1줄 가독성 있게 배치 (centered bold white text at 44px)
  - ✅ 디자인 톤 일치 (deep navy gradient, yellow LinkDigest branding, card number indicator, golden accent line)
- **Code quality (simplify):** Fixed 2 issues:
  - Race condition in font caching — concurrent `Promise.all` could trigger 3x file reads of 17MB font. Fixed by caching the promise instead of the result.
  - Weak test assertion — "includes card number" test used `>=1` which passes trivially. Replaced with `Buffer.compare` to verify each card produces distinct output.
- **Security (manual):** PASS — no injection risks (object-based markup), no secrets, no network calls, input validated at boundary
- **Design (gstack):** N/A — backend service, no UI. Visual output inspected via generated PNGs.
- **Spec alignment:** PASS — matches architecture (server-side rendering via satori+resvg), design direction (deep navy + yellow), and demo scenario flow
- **CLAUDE.md update:** N/A — no new project-wide patterns discovered
- **Task DONE**

### [Coder] Round 2
- **Task:** 카드뉴스 업로드 및 Slack 게시
- **Status:** DONE
- **Files changed:**
  - `apps/slack-bot/src/card-news-publisher.ts` — new module: uploadCardImages (Supabase Storage) + updateMessageWithCardImages (DB status update)
  - `apps/slack-bot/src/__tests__/card-news-publisher.test.ts` — 7 tests for upload and DB update
  - `apps/slack-bot/src/index.ts` — integrated card news pipeline after summary success
- **What was done:**
  - Created `card-news-publisher.ts` with two functions:
    - `uploadCardImages(buffers, teamId, channelId, messageTs)` — uploads PNG buffers to Supabase Storage `card-images` bucket with path `{teamId}/{channelId}/{messageTs}/card-{N}.png`, returns public URLs
    - `updateMessageWithCardImages(slackMessageTs, imageUrls)` — finds message by `slack_message_ts`, updates `card_images` array and sets `status` to `complete`
  - Integrated into `index.ts` message handler: after summary ✅, generates card images → uploads to Storage → posts each image to Slack thread (image blocks) → adds 🖼️ (`frame_with_picture`) reaction → updates DB
  - Card news pipeline is isolated in try-catch — failure does not affect summary (✅ stays)
  - DB update is also best-effort (inner try-catch) — Slack posting succeeds even if DB update fails
- **Self-validation:**
  - ✅ 이미지가 Supabase Storage `card-images` 버킷에 업로드된다 — test verifies `storage.from("card-images")` and upload calls
  - ✅ 공개 URL이 생성된다 — test verifies `getPublicUrl()` returns URLs
  - ✅ Slack 스레드에 이미지가 게시된다 — `client.chat.postMessage` with `thread_ts` and image blocks in index.ts
  - ✅ 🖼️ 리액션이 추가된다 — `client.reactions.add({ name: "frame_with_picture" })` after posting images
  - ✅ DB의 message 상태가 complete로 업데이트되고 이미지 URL이 저장된다 — test verifies update with `{ card_images, status: "complete" }`
  - ✅ 카드뉴스 생성 실패 시에도 요약은 유지된다 — card news block wrapped in try-catch after ✅ reaction
- **CLAUDE.md update:** N/A — no new project-wide patterns; Supabase Storage usage follows existing db.ts patterns

### [Reviewer] Round 2
- **Task:** 카드뉴스 업로드 및 Slack 게시
- **Status:** PASS
- **Tests:** PASS — all 55 slack-bot tests pass, all 30 shared tests pass (85 total)
- **Lint/Typecheck/Build:** PASS — all clean with zero warnings
- **QA — Live server:** Verified all 6 acceptance criteria against code and integration:
  - ✅ 이미지가 Supabase Storage `card-images` 버킷에 업로드된다 — `storage.from("card-images")` + `bucket.upload()` with parallel `Promise.all`
  - ✅ 공개 URL이 생성된다 — `bucket.getPublicUrl(filePath)` returns public URLs
  - ✅ Slack 스레드에 이미지가 게시된다 — `chat.postMessage` with `thread_ts` and image blocks
  - ✅ 🖼️ 리액션이 추가된다 — `reactions.add({ name: "frame_with_picture" })` after posting
  - ✅ DB의 message 상태가 complete로 업데이트되고 이미지 URL이 저장된다 — direct update by `slack_message_ts`
  - ✅ 카드뉴스 생성 실패 시에도 요약은 유지된다 — card news block in separate try-catch after ✅ reaction
- **Code quality (simplify):** Fixed 3 issues:
  - Extracted duplicate `getClient()` from `card-news-publisher.ts` and `db.ts` into shared `supabase-client.ts` with `getServiceRoleClient()`
  - Parallelized image uploads with `Promise.all` instead of sequential for loop (~400ms savings)
  - Eliminated select-then-update pattern — direct update by `slack_message_ts` (one DB round trip instead of two)
- **Security (manual):** PASS — no injection risks (Supabase SDK parameterized queries), no hardcoded secrets, no path traversal risk, error messages don't leak internals
- **Design (gstack):** N/A — backend service, no UI
- **Spec alignment:** PASS — matches architecture (Supabase Storage + DB update), data model (card_images[] + status=complete), reaction flow (👀→✅→🖼️), demo scenario
- **CLAUDE.md update:** N/A — no new project-wide patterns discovered
- **Task DONE**

### [QA] Round 1
- **Story:** 003-card-news-generation
- **Status:** ISSUES
- **Tests:** PASS — all 55 slack-bot tests pass, all 30 shared tests pass (85 total)
- **Lint/Typecheck/Build:** PASS — all clean with zero warnings
- **QA — Cross-task integration:** PASS — all 6 story acceptance criteria verified against code:
  - ✅ 요약 완료 후 비동기로 카드뉴스 이미지 3장 생성 (generateCardImages in try-catch after ✅)
  - ✅ Supabase Storage `card-images` 버킷에 업로드 (uploadCardImages with Promise.all)
  - ✅ Slack 스레드에 별도 메시지로 게시 (chat.postMessage with image blocks)
  - ✅ 🖼️ 리액션 추가 (reactions.add frame_with_picture)
  - ✅ DB message 상태 complete 업데이트 + 이미지 URL 저장 (updateMessageWithCardImages)
  - ✅ 카드뉴스 생성 실패 시 요약 유지 (separate try-catch after ✅ reaction)
- **Code quality (simplify):** 2 issues found:
  1. **Sequential image posting:** `index.ts:107-120` — 3 card images posted to Slack sequentially in a for-loop. These are independent API calls and should use `Promise.all()` for ~2x faster posting.
  2. **Duplicate teamId extraction:** `index.ts:60` and `index.ts:100` both extract `(context as { teamId?: string }).teamId ?? "unknown"` — should extract once into a variable at the top of the handler.
- **Security (manual):** PASS — no injection risks (satori object markup, Supabase SDK parameterized queries), no hardcoded secrets, error messages don't leak internals, all external inputs from trusted Slack context
- **Design (gstack):** N/A — backend service, no UI
- **Spec alignment:** PASS — matches architecture (satori+resvg server-side rendering), data model (card_images[] + status=complete), storage (card-images bucket), reaction flow (👀→✅→🖼️), async separation, demo scenario
- **Findings:**
  1. `index.ts:107-120` — Change sequential `for...of` loop posting card images to `Promise.all()` for concurrency
  2. `index.ts:60,100` — Extract `teamId` once at the top of the handler instead of duplicating the cast+fallback expression
