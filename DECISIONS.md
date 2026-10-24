# DECISIONS

One line per decision: date and time, decision, why. Newest at the bottom.

- 2026-10-23 19:45: Idea is Pika (generator + Awwwards-style Juror that learns the art director's taste). Why: the team's pick; the narrow critique task fits Mubit far better than "generate whole websites", which is too long for adapter training and the most crowded idea in the room.
- 2026-10-23 19:45: Main track is "Own your intelligence layer" (cheap small critic judges 100 designs instead of 5). Why: the cost and speed story is visible and measurable.
- 2026-10-23 19:45: Scorecard = Juror vs real Awwwards jury scores on held-out sites, big vs small model. Why: the simulated judging panel's main doubt was "is it really learning taste?"; a hard scorecard answers it.
- 2026-10-23 19:45: Invoice generation dropped. Why: a different product; dilutes the demo.
- 2026-10-23 19:45: No SPEC.md yet; Luka reads the brief and plan first.
- 2026-10-23: Kimberley joins as design lead and owns brand/. Why: Pika is judged by design-literate people, so its own UI must look award-level.
- 2026-10-23 21:00 (Claude, Rassa AFK "full send"): build via /oneshot, tier Client-ready (hackathon). Internal spec at .oneshot/SPEC.md (not a team SPEC.md).
- 2026-10-23 21:00: provisional design direction "the design critic's magazine" (Vercel x Pitchfork remix) in DESIGN.md until Kimberley locks hers; tokens generated from brand/ by `npm run tokens`.
- 2026-10-23 21:00: 12 cards per batch (not 20): fits one screen, halves cost.
- 2026-10-23 21:00: Juror judges a screenshot (image input), rendered server-side with JavaScript off and all network blocked; text fallback if Mubit rejects images (decide by Sat 10:00).
- 2026-10-23 21:00: presets are Pika and Mubit (from mubit.ai, unconfirmed). Generating for the judges' own brand is part of the demo.
- 2026-10-23 21:00: corrections reach the model two ways: instantly via taste memory in the Juror's user message; and via Mubit's adapter trained on those taste-conditioned calls (plus Mubit's own correction route if one exists).
- 2026-10-23 21:00: if the generator pipeline is not green by Sat 14:00, the Wall runs on prepared sections; Juror and corrections unchanged.
- 2026-10-24 03:00 (Claude, Rassa: "he'll do his, I want to do mine"): main is Rassa's version. Luka's loop stays on his branches; integrate/loop (loop engine + interface) is pushed as an option, not merged. The capture dataset (PR #3) and Luka's labels/features were brought into main as shared team data.
- 2026-10-24 03:00: Rassa's version gains an answer key: Jury mode scores the Juror against the real Awwwards jury on 212 captured Sites of the Day. Because all are winners (overall 7.15 to 8.18), it is measured on three tasks against free baselines (MAE 0.109, strongest criterion 47%, pairs 50%), never on raw score alone.
- 2026-10-24 03:00: no more scraping tonight: Awwwards nominees show no jury scores and the Honorable Mentions listing has no sites in its HTML; a guessing crawl at night was not worth the load on their site.
