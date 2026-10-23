# 10x simpler (run 2026-10-23, Rassa AFK "full send": version picked by Claude)

The job: an art director watches Pika rank a batch of website designs the way they would, corrects it once, and the next batch comes out in their taste, at small-model cost.

| | Current plan | 10x version |
|---|---|---|
| Brand-kit upload | file upload of logo, colours, fonts, references | 3 preset brand kits + a short form (name, 3 colours, font, one-line tone). No file upload in v1 |
| Generator | N on-brand sections | kept (the wonder), hero sections only, 12 per batch, short self-contained HTML with inline CSS/SVG |
| Rendering | not specified | sandboxed iframes (`srcdoc`), no external requests |
| Juror | scores like Awwwards | kept as THE Mubit task: one fixed system prompt, image of the section in, short JSON out (4 scores + one line) |
| Screenshots | not specified | rendered in the browser with an OSS DOM-to-image lib, sent as image input; held-out real sites = screenshots we take by hand |
| Corrections | via Mubit (mechanism unknown) | our own taste memory: past overrides go into the Juror's USER message as examples (system prompt stays fixed), so the next call changes instantly; every call is also recorded by Mubit for adapter training; plug in Mubit's own correction mechanism once known |
| Scorecard | live comparison | a script computes results on the held-out set into JSON; the page renders it |
| Big vs small | live switch | live only if apps can call adapters; otherwise Mubit console Try models side by side, shown honestly |
| Cost and latency | counters | computed from each response's token usage and timing |
| Hosting | not specified | runs on the demo laptop (localhost); deploy is optional later |
| Mock mode | none | fixture Juror/generator when MUBIT_API_KEY is unset, clearly labelled MOCK on screen |

You give up: file-upload brand kits, live retraining on stage, hosted URL in v1.
Unproven: Mubit forwards image input and groups image calls into a task -> 10-min test: one image call through Mubit once a key is in .env (fallback: Juror reads a compact text description of the section).
Pick: the 10x version above (one Next.js app, two Mubit calls, one taste-memory file). Alt: Juror-only, no generator (ranks hand-collected screenshots). Left-field: skip the app, run the Juror from a script over a folder and present results in slides.
