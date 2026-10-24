// Generator distillation, step 2: the fine-tuning set. For each train brief (brand x family), keep the best
// variants by fewest AI-slop findings, then fewest quality findings, then highest Juror score. The student sees
// the plain generator-v1 prompt, so what it learns from the skills lives in its weights.
// Usage: npx tsx scripts/gen-dataset.ts <tag> [keep per brief, default 2]
// Writes data/gen/dataset/{train,valid}.jsonl (mlx-lm chat format) and sources.json.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PRESETS, type Brand } from "../lib/brands";
import type { Family } from "../lib/families";
import { userMessage } from "./gen-distill-msg";

const [TAG, KEEP = "2"] = process.argv.slice(2);
if (!TAG) throw new Error("usage: gen-dataset.ts <tag> [keep]");
type Row = { id: string; brand: string; family: Family; slop: number; quality: number; overall: number };
const rows: Row[] = readFileSync(`data/gen/${TAG}/results.jsonl`, "utf8").trim().split("\n").map((l) => JSON.parse(l));
const SYSTEM = readFileSync(path.join(process.cwd(), "prompts", "generator-v1.md"), "utf8");

const byBrief = new Map<string, Row[]>();
for (const r of rows) byBrief.set(`${r.brand}-${r.family}`, [...(byBrief.get(`${r.brand}-${r.family}`) ?? []), r]);
const picks = [...byBrief.values()].flatMap((rs) =>
  rs.sort((a, b) => a.slop - b.slop || a.quality - b.quality || b.overall - a.overall).slice(0, Number(KEEP)),
);

const SYNTHETIC: Brand[] = existsSync("data/gen/brands.json") ? JSON.parse(readFileSync("data/gen/brands.json", "utf8")) : [];
const example = (r: Row) => {
  const brand = [...PRESETS, ...SYNTHETIC].find((b) => b.id === r.brand)!;
  const html = readFileSync(`data/gen/${TAG}/${r.id}.html`, "utf8");
  return JSON.stringify({ messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userMessage(brand, r.family) }, { role: "assistant", content: html }] });
};
mkdirSync("data/gen/dataset", { recursive: true });
// Every eighth pick validates, so the loss can be watched for overfitting.
const valid = picks.filter((_, i) => i % 8 === 0);
const train = picks.filter((_, i) => i % 8 !== 0);
writeFileSync("data/gen/dataset/train.jsonl", train.map(example).join("\n") + "\n");
writeFileSync("data/gen/dataset/valid.jsonl", valid.map(example).join("\n") + "\n");
writeFileSync("data/gen/dataset/sources.json", JSON.stringify(picks, null, 1));
const mean = (k: "slop" | "overall") => (picks.reduce((a, r) => a + r[k], 0) / picks.length).toFixed(2);
console.log(`gen dataset from ${TAG}: ${train.length} train, ${valid.length} valid from ${byBrief.size} briefs; mean slop ${mean("slop")}, mean Juror ${mean("overall")}`);
