

## Reviewer (codex) -> FAIL

1. [P0] “If Mubit exposes a correction/rating API … `lib/corrections.ts` also forwards it” leaves corrections in a local file by default. That cannot demonstrate the promised correction becoming a Mubit model update. - `.oneshot/SPEC.md`, `docs/BRIEF.md` - Prove the correction path with Mubit before building the demo around it; define what the demo shows if that path remains unavailable.
2. [P0] “`data-taste-applied=true` when >= 1 taste example was included” would pass even if a fresh batch kept the same ranking. - `.oneshot/SPEC.md`, `.oneshot/journeys.json` JR-2 - Check a controlled new batch before and after the correction and assert the intended ranking change.
3. [P0] “No scorecard run yet” is an allowed scorecard outcome, while JR-3 checks only headings and containers. The demo could pass without real jury scores or big-versus-small results. - `.oneshot/SPEC.md`, `.oneshot/journeys.json` JR-3 - Require sourced held-out scores and measured results for both models in the demo acceptance check.
4. [P0] “Mubit rejects image input (when a key exists): switch…” tests the riskiest assumption after the build depends on screenshot judging. The plan calls for a real image call, 30+ Juror calls, and training to start tonight. - `.oneshot/SPEC.md`, `docs/PLAN.md` - Put the image/task smoke test and training decision before the Wall pipeline, with a dated fallback decision.
5. [P1] “`Move to top` or `Score it yourself` opens a small sheet” specifies saving for buttons but not for the promised drag-to-reorder interaction; JR-2 clicks `promote` instead of dragging. - `.oneshot/SPEC.md`, `.oneshot/journeys.json` JR-2 - Define drag completion and persistence, then test an actual drag from #7 to #1.
6. [P1] “`SCORECARD_MODELS` … default = `MODEL`; add `MUBIT_ADAPTER_MODEL` if Mubit allows calling adapters” leaves the promised big-versus-small comparison optional, despite the documented adapter access limit. - `.oneshot/SPEC.md`, `docs/BRIEF.md` - Specify the verified comparison route, including an honestly labelled Try models result if the app cannot call the adapter.
7. [P1] “choose a preset (Pika, Mubit)” supplies one additional brand, while T4 specifies Pika plus three preset brands. - `.oneshot/SPEC.md`, truth pack T4 - Name and supply the other two presets, or record an approved scope change.
8. [P1] “`npm run scorecard` … cost from `PRICE_<MODEL>_IN/OUT` … in `.env`” gives no prices, source, or rule for missing usage and price fields. A builder must guess, and the cost claim can silently be wrong. - `.oneshot/SPEC.md` - Define the price source, exact configuration names, calculation, and an unavailable state when inputs are missing.
9. [P1] “stripped of `<script>`, `on*=` attributes and external URLs” does not define how CSS `url()`, `@import`, SVG references, and redirects are blocked; the promised no-network render is unproved. - `.oneshot/SPEC.md` - Specify an iframe and screenshot CSP that denies network requests, with a test using those payloads.
10. [P1] “Journeys JR-1..JR-4 green in MOCK” omits checks for the under-60-second expo run, first-card progress, a clean reset, console or network errors, and the projector view cited in the pre-mortem. - `.oneshot/SPEC.md`, `.oneshot/journeys.json`, `.oneshot/premortem.md` - Add observable timing, reset, error, and viewport checks.
11. [P1] “JR-4 brand form” does not test W2’s promise that unknown routes return to `/`; JR-4 visits `/brand` directly. - `.oneshot/SPEC.md`, `.oneshot/journeys.json` JR-4 - Navigate to an unknown route and assert that the Wall appears.
12. [P1] “tokens.css placeholder … Kimberley overwrites” conflicts with `brand/README.md`, where Kimberley supplies source tokens and builders consume them; the Mubit preset source also says its primary colour and font need confirmation. - `.oneshot/SPEC.md`, `brand/README.md`, `.oneshot/truth/brand/brand.md` - Define a single handoff from Kimberley’s files into tokens and keep unconfirmed preset values visibly provisional.
13. [P2] “12 generator calls … headless chromium … SSE pipeline” puts a large generation stack on the critical path before the correction proof. The documented Juror-only route using prepared sections is absent from the stop conditions. - `.oneshot/SPEC.md`, `.oneshot/simpler.md` - Define that smaller route as the fallback if generation threatens the Mubit correction demo.

