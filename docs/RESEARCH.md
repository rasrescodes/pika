# Research: the brief, Mubit, Banyan Sapling, the stack, the strategy

Checked on 23 Oct 2026 against `docs.mubit.ai/llms-full.txt`, the Luma event page, and the Banyan Sapling model card on Hugging Face. Anything marked **unknown** needs the Mubit team.

## 1. The brief in one screen
- **Ask:** route every LLM call through Mubit (one base URL change) and show **a correction becoming a model update**, live in the demo.
- **Tracks** (top 3 prizes judged across all of them): 1 recurring tasks with corrections, 2 move a workload from a closed model to a task-adapted open model (quality, cost, latency), 3 fast-changing workloads.
- **Judging, equal weight:** use of Mubit, usefulness, technical execution, demo.
- **Dates:** code freeze Sun 10:00, expo judging 10:30, finalists on stage 12:30. One of us must be there in person.
- **Kickoff talk (Brief.zip):** Mubit intercepts every call, finds recurring tasks, and fine-tunes small models for them. They launched Banyan Sapling today. Nothing new about how corrections work.

## 2. How Mubit actually works
- **Proxy.** Anthropic: `https://api.mubit.ai/anthropic` with the Mubit key as the API key. Keep the model IDs. Send only the Mubit key: an extra credential (for example `ANTHROPIC_AUTH_TOKEN`) gets a `401`. There's no CORS support, so call Mubit from a server or a script, never from the browser.
- **Tasks.** A task is a set of calls that share the same system prompt, model, tools, tool choice and output format. Changing any of these starts a new task. Numbers and IDs in the system prompt are ignored; names are not.
- **Sessions.** Mubit holds back test cases by session. On Anthropic the session comes from `metadata.user_id`. Set it to the site's ID, so every round for one site lands in either training or testing, never both.
- **Training.** The first training runs at about 25 kept examples. Not every call is kept. The status goes `Reviewing examples`, `Training`, then `Testing`. The results are `Passed`, `Below target`, `Prompt only` (the base open model with our prompt already did as well), and a few others.
- **The key fact for our plan: adapters are trained and tested against the provider model's answers.** By default the small model learns to copy the big model, so it gets cheaper and faster but no better. Becoming *better* than the big model's first try needs corrections, and the public docs don't describe a way to send them (the Requests page only has a Rating column). **Unknown:** ask the team tonight.
- **Using an adapter.** No model ID routes to an adapter, so our app can't call one. Comparisons happen in the console's **Try models** page. There's a daily cap on Try models calls and 3 adapter starts per UTC day, and the first start takes a few minutes. **Unknown:** whether the team can expose an adapter to our app at the event.
- **Limits.** One training per day and a pause between trainings. **The cap resets at 00:00 UTC, which is 01:00 London time tonight.** "Examples too long to train on" means the task can't train. A failed training only retries when new examples arrive.
- **Recording controls.** The header `x-middleware-record: metadata` (or `x-middleware-store: false`) keeps a call out of the record and out of training. That lets us decide which calls Mubit learns from.
- **Images.** Image input works through the proxy. On the starter credit the request body is capped at 8 MiB. **Unknown:** whether image calls are kept and trained on. Our plan depends on this.
- **Mubit's other product.** The `@mubit-ai/sdk` memory product (`remember`, `feedback`, `recordOutcome`) is separate from the proxy. The website talks about turning "tests, application checks or human feedback" into prompt and model changes, but the docs pages it links to return 404.

## 3. Banyan Sapling (launched today)
- **What it is:** Mubit's first open model (`MubitLabs/banyan-sapling`, Apache 2.0, research preview). It's a classifier, not a chat model. Given `policy`, `evidence` and `claim` strings, it returns `supported`, `violation`, `insufficient_information` or `inconsistent_context`, a calibrated probability, and `unsure` when it can't decide.
- **Under the hood:** Qwen3-30B-A3B, pruned to 23B stored parameters, with LoRA adapters and a custom head. Runs with Mubit's own loader on Python 3.12 and CUDA, with an H200 as the reference GPU. About 46 GB in BF16.
- **Honest numbers from the model card:** 94% raw accuracy, but only 45% of cases get a calibrated answer. On real contracts, under 1% do.
- **Fit for us: don't build on it.** It reads text only, needs a datacentre GPU, and isn't served through the proxy. Running it ourselves also bends the "every LLM call through Mubit" rule. The one possible stretch: if the Mubit team hosts an endpoint, Sapling could check each Critic fix ("the spec says the headline is left-aligned; the rebuild has it centred"). Ask, but don't plan around it.
- Also launched: **latte/bench**, a benchmark of whether agents improve from a kept note between attempts. That's the same idea as our in-app lessons (section 5), so it's worth mentioning to the judges.

