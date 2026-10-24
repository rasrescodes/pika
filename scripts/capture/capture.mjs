// Captures one above-the-fold screenshot plus measurements for each URL in sites.json.
// Saves the screenshot and computed layout only. Does not write the site's HTML, CSS, JS, fonts or images.
// Usage: node capture.mjs [sites.json] [concurrency]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const SITES = process.argv[2] || 'sites.json';
const CONC = Math.max(1, Number(process.argv[3]) || 2);
const OUT = path.resolve('../../data/sites');
const list = JSON.parse(fs.readFileSync(SITES, 'utf8'));

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// Runs in the page. Viewport boxes only, from getComputedStyle and getBoundingClientRect.
const inPage = () => {
  const VW = 1440;
  const VH = 900;
  const hex = (c) => {
    const m = String(c).match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/);
    if (!m) return c;
    const n = (v) => Math.max(0, Math.min(255, Math.round(Number(v)))).toString(16).padStart(2, '0');
    const a = m[4] === undefined ? 1 : Number(m[4]);
    if (a >= 0.99) return `#${n(m[1])}${n(m[2])}${n(m[3])}`;
    return `rgba(${Math.round(m[1])}, ${Math.round(m[2])}, ${Math.round(m[3])}, ${Math.round(a * 100) / 100})`;
  };
  const clip = (r) => {
    const x = Math.max(0, r.left);
    const y = Math.max(0, r.top);
    const x2 = Math.min(VW, r.right);
    const y2 = Math.min(VH, r.bottom);
    return { x: Math.round(x), y: Math.round(y), w: Math.round(x2 - x), h: Math.round(y2 - y) };
  };
  const visible = (el, cs, r) => cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.05
    && r.width > 1 && r.height > 1 && r.right > 0 && r.bottom > 0 && r.left < VW && r.top < VH;

  const masks = [];
  const texts = [];
  let banner = false;

  let fixedMax = 0;
  let bigCanvas = false;
  let fullBg = null;
  for (const el of document.body.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (!visible(el, cs, r)) continue;
    const box = clip(r);
    if (box.w < 1 || box.h < 1) continue;
    const tag = el.tagName.toLowerCase();
    const big = box.w > 48 && box.h > 48;
    const media = tag === 'img' || tag === 'video' || tag === 'canvas' || (tag === 'svg' && big);
    const bgImage = /url\(/.test(cs.backgroundImage) && big;
    const cover = (box.w * box.h) / (VW * VH);
    // A full-viewport canvas or svg is usually a grain or cursor layer over the type.
    // Masking it would hide the whole hero from the scorer.
    if (tag === 'canvas' && cover > 0.8) bigCanvas = true;
    if (cover > 0.9 && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent' && !fullBg) fullBg = hex(cs.backgroundColor);
    const effectLayer = (tag === 'canvas' || tag === 'svg') && cover > 0.9;
    if (((media && big) || bgImage) && !effectLayer) masks.push(box);

    const label = `${el.getAttribute('aria-label') || ''} ${el.id || ''} ${el.className || ''} ${(el.innerText || '').slice(0, 180)}`;
    // "privacy" alone matches footer links. A banner needs cookie, consent or gdpr copy.
    if ((cs.position === 'fixed' || cs.position === 'sticky') && /cookie|consent|gdpr/.test(label.toLowerCase()) && box.w * box.h > VW * VH * 0.02) {
      banner = true;
    }

    if ((cs.position === 'fixed' || cs.position === 'sticky') && ((el.innerText || '').trim().length > 0 && (el.innerText || '').length < 400 && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent' || /cookie|consent|loading/i.test(el.innerText || ''))) fixedMax = Math.max(fixedMax, (box.w * box.h) / (VW * VH));
    if (tag === 'script' || tag === 'style' || tag === 'noscript') continue;
    let own = '';
    for (const node of el.childNodes) if (node.nodeType === 3) own += node.textContent;
    own = own.replace(/\s+/g, ' ').trim();
    if (!own) continue;
    texts.push({
      text: own.slice(0, 120),
      bbox: box,
      fontFamily: cs.fontFamily.slice(0, 160),
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      letterSpacing: cs.letterSpacing,
      lineHeight: cs.lineHeight,
      textTransform: cs.textTransform,
      color: hex(cs.color),
      textAlign: cs.textAlign,
      _a: box.w * box.h,
    });
  }

  const gw = Math.ceil(VW / 8);
  const gh = Math.ceil(VH / 8);
  const grid = new Uint8Array(gw * gh);
  for (const m of masks) {
    const x0 = Math.max(0, Math.floor(m.x / 8));
    const y0 = Math.max(0, Math.floor(m.y / 8));
    const x1 = Math.min(gw, Math.ceil((m.x + m.w) / 8));
    const y1 = Math.min(gh, Math.ceil((m.y + m.h) / 8));
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) grid[y * gw + x] = 1;
  }
  let covered = 0;
  for (const v of grid) covered += v;

  const step = 36;
  const bgArea = {};
  for (let y = step / 2; y < VH; y += step) {
    for (let x = step / 2; x < VW; x += step) {
      let el = document.elementFromPoint(x, y);
      let color = null;
      while (el && el !== document.documentElement) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') { color = hex(bg); break; }
        el = el.parentElement;
      }
      if (!color) continue;
      bgArea[color] = (bgArea[color] || 0) + step * step;
    }
  }

  const bodyCs = getComputedStyle(document.body);
  const rootCs = getComputedStyle(document.documentElement);
  const bodyBg = bodyCs.backgroundColor !== 'rgba(0, 0, 0, 0)' && bodyCs.backgroundColor !== 'transparent'
    ? hex(bodyCs.backgroundColor)
    : hex(rootCs.backgroundColor);
  const rootTransparent = rootCs.backgroundColor === 'rgba(0, 0, 0, 0)' || rootCs.backgroundColor === 'transparent';
  const bodyTransparent = bodyCs.backgroundColor === 'rgba(0, 0, 0, 0)' || bodyCs.backgroundColor === 'transparent';
  const bodyBgFinal = bodyTransparent && rootTransparent ? (fullBg || '#ffffff') : bodyBg;

  texts.sort((a, b) => b._a - a._a);
  const dominantBgs = Object.entries(bgArea).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([color, area]) => ({ color, area }));
  return {
    masks,
    fixedMax,
    banner,
    image_heavy: Math.round((covered / grid.length) * 1000) / 1000,
    texts: texts.slice(0, 60).map(({ _a, ...t }) => t),
    bodyBg: bodyBgFinal,
    bigCanvas,
    dominantBgs,
  };
};