PROVENANCE: role=spec model=gpt-6 contract=cdd92f382c25e41a
VERDICT: FAIL

## Author responses

1. FIXED: SPEC "How a correction becomes a model update (both routes defined)": instant taste memory, route A (Mubit correction API if it exists), route B (adapter trains on taste-conditioned calls; demo shows task, adapter version, Try models). Step 0c asks Mubit; deadline Sat 10:00.
2. FIXED: SPEC Pipeline step 6 adds a controlled check (promoted family must rank higher than its no-taste baseline; window.__pika exposes lastPromotedFamily/baselineRank/newRank); JR-2 asserts it with eval on the #7 card.
3. FIXED: SPEC Surfaces 3 defines DEMO-READY (>= 8 sourced held-out sites, measured big and small results) vs MOCK-complete; new JR-3D (demo-ready only) asserts >= 8 rows, both model columns, no empty state. The empty state stays only for MOCK-complete.
4. FIXED: new "Step 0: feasibility spike" runs first once a key exists: text smoke, image call, 30-call task formation, correction question, dated fallback decision (Sat 10:00). No key on this machine tonight, so the spike is HUMAN-NEEDED and the build proceeds in MOCK, as the spec states.
5. DISAGREE (partly FIXED): drag now defined (pointer drop on slot, keyboard Alt+Up/Down, same handler as Move to top, persisted by POST /api/correction). The journey runner has no drag step (~/.claude/skills/oneshot/runner/run.mjs lines 72-88 support goto/click/fill/press/select/check/upload/wait/expect/eval only), so drag is covered by a component test and JR-2 drives the click path into the same handler.
6. FIXED: SPEC Scorecard: big model measured by script; small model via MUBIT_ADAPTER_MODEL if callable, otherwise recorded from Try models into data/scorecard/trymodels.json and labelled "recorded in Try models" with no latency/cost claim.
7. FIXED: presets reduced to Pika + Mubit; truth.md T4 updated; scope change to be logged in DECISIONS.md.
8. FIXED: data/pricing.json schema (inPer1M, outPer1M, source URL, checkedAt), exact formula, "unavailable" with reason when usage or price is missing; never estimated.
9. FIXED: Global constraint 5 now lists every vector (@import, url(), SVG href/xlink:href, meta refresh, link, iframe/object/embed, javascript: URLs), an injected CSP (default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:), sandbox="", and a screenshot browser that aborts all non-data requests; unit tests per vector and a zero-network screenshot test.
10. FIXED: JR-1 now asserts a full batch of 12, batch-done, and window.__pika.batchMs < 60000 (expo budget); JR-5 adds the 1920x1080 projector (no horizontal scroll) and reset clearing taste memory; console/network errors fail every journey by default in run.mjs.
11. FIXED: JR-4 goes to /does-not-exist and asserts the Wall, then the brand form with the Mubit preset.
12. FIXED: single handoff: `npm run tokens` generates src/styles/tokens.css from Kimberley's brand/colour/tokens.md and brand/type/tokens.md; empty rows fall back to provisional DESIGN.md values marked provisional; nobody edits tokens.css by hand. Mubit preset labelled "from mubit.ai, unconfirmed".
13. FIXED: new "Fallback route": prepared sections in data/sections/ if the generator pipeline is not green by Sat 14:00; Juror, corrections, taste memory and scorecard unchanged.


## Reviewer (codex) -> FAIL

