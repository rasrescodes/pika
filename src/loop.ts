// The reproduction loop. Describe the original, build blind from the spec, score, critique, revise.
// Usage:
//   npm run loop -- <slug> [<slug> ...]     run named sites
//   npm run loop -- --split train           run every site in <sites>/index.json with that split
// Holdout sites run with Mubit recording off, so they never become training examples.
// Options:
//   --sites data/sites --labels data/labels.json --mode image|dom --rounds 6 --target 80 --concurrency 3
//   --no-lessons      no playbook or lessons in the Describer's user message (the baseline)
//   --learn           update lessons after each site (sequential within a layout style, parallel across them)
//   --tag <name>      label runs (data/runs/<slug>/<time>-<mode>-<tag>); with --resume, skip sites already done under it
//   --max-calls <n>   stop starting new sites once this process has made n LLM calls
//   image: the Describer sees the screenshot and an LLM Critic compares screenshots.
//   dom:   the Describer reads measure.json as text and the fixes come from a code diff of measurements.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { parseArgs } from "node:util";
import { describe, describeDom, build, critique, updateLessons } from "./agents.ts";
import { usage } from "./mubit.ts";
import { render, closeBrowser } from "./render.ts";
import { measureToText, type Measure } from "./measure.ts";
import { domFixes } from "./dom-diff.ts";
import { score, type Box, type Score } from "./score.ts";

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    sites: { type: "string", default: "data/sites" },
    labels: { type: "string", default: "data/labels.json" },
    split: { type: "string" },
    mode: { type: "string", default: "image" },
    rounds: { type: "string", default: "6" },
    target: { type: "string", default: "80" },
    concurrency: { type: "string", default: "3" },
    "no-lessons": { type: "boolean", default: false },
    learn: { type: "boolean", default: false },
    tag: { type: "string", default: "run" },
    resume: { type: "boolean", default: false },
    "max-calls": { type: "string", default: "100000" },
  },
});

if (!["image", "dom"].includes(opts.mode!)) throw new Error("--mode is image or dom");
const DOM = opts.mode === "dom";
const MODE = opts.mode!;
const TAG = opts.tag!;

type Entry = { slug: string; split: string; image_heavy?: number; big_canvas?: boolean };
type Labels = { visual_style?: string; layout_style?: string; category?: string; bad_capture?: string };
const readJson = <T>(path: string, fallback: T): T => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : fallback);
const INDEX: Entry[] = readJson(`${opts.sites}/index.json`, []);
const SPLIT = new Map(INDEX.map((s) => [s.slug, s.split]));
const LABELS: Record<string, Labels> = readJson(opts.labels!, {});
const layoutOf = (slug: string) => LABELS[slug]?.layout_style ?? "unlabelled";

// Lessons are kept per mode (pixels and numbers need different advice) and per layout style,
// plus one file of rules that hold for every layout. The playbook is the fixed advice for a layout.
const lessonPath = (layout: string) => `data/lessons/${MODE}/${layout}.md`;
const ALL = "_all";
const read = (path: string) => (existsSync(path) ? readFileSync(path, "utf8").trim() : "");
function guidance(slug: string) {
  if (opts["no-lessons"]) return "";
  const layout = layoutOf(slug);
  const playbook = read(`prompts/playbooks/${layout}.md`);
  const lessons = [read(lessonPath(ALL)), read(lessonPath(layout))].filter(Boolean).join("\n");
  return [playbook && `PLAYBOOK:\n${playbook}`, `HOUSE LESSONS:\n${lessons || "(none yet)"}`].filter(Boolean).join("\n\n");
}

function alreadyDone(slug: string) {
  const dir = `data/runs/${slug}`;
  return existsSync(dir) && readdirSync(dir).some((d) => d.endsWith(`-${MODE}-${TAG}`) && existsSync(`${dir}/${d}/run.json`));
}

type Round = { round: number; score: Score; fixes: string[]; describerRequestId: string | null; ms: number };

