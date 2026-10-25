// Contact sheet: the same holdout briefs from the untrained student, the fine-tuned student and Sonnet with skills.
// Usage: OUT=sheet.png npx tsx scripts/gen-sheet.ts <id> [id...]
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { sanitise } from "../lib/sanitise";
const ids = process.argv.slice(2);
const cols = ["hold-local-base", "hold-local-ft", "hold-sonnet-skills"];
const cell = (tag: string, id: string) => `<div class="c"><div class="t">${tag.replace("hold-", "")}: ${id}</div><iframe sandbox srcdoc="${sanitise(readFileSync(`data/gen/${tag}/${id}.html`, "utf8")).replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"></iframe></div>`;
const html = `<style>body{margin:0;background:#888;font:14px sans-serif}.g{display:grid;grid-template-columns:repeat(3,512px);gap:8px;padding:8px}.c{width:512px;height:308px;overflow:hidden;background:#fff}.t{height:20px;padding:2px 4px}iframe{border:0;width:1280px;height:720px;transform:scale(.4);transform-origin:0 0}</style><div class="g">${ids.flatMap((id) => cols.map((t) => cell(t, id))).join("")}</div>`;
const b = await chromium.launch({ args: ["--js-flags=--jitless"] });
const p = await b.newPage({ viewport: { width: 1560, height: 8 + ids.length * 316 } });
await p.setContent(html, { waitUntil: "load" });
await p.waitForTimeout(800);
await p.screenshot({ path: process.env.OUT!, fullPage: true });
await b.close();
