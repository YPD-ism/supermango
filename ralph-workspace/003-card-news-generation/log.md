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
