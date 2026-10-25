// Pika Polish: a public API and one-page site that checks a website section against Impeccable's design rules
// and redesigns it with Pika's skills prompt. One small Node process, no database, no build step.
// Every model call goes through Mubit's Anthropic route (the hackathon rule). Keys come from the environment only.
import { createServer } from "node:http";
import { readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const PORT = Number(process.env.PORT || 8787);
const MODEL = process.env.MODEL || "claude-sonnet-5-5";
const PROMPT_VERSION = "improver-skills-v1";
const SYSTEM = await readFile(path.join(ROOT, "prompts", `${PROMPT_VERSION}.md`), "utf8");

// Spend limits. Counters live in memory, so a restart resets them; the daily cap is the hard ceiling on cost.
const LIMITS = {
  htmlChars: Number(process.env.MAX_HTML_CHARS || 40_000),
  improvePerDay: Number(process.env.MAX_IMPROVES_PER_DAY || 150),
  improvePerIpHour: Number(process.env.MAX_IMPROVES_PER_IP_HOUR || 5),
  checkPerIpHour: Number(process.env.MAX_CHECKS_PER_IP_HOUR || 120),
  improveInFlight: Number(process.env.MAX_IMPROVES_IN_FLIGHT || 3), // Mubit allows 4 calls in flight per project
};
// Claude Sonnet 5.5 list price per million tokens, as in scripts/gen-scorecard.ts. Output includes thinking.
const PRICE = { inPer1M: 2, outPer1M: 10 };

// --- Detector ---------------------------------------------------------------------------------------------
// The native Impeccable binary for this platform. Never the npm launcher: under some runtimes it hangs.
const DETECT =
  process.env.IMPECCABLE_BIN ||
  path.join(ROOT, "node_modules", "@impeccable", `cli-${process.platform === "win32" ? "windows" : process.platform}-${process.arch}`, "bin", "impeccable");
// Rules that judge only what a brand fixes (its background colour and font choice). Improve keeps the brand, so
// these are reported as brand notes and left out of the before and after counts.
const BRAND_FIXED = new Set(["cream-palette", "overused-font", "system-font-display"]);

let detecting = 0;
const waiters = [];
async function detect(html) {
  if (detecting >= 4) await new Promise((r) => waiters.push(r));
  detecting++;
  const file = path.join(tmpdir(), `pika-${randomUUID()}.html`);
  try {
    await writeFile(file, html);
    const out = await new Promise((resolve, reject) => {
      const child = execFile(
        DETECT,
        ["detect", "--json", "--no-config", "--no-design-system", "--no-advisory", file],
        { timeout: 30_000, maxBuffer: 4 << 20, env: { ...process.env, NODE_OPTIONS: "" } },
        (err, stdout, stderr) => {
          // Exit 0 = clean, 2 = findings. Anything else is a failed check, never a clean page.
          if (err && err.code !== 2) return reject(new Error(`detector failed: ${(stderr || err.message).slice(0, 200)}`));
          resolve(stdout);
        },
      );
      child.stdin?.end(); // with an open stdin the detector waits for input
    });
    const all = JSON.parse(out || "[]");
    const findings = all.filter((f) => !BRAND_FIXED.has(f.antipattern)).map(slim);
    return {
      findings,
      brandNotes: all.filter((f) => BRAND_FIXED.has(f.antipattern)).map(slim),
      slop: findings.filter((f) => f.category === "slop").length,
      quality: findings.filter((f) => f.category !== "slop").length,
    };
  } finally {
    rm(file, { force: true }).catch(() => {});
    detecting--;
    waiters.shift()?.();
  }
}
const slim = (f) => ({ rule: f.antipattern, category: f.category, name: f.name, description: f.description, snippet: f.snippet?.slice(0, 160) });

// --- Model, through Mubit ---------------------------------------------------------------------------------
let client = null;
function mubit() {
  if (!process.env.MUBIT_API_KEY) throw httpError(503, "This server has no model key configured, so only /v1/check works.");
  // authToken: null so a stray ANTHROPIC_AUTH_TOKEN is never sent beside the Mubit key.
  client ??= new Anthropic({ baseURL: process.env.MUBIT_ANTHROPIC_URL || "https://api.mubit.ai/anthropic", apiKey: process.env.MUBIT_API_KEY, authToken: null, maxRetries: 2 });
  return client;
}

function userMessage(html, before, notes) {
  const list = before.findings.length
    ? before.findings.map((f) => `- ${f.rule} (${f.category}): ${f.description ?? f.name ?? ""}`).join("\n")
    : "- none: the detector found nothing, so improve composition, hierarchy and type.";
  return `Detector findings on the original:\n${list}\n${notes ? `\nThe designer's note: ${notes}\n` : ""}\nThe original section:\n${html}`;
}

function extractHtml(text) {
  const t = text.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/, "").trim();
  const start = t.search(/<!doctype html|<html/i);
  const end = t.toLowerCase().lastIndexOf("</html>");
  if (start < 0) throw httpError(502, "The model did not return an HTML document. Try again.");
  return end > start ? t.slice(start, end + 7) : t.slice(start);
}

