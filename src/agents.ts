// The three roles. System prompts are read verbatim from prompts/ and never change per call:
// a changed prompt is a new Mubit task. Everything that varies goes in the user message.
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { ask, image, text, MODELS, type Reply } from "./mubit.ts";

const prompt = (name: string) => readFileSync(`prompts/${name}.md`, "utf8").trim();
const SYSTEM = {
  describer: prompt("describer.v1"),
  builder: prompt("builder.v1"),
  critic: prompt("critic.v1"),
  lessons: prompt("lessons.v1"),
};

// JPEG keeps request bodies small (starter credit caps them at 8 MiB) and costs no detail that matters here.
const jpeg = async (png: Buffer) => image(await sharp(png).jpeg({ quality: 85 }).toBuffer(), "image/jpeg");

export type DescribeInput = { original: Buffer; lessons: string; previousSpec?: string; fixes?: string[] };

export async function describe(input: DescribeInput, session: string, record = true): Promise<Reply> {
  const parts = [`HOUSE LESSONS:\n${input.lessons.trim() || "(none yet)"}`];
  if (input.previousSpec && input.fixes?.length) {
    parts.push(`PREVIOUS SPEC:\n${input.previousSpec.trim()}`);
    parts.push(`FIXES FROM THE CRITIC:\n${input.fixes.map((f) => `- ${f}`).join("\n")}`);
  } else {
    parts.push("This is the first attempt for this screenshot.");
  }
  return ask({
    model: MODELS.describer,
    system: SYSTEM.describer,
    content: [await jpeg(input.original), text(parts.join("\n\n"))],
    maxTokens: 900,
    session,
    record,
  });
}

export async function build(spec: string, session: string) {
  const reply = await ask({
    model: MODELS.builder,
    system: SYSTEM.builder,
    content: [text(spec)],
    maxTokens: 12000,
    session,
  });
  const fenced = reply.text.match(/```(?:html)?\s*([\s\S]*?)```/);
  const html = (fenced ? fenced[1] : reply.text).trim();
  return { ...reply, html };
}

export async function critique(original: Buffer, rebuild: Buffer, spec: string, session: string) {
  const reply = await ask({
    model: MODELS.critic,
    system: SYSTEM.critic,
    content: [text("Image A, the original:"), await jpeg(original), text("Image B, the rebuild:"), await jpeg(rebuild), text(`SPEC:\n${spec}`)],
    maxTokens: 600,
    session,
  });
  let fixes: string[] = [];
  try {
    const json = reply.text.slice(reply.text.indexOf("{"), reply.text.lastIndexOf("}") + 1);
    fixes = (JSON.parse(json).fixes ?? []).map(String).slice(0, 5);
  } catch {
    fixes = [];
  }
  return { ...reply, fixes };
}

export async function updateLessons(current: string, fixes: string[]) {
  const reply = await ask({
    model: MODELS.describer,
    system: SYSTEM.lessons,
    content: [text(`CURRENT LESSONS:\n${current.trim() || "(none yet)"}\n\nRECENT FIXES:\n${fixes.map((f) => `- ${f}`).join("\n")}`)],
    maxTokens: 600,
  });
  return reply.text.split("\n").filter((l) => l.trim().startsWith("- ")).slice(0, 10).join("\n");
}
