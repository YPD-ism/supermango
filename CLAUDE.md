# Supermango

Ralph loop engine with planner, coder, and reviewer for autonomous feature implementation.
(Ralphton!!)

## Skills

- `/ralph.planner` — Interactive brainstorming, generates spec.md, story.md, tasks.md, and progress.json
- `ralph.coder` — TDD implementation of a single task
- `ralph.reviewer` — QA, design, code quality, and security review

## Running

- `pnpm loop` — Start headless autonomous loop
- `pnpm loop:once` — Run single interactive iteration

## Conventions

- Skills live in `.claude/skills/{skill-name}/SKILL.md`
- Engine scripts live in `ralph-engine/` directory
- Feature specs and tasks live in `ralph-workspace/` directory
- Global state tracked in `ralph-workspace/progress.json`
- Coder and reviewer communicate via `ralph-workspace/NNN-{userstory}/log.md`
- All log.md entries are append-only
- Commit every modification with conventional commit messages
- When searching for documentation, use the `find-docs` skill (Context7) first before using WebSearch

## LinkDigest Project

- **Monorepo:** Turborepo + pnpm workspaces (`apps/web`, `apps/slack-bot`, `packages/shared`)
- **Lint:** `apps/web` uses ESLint flat config (`eslint.config.mjs`) with `eslint .` — do NOT use `next lint`
- **Dev:** `pnpm dev` runs all apps, `pnpm dev --filter web` / `pnpm dev --filter slack-bot` for individual
- **Slack bot:** exits cleanly with env var message if `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_APP_TOKEN` are missing
- **DB Migrations:** SQL files in `supabase/migrations/` — run on hosted Supabase (no local CLI)
- **Tests:** `packages/shared` and `apps/slack-bot` use vitest (`pnpm test --filter @linkdigest/shared`, `pnpm test --filter slack-bot`), `pnpm test` runs all
- **Slack bot architecture:** `extract-urls.ts` parses Slack-formatted URLs (`<url>`, `<url|label>`) and plain URLs; `link-detector.ts` has `shouldProcessMessage` filter; `index.ts` wires Bolt message listener
