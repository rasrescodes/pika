# OPERATE

How to run Pika. Keep this true as the stack lands.

## First run
1. `cp .env.example .env` and fill in `MUBIT_API_KEY`, `MUBIT_BASE_URL` (from the Mubit console's Connect page) and `MODEL`.
2. `node scripts/mubit-smoke.mjs` should print `200 via ...` and the call should show in the console under **Requests**.

## Running the app
- Development: `npm run dev`, open http://127.0.0.1:3000.
- **Demo: run the production build**: `npm run build && npm start`, open http://127.0.0.1:3000. It is faster, has no dev badge, and is what the journeys prove. If you rebuild, stop the old server first (`lsof -ti tcp:3000 | xargs kill`), or it serves deleted files.
- The server only listens on 127.0.0.1, so nobody on the venue Wi-Fi can reset the demo or spend calls.
- No key: MOCK mode (labelled). Key + MODEL in `.env`: every call goes through Mubit, capped at `PIKA_MAX_CALLS_PER_DAY`.
- Reset between expo judges: the Reset button (clears taste memory and the wall, keeps the brand).
- State lives in `data/state/` (gitignored). Delete it to start completely fresh.
## Running the loop
- Install: `npm install && npx playwright install chromium`.
- Image smoke test (Anthropic route): `npm run smoke:image`. Check the call in **Requests**, with its image.
- One site: `npm run loop -- --sites <dir> --mode image|dom <slug>`. Outputs go to `data/runs/<slug>/<time>-<mode>-<tag>/` (gitignored).
- Scorecard at any time: `npm run report` writes `data/batch/report.md`.

## The overnight batch
- `npm run batch` runs: smoke test, holdout baseline (first shot, no lessons), then up to 4 epochs of train (`--learn`, recorded by Mubit) and holdout eval. It stops at 5,000 LLM calls (`BATCH_MAX_CALLS`) or when holdout stops improving. It can be resumed: rerun it and finished sites are skipped.
- `scripts/start-when-ready.sh` waits until `.env` has `MUBIT_API_KEY` and `data/batch/READY` exists, then starts the batch. `READY` holds its env, one `VAR=value` per line (for example `BATCH_SITES=...`, `DESCRIBER_PROMPT=v2`). It only starts on branch `feat/loop`.
- Progress: `tail -f data/batch/batch.log`. To stop: kill the `tsx src/batch.ts` process. Rerunning resumes.
- Honest notes: holdout calls are sent with `x-middleware-record: metadata`, so Mubit never trains on them. Site labels and the v2 prompts were drafted by our coding agents as dev tooling. No product prompt ran outside Mubit.

## Generator distillation (custom Generator, see changes/2026-10-24-generator-distill.md)
- Detector: `npm i --ignore-scripts impeccable@4.5.2` in a folder outside the repo, then point `IMPECCABLE_BIN` at the native binary `node_modules/@impeccable/cli-darwin-arm64/bin/impeccable`. Not the `.bin/impeccable` launcher: under tsx it hangs and spawns thousands of processes.
- Brands: `npx tsx scripts/gen-brands.ts 24` writes `data/gen/brands.json` (fictional kits; 4 are holdout only).
- Training data: `npx tsx scripts/gen-distill.ts --tag train-skills --split train --variants 1 --skip-judge --concurrency 3` (Sonnet with `generator-skills-v1`, recorded by Mubit).
- Holdout: same script with `--split holdout --variants 2 --concurrency 1`, once per contender: `--tag hold-sonnet-skills`, `--tag hold-sonnet-plain --prompt generator-v1`, and the local student with `--backend local --prompt generator-v1` while `mlx_lm.server` runs (with `--adapter-path` for the fine-tuned one). Holdout calls are not recorded.
- Fine-tune: `npx tsx scripts/gen-dataset.ts train-skills 1`, then `mlx_lm lora` on `data/gen/dataset` (see the Describer local loop for setup).
- Limits: Mubit's starter credit allows 4 calls in flight per project (429 beyond, retried); don't run this beside `npm run batch`. Sonnet 5.5 thinks by default, so `max_tokens` is 16000.
- Honest notes: the training targets are Sonnet's outputs with a prompt condensed from three open skills (credits in `prompts/NOTICE-skills.md`). The detector is someone else's rules and the Juror is a model; neither is a human jury. The local student runs offline.
## The local loop (no Mubit)
- One-off setup: `uv venv .venv --python 3.12 && uv pip install --python .venv/bin/python mlx-lm`, then `.venv/bin/hf download mlx-community/Qwen3-4B-Instruct-2507-4bit` (about 2.3 GB). Apple silicon only.
- `BATCH_SITES=<sites dir> npm run local:batch` scores the rule-based teacher, evaluates the base model on holdout, then per epoch builds a dataset, fine-tunes a LoRA adapter and evaluates it. It starts and stops its own model server on port 8080 and logs to `data/local/local.log`. Rerunning resumes.
- On a 16 GB Mac: one request at a time (`LOCAL_CONCURRENCY=1`, the default; 4 ran the GPU out of memory) and 20 practise sites per epoch (`LOCAL_PRACTISE_SITES`, default 20), about 1.5 minutes per site. The base holdout eval takes about 55 minutes; a full 3-epoch run takes most of a day.
- One site by hand: start `.venv/bin/mlx_lm.server --model mlx-community/Qwen3-4B-Instruct-2507-4bit`, then `LLM_BACKEND=local npm run loop -- --sites <dir> --mode dom <slug>`.
- Honest notes: nothing here reaches Mubit or any provider. The teacher is code we wrote, and the first training targets are its specs. The DOM score compares measurements, which a rule-based transcriber matches well by construction, so read the pixel score beside it. The local adapter is a stand-in for Mubit's: it shows the loop works, not what Mubit's adapter will score.

## Mubit training
- Training needs about 25 kept examples of one task (same system prompt, model, tools, output format).
- There is a daily training cap (resets 00:00 UTC, which is 01:00 UK time until clocks go back on Sunday) and a pause between trainings. Send the Juror batch before midnight so it trains overnight.
- Check progress in the console: **Tasks**, then **Adapters**, then **History**. Compare a passing version in **Try models**.

## Demo
- Backup: record a full, perfect demo run on Saturday evening and keep it on both laptops.
- Anything recorded, simulated or pre-trained in the live demo is stated out loud.

## State at 01:30 Saturday (for whoever picks this up)
- Data: 250 sites on `data/capture` (PR #3), read in place from the capture worktree. Labels for all 250 in `data/labels.json` (28 flagged bad and skipped). Holdout: 19 usable main plus 15 extra (`data/holdout-extra.json`).
- Prompts: v2 pinned. Nothing has run through Mubit yet: no key.
- The watcher is running. Once `.env` has `MUBIT_API_KEY`, it starts `npm run batch` with the env in `data/batch/READY`. If the watcher has died, run `./scripts/start-when-ready.sh` (or just `npm run batch` with those env vars).
- If PR #3 is merged and the worktree removed, change `BATCH_SITES` in `data/batch/READY` to `data/sites`.
- First check after it starts: `tail -f data/batch/batch.log`. The smoke test must pass, and the first baseline scores should be well above 0. Then check Mubit's **Tasks** page: about four tasks should form (Describer image, Describer DOM, Builder, Critic, plus the lessons task).
