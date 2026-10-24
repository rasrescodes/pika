// How close a rebuild is to the original, 0-100. Plain code, no LLM, so it can't flatter itself.
// Media regions (masks.json) are greyed out on both sides: the Builder can only draw placeholders there.
import sharp from "sharp";
import { ssim } from "ssim.js";

export type Box = { x: number; y: number; w: number; h: number };
export type Score = { total: number; structure: number; colour: number; edges: number; visible: number; dom?: number };

const W = 480;
const H = 300;
const FULL = { w: 1440, h: 900 };
const WEIGHTS = { structure: 0.4, colour: 0.3, edges: 0.3 };

async function load(png: Buffer, masks: Box[]) {
  const { data } = await sharp(png)
    .resize(FULL.w, FULL.h, { fit: "cover", position: "top" })
    .removeAlpha()
    .resize(W, H)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const keep = new Uint8Array(W * H).fill(1);
  const sx = W / FULL.w;
  const sy = H / FULL.h;
  for (const b of masks) {
    for (let y = Math.max(0, Math.floor(b.y * sy)); y < Math.min(H, Math.ceil((b.y + b.h) * sy)); y++) {
      for (let x = Math.max(0, Math.floor(b.x * sx)); x < Math.min(W, Math.ceil((b.x + b.w) * sx)); x++) {
        keep[y * W + x] = 0;
        data.fill(128, (y * W + x) * 3, (y * W + x) * 3 + 3);
      }
    }
  }
  return { rgb: data, keep };
}

function toRgba(rgb: Buffer) {
  const out = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    out[i * 4] = rgb[i * 3];
    out[i * 4 + 1] = rgb[i * 3 + 1];
    out[i * 4 + 2] = rgb[i * 3 + 2];
    out[i * 4 + 3] = 255;
  }
  return { data: out, width: W, height: H };
}

// Histogram intersection over 8x8x8 colour bins, unmasked pixels only.
function colourMatch(a: Buffer, b: Buffer, keep: Uint8Array) {
  const ha = new Float64Array(512);
  const hb = new Float64Array(512);
  let n = 0;
  for (let i = 0; i < W * H; i++) {
    if (!keep[i]) continue;
    n++;
    ha[((a[i * 3] >> 5) << 6) | ((a[i * 3 + 1] >> 5) << 3) | (a[i * 3 + 2] >> 5)]++;
    hb[((b[i * 3] >> 5) << 6) | ((b[i * 3 + 1] >> 5) << 3) | (b[i * 3 + 2] >> 5)]++;
  }
  if (!n) return 1;
  let common = 0;
  for (let k = 0; k < 512; k++) common += Math.min(ha[k], hb[k]);
  return common / n;
}

function edgeMap(rgb: Buffer) {
  const g = new Float64Array(W * H);
  for (let i = 0; i < W * H; i++) g[i] = 0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2];
  const e = new Uint8Array(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const p = (dx: number, dy: number) => g[(y + dy) * W + x + dx];
      const gx = p(1, -1) + 2 * p(1, 0) + p(1, 1) - p(-1, -1) - 2 * p(-1, 0) - p(-1, 1);
      const gy = p(-1, 1) + 2 * p(0, 1) + p(1, 1) - p(-1, -1) - 2 * p(0, -1) - p(1, -1);
      e[y * W + x] = Math.hypot(gx, gy) > 120 ? 1 : 0;
    }
  }
  return e;
}

function near(e: Uint8Array, x: number, y: number, r: number) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const xx = x + dx;
      const yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < W && yy < H && e[yy * W + xx]) return true;
    }
  }
  return false;
}

// F1 of edge pixels that land within 2px of an edge on the other side.
function edgeMatch(a: Buffer, b: Buffer, keep: Uint8Array) {
  const ea = edgeMap(a);
  const eb = edgeMap(b);
  let na = 0, nb = 0, hitA = 0, hitB = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!keep[i]) continue;
      if (ea[i]) { na++; if (near(eb, x, y, 2)) hitA++; }
      if (eb[i]) { nb++; if (near(ea, x, y, 2)) hitB++; }
    }
  }
  if (!na && !nb) return 1;
  if (!na || !nb) return 0;
  const recall = hitA / na;
  const precision = hitB / nb;
  return precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
}

export async function score(original: Buffer, rebuild: Buffer, masks: Box[] = []): Promise<Score> {
  const a = await load(original, masks);
  const b = await load(rebuild, masks);
  const structure = Math.max(0, ssim(toRgba(a.rgb), toRgba(b.rgb)).mssim);
  const colour = colourMatch(a.rgb, b.rgb, a.keep);
  const edges = edgeMatch(a.rgb, b.rgb, a.keep);
  // Share of the frame left after masking. Near zero, every rebuild looks perfect, so callers must not trust total alone.
  const visible = a.keep.reduce((n, k) => n + k, 0) / (W * H);
  const total = 100 * (WEIGHTS.structure * structure + WEIGHTS.colour * colour + WEIGHTS.edges * edges);
  const r = (v: number) => Math.round(v * 1000) / 1000;
  return { total: Math.round(total * 10) / 10, structure: r(structure), colour: r(colour), edges: r(edges), visible: r(visible) };
}
