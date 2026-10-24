// Feasibility spike 0b: send N Juror calls (same system prompt, different screenshots) so Mubit forms one task
// and can start training. Usage: node scripts/spike-task.mjs <folder of .png/.jpg> [max=30]
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const key = process.env.MUBIT_API_KEY;
const base = process.env.MUBIT_BASE_URL || "https://api.mubit.ai/openai/v1";
const model = process.env.MODEL;
const dir = process.argv[2];
const max = Number(process.argv[3] || 30);
if (!key || !model || !dir) {
  console.error("Usage: node scripts/spike-task.mjs <folder> [max]. Needs MUBIT_API_KEY and MODEL in .env.");
  process.exit(1);
}
const system = readFileSync("prompts/jury-v1.md", "utf8");
const files = readdirSync(dir).filter((f) => /\.(png|jpe?g)$/i.test(f)).slice(0, max);
let ok = 0;
for (const f of files) {
  const mime = f.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  const url = `data:${mime};base64,${readFileSync(path.join(dir, f)).toString("base64")}`;
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: [{ type: "text", text: "Brand: Pika. Tone: confident, editorial. No art director notes yet." }, { type: "image_url", image_url: { url } }] },
      ],
    }),
  });
  if (res.ok) ok++;
  console.log(`${f}: ${res.status}`);
}
console.log(`${ok}/${files.length} succeeded. Check the Mubit console: Tasks should show one Juror task.`);
