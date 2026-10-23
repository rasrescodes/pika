// Measured features for every captured site, no LLM: theme, colourfulness, type mix, columns, density, palette.
// Usage: npm run features -- [sites dir]   writes data/features.json
import { readdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import type { Measure } from "../src/measure.ts";

const SITES = process.argv[2] || "data/sites";
// Matched against the first named family only, so a "sans-serif" fallback doesn't count as serif.
const SERIF = /^serif$|times|georgia|garamond|playfair|canela|tiempos|freight|caslon|baskerville|bodoni|didot|ogg|editorial|recoleta|fraunces|newsreader|cormorant|libre caslon|gt sectra|domaine|reckless/i;
const MONO = /mono|courier|code|plex mono|jetbrains|space mono|ibm plex mono|fira code/i;

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  if (Number.isNaN(n)) return 1;
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

async function pixels(png: Buffer) {
  const { data } = await sharp(png).resize(144, 90).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  // Hasler and Suesstrunk colourfulness.
  const rg: number[] = [];
  const yb: number[] = [];
  const bins = new Map<string, number>();
  for (let i = 0; i < data.length; i += 3) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    rg.push(r - g);
    yb.push((r + g) / 2 - b);
    const key = "#" + [r, g, b].map((v) => ((v >> 4) * 17).toString(16).padStart(2, "0")).join("");
    bins.set(key, (bins.get(key) ?? 0) + 1);
  }
  const stats = (xs: number[]) => {
    const m = xs.reduce((a, b) => a + b, 0) / xs.length;
    return { m, sd: Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length) };
  };
  const a = stats(rg);
  const b = stats(yb);
  const colourfulness = Math.sqrt(a.sd ** 2 + b.sd ** 2) + 0.3 * Math.sqrt(a.m ** 2 + b.m ** 2);
  const total = data.length / 3;
  const palette = [...bins].sort((x, y) => y[1] - x[1]).slice(0, 5).map(([c, n]) => ({ c, share: Math.round((n / total) * 100) / 100 }));
  return { colourfulness: Math.round(colourfulness), palette };
}

const out: Record<string, unknown> = {};
for (const slug of readdirSync(SITES)) {
  const dir = `${SITES}/${slug}`;
  if (!existsSync(`${dir}/measure.json`) || !existsSync(`${dir}/original.png`)) continue;
  const m: Measure = JSON.parse(readFileSync(`${dir}/measure.json`, "utf8"));
  const px = await pixels(readFileSync(`${dir}/original.png`));
  const texts = m.texts;
  const sizes = texts.map((t) => parseFloat(t.fontSize) || 0);
  const family = (t: Measure["texts"][number]) => t.fontFamily.split(",")[0].replace(/"/g, "");
  const share = (re: RegExp) => (texts.length ? texts.filter((t) => re.test(family(t).trim())).length / texts.length : 0);
  const serif = share(SERIF);
  const mono = share(MONO);
  const coverage = texts.reduce((a, t) => a + t.bbox.w * t.bbox.h, 0) / (1440 * 900);
  // Columns: distinct left edges (40px bins) shared by at least two text elements.
  const lefts = new Map<number, number>();
  for (const t of texts) lefts.set(Math.round(t.bbox.x / 40), (lefts.get(Math.round(t.bbox.x / 40)) ?? 0) + 1);
  const columns = [...lefts.values()].filter((n) => n >= 2).length;
  const bgL = lum(m.bodyBg);
  const bgSat = px.palette[0] ? (() => {
    const n = parseInt(px.palette[0].c.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    return (Math.max(...c) - Math.min(...c)) / 255;
  })() : 0;
  out[slug] = {
    theme: bgSat > 0.35 ? "colourful" : bgL < 0.35 ? "dark" : "light",
    colourfulness: px.colourfulness,
    type_mix: mono > 0.5 ? "mono" : serif > 0.5 ? "serif" : serif > 0.15 || mono > 0.15 ? "mixed" : "sans",
    families: [...new Set(texts.map(family))].slice(0, 4),
    max_font_px: Math.round(Math.max(0, ...sizes)),
    texts: texts.length,
    text_coverage: Math.round(coverage * 100) / 100,
    columns,
    density: texts.length >= 30 || coverage > 0.35 ? "dense" : texts.length <= 8 ? "sparse" : "balanced",
    nav_texts_top: texts.filter((t) => t.bbox.y < 100).length,
    body_bg: m.bodyBg,
    palette: px.palette,
  };
}
writeFileSync("data/features.json", JSON.stringify(out, null, 1));
console.log(`features for ${Object.keys(out).length} sites -> data/features.json`);