async function runSite(slug: string) {
  const dir = `${opts.sites}/${slug}`;
  const record = SPLIT.get(slug) !== "holdout";
  const original = readFileSync(`${dir}/original.png`);
  const masks: Box[] = readJson(`${dir}/masks.json`, []);
  const measured: Measure | undefined = DOM ? readJson(`${dir}/measure.json`, undefined) : undefined;
  if (DOM && !measured) throw new Error("no measure.json");
  const measuredText = measured ? measureToText(measured, masks) : "";
  const lessons = guidance(slug);
  const runDir = `data/runs/${slug}/${new Date().toISOString().replace(/[:.]/g, "-")}-${MODE}-${TAG}`;
  const session = `site-${slug}`;
  const callsBefore = usage.calls;
  const rounds: Round[] = [];
  let spec: string | undefined;
  let fixes: string[] = [];

  for (let round = 1; round <= Number(opts.rounds); round++) {
    const started = Date.now();
    const input = { lessons, previousSpec: spec, fixes };
    const d = DOM
      ? await describeDom({ ...input, measured: measuredText }, session, record)
      : await describe({ ...input, original }, session, record);
    spec = d.text.trim();
    const b = await build(spec, session, record);
    let png: Buffer;
    let measure: Measure | undefined;
    try {
      ({ png, measure } = await render(b.html));
    } catch {
      // A rebuild that won't render scores zero rather than stopping the batch.
      png = await render("<!doctype html><body style='margin:0;background:#fff'></body>").then((r) => r.png);
    }
    const s = await score(original, png, masks);
    const out = `${runDir}/r${round}`;
    mkdirSync(out, { recursive: true });
    writeFileSync(`${out}/spec.md`, spec);
    writeFileSync(`${out}/build.html`, b.html);
    writeFileSync(`${out}/build.png`, png);

    const done = s.total >= Number(opts.target) || round === Number(opts.rounds);
    if (done) fixes = [];
    else if (DOM) fixes = domFixes(measured!, measure ?? { texts: [], bodyBg: "#ffffff", dominantBgs: [] });
    else fixes = (await critique(original, png, spec, session, record)).fixes;
    const r: Round = { round, score: s, fixes, describerRequestId: d.requestId, ms: Date.now() - started };
    writeFileSync(`${out}/round.json`, JSON.stringify(r, null, 2));
    rounds.push(r);
    console.log(`${slug} [${MODE}/${TAG}] r${round}: ${s.total} (structure ${s.structure}, colour ${s.colour}, edges ${s.edges})`);
    if (done) break;
  }

  const best = rounds.reduce((a, b) => (b.score.total > a.score.total ? b : a));
  const summary = {
    slug,
    mode: MODE,
    tag: TAG,
    split: SPLIT.get(slug) ?? "unknown",
    ...LABELS[slug],
    recorded: record,
    lessonsUsed: lessons.length > 0,
    firstShot: rounds[0].score.total,
    best: best.score.total,
    bestRound: best.round,
    rounds: rounds.length,
    converged: best.score.total >= Number(opts.target),
    calls: usage.calls - callsBefore,
  };
  writeFileSync(`${runDir}/run.json`, JSON.stringify({ ...summary, lessons, history: rounds }, null, 2));

  if (opts.learn) {
    const allFixes = rounds.flatMap((r) => r.fixes);
    if (allFixes.length) {
      const layout = layoutOf(slug);
      mkdirSync(`data/lessons/${MODE}`, { recursive: true });
      writeFileSync(lessonPath(layout), (await updateLessons(read(lessonPath(layout)), allFixes)) + "\n");
    }
  }
  return summary;
}

// Runs queues in parallel, each queue in order. With --learn a queue is one layout style,
// so a layout's lessons build up site by site while different layouts run side by side.
async function runQueues(queues: string[][], n: number) {
  const results: Awaited<ReturnType<typeof runSite>>[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, queues.length) }, async () => {
      while (next < queues.length) {
        for (const slug of queues[next++]) {
          if (usage.calls >= Number(opts["max-calls"])) return;
          try {
            results.push(await runSite(slug));
          } catch (err) {
            console.error(`${slug}: ${(err as Error).message}`);
          }
        }
      }
    }),
  );
  return results;
}

// Rules for every layout, distilled from the per-layout lessons after a learning pass.
async function refreshAllLessons() {
  const dir = `data/lessons/${MODE}`;
  if (!existsSync(dir)) return;
  const rules = readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== `${ALL}.md`)
    .flatMap((f) => read(`${dir}/${f}`).split("\n"))
    .filter((l) => l.startsWith("- "))
    .map((l) => l.slice(2));
  if (rules.length) writeFileSync(lessonPath(ALL), (await updateLessons(read(lessonPath(ALL)), rules)) + "\n");
}

let slugs = positionals;
// The pixel score is mostly masked on media-heavy heroes, so the screenshot loop keeps to type-led ones.
const pixelFriendly = (s: Entry) => (s.image_heavy ?? 0) <= 0.5 && !s.big_canvas;
// Labellers flag captures that show a loader or an error page instead of the hero.
if (opts.split) slugs = INDEX.filter((s) => s.split === opts.split && (DOM || pixelFriendly(s)) && !LABELS[s.slug]?.bad_capture).map((s) => s.slug);
if (opts.resume) slugs = slugs.filter((s) => !alreadyDone(s));
if (!slugs.length) {
  console.log("Nothing to run (no sites matched, or all done under this tag).");
  process.exit(0);
}

const queues = opts.learn
  ? Object.values(Object.groupBy(slugs, layoutOf)).map((q) => q!)
  : slugs.map((s) => [s]);
const results = await runQueues(queues, Number(opts.concurrency));
if (opts.learn) await refreshAllLessons();
await closeBrowser();
console.table(results.map(({ slug, layout_style, firstShot, best, rounds, calls }) => ({ slug, layout_style, firstShot, best, rounds, calls })));
console.log(`LLM calls ${usage.calls}, tokens in ${usage.inTokens}, out ${usage.outTokens}`);
