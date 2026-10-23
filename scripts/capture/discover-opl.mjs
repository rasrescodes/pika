// Lists type-led sites from One Page Love style pages, then reads each site's
// public page for the live URL, publish date and style tags.
// One request at a time, 1.8s apart. Does not save page HTML.
// Usage: node discover-opl.mjs
import fs from 'node:fs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const GAP = 1800;
const OUT = 'opl.json';
const PAGES = [
  'https://onepagelove.com/style/typographic',
  'https://onepagelove.com/style/typographic/page/2',
  'https://onepagelove.com/style/typographic/page/3',
  'https://onepagelove.com/style/minimal',
  'https://onepagelove.com/style/editorial',
  'https://onepagelove.com/style/brutalism',
  'https://onepagelove.com/style/grid-layout',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  await sleep(GAP);
  const res = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'en-GB,en;q=0.9' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function listingSlugs(html) {
  const slugs = [];
  const re = /<h2><a href="https:\/\/onepagelove\.com\/([^"/]+)" title="([^"]+)">/g;
  for (const m of html.matchAll(re)) {
    if (!slugs.some((s) => s.slug === m[1])) slugs.push({ slug: m[1], title: m[2] });
  }
  return slugs;
}

function parseDetail(html, slug) {
  const main = html.split('id="content-archive"')[0];
  const title = main.match(/<h1>([^<]+)<\/h1>/)?.[1]?.trim() || slug;
  const awardDate = main.match(/<time datetime="(\d{4}-\d{2}-\d{2})"/)?.[1] || null;
  const visit = main.match(/href="(https?:\/\/[^"]+)"[^>]*title="Visit [^"]*Website"/)?.[1]
    || main.match(/title="Visit [^"]*Website"[^>]*href="(https?:\/\/[^"]+)"/)?.[1]
    || null;
  const blurb = main.match(/class="review-by-rob"[\s\S]*?<p>([\s\S]*?)<\/p>/)?.[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '';
  const styleHtml = main.match(/<span class="link-type">Style<\/span>\s*<span class="link-list">([\s\S]*?)<\/span><\/div>/)?.[1] || '';
  const styles = [...styleHtml.matchAll(/\/style\/[^"]+">([^<]+)/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  const url = visit ? visit.split('?')[0].replace(/\/$/, '') || visit.split('?')[0] : null;
  return { slug, title, url, awardDate, styles, blurb };
}

const seen = new Map();
for (const page of PAGES) {
  try {
    const html = await get(page);
    for (const s of listingSlugs(html)) if (!seen.has(s.slug)) seen.set(s.slug, s);
    console.log('list', page, seen.size);
  } catch (err) {
    console.log('list fail', page, err.message);
  }
}

const cache = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
let n = 0;
for (const s of seen.values()) {
  if (cache[s.slug]?.url) continue;
  try {
    const detail = parseDetail(await get(`https://onepagelove.com/${s.slug}`), s.slug);
    const skip3d = /\b3d\b|webgl|three\.js/i.test(detail.blurb) || detail.styles.some((st) => /^3d$/i.test(st));
    cache[s.slug] = { ...detail, onepagelove_url: `https://onepagelove.com/${s.slug}`, skip3d };
    n++;
    console.log(skip3d ? 'skip3d' : 'ok', s.slug, detail.url);
  } catch (err) {
    cache[s.slug] = { slug: s.slug, bad: true, error: err.message };
    console.log('detail fail', s.slug, err.message);
  }
  fs.writeFileSync(OUT, JSON.stringify(cache, null, 1));
}
const good = Object.values(cache).filter((x) => x.url && !x.skip3d && !x.bad);
console.log('fetched', n, 'usable', good.length);
