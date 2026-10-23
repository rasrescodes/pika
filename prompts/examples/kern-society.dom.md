# Example spec: kern-society, DOM mode

Reference only. Never sent to the model. Written by hand from the `measure.json` text alone (as `measureToText` prints it), following `describer-dom.v2.md`, to check that the rules produce a usable spec.

- Site: cream big-type poster. Giant split-letter wordmark, orange marquee band, black band at the bottom, mono nav.
- Words: 126 of 400.
- Score: 72.1 (structure 0.525, colour 0.924, edges 0.781), from a deterministic script that follows `builder.v2.md` literally, rendered and scored exactly like the loop. No LLM was called.
- What each rule bought, measured the same way on drafts: with Oswald for the wordmark, a letter-spacing fit could not squeeze the letters enough and they overlapped (57.6), while the scaleX fit now in `builder.v2.md` scored 62.4. Adding the black bottom band, inferred from the second-largest background colour with no text on it, gained about 12 points. Raising the squeezed wordmark's weight from 600 to 900 gained 4.5.
- What DOM mode cannot see here: the logo (an SVG), the hairline rules and the ruler ticks. Image mode would get these.
- Rules applied: split letters K E R N and S O C I E T Y rebuilt into two words with fit from first x to last right edge; "Trial fonts" and "Meet the families" are in the page colour, so they sit on dark buttons; padded nav boxes moved to y + (h - line height) / 2; Roboto Flex and Recursive are Google Fonts, so kept; weights rounded to the nearest 100.

```
CANVAS: #efebe3
FONTS: A = Roboto Flex 500,800,900; B = Recursive 500,600
SHAPES:
- rect 1282,12 126x40 #0e0e0e
- rect 1224,150 185x46 #0e0e0e
- rect 0,687 1440x114 #ff3b1a
- rect 0,801 1440x99 #0e0e0e
MEDIA:
none
TEXT:
- B 14/20.3 w500 #0e0e0e: "Typefaces"@934,21 "Test drive"@1045,21 "Licensing"@1163,21
- B 14/14 w600 #efebe3 centre 126: "Trial fonts"@1282,25
- B 13/17.6 w500 #0e0e0e: "Variable fonts only"@32,78 "3 families / 14 axes"@1252,78
- A 56.2/53.9 w500 ls-1.1 #0e0e0e: "Variable type for restless | brands. Letters with a pulse."@32,150
- B 14/14 w600 #efebe3 centre 185: "Meet the families"@1224,166
- B 13/17.6 w500 #0e0e0e: "Scroll ↓"@1346,240
- A 453.6/335.7 w900 #0e0e0e: "KERN"@32,322 fit 503 "SOCIETY"@601,322 fit 804
- A 103.7/103.7 w800 ls-1 #0e0e0e: "KERN SOCIETY • INDEPENDENT TYPE • EST. 2019 •"@0,692
```
