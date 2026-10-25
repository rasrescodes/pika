// Generator distillation, step 0: synthetic brand kits so the student sees more than the two presets.
// One call through Mubit (not recorded). Writes data/gen/brands.json. Usage: npx tsx scripts/gen-brands.ts [n]
import { writeFileSync, mkdirSync } from "node:fs";
import { ask, text } from "../src/mubit";
import type { Brand } from "../lib/brands";

const N = Number(process.argv[2] || 24);
const SYSTEM = `You write brand kits for fictional small companies, as JSON only. Return a JSON array, nothing else.`;
const user = `Write ${N} brand kits for fictional companies (invent names; never real companies or people). Spread them across: restaurants and food, fashion, architecture, software, finance, culture and museums, music, sport, health, education, travel, non-profits, manufacturing, beauty, publishing, games. Vary tone from playful to austere and palettes from dark to light, muted to loud.
Each item: {"id": kebab-case name, "name", "colours": {"bg","ink","accent","soft"} as #RRGGBB with ink readable on bg, "displayFont": "serif"|"sans"|"mono", "bodyFont": "serif"|"sans"|"mono", "tone": one sentence, "headline": under 60 characters, "subline": one sentence under 140 characters, "action": a 2 to 4 word button label naming what it does, "source": "synthetic"}.
UK English. No em dashes, no emojis, no marketing filler words (seamless, elevate, unlock, empower, cutting-edge).`;
const reply = await ask({ model: "claude-sonnet-5-5", system: SYSTEM, content: [text(user)], maxTokens: 16000, record: false });
const brands: Brand[] = JSON.parse(reply.text.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
const hex = /^#[0-9a-fA-F]{6}$/;
const ok = brands.filter((b) => b.id && b.headline && Object.values(b.colours ?? {}).every((c) => hex.test(c as string)));
mkdirSync("data/gen", { recursive: true });
writeFileSync("data/gen/brands.json", JSON.stringify(ok, null, 1));
console.log(`${ok.length} of ${brands.length} brands kept: ${ok.map((b) => b.id).join(", ")}`);
