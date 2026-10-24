// Builds the local fine-tuning set: for every train site, the best spec we have (the teacher's, or the
// model's own best round under any local run), paired with the first-shot message the Describer sees.
// Holdout sites are never included. Usage: npx tsx scripts/local-dataset.ts <sites dir> [min score]
// Writes data/local/dataset/{train,valid}.jsonl in mlx-lm chat format, plus sources.json.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { domMessage, DOM_SYSTEM } from "../src/agents.ts";
import { measureToText, type Measure } from "../src/measure.ts";

const [SITES = "data/sites", MIN = "40"] = process.argv.slice(2);
const readJson = <T>(p: string, d: T): T => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : d);
const index: { slug: string; split: string }[] = readJson(`${SITES}/index.json`, []);
const extra = new Set(readJson<{ slugs: string[] }>("data/holdout-extra.json", { slugs: [] }).slugs);
const labels: Record<string, { bad_capture?: string }> = readJson("data/labels.json", {});
const teacher: Record<string, { total: number }> = readJson("data/local/teacher/scores.json", {});

type Pick = { slug: string; source: string; score: number; spec: string };
const picks: Pick[] = [];
for (const s of index) {
  if (s.split !== "train" || extra.has(s.slug) || labels[s.slug]?.bad_capture) continue;
  const cands: Pick[] = [];
  if (teacher[s.slug]) cands.push({ slug: s.slug, source: "teacher", score: teacher[s.slug].total, spec: readFileSync(`data/local/teacher/${s.slug}.md`, "utf8").trim() });
  const runs = `data/runs/${s.slug}`;
  for (const d of existsSync(runs) ? readdirSync(runs) : []) {
    const run = readJson<{ backend?: string; history?: { round: number; score: { total: number } }[] } | null>(`${runs}/${d}/run.json`, null);
    if (run?.backend !== "local") continue;
    for (const r of run.history ?? []) cands.push({ slug: s.slug, source: `${d}/r${r.round}`, score: r.score.total, spec: readFileSync(`${runs}/${d}/r${r.round}/spec.md`, "utf8").trim() });
  }
  const best = cands.sort((a, b) => b.score - a.score)[0];
  if (best && best.score >= Number(MIN)) picks.push(best);
}

const example = (p: Pick) => {
  const dir = `${SITES}/${p.slug}`;
  const measured: Measure = JSON.parse(readFileSync(`${dir}/measure.json`, "utf8"));
  const user = domMessage({ lessons: "", measured: measureToText(measured, readJson(`${dir}/masks.json`, [])) });
  return JSON.stringify({ messages: [{ role: "system", content: DOM_SYSTEM }, { role: "user", content: user }, { role: "assistant", content: p.spec }] });
};
// A small, fixed validation slice (every tenth site), so training loss can be watched for overfitting.
mkdirSync("data/local/dataset", { recursive: true });
const valid = picks.filter((_, i) => i % 10 === 0);
const train = picks.filter((_, i) => i % 10 !== 0);
writeFileSync("data/local/dataset/train.jsonl", train.map(example).join("\n") + "\n");
writeFileSync("data/local/dataset/valid.jsonl", valid.map(example).join("\n") + "\n");
writeFileSync("data/local/dataset/sources.json", JSON.stringify(picks.map(({ spec, ...p }) => p), null, 1));
const fromModel = picks.filter((p) => p.source !== "teacher").length;
console.log(`dataset: ${train.length} train, ${valid.length} valid; ${fromModel} targets from the model's own rounds, ${picks.length - fromModel} from the teacher; mean target ${(picks.reduce((a, p) => a + p.score, 0) / picks.length).toFixed(1)}`);