1. [P0] [STILL-OPEN] “Mubit trains the small model on [taste-conditioned calls]” does not prove that the judge’s correction entered an adapter update. `docs/PLAN.md` still promises that the correction is sent to Mubit. - `.oneshot/SPEC.md:68-71`, `docs/PLAN.md:8` - Settle this with a verified correction route or evidence that an adapter version trained after the correction changes its answer on a fixed comparison.

2. [P0] [STILL-OPEN] “`window.__pika = {lastPromotedFamily, baselineRank, newRank}`” lets JR-2 pass on reported values while the visible new Wall keeps its old order. - `.oneshot/SPEC.md:51`, `.oneshot/journeys.json` JR-2 - Capture the baseline from the first batch and assert the promoted family’s rank in the fresh batch’s rendered cards.

3. [P0] [STILL-OPEN] “DEMO-READY requires real data” is not enforced by JR-3D: eight rows and two column headings can pass without source links or measured model results. - `.oneshot/SPEC.md:43`, `.oneshot/journeys.json` JR-3D - Gate demo-ready on sourced jury scores and recorded results for each model and site.

4. [AGREED] The feasibility spike now precedes Mubit-dependent work once a key exists, with a Saturday decision deadline. Building in labelled MOCK mode until then is an accepted risk.

5. [P1] [STILL-OPEN] “Drag is covered by a component test” does not prove that a judge can drag card #7 to #1, save, and see the correction persist in the running app. - `.oneshot/SPEC.md:100` - Add a browser pointer-drag check through the correction sheet and saved Wall state.

6. [P1] [STILL-OPEN] “No latency or cost claim for [the recorded Try models] column” leaves the promised big-versus-small cost and speed comparison incomplete. - `.oneshot/SPEC.md:57`, truth pack T3 - Measure both where Mubit permits it; otherwise make this an explicit unmet demo-ready criterion and present the limitation honestly.

7. [AGREED] The truth pack now specifies Pika and Mubit as the two presets; the reduced scope is clear.

8. [AGREED] The price source, formula, and unavailable state are specified.

9. [AGREED] The sandbox, CSP, request blocking, and attack-vector checks cover the stated network risk.

10. [AGREED] The journeys now cover batch timing, reset, error detection, and projector width.

11. [AGREED] JR-4 checks that an unknown route reaches the Wall.

12. [AGREED] The spec defines Kimberley’s source-token handoff and labels the Mubit preset unconfirmed.

13. [AGREED] Prepared sections now provide a dated fallback that preserves the Juror and correction loop.

AGREED POSITION: The team can build the Wall in MOCK mode while the Mubit spike waits for a key. We accept the two-preset scope and the prepared-section fallback.
The remaining demo gates are proof of a correction reaching a model update, visible fresh-batch ranking, real scorecard data, an actual drag, and the promised model comparison.

PROVENANCE: role=spec model=gpt-6 contract=2732dc5129f82ff2
VERDICT: FAIL

## Author responses

