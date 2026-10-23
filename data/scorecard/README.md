# Scorecard data

Fill these by hand. Never invent numbers: the scorecard only shows what is recorded here.

## sites.json (at least 8)
```json
[
  {
    "id": "site-1",
    "name": "Site name as on Awwwards",
    "awwwardsUrl": "https://www.awwwards.com/sites/<slug>",
    "jury": { "design": 7.8, "usability": 7.4, "creativity": 7.9, "content": 7.5 },
    "screenshot": "data/scorecard/shots/site-1.jpg",
    "takenBy": "Rassa",
    "takenAt": "2026-10-24"
  }
]
```
- Jury scores are public on each site's Awwwards page. Screenshots: our own, of the site's hero, 1280x720 if possible. Don't save site code.

## trymodels.json (only if our app cannot call the adapter)
In the Mubit console, open Try models, run the Juror on each site's screenshot, and record the small model's reply:
```json
[{ "site": "site-1", "scores": { "design": 7, "usability": 8, "creativity": 7, "content": 7 }, "note": "...", "adapterVersion": "v2", "recordedBy": "Luka", "recordedAt": "2026-10-24T14:00:00Z" }]
```

## ../pricing.json
From the provider's public pricing page, per model id we call:
```json
{ "<model id>": { "inPer1M": 0, "outPer1M": 0, "source": "https://...", "checkedAt": "2026-10-24" } }
```

## ../proof/ (the correction proof)
`frozen-eval.json` holds the 6 frozen evaluation messages (no taste notes); `correction-proof.json` records both adapter versions' replies on them. `npm run check:demo-ready` checks everything and stamps the page.

## Making the correction proof (Saturday)
1. Pick the correction you will demo (for example "braver type": oversized and editorial layouts up; minimal and centred down).
2. `npx tsx scripts/frozen-eval.ts <3 up images> -- <3 down images>` writes `data/proof/frozen-eval.json` and prints its hash.
3. In Mubit's Try models, run the 6 inputs on the current adapter version (BEFORE). Record replies.
4. Make the correction in Pika, generate batches so Mubit records calls carrying it, and wait for the next adapter version.
5. Run the same 6 inputs on the new version (AFTER). Record replies.
6. Write `data/proof/correction-proof.json` (shape checked by `npm run check:demo-ready`), then run the check. "Model update" may be said on stage only if it passes.
