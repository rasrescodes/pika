# Prompts v2: what changed from v1 and why

Files: `describer.v2.md` (image mode), `describer-dom.v2.md` (DOM mode), `builder.v2.md`, `playbooks/<layout_style>.md` (9), `examples/` (reference only, never sent). Critic and lessons prompts are unchanged. Not wired in yet: `src/agents.ts` still loads the v1 files, and the loop doesn't send playbooks yet (it should add a `PLAYBOOK:` block to the Describer's user message).

## Describer (both modes)
- New spec format, five sections (CANVAS, FONTS, SHAPES, MEDIA, TEXT), one item per line with a fixed grammar, replacing eight prose-like sections. Why: the Builder can follow it literally, and copy now sits next to its position and style instead of in a separate COPY list.
- Every text item carries its own x,y (top of the line box) and lines are joined with " | ". Why: line breaks and positions were left to the Builder's flow layout, which rewrapped and drifted.
- New `fit <width>` on display lines: the Builder scales the line to the measured ink width. Why: a substitute Google Font is never the same width as the original; fit fixed that and was worth about 3 points on aardvark-book-club.
- Size comes from cap height divided by the chosen font's cap ratio, with measured ratios for every recommended font (Anton 0.86 to Cormorant 0.63). Why: "name a close Google Font" gave no way to turn what is seen into a size, and cap ratios differ by up to 35%.
- A fixed list of Google Fonts by class, each with its cap ratio. Why: consistent picks the Builder can load, and sizes that land.
- Line box rule: caps sit in the middle of the line box (checked on 23 fonts, within 0.05em for all but Newsreader). Why: gives an exact y from cap top and baseline.
- Explicit scoring priorities (background and large colour fields, then large shapes and display type, then the rest). Why: the score is 30% colour histogram and 30% edges at one third scale, so big fields and big edges matter most; a missing band cost 12 points on kern-society.
- SHAPES gained ellipse, poly (clip-path points), borders, radii and "over". Why: v1 could only describe blocks in prose; organic bands, pills and cookie banners carry much of the colour and edge score.
- Overlays (cookie banners, modals, loaders) are drawn, not ignored. Why: they are in the screenshot, and several captured heroes have one.
- Media boxes at exact bounds in their average colour. Why: media is masked grey on both sides, so only the box's edges outside the mask count.
- The user message labels are named (HOUSE LESSONS, PLAYBOOK, PREVIOUS SPEC, FIXES) and revisions rewrite the whole spec. Why: room for playbooks without changing the system prompt again.
- Still under 400 words, enforced by merging same-style items into one line and dropping the least valuable first. Hand-written examples came to 244 and 126 words.

## DOM Describer only
- Reading rules for quirks found in 100 captured measure.json files: letters split for animation are rebuilt into words; hover duplicates are drawn once; padded boxes are moved to y + (h - n x line height) / 2; rgba and color(srgb) are mixed into hex; weights round to 100. Why: each of these put text in the wrong place or twice.
- Shapes inferred from colours: labels in the page colour sit on filled buttons; a listed background that buttons don't explain is a band, usually in an empty stretch. Why: measure.json has no shape boxes, and the bottom band on kern-society alone was worth 12 points.
- Keep a measured Google Font as is; when substituting, prefer cap ratios 0.66 to 0.76 so the size stays within dom-diff's 10% tolerance; raise the weight by 300 when fit will squeeze a condensed cut. Why: the weight bump was worth 4.5 points on kern-society.

## Builder
- `builder.v2.md` replaces v1. Every item is an absolutely positioned div at its exact px; no flow, flex or grid. Why: v1 let the Builder lay out freely, which added drift and design.
- Fonts load through one css2 link with `display=block`. Why: fallback fonts must never be captured.
- Fixed fit script, pasted verbatim: after fonts load it applies scaleX so each `data-fit` element is exactly its stated width. Why: letter spacing could not close big width gaps (the letters overlapped on kern-society); scaleX keeps the cap height and matches the width. It is the only JavaScript, and it adds no design.
- Literal grammar: " | " becomes a <br>, centre/right/wrap become widths, poly becomes clip-path. Why: a dumb, predictable Builder means a better score comes from a better spec.

## Playbooks
- One per layout_style, under 120 words: what matters most and the usual mistakes. Why: layout-specific advice without per-site content in the fixed system prompt.