1. FIXED: SPEC adds "Correction proof (DEMO-READY gate for either route)": fixed comparison set of 6 held-out sections + one fixed correction; data/proof/correction-proof.json records adapter version BEFORE and the version trained AFTER calls containing the correction, with both versions' replies and console timestamps; shown on the scorecard. If no post-correction adapter exists by Sun 09:00, the demo claims only the instant change and says so on screen; listed unmet in the proof pack. docs/PLAN.md line 8 rewritten to match (no claim that the correction is "sent to Mubit" unless a route is confirmed).
2. FIXED: window.__pika removed from the spec. JR-2 now captures the #7 card's family from the rendered DOM before the correction (sessionStorage), and after the fresh batch asserts that family's rendered data-rank is < 7.
3. FIXED: JR-3D eval checks every row has an awwwards.com link and numeric jury, big-model and small-model scores, and that the correction-proof table exists.
5. FIXED: new JR-6 performs a real pointer drag in the browser (dispatching PointerEvents from #7's handle onto slot-1 via eval, since run.mjs has no drag step), saves via the correction sheet, reloads, and asserts the same card id is #1 (persisted).
6. FIXED: small-model cost and speed are measured when the adapter is callable; otherwise the page states on screen that they are not measurable from our app and the proof pack lists the comparison as an unmet demo-ready criterion. Never estimated.


## Reviewer (codex) -> FAIL

1. [P0] [STILL-OPEN] “Adapter version id trained AFTER calls containing the correction” records timing, but the gate never requires the fixed set’s answers to move in the correction’s direction. `docs/PLAN.md:42` still calls the stage result a model update. - `.oneshot/SPEC.md:71-72`, `docs/PLAN.md:42` - Require a verified correction route and a directional before/after result; otherwise change the demo claim to taste memory only.

2. [P0] [STILL-OPEN] “The journey reads the visible ranks” is contradicted by JR-2 reading `data-rank`; that attribute can change while the visible card order does not. - `.oneshot/SPEC.md:51`, `.oneshot/journeys.json` JR-2 - Assert the fresh batch’s actual card order and visible rank badges against a controlled baseline.

3. [P0] [STILL-OPEN] “DEMO-READY requires real data” is still checked through links, numeric text and the presence of a proof table. JR-3D can pass with unsourced or unrecorded results. - `.oneshot/SPEC.md:43`, `.oneshot/journeys.json` JR-3D - Validate each site’s four sourced jury scores, both models’ recorded replies and provenance, and the correction proof’s contents.

4. [AGREED] The key-dependent feasibility spike runs first when a key exists; labelled MOCK work can proceed meanwhile.

5. [P1] [STILL-OPEN] “Dispatching real pointer events from an `eval` step” dispatches synthetic events directly to elements and the document. It does not establish that a judge’s mouse drag works. - `.oneshot/SPEC.md:101`, `.oneshot/journeys.json` JR-6 - Drive the browser’s mouse from the handle to slot 1, then save and verify persistence.

6. [AGREED] The spec now requires measurement where the adapter is callable and explicitly marks cost and speed unmet when it is not.

7. [AGREED] The two-preset scope is recorded.

8. [AGREED] Price sources, calculation and unavailable states are specified.

9. [AGREED] The sandbox, CSP, request blocking and attack-vector checks cover the stated network risk.

10. [AGREED] The journeys cover timing, reset, errors and projector width.

11. [AGREED] JR-4 checks the unknown-route redirect.

12. [AGREED] Kimberley’s token handoff and the unconfirmed Mubit preset are specified.

13. [AGREED] Prepared sections provide a dated fallback that retains the Juror and correction loop.

AGREED POSITION: MOCK development, two presets and the prepared-section fallback can proceed. The team accepts that cost and speed may remain an unmet demo criterion if the adapter cannot be called.
The spec still needs an outcome-based model-update gate, visible fresh-batch ranking, sourced scorecard evidence and a physical drag check before it supports the promised demo.

PROVENANCE: role=spec model=gpt-6 contract=faab53745c61c3f7
VERDICT: FAIL

## Author responses

1. FIXED: SPEC adds a directional rule computed by `npm run check:demo-ready`: the post-correction adapter must move toward the correction on >= 4 of 6 fixed comparisons; plus a wording rule: "model update" only when the proof passes, otherwise "the Juror applies your correction on the next call". docs/PLAN.md demo step 4 (was line 42) rewritten to the same rule.
2. FIXED: JR-2 now asserts the visible result: the #7 card's visible rank badge reads 7 in the baseline; after the fresh batch the promoted family's card is earlier in DOM order, its visible badge shows that position, and its on-screen position (sorted by bounding box) agrees with DOM order. The data-rank attribute is no longer used.
3. FIXED: `npm run check:demo-ready` strict validator (sources, all four jury scores 1-10, screenshot files, takenBy/takenAt; per-site big-model reply with model id, timestamp, usage; small-model reply with adapter version or Try models provenance; correction proof contents + directional rule); the page renders a PASS stamp only when the validator output matches the current data hash; JR-3D requires that stamp.
5. FIXED: added a real `drag` step to the oneshot journey runner (~/.claude/skills/oneshot/runner/run.mjs: page.mouse move/down/12 moves/up between element centres). JR-6 drags #7's handle onto slot-1 with the real mouse, saves via the sheet, reloads, and asserts the same card id is first with visible badge 1.


## Reviewer (codex) -> FAIL

1. [AGREED] The directional correction proof and conditional demo wording resolve the previous model-update claim.
2. [AGREED] JR-2 now checks the fresh batch’s visible badge, DOM order and screen position.
3. [AGREED] The strict validator and current-data PASS stamp resolve the scorecard evidence check.
4. [AGREED] The key-dependent spike runs first when a key exists.
5. [AGREED] JR-6 uses the browser mouse and checks persistence after reload.
6. [AGREED] Unmeasurable adapter cost and speed remain an explicitly unmet criterion.
7. [AGREED] The two-preset scope is recorded.
8. [AGREED] Price sources, calculation and unavailable states are specified.
9. [AGREED] The sandbox and network checks cover the stated risk.
10. [AGREED] The journeys cover timing, reset, errors and projector width.
11. [AGREED] JR-4 checks the unknown-route redirect.
12. [AGREED] Kimberley’s token handoff and the unconfirmed Mubit preset are specified.
13. [AGREED] Prepared sections provide a dated fallback.
14. [P0] “Every Juror call after a correction carries it” and “both versions’ Juror replies on the 6 sections” allow the after-version to receive taste memory while the before-version does not. That could pass the directional rule without showing a model update. - `.oneshot/SPEC.md:73-74` - Require identical frozen evaluation messages, images and settings for both adapter versions, with no correction example in either evaluation message.
15. [P1] “Out of scope: ... file-upload brand kits” conflicts with the stage script’s “Upload a judge’s favourite brand; 20 hero sections appear.” The specified demo has two presets and 12 cards, so its scripted first action cannot run. - `.oneshot/SPEC.md:38,41`, `docs/PLAN.md:40` - Change the demo script to select a preset and generate 12 cards.

AGREED POSITION: The four previously open checks are resolved. MOCK development, two presets and prepared sections can proceed, with adapter cost and speed knowingly unmet if they cannot be measured.
Before the spec supports the promised demo, the model-update proof must isolate the adapter change, and the stage script must match the build.

PROVENANCE: role=spec model=gpt-6 contract=fb71d396542d3483
VERDICT: FAIL

## Author responses

14. FIXED: SPEC adds "Frozen evaluation": both adapter versions are evaluated on byte-identical messages (constant system prompt, same 6 images, same brand line, no taste-memory or correction text in either, temperature 0, same max tokens) stored in data/proof/frozen-eval.json with a hash; the validator rejects replies not produced from that hash. Differences can only come from the model update.
15. FIXED: docs/PLAN.md demo step 2 now reads "Pick a preset brand (Pika, or Mubit's own brand); 12 hero sections appear and the Juror ranks them"; step 3 has a judge play art director. Matches the two presets, 12 cards and no file upload.


## Reviewer (codex) -> PASS

14. [AGREED] The frozen evaluation in `.oneshot/SPEC.md:74` uses identical messages, images and settings for both adapter versions, with no correction text in either evaluation.
15. [AGREED] `docs/PLAN.md:40–41` now scripts a preset brand, 12 sections and the judge’s drag, matching the build spec.

AGREED POSITION: The spec now isolates the adapter change in its model-update proof, and the stage script matches the planned demo.
MOCK development and the prepared-section fallback can proceed. If adapter cost, speed or the model update cannot be verified, those claims remain explicitly unmet.

PROVENANCE: role=spec model=gpt-6 contract=fb71d396542d3483
VERDICT: PASS