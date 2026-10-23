# Example spec: aardvark-book-club, image mode

Reference only. Never sent to the model. Written by hand from `original.png`, following `describer.v2.md`, to check that the format fits in 400 words and captures what the score rewards.

- Site: light, colourful big-type hero. Display type on flat colour, organic bands, pill nav, a handwritten note.
- Words: 244 of 400.
- Score: 89.2 (structure 0.795, colour 0.966, edges 0.948), from a deterministic script that follows `builder.v2.md` literally, rendered and scored exactly like the loop. On an earlier draft, removing the fit script dropped the score from 89.0 to 86.4. No LLM was called.
- Notes: the two wavy bands are polygons (16 and 12 points); rough, but they carry most of the colour score. The headline uses Archivo Black at cap height / 0.69, and fit takes care of the width difference from the original face.

```
CANVAS: #ffd24a
FONTS: A = Archivo Black 400; B = DM Sans 500,600,700; C = Fraunces 700; D = Caveat 500
SHAPES:
- poly 45,900 150,760 330,680 440,640 470,560 520,330 580,190 650,145 760,170 900,330 1000,380 1100,330 1200,180 1300,105 1380,110 1440,180 1440,800 1380,790 1300,700 1250,560 1200,480 1120,470 1050,560 950,610 870,560 800,450 760,440 700,520 660,640 560,720 380,790 262,900 #faed8f
- poly 395,900 520,790 680,700 720,640 760,625 830,700 900,700 1000,660 1080,630 1150,650 1220,720 1290,900 #f9a220
- rect 477,19 92x42 #faed8f r21
- rect 574,19 74x42 #faed8f r21
- rect 654,19 72x42 #faed8f r21
- rect 732,19 54x42 #faed8f r21
- rect 792,19 171x42 #f9a220 r4
- rect 1112,19 220x42 #faed8f r21
- ellipse 1343,21 38x38 #000000
- ellipse 1386,21 36x38 #000000
- rect 15,590 202x42 #ff008c r4
MEDIA:
none
TEXT:
- C 34/40 w700 #000000: "Aardvark"@18,18 fit 130
- B 12/12 w700 ls2 upper #000000: "Book | Club"@155,31
- B 18/22 w600 #000000: "All Books"@488,28 "Gifting"@586,28 "Merch"@666,28 "FAQ"@744,28 "Shopping from the UK?"@1148,28
- B 14/22 w700 #000000: "Log-in / Sign-up"@807,29 "→"@936,29
- A 126/96 w400 #000000: "Unbox stories"@16,179 fit 832 "worth talking"@17,275 fit 811 "about"@5,372 fit 371
- B 18/21.6 w600 ls-0.36 #000000: "Join the book club that’s anything but | traditional. Choose up to 3 new reads every | month, delivered to your door. Then dive | into the stories, and the conversations."@15,491
- B 14/22 w700 #ffffff: "Log-in / Sign-up now"@30,600 "→"@190,600
- D 22/24 w500 #3b308f: "Shipping to | the USA & | Canada"@1281,390
```
