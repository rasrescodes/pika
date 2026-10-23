# Pika

An AI art director that learns your taste.

Pika generates on-brand website sections from a client's brand kit, then a critic model, the Juror, scores every version the way an Awwwards jury does (design, usability, creativity, content). When the art director overrides the Juror, that correction goes through Mubit and becomes a model update, so the next batch is ranked the way they would rank it.

Built at Night Shift, the Mubit hackathon (London, 23 to 25 Oct 2026), by Rassa and Luka.

## Why it fits the brief
- **Recurring task:** design critique. Every studio reviews dozens of options a day.
- **Corrections become model updates:** the art director's overrides train the Juror through Mubit.
- **Own your intelligence layer (main track):** a small trained critic is cheap enough to judge 100 designs instead of 5. Show quality, cost and speed against the big model side by side.

## Start here
- `docs/BRIEF.md`: the event, tracks, judging, and verified Mubit facts.
- `docs/PLAN.md`: what we build, in order, and who does what.
- `AGENTS.md`: rules for any AI agent working in this repo.

## Setup
```bash
npm install
cp .env.example .env   # add MUBIT_API_KEY and MODEL; without them Pika runs in MOCK mode
npm run dev            # http://localhost:3000
```

## How it works
- **The Wall** (`/`): Generate makes 12 hero sections for the current brand (one per layout family), screenshots each one in a locked-down browser, and the **Juror** scores it (design, usability, creativity, content). Cards are ranked by score.
- **Corrections**: drag a card, click Move to top, or Score it yourself, and say why. The correction goes into **taste memory**, which travels in every later Juror call through Mubit, so the next batch is judged your way. Mubit trains its small model on those calls.
- **Brand kit** (`/brand`): Pika or Mubit presets, or your own.
- **Scorecard** (`/scorecard`): the Juror against real Awwwards jury scores, big model against Mubit's small model, cost and speed. Only recorded numbers; see `data/scorecard/README.md`.

## MOCK mode (no key)
Sections come from 12 built-in templates and the Juror is rule-based: fixed per-layout scores, and each correction moves that layout family up (+1.5) or down (-1). The header shows MOCK. Add a key to switch to real calls through Mubit.

## Safety
- Generated HTML can't run scripts or load anything: sanitised, CSP, sandboxed iframe, and a JavaScript-off, network-blocked screenshot browser.
- Spend cap: at most `PIKA_MAX_CALLS_PER_DAY` model calls a day (default 300; one batch is 24). Calls over the cap are refused, never charged.