async function dismiss(page) {
  const buttons = page.locator('button, [role="button"], a, input[type="button"], input[type="submit"]');
  const n = Math.min(await buttons.count().catch(() => 0), 160);
  for (let i = 0; i < n; i++) {
    const button = buttons.nth(i);
    const text = ((await button.innerText({ timeout: 250 }).catch(() => '')) || '').replace(/\s+/g, ' ').trim();
    if (!text || text.length > 32) continue;
    if (!/\b(accept|agree|ok|got it)\b/i.test(text)) continue;
    if (!(await button.isVisible().catch(() => false))) continue;
    await button.click({ timeout: 800 }).catch(() => {});
    await page.waitForTimeout(400);
    return;
  }
}

async function snap(page) {
  const measured = await page.evaluate(inPage);
  const png = await page.screenshot({ type: 'png', fullPage: false });
  const { data } = await sharp(png).resize(144, 90).greyscale().raw().toBuffer({ resolveWithObject: true });
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const sd = Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length);
  const title = await page.title().catch(() => '');
  return { measured, png, sd, title };
}

function badReason(r) {
  const texts = r.measured.texts.map((t) => t.text);
  const joined = texts.join(' ');
  if (/password|access denied|forbidden|\b404\b/i.test(r.title) || (/password|access denied|forbidden|not found/i.test(joined) && texts.length < 12)) return 'password or blocked page';
  if (texts.length <= 3) return 'few texts (loader?)';
  if (texts.some((t) => /^\d{1,3}\s?%?$/.test(t.trim()))) return 'counter on screen';
  if (/loading|preloader/i.test(joined) && texts.length < 12) return 'loading text';
  if (r.sd < 6) return 'near-uniform';
  return '';
}

