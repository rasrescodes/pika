// Builds data/proof/frozen-eval.json: six byte-identical Juror inputs (constant system prompt, a fixed
// image, a fixed brand line, NO taste notes) used to compare the adapter before and after a correction.
// Usage: npx tsx scripts/frozen-eval.ts <up1> <up2> <up3> -- <down1> <down2> <down3>
//   "up" sections should match the art director's correction (expected to score higher after it),
//   "down" sections should go against it. Paths are images, e.g. scripts/fixtures/sections/pika-oversized.jpg
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const args = process.argv.slice(2);
const cut = args.indexOf("--");
const up = args.slice(0, cut);
const down = args.slice(cut + 1);
if (cut < 0 || up.length !== 3 || down.length !== 3) {
  console.error("Give exactly 3 'up' images, then --, then 3 'down' images.");
  process.exit(1);
}
const system = readFileSync("prompts/juror-v1.md", "utf8");
const user = "Brand: held-out evaluation. No art director notes yet.\nScore the section in the image.";
const messages = [...up.map((p) => ({ p, expected: "up" })), ...down.map((p) => ({ p, expected: "down" }))].map(({ p, expected }) => ({
  section: path.basename(p).replace(/\.\w+$/, ""),
  expected,
  system,
  user,
  image: `data:image/jpeg;base64,${readFileSync(p).toString("base64")}`,
  settings: { temperature: 0, max_tokens: 160 },
}));
const hash = createHash("sha256").update(JSON.stringify(messages)).digest("hex").slice(0, 16);
mkdirSync("data/proof", { recursive: true });
writeFileSync("data/proof/frozen-eval.json", JSON.stringify({ hash, messages }, null, 2));
console.log(`frozen-eval.json written, hash ${hash}. Run these 6 inputs on the adapter BEFORE and AFTER the correction (Try models), then record both in data/proof/correction-proof.json with frozenEvalHash "${hash}".`);
