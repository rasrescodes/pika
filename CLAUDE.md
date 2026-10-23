@AGENTS.md

## Commands

- Install: `npm install` (then `npm install-scripts approve esbuild` if npm asks)
- Dev: `npm run dev` (http://localhost:3000)
- Verify: `npm run verify` (tokens, typecheck, unit tests, production build)
- Unit tests: `npm test`
- Tokens from Kimberley's brand files: `npm run tokens`
- Mubit smoke test: `node scripts/mubit-smoke.mjs` (needs `.env`)
- Feasibility spike: `npm run spike:image`, then `npm run spike:task`
- Scorecard run (real calls only): `npm run scorecard`
- Demo-ready check: `npm run check:demo-ready`
- Journeys (dev server running): `~/.claude/skills/oneshot/bin/oneshot-journeys .`
- Deploy: none in v1 (runs on the demo laptop)