// Long settle: poll each second, up to 15 s, until text count and variance are stable for 2 s.
async function settle(page) {
  let last = null, stable = 0, r = null;
  for (let i = 0; i < 15 && stable < 2; i++) {
    await page.waitForTimeout(1000);
    r = await snap(page);
    const key = `${r.measured.texts.length}:${Math.round(r.sd)}`;
    stable = key === last ? stable + 1 : 0;
    last = key;
  }
  return r;
}

async function shoot(browser, site) {
  const dir = path.join(OUT, site.slug);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    colorScheme: 'light',
    locale: 'en-GB',
    userAgent: UA,
  });
  const page = await context.newPage();
  try {
    try { await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 45000 }); }
    catch (e) { await page.waitForTimeout(1500); await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 45000 }); }
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2500);
    await dismiss(page);
    await page.waitForTimeout(300);
    let r = await snap(page);
    let why = badReason(r);
    if (why && !/password|blocked/.test(why)) { r = (await settle(page)) || r; why = badReason(r); }
    const { measured, png } = r;
    fs.mkdirSync(dir, { recursive: true });
    const sd = r.sd;
    const flags = [];
    if (sd < 6) flags.push('FLAG near-uniform');
    if (measured.fixedMax > 0.3) flags.push(`FLAG fixed overlay ${Math.round(measured.fixedMax * 100)}%`);
    const out = png.length > 5e6 ? await sharp(png).png({ compressionLevel: 9 }).toBuffer() : png;
    fs.writeFileSync(path.join(dir, 'original.png'), out);
    fs.writeFileSync(path.join(dir, 'masks.json'), JSON.stringify(measured.masks));
    fs.writeFileSync(path.join(dir, 'measure.json'), JSON.stringify({
      texts: measured.texts,
      bodyBg: measured.bodyBg,
      dominantBgs: measured.dominantBgs,
    }));
    const joined = measured.texts.map((t) => t.text).join(' ').toLowerCase();
    const notes = [];
    if (why) notes.push('FLAG ' + why);
    if (/access denied|403 forbidden|just a moment|enable javascript/.test(joined) && measured.texts.length < 8) notes.push('blocked or interstitial');
    if (/\b(is loading|please wait|experience is loading)\b/.test(joined) || /\b0%/.test(joined)) notes.push('loader still on screen');
    if (measured.texts.length < 2) notes.push('little visible text');
    notes.push(...flags);
    const meta = {
      slug: site.slug,
      url: site.url,
      source: site.source,
      awwwards_url: site.awwwards_url || null,
      onepagelove_url: site.onepagelove_url || null,
      award: site.award,
      award_date: site.award_date,
      jury: site.jury || null,
      split: null,
      captured_at: new Date().toISOString(),
      viewport: [1440, 900],
      banner: measured.banner,
      image_heavy: measured.image_heavy,
      big_canvas: measured.bigCanvas,
      notes: [site.note, ...notes].filter(Boolean).join('; '),
    };
    fs.writeFileSync(path.join(dir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
    console.log('ok', site.slug, measured.image_heavy, notes.join(', ') || 'clean', measured.texts.length);
    return true;
  } catch (err) {
    console.log('fail', site.slug, String(err.message).split('\n')[0].slice(0, 160));
    return false;
  } finally {
    await context.close();
  }
}

const todo = process.env.FORCE ? list : list.filter((site) => !fs.existsSync(path.join(OUT, site.slug, 'original.png')));
console.log('to capture', todo.length);
const browser = await chromium.launch({ headless: true });
let cursor = 0;
let ok = 0;
let fail = 0;
await Promise.all(Array.from({ length: Math.min(CONC, todo.length) }, async () => {
  while (cursor < todo.length) {
    const site = todo[cursor++];
    const done = await shoot(browser, site);
    if (done) ok += 1;
    else fail += 1;
  }
}));
await browser.close();
console.log({ ok, fail });
