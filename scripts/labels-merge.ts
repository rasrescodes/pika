// Merges labeller batches into data/labels.json, checking every value against data/taxonomy.json.
// Usage: npm run labels:merge -- <dir of batch-*.json files>
// Each batch file: [{ slug, visual_style, layout_style, category, theme, type_mix, density, nav, accent, difficulty, note }]
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const dir = process.argv[2];
if (!dir) throw new Error("Usage: npm run labels:merge -- <dir>");
const tax: Record<string, string[]> = JSON.parse(readFileSync("data/taxonomy.json", "utf8"));
const labels: Record<string, Record<string, unknown>> = existsSync("data/labels.json") ? JSON.parse(readFileSync("data/labels.json", "utf8")) : {};

let ok = 0;
const problems: string[] = [];
for (const f of readdirSync(dir).filter((f) => f.startsWith("batch-") && f.endsWith(".json"))) {
  let rows: Record<string, unknown>[];
  try {
    rows = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
  } catch {
    problems.push(`${f}: not valid JSON`);
    continue;
  }
  for (const row of rows) {
    const slug = String(row.slug ?? "");
    const bad = Object.entries(tax).filter(([k, values]) => row[k] !== undefined && !values.includes(String(row[k])));
    if (!slug || bad.length || !row.visual_style || !row.layout_style || !row.category) {
      problems.push(`${f} ${slug || "(no slug)"}: ${bad.map(([k]) => `${k}=${row[k]}`).join(", ") || "missing a main label"}`);
      continue;
    }
    labels[slug] = { ...row, slug: undefined };
    ok++;
  }
}
writeFileSync("data/labels.json", JSON.stringify(labels, null, 1));
console.log(`merged ${ok} labels (${Object.keys(labels).length} total) -> data/labels.json`);
if (problems.length) console.log(`rejected ${problems.length}:\n  ${problems.join("\n  ")}`);
