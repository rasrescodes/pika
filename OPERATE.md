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
