# Implications - what they will expect without saying it

| ID | Because (situation, T-id) | They will expect | Confidence | Check |
|---|---|---|---|---|
| IM-1 | Judges score "use of Mubit" (T3) | every Juror and generator call visibly goes through Mubit; a status chip shows MUBIT or MOCK | high | check: grep for provider base URLs outside lib/llm; JR-1 asserts the mode chip |
| IM-2 | Mubit groups tasks by system prompt (BRIEF) | the Juror system prompt never varies per call; brand and taste go in the user message | high | check: unit test asserts the Juror system prompt is a constant |
| IM-3 | Long outputs can fail training (BRIEF) | Juror JSON stays under ~400 characters | high | check: schema validation + length test |
| IM-4 | Expo is noisy and repeated (T1/T2) | the demo works with no audio, in under 60 seconds, and restarts cleanly with a reset button | high | check: JR-1 timing; reset control exists |
| IM-5 | Judges ask "is it learning or a lookup?" (sim panel) | after an override, the next ranking changes for a NEW batch, not the same cards | high | check: JR-2 asserts taste memory used on a fresh batch |
| IM-6 | No Mubit key yet on this machine (args) | everything runs in MOCK mode with fixture outputs, clearly labelled, and switches to Mubit with only .env | high | check: JR-1 in mock; unit test of the mode switch |
| IM-7 | Pika is a design tool judged by designers (T6) | Pika's own UI looks award-level, not like a dashboard template | high | check: judge:brand on screenshots; design-beast direction recorded in DESIGN.md |
| IM-8 | Generated HTML is untrusted model output (T7) | sections render sandboxed with no scripts or network | high | check: iframe sandbox attribute test; CSP |
| IM-9 | Kimberley owns brand (brand/README) | builders read tokens from one tokens file she can overwrite later | high | check: all colours/fonts come from one tokens module |
| IM-10 | Luka works in the repo too (args) | small commits, clear structure, README commands that work on a fresh clone | high | check: fresh-clone install + dev succeeds |
| IM-11 | The scorecard must answer "is the taste real" (sim panel) | real Awwwards scores for held-out sites, with the source link per site | med | check: data file lists source URL per site; judge:data |
| IM-12 | Cost and speed claims will be questioned (T3) | numbers computed from real usage, with method shown | med | check: scorecard shows how cost was computed |
| IM-13 | Generator output can be slow (12 calls) | cards stream in one by one with visible progress, never a frozen screen | high | check: JR-1 sees first card within a few seconds in mock; progress UI |
| IM-14 | Hackathon rule: code written during the event (BRIEF) | no copied old project code | high | check: git history starts 23 Oct |
