# Feasibility spike: Mubit carries the Juror

Premise: Mubit (1) forwards a chat call with an image, (2) groups 30 Juror calls with one constant system prompt into ONE task and queues training, (3) has or lacks a way for a correction to reach the adapter.

Permitted actions: send calls through Mubit with the team's own key and provider/starter credit; read the Mubit console. Nothing else.
Guards (floor): no secrets in prompts (Mubit records content); no real personal data; images are our own screenshots or generated sections; spend capped at 40 calls for the spike.
Success evidence: `scripts/spike-image.mjs` prints 200 and a valid Juror JSON; console Requests shows it; after `scripts/spike-task.mjs`, console Tasks shows one Juror task with >= 25 kept examples or "Waiting for more examples: k of 25"; Mubit's answer on corrections written to INSIGHTS.md.
Stop condition: image call returns 4xx twice with a correct key -> switch the Juror input to the text-description fallback (SPEC STOP conditions).
Timebox: 45 minutes once a key exists. Decision deadline: Sat 24 Oct 10:00 UK.

Status 2026-10-23 21:00: BLOCKED on key (no MUBIT_API_KEY on this machine). Scripts ready. Build proceeds in MOCK per SPEC; this spike is in HUMAN-NEEDED.md.
