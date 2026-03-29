### [Coder] Round 1
- **Task:** 공유 링크 생성 API
- **Status:** DONE
- **Files changed:**
  - `apps/web/src/app/api/share/route.ts` (new) — POST endpoint for share token generation
  - `apps/web/src/lib/supabase/service.ts` (new) — Service role Supabase client for RLS-bypassing updates
  - `apps/web/src/__tests__/share-api.test.ts` (new) — 8 tests covering auth, validation, token generation/reuse, error handling
- **What was done:** Implemented `POST /api/share` API endpoint that accepts `{ messageId }` and returns `{ shareToken, shareUrl }`. Uses authenticated client for auth check and message lookup (RLS-filtered), then service role client for updating `share_token` on the message (since RLS only allows SELECT for authenticated users). Reuses existing token if present, generates UUID token if not.
- **Self-validation:**
  - ✅ 메시지 ID로 공유 URL을 요청하면 고유 share_token 기반 URL을 반환한다
  - ✅ 이미 share_token이 있으면 재사용한다
  - ✅ 인증된 사용자만 공유 링크를 생성할 수 있다
- **CLAUDE.md update:** N/A — no new project-wide patterns discovered; service role client is self-contained in one file

### [Reviewer] Round 1
- **Task:** 공유 링크 생성 API
- **Status:** PASS
- **Tests:** PASS — all 84 web tests pass (8 share-api tests)
- **Lint/Typecheck/Build:** PASS — zero warnings
- **QA — Live server:** Verified POST /api/share returns 401 for unauthenticated requests, handles invalid JSON gracefully. Auth gate correctly precedes all other validation.
- **Code quality (simplify):** Fixed: removed unused `status` column from select, simplified token flow to reuse `newToken` directly (eliminated unnecessary `.select()` chain and type cast after update). Kept untyped service client with comment explaining why (Database types resolve UPDATE to `never`).
- **Security (manual):** PASS — auth check before any action, RLS-filtered reads prevent IDOR, parameterized queries prevent SQL injection, `randomUUID()` for cryptographically secure tokens, no leaked internals in error responses, no hardcoded secrets.
- **Design (gstack):** N/A — API-only task
- **Spec alignment:** PASS — share_token UUID matches spec data model, auth requirement aligns with feed UX, `/share/{token}` URL format matches share page route design, existing token reuse correct.
- **CLAUDE.md update:** N/A — service role client pattern is local to share API; Database UPDATE→never constraint is documented in code comment
- **Task DONE**
