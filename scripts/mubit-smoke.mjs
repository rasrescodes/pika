// Proves an LLM call goes through Mubit. No dependencies (Node 18+).
// Usage: node scripts/mubit-smoke.mjs   (reads MUBIT_API_KEY, MUBIT_BASE_URL, MODEL from .env)
import { readFileSync, existsSync } from "node:fs";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const key = process.env.MUBIT_API_KEY;
const base = process.env.MUBIT_BASE_URL || "https://api.mubit.ai/openai/v1";
const model = process.env.MODEL;
if (!key || !model) {
  console.error("Set MUBIT_API_KEY and MODEL in .env (see .env.example).");
  process.exit(1);
}

const res = await fetch(`${base}/chat/completions`, {
  method: "POST",
  headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
  body: JSON.stringify({
    model,
    messages: [
      { role: "system", content: "Reply with the single word: ok" },
      { role: "user", content: "Smoke test." },
    ],
  }),
});

const body = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`Mubit returned ${res.status}:`, JSON.stringify(body));
  process.exit(1);
}
console.log(`${res.status} via ${base} (${model}):`, body.choices?.[0]?.message?.content);
console.log("Now check the call appears in the Mubit console under Requests.");
