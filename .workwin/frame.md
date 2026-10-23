# Frame: Pika v1

Source of truth: `.oneshot/SPEC.md` (Codex spec review PASS round 5; approved by Rassa's "full send", contract fb71d396542d3483). This frame restates it; it does not change it.

Problem: taste doesn't scale. Studios review dozens of design options a day.
Outcome: a judge watches Pika generate 12 on-brand hero sections, the Juror rank them like an Awwwards jury, then overrules the Juror once and sees the next batch ranked their way; the scorecard shows Juror vs real jury, big vs small, cost and speed.
Money moment (10 seconds): the judge drags card #7 to the top, types "braver type", hits Generate, and the new batch reshuffles with that family near the top, while the taste memory rail shows their note as a review pull-quote.

## Acceptance criteria
1. AC-1 `/` opens on a ready Wall with a mode chip (MOCK or MUBIT); Generate produces 12 sandboxed, scored, ranked cards within 60 s (JR-1).
2. AC-2 A correction (click path) is saved, shown in taste memory, and the promoted family ranks visibly higher in the next fresh batch (JR-2).
3. AC-3 A real mouse drag of #7 onto slot 1 saves a correction that persists across reload (JR-6).
4. AC-4 `/scorecard` shows method, cost/latency section and either real results or the honest empty state (JR-3); demo-ready only with the validator PASS (JR-3D).
5. AC-5 Unknown routes land on the Wall; `/brand` shows Pika and Mubit presets and the form (JR-4).
6. AC-6 Fits 1920x1080 with no horizontal scroll; reset clears taste memory (JR-5).
7. AC-7 All LLM calls go through lib/llm.ts to MUBIT_BASE_URL only; Juror system prompt constant; output validated and short (unit tests).
8. AC-8 Generated HTML cannot run scripts or make network requests (sanitiser + CSP + sandbox + blocked screenshot browser; unit tests).
9. AC-9 `npm run verify` passes on a fresh clone; README/AGENTS Commands updated.
