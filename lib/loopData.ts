// Read-only access to the reproduction loop's files for the interface: the captured sites
// (data/sites/<slug>), their labels, and the loop's runs (data/runs/<slug>/<run>/r<N>/).
// Nothing here calls a model; the loop itself runs from the command line (npm run loop / batch).
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SITES = path.join(ROOT, "data", "sites");
const RUNS = path.join(ROOT, "data", "runs");

export type Jury = { design: number; usability: number; creativity: number; content: number; overall: number };
export type SiteMeta = {
  slug: string;
  url: string;
  awwwards_url: string;
  award?: string;
  award_date?: string;
  jury: Jury;
  split: "train" | "holdout";
  image_heavy?: number;
  big_canvas?: boolean;
};
export type Label = { visual_style?: string; layout_style?: string; category?: string; theme?: string; difficulty?: number; note?: string; bad_capture?: boolean };
export type Site = SiteMeta & { label: Label; hasThumb: boolean; heldOut: boolean; heldOutWhy: string | null };

export type Score = { total: number; structure: number; colour: number; edges: number; visible: number; dom?: number };
export type Round = { round: number; score: Score; fixes: string[]; ms: number; spec: string; hasBuild: boolean };
export type Run = { id: string; slug: string; mode: string; tag: string; at: string; rounds: Round[]; firstShot: number; best: number; bestRound: number; converged: boolean };

function json<T>(p: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(p, "utf8")) as T;
  } catch {
    return fallback;
  }
}

let labelsCache: Record<string, Label> | null = null;
function labels(): Record<string, Label> {
  if (!labelsCache) labelsCache = json<Record<string, Label>>(path.join(ROOT, "data", "labels.json"), {});
  return labelsCache;
}

const SLUG = /^[a-z0-9][a-z0-9-]{0,80}$/;

// Held out = never recorded for training: the main holdout split plus Luka's extra list of
// type-led training sites kept back for the screenshot scorecard (data/holdout-extra.json).
let extraCache: string[] | null = null;
function holdoutExtra(): string[] {
  if (!extraCache) extraCache = json<{ slugs: string[] }>(path.join(ROOT, "data", "holdout-extra.json"), { slugs: [] }).slugs;
  return extraCache;
}

export function listSites(): Site[] {
  if (!existsSync(SITES)) return [];
  return readdirSync(SITES)
    .filter((s) => SLUG.test(s) && existsSync(path.join(SITES, s, "meta.json")))
    .map((s) => getSite(s))
    .filter((s): s is Site => !!s);
}

export function getSite(slug: string): Site | null {
  if (!SLUG.test(slug)) return null;
  const meta = json<SiteMeta | null>(path.join(SITES, slug, "meta.json"), null);
  if (!meta) return null;
  const extra = holdoutExtra().includes(slug);
  const heldOut = meta.split === "holdout" || extra;
  return {
    ...meta,
    label: labels()[slug] ?? {},
    hasThumb: existsSync(path.join(SITES, slug, "thumb.jpg")),
    heldOut,
    heldOutWhy: meta.split === "holdout" ? "held-out set" : extra ? "extra held-out set" : null,
  };
}

// Runs are folders named <ISO time with dashes>-<mode>-<tag>; rounds are r1, r2, ...
export function listRuns(slug: string): Run[] {
  if (!SLUG.test(slug)) return [];
  const dir = path.join(RUNS, slug);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((d) => statSync(path.join(dir, d)).isDirectory())
    .map((d) => readRun(slug, d))
    .filter((r): r is Run => !!r)
    .sort((a, b) => b.at.localeCompare(a.at));
}

function readRun(slug: string, id: string): Run | null {
  const dir = path.join(RUNS, slug, id);
  const m = id.match(/^(\d{4}-\d{2}-\d{2}T[\d-]+Z?)-([a-z]+)-(.+)$/);
  const rounds = readdirSync(dir)
    .filter((r) => /^r\d+$/.test(r))
    .map((r) => {
      const rd = path.join(dir, r);
      const meta = json<{ round: number; score: Score; fixes: string[]; ms: number } | null>(path.join(rd, "round.json"), null);
      if (!meta) return null;
      return { ...meta, spec: existsSync(path.join(rd, "spec.md")) ? readFileSync(path.join(rd, "spec.md"), "utf8") : "", hasBuild: existsSync(path.join(rd, "build.png")) };
    })
    .filter((r): r is Round => !!r)
    .sort((a, b) => a.round - b.round);
  if (rounds.length === 0) return null;
  const best = rounds.reduce((a, b) => (b.score.total > a.score.total ? b : a));
  const summary = json<{ converged?: boolean } | null>(path.join(dir, "run.json"), null);
  return {
    id,
    slug,
    mode: m?.[2] ?? "image",
    tag: m?.[3] ?? "",
    at: m?.[1] ?? id,
    rounds,
    firstShot: rounds[0].score.total,
    best: best.score.total,
    bestRound: best.round,
    converged: summary?.converged ?? false,
  };
}

// Files the interface may serve. Anything else is refused (no path traversal, no site code).
export function servableFile(parts: string[]): { file: string; type: string } | null {
  const rel = parts.join("/");
  const site = rel.match(/^sites\/([a-z0-9-]+)\/(original\.png|thumb\.jpg)$/);
  const build = rel.match(/^runs\/([a-z0-9-]+)\/([A-Za-z0-9._-]+)\/(r\d+)\/build\.png$/);
  const base = rel.match(/^baseline\/([a-z0-9-]+)\.png$/);
  if (!site && !build && !base) return null;
  const file = path.join(ROOT, "data", ...parts);
  if (!file.startsWith(path.join(ROOT, "data") + path.sep) || !existsSync(file)) return null;
  return { file, type: rel.endsWith(".jpg") ? "image/jpeg" : "image/png" };
}

export type Report = { headline?: Record<string, unknown>; runs?: unknown[] } | null;
export function readReport(): Report {
  return json<Report>(path.join(ROOT, "data", "batch", "report.json"), null);
}
