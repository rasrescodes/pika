// The code Builder: turns a v2 spec into HTML with no LLM, following prompts/builder.v2.md literally.
// It is the fixed Builder for the local loop (BUILDER=code), so every score change comes from the Describer.
// Lines it can't parse are skipped, never fatal: a sloppy spec should score low, not stop the batch.

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const num = (s: string | undefined, d = 0) => (s !== undefined && Number.isFinite(Number(s)) ? Number(s) : d);
// Hex or a CSS gradient; anything else could break out of the style attribute.
const safeFill = (s: string) => (/^#[0-9a-f]{3,8}$/i.test(s) || /^(linear|radial|conic)-gradient\([^"<>;{}]*\)$/i.test(s) ? s : "#888888");

export const FIT_SCRIPT =
  "<script>document.fonts.ready.then(()=>{for(const e of document.querySelectorAll('[data-fit]')){const r=Number(e.dataset.fit)/e.getBoundingClientRect().width;if(r>0.4&&r<2.5){e.style.transformOrigin='0 0';e.style.transform='scaleX('+r+')'}}})</script>";

type Font = { name: string; weights: string[] };

function shape(body: string) {
  const over = /\sover$/.test(body);
  const b = body.replace(/\sover$/, "").trim();
  let m = b.match(/^(rect|ellipse)\s+(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)\s+(.+)$/);
  if (m) {
    let rest = m[6];
    let extra = "";
    const r = rest.match(/\sr(\d+(?:\.\d+)?)/);
    if (r) {
      extra += `border-radius:${r[1]}px;`;
      rest = rest.replace(r[0], "");
    }
    const bd = rest.match(/\sborder\s+(\d+(?:\.\d+)?)\s+(#[0-9a-f]{3,8})/i);
    if (bd) {
      extra += `border:${bd[1]}px solid ${bd[2]};`;
      rest = rest.replace(bd[0], "");
    }
    if (m[1] === "ellipse") extra += "border-radius:50%;";
    return { over, html: `<div style="left:${m[2]}px;top:${m[3]}px;width:${m[4]}px;height:${m[5]}px;background:${safeFill(rest.trim())};${extra}"></div>` };
  }
  m = b.match(/^poly\s+((?:-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?\s+)+)(.+)$/);
  if (m) {
    const pts = m[1].trim().split(/\s+/).map((p) => p.split(",").map((v) => `${v}px`).join(" ")).join(",");
    return { over, html: `<div style="left:0;top:0;width:1440px;height:900px;background:${safeFill(m[2].trim())};clip-path:polygon(${pts})"></div>` };
  }
  return undefined;
}

const fallback = (n: string) => (/mono/i.test(n) ? "monospace" : /serif|fraunces|playfair|newsreader|cormorant|garamond/i.test(n) && !/sans/i.test(n) ? "serif" : "sans-serif");

function textLine(body: string, fonts: Record<string, Font>) {
  const i = body.indexOf(': "');
  if (i < 0) return [];
  const style = body.slice(0, i).trim().split(/\s+/);
  const items = body.slice(i + 2);
  const font = fonts[style[0]] ?? Object.values(fonts)[0] ?? { name: "Inter", weights: ["400"] };
  const [size, lh] = (style[1] ?? "16/20").split("/");
  let css = `font-family:'${font.name}',${fallback(font.name)};font-size:${num(size, 16)}px;line-height:${num(lh, num(size, 16) * 1.2)}px;white-space:nowrap;`;
  for (let k = 2; k < style.length; k++) {
    const t = style[k];
    if (/^w\d+$/.test(t)) css += `font-weight:${t.slice(1)};`;
    else if (/^ls-?\d/.test(t)) css += `letter-spacing:${num(t.slice(2))}px;`;
    else if (t === "upper") css += "text-transform:uppercase;";
    else if (t === "italic") css += "font-style:italic;";
    else if (t === "underline") css += "text-decoration:underline;";
    else if (/^#[0-9a-f]{3,8}$/i.test(t)) css += `color:${t};`;
    else if (t === "centre" || t === "center" || t === "right") {
      css += `width:${num(style[++k])}px;text-align:${t === "right" ? "right" : "center"};`;
    } else if (t === "wrap") css += `width:${num(style[++k])}px;white-space:normal;`;
  }
  const out: string[] = [];
  for (const m of items.matchAll(/"([^"]*)"\s*@\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)(?:\s+fit\s+(\d+(?:\.\d+)?))?/g)) {
    const copy = m[1].split(" | ").map(esc).join("<br>");
    out.push(`<div style="left:${m[2]}px;top:${m[3]}px;${css}"${m[4] ? ` data-fit="${m[4]}"` : ""}>${copy}</div>`);
  }
  return out;
}

export function compile(spec: string) {
  let section = "";
  let canvas = "#ffffff";
  const fonts: Record<string, Font> = {};
  const shapes: { over: boolean; html: string }[] = [];
  const media: string[] = [];
  const texts: string[] = [];
  for (const raw of spec.replace(/```\w*/g, "").split("\n")) {
    const l = raw.trim().replace(/^\*\*(\w+)\*\*:?/, "$1:");
    const head = l.match(/^(CANVAS|FONTS|SHAPES|MEDIA|TEXT):\s*(.*)$/);
    if (head) {
      section = head[1];
      if (section === "CANVAS" && /^#[0-9a-f]{3,8}$/i.test(head[2].trim())) canvas = head[2].trim();
      if (section === "FONTS") {
        for (const f of head[2].split(";")) {
          const [k, v] = f.split("=").map((s) => s.trim());
          if (!k || !v) continue;
          const w = v.match(/([\d,\s]+)$/);
          fonts[k] = { name: v.replace(/\s*[\d,\s]+$/, "").replace(/[^\w ]/g, "").trim() || "Inter", weights: w ? w[1].split(",").map((s) => s.trim()).filter(Boolean) : ["400"] };
        }
      }
      continue;
    }
    if (!l.startsWith("- ")) continue;
    const body = l.slice(2).trim();
    if (section === "SHAPES") {
      const s = shape(body);
      if (s) shapes.push(s);
    } else if (section === "MEDIA") {
      const m = body.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)\s+(#[0-9a-f]{3,8})/i);
      if (m) media.push(`<div style="left:${m[1]}px;top:${m[2]}px;width:${m[3]}px;height:${m[4]}px;background:${m[5]}"></div>`);
    } else if (section === "TEXT") texts.push(...textLine(body, fonts));
  }
  const html = [...shapes.filter((s) => !s.over).map((s) => s.html), ...media, ...shapes.filter((s) => s.over).map((s) => s.html), ...texts];
  const families = Object.values(fonts)
    .map((f) => `family=${f.name.replace(/ /g, "+")}:wght@${[...new Set(f.weights)].sort((a, b) => Number(a) - Number(b)).join(";")}`)
    .join("&");
  const link = families ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${families}&display=block">` : "";
  return `<!doctype html><html><head><meta charset="utf-8">${link}<style>html,body{margin:0;width:1440px;height:900px;overflow:hidden}body{position:relative;background:${canvas}}body>div{position:absolute;box-sizing:border-box}</style></head><body>${html.join("\n")}${FIT_SCRIPT}</body></html>`;
}
