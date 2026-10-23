# Architecture: Pika v1

## Layout
- `app/` Next.js routes: `page.tsx` (the Wall), `brand/page.tsx`, `scorecard/page.tsx`, `not-found.tsx` (redirect to `/`), `api/batch/route.ts` (SSE), `api/correction/route.ts`, `api/reset/route.ts`, `api/brand/route.ts`, `api/state/route.ts`.
- `src/components/` Wall, Card, TasteMemory, CorrectionSheet, ModeChip, BrandForm, ScorecardTable.
- `src/styles/` `tokens.css` (generated), `globals.css`.
- `lib/` `llm.ts` (Mubit client + mock switch), `juror.ts`, `generator.ts`, `mockGenerator.ts`, `sanitise.ts`, `shot.ts`, `taste.ts`, `store.ts`, `rank.ts`, `brands.ts`, `pricing.ts`.
- `prompts/juror-v1.md`, `prompts/generator-v1.md`.
- `scripts/` `mubit-smoke.mjs`, `spike-image.mjs`, `spike-task.mjs`, `tokens.mjs`, `scorecard.ts`, `check-demo-ready.ts`, `make-fixtures.ts`.
- `data/scorecard/`, `data/proof/`, `data/pricing.json`, `data/state/` (gitignored).
- `tests/` vitest unit + component tests.

## Interfaces
- `lib/llm.ts`: `mode(): "MOCK"|"MUBIT"`; `chat({system, user, images?, maxTokens, temperature}) -> {text, usage?, ms, model}`.
- `lib/juror.ts`: `judge({imageDataUrl, brand, taste[]}) -> {scores:{design,usability,creativity,content}, overall, note, tasteApplied, usage?, ms}`; `JUROR_SYSTEM` constant.
- `lib/generator.ts`: `generate({brand, seed}) -> {html, family, usage?, ms}`.
- `lib/sanitise.ts`: `sanitise(html) -> safeHtml` (with CSP meta injected).
- `lib/shot.ts`: `screenshot(safeHtml) -> {dataUrl, requests:number}`.
- `/api/batch` POST {brandId} -> SSE events `card` {id, family, seed, html, scores, overall, note, tasteApplied}, `done` {batchMs}.
- `/api/correction` POST {cardId, toRank?, scores?, reason} -> {taste: TasteItem[]}.
- Card DOM: `data-testid=card`, `data-card-id`, `data-family`, `data-scored`, `data-taste-applied`; children `rank-badge`, `promote`, `drag-handle`; slots `slot-1..12`.

## Waves
- W1 Core: scaffold, deps, scripts, tokens, llm/juror/sanitise/generator(mock)/taste/rank, unit tests.
- W2 Pipeline + Wall: shot, /api/batch SSE, Wall UI, cards, corrections (click + drag + keyboard), taste memory, reset, not-found.
- W3 Brand + scorecard: /brand presets + form, /scorecard + scripts/scorecard.ts + check-demo-ready + pricing.
- W4 Prove: journeys JR-1,2,4,5,6,3 green in MOCK, scan, README/AGENTS/OPERATE Commands, fixtures for the spike.
