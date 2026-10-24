// Jury mode: can Pika see what the Awwwards jury sees? The answer key is the real jury's scores for
// every captured Site of the Day (data/sites/<slug>/meta.json). Held out = Luka's holdout split plus
// data/holdout-extra.json; held-out calls are never recorded for training.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
export const CRITERIA = ["design", "usability", "creativity", "content"] as const;
export type Criterion = (typeof CRITERIA)[number];
export type Jury = Record<Criterion, number> & { overall: number };
export type JurySite = {
  slug: string;
  url: string;
  awwwardsUrl: string;
  jury: Jury;
  heldOut: boolean;
  visualStyle: string;
  layoutStyle: string;
  hasThumb: boolean;
};

function json<T>(p: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(p, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function jurySites(): JurySite[] {
  const dir = path.join(ROOT, "data", "sites");
  if (!existsSync(dir)) return [];
  const labels = json<Record<string, { visual_style?: string; layout_style?: string; bad_capture?: boolean }>>(path.join(ROOT, "data", "labels.json"), {});
  const extra = new Set(json<{ slugs: string[] }>(path.join(ROOT, "data", "holdout-extra.json"), { slugs: [] }).slugs);
  const out: JurySite[] = [];
  for (const slug of readdirSync(dir)) {
    const meta = json<{ url: string; awwwards_url: string; split: string; jury?: Partial<Jury> } | null>(path.join(dir, slug, "meta.json"), null);
    const j = meta?.jury;
    if (!meta || !j || labels[slug]?.bad_capture) continue;
    if ([...CRITERIA, "overall" as const].some((c) => typeof j[c] !== "number")) continue;
    out.push({
      slug,
      url: meta.url,
      awwwardsUrl: meta.awwwards_url,
      jury: j as Jury,
      heldOut: meta.split === "holdout" || extra.has(slug),
      visualStyle: labels[slug]?.visual_style ?? "unlabelled",
      layoutStyle: labels[slug]?.layout_style ?? "unlabelled",
      hasThumb: existsSync(path.join(dir, slug, "thumb.jpg")),
    });
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

// The criterion the jury rewarded most, relative to this site's own average.
export function topCriterion(j: Record<Criterion, number>): Criterion {
  return CRITERIA.reduce((a, c) => (j[c] > j[a] ? c : a), CRITERIA[0]);
}

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
export const round = (x: number, d = 3) => Math.round(x * 10 ** d) / 10 ** d;

// Pairs of held-out sites whose overall jury scores differ clearly (>= gap): the "which did the jury
// prefer" task. Ties and near-ties are excluded because the jury itself barely separates them.
export function clearPairs(sites: JurySite[], gap = 0.3): [JurySite, JurySite][] {
  const out: [JurySite, JurySite][] = [];
  for (let i = 0; i < sites.length; i++) for (let k = i + 1; k < sites.length; k++) {
    if (Math.abs(sites[i].jury.overall - sites[k].jury.overall) >= gap) out.push([sites[i], sites[k]]);
  }
  return out;
}

export type Prediction = { slug: string; scores: Record<Criterion, number>; overall: number; note: string; ms: number; usage?: { input: number; output: number } };

// The three measurable tasks, scored on held-out sites only.
export function evaluate(preds: Prediction[], sites: JurySite[]) {
  const bySlug = new Map(sites.map((s) => [s.slug, s]));
  const scored = preds.filter((p) => bySlug.get(p.slug)?.heldOut);
  const mae = mean(scored.map((p) => Math.abs(p.overall - bySlug.get(p.slug)!.jury.overall)));
  const top = mean(scored.map((p) => (topCriterion(p.scores) === topCriterion(bySlug.get(p.slug)!.jury) ? 1 : 0)));
  const ps = new Map(scored.map((p) => [p.slug, p]));
  const pairs = clearPairs(scored.map((p) => bySlug.get(p.slug)!));
  const pairAcc = mean(pairs.map(([a, b]) => ((ps.get(a.slug)!.overall - ps.get(b.slug)!.overall) * (a.jury.overall - b.jury.overall) > 0 ? 1 : 0)));
  return { n: scored.length, maeOverall: round(mae), topCriterionAccuracy: round(top), pairAccuracy: round(pairAcc), pairs: pairs.length };
}

export function readJson<T>(rel: string, fallback: T): T {
  return json<T>(path.join(ROOT, rel), fallback);
}
