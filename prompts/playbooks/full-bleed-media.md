full-bleed-media: a photo or video fills the viewport with small text on top.
- One MEDIA box at the media's exact bounds, often 0,0 1440x900. Its area is masked in scoring, so everything outside it decides the score.
- Look hard for what is not media: bars, cookie notices, solid strips above or below, panels behind text. Draw them as rects, with "over" when they sit on the media.
- Text on a solid shape counts fully: exact positions and sizes.
- Big display type over media often sits low in the frame: exact size and fit.
- Usual mistakes: media bounds slightly off, forgotten overlays, describing the photo instead of measuring what surrounds it.
