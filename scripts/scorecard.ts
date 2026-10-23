// Runs the Juror on every held-out site through Mubit and records scores, latency and token usage.
// Big model = MODEL. Small model = MUBIT_ADAPTER_MODEL, only if Mubit lets apps call adapters.
// Usage: npm run scorecard   (needs MUBIT_API_KEY + MODEL in .env and data/scorecard/sites.json)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { z } from "zod";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const { chat, mode } = await import("../lib/llm");
const { JUROR_SYSTEM, parseReply, overallOf } = await import("../lib/juror");
const { FILES, Site, readJson } = await import("../lib/scorecard");

if (mode() !== "MUBIT") {
  console.error("Scorecard needs MUBIT_API_KEY and MODEL in .env: it measures real model calls only.");
  process.exit(1);
}
const sites = z.array(Site).safeParse(readJson(FILES.sites));
if (!sites.success) {
  console.error("data/scorecard/sites.json is missing or invalid. See data/scorecard/README.md.");
  process.exit(1);
}

const models: { model: string; kind: "big" | "small" }[] = [{ model: process.env.MODEL!, kind: "big" }];
if (process.env.MUBIT_ADAPTER_MODEL) models.push({ model: process.env.MUBIT_ADAPTER_MODEL, kind: "small" });

const runs = [];
for (const site of sites.data) {
  const mime = site.screenshot.endsWith(".png") ? "image/png" : "image/jpeg";
  const image = `data:${mime};base64,${readFileSync(site.screenshot).toString("base64")}`;
  for (const { model, kind } of models) {
    try {
      const res = await chat({ system: JUROR_SYSTEM, user: `Site: ${site.name}. No art director notes yet.\nScore the section in the image.`, images: [image], maxTokens: 160, temperature: 0, model });
      const r = parseReply(res.text);
      const scores = { design: r.design, usability: r.usability, creativity: r.creativity, content: r.content };
      runs.push({ site: site.id, model, kind, scores, overall: overallOf(scores), note: r.note, ms: res.ms, usage: res.usage ?? null, at: new Date().toISOString() });
      console.log(`${site.id} ${kind} ${model}: ${overallOf(scores)} in ${res.ms} ms`);
    } catch (e) {
      console.error(`${site.id} ${kind} ${model}: failed`, e instanceof Error ? e.message : e);
    }
  }
}
writeFileSync(FILES.results, JSON.stringify({ runAt: new Date().toISOString(), runs }, null, 2));
console.log(`Wrote ${runs.length} runs to ${FILES.results}. Next: npm run check:demo-ready`);
