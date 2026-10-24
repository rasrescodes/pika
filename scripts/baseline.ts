// The no-AI baseline: rebuild each held-out hero purely from its measured text boxes (position, size,
// colour, weight) on its measured background, then score it with the loop's own scorer. No model call,
// no cost. It tells the team (and the judges) what copying measurements alone achieves, so the AI loop
// has a floor to beat, and it exercises render + score on every held-out site.
// Usage: npx tsx scripts/baseline.ts   -> data/baseline/<slug>.png and data/baseline/results.json
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { renderHtml, closeBrowser } from "../src/render.ts";
import { score, type Box } from "../src/score.ts";
import { domScore } from "../src/dom-diff.ts";
import type { Measure, TextBox } from "../src/measure.ts";
import { render } from "../src/render.ts";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const family = (f: string) => (/mono/i.test(f) ? "Menlo, monospace" : /serif/i.test(f) && !/sans/i.test(f) ? "Georgia, serif" : "Helvetica, Arial, sans-serif");

function html(m: Measure): string {
  const boxes = m.texts.map((t: TextBox) => {
    const b = t.bbox;
    return `<div style="position:absolute;left:${b.x}px;top:${b.y}px;width:${Math.max(b.w, 1)}px;white-space:nowrap;font-family:${family(t.fontFamily)};font-size:${t.fontSize};font-weight:${t.fontWeight};line-height:${t.lineHeight === "normal" ? "1.15" : t.lineHeight};letter-spacing:${t.letterSpacing};text-transform:${t.textTransform};color:${t.color};text-align:${t.textAlign === "start" ? "left" : t.textAlign}">${esc(t.text)}</div>`;
  });
  return `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;width:1440px;height:900px;overflow:hidden;position:relative;background:${m.bodyBg}">${boxes.join("")}</body></html>`;
}

const sites = JSON.parse(readFileSync("data/labels.json", "utf8")) as Record<string, { bad_capture?: boolean }>;
const extra = (JSON.parse(readFileSync("data/holdout-extra.json", "utf8")) as { slugs: string[] }).slugs;
const holdout = Object.keys(sites).filter((slug) => {
  if (sites[slug].bad_capture || !existsSync(`data/sites/${slug}/meta.json`)) return false;
  const meta = JSON.parse(readFileSync(`data/sites/${slug}/meta.json`, "utf8")) as { split: string };
  return meta.split === "holdout" || extra.includes(slug);
});

mkdirSync("data/baseline", { recursive: true });
const results: Record<string, { image: number; dom: number; visible: number }> = {};
for (const slug of holdout) {
  const dir = `data/sites/${slug}`;
  const measured = JSON.parse(readFileSync(`${dir}/measure.json`, "utf8")) as Measure;
  const masks = JSON.parse(readFileSync(`${dir}/masks.json`, "utf8")) as Box[];
  const page = html(measured);
  const png = await renderHtml(page);
  writeFileSync(`data/baseline/${slug}.png`, png);
  const s = await score(readFileSync(`${dir}/original.png`), png, masks);
  const rebuilt = await render(page);
  const dom = domScore(measured, rebuilt.measure);
  // Same rules as the loop: image total scaled by visible area below 30%; DOM blends in the measurement score.
  const image = s.visible < 0.3 ? Math.round(s.total * s.visible * 10) / 10 : s.total;
  results[slug] = { image, dom: Math.round(dom * 10) / 10, visible: s.visible };
  console.log(`${slug}: image ${image}, dom ${results[slug].dom}, visible ${s.visible}`);
}
await closeBrowser();
const vals = Object.values(results);
const mean = (k: "image" | "dom") => Math.round((vals.reduce((a, r) => a + r[k], 0) / Math.max(vals.length, 1)) * 10) / 10;
writeFileSync("data/baseline/results.json", JSON.stringify({ at: new Date().toISOString(), method: "text boxes copied from measure.json, no model", sites: results, mean: { image: mean("image"), dom: mean("dom") } }, null, 2));
console.log(`\n${vals.length} held-out sites. Mean image score ${mean("image")}, mean DOM score ${mean("dom")}.`);
process.exit(0);
