# DOVV reference study and Pika design translation v1

Status: proposal for team review, not an approved replacement for Pika's brand.
Reviewed: 24 October 2026.
Reference: https://dovvstudio.com/
Related proposal: [Website design plan](../../changes/2026-10-24-pika-website-design-plan-v1.md).
Authority: [Pika brand guidelines v1](../guidelines/pika-brand-guidelines-v1.md) and the current source-of-truth section of [DESIGN.md](../../DESIGN.md). Their colours, typography, assets and motion rules take precedence over this reference.

## Evidence and limits

Inspected the live homepage at a 1280 by 720 desktop viewport: hero, work gallery, testimonial controls, process, pricing, floating navigation and footer. Clicked the next-testimonial control and process/contact anchors. Observed a testimonial change from 01 to 02, subsequent automatic advances, anchor movement, and partially revealed text during transitions. Exact source font names, CSS values, animation durations, easing curves, hover behaviour and mobile breakpoints were not measured. Mobile behaviour below is a Pika recommendation, not an observation of DOVV. All numerical implementation settings below are Pika specifications or proposals, not extracted DOVV tokens.

This is a study of visual principles. Do not copy DOVV's logo, stickers, project imagery, testimonials, ratings, client logos or site code. Create original Pika compositions using supplied brand assets.

## Overall character

DOVV combines a restrained monochrome foundation with exaggerated display typography and colourful sticker-like accents. Spacious sections alternate between a light portfolio presentation and a dark process/pricing chapter. Large work previews do most of the persuasion. Dense controls are absent from the hero.

For Pika: preserve the confidence, scale contrast, work-first storytelling and occasional playful overlap. Keep the existing warm cream, blue and black identity and a calmer workspace. Do not import DOVV's condensed all-caps typography or rainbow palette.

## Section-by-section translation

| Section | Observed on DOVV | Proposed Pika treatment |
| --- | --- | --- |
| Header | Large mark at upper left, compact dark contact pill at right | Pika mascot/wordmark left; Discover and Studio links right, clear active state. Keep navigation consistent on both pages. |
| Hero | Centred, very large two-line condensed black headline; small availability pill; tilted stickers overlap the headline perimeter; supporting text and two CTAs below | Short Fredoka headline on cream, Inter subtext, blue primary CTA and quiet secondary. At most two supporting doodles plus one mascot; preserve text legibility. Do not add an availability badge without a real reason. |
| Trust strip | Muted client-logo row between fine rules; edge-faded presentation | Prefer a factual product summary or genuine customer proof. Research brands are not customers. Do not make a decorative trust strip from dataset logos. |
| Work gallery | Two large columns; rounded black frames; substantial preview imagery; captions and small service tags beneath; generous gaps | Large real Pika output previews, white or navy framing, 16px card radius. Caption the brand, direction and output status. Put actual outputs before research references. |
| Proof | Oversized testimonial text beside compact numerical proof, author detail and previous/next controls | Show one actual comparison or documented feedback example. No invented endorsements. A static comparison is preferable to an unattended carousel for comprehension. |
| Chapter transition | Light section meets black section along a shallow curved edge | Optional single cream-to-navy transition before the method section. Keep it decorative and outside content flow; avoid repeated waves. |
| About | Large editorial statement on dark ground, with smaller supporting facts | Brief explanation of brand-guided generation; use white text on navy and keep paragraph measure readable. |
| Process | Four staggered, slightly rotated coloured cards connected by a white curved line; numbered steps and playful accents | Three or four numbered stages using white, sky and mist cards. Use blue/black text where contrast permits. Doodle connector is decorative. Keep rotations slight on desktop and remove on mobile. |
| Pricing | Three parallel cards; middle light card is prominent against dark surroundings | Do not invent pricing. Reuse the comparative structure only when useful for three capabilities or clearly defined release stages. |
| Floating navigation | Bottom-centred dark pill remains visible in lower sections; current section receives a filled highlight | Prefer ordinary top navigation for the two-page product. Optional section links on Discover only; never obscure the Studio preview or mobile controls. |
| Footer | Huge display invitation with overlapping stickers; ruled information columns below | Short closing invitation in Fredoka, a blue Studio CTA, small mascot and compact links to research and product information. |

## Pika visual specification

### Colour and typography: existing brand, unchanged