// --- Limits ----------------------------------------------------------------------------------------------
const day = { date: "", improves: 0, usd: 0 };
const perIp = new Map(); // key -> timestamps within the last hour
let inFlight = 0;
function today() {
  const d = new Date().toISOString().slice(0, 10);
  if (day.date !== d) Object.assign(day, { date: d, improves: 0, usd: 0 });
  return day;
}
function hit(kind, ip, max) {
  const key = `${kind}:${ip}`;
  const now = Date.now();
  const recent = (perIp.get(key) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= max) throw httpError(429, `Limit reached: ${max} ${kind} requests per hour from one address. Try again later.`);
  recent.push(now);
  perIp.set(key, recent);
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of perIp) if (!v.some((t) => now - t < 3_600_000)) perIp.delete(k);
}, 600_000).unref();

// --- HTTP ------------------------------------------------------------------------------------------------
function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}
const clientIp = (req) => (req.headers["x-real-ip"] || String(req.headers["x-forwarded-for"] || "").split(",")[0] || req.socket.remoteAddress || "unknown").trim();

async function body(req) {
  const max = LIMITS.htmlChars * 2 + 4096;
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > max) throw httpError(413, `Request too large. Send at most ${LIMITS.htmlChars} characters of HTML.`);
    chunks.push(c);
  }
  let data;
  try {
    data = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    throw httpError(400, 'Send JSON: {"html": "<!doctype html>..."}');
  }
  if (typeof data.html !== "string" || !data.html.trim()) throw httpError(400, 'Missing "html": the section as one HTML string.');
  if (data.html.length > LIMITS.htmlChars) throw httpError(413, `"html" is ${data.html.length} characters; the limit is ${LIMITS.htmlChars}.`);
  return data;
}

async function check(req) {
  hit("check", clientIp(req), LIMITS.checkPerIpHour);
  const { html } = await body(req);
  const started = Date.now();
  return { ...(await detect(html)), ms: Date.now() - started };
}

