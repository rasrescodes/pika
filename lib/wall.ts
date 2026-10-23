// The Wall's server-side state and the batch pipeline: generate -> sanitise -> screenshot -> judge.
import { read, write } from "./store";
import { PRESETS, type Brand } from "./brands";
import { FAMILIES, type Family } from "./families";
import { generate } from "./generator";
import { sanitise } from "./sanitise";
import { screenshot } from "./shot";
import { judge, JurorError, type Verdict } from "./juror";
import type { TasteItem } from "./taste";
import { mode } from "./llm";

export type Card = {
  id: string;
  family: Family;
  html: string;
  verdict: Verdict | null;
  error?: string;
};

export type WallState = { batchId: string; brandId: string; cards: Card[]; order: string[]; batchMs: number; finishedAt: string } | null;

export function currentBrand(): Brand {
  const saved = read<Brand | null>("brand", null);
  return saved ?? PRESETS[0];
}

export function getTaste(): TasteItem[] {
  return read<TasteItem[]>("taste", []);
}

export function getWall(): WallState {
  return read<WallState>("wall", null);
}

const CONCURRENCY = 4;

export async function runBatch(onCard: (card: Card) => void): Promise<NonNullable<WallState>> {
  const started = performance.now();
  const brand = currentBrand();
  const taste = getTaste();
  const batchId = Date.now().toString(36);
  const variant = read<number>("batches", 0);
  write("batches", variant + 1);
  const cards: Card[] = [];
  const queue = [...FAMILIES];

  async function worker() {
    for (let family = queue.shift(); family; family = queue.shift()) {
      const id = `${batchId}-${family}`;
      let card: Card;
      try {
        const gen = await generate(brand, family, variant);
        const html = sanitise(gen.html);
        const shot = await screenshot(html);
        const verdict = await judge({ imageDataUrl: shot.dataUrl, brand, family, taste });
        card = { id, family, html, verdict };
      } catch (e) {
        const msg = e instanceof JurorError ? e.message : "This section could not be generated or judged.";
        console.error(`[batch ${batchId}] ${family}:`, e);
        card = { id, family, html: "", verdict: null, error: msg };
      }
      cards.push(card);
      onCard(card);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const state = { batchId, brandId: brand.id, cards, order: [], batchMs: Math.round(performance.now() - started), finishedAt: new Date().toISOString() };
  write("wall", state);
  return state;
}

export function publicState() {
  return { mode: mode(), brand: currentBrand(), wall: getWall(), taste: getTaste() };
}
