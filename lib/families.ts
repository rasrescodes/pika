// The 12 layout seed families. One batch = one card per family, so a correction about a family
// can be checked against the same family in the next batch.
export const FAMILIES = [
  "split",
  "centred",
  "editorial",
  "oversized",
  "asymmetric",
  "shapes",
  "brutalist",
  "minimal",
  "bento",
  "ticker",
  "stacked",
  "magazine",
] as const;

export type Family = (typeof FAMILIES)[number];

export const FAMILY_BRIEF: Record<Family, string> = {
  split: "two columns: headline left, a bold SVG composition right",
  centred: "centred headline and one action, generous space",
  editorial: "newspaper-style grid with a kicker, headline and two text columns",
  oversized: "one enormous headline that dominates the section",
  asymmetric: "off-centre composition with deliberate tension",
  shapes: "geometric SVG shapes carrying the visual, headline overlaid",
  brutalist: "raw borders, monospace labels, exposed grid",
  minimal: "almost empty: a short line of type and lots of air",
  bento: "a grid of tiles of different sizes, each with one idea",
  ticker: "a static band of repeated words across the section, headline beneath",
  stacked: "stacked horizontal bands of colour, each carrying a line",
  magazine: "magazine cover: masthead, big number, cover lines",
};
