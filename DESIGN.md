# DESIGN

DESIGN_VARIANCE: 6 · MOTION_INTENSITY: 4 · VISUAL_DENSITY: 6

## Owner
Kimberley (GitHub `kimberleys-ai`). Source files and tokens live in `brand/` (start at `brand/README.md`). The direction below is **PROVISIONAL**, locked by Claude via design-beast on 23 Oct so the build could start while Rassa was away. Kimberley can replace any of it: overwrite `src/styles/tokens.css` and this file, and the app follows.

## Direction (provisional): "the design critic's magazine"
Remix of Vercel (60%) and Pitchfork (40%), from `~/.claude/_repos/awesome-claude-design/design-md/remix/vercel-x-pitchfork.md`.
- Why it fits: Pika's Juror is a critic. Pitchfork is the archetype of the critic with a score: every Wall card reads like a review with a big number. Vercel's cold grayscale keeps it credible as a technical tool.
- Light, not dark: a magazine, not a dashboard. No product reason for dark.
- Cold neutrals, hot opinion: one accent, orange `#ff5d1f`, a cousin of Mubit's own red-orange `#d9421d`.

## Tokens (see `src/styles/tokens.css`)
- Neutrals: `#ffffff` bg, `#fafafa` bg-alt, `#f4f4f5` surface, `#000000` ink, `#52525b` muted, `#a1a1aa` dim, `#e4e4e7` border, `#d4d4d8` border-strong.
- Accent: `#ff5d1f` (hover `#e64a0e`, soft `#ffead9`). Used only for: section markers, the BEST NEW DESIGN label, links, focus rings, the drag-target line. Never a button fill. At most twice per viewport.
- Type: display serif **Newsreader** (free stand-in for Tiempos) at 48px and up only; UI and body **Geist Sans**; scores and numbers **Geist Mono** with tabular figures.
- Scale: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 48 / 64 / 88. 4px base spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96.
- Depth: flat, border-based. Cards: 1px border, radius 8, no shadow. Shadow only on popovers and the correction sheet.
- Buttons: black fill, white text, radius 6. Secondary: 1px border, transparent.

## Signature moves
1. **Score as headline:** each card's overall score is set huge in Geist Mono, solid ink (never gradient), the four criteria small underneath.
2. **BEST NEW DESIGN:** the Juror's #1 card carries a small-caps orange label, Pitchfork-style.
3. **Section markers:** small caps orange labels above regions: THE WALL, TASTE MEMORY, SCORECARD.
4. **Correction as a review note:** the art director's reason is shown as a pull-quote with a 4px orange rule, in the taste memory rail.
5. **Motion with meaning only:** re-ranking animates cards to their new positions (FLIP, 280ms, ease-out); new cards fade and rise 8px as they arrive; scores count up once. All off under `prefers-reduced-motion`.

## Bans
No glow, no gradient text, no purple, no Tailwind defaults, no pulsing live dots, no card-on-card, no icon tiles. No emojis, no em dashes in UI copy. UK English.

## Surfaces
1. Brand-kit `/brand`.
2. The Wall `/`: live grid of generated sections, ranked by the Juror, drag or click to override.
3. Scorecard `/scorecard`: Juror vs real Awwwards scores, big vs small model, cost and speed.

## Variance audit (23 Oct)
Against Tilly (DESIGN.md: warm paper #F8F5EC, green ink, ochre; Bricolage Grotesque + Source Sans 3 + Kalam; no heavy shadows; paper-strip ledger): typeface different, temperature cold vs warm, spacing denser, motion different (FLIP re-rank vs none noted), archetype review grid vs paper ledger. Matches: luminance (both light). Depth: Tilly only bans heavy shadows, so not a clear match. One match, under the limit of two. Keep. The light match is earned: a critic's magazine is printed matter.
