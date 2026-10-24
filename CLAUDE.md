@AGENTS.md

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
