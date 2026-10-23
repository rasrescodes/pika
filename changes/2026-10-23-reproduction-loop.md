# Proposal: the reproduction loop

Status: proposed by Luka, 23 Oct. Needs Rassa's and Kimberley's agreement before anyone builds it.

## What
Take an award-winning site, capture it, write a prompt that describes it, hide the original, and have Claude rebuild it from the prompt alone. Compare the rebuild to the original, fix the prompt, and loop until the rebuild is close enough. Every call goes through Mubit, and the loop's own results become the training data.

## The loop
1. **Capture:** screenshot the hero (above the fold) of an Awwwards winner at a fixed viewport, 1440x900. Screenshot only; we don't download or keep the site's code (AGENTS.md boundary).
2. **Describer** (the one we prompt, and the task Mubit trains): screenshot in, a build spec out. Layout grid, type scale, fonts, colours as hex, spacing, copy, image slots. Capped at about 400 tokens.
3. **Builder** (blind, fixed): spec in, one HTML/CSS file out. It never sees the screenshot. Its prompt never changes; the only thing that varies between rounds is the spec the Describer hands it. Goes through Mubit, but it is not the task we train (its output is too long for adapter training).
4. **Render and score:** Playwright renders the rebuild at the same viewport. A code-based score compares the two images (layout blocks, colour palette, text position, SSIM). No LLM in the score, so it can't flatter itself.
5. **Critic:** sees both images and returns at most 5 one-line fixes to the spec ("headline is 2x bigger and left-aligned").
6. **Revise:** the Describer rewrites the spec using the fixes. Back to step 3. Stop at a score threshold or 6 rounds.

## We prompt the Describer, not the Builder
All the prompt work and all the learning sit in the Describer. The Builder is a fixed, dumb pair of hands: if a rebuild is wrong, the fix goes into the spec, never into the Builder's prompt. That keeps the experiment clean (a better score means a better spec) and keeps the trained task short enough for Mubit.

## Why it fits Mubit
- **Corrections without a human.** The spec that finally converged is the corrected answer for the Describer's first attempt on that screenshot. Ground truth is the original site, so every correction is measurable.
- **One clear metric:** first-shot score and rounds to converge. Before training: about 4 rounds. After: the small model gets there in 1 or 2. That chart is the demo.
- **Volume:** each site gives several Describer calls, so 25+ kept examples overnight is realistic.
- Track 1 (corrections become model updates) is the natural fit; the big-vs-small Describer comparison also covers track 2.

## Risks
- **Photos and 3D.** No image generation through Mubit. Pick type-led sites; the Builder uses flat placeholder blocks; the score masks image areas.
- **Motion.** Awwwards sites are animated. We compare one static frame after load and say so.
- **Usefulness is the weak spot** for the judges. Pitch: "a client sends a reference; Pika turns it into a spec any developer or model can build from." Studios do this daily.
- **Correction mechanism unknown.** Same open question as before (HUMAN-NEEDED): can a corrected answer become a training example?
- **Rights.** Rebuilds of real sites stay internal to the demo; never published.

## What it replaces
The Generator and Wall from `docs/PLAN.md`. The Juror survives as the Critic, still with a fixed prompt and short output. The Awwwards scorecard becomes the held-out set: sites the Describer never trained on.

## Cost
Roughly the same build as the current plan: capture script, three prompts, a scorer, a loop runner, and a page that shows original vs rebuild per round. Tonight's job is unchanged: get Describer calls flowing through Mubit before midnight so training can run overnight.
