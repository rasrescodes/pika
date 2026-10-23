// Strict demo-ready validator. Exit 0 only when the scorecard is backed by real, sourced, provenance-stamped
// data and the correction proof passes the directional rule on the frozen evaluation. Writes its verdict
// (with a hash of the inputs) to data/scorecard/demo-ready.json; the page shows PASS only for the current hash.
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { z } from "zod";
import { FILES, Site, Results, TryModel, Price, Proof, readJson, dataHash, directional } from "../lib/scorecard";

const gaps: string[] = [];
const sites = z.array(Site).safeParse(readJson(FILES.sites));
if (!sites.success) gaps.push(`sites.json: ${sites.error?.issues[0]?.message ?? "missing"}`);
else {
  if (sites.data.length < 8) gaps.push(`sites.json: ${sites.data.length} sites, need at least 8`);
  for (const s of sites.data) if (!existsSync(s.screenshot)) gaps.push(`screenshot missing for ${s.id}: ${s.screenshot}`);
}

const results = Results.safeParse(readJson(FILES.results));
const tries = z.array(TryModel).safeParse(readJson(FILES.trymodels) ?? []);
if (!results.success) gaps.push("results.json: missing or invalid (run npm run scorecard)");
if (sites.success && results.success) {
  for (const s of sites.data) {
    const big = results.data.runs.find((r) => r.site === s.id && r.kind === "big");
    if (!big) gaps.push(`no big-model run for ${s.id}`);
    else if (!big.usage) gaps.push(`big-model run for ${s.id} has no token usage`);
    const small = results.data.runs.find((r) => r.site === s.id && r.kind === "small") ?? (tries.success ? tries.data.find((t) => t.site === s.id) : undefined);
    if (!small) gaps.push(`no small-model result for ${s.id} (measured or recorded in Try models)`);
  }
}

const pricing = z.record(z.string(), Price).safeParse(readJson(FILES.pricing) ?? {});
if (!pricing.success) gaps.push("pricing.json: invalid");
else if (results.success) {
  for (const m of new Set(results.data.runs.filter((r) => r.kind === "big").map((r) => r.model))) {
    if (!pricing.data[m]) gaps.push(`pricing.json: no price for ${m}`);
  }
}

const frozen = readJson(FILES.frozen) as { hash?: string; messages?: unknown } | undefined;
const proof = Proof.safeParse(readJson(FILES.proof));
if (!frozen?.messages) gaps.push("frozen-eval.json: missing");
if (!proof.success) gaps.push("correction-proof.json: missing or invalid");
else {
  const expected = frozen?.messages ? createHash("sha256").update(JSON.stringify(frozen.messages)).digest("hex").slice(0, 16) : "";
  if (proof.data.frozenEvalHash !== expected) gaps.push("correction proof was not produced from the current frozen evaluation");
  if (proof.data.before.adapterVersion === proof.data.after.adapterVersion) gaps.push("correction proof: before and after adapter versions are the same");
  if (new Date(proof.data.after.at) <= new Date(proof.data.correction.at)) gaps.push("correction proof: after-version is not later than the correction");
  const d = directional(proof.data);
  if (!d.pass) gaps.push(`correction proof: moved in the corrected direction on ${d.moved} of 6, need 4`);
}

const verdict = { status: gaps.length === 0 ? "PASS" : "FAIL", dataHash: dataHash(), gaps, checkedAt: new Date().toISOString() };
mkdirSync("data/scorecard", { recursive: true });
writeFileSync(FILES.verdict, JSON.stringify(verdict, null, 2));
console.log(verdict.status === "PASS" ? "DEMO-READY: PASS" : `DEMO-READY: FAIL (${gaps.length} gaps)\n- ${gaps.join("\n- ")}`);
process.exit(verdict.status === "PASS" ? 0 : 1);
