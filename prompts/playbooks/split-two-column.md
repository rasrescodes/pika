split-two-column: text on one side, media or a second block on the other.
- Find the split first: its x decides both columns.
- The media or block side is a large field: exact bounds and colour, as MEDIA for photos or a rect for flat panels.
- Text side: headline lines with fit, paragraph lines with exact breaks, then buttons. Items on a shared left edge get the identical x.
- If the halves have different backgrounds, draw both as full-height rects.
- Gaps between headline, body and button are often 24 to 48px: measure them.
- Usual mistakes: equal columns when they aren't, a text edge drifting between items, a missing second background.
