// Feasibility spike 0a: one Juror call with an image, through Mubit.
// Usage: node scripts/spike-image.mjs [path/to/screenshot.jpg]
// Reads MUBIT_API_KEY, MUBIT_BASE_URL, MODEL from .env. Prints the status and the Juror's JSON.
import { readFileSync, existsSync } from "node:fs";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const key = process.env.MUBIT_API_KEY;
const base = process.env.MUBIT_BASE_URL || "https://api.mubit.ai/openai/v1";
const model = process.env.MODEL;
if (!key || !model) {
  console.error("Set MUBIT_API_KEY and MODEL in .env first.");
  process.exit(1);
}

const imgPath = process.argv[2] || "scripts/fixtures/spike-section.png";
if (!existsSync(imgPath)) {
  console.error(`No image at ${imgPath}. Pass a screenshot path.`);
  process.exit(1);
}
const mime = imgPath.endsWith(".png") ? "image/png" : "image/jpeg";
const dataUrl = `data:${mime};base64,${readFileSync(imgPath).toString("base64")}`;
const system = readFileSync("prompts/juror-v1.md", "utf8");

const res = await fetch(`${base}/chat/completions`, {
  method: "POST",
  headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
  body: JSON.stringify({
    model,
    messages: [
      { role: "system", content: system },
      {
        role: "user",
        content: [
          { type: "text", text: "Brand: Pika. Tone: confident, editorial. No art director notes yet." },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  }),
});
const body = await res.json().catch(() => ({}));
console.log("status", res.status);
console.log(res.ok ? body.choices?.[0]?.message?.content : JSON.stringify(body));
console.log("usage", JSON.stringify(body.usage ?? null));
