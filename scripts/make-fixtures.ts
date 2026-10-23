// Renders the MOCK sections for every preset and two extra palettes into scripts/fixtures/sections/
// (36 screenshots) so the feasibility spike can send 30 real Juror calls the moment a key exists.
import { mkdirSync, writeFileSync } from "node:fs";
import { PRESETS, type Brand } from "../lib/brands";
import { FAMILIES } from "../lib/families";
import { mockSection } from "../lib/mockGenerator";
import { sanitise } from "../lib/sanitise";
import { screenshot } from "../lib/shot";

const extra: Brand[] = [
  { ...PRESETS[0], id: "ink", name: "Ink Studio", colours: { bg: "#f4f1ea", ink: "#1b1b1b", accent: "#2f54eb", soft: "#dfe6ff" }, displayFont: "sans", headline: "Type that holds a room", subline: "A small studio for brands that would rather be read than skimmed.", action: "See the work" },
];
mkdirSync("scripts/fixtures/sections", { recursive: true });
let n = 0;
for (const brand of [...PRESETS, ...extra]) {
  for (const family of FAMILIES) {
    const shot = await screenshot(sanitise(mockSection(brand, family)));
    const buf = Buffer.from(shot.dataUrl.split(",")[1], "base64");
    writeFileSync(`scripts/fixtures/sections/${brand.id}-${family}.jpg`, buf);
    if (n === 0) writeFileSync("scripts/fixtures/spike-section.jpg", buf);
    n++;
  }
}
console.log(`${n} fixture screenshots written to scripts/fixtures/sections/`);
process.exit(0);
