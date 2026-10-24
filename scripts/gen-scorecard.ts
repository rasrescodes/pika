// Generator scorecard: each holdout contender's quality (Juror, detector), latency and cost, side by side.
// Writes data/gen/scorecard.json and prints a Markdown table. Usage: npx tsx scripts/gen-scorecard.ts
import { readFileSync, writeFileSync, existsSync } from "node:fs";

// Claude Sonnet 5.5 list price per million tokens (Anthropic pricing page, checked 24 Oct 2026). Output includes thinking.
const SONNET = { inPer1M: 2, outPer1M: 10, source: "https://www.anthropic.com/pricing" };
const CONTENDERS = [
  { tag: "hold-local-base", label: "Qwen3 4B, untrained", kind: "small" },
  { tag: "hold-local-ft", label: "Qwen3 4B, fine-tuned round 1 (ours)", kind: "small" },
  { tag: "hold-local-ft2", label: "Qwen3 4B, fine-tuned round 2 (ours)", kind: "small" },
  { tag: "hold-local-ft3", label: "Qwen3 4B, round 3, trained on all 12 layouts (ours)", kind: "small" },
  { tag: "hold-sonnet-plain", label: "Sonnet 5.5, generator-v1", kind: "big" },
  { tag: "hold-sonnet-skills", label: "Sonnet 5.5, generator-skills-v1", kind: "big" },
];
type Row = { overall: number; juror: unknown; slop: number; quality: number; layout?: number; ms?: number; inTokens?: number; outTokens?: number };
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const median = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : NaN);
const out = CONTENDERS.flatMap((c) => {
  const f = `data/gen/${c.tag}/results.jsonl`;
  if (!existsSync(f)) return [];
  const rows: Row[] = readFileSync(f, "utf8").trim().split("\n").map((l) => JSON.parse(l));
  const judged = rows.filter((r) => r.juror);
  // Speed and cost come from a separate timed run (<tag>-timed) when the original rows were made before timing existed.
  const timedFile = `data/gen/${c.tag}-timed/results.jsonl`;
  const timedRows: Row[] = existsSync(timedFile) ? readFileSync(timedFile, "utf8").trim().split("\n").map((l) => JSON.parse(l)) : [];
  const timed = [...rows, ...timedRows].filter((r) => r.ms);
  const costPer100 = c.kind === "big" && timed.length ? (100 * mean(timed.map((r) => (r.inTokens! * SONNET.inPer1M + r.outTokens! * SONNET.outPer1M) / 1e6))) : c.kind === "small" ? 0 : NaN;
  return [{
    ...c, sections: rows.length,
    juror: judged.length ? +mean(judged.map((r) => r.overall)).toFixed(2) : null, judged: judged.length,
    findingsPerPage: +mean(rows.map((r) => r.slop + r.quality)).toFixed(2),
    cleanPages: rows.filter((r) => r.slop + r.quality === 0).length,
    layoutChecked: rows.every((r) => r.layout !== undefined),
    layoutAny: rows.filter((r) => (r.layout ?? 0) > 0).length,
    layoutBroken: rows.filter((r) => (r.layout ?? 0) >= 5).length,
    medianSeconds: timed.length ? +(median(timed.map((r) => r.ms!)) / 1000).toFixed(1) : null,
    costPer100Usd: Number.isNaN(costPer100) ? null : +costPer100.toFixed(2),
  }];
});
writeFileSync("data/gen/scorecard.json", JSON.stringify({ at: new Date().toISOString(), pricing: SONNET, contenders: out }, null, 1));
console.log("| Contender | Sections | Juror /10 | Findings per page | Clean pages | Layout issues (any / broken) | Median seconds | Cost per 100 sections |\n|---|---|---|---|---|---|---|---|");
for (const r of out) console.log(`| ${r.label} | ${r.sections} | ${r.juror ?? "pending"}${r.juror && r.judged < r.sections ? ` (${r.judged} judged)` : ""} | ${r.findingsPerPage} | ${r.cleanPages}/${r.sections} | ${r.layoutChecked ? `${r.layoutAny} / ${r.layoutBroken}` : "not run"} | ${r.medianSeconds ?? "pending"} | ${r.costPer100Usd === null ? "pending" : r.kind === "small" ? "$0 API (runs locally)" : "$" + r.costPer100Usd} |`);
