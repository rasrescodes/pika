// Re-runs the detector on every saved section (use after changing detector rules or the brand-fixed list).
// Usage: IMPECCABLE_BIN=<native binary> npx tsx scripts/gen-redetect.ts
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
const BRAND_FIXED = new Set(["cream-palette", "overused-font", "system-font-display"]);
for (const tag of readdirSync("data/gen").filter((d) => existsSync(`data/gen/${d}/results.jsonl`))) {
  const f = `data/gen/${tag}/results.jsonl`;
  const rows = readFileSync(f, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
  for (const row of rows) {
    const r = spawnSync(process.env.IMPECCABLE_BIN!, ["detect", "--json", "--no-config", "--no-design-system", "--no-advisory", `data/gen/${tag}/${row.id}.html`], { encoding: "utf8", timeout: 30000, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NODE_OPTIONS: "" } });
    if ((r.status !== 0 && r.status !== 2) || !r.stdout) throw new Error(`${row.id}: ${r.error?.message ?? r.stderr}`);
    const fs = (JSON.parse(r.stdout) as { antipattern: string; category: string }[]).filter((x) => !BRAND_FIXED.has(x.antipattern));
    Object.assign(row, { slop: fs.filter((x) => x.category === "slop").length, quality: fs.filter((x) => x.category !== "slop").length, patterns: [...new Set(fs.map((x) => x.antipattern))] });
  }
  writeFileSync(f, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
  console.log(`${tag}: ${rows.length} rows re-detected`);
}
