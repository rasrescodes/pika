# Pika

An AI art director that learns your taste. Generator makes on-brand website sections from a brand kit; the Juror scores them like an Awwwards jury; the art director's overrides go through Mubit and become model updates. Built at Night Shift (Mubit hackathon, London, 23 to 25 Oct 2026) by Rassa, Luka and Kimberley. Read `docs/BRIEF.md` (event, tracks, judging, verified Mubit facts) and `docs/PLAN.md` (order of work, split, demo) before changing product behaviour.

## Commands

- Install: `npm install` (then `npm install-scripts approve esbuild` if npm asks); Chromium comes from postinstall
- Dev: `npm run dev` (http://localhost:3000)
- Verify: `npm run verify` (tokens, typecheck, unit tests, production build)
- Unit tests: `npm test`
- Tokens from Kimberley's brand files: `npm run tokens`
- Feasibility spike: `npm run spike:image`, then `npm run spike:task`
- Scorecard run (real calls only): `npm run scorecard`
- Demo-ready check: `npm run check:demo-ready`
- Journeys (dev server running): `~/.claude/skills/oneshot/bin/oneshot-journeys .`
- Deploy: none in v1 (runs on the demo laptop)
- Smoke test Mubit: `node scripts/mubit-smoke.mjs` (OpenAI route), `npm run smoke:image` (Anthropic route, image input)
- Loop: `npm run loop -- <slug>` or `npm run loop -- --split train [--learn] [--mode image|dom]` (outputs in `data/runs/`, gitignored)
- Score two screenshots: `npm run score -- a.png b.png [masks.json]`
- Deploy: TBD

## Boundaries

- Every LLM call goes through Mubit (base URLs in `docs/BRIEF.md`). No direct provider calls anywhere, including scripts and tests.
- Keys only from `.env` (gitignored). Never hard-code, log or commit keys. Mubit records prompts and replies, so no secrets or personal data in prompts.
- All project code is written during the event (from Fri 23 Oct 19:30). Open-source libraries and our own tooling are fine; no pasting old project code.
- The Juror's system prompt stays fixed once training starts (a changed prompt is a new Mubit task). Version prompts in `prompts/` and change them on purpose only, noted in `DECISIONS.md`.
- Juror output stays short: scores plus one-line reasons. Long outputs can fail Mubit training.
- No scraping or copying whole Awwwards sites. Use our own screenshots plus the public jury scores.
- UI work goes through the design skills (design-beast); no default framework styling. Copy in UK English, no emojis, no em dashes.
- Report honestly: if something is faked, stubbed or recorded for the demo, say so in the demo and in `OPERATE.md`.

## Working together

- Three humans and their agents share this repo: Rassa (generator, the Wall, demo), Luka (Juror, Mubit wiring, scorecard), Kimberley (design: owns `brand/`, see `brand/README.md`). Builders take colours, type and layout from `brand/` and `DESIGN.md`; don't invent brand values. Pull before you start, commit small, push often.
- Branch per task and merge to `main` with a short PR, unless we agree otherwise (record it in `DECISIONS.md`).
- If you change something the other side depends on (a prompt, an API shape, a file layout), say so in the commit message and in `DECISIONS.md`.
- Blocked on a human-only action (keys, accounts, asking the Mubit team)? Add it to `HUMAN-NEEDED.md` and move on.
- Larger proposals that change the plan go in `changes/` as a short note before anyone builds them.

## Project learnings

(Add one line per non-obvious lesson: what happened, what to do instead.)

- `next dev` (Next 16.4) appends a Next.js agent-rules block to this file; commit it, do not fight it. TypeScript 7 removed `baseUrl` from tsconfig.
- npm 11 blocks dependency install scripts until approved: run `npm install-scripts approve esbuild` after a fresh clone if vitest or tsx fail.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
