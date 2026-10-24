// Contact sheets: 20 thumbnails per image, slug under each. Usage: node sheets.mjs <outdir> [onlyFlagged]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const root = path.resolve('../../data/sites');
const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const slugs = fs.readdirSync(root).filter(s => fs.existsSync(path.join(root, s, 'meta.json'))).sort();
const W = 360, H = 225, L = 22, COLS = 5, ROWS = 4;
for (let p = 0; p * 20 < slugs.length; p++) {
  const chunk = slugs.slice(p * 20, p * 20 + 20);
  const comps = [];
  for (let i = 0; i < chunk.length; i++) {
    const m = JSON.parse(fs.readFileSync(path.join(root, chunk[i], 'meta.json')));
    const x = (i % COLS) * W, y = Math.floor(i / COLS) * (H + L);
    comps.push({ input: await sharp(path.join(root, chunk[i], 'original.png')).resize(W, H).toBuffer(), left: x, top: y });
    const overall = m.jury && m.jury.overall != null ? m.jury.overall : 'n/a';
    const label = `${chunk[i].slice(0, 28)} ${overall}${m.notes ? ' !' : ''}`;
    const svg = `<svg width="${W}" height="${L}"><rect width="100%" height="100%" fill="${m.notes ? '#a00' : '#222'}"/><text x="4" y="16" font-size="13" fill="#fff" font-family="Helvetica">${label.replace(/&/g, '')}</text></svg>`;
    comps.push({ input: Buffer.from(svg), left: x, top: y + H });
  }
  await sharp({ create: { width: W * COLS, height: (H + L) * ROWS, channels: 3, background: '#000' } }).composite(comps).jpeg({ quality: 70 }).toFile(path.join(out, `sheet-${p + 1}.jpg`));
}
console.log('sheets', Math.ceil(slugs.length / 20));
