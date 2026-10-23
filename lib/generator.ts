// The generator: one hero section per layout family. Through Mubit when configured, MOCK otherwise.
import { readFileSync } from "node:fs";
import path from "node:path";
import { chat, mode } from "./llm";
import { type Brand, brandSummary, fontStack } from "./brands";
import { FAMILY_BRIEF, type Family } from "./families";
import { mockSection } from "./mockGenerator";

const GENERATOR_SYSTEM = readFileSync(path.join(process.cwd(), "prompts", "generator-v1.md"), "utf8");

export type Generated = { html: string; usage?: { input: number; output: number }; ms: number };

export async function generate(brand: Brand, family: Family, variant = 0): Promise<Generated> {
  if (mode() === "MOCK") return { html: mockSection(brand, family, variant), ms: 0 };
  const res = await chat({
    system: GENERATOR_SYSTEM,
    user: `${brandSummary(brand)} Subline: "${brand.subline}". Action: "${brand.action}". Display font stack: ${fontStack(brand.displayFont)}. Body font stack: ${fontStack(brand.bodyFont)}.\nLayout direction: ${FAMILY_BRIEF[family]}.`,
    maxTokens: 2400,
    temperature: 0.9,
  });
  const html = res.text.replace(/^```(?:html)?\s*|\s*```$/g, "").trim();
  return { html, usage: res.usage, ms: res.ms };
}
