// Free baselines for Jury mode (no model, no cost). The Juror has to beat these on held-out sites,
// or Pika claims nothing. Writes data/jury/baselines.json.
import { writeFileSync, mkdirSync } from "node:fs";
import { jurySites, CRITERIA, topCriterion, clearPairs, mean, round, type Criterion } from "../lib/jury";

const sites = jurySites();
const train = sites.filter((s) => !s.heldOut);
const held = sites.filter((s) => s.heldOut);

// 1. Guess the training average for every held-out site.
const avg = mean(train.map((s) => s.jury.overall));
const maeConstant = mean(held.map((s) => Math.abs(s.jury.overall - avg)));

// 2. Guess each visual style's training average (falls back to the overall average).
const byStyle = new Map<string, number[]>();
for (const s of train) byStyle.set(s.visualStyle, [...(byStyle.get(s.visualStyle) ?? []), s.jury.overall]);
const styleGuess = (style: string) => (byStyle.get(style)?.length ?? 0) >= 3 ? mean(byStyle.get(style)!) : avg;
const maeStyle = mean(held.map((s) => Math.abs(s.jury.overall - styleGuess(s.visualStyle))));

// 3. Top criterion: always guess the most common one in training.
const counts = new Map<Criterion, number>();
for (const s of train) counts.set(topCriterion(s.jury), (counts.get(topCriterion(s.jury)) ?? 0) + 1);
const majority = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
const topMajority = mean(held.map((s) => (topCriterion(s.jury) === majority ? 1 : 0)));

// 4. Pairs: a coin flip is 50%; the visual-style average is a smarter free guess.
const pairs = clearPairs(held);
const pairStyle = mean(pairs.map(([a, b]) => ((styleGuess(a.visualStyle) - styleGuess(b.visualStyle)) * (a.jury.overall - b.jury.overall) > 0 ? 1 : 0)));

const out = {
  at: new Date().toISOString(),
  dataset: { sites: sites.length, train: train.length, heldOut: held.length, juryOverall: { mean: round(avg, 2), min: Math.min(...sites.map((s) => s.jury.overall)), max: Math.max(...sites.map((s) => s.jury.overall)) } },
  topCriterionDistribution: Object.fromEntries(CRITERIA.map((c) => [c, counts.get(c) ?? 0])),
  baselines: {
    maeOverall: { constantAverage: round(maeConstant), styleAverage: round(maeStyle) },
    topCriterionAccuracy: { alwaysMajority: round(topMajority), majorityCriterion: majority, random: 0.25 },
    pairAccuracy: { coinFlip: 0.5, styleAverage: round(pairStyle), pairs: pairs.length },
  },
};
mkdirSync("data/jury", { recursive: true });
writeFileSync("data/jury/baselines.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
