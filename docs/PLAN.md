# Plan

## The product in one loop
1. **Brand kit in:** logo (SVG), colours, fonts, tone, a few reference sites.
2. **Generator:** makes N versions of one website section (start with the hero) as HTML/CSS/SVG, all text, through Mubit.
3. **Juror:** scores each version 1-10 on design, usability, creativity and content, plus one line on what's wrong. Fixed system prompt, short JSON output, through Mubit. This is the task Mubit trains.
4. **Wall:** the versions render live on a grid, ranked by the Juror.
5. **Override:** the art director drags a version up or down or edits a score. That correction is logged and sent to Mubit as the correction for that call.
6. **Next batch** is ranked the way the art director would rank it.

## The proof (what makes it survive questions)
- **Hard scorecard:** a held-out set of sites with real Awwwards jury scores (public on each site's page). Show the Juror's score against the real jury: big model vs Mubit small model.
- **Cost and speed:** cost per 100 critiques and seconds per critique, big vs small, side by side.
- Use our own screenshots plus the public scores. Don't scrape or copy whole sites.

## Order of work
**Tonight (by about 23:00): prove the risky part first**
1. `scripts/mubit-smoke.mjs` returns a real reply through Mubit (both of us).
2. Juror prompt v1: one fixed system prompt, JSON out, tried on 5 sites.
3. Send 30+ Juror calls through Mubit so a task forms and training can start overnight.
4. Find out how corrections work (kickoff notes / ask the Mubit team).

**Saturday**
5. Generator for the hero section from a brand kit.
6. The Wall UI with drag-to-rank overrides wired to corrections.
7. Scorecard page: Juror vs real Awwwards scores, big vs small, cost and speed.
8. 18:00 feature freeze. Record a perfect demo run as backup.

**Sunday morning**
9. Rehearse the 3-minute demo twice. 10:00 code freeze.

## Split
- **Rassa:** generator + the Wall UI + demo.
- **Luka:** Juror prompt + Mubit wiring + corrections + scorecard data.
- **Kimberley:** design. Pika's brand and the three screens (brand-kit upload, the Wall, scorecard), then slide assets. Everything in `brand/`.
- Swap or merge as soon as either is blocked.

## Demo (3 minutes, draft)
1. 0:00 The pain: "Studios review dozens of options a day. Taste doesn't scale."
2. 0:20 Upload a judge's favourite brand; 20 hero sections appear and the Juror ranks them.
3. 1:00 The art director overrides: drags #7 to #1, "braver type".
4. 1:30 The next batch is ranked their way. That's the correction becoming a model update through Mubit.
5. 2:10 Scorecard: Juror vs real Awwwards scores, big vs small model, cost and speed side by side.
6. 2:45 Close: "Your taste, at the price of a small model."

## Open decisions
- Stack (default: Next.js + TypeScript, OpenAI SDK pointed at Mubit).
- Which big model is the teacher.
- How many versions per batch (20 looks great on the wall; keep cost in mind).
