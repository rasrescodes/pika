// Scores the rule-based teacher on every usable site, with the loop's render and DOM score. No LLM.
// Usage: npx tsx scripts/teacher-eval.ts <sites dir> [split]   writes data/local/teacher/<slug>.md and scores.json
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { teach } from "../src/teacher.ts";
import { compile } from "../src/compile.ts";
import { render, closeBrowser } from "../src/render.ts";
import { score, type Box } from "../src/score.ts";
import { domScore, domTotal } from "../src/dom-diff.ts";
import type { Measure } from "../src/measure.ts";

const [SITES = "data/sites", SPLIT] = process.argv.slice(2);
const readJson = <T>(p: string, d: T): T => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : d);
const index: { slug: string; split: string }[] = readJson(`${SITES}/index.json`, []);
const extra = new Set(readJson<{ slugs: string[] }>("data/holdout-extra.json", { slugs: [] }).slugs);
const labels: Record<string, { bad_capture?: string }> = readJson("data/labels.json", {});
const sites = index
  .map((s) => ({ ...s, split: extra.has(s.slug) ? "holdout" : s.split }))
  .filter((s) => (!SPLIT || s.split === SPLIT) && !labels[s.slug]?.bad_capture && existsSync(`${SITES}/${s.slug}/measure.json`));

mkdirSync("data/local/teacher", { recursive: true });
const out: Record<string, { split: string; total: number; dom: number }> = {};
let next = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (next < sites.length) {
      const s = sites[next++];
      const dir = `${SITES}/${s.slug}`;
      const measured: Measure = JSON.parse(readFileSync(`${dir}/measure.json`, "utf8"));
      const masks: Box[] = readJson(`${dir}/masks.json`, []);
      const spec = teach(measured, masks);
      try {
        const { png, measure } = await render(compile(spec));
        const px = await score(readFileSync(`${dir}/original.png`), png, masks);
        const dom = domScore(measured, measure);
        out[s.slug] = { split: s.split, total: domTotal(px.total, px.visible, dom), dom };
        writeFileSync(`data/local/teacher/${s.slug}.md`, spec + "\n");
      } catch (e) {
        console.error(`${s.slug}: ${(e as Error).message}`);
      }
    }
  }),
);
await closeBrowser();
writeFileSync("data/local/teacher/scores.json", JSON.stringify(out, null, 1));
for (const split of ["train", "holdout"]) {
  const xs = Object.values(out).filter((r) => r.split === split).map((r) => r.total);
  if (xs.length) console.log(`${split}: ${xs.length} sites, mean ${(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1)}`);
}
