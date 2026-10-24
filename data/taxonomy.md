# Site taxonomy

Labels for every captured hero. One value per field, from these lists only. Labels describe the above-the-fold screenshot, not the rest of the site. Machine-readable form: `data/taxonomy.json`.

## visual_style (the look)
- `minimal-swiss`: grid, sans serif, lots of white space, restrained colour
- `editorial-serif`: magazine feel, serif display type, considered hierarchy
- `brutalist`: raw, system fonts, hard borders, deliberately rough
- `maximal-expressive`: loud colour, oversized or distorted type, collage
- `luxury-refined`: muted palette, thin type, generous spacing, premium
- `playful-illustrative`: illustration, rounded shapes, bright and friendly
- `tech-futuristic`: dark, neon or gradients, glow, sci-fi detail
- `retro-nostalgic`: period type, grain, print or early-web references
- `organic-natural`: earthy palette, soft shapes, nature imagery
- `corporate-clean`: tidy, safe, product-marketing polish
- `photographic-immersive`: a photo or video carries the hero
- `3d-webgl`: a 3D scene or shader carries the hero

## layout_style (the structure)
- `big-type-poster`: one or two huge words or lines dominate
- `centred-hero`: headline and call to action centred over a plain or media background
- `split-two-column`: text one side, media or second block the other
- `asymmetric-editorial`: offset blocks on a visible grid, magazine-like
- `multi-column-grid`: three or more columns of cards, links or tiles
- `list-index`: a text list of projects or links is the hero
- `full-bleed-media`: media fills the viewport with small text on top
- `canvas-overlay`: a full-screen canvas with UI text floating over it
- `sidebar-nav`: a vertical nav or panel takes a full-height column

## category (what the site is)
`agency-studio`, `portfolio-personal`, `product-saas`, `ecommerce-fashion`, `architecture-interior`, `food-drink`, `culture-events-music`, `finance-crypto`, `real-estate`, `education-nonprofit`, `automotive-mobility`, `health-beauty`, `entertainment-games`, `other`

## attributes
- `theme`: `light`, `dark` or `colourful` (background is a saturated colour)
- `type_mix`: `sans`, `serif`, `mono`, `display` (custom or decorative), or `mixed`
- `density`: `sparse`, `balanced` or `dense`
- `nav`: `top-bar`, `corners`, `side`, `hidden` or `none`
- `accent`: the main accent colour as hex, or `none`
- `difficulty`: 1 to 5, how hard a hand-coded HTML rebuild of this hero would be (1 = plain type on a flat colour, 5 = mostly 3D or photo)
