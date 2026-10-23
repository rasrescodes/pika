# Pre-mortem - pika

"It failed in front of the Night Shift judges because..."

| ID | Failure | Check that prevents it | Runs in | Covered |
|---|---|---|---|---|
| PM-1 | A link already sent (T8) now 404s, redirects somewhere else, or shows a login | the repo link is GitHub (not ours to break); app entry URLs checked | JR-1, JR-3 | no |
| PM-2 | A password or basic-auth wall hits someone who was never told the password | no auth in the app; JR runs logged-out | JR-1 | no |
| PM-3 | Placeholder, demo, lorem, "test", "Acme" or fake data is visible | `oneshot-scan` on the built UI; MOCK mode is labelled honestly, not hidden | scan | no |
| PM-4 | Private data visible | no personal data used anywhere; scan | scan | no |
| PM-5 | Wrong terms ("fine-tuned on Awwwards", "website builder") | scan --forbid + persona judge vs T5 | scan, judge:persona | no |
| PM-6 | Pika's own UI looks generic or AI-made | design-beast direction + brand judge on screenshots | judge:brand | no |
| PM-7 | The override does nothing visible | JR-2 drags a card and asserts taste memory updates and the next batch ranking reflects it | JR-2 | no |
| PM-8 | Broken on the demo laptop screen or projector | JR at 1440x900 desktop | journeys | no |
| PM-9 | First screen is empty or confusing | JR-1 from a fresh context lands on a ready Wall | JR-1 | no |
| PM-10 | Generation is slow with no feedback | progress UI; JR-1 timing | JR-1 | no |
| PM-11 | Promised parts missing (Wall, override, scorecard) | devil judge vs PLAN | judge:devil | no |
| PM-12 | No Mubit key at demo time | MOCK fallback + HUMAN-NEEDED item; mode chip | JR-1 | no |
| PM-13 | Judges think it is a website builder | pitch copy on the Wall names the Juror and taste; persona judge | judge:persona | no |
| PM-14 | Typos, em dashes, emojis in UI | scan | scan | no |
| PM-15 | "Done" declared without opening the real thing | journeys with recordings | journeys | no |
| PM-16 | Root URL goes to the wrong page | JR-1 asserts `/` shows the Wall | JR-1 | no |
| PM-17 | Generated HTML runs scripts or breaks the page | sandboxed iframes, scripts stripped | JR-1, judge:frontend | no |
| PM-18 | Juror system prompt drifts, splitting Mubit tasks | constant prompt + unit test | manual | no |
| PM-19 | Juror returns invalid JSON and the Wall crashes | schema validation with fallback and an error card | JR-1 | no |
| PM-20 | Console errors or failing API call behind a spinner | journeys fail on console/network errors | journeys | no |
| PM-21 | Scorecard numbers are made up | scorecard reads a data file with sources; labelled "sample" until real runs exist | JR-3, judge:data | no |
| PM-22 | Fresh clone fails for Luka | README commands verified from a clean clone | manual | no |
