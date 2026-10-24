// Sanity tests for the loop's code-only score: if these fail, no demo number can be trusted.
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import sharp from "sharp";
import { score } from "@/src/score";

const SITE = "data/sites/2xa-studio";
const ready = existsSync(`${SITE}/original.png`);

async function blank(colour: string) {
  return sharp({ create: { width: 1440, height: 900, channels: 3, background: colour } }).png().toBuffer();
}
async function shifted(png: Buffer, dx: number) {
  return sharp(png).extend({ left: dx, background: "#ffffff" }).extract({ left: 0, top: 0, width: 1440, height: 900 }).png().toBuffer();
}

describe.skipIf(!ready)("score (code only, no LLM)", () => {
  const original = ready ? readFileSync(`${SITE}/original.png`) : Buffer.alloc(0);

  it("an identical copy scores near 100", async () => {
    const s = await score(original, original, []);
    expect(s.total).toBeGreaterThanOrEqual(98);
  });

  it("a blank page scores far below an identical copy", async () => {
    const same = await score(original, original, []);
    const white = await score(original, await blank("#ffffff"), []);
    expect(white.total).toBeLessThan(same.total - 30);
  });

  it("is monotonic: a bigger misplacement scores lower", async () => {
    const small = await score(original, await shifted(original, 20), []);
    const big = await score(original, await shifted(original, 200), []);
    expect(big.total).toBeLessThan(small.total);
  });

  it("masks cannot hand out free points: fully masked frames report almost nothing visible", async () => {
    const s = await score(original, await blank("#ffffff"), [{ x: 0, y: 0, w: 1440, h: 900 }]);
    expect(s.visible).toBeLessThan(0.05);
  });
});