## 4. Stack (recommendation)
| Part | Choice | Why |
| --- | --- | --- |
| Language | TypeScript on Node 22 | One language for scripts and UI |
| LLM client | `@anthropic-ai/sdk`, `baseURL: https://api.mubit.ai/anthropic` | Claude vision for the Describer and Critic. The current smoke script uses the OpenAI route, so add an Anthropic version |
| Models | Describer and Critic: one fixed Claude model (Sonnet 5.5 unless the starter credit says otherwise). Builder: the same or Opus 5.5 | Changing the model starts a new task. Check the starter credit's model list in the console |
| Capture and render | Playwright (Chromium), 1440x900, `deviceScaleFactor: 1`, `reducedMotion: 'reduce'`, wait for fonts | Same settings on both sides, so the comparison is fair |
| Score | `sharp` + `ssim.js` (structure), colour palette distance in Lab (`culori`), edge-map overlap | Deterministic code, no LLM; mask image regions |
| Storage | Files: `data/runs/<site>/<round>/{original.png,spec.md,build.html,build.png,score.json}` | No database to build or break |
| UI | Next.js app router, styles from Kimberley's `brand/` | A page per site showing original vs rebuild by round, plus the score chart |
| Run | Local laptop for the demo, with a recorded backup | Playwright plus a noisy expo hall; no need to deploy |

## 5. Strategy for building this with Mubit
**One trained task: the Describer.** Its system prompt and model never change. The user message carries everything that varies:
- the screenshot;
- on later rounds, the previous spec plus the Critic's fixes;
- a short block of **house lessons**.

Every round of every site then lands in one Mubit task, so 20 sites × 5 rounds gives about 100 examples overnight, well past 25. The Builder and Critic go through Mubit as separate tasks that we don't train.

**Two learning layers, so the demo works whatever the Mubit team says:**
1. **Fast, in-app, live on stage: house lessons.** After each converged site, turn the Critic's repeated fixes into general rules ("headlines are about 1.5x bigger than you estimate", "always give the grid's column count") and add them to the Describer's user message. The system prompt stays fixed, so the task doesn't split. First-shot scores rise within minutes. We built this and can show it honestly.
2. **Slow, through Mubit: a model update.** Overnight, Mubit trains a small open Describer on those calls.
   - **Plan A (if corrections exist):** send the converged spec as the correction for each site's round-1 call. The small model then learns better first tries than the big model gave.
   - **Plan B (if not):** curate what Mubit learns from. Run exploration rounds with `x-middleware-record: metadata`, then replay each site's best round with recording on. Mubit trains only on answers that converged. Demo it as a track 2 story: Try models side by side, plus cost and latency.

**Order of work tonight (before 01:00 London, when the training cap resets):**
1. Add an Anthropic smoke test with an image input through Mubit, and confirm the call shows in Requests with the image.
2. Ask the Mubit team the three questions in `HUMAN-NEEDED.md`, image training first. If images don't train, switch the Describer's input to a compact text summary that Playwright measures from the page (text boxes, fonts, sizes, colours), not the site's code.
3. Capture 20 type-led Awwwards winners and keep 5 back as the held-out scorecard.
4. Freeze Describer v1 in `prompts/` and note it in `DECISIONS.md`.
5. Write the loop runner and the score, run all 15 training sites, and check the task count in the console.

**Demo shape (3 minutes):** a hidden site card; rebuilds appear round by round as the score climbs; reveal the original. Then the first-shot score on the held-out sites before and after the lessons, then the Mubit console (task, adapter `Passed`, Try models side by side) with cost and latency. Anything replayed or recorded gets said out loud and written in `OPERATE.md`.

**Usefulness pitch:** "A client sends a reference site. Pika turns it into a spec any developer or model can build from, and learns your studio's eye for what matters."
