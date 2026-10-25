# Pika UI

A public API and one-page site: paste a web page (or one section), get Impeccable's design findings for free, or a whole-page redesign made with Pika's skills prompt (`prompts/improver-skills-v2.md`) through Mubit.

- `POST /v1/check` `{html}`: Impeccable detector only. No model, about 0.5 s.
- `POST /v1/improve` `{html, notes?, record?}`: detector, Claude Sonnet 5.5 through Mubit's Anthropic route, detector again. About 20 s and $0.03 for a section; 84 s and $0.13 for the 7.5k-character Nimbus landing page sample (43 findings to 0, measured 25 Oct). Streams from Mubit with max_tokens 32,000.
- `GET /v1/status`: model, prompt version, redesigns left today.

## Run locally
`npm install && npm run dev` (reads `../.env`: `MUBIT_API_KEY`, optional `MODEL`). Without a key, only `/v1/check` works.

## Cost controls (env, defaults)
`MAX_IMPROVES_PER_DAY=100` (hard daily ceiling; about $3 to $15 a day at most, depending on page length), `MAX_IMPROVES_PER_IP_HOUR=5`, `MAX_CHECKS_PER_IP_HOUR=120`, `MAX_IMPROVES_IN_FLIGHT=3` (Mubit allows 4 calls in flight per project), `MAX_HTML_CHARS=150000`. Counters live in memory, so a restart resets them.

## Deploy (Railway)
One service from this folder, Railpack builder, sleeps when idle (`railway.json`). No database. Set `MUBIT_API_KEY` (and optionally `MODEL`) as service variables. The prompt is a copy of `../prompts/improver-skills-v2.md`: run `npm run sync` after changing it.

## Honest limits
- The evidence on the page (3.67 to 0.21 findings per page) is from generated sections in the holdout exam, not from redesigns of existing pages.
- Redesigns are recorded by Mubit unless `record: false`; the page says so next to the checkbox and in the API section.