async function improve(req) {
  const ip = clientIp(req);
  const { html, notes, record } = await body(req);
  if (notes !== undefined && (typeof notes !== "string" || notes.length > 500)) throw httpError(400, '"notes" must be a string of at most 500 characters.');
  const d = today();
  if (d.improves >= LIMITS.improvePerDay) throw httpError(429, "Today's free redesigns are used up. The free check still works; redesigns reset at midnight UTC.");
  if (inFlight >= LIMITS.improveInFlight) throw httpError(503, "Pika is busy with other redesigns. Try again in a minute.");
  hit("improve", ip, LIMITS.improvePerIpHour);
  d.improves++;
  inFlight++;
  const started = Date.now();
  try {
    const before = await detect(html);
    const res = await mubit().messages.create(
      { model: MODEL, max_tokens: 16_000, system: SYSTEM, messages: [{ role: "user", content: userMessage(html, before, notes) }] },
      // record: false asks Mubit to keep only metadata, so the design is not kept for training.
      record === false ? { headers: { "x-middleware-record": "metadata" } } : undefined,
    );
    const out = extractHtml(res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join(""));
    const after = await detect(out);
    const usd = (res.usage.input_tokens * PRICE.inPer1M + res.usage.output_tokens * PRICE.outPer1M) / 1e6;
    d.usd += usd;
    return {
      html: out,
      before,
      after,
      model: MODEL,
      prompt: PROMPT_VERSION,
      recorded: record !== false,
      usage: { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens, costUsd: Number(usd.toFixed(4)) },
      ms: Date.now() - started,
    };
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      console.error(`mubit ${e.status}: ${String(e.message).slice(0, 200)}`);
      throw httpError(e.status === 429 ? 503 : 502, e.status === 429 ? "The model gateway is busy. Try again in a minute." : "The model gateway returned an error. Try again.");
    }
    throw e;
  } finally {
    inFlight--;
  }
}

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".md": "text/markdown; charset=utf-8" };
// srcdoc previews inherit this policy: inline styles are allowed, scripts and outside requests are not.
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src 'self' data:; connect-src 'self'; frame-src 'self' about:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const STATIC = new Map([
  ["/", "public/index.html"],
  ["/styles.css", "public/styles.css"],
  ["/app.js", "public/app.js"],
  ["/pika-mark.svg", "public/pika-mark.svg"],
  ["/favicon.svg", "public/pika-icon.svg"],
  ["/samples/ai-hero.html", "samples/ai-hero.html"],
  ["/samples/plain-hero.html", "samples/plain-hero.html"],
  ["/notice", "prompts/NOTICE-skills.md"],
]);

function send(res, status, payload, headers = {}) {
  const isJson = typeof payload !== "string" && !Buffer.isBuffer(payload);
  res.writeHead(status, {
    "content-type": isJson ? "application/json; charset=utf-8" : headers["content-type"] ?? "text/plain; charset=utf-8",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    ...headers,
  });
  res.end(isJson ? JSON.stringify(payload) : payload);
}
const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type" };

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (req.method === "OPTIONS") return send(res, 204, "", CORS);
    if (url.pathname === "/health") return send(res, 200, { ok: true });
    if (url.pathname === "/v1/status" && req.method === "GET") {
      const d = today();
      return send(res, 200, { model: process.env.MUBIT_API_KEY ? MODEL : null, prompt: PROMPT_VERSION, redesignsLeftToday: Math.max(0, LIMITS.improvePerDay - d.improves), limits: LIMITS }, CORS);
    }
    if (url.pathname === "/v1/check" && req.method === "POST") return send(res, 200, await check(req), CORS);
    if (url.pathname === "/v1/improve" && req.method === "POST") return send(res, 200, await improve(req), CORS);
    const file = STATIC.get(url.pathname);
    if (file && req.method === "GET") {
      const type = TYPES[path.extname(file)] ?? "text/plain; charset=utf-8";
      const headers = { "content-type": type, "cache-control": file.endsWith(".svg") ? "public, max-age=86400" : "no-cache" };
      if (type.startsWith("text/html") && file.startsWith("public")) headers["content-security-policy"] = CSP;
      // Samples are served as plain text so the browser never renders them as pages on this origin.
      if (file.startsWith("samples")) headers["content-type"] = "text/plain; charset=utf-8";
      return send(res, 200, await readFile(path.join(ROOT, file)), headers);
    }
    send(res, 404, { error: "Not found" });
  } catch (e) {
    const status = e.status ?? 500;
    if (status >= 500) console.error(e);
    send(res, status, { error: status >= 500 && !e.status ? "Something went wrong on our side." : e.message }, url.pathname.startsWith("/v1/") ? CORS : {});
  }
});
server.requestTimeout = 240_000;
server.listen(PORT, () => console.log(`pika polish on :${PORT}; detector ${existsSync(DETECT) ? "ready" : "MISSING at " + DETECT}; model ${process.env.MUBIT_API_KEY ? MODEL : "not configured"}`));
