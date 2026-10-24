// Jury mode run: does Pika learn to see what the Awwwards jury sees?
//   1. baseline: score every held-out site with no calibration notes (not recorded for training)
//   2. train:    score training sites; after each, the real jury's scores become a correction, and the
//                running calibration notes go into every later call (recorded: Mubit trains on these)
//   3. eval:     score held-out sites again with the final notes (not recorded)
// Measured against the free baselines in data/jury/baselines.json. Writes data/jury/runs/<phase>.json
// and data/jury/results.json. Needs MUBIT_API_KEY + MODEL; every call goes through lib/llm.ts (Mubit
// only, daily cap). Usage: npx tsx scripts/jury-run.ts [--dry-run] [--limit-train N]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { z } from "zod";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const { values: opts } = parseArgs({ options: { "dry-run": { type: "boolean", default: false }, "limit-train": { type: "string", default: "178" } } });

const { chat, mode, callsToday } = await import("../lib/llm");
const { jurySites, CRITERIA, evaluate, mean, round } = await import("../lib/jury");
type Prediction = import("../lib/jury").Prediction;
type JurySite = import("../lib/jury").JurySite;

const SYSTEM = readFileSync("prompts/jury-v1.md", "utf8");
const s = z.number().min(1).max(10);
const Reply = z.object({ design: s, usability: s, creativity: s, content: s, note: z.string().max(200) });

const sites = jurySites();
const held = sites.filter((x) => x.heldOut);
const train = sites.filter((x) => !x.heldOut).slice(0, Number(opts["limit-train"]));
const planned = held.length * 2 + train.length;
const cap = Number(process.env.PIKA_MAX_CALLS_PER_DAY ?? 300);
console.log(`Plan: ${held.length} held-out (baseline) + ${train.length} training + ${held.length} held-out (eval) = ${planned} calls. Daily cap ${cap}, used today ${callsToday().calls}.`);
if (opts["dry-run"]) process.exit(0);
if (mode() !== "MUBIT") {
  console.error("No Mubit key: set MUBIT_API_KEY and MODEL in .env. Nothing was called.");
  process.exit(1);
}
if (callsToday().calls + planned > cap) {
  console.error(`This run needs ${planned} calls but only ${cap - callsToday().calls} remain under today's cap. Use --limit-train or raise PIKA_MAX_CALLS_PER_DAY on purpose.`);
  process.exit(1);
}

// Calibration notes: what the real jury taught us so far, as plain sentences in the USER message
// (the system prompt never changes, so every call is one Mubit task).
type Miss = { site: JurySite; pred: Prediction };
function notes(misses: Miss[]): string {
  if (misses.length < 3) return "No calibration notes yet.";
  const d = (k: "overall" | (typeof CRITERIA)[number]) => mean(misses.map((m) => (k === "overall" ? m.site.jury.overall - m.pred.overall : m.site.jury[k] - m.pred.scores[k])));
  const lines = [`From ${misses.length} sites compared with the real jury:`];
  const o = d("overall");
  lines.push(`- Overall you score ${Math.abs(o).toFixed(2)} ${o > 0 ? "too low" : "too high"} on average.`);
  for (const c of CRITERIA) {
    const v = d(c);
    if (Math.abs(v) >= 0.1) lines.push(`- ${c}: you score ${Math.abs(v).toFixed(2)} ${v > 0 ? "too low" : "too high"}.`);
  }
  const byStyle = new Map<string, number[]>();
  for (const m of misses) byStyle.set(m.site.visualStyle, [...(byStyle.get(m.site.visualStyle) ?? []), m.site.jury.overall - m.pred.overall - o]);
  for (const [style, xs] of byStyle) {
    if (xs.length >= 4 && Math.abs(mean(xs)) >= 0.08) lines.push(`- ${style.replace(/-/g, " ")} sites: the jury rates them ${Math.abs(mean(xs)).toFixed(2)} ${mean(xs) > 0 ? "higher" : "lower"} than you do.`);
  }
  return lines.join("\n");
}

async function judge(site: JurySite, calibration: string, record: boolean): Promise<Prediction | null> {
  const image = `data:image/png;base64,${readFileSync(`data/sites/${site.slug}/original.png`).toString("base64")}`;
  try {
    const res = await chat({ system: SYSTEM, user: `${calibration}\nScore this site.`, images: [image], maxTokens: 160, temperature: 0, record });
    const r = Reply.parse(JSON.parse(res.text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "")));
    const scores = { design: r.design, usability: r.usability, creativity: r.creativity, content: r.content };
    return { slug: site.slug, scores, overall: round(mean(Object.values(scores)), 2), note: r.note, ms: res.ms, usage: res.usage };
  } catch (e) {
    console.error(`${site.slug}: failed`, e instanceof Error ? e.message : e);
    return null;
  }
}

mkdirSync("data/jury/runs", { recursive: true });
const save = (phase: string, preds: Prediction[], calibration?: string) => writeFileSync(`data/jury/runs/${phase}.json`, JSON.stringify({ phase, at: new Date().toISOString(), calibration, predictions: preds }, null, 2));

const baseline: Prediction[] = [];
for (const site of held) { const p = await judge(site, "No calibration notes yet.", false); if (p) baseline.push(p); }
save("baseline", baseline);
console.log("baseline", evaluate(baseline, sites));

const misses: Miss[] = [];
const trained: Prediction[] = [];
for (const site of train) {
  const p = await judge(site, notes(misses), true);
  if (!p) continue;
  trained.push(p);
  misses.push({ site, pred: p });
}
const finalNotes = notes(misses);
save("train", trained, finalNotes);

const evalPreds: Prediction[] = [];
for (const site of held) { const p = await judge(site, finalNotes, false); if (p) evalPreds.push(p); }
save("eval", evalPreds, finalNotes);

const results = { at: new Date().toISOString(), model: process.env.MODEL, before: evaluate(baseline, sites), after: evaluate(evalPreds, sites), calibration: finalNotes, trainCalls: trained.length };
writeFileSync("data/jury/results.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
