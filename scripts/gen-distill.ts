// Generator distillation, step 1: generate hero sections, then grade each with no human:
// Impeccable's deterministic detector (AI-slop patterns) and the Juror (jury-v1, sent with record=false).
// Usage: npx tsx scripts/gen-distill.ts --tag <name> [--prompt generator-skills-v1] [--split train|holdout]
//        [--variants 6] [--backend mubit|local] [--concurrency 6]
// Writes data/gen/<tag>/<brand>-<family>-v<n>.html and results.jsonl. Rerun to resume.
// Sonnet 5.5 thinks adaptively by default and its thinking counts against max_tokens, so both calls get room
// (at 2,400 the teacher spent every token thinking and returned no HTML).
// Teacher and Juror run on Sonnet through Mubit's Anthropic route (the OpenAI route only serves GPT models).
// --backend local is the one exception to "every call through Mubit": a model on this machine (mlx_lm.server),
// used only to evaluate our own fine-tuned student. Juror calls always go through Mubit.
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { PRESETS, type Brand } from "../lib/brands";
import { userMessage } from "./gen-distill-msg";
import { FAMILIES, type Family } from "../lib/families";
import { JUROR_SYSTEM, jurorUserMessage, overallOf, parseReply } from "../lib/juror";
import { sanitise } from "../lib/sanitise";
import { screenshot } from "../lib/shot";
import { ask, image, text } from "../src/mubit";

const { values: opts } = parseArgs({
  options: {
    tag: { type: "string" },
    prompt: { type: "string", default: "generator-skills-v1" },
    split: { type: "string", default: "train" },
    variants: { type: "string", default: "6" },
    backend: { type: "string", default: "mubit" },
    concurrency: { type: "string", default: "6" },
  },
});
if (!opts.tag) throw new Error("--tag is required");

// Two families are never trained on, so the eval shows whether the student generalises to new layouts.
export const HOLDOUT_FAMILIES: Family[] = ["bento", "magazine"];
const families = FAMILIES.filter((f) => (opts.split === "holdout") === HOLDOUT_FAMILIES.includes(f));
const SYSTEM = readFileSync(path.join(process.cwd(), "prompts", `${opts.prompt}.md`), "utf8");
const OUT = `data/gen/${opts.tag}`;
const RESULTS = `${OUT}/results.jsonl`;
const MODEL = process.env.GEN_MODEL || "claude-sonnet-5-5";
const DETECT = process.env.IMPECCABLE_BIN || "impeccable";
mkdirSync(OUT, { recursive: true });


async function generateHtml(b: Brand, f: Family): Promise<string> {
  const user = userMessage(b, f);
  if (opts.backend === "local") {
    const res = await fetch("http://127.0.0.1:8080/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      // mlx_lm.server applies its --adapter-path only to "default_model".
      body: JSON.stringify({ model: "default_model", max_tokens: 2400, temperature: 0.9, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: user }] }),
    });
    if (!res.ok) throw new Error(`local model ${res.status}`);
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message.content ?? "";
  }
  return (await ask({ model: MODEL, system: SYSTEM, content: [text(user)], maxTokens: 16000, session: `gen-${b.id}-${f}`, record: opts.split !== "holdout" })).text;
}

type Finding = { antipattern: string; category: string };
// The brand kit fixes background colour and font stacks, so rules that only judge those are not the model's doing.
const BRAND_FIXED = new Set(["cream-palette", "overused-font", "system-font-display"]);
function detect(file: string) {
  const r = spawnSync(DETECT, ["detect", "--json", "--no-config", "--no-design-system", "--no-advisory", file], {
    encoding: "utf8",
    timeout: 30_000,
    stdio: ["ignore", "pipe", "pipe"], // with an open stdin pipe the detector waits for input forever
  });
  let findings: Finding[] = [];
  try {
    findings = JSON.parse(r.stdout || "[]");
  } catch {
    throw new Error(`detector output was not JSON: ${(r.stderr || r.stdout).slice(0, 200)}`);
  }
  findings = findings.filter((x) => !BRAND_FIXED.has(x.antipattern));
  return {
    slop: findings.filter((x) => x.category === "slop").length,
    quality: findings.filter((x) => x.category !== "slop").length,
    patterns: [...new Set(findings.map((x) => x.antipattern))],
  };
}

const done = new Set(existsSync(RESULTS) ? readFileSync(RESULTS, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l).id) : []);
const jobs = PRESETS.flatMap((b) => families.flatMap((f) => Array.from({ length: Number(opts.variants) }, (_, v) => ({ b, f, v, id: `${b.id}-${f}-v${v}` })))).filter((j) => !done.has(j.id));
console.log(`${opts.tag}: ${jobs.length} to do (${done.size} done), prompt ${opts.prompt}, backend ${opts.backend}, families ${families.join(",")}`);

let next = 0;
await Promise.all(
  Array.from({ length: Number(opts.concurrency) }, async () => {
    while (next < jobs.length) {
      const { b, f, v, id } = jobs[next++];
      try {
        const raw = (await generateHtml(b, f)).replace(/^```(?:html)?\s*|\s*```$/g, "").trim();
        const file = `${OUT}/${id}.html`;
        writeFileSync(file, raw);
        const t0 = Date.now();
        const det = detect(file);
        const shot = await screenshot(sanitise(raw));
        if (process.env.GEN_DEBUG) console.log(`${id}: detect+shot ${Date.now() - t0} ms`);
        const jpeg = Buffer.from(shot.dataUrl.split(",")[1], "base64");
        // One retry: the Juror occasionally returns a reply outside the score shape.
        const judgeOnce = async () =>
          parseReply((await ask({ model: MODEL, system: JUROR_SYSTEM, content: [text(jurorUserMessage(b, [])), image(jpeg, "image/jpeg")], maxTokens: 4000, record: false })).text);
        const j = await judgeOnce().catch(judgeOnce);
        const scores = { design: j.design, usability: j.usability, creativity: j.creativity, content: j.content };
        const row = { id, brand: b.id, family: f, variant: v, prompt: opts.prompt, backend: opts.backend, chars: raw.length, ...det, juror: scores, overall: overallOf(scores), note: j.note };
        appendFileSync(RESULTS, JSON.stringify(row) + "\n");
        console.log(`${id}: juror ${row.overall}, slop ${det.slop}, quality ${det.quality}, ${raw.length} chars`);
      } catch (err) {
        console.error(`${id}: ${(err as Error).message}`);
      }
    }
  }),
);
process.exit(0); // Playwright keeps the event loop alive.
