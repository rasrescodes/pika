// The Juror: the task Mubit learns. The system prompt is a build-time constant (a changed prompt
// would split the Mubit task); the brand, the taste notes and the screenshot go in the user message.
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { chat, mode } from "./llm";
import { type Brand, brandSummary } from "./brands";
import { FAMILIES, type Family } from "./families";
import { type TasteItem, tasteNotes, familyBias, TASTE_IN_PROMPT } from "./taste";

export const JUROR_SYSTEM = readFileSync(path.join(process.cwd(), "prompts", "juror-v1.md"), "utf8");
export const MAX_REPLY_CHARS = 400;

const score = z.number().int().min(1).max(10);
export const JurorReply = z.object({
  design: score,
  usability: score,
  creativity: score,
  content: score,
  note: z.string().min(1).max(140),
});
export type Scores = { design: number; usability: number; creativity: number; content: number };

export type Verdict = {
  scores: Scores;
  overall: number;
  note: string;
  tasteApplied: boolean;
  usage?: { input: number; output: number };
  ms: number;
};

export class JurorError extends Error {}

export function overallOf(s: Scores): number {
  return Math.round(((s.design + s.usability + s.creativity + s.content) / 4) * 10) / 10;
}

export function parseReply(text: string): z.infer<typeof JurorReply> {
  if (text.length > MAX_REPLY_CHARS) throw new JurorError(`Juror reply too long (${text.length} chars)`);
  const json = text.trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new JurorError("Juror reply was not JSON");
  }
  const parsed = JurorReply.safeParse(data);
  if (!parsed.success) throw new JurorError("Juror reply did not match the score shape");
  return parsed.data;
}

export function jurorUserMessage(brand: Brand, taste: TasteItem[]): string {
  return `${brandSummary(brand)}\n${tasteNotes(taste)}\nScore the section in the image.`;
}

export async function judge(input: { imageDataUrl: string; brand: Brand; family: Family; taste: TasteItem[] }): Promise<Verdict> {
  const tasteApplied = input.taste.slice(0, TASTE_IN_PROMPT).length > 0;
  if (mode() === "MOCK") return mockJudge(input.brand, input.family, input.taste, tasteApplied);

  const res = await chat({
    system: JUROR_SYSTEM,
    user: jurorUserMessage(input.brand, input.taste),
    images: [input.imageDataUrl],
    maxTokens: 160,
    temperature: 0,
  });
  const r = parseReply(res.text);
  const scores = { design: r.design, usability: r.usability, creativity: r.creativity, content: r.content };
  return { scores, overall: overallOf(scores), note: r.note, tasteApplied, usage: res.usage, ms: res.ms };
}

// MOCK Juror: fixed per-family baselines (a brand-specific rotation so presets differ), spaced so one
// correction visibly moves a family, plus the taste bias from corrections. Deterministic for the journeys.
const MOCK_NOTES: Record<Family, string> = {
  split: "Clear and balanced; the illustration could be braver.",
  centred: "Safe and legible, but forgettable.",
  editorial: "Strong hierarchy with a confident kicker.",
  oversized: "The type does all the work; a real statement.",
  asymmetric: "Interesting tension; the block needs a reason.",
  shapes: "Bold shapes, though the headline fights them.",
  brutalist: "Raw and memorable; usability suffers a little.",
  minimal: "Quiet to a fault; nothing to hold on to.",
  bento: "Organised and on trend; edging towards template.",
  ticker: "Energetic bands; the middle feels thin.",
  stacked: "Punchy colour blocks; the copy split is awkward.",
  magazine: "Playful cover idea; the big number lands.",
};

export function mockBaseline(brand: Brand, family: Family): number {
  const order = [...FAMILIES];
  const shift = [...brand.id].reduce((a, c) => a + c.charCodeAt(0), 0) % order.length;
  const rotated = [...order.slice(shift), ...order.slice(0, shift)];
  return 8.4 - rotated.indexOf(family) * 0.3;
}

export function mockJudge(brand: Brand, family: Family, taste: TasteItem[], tasteApplied: boolean): Verdict {
  const bias = familyBias(taste.slice(0, TASTE_IN_PROMPT)).get(family) ?? 0;
  const target = Math.max(1, Math.min(10, mockBaseline(brand, family) + bias));
  const clamp = (n: number) => Math.max(1, Math.min(10, Math.round(n)));
  const scores = {
    design: clamp(target + 0.4),
    usability: clamp(target - 0.3),
    creativity: clamp(target + (family === "centred" || family === "minimal" ? -1 : 0.6)),
    content: clamp(target - 0.2),
  };
  return { scores, overall: Math.round(target * 10) / 10, note: MOCK_NOTES[family], tasteApplied, ms: 0 };
}
