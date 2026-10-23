// The DOM loop's Critic: compares the original's measurements with the rebuild's, in code.
// Returns at most 5 fixes, worst first, in the same one-line form as the LLM Critic.
import type { Measure, TextBox } from "./measure.ts";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const num = (v: string) => parseFloat(v) || 0;

function rgb(hex: string) {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function colourGap(a: string, b: string) {
  const x = rgb(a);
  const y = rgb(b);
  return x && y ? Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) : 0;
}

function match(t: TextBox, pool: TextBox[]) {
  const key = norm(t.text);
  if (!key) return undefined;
  return pool.find((p) => norm(p.text) === key) ?? pool.find((p) => norm(p.text).startsWith(key.slice(0, 20)) || key.startsWith(norm(p.text).slice(0, 20)));
}

export function domFixes(original: Measure, rebuild: Measure): string[] {
  const found: { weight: number; fix: string }[] = [];
  const clip = (s: string) => (s.length > 40 ? s.slice(0, 40) + "..." : s);

  if (colourGap(original.bodyBg, rebuild.bodyBg) > 30) {
    found.push({ weight: 1e9, fix: `Page background is ${original.bodyBg}, not ${rebuild.bodyBg}.` });
  }

  for (const t of original.texts) {
    const area = t.bbox.w * t.bbox.h;
    const r = match(t, rebuild.texts);
    if (!r) {
      found.push({ weight: area * 2, fix: `Missing text "${clip(t.text)}" at x=${t.bbox.x}, y=${t.bbox.y}, ${t.bbox.w}x${t.bbox.h}px.` });
      continue;
    }
    const parts: string[] = [];
    let err = 0;
    const dx = r.bbox.x - t.bbox.x;
    const dy = r.bbox.y - t.bbox.y;
    if (Math.abs(dx) > 16 || Math.abs(dy) > 16) {
      parts.push(`move to x=${t.bbox.x}, y=${t.bbox.y} (now ${r.bbox.x}, ${r.bbox.y})`);
      err += Math.min(1, Math.hypot(dx, dy) / 300);
    }
    const size = num(r.fontSize) / (num(t.fontSize) || 1);
    if (Math.abs(size - 1) > 0.1) {
      parts.push(`font size ${num(t.fontSize)}px (now ${num(r.fontSize)}px)`);
      err += Math.min(1, Math.abs(size - 1));
    }
    if (Math.abs(num(r.fontWeight) - num(t.fontWeight)) >= 200) {
      parts.push(`weight ${t.fontWeight} (now ${r.fontWeight})`);
      err += 0.3;
    }
    if (colourGap(t.color, r.color) > 40) {
      parts.push(`colour ${t.color} (now ${r.color})`);
      err += 0.3;
    }
    if (parts.length) found.push({ weight: area * err, fix: `"${clip(t.text)}": ${parts.join("; ")}.` });
  }

  return found.sort((a, b) => b.weight - a.weight).slice(0, 5).map((f) => f.fix);
}
