// Drops flagged captures, keeps up to 100, assigns splits, normalises meta.json, writes data/sites/index.json.
// Holdout: 20 Awwwards-scored sites spread evenly across the overall-score range. Everything else is train.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const root = path.resolve('../../data/sites');
const TARGET = +process.argv[2] || 100;
const idxFile = path.join(root, 'index.json');
const prevHold = new Set(fs.existsSync(idxFile) ? JSON.parse(fs.readFileSync(idxFile)).filter(e => e.split === 'holdout').map(e => e.slug) : []);
const order = JSON.parse(fs.readFileSync('all.json', 'utf8')).map(s => s.slug);
const metas = [];
for (const d of fs.readdirSync(root)) {
  const f = path.join(root, d, 'meta.json');
  if (fs.existsSync(f)) metas.push(JSON.parse(fs.readFileSync(f)));
}
const textCount = sl => JSON.parse(fs.readFileSync(path.join(root, sl, 'measure.json'))).texts.length;
const bad = m => /FLAG|blocked|loader|little visible/.test(m.notes || '') || textCount(m.slug) < 5 || (!m.jury && !m.onepagelove_url);
const good = metas.filter(m => !bad(m)).sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
const keep = [...good.filter(m => prevHold.has(m.slug)), ...good.filter(m => !prevHold.has(m.slug))].slice(0, Math.max(TARGET, prevHold.size)).sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
const keepSet = new Set(keep.map(m => m.slug));
const dropped = [];
for (const m of metas) if (!keepSet.has(m.slug)) { dropped.push(`${m.slug}: ${bad(m) ? m.notes || 'no scores' : 'surplus'}`); fs.rmSync(path.join(root, m.slug), { recursive: true }); }
const aw = keep.filter(m => m.jury).sort((a, b) => a.jury.overall - b.jury.overall);
const hold = prevHold.size ? prevHold : new Set(Array.from({ length: Math.min(20, aw.length) }, (_, i) => aw[Math.round(i * (aw.length - 1) / 19)].slug));
for (const m of keep) {
  await sharp(path.join(root, m.slug, 'original.png')).resize(720).jpeg({ quality: 80 }).toFile(path.join(root, m.slug, 'thumb.jpg'));
  const out = { slug: m.slug, url: m.url, awwwards_url: m.awwwards_url || null, ...(m.onepagelove_url ? { onepagelove_url: m.onepagelove_url } : {}), award: m.award, award_date: m.award_date, jury: m.jury || null, split: hold.has(m.slug) ? 'holdout' : 'train', captured_at: m.captured_at, viewport: [1440, 900], banner: !!m.banner, image_heavy: m.image_heavy, big_canvas: !!m.big_canvas, notes: (m.notes || '').replace(/;?\s*Featured on One Page Love[^;]*/g, '').trim() };
  fs.writeFileSync(path.join(root, m.slug, 'meta.json'), JSON.stringify(out, null, 2) + '\n');
  m.split = out.split;
}
fs.writeFileSync(path.join(root, 'index.json'), JSON.stringify(keep.map(m => ({ slug: m.slug, split: m.split, captured: true, overall: m.jury ? m.jury.overall : null, image_heavy: m.image_heavy, big_canvas: !!m.big_canvas })), null, 1) + '\n');
const stat = sp => { const v = keep.filter(m => m.split === sp && m.jury).map(m => m.jury.overall); return { n: keep.filter(m => m.split === sp).length, scored: v.length, mean: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2), min: Math.min(...v), max: Math.max(...v) }; };
console.log('good', good.length, 'kept', keep.length, 'dropped', dropped.length, 'train', stat('train'), 'holdout', stat('holdout'));
fs.writeFileSync('dropped.log', dropped.join('\n'));
