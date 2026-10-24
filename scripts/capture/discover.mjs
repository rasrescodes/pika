// Discovers SOTD slugs from awwwards listing pages, then fetches public jury scores.
// One request at a time, >=1.5s apart. Output cache: candidates.json
import fs from 'node:fs';
const UA = 'Mozilla/5.0 (Macintosh) pika-dataset';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const get = async u => { await sleep(1600); const r = await fetch(u, { headers: { 'user-agent': UA } }); if (!r.ok) throw new Error(r.status); return r.text(); };
const FROM = +process.argv[2] || 1, TO = +process.argv[3] || 12;
const cache = 'candidates.json';
let c = fs.existsSync(cache) ? JSON.parse(fs.readFileSync(cache)) : {};
const slugs = [];
for (let p = FROM; p <= TO; p++) {
  try {
    const h = await get(`https://www.awwwards.com/websites/sites_of_the_day/?page=${p}`);
    for (const m of h.matchAll(/href="\/sites\/([a-z0-9-]+)"/g)) if (!slugs.includes(m[1])) slugs.push(m[1]);
  } catch (e) { console.log('list fail', p, e.message); }
}
console.log('slugs', slugs.length);
let n = 0, bad = 0;
for (const s of slugs) {
  if (c[s]) continue;
  try {
    const h = (await get(`https://www.awwwards.com/sites/${s}`)).replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, '');
    const head = h.match(/<h2 class="text-default">([^<]*?) - ([A-Z][a-z]{2} \d+, \d{4})<\/h2>/);
    const url = h.match(/<h1[^>]*>\s*<a href="([^"]+)"/);
    const ov = h.match(/c-heading-score__note">[^0-9]*([\d.]+)</);
    const notes = [...h.matchAll(/layout-overall__score"><strong>([\d.]+) \/ 10/g)].map(m => +m[1]);
    if (!head || !url || !ov || notes.length < 4) { bad++; c[s] = { slug: s, bad: true }; continue; }
    c[s] = { slug: s, url: url[1], awwwards_url: `https://www.awwwards.com/sites/${s}`, award: head[1], award_date: new Date(head[2] + ' UTC').toISOString().slice(0, 10), jury: { design: notes[0], usability: notes[1], creativity: notes[2], content: notes[3], overall: +ov[1] } };
    n++;
  } catch (e) { bad++; }
  fs.writeFileSync(cache, JSON.stringify(c));
}
fs.writeFileSync(cache, JSON.stringify(c));
console.log('fetched', n, 'bad', bad, 'total good', Object.values(c).filter(x => !x.bad).length);
