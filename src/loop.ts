// The reproduction loop. Describe the original, build blind from the spec, score, critique, revise.
// Usage:
//   npm run loop -- <slug> [<slug> ...]     run named sites
//   npm run loop -- --split train           run every site in data/sites/index.json with that split
// Options: --rounds 6 --target 80 --concurrency 3 --no-lessons --learn (update house lessons after each site)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { describe, build, critique, updateLessons } from "./agents.ts";
import { renderHtml, closeBrowser } from "./render.ts";
import { score, type Box, type Score } from "./score.ts";

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    split: { type: "string" },
    rounds: { type: "string", default: "6" },
    target: { type: "string", default: "80" },
    concurrency: { type: "string", default: "3" },
    "no-lessons": { type: "boolean", default: false },
    learn: { type: "boolean", default: false },
  },
});

const LESSONS = "data/lessons.md";
const readLessons = () => (opts["no-lessons"] || !existsSync(LESSONS) ? "" : readFileSync(LESSONS, "utf8"));

type Round = { round: number; score: Score; fixes: string[]; describerRequestId: string | null; ms: number };

async function runSite(slug: string) {
  const dir = `data/sites/${slug}`;
  const original = readFileSync(`${dir}/original.png`);
  const masks: Box[] = existsSync(`${dir}/masks.json`) ? JSON.parse(readFileSync(`${dir}/masks.json`, "utf8")) : [];
  const lessons = readLessons();
  const runDir = `data/runs/${slug}/${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const session = `site-${slug}`;
  const rounds: Round[] = [];
  let spec: string | undefined;
  let fixes: string[] = [];

  for (let round = 1; round <= Number(opts.rounds); round++) {
    const started = Date.now();
    const d = await describe({ original, lessons, previousSpec: spec, fixes }, session);
    spec = d.text.trim();
    const b = await build(spec, session);
    const png = await renderHtml(b.html);
    const s = await score(original, png, masks);
    const out = `${runDir}/r${round}`;
    mkdirSync(out, { recursive: true });
    writeFileSync(`${out}/spec.md`, spec);
    writeFileSync(`${out}/build.html`, b.html);
    writeFileSync(`${out}/build.png`, png);

    const done = s.total >= Number(opts.target) || round === Number(opts.rounds);
    fixes = done ? [] : (await critique(original, png, spec, session)).fixes;
    const r: Round = { round, score: s, fixes, describerRequestId: d.requestId, ms: Date.now() - started };
    writeFileSync(`${out}/round.json`, JSON.stringify(r, null, 2));
    rounds.push(r);
    console.log(`${slug} r${round}: ${s.total} (structure ${s.structure}, colour ${s.colour}, edges ${s.edges})`);
    if (done) break;
  }

  const best = rounds.reduce((a, b) => (b.score.total > a.score.total ? b : a));
  const summary = {
    slug,
    lessonsUsed: lessons.trim().length > 0,
    firstShot: rounds[0].score.total,
    best: best.score.total,
    bestRound: best.round,
    rounds: rounds.length,
    converged: best.score.total >= Number(opts.target),
  };
  writeFileSync(`${runDir}/run.json`, JSON.stringify({ ...summary, lessons, history: rounds }, null, 2));

  if (opts.learn) {
    const allFixes = rounds.flatMap((r) => r.fixes);
    if (allFixes.length) writeFileSync(LESSONS, (await updateLessons(readLessons(), allFixes)) + "\n");
  }
  return summary;
}

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>) {
  const results: R[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) {
        const item = items[next++];
        try {
          results.push(await fn(item));
        } catch (err) {
          console.error(`${item}: ${(err as Error).message}`);
        }
      }
    }),
  );
  return results;
}

let slugs = positionals;
if (opts.split) {
  const index: { slug: string; split: string }[] = JSON.parse(readFileSync("data/sites/index.json", "utf8"));
  slugs = index.filter((s) => s.split === opts.split).map((s) => s.slug);
}
if (!slugs.length) {
  console.error("Name sites or pass --split train|holdout.");
  process.exit(1);
}

// --learn updates lessons between sites, so it runs one site at a time.
const results = await pool(slugs, opts.learn ? 1 : Number(opts.concurrency), runSite);
await closeBrowser();
console.table(results);
