// The rule-based Describer: measure.json to a v2 spec in code, following prompts/describer-dom.v2.md.
// It is the teacher for local fine-tuning: its specs are the first training targets, before the model's own best rounds.
// No LLM. Tuned on train sites only.
import type { Measure, TextBox } from "./measure.ts";
import type { Box } from "./score.ts";

const W = 1440;
const H = 900;
const r1 = (v: number) => Math.round(v * 10) / 10;

export function toHex(c: string) {
  if (/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(c)) return "#" + [...c.slice(1)].map((h) => h + h).join("").toLowerCase();
  const srgb = c.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (srgb) return "#" + srgb.slice(1, 4).map((v) => Math.round(Number(v) * 255).toString(16).padStart(2, "0")).join("");
  // OKLCH and OKLAB to sRGB (Ottosson's matrices). Alpha is dropped, as measure.ts does for rgba.
  const ok = c.match(/okl(ch|ab)\(\s*([\d.]+)(%?)\s+(-?[\d.]+)\s+(-?[\d.]+)/);
  if (ok) {
    const L = Number(ok[2]) / (ok[3] ? 100 : 1);
    const [a, b] = ok[1] === "ch" ? [Number(ok[4]) * Math.cos((Number(ok[5]) * Math.PI) / 180), Number(ok[4]) * Math.sin((Number(ok[5]) * Math.PI) / 180)] : [Number(ok[4]), Number(ok[5])];
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
    const gamma = (v: number) => Math.round(255 * Math.min(1, Math.max(0, v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)));
    return "#" + lin.map((v) => gamma(v).toString(16).padStart(2, "0")).join("");
  }
  const rgb = c.match(/rgba?\(([^)]+)\)/);
  if (rgb) return "#" + rgb[1].split(/[ ,/]+/).slice(0, 3).map((v) => Math.round(Number(v)).toString(16).padStart(2, "0")).join("");
  return undefined;
}
const rgbOf = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const gap = (a: string, b: string) => {
  const x = rgbOf(a);
  const y = rgbOf(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
};
const lum = (hex: string) => {
  const [r, g, b] = rgbOf(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

// Google Fonts we keep as they are; anything else is mapped by class.
const GOOGLE = new Set(
  "Inter,Roboto,Roboto Flex,Roboto Mono,Geist,Geist Mono,IBM Plex Sans,IBM Plex Mono,IBM Plex Serif,Recursive,Manrope,DM Sans,DM Mono,DM Serif Display,Outfit,Space Grotesk,Space Mono,Poppins,Montserrat,Work Sans,Syne,Archivo,Archivo Black,Bricolage Grotesque,Fraunces,Playfair Display,Newsreader,Source Serif 4,Instrument Serif,Instrument Sans,Cormorant Garamond,EB Garamond,JetBrains Mono,Bebas Neue,Oswald,Anton,Caveat,Lato,Open Sans,Raleway,Nunito,Rubik,Karla,Sora,Plus Jakarta Sans,Figtree,Onest,Unbounded,Big Shoulders Display,Barlow,Barlow Condensed,Libre Baskerville,Lora,Merriweather,Crimson Pro,Familjen Grotesk,Hanken Grotesk,Schibsted Grotesk,Epilogue,Lexend,Urbanist,Red Hat Display,Albert Sans,Public Sans,Mulish,Josefin Sans,Cabinet Grotesk,Fira Code,Fira Sans,Noto Sans,Noto Serif,Bodoni Moda,Libre Caslon Text,Abril Fatface,Alfa Slab One,Teko,Big Shoulders Text"
    .split(",")
    .map((f) => f.toLowerCase()),
);
const GOOGLE_CASE = new Map([...GOOGLE].map((g) => [g, g.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bIbm\b/, "IBM").replace(/\bDm\b/, "DM").replace(/\bEb\b/, "EB")]));

function googleFont(family: string) {
  const [first, second = ""] = family.split(",").map((f) => f.trim().replace(/["']/g, ""));
  const name = first.toLowerCase();
  if (GOOGLE.has(name)) return GOOGLE_CASE.get(name)!;
  const all = `${name} ${second.toLowerCase()}`;
  if (/mono|code|courier/.test(all)) return "JetBrains Mono";
  if (/condensed|compressed|narrow|bebas|oswald|anton|druk|knockout|tungsten/.test(all)) return "Oswald";
  if (/script|hand|brush|marker/.test(all)) return "Caveat";
  if (/italic|editorial|canela|ogg|cormorant|garamond|instrument/.test(all)) return "Instrument Serif";
  if (/serif|times|georgia|tiempos|freight|caslon|baskerville|bodoni|didot|recoleta|domaine|reckless|sectra|lyon|signifier/.test(all) && !/sans/.test(all))
    return /display|bodoni|didot|recoleta|domaine/.test(all) ? "Fraunces" : "Newsreader";
  if (/futura|circular|satoshi|gilroy|avenir|geometric|cera|brown|general/.test(all)) return "DM Sans";
  if (/aeonik|montreal|favorit|abc|grotesk|graphik|haffer|mona|hubot/.test(all)) return "Space Grotesk";
  return "Inter";
}

const px = (v: string, size: number) => {
  if (!v || v === "normal") return 0;
  if (v.endsWith("em")) return parseFloat(v) * size;
  if (v.endsWith("%")) return (parseFloat(v) / 100) * size;
  return parseFloat(v) || 0;
};

type Item = { t: TextBox; text: string; x: number; y: number; w: number; h: number; fit?: number; size: number; lh: number };

// Single letters sharing a y and size are split words: join them left to right.
function joinLetters(texts: TextBox[]): TextBox[] {
  const singles = texts.filter((t) => [...t.text].length === 1 && /\p{L}|\p{N}/u.test(t.text));
  const rest = texts.filter((t) => !singles.includes(t));
  const rows = new Map<string, TextBox[]>();
  for (const t of singles) {
    const k = `${Math.round(t.bbox.y / 4)}|${t.fontSize}`;
    rows.set(k, [...(rows.get(k) ?? []), t]);
  }
  for (const row of rows.values()) {
    if (row.length < 2) {
      rest.push(...row);
      continue;
    }
    row.sort((a, b) => a.bbox.x - b.bbox.x);
    const size = parseFloat(row[0].fontSize) || 16;
    let word = [row[0]];
    const flush = () => {
      const a = word[0].bbox;
      const z = word[word.length - 1].bbox;
      rest.push({ ...word[0], text: word.map((l) => l.text).join(""), bbox: { x: a.x, y: Math.min(...word.map((l) => l.bbox.y)), w: z.x + z.w - a.x, h: Math.max(...word.map((l) => l.bbox.h)) } });
    };
    for (const l of row.slice(1)) {
      const prev = word[word.length - 1].bbox;
      if (l.bbox.x - (prev.x + prev.w) < size * 0.35) word.push(l);
      else {
        flush();
        word = [l];
      }
    }
    flush();
  }
  return rest;
}

// Stay under the prompt's 400 words, and the reply limit, by dropping the smallest text first (texts arrive largest first).
export function teach(m: Measure, masks: Box[] = []): string {
  let spec = "";
  for (let n = 40; n >= 5; n -= 3) {
    spec = teachN(m, masks, n);
    // Numbers tokenise at about 1.6 characters a token, so 2,200 characters keeps well inside the 1,600-token reply.
    if (spec.split(/\s+/).length <= 400 && spec.length <= 2200) break;
  }
  return spec;
}

function teachN(m: Measure, masks: Box[], maxItems: number): string {
  const bgs = m.dominantBgs.map((b) => ({ c: toHex(b.color), area: b.area })).filter((b): b is { c: string; area: number } => !!b.c);
  // Text colour by area, to check the page colour isn't the text colour.
  const textArea = new Map<string, number>();
  for (const t of m.texts) {
    const c = toHex(t.color);
    if (c) textArea.set(c, (textArea.get(c) ?? 0) + t.bbox.w * t.bbox.h);
  }
  const mainText = [...textArea].sort((a, b) => b[1] - a[1])[0]?.[0];
  let canvas = toHex(m.bodyBg) ?? "#ffffff";
  if (mainText && gap(canvas, mainText) < 40) canvas = bgs.find((b) => gap(b.c, mainText) > 120)?.c ?? (lum(mainText) > 0.5 ? "#111111" : "#ffffff");

  // Drop hover duplicates: same copy at one x, at the same y or one line lower.
  const seen: TextBox[] = [];
  const texts = joinLetters(m.texts).filter((t) => {
    const dup = seen.some((s) => s.text === t.text && Math.abs(s.bbox.x - t.bbox.x) < 4 && t.bbox.y - s.bbox.y < s.bbox.h * 1.6 && t.bbox.y >= s.bbox.y);
    seen.push(t);
    return !dup && t.bbox.y < H && t.bbox.x < W;
  });

  const fontKeys = new Map<string, { key: string; weights: Set<number> }>();
  const shapes: string[] = [];
  const items: { style: string; item: Item }[] = [];
  for (const t of texts.slice(0, maxItems)) {
    const color = toHex(t.color);
    if (!color) continue;
    const size = r1(parseFloat(t.fontSize) || 16);
    const lh = t.lineHeight === "normal" ? r1(size * 1.2) : r1(px(t.lineHeight, size)) || r1(size * 1.2);
    const weight = Math.min(900, Math.max(100, Math.round((parseFloat(t.fontWeight) || 400) / 100) * 100));
    const font = googleFont(t.fontFamily);
    const f = fontKeys.get(font) ?? { key: String.fromCharCode(65 + fontKeys.size), weights: new Set() };
    fontKeys.set(font, f);
    const { x, y, w, h } = t.bbox;
    const chars = [...t.text].length;
    const perChar = w / (chars * size);
    const oneLine = h < lh * 1.7 || perChar >= 0.45;
    const n = oneLine ? 1 : Math.max(1, Math.floor(h / lh + 0.3));
    const top = Math.round(y + (h - n * lh) / 2);
    let wt = weight;
    // A box far narrower than its text needs is a condensed cut: fit squeezes it, so thicken the strokes.
    if (oneLine && perChar < 0.4 && size >= 32) wt = Math.min(900, wt + 300);
    f.weights.add(wt);
    const ls = px(t.letterSpacing, size);
    const align = t.textAlign === "center" ? `centre ${w}` : t.textAlign === "right" || t.textAlign === "end" ? `right ${w}` : n > 1 ? `wrap ${w}` : "";
    // Text that would vanish on the page sits on a filled button or panel.
    if (gap(color, canvas) < 40) {
      const behind = bgs.find((b) => gap(b.c, color) > 100);
      if (!behind) continue;
      shapes.push(`- rect ${x},${y} ${w}x${h} ${behind.c}${h < 80 && chars <= 24 ? ` r${Math.round(h / 2)}` : ""}`);
    }
    const style = [`${f.key} ${size}/${lh} w${wt}`, ls ? `ls${r1(ls)}` : "", t.textTransform === "uppercase" ? "upper" : "", color, align].filter(Boolean).join(" ");
    const fit = oneLine && size >= 32 && perChar >= 0.25 && perChar <= 0.7 && !align ? w : undefined;
    items.push({ style, item: { t, text: t.text, x, y: oneLine ? Math.round(y + (h - lh) / 2) : top, w, h, fit, size, lh } });
  }

  // A large listed background that no text explains is a band: put it at the bottom, below the last text.
  const used = new Set([canvas, ...shapes.map((s) => s.split(" ")[3])]);
  const lastText = Math.max(0, ...items.map((i) => i.item.y + i.item.h));
  let bottom = H;
  for (const b of bgs) {
    if (used.has(b.c) || b.area < W * H * 0.06 || b.area > W * H * 0.85) continue;
    const hgt = Math.min(Math.round(b.area / W), bottom - lastText);
    if (hgt < 40) continue;
    shapes.unshift(`- rect 0,${bottom - hgt} ${W}x${hgt} ${b.c}`);
    bottom -= hgt;
    used.add(b.c);
  }

  const mid = lum(canvas) > 0.5 ? "#9a9a9a" : "#4a4a4a";
  const media = masks.filter((b) => b.w * b.h < W * H * 0.9).map((b) => `- ${b.x},${b.y} ${b.w}x${b.h} ${mid} media`);

  // Group items that share a style onto one line, top to bottom.
  const lines = new Map<string, Item[]>();
  for (const { style, item } of items.sort((a, b) => a.item.y - b.item.y || a.item.x - b.item.x)) lines.set(style, [...(lines.get(style) ?? []), item]);
  const textLines = [...lines].map(
    ([style, its]) => `- ${style}: ${its.map((i) => `"${i.text.replace(/"/g, "'")}"@${i.x},${i.y}${i.fit ? ` fit ${i.fit}` : ""}`).join(" ")}`,
  );
  const fonts = [...fontKeys].map(([name, f]) => `${f.key} = ${name} ${[...f.weights].sort((a, b) => a - b).join(",")}`).join("; ");
  return [
    `CANVAS: ${canvas}`,
    `FONTS: ${fonts || "A = Inter 400"}`,
    "SHAPES:",
    ...(shapes.length ? shapes : ["none"]),
    "MEDIA:",
    ...(media.length ? media : ["none"]),
    "TEXT:",
    ...(textLines.length ? textLines : ["none"]),
  ].join("\n");
}
