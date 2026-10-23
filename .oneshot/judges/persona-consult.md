

## Reviewer (codex) -> FAIL

Chrome’s origin approval gate denied access to `http://localhost:3000`, so I could not complete the requested fresh-browser test. This verdict is based on the supplied journey screenshots and results, not a live interaction.

1. [P0] The next batch does not put the judge’s promoted design first. The correction is shown as “Minimal Layout, #7 To #1”, but the next batch places that layout at #3 - [next-batch screenshot](/Users/rassa/Documents/pika/.oneshot/proof/shots/JR-2-07-next-batch-with-taste.png) - Make a correction to #1 produce a visibly first-ranked matching design in a fresh batch.
2. [P0] The promised scorecard result is absent. The screen says “No scorecard run yet” and shows “unavailable” for both models’ cost and speed - [scorecard screenshot](/Users/rassa/Documents/pika/.oneshot/proof/shots/JR-3-02-scorecard.png) - Run the held-out comparison and show sourced scores, cost and latency before the judges see it.
3. [P0] I cannot see a model update in this demo state. The Wall says “Mubit trains its small model on those calls” while the mode chip reads “MOCK” - [Wall screenshot](/Users/rassa/Documents/pika/.oneshot/proof/shots/JR-2-07-next-batch-with-taste.png) - Demonstrate a real Mubit task and adapter update, or state on screen that this run only simulates that step.
4. [P1] After a drag and reload, “BEST NEW DESIGN” labels a 6.6 card above an 8.4 card. I cannot tell whether the Wall is showing my manual order or the Juror’s ranking - [drag-reload screenshot](/Users/rassa/Documents/pika/.oneshot/proof/shots/JR-6-06-after-drag-reload.png) - Label the corrected order separately from Juror scores.
5. [P1] The batch feels like variations of a fixture: the cards repeatedly say “An art director that learns your taste” under the promise “Twelve hero sections” - [Wall screenshot](/Users/rassa/Documents/pika/.oneshot/proof/shots/JR-5-03-projector.png) - Show distinct, credible sections from the selected brand kit.
6. [P1] The judge’s invited #7 card sits below the first screen while the instruction says “Drag a card or move it to the top” - [Wall screenshot](/Users/rassa/Documents/pika/.oneshot/proof/shots/JR-5-03-projector.png) - Put the correction target and action in the initial 1440 × 900 view for the demo.

I would not use it tomorrow or show it to a colleague as proof of the promised learning loop yet.

PROVENANCE: role=persona model=gpt-6 contract=328d4aae65bf446c
VERDICT: FAIL

## Reviewer (codex) -> FAIL

Chrome denied access to the local URL, so I could not run a fresh hands-on session. I judged the supplied desktop screenshots and captured page text. On that evidence, I would not use this tomorrow or show it to a colleague as a working Mubit demo.

1. [P0] The scorecard promised for judging is absent: “No scorecard run yet” and every cost and speed figure says “unavailable”. - [scorecard screenshot](/Users/rassa/Documents/pika/.oneshot/proof/shots/JR-3-02-scorecard.png) - Add sourced held-out results and measured cost and speed before the demo.
2. [P0] I cannot see a correction become a Mubit model update. The Wall says “MOCK mode: a rule-based Juror applies your last 6 corrections”, while the next-batch screen shows no task or adapter update. - [next-batch screenshot](/Users/rassa/Documents/pika/.oneshot/proof/shots/JR-2-07-next-batch-with-taste.png) - Demonstrate a real Mubit update and its status when available; keep the mock disclosure for fallback.
3. [P0] “Generate batch” appears to return the same designs: the promoted minimal layout and the other visible cards recur with the same content in the next batch. That makes the promised *new* batch feel like a rerank of fixtures. - [initial Wall](/Users/rassa/Documents/pika/.oneshot/proof/shots/JR-1-03-wall-ranked.png), [next batch](/Users/rassa/Documents/pika/.oneshot/proof/shots/JR-2-07-next-batch-with-taste.png) - Generate visibly new candidates and show how the correction affects their ranking.
4. [P1] The newly top-ranked card scores 8.7 but still says “Quiet to a fault; nothing to hold on to.” I would hesitate to trust a Juror whose reason contradicts its new judgement. - [next-batch screenshot](/Users/rassa/Documents/pika/.oneshot/proof/shots/JR-2-07-next-batch-with-taste.png) - Update the reason to explain the revised score.
5. [P1] A drag can save “Dragged to the top” as the correction. That records the action, not the art director’s taste, yet the following screen says a note was applied. - [drag screenshot](/Users/rassa/Documents/pika/.oneshot/proof/shots/JR-6-04-step9-click.png) - Ask for a design-specific reason before presenting it as a taste note.
6. [P1] The brand screen exposes unfinished work: “Provisional Pika tokens (DESIGN.md); Kimberley’s brand replaces them” and “Colours from mubit.ai (unconfirmed)”. - [brand-kit screenshot](/Users/rassa/Documents/pika/.oneshot/proof/shots/JR-4-03-brand-form.png) - Lock and verify the demo presets, then use judge-facing descriptions.
7. [P1] The Wall says “12 designs judged” while four preview areas are still grey. At the table, that reads as missing output. - [ranked Wall screenshot](/Users/rassa/Documents/pika/.oneshot/proof/shots/JR-1-03-wall-ranked.png) - Keep progress visible until every preview renders.
8. [P2] The scorecard tells a judge to edit `data/scorecard/sites.json` and run `npm run scorecard`. Those instructions interrupt the explanation of whether the Juror has taste. - [scorecard screenshot](/Users/rassa/Documents/pika/.oneshot/proof/shots/JR-3-02-scorecard.png) - Put operator instructions outside the judge-facing page.

PROVENANCE: role=Night Shift judge model=gpt-6 contract=735301ee0f582297
VERDICT: FAIL