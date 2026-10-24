// Text measurements of a rendered page, in the same shape as data/sites/<slug>/measure.json.
// Computed styles and boxes only: nothing is copied from a site's source.
import type { Page } from "playwright";

export type TextBox = {
  text: string;
  bbox: { x: number; y: number; w: number; h: number };
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textTransform: string;
  color: string;
  textAlign: string;
};
export type Measure = { texts: TextBox[]; bodyBg: string; dominantBgs: { color: string; area: number }[] };

// Plain JS string, not a function: tsx would inject __name helpers that don't exist in the page.
const MEASURE_JS = `(() => {
  const W = innerWidth, H = innerHeight;
  const hex = (c) => {
    const m = c.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return c;
    const [r, g, b, a] = m[1].split(/[ ,/]+/).map(Number);
    if (a === 0) return "transparent";
    return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  };
  const clip = (r) => {
    const x = Math.max(0, r.left), y = Math.max(0, r.top);
    return { x: Math.round(x), y: Math.round(y), w: Math.round(Math.min(W, r.right) - x), h: Math.round(Math.min(H, r.bottom) - y) };
  };
  const texts = [], bgs = new Map();
  for (const el of document.body.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
    const box = clip(el.getBoundingClientRect());
    if (box.w <= 0 || box.h <= 0) continue;
    const bg = hex(cs.backgroundColor);
    if (bg !== "transparent") bgs.set(bg, (bgs.get(bg) || 0) + box.w * box.h);
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const leaf = ![...el.children].some((c) => c.innerText && c.innerText.trim());
    const t = el.innerText && el.innerText.trim().replace(/\\s+/g, " ");
    if (!t || !(own || leaf)) continue;
    texts.push({ text: t.slice(0, 120), bbox: box, fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, textTransform: cs.textTransform, color: hex(cs.color), textAlign: cs.textAlign });
  }
  texts.sort((a, b) => b.bbox.w * b.bbox.h - a.bbox.w * a.bbox.h);
  return {
    texts: texts.slice(0, 60),
    // The page colour often sits on html or a full-size wrapper, not body; browsers default to white.
    bodyBg: [document.body, document.documentElement].map((e) => hex(getComputedStyle(e).backgroundColor)).find((c) => c !== "transparent")
      || ([...bgs].find(([c, a]) => a >= W * H * 0.9) || ["#ffffff"])[0],
    dominantBgs: [...bgs].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([color, area]) => ({ color, area })),
  };
})()`;

export async function measurePage(page: Page): Promise<Measure> {
  return page.evaluate(MEASURE_JS) as Promise<Measure>;
}

// One line per text element: compact enough to keep the Describer's input short for Mubit training.
export function measureToText(m: Measure, media: { x: number; y: number; w: number; h: number }[] = []) {
  const px = (v: string) => (v.endsWith("px") ? String(Math.round(parseFloat(v) * 10) / 10) : v);
  const lines = [
    `PAGE: body ${m.bodyBg}; largest backgrounds ${m.dominantBgs.map((b) => b.color).join(", ")}`,
    "TEXT (largest first): \"text\" @x,y wxh | font size/line-height weight letter-spacing case colour align",
    ...m.texts.map((t) => {
      const b = t.bbox;
      const font = t.fontFamily.split(",").slice(0, 2).map((f) => f.trim().replace(/"/g, "")).join(",");
      return `"${t.text}" @${b.x},${b.y} ${b.w}x${b.h} | ${font} ${px(t.fontSize)}/${px(t.lineHeight)} w${t.fontWeight} ls:${t.letterSpacing} ${t.textTransform} ${t.color} ${t.textAlign}`;
    }),
  ];
  if (media.length) lines.push("MEDIA BOXES: " + media.map((b) => `@${b.x},${b.y} ${b.w}x${b.h}`).join("; "));
  return lines.join("\n");
}
