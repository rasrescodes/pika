// Scorecard data: held-out Awwwards sites, measured Juror runs, Try models recordings and the correction
// proof. Everything shown on /scorecard comes from these files; nothing is estimated.
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { z } from "zod";

const ROOT = process.cwd();
export const FILES = {
  sites: "data/scorecard/sites.json",
  results: "data/scorecard/results.json",
  trymodels: "data/scorecard/trymodels.json",
  pricing: "data/pricing.json",
  frozen: "data/proof/frozen-eval.json",
  proof: "data/proof/correction-proof.json",
  verdict: "data/scorecard/demo-ready.json",
} as const;

const s10 = z.number().int().min(1).max(10);
const Scores = z.object({ design: s10, usability: s10, creativity: s10, content: s10 });
export const Site = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  awwwardsUrl: z.string().url().refine((u) => /^https:\/\/(www\.)?awwwards\.com\//.test(u), "must be an awwwards.com URL"),
  jury: z.object({ design: z.number().min(1).max(10), usability: z.number().min(1).max(10), creativity: z.number().min(1).max(10), content: z.number().min(1).max(10) }),
  screenshot: z.string().min(1),
  takenBy: z.string().min(1),
  takenAt: z.string().min(1),
});
export const Run = z.object({
  site: z.string(),
  model: z.string(),
  kind: z.enum(["big", "small"]),
  scores: Scores,
  overall: z.number(),
  note: z.string(),
  ms: z.number(),
  usage: z.object({ input: z.number(), output: z.number() }).nullable(),
  at: z.string(),
});
export const Results = z.object({ runAt: z.string(), runs: z.array(Run) });
export const TryModel = z.object({ site: z.string(), scores: Scores, note: z.string(), adapterVersion: z.string().min(1), recordedBy: z.string().min(1), recordedAt: z.string().min(1) });
export const Price = z.object({ inPer1M: z.number().nonnegative(), outPer1M: z.number().nonnegative(), source: z.string().url(), checkedAt: z.string() });
const ProofReply = z.object({ section: z.string(), expected: z.enum(["up", "down"]), scores: Scores, overall: z.number() });
export const Proof = z.object({
  frozenEvalHash: z.string().min(8),
  correction: z.object({ reason: z.string().min(1), at: z.string() }),
  before: z.object({ adapterVersion: z.string().min(1), at: z.string(), replies: z.array(ProofReply).length(6) }),
  after: z.object({ adapterVersion: z.string().min(1), at: z.string(), replies: z.array(ProofReply).length(6) }),
});
export const Verdict = z.object({ status: z.enum(["PASS", "FAIL"]), dataHash: z.string(), gaps: z.array(z.string()), checkedAt: z.string() });

export function readJson(rel: string): unknown {
  const p = path.join(ROOT, rel);
  if (!existsSync(p)) return undefined;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return undefined;
  }
}

// Hash of every input the demo-ready verdict depends on, so a stale PASS never shows.
export function dataHash(): string {
  const h = createHash("sha256");
  for (const rel of [FILES.sites, FILES.results, FILES.trymodels, FILES.pricing, FILES.frozen, FILES.proof]) {
    const p = path.join(ROOT, rel);
    h.update(rel).update(existsSync(p) ? readFileSync(p) : "missing");
  }
  return h.digest("hex").slice(0, 16);
}

// Directional rule: the after-version moves each section in the direction the correction implies,
// on at least 4 of the 6 frozen sections.
export function directional(proof: z.infer<typeof Proof>): { moved: number; of: number; pass: boolean } {
  let moved = 0;
  for (const after of proof.after.replies) {
    const before = proof.before.replies.find((r) => r.section === after.section);
    if (!before) continue;
    const delta = after.overall - before.overall;
    if ((after.expected === "up" && delta > 0) || (after.expected === "down" && delta < 0)) moved++;
  }
  return { moved, of: 6, pass: moved >= 4 };
}

export function costPer100(model: string, runs: z.infer<typeof Run>[], pricing: Record<string, z.infer<typeof Price>>): { value: number | null; reason?: string } {
  const price = pricing[model];
  if (!price) return { value: null, reason: "no price recorded for this model" };
  const withUsage = runs.filter((r) => r.usage);
  if (withUsage.length === 0) return { value: null, reason: "no token usage returned" };
  const mean = withUsage.reduce((a, r) => a + (r.usage!.input * price.inPer1M + r.usage!.output * price.outPer1M) / 1e6, 0) / withUsage.length;
  return { value: Math.round(mean * 100 * 10000) / 10000 };
}

export function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}
