@AGENTS.md

## Commands

- Install: `npm install && npx playwright install chromium`
- Smoke test Mubit: `node scripts/mubit-smoke.mjs` (OpenAI route), `npm run smoke:image` (Anthropic route, image input)
- Loop: `npm run loop -- <slug>` or `npm run loop -- --split train [--learn] [--mode image|dom]` (outputs in `data/runs/`, gitignored)
- Score two screenshots: `npm run score -- a.png b.png [masks.json]`
- Verify: `npm run typecheck`
