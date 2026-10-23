# Pika

An AI art director that learns your taste. Generator makes on-brand website sections from a brand kit; the Juror scores them like an Awwwards jury; the art director's overrides go through Mubit and become model updates. Built at Night Shift (Mubit hackathon, London, 23 to 25 Oct 2026) by Rassa, Luka and Kimberley. Read `docs/BRIEF.md` (event, tracks, judging, verified Mubit facts) and `docs/PLAN.md` (order of work, split, demo) before changing product behaviour.

## Commands

- Install: `npm install && npx playwright install chromium`
- Smoke test Mubit: `node scripts/mubit-smoke.mjs` (OpenAI route), `npm run smoke:image` (Anthropic route, image input)
- Loop: `npm run loop -- <slug>` or `npm run loop -- --split train [--learn]` (outputs in `data/runs/`, gitignored)
- Score two screenshots: `npm run score -- a.png b.png [masks.json]`
- Verify: `npm run typecheck`
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
