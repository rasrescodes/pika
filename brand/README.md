# Brand: start here, Kimberley

Welcome to Pika. This folder is yours. You own how Pika looks and feels: its brand and the design of its three screens. Rassa and Luka build the app and wire in the AI; your files here are what they build from.

## What Pika is (30 seconds)
Pika is an AI art director that learns your taste.
1. You give it a brand (logo, colours, fonts, a few reference sites).
2. It generates lots of versions of a website section, for example 20 hero sections.
3. **The Juror**, an AI critic, scores each version like an Awwwards judge (design, usability, creativity, content) and ranks them.
4. When the art director disagrees ("no, this one's better"), the Juror learns their taste.

The judges are design-literate, and Pika is a design tool, so **Pika itself has to look Awwwards-worthy.** That's your job.

Full context: `../docs/BRIEF.md` (the event) and `../docs/PLAN.md` (the plan).

## What we need from you, in this order

**1. Pika's own brand (tonight or first thing Saturday)**
- `logo/`: the Pika logo as **SVG** (plus a PNG for slides). A wordmark is fine.
- `colour/`: the palette with exact hex values in `colour/tokens.md` (background, text, accent, plus a dark version if you want one).
- `type/`: font choices (Google Fonts or free-licence fonts, so we can use them on the web) and sizes in `type/tokens.md`.
- `motion/`: how things should move (speed, easing, what animates) in `motion/notes.md`. Short notes are fine.
- `references/`: screenshots of sites or work that capture the feel you're going for, each with one line on why.

**2. The three screens (Saturday morning)**, as images or Figma links in `comps/`:
1. **Brand-kit upload:** where someone drops in their logo, colours and references.
2. **The Wall:** a grid of 20 generated designs, ranked by the Juror. The art director drags one up or down to correct it. This is the hero of the demo, so make it feel alive.
3. **Scorecard:** the Juror's scores against real Awwwards jury scores, big model vs small model, and cost and speed side by side. Think "beautiful results page".

**3. Demo and pitch assets (Saturday afternoon)**, in `exports/`: a title slide, a closing slide, and the logo in a few sizes.

## How to hand things over
- Put files in the matching folder. Name them clearly with a version: `logo/pika-wordmark-v1.svg`, `comps/wall-v2.png`.
- For Figma, put the link in `comps/LINKS.md` with one line per screen, and make sure it's viewable by link.
- When something is ready, tell Rassa and Luka in the chat, or add a line to `../DECISIONS.md` ("Kimberley: palette v1 locked").
- Lock decisions early. Once a colour or font is locked, the builders hard-code it, and changes after Saturday lunch cost build time.

## Getting the files onto GitHub (if you haven't used git much)
1. Accept the GitHub invite to `rasrescodes/pika` (check your email or github.com/notifications).
2. Easiest way: open the repo on github.com, go into the `brand/` folder, click **Add file**, then **Upload files**, and commit straight to `main`.
3. Or with an AI assistant: tell it "clone rasrescodes/pika, add my files to brand/, commit and push".

## Rules
- Free-licence fonts and images only. Nothing copied from other people's sites (references are for inspiration and stay in `references/`).
- UK English, no emojis, no em dashes in any copy.
- Ask anything early. A rough direction tonight beats a perfect one on Sunday.
