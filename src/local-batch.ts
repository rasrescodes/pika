// The local training loop: no Mubit, no provider. A small model on this machine learns the DOM Describer.
//   1. teacher: score the rule-based Describer (src/teacher.ts) on every site; its train specs are the first targets
//   2. base: the untrained model on holdout, first shot, no lessons
//   per epoch e:
//   3. dataset: for each train site, the best spec so far (teacher or the model's own rounds); holdout never included
//   4. fine-tune: LoRA on that set (mlx-lm), from the base model each time
//   5. eval: the fine-tuned model on holdout, first shot, no lessons
//   6. practise: the fine-tuned model runs the loop on a slice of train sites (code fixes, several rounds),
//      and its best rounds can replace teacher targets in the next epoch's dataset
// Resumable: finished phases are skipped by tag. Usage: npm run local:batch
// env: LOCAL_EPOCHS=3 LOCAL_PRACTISE_SITES=60 LOCAL_ITERS=400 BATCH_SITES=data/sites
import { spawn, type ChildProcess } from "node:child_process";
import { appendFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { loadRuns } from "./report.ts";

const SITES = process.env.BATCH_SITES || "data/sites";
const EPOCHS = Number(process.env.LOCAL_EPOCHS || 3);
const PRACTISE = Number(process.env.LOCAL_PRACTISE_SITES || 60);
const ITERS = Number(process.env.LOCAL_ITERS || 400);
const MODEL = process.env.LOCAL_MODEL || "mlx-community/Qwen3-4B-Instruct-2507-4bit";
// mlx_lm.server batches concurrent requests; 4 long DOM prompts at once ran a 16 GB Mac out of GPU memory.
const CONCURRENCY = process.env.LOCAL_CONCURRENCY || "1";
const PORT = 8080;
const LOG = "data/local/local.log";
mkdirSync("data/local", { recursive: true });

const log = (msg: string) => {
  const line = `${new Date().toISOString()} ${msg}`;
  console.log(line);
  appendFileSync(LOG, line + "\n");
};

function run(cmd: string, args: string[], env: Record<string, string> = {}) {
  return new Promise<number>((resolve) => {
    log(`$ ${cmd} ${args.join(" ")}`);
    const p = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ...env } });
    p.stdout.on("data", (d) => appendFileSync(LOG, d));
    p.stderr.on("data", (d) => appendFileSync(LOG, d));
    p.on("close", (code) => resolve(code ?? 1));
  });
}

let server: ChildProcess | undefined;
async function serve(adapter?: string) {
  server?.kill();
  await new Promise((r) => setTimeout(r, 2000));
  const args = ["--model", MODEL, "--port", String(PORT), "--log-level", "WARNING", ...(adapter ? ["--adapter-path", adapter] : [])];
  log(`server: ${adapter ?? "base model"}`);
  server = spawn(".venv/bin/mlx_lm.server", args, { stdio: ["ignore", "ignore", "pipe"] });
  server.stderr!.on("data", (d) => appendFileSync(LOG, d));
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORT}/v1/models`)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("local model server did not start");
}

const env = (label: string, temperature = "0") => ({ LLM_BACKEND: "local", LOCAL_MODEL_LABEL: label, LOCAL_TEMPERATURE: temperature });
const holdoutMean = (tag: string) => {
  const rs = loadRuns().filter((r) => r.tag === tag && r.split === "holdout" && r.mode === "dom");
  return rs.length ? (rs.reduce((a, r) => a + r.firstShot, 0) / rs.length).toFixed(1) : "n/a";
};
const evalHoldout = (tag: string, label: string) =>
  run("npx", ["tsx", "src/loop.ts", "--sites", SITES, "--mode", "dom", "--split", "holdout", "--no-lessons", "--rounds", "1", "--concurrency", CONCURRENCY, "--tag", tag, "--resume"], env(label)).then(() => {
    if (holdoutMean(tag) === "n/a") throw new Error(`holdout eval ${tag} produced no runs; see ${LOG}`);
  });

log(`local batch start: model ${MODEL}, ${EPOCHS} epochs, ${PRACTISE} practise sites per epoch, ${ITERS} LoRA iters`);
if (!existsSync("data/local/teacher/scores.json")) await run("npx", ["tsx", "scripts/teacher-eval.ts", SITES]);
const teacher: Record<string, { split: string; total: number }> = JSON.parse(readFileSync("data/local/teacher/scores.json", "utf8"));
const tmean = (split: string) => {
  const xs = Object.values(teacher).filter((r) => r.split === split).map((r) => r.total);
  return (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1);
};
log(`teacher (rules, no LLM): train ${tmean("train")}, holdout ${tmean("holdout")}`);

await serve();
await evalHoldout("local-base", "base");
log(`base model holdout first-shot: ${holdoutMean("local-base")}`);

const trainSlugs = Object.entries(teacher).filter(([, r]) => r.split === "train").map(([s]) => s).sort();
for (let e = 1; e <= EPOCHS; e++) {
  const adapter = `data/local/adapters/e${e}`;
  // adapters.safetensors is also written at each checkpoint, so only the final iteration's file means done.
  if (!existsSync(`${adapter}/${String(ITERS).padStart(7, "0")}_adapters.safetensors`)) {
    server?.kill();
    server = undefined;
    if ((await run("npx", ["tsx", "scripts/local-dataset.ts", SITES])) !== 0) throw new Error("dataset failed");
    const code = await run(".venv/bin/python", [
      "-m", "mlx_lm", "lora", "--model", MODEL, "--train", "--data", "data/local/dataset", "--adapter-path", adapter,
      "--fine-tune-type", "lora", "--mask-prompt", "--num-layers", "16", "--batch-size", "1", "--iters", String(ITERS),
      "--learning-rate", "1e-4", "--max-seq-length", "8192", "--grad-checkpoint", "--steps-per-report", "20", "--steps-per-eval", "100", "--save-every", "100",
    ]);
    if (code !== 0) throw new Error(`fine-tune e${e} failed`);
  }
  await serve(adapter);
  await evalHoldout(`local-e${e}`, `lora-e${e}`);
  log(`epoch ${e}: holdout first-shot base ${holdoutMean("local-base")} -> lora ${holdoutMean(`local-e${e}`)} (teacher ${tmean("holdout")})`);
  if (e === EPOCHS) break;
  // A different slice of train sites each epoch, so the model practises on as many pages as time allows.
  const slice = trainSlugs.filter((_, i) => i % EPOCHS === (e - 1) % EPOCHS).slice(0, PRACTISE);
  await run("npx", ["tsx", "src/loop.ts", "--sites", SITES, "--mode", "dom", "--no-lessons", "--rounds", "3", "--target", "95", "--concurrency", CONCURRENCY, "--tag", `local-e${e}-practise`, "--resume", ...slice], env(`lora-e${e}`, "0.5"));
}
server?.kill();
await run("npx", ["tsx", "src/report.ts"]);
log("local batch end. See data/batch/report.md (tags local-*).");
