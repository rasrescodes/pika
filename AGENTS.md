# AGENTS.md

Rules for any AI agent (Claude Code, Codex, others) working in Pika. Two humans (Rassa and Luka) and their agents share this repo during a 38-hour hackathon.

## Hard rules
- **Every LLM call goes through Mubit** (base URLs in `docs/BRIEF.md`). No direct provider calls anywhere, including scripts.
- **Keys only from `.env`.** Never hard-code or commit keys. `.env` is gitignored.
- **All code is written during the event** (from Fri 23 Oct 19:30). Open-source libraries are fine; don't paste in old project code.
- **The Juror's system prompt stays fixed** once training starts, because changing it creates a new Mubit task. Version it in `prompts/` and change it on purpose only.
- **Juror output stays short:** scores plus one-line reasons. Long outputs can fail Mubit training.
- **No scraping or copying whole Awwwards sites.** Use our own screenshots and the public scores.

## Working together
- Pull before you start, commit small, push often. Commit messages say what changed and why.
- Work on your own branch and merge to `main` through a quick PR, or agree to commit straight to `main` (decide once, write it here).
- If you change something the other person depends on (a prompt, an API shape, a file layout), say so in the PR or commit message.

## Commands
(Fill in once the stack is chosen.)
- Smoke test Mubit: `node scripts/mubit-smoke.mjs`
- Dev: TBD
- Verify: TBD
