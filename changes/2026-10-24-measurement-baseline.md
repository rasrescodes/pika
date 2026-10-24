# Finding: copying the measurements saturates the DOM score

Status: finding plus proposal by Claude (overnight, 24 Oct), for Luka to decide. Nothing in the loop was changed.

## What I ran
`npx tsx scripts/baseline.ts` rebuilds each of the 34 held-out heroes (main holdout plus `data/holdout-extra.json`, bad captures skipped) from its own `measure.json` alone: every text box at its measured position, size, colour and weight, on the measured background. No model call, no cost. Each rebuild is scored with the loop's own rules (`src/score.ts`, `domScore`). Results: `data/baseline/results.json`, screenshots in `data/baseline/`.

## What it shows
1. **DOM score is 100 on every site** when the measurements are copied. The DOM-mode Describer receives those same measurements as text (`measureToText`), so a perfect transcription gets full marks. On sites with under 30% visible area, DOM mode uses the DOM score alone, so those runs can "converge" on round 1 without showing any learning.
2. **Image score of the measurement copy** (mean 44.5 across all 34): text-led heroes reach 86 to 95, so that is roughly what "nearly perfect" looks like on the pixel score. Heroes whose look comes from shapes or colour fields (for example truus, pantheon-media-group) stay low even with every word in place, which is the scorer doing its job.
3. **Fully masked heroes score 0** in image mode (visible 0), matching the decision to keep the screenshot loop to type-led sites.

## Proposal (Luka decides)
- Lead the demo and the scorecard with **image mode** (the Describer sees only the screenshot). That is where there is room to learn.
- In DOM mode, either drop `domScore` from the total, or report it separately as "transcription accuracy", so a DOM run cannot show 100 for copying numbers.
- Show the measurement copy on the scorecard as a reference line ("copying the measured text alone scores X"), so the judges can see where the AI sits.

## Per-site results
| Site | Image score | DOM score | Visible |
|---|---|---|---|
| lidar-drone-scanning | 97.8 | 100 | 0.568 |
| ashley-brooke | 97.1 | 100 | 0.906 |
| lxl-creative | 96.1 | 100 | 0.374 |
| damn-good-brands-2 | 95.3 | 100 | 0.62 |
| form-fun-studio | 94.8 | 100 | 0.936 |
| seventeen | 92.1 | 100 | 0.78 |
| leo-parpeix-portfolio-2026 | 91 | 100 | 1 |
| butter | 90.5 | 100 | 0.6 |
| metamask | 86.3 | 100 | 0.894 |
| where-worlds-take-shape | 86 | 100 | 0.936 |
| truckn-roll-r | 83 | 100 | 0.543 |
| bucks-sauce | 78.2 | 100 | 0.697 |
| rpa-comunicacion | 76 | 100 | 0.652 |
| ref-digital | 74.4 | 100 | 0.895 |
| coffeetech-r | 59 | 100 | 1 |
| mosbys-files | 58.4 | 99.7 | 1 |
| mammoth-murals | 43.4 | 100 | 0.946 |
| cerebrium | 41.4 | 100 | 0.998 |
| pantheon-media-group | 32.9 | 100 | 0.791 |
| truus | 18 | 100 | 0.934 |
| aino-agency | 8.1 | 100 | 0.081 |
| marvell-tile-stone | 7.6 | 100 | 1 |
| fluid-glass | 4.4 | 100 | 0.079 |
| darknode | 0 | 100 | 0 |
| evolve-2 | 0 | 100 | 0 |
| icomat | 0 | 100 | 0 |
| joby | 0 | 100 | 0 |
| monolog | 0 | 100 | 0 |
| offfforum | 0 | 100 | 0 |
| sstr-friction-reduction | 0 | 100 | 0 |
| warm-fuzzy | 0 | 100 | 0 |
| white-desert | 0 | 100 | 0 |
| hobro-digital | 0 | 100 | 0 |
| capitolium | 0 | 100 | 0 |
