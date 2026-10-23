# Truth pack - pika

Type: web-app | Created: 2026-10-23 | Approver: Rassa (pre-approved "full send" while AFK, 23 Oct ~20:00)
Tier: Client-ready, hackathon profile (judges and the Mubit team will see it and rely on the demo; nothing touches real accounts, money or personal data)
Sources: docs/BRIEF.md (event page fetched 23 Oct + docs.mubit.ai/llms-full.txt), docs/PLAN.md, AGENTS.md, brand/README.md, this session's chat with Rassa.

## Universal
- T1 Who: Night Shift judges (Mubit team incl. co-founders; judging names TBA on the event page), in a noisy expo hall on Sun 25 Oct 10:30, then a 3-minute stage demo at 12:30 for finalists. Also teammates Luka and Kimberley who build and present with Rassa. Secondary persona in the story: a studio art director.
- T2 First contact: the demo laptop at the expo table (Rassa's MacBook, Chrome, 1440-wide screen), driven by a team member while a judge watches and is invited to drag a card. No phone use. Then the stage projector.
- T3 It worked: from the brief, judged equally on "Use of Mubit: show a correction turning into a model update in the demo", "Usefulness: a real recurring task someone would want handled", "Technical execution: it works and holds up under questions", "Demo: clear, live, and within the time limit" (event page). Observable: a judge drags a design up, and the next batch is ranked the way they ranked it; the scorecard shows Juror vs real Awwwards scores, big vs small, cost and speed.
- T4 Real material: the event brief and Mubit docs (in docs/BRIEF.md); Awwwards public jury scores for held-out sites (to be collected by hand, screenshots our own); brand kits: Pika's own (Kimberley, provisional until locked) plus the Mubit preset (colours from mubit.ai via oneshot-brand, unconfirmed). No client data exists.
- T5 Their words and process: use "the Juror", "the Wall", "scorecard", "correction", "model update", "brand kit", "art director", "design, usability, creativity, content" (Awwwards criteria). Use Mubit's terms: "task", "adapter", "Try models". Avoid: "fine-tuned on Awwwards sites" (not what Mubit does), "AI website builder" (crowded, not our pitch).
- T6 Look and sound: Pika must look Awwwards-worthy (Rassa: "UI must be Awwwards-level"; brand/README). Brand source: Kimberley's brand/ when locked; until then design-beast placeholder tokens clearly marked provisional. Liked: award-level editorial/studio sites (design-beast library). Disliked: generic AI-SaaS look, Tailwind defaults, "impeccable house style" (Rassa's standing rules).
- T7 Never show or do: never call providers directly (Mubit only); never show keys; no scraped or copied Awwwards site code or assets; no claim that the small model was trained live on stage unless it was; label MOCK mode when no key; no emojis or em dashes in UI copy; UK English.
- T8 Already promised or sent:
  - https://github.com/rasrescodes/pika (private repo; invites sent to lukataylo and kimberleys-ai)
  - docs/PLAN.md demo draft (shared with Luka for review)
- T9 Moment of truth: the art director drag. A judge moves card #7 to #1 with a reason; the next batch's ranking visibly follows that taste.
- T10 Out of scope: invoice generation (dropped), full multi-page website generation, file-upload brand kits, hosting/accounts/payments, live retraining on stage.
- T11 Approver and how they'll view it: Rassa (and team) on the demo laptop; Luka reviews the repo first.
- T12 Last time: eMed hackathon (Jul 2026, with Luka): simulation-first sensing was judge-approved when disclosed; the live loop must never be cut; rehearse; keep a recorded fallback. Recall lessons: no demo data confusion, brand everywhere, journeys on the real thing.

## Type pack: web-app
- W1 Accounts: no login. Opens straight to the Wall with a preset brand loaded (empty state never shown to a judge).
  - answer: no accounts; first screen = the Wall with brand kit "Pika" preselected and a "Generate batch" action.
- W2 Entry URLs: `/` = the Wall; `/scorecard` = scorecard; `/brand` = brand-kit form. Unknown routes go to `/`.
  - answer: as listed.
- W3 Data in and out: brand kit + batch request in; generated sections, Juror scores and overrides out; overrides stored in a local JSON taste file and shown in a "taste memory" panel instantly.
  - answer: as listed; runs locally.
- W4 Roles: single user (the art director). No roles.
  - answer: none.
- W5 Hosting: localhost on the demo laptop; optional deploy later (no secrets in the client bundle).
  - answer: localhost:3000.

## Glossary
- Juror: the critic model call (fixed system prompt, image in, short JSON out). This is the Mubit task.
- Generator: the call that writes one hero section as self-contained HTML.
- The Wall: the grid of generated sections ranked by the Juror.
- Correction / override: the art director moving a card or changing a score, with an optional reason.
- Taste memory: the stored overrides, fed to the Juror as examples in the user message.
- Scorecard: Juror vs real Awwwards scores on held-out sites, plus cost and latency.

## Locked decisions from the day-1 preview
- (none yet; Rassa AFK, decisions logged in DECISIONS.md)