- Background: Warm Cream `#FBF5EA`; alternate `#FFF9F1`.
- Text: Pika Black `#0A0A0A`; primary action: Pika Blue `#3027F4`; hover/dark chapter: Deep Navy `#28339E`.
- Supporting colours: Sky Blue `#96D2F2`, Mist Blue `#E8F5FC`, White `#FFFFFF`.
- Fredoka display: 72px desktop / 48px mobile, weight 650–700, line height 0.95. H1: 56/40px; H2: 40/32px; H3: 28/24px. Use the brand's hierarchy rather than DOVV's oversized condensed face.
- Inter body: 16px, line height 1.5; large body 20/18px. Buttons 15px/600. Small text 14px. Reserve 12px labels for short UI labels.
- No synthetic Fredoka italics. Use colour or placement for emphasis. Sentence case by default.
- Radii: cards 16px, large containers 20–24px, inputs 12–14px, buttons 14px or pills. Border `1px solid #E7E5E0`; optional shadow `0 4px 20px rgba(10,10,10,0.06)`.
- Existing mascot and simple hand-drawn bulbs, sparks, cards and connection motifs. No emoji substitutes or glossy sticker asset copies.

### Layout: proposed starting values

- Maximum content width 1200px; desktop gutters 32–48px, mobile 20px.
- Spacing scale 4, 8, 12, 16, 24, 32, 48, 64, 96px.
- Major section padding 80–112px desktop, 48–64px mobile; tune to actual content.
- Two-column gallery on wide screens, single column on narrow screens; gaps 24–32px.
- Supporting copy about 55–65 characters per line. Keep hero copy short enough to reveal part of the product evidence within the first screen on common laptops.
- Marketing balance follows the guideline's 70% clean space/interface, 20% playful graphics, 10% mascot personality. The Studio should be even quieter.
- No arbitrary empty viewport between sections, no scroll trapping and no fixed-height text containers that clip at zoom.

## Motion and interactions

Observed DOVV behaviour is listed separately from proposed Pika implementation. No exact DOVV timing is claimed.

| Behaviour | Evidence | Pika recommendation |
| --- | --- | --- |
| Section navigation | Clicking process/contact moved to in-page anchors; floating link highlight changed | Native anchors with optional smooth scrolling; account for header offset; immediate movement with reduced motion. |
| Testimonial carousel | Manual next changed content and counter; subsequent automatic advances observed | Prefer a static proof panel. If a carousel is needed, manual controls, accessible labels and no automatic advance by default. |
| Text transitions | Partially revealed/light text was visible during page transitions | Optional one-time fade/8px rise over 300–450ms. Keep essential copy present without animation. Do not claim a specific DOVV reveal algorithm. |
| Floating navigation | Lower-page dock remained visible across sections | Optional Discover-only enhancement. Use sufficient bottom clearance; omit from Studio. |
| Sticker decoration | Tilt, overlap, borders and shadows visible; continuous movement not verified | Static by default; interactive doodles may rotate 2–4 degrees or scale 1.03–1.05 on hover. |
| Project hover | Not verified | Proposed 150–250ms border/shadow transition; no necessary information available only on hover. |
| Pika design arrival/reorder | Product-specific, not taken from DOVV | 300–450ms soft spring; animate position without moving focus. Show truthful generation status. |
| Mascot | Pika-specific | Existing 400–800ms states; bulb pulse approximately 600ms, maximum twice. No constant floating, particles or endless bouncing. |

Reduced motion: disable transforms, decorative drawing, smooth scrolling and mascot loops. Keep state changes immediate and understandable. Avoid opacity states that leave content invisible if scripts fail. Animate transform/opacity rather than layout dimensions. Never delay access to buttons until animation completes.

## Responsive and accessibility plan

These are proposed requirements, not a completed mobile audit of DOVV.

- At narrow widths, stack hero copy, CTA and preview; remove overlapping decorations near text.
- Process cards become a vertical ordered list, without rotation or horizontal panning.
- Navigation remains usable at 320px width; use two ordinary links rather than a crowded floating dock.
- Minimum 44px interactive targets, visible focus, semantic headings, labelled controls and descriptive preview alternatives.
- Check text contrast on all colour combinations; decorative brand colours are not automatically suitable for text.
- Avoid horizontal page overflow at 320px and at 200% zoom. Gallery navigation must work without dragging.
- Render primary content without waiting for decorative animation; reserve image dimensions and lazy-load below-fold previews.

## Handover acceptance

The design should feel related through scale, rhythm and playful accents, while unmistakably using Pika's identity. Review desktop and mobile compositions, real output imagery, animation/reduced-motion states and brand consistency before implementation. The companion plan defines features and release boundaries.
