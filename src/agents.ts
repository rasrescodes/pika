// The three roles. System prompts are read verbatim from prompts/ and never change per call:
// a changed prompt is a new Mubit task. Everything that varies goes in the user message.
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { ask, image, text, MODELS, type Reply } from "./mubit.ts";

const prompt = (name: string) => readFileSync(`prompts/${name}.md`, "utf8").trim();
// Pinned versions: changing one starts a new Mubit task, so bump on purpose and note it in DECISIONS.md.
const V = { describer: process.env.DESCRIBER_PROMPT || "v2", builder: process.env.BUILDER_PROMPT || "v2" };
const SYSTEM = {
  describer: prompt(`describer.${V.describer}`),
  describerDom: prompt(`describer-dom.${V.describer}`),
  builder: prompt(`builder.${V.builder}`),
  critic: prompt("critic.v1"),
  lessons: prompt("lessons.v1"),
};

// JPEG keeps request bodies small (starter credit caps them at 8 MiB) and costs no detail that matters here.
const jpeg = async (png: Buffer) => image(await sharp(png).jpeg({ quality: 85 }).toBuffer(), "image/jpeg");

export type DescribeInput = { lessons: string; previousSpec?: string; fixes?: string[] };

// input.lessons arrives already headed (PLAYBOOK, HOUSE LESSONS) from the loop.
function describeText(input: DescribeInput, first: string) {
  const parts = [input.lessons.trim() || "HOUSE LESSONS: (none yet)"];
  if (input.previousSpec && input.fixes?.length) {
    parts.push(`PREVIOUS SPEC:\n${input.previousSpec.trim()}`);
    parts.push(`FIXES:\n${input.fixes.map((f) => `- ${f}`).join("\n")}`);
  } else {
    parts.push(first);
  }
  return parts.join("\n\n");
}

// Screenshot loop: the Describer sees the original image.
export async function describe(input: DescribeInput & { original: Buffer }, session: string, record = true): Promise<Reply> {
  return ask({
    model: MODELS.describer,
    system: SYSTEM.describer,
    content: [await jpeg(input.original), text(describeText(input, "This is the first attempt for this screenshot."))],
    maxTokens: 900,
    session,
    record,
  });
}

// DOM loop: text only, the measurements from measure.json. A separate Mubit task from the screenshot Describer.
export async function describeDom(input: DescribeInput & { measured: string }, session: string, record = true): Promise<Reply> {
  return ask({
    model: MODELS.describer,
    system: SYSTEM.describerDom,
    content: [text(`MEASUREMENTS:\n${input.measured}\n\n${describeText(input, "This is the first attempt for this page.")}`)],
    maxTokens: 900,
    session,
    record,
  });
}

const FIT_SCRIPT =
  "<script>document.fonts.ready.then(()=>{for(const e of document.querySelectorAll('[data-fit]')){const r=Number(e.dataset.fit)/e.getBoundingClientRect().width;if(r>0.4&&r<2.5){e.style.transformOrigin='0 0';e.style.transform='scaleX('+r+')'}}})</script>";

export async function build(spec: string, session: string, record = true) {
  const reply = await ask({
    model: MODELS.builder,
    system: SYSTEM.builder,
    content: [text(spec)],
    maxTokens: 12000,
    session,
    record,
  });
  const fenced = reply.text.match(/```(?:html)?\s*([\s\S]*?)```/);
  let html = (fenced ? fenced[1] : reply.text).trim();
  // builder.v2 asks for this exact script; add it if the model left it out, so fit never depends on copying it.
  if (html.includes("data-fit") && !html.includes("[data-fit]")) {
    html = html.includes("</body>") ? html.replace("</body>", `${FIT_SCRIPT}</body>`) : html + FIT_SCRIPT;
  }
  return { ...reply, html };
}

export async function critique(original: Buffer, rebuild: Buffer, spec: string, session: string, record = true) {
  const reply = await ask({
    model: MODELS.critic,
    system: SYSTEM.critic,
    content: [text("Image A, the original:"), await jpeg(original), text("Image B, the rebuild:"), await jpeg(rebuild), text(`SPEC:\n${spec}`)],
    maxTokens: 600,
    session,
    record,
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
