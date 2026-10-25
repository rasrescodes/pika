# Pika

**Make your section look designed, not generated.**

AI-made web pages all share the same tells: gradient text, glows, eyebrow chips, side stripes, filler words. Big brands now ship pages written by LLMs, and they need those pages to look like their brand, not like every other AI page. Pika takes a page or a section, finds the tells, and redesigns it to award-level craft while keeping your words, colours and fonts. Every redesign goes through Mubit, which keeps the good ones so Pika's own small model can learn the taste.

Built at Night Shift, the Mubit hackathon (London, 23 to 25 Oct 2026), by Rassa, Luka and Kimberley.

- **Live:** https://pika-ui-production.up.railway.app (Pika UI: paste a page, check it for free, redesign it through Mubit).
- **Demo video:** shows the live site checking an AI-looking page, redesigning it and checking it again, then how the redesigns feed training through Mubit.

## What it does

1. **Check (free, about 0.5 s).** Impeccable's 62 design rules read your HTML and flag the AI tells.
2. **Redesign (about 20 s for a section).** Claude Sonnet 5.5, through Mubit, redesigns the page with craft rules condensed from three open design skills (`prompts/improver-skills-v2.md`). Your copy and brand stay; the findings go.
3. **Check again.** The same rules score the result, so you get before and after in numbers, not a promise. The AI-looking sample goes from 15 findings to 0; a 7.5k-character landing page from 43 to 0.
4. **Learn.** Mubit records each redesign (opt out with `"record": false`) and those become training data for Pika's own model.

API: `POST /v1/check`, `POST /v1/improve`, `GET /v1/status`. See `api/README.md`.

## How Pika uses Mubit

Every model call in this repo goes through Mubit (`lib/llm.ts`, `src/mubit.ts`, `api/server.mjs`). Held-out evaluation calls send `x-middleware-record: metadata` so they never leak into training.

| Mubit task | What it is | What we measured |
|---|---|---|
| Pika UI redesigns | Live API: Sonnet with the skills prompt | Recorded unless the user opts out |
| Generator distillation | Sonnet with `generator-skills-v1` makes on-brand sections from fictional brand kits; only sections with zero detector findings become training data | 220 + 67 sections made, 228 clean |
| Describer loop | Sonnet rebuilds a captured Awwwards hero from a screenshot or DOM, scored by pixel and DOM similarity, with lessons fed back | DOM holdout 77.7 to 85.7 after epoch 1 (31 paired sites) |
| Juror / Jury mode | Sonnet scores sites like the Awwwards jury; each miss against the real jury score becomes a calibration note | 178 recorded training calls, results below |

### Results (held-out, measured)

Same model, 24 held-out briefs, only the prompt changes:

| Contender | Juror /10 | Detector findings per page | Clean pages |
|---|---|---|---|
| Local Qwen3 4B, untrained | 4.87 | 1.12 | 12/24 |
| Sonnet, plain prompt | 7.30 | 3.95 | 4/22 |
| **Sonnet, Pika skills prompt** | **7.17** | **0.21** | **21/24** |
| Local 4B, fine-tuned (round 2) | 4.91 | 1.42 | 12/24 |

- The skills prompt cuts AI tells by about 94% and broken layouts from 6 to 0, at the same quality.
- The distilled small model is not there yet: round 2 is level with the untrained model on the Juror. Round 3 (adds the layouts round 2 never saw) was still training at code freeze.

**Jury mode** (34 held-out Awwwards Sites of the Day, against free baselines):

| | Before | After | Free baseline |
|---|---|---|---|
| Average miss on overall score | 0.23 | 0.177 | 0.109 (guess the average) |
| Picks the jury's preferred site of a pair | 36% | 29% | 50% |
| Names the criterion the jury rewarded most | 47% | 33% | 47% |

Calibration removed most of the Juror's bias, but it does not beat simple guessing: every Site of the Day scores between 7.15 and 8.18, so the spread is too tight to rank. We report it because the baselines make that impossible to hide. Raw runs in `data/jury/`.

## Repo map

- `api/`: Pika UI (first called Pika Polish), the live API and site (Node, deployed on Railway).
- `app/`, `lib/`: the Next.js studio app. The Wall (`/wall`) generates 12 hero sections for a brand, the Juror ranks them, and the art director's overrides go into taste memory. Also `/jury`, `/scorecard`, `/sites`, `/brand`.
- `src/`: the Describer loop, Mubit batch runner and the local fine-tuning loop (MLX, Apple silicon).
- `scripts/`: Generator distillation (`gen-*.ts`, `scripts/runs/`), Jury mode, smoke tests.
- `prompts/`: every prompt, versioned. Skills credits in `prompts/NOTICE-skills.md`.
- `data/`: captured sites, Jury runs, generated training sections.
- `brand/`: Kimberley's brand (logo, guidelines, tokens).
- `docs/ACTION-PLAN.md`: the training plan and the latest numbers. `OPERATE.md`: how to run each part.

## Run it

```bash
npm install
cp .env.example .env    # MUBIT_API_KEY and MODEL; without them the studio runs in MOCK mode
npm run dev             # studio on http://localhost:3000
cd api && npm install && npm run dev   # Pika UI API and site
npm run verify          # tokens, typecheck, tests, production build
```

## Honest limits

- The detector is Impeccable's rules and the Juror is a model; neither is a human jury.
- The evidence on the live page comes from generated sections in the holdout exam, not from redesigns of existing pages.
- The local fine-tuned models run offline as stand-ins for a Mubit-trained adapter; the trained adapter can only be compared in Mubit's console today.
- Training targets are Sonnet's outputs with a prompt condensed from open skills: Impeccable by Paul Bakaus (Apache 2.0), awwwards-skill by Alessandro Boni (MIT) and claude-skill-awwwards by tponscr-debug (MIT per its README). Not affiliated with Awwwards.
- Generated HTML never runs scripts: sanitised, CSP, sandboxed iframes, and a JavaScript-off, network-blocked screenshot browser. A daily call cap and per-address limits stop runaway spend.
