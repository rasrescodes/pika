// Scorecard from every run.json under data/runs. Usage: npm run report
// Writes data/batch/report.md and report.json, and prints the headline table.
import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";

export type Run = {
  slug: string; mode: string; tag: string; split: string; firstShot: number; best: number; rounds: number; calls: number;
  converged: boolean; lessonsUsed: boolean; backend?: string; visual_style?: string; layout_style?: string; category?: string;
};

export function loadRuns(): Run[] {
  if (!existsSync("data/runs")) return [];
  return readdirSync("data/runs").flatMap((slug) =>
    readdirSync(`data/runs/${slug}`)
      .filter((d) => existsSync(`data/runs/${slug}/${d}/run.json`))
      .map((d) => JSON.parse(readFileSync(`data/runs/${slug}/${d}/run.json`, "utf8")) as Run)
      .filter((r) => r.tag),
  );
}

const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : NaN);
const pct = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN;
};

function table(rows: (string | number)[][]) {
  const [head, ...body] = rows;
  return [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...body.map((r) => `| ${r.join(" | ")} |`)].join("\n");
}

export function report() {
  const runs = loadRuns();
  // Latest run per slug, mode and tag.
  const latest = new Map<string, Run>();
  for (const r of runs) latest.set(`${r.slug}|${r.mode}|${r.tag}`, r);
  const all = [...latest.values()];
  const groups: Partial<Record<string, Run[]>> = Object.groupBy(all, (r) => `${r.mode}|${r.tag}`);
  const tags = Object.keys(groups).sort();

  const headline: (string | number)[][] = [["mode", "tag", "split", "sites", "first-shot mean", "p90", "best mean", "rounds mean", "converged", "calls"]];
  for (const k of tags) {
    const g = groups[k]!;
    headline.push([g[0].mode, g[0].tag, g[0].split, g.length, mean(g.map((r) => r.firstShot)), pct(g.map((r) => r.firstShot), 0.9),
      mean(g.map((r) => r.best)), mean(g.map((r) => r.rounds)), `${g.filter((r) => r.converged).length}/${g.length}`, g.reduce((a, r) => a + (r.calls ?? 0), 0)]);
  }

  // Holdout first-shot by label: baseline against the latest eval, per mode.
  const evalTags = (mode: string) => tags.filter((t) => t.startsWith(`${mode}|eval-`)).sort();
  const sections: string[] = [];
  for (const mode of ["image", "dom"]) {
    const base = groups[`${mode}|baseline`];
    const lastEval = evalTags(mode).at(-1);
    if (!base || !lastEval) continue;
    const after = groups[lastEval]!;
    for (const field of ["layout_style", "visual_style", "category"] as const) {
      const keys = [...new Set(base.map((r) => r[field] ?? "unlabelled"))].sort();
      const rows: (string | number)[][] = [[field, "sites", "baseline", lastEval.split("|")[1], "change"]];
      for (const key of keys) {
        const b = base.filter((r) => (r[field] ?? "unlabelled") === key).map((r) => r.firstShot);
        const a = after.filter((r) => (r[field] ?? "unlabelled") === key).map((r) => r.firstShot);
        rows.push([key, b.length, mean(b), mean(a), Math.round((mean(a) - mean(b)) * 10) / 10]);
      }
      sections.push(`### ${mode}: holdout first-shot by ${field}\n\n${table(rows)}`);
    }
  }

  const md = [
    "# Batch report",
    "",
    `Generated ${new Date().toISOString()}. First-shot = score of round 1 (0-100, code-only). Holdout runs are never recorded by Mubit.`,
    "",
    table(headline),
    "",
    ...sections.flatMap((s) => [s, ""]),
  ].join("\n");
  mkdirSync("data/batch", { recursive: true });
  writeFileSync("data/batch/report.md", md);
  writeFileSync("data/batch/report.json", JSON.stringify({ headline, runs: all }, null, 1));
  return { md, groups };
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(report().md);
