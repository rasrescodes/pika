// The overnight batch. Resumable: rerun it and it picks up where it stopped.
//   1. smoke: one image call through Mubit, or stop
//   2. baseline: holdout, first shot only, no playbooks or lessons
//   3. per epoch: train with --learn (recorded, so Mubit gets Describer examples), then eval on holdout
//   stops after MAX_EPOCHS, when holdout first-shot gains less than 1 point twice in a row, or at the call budget
// Usage: npm run batch   (env: BATCH_MAX_CALLS=5000 BATCH_MAX_EPOCHS=4 BATCH_MODES=image,dom BATCH_SITES=data/sites)
import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import { loadRuns, report } from "./report.ts";

const SITES = process.env.BATCH_SITES || "data/sites";
const MAX_CALLS = Number(process.env.BATCH_MAX_CALLS || 5000);
const MAX_EPOCHS = Number(process.env.BATCH_MAX_EPOCHS || 4);
const MODES = (process.env.BATCH_MODES || "image,dom").split(",");
const LOG = "data/batch/batch.log";
mkdirSync("data/batch", { recursive: true });

const log = (msg: string) => {
  const line = `${new Date().toISOString()} ${msg}`;
  console.log(line);
  appendFileSync(LOG, line + "\n");
};

// Local-backend runs cost nothing and never count against the Mubit budget.
const spent = () => loadRuns().filter((r) => r.backend !== "local").reduce((a, r) => a + (r.calls ?? 0), 0);

function run(cmd: string, args: string[]) {
  return new Promise<number>((resolve) => {
    log(`$ ${cmd} ${args.join(" ")}`);
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    p.stdout.on("data", (d) => appendFileSync(LOG, d));
    p.stderr.on("data", (d) => appendFileSync(LOG, d));
    p.on("close", (code) => resolve(code ?? 1));
  });
}

// Both modes at once: they share no lessons files, and Mubit sees them as separate tasks.
async function phase(tag: string, extra: string[]) {
  const left = MAX_CALLS - spent();
  if (left <= 0) return false;
  const per = Math.max(1, Math.floor(left / MODES.length));
  await Promise.all(
    MODES.map((mode) =>
      run("npx", ["tsx", "src/loop.ts", "--sites", SITES, "--mode", mode, "--tag", tag, "--resume", "--max-calls", String(per), ...extra]),
    ),
  );
  log(`${tag} done; calls so far ${spent()}`);
  return true;
}

const holdoutMean = (tag: string) => {
  const rs = loadRuns().filter((r) => r.tag === tag && r.split === "holdout");
  return rs.length ? rs.reduce((a, r) => a + r.firstShot, 0) / rs.length : NaN;
};

log(`batch start: budget ${MAX_CALLS} calls, up to ${MAX_EPOCHS} epochs, modes ${MODES.join(",")}, sites ${SITES}`);
if ((await run("npx", ["tsx", "scripts/mubit-smoke-image.ts"])) !== 0) {
  log("smoke test failed: stopping. Check .env and the Mubit console.");
  process.exit(1);
}

await phase("baseline", ["--split", "holdout", "--no-lessons", "--rounds", "1", "--concurrency", "6"]);
let previous = holdoutMean("baseline");
let flat = 0;
for (let epoch = 1; epoch <= MAX_EPOCHS; epoch++) {
  if (!(await phase(`train-e${epoch}`, ["--split", "train", "--learn", "--rounds", "5", "--concurrency", "8"]))) break;
  if (!(await phase(`eval-e${epoch}`, ["--split", "holdout", "--rounds", "1", "--concurrency", "6"]))) break;
  const now = holdoutMean(`eval-e${epoch}`);
  log(`epoch ${epoch}: holdout first-shot ${previous.toFixed(1)} -> ${now.toFixed(1)}`);
  flat = now - previous < 1 ? flat + 1 : 0;
  previous = now;
  if (flat >= 2) {
    log("holdout first-shot has stopped improving: stopping.");
    break;
  }
  report();
}
report();
log(`batch end; calls ${spent()}. See data/batch/report.md`);
