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

## Mubit training
- Training needs about 25 kept examples of one task (same system prompt, model, tools, output format).
- There is a daily training cap (resets 00:00 UTC, which is 01:00 UK time until clocks go back on Sunday) and a pause between trainings. Send the Juror batch before midnight so it trains overnight.
- Check progress in the console: **Tasks**, then **Adapters**, then **History**. Compare a passing version in **Try models**.

## Demo
- Backup: record a full, perfect demo run on Saturday evening and keep it on both laptops.
- Anything recorded, simulated or pre-trained in the live demo is stated out loud.
