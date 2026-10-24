canvas-overlay: a full-screen canvas (3D, shader, generative art) with UI text floating over it.
- Make the canvas MEDIA only if it is clearly a picture. If it is mostly a flat or gradient colour, write that as CANVAS or a gradient: the colour field counts.
- For glows use radial-gradient with centre and size in px and two or three stops.
- The UI is usually small text in corners and along edges: nav, labels, counters, a short headline. Measure each from its nearest corner.
- Large clear shapes in the scene can be an ellipse or rect in their main colour.
- Usual mistakes: a white or black background when it is tinted, missing corner labels, one media box hiding everything.
