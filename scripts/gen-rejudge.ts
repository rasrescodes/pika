// Adds Juror scores to holdout rows recorded without them (--skip-judge, or while Mubit credit was out).
// Same Juror, same call shape as gen-distill.ts (jury-v1, Sonnet, record=false). Usage: npx tsx scripts/gen-rejudge.ts <tag>
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { PRESETS, type Brand } from "../lib/brands";
import { JUROR_SYSTEM, jurorUserMessage, overallOf, parseReply } from "../lib/juror";
import { sanitise } from "../lib/sanitise";
import { screenshot } from "../lib/shot";
import { ask, image, text } from "../src/mubit";

const TAG = process.argv[2];
if (!TAG) throw new Error("usage: gen-rejudge.ts <tag>");
const f = `data/gen/${TAG}/results.jsonl`;
const rows = readFileSync(f, "utf8").trim().split("\n").map((l) => JSON.parse(l));
const brands: Brand[] = [...PRESETS, ...(existsSync("data/gen/brands.json") ? JSON.parse(readFileSync("data/gen/brands.json", "utf8")) : [])];
const save = () => writeFileSync(f, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
for (const row of rows.filter((r) => !r.juror)) {
  const b = brands.find((x) => x.id === row.brand)!;
  const shot = await screenshot(sanitise(readFileSync(`data/gen/${TAG}/${row.id}.html`, "utf8")));
  const judge = async () =>
    parseReply((await ask({ model: "claude-sonnet-5-5", system: JUROR_SYSTEM, content: [text(jurorUserMessage(b, [])), image(Buffer.from(shot.dataUrl.split(",")[1], "base64"), "image/jpeg")], maxTokens: 4000, record: false })).text);
  try {
    const j = await judge().catch(judge);
    row.juror = { design: j.design, usability: j.usability, creativity: j.creativity, content: j.content };
    row.overall = overallOf(row.juror);
    row.note = j.note;
    save();
    console.log(`${row.id}: juror ${row.overall}`);
  } catch (err) {
    console.error(`${row.id}: ${(err as Error).message}`);
  }
}
process.exit(0);
