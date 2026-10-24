# Pika brand guidelines

Pika combines a playful visual identity with a calm, functional interface. Use the mascot for personality and keep the workspace clear and easy to use.

**Balance:** 70% clean workspace, 20% playful graphics, 10% mascot personality. Marketing can be more expressive than the product UI.

## Colour

| Role | Colour | Hex | Use |
| --- | --- | --- | --- |
| Primary | Pika Blue | `#3027F4` | Primary calls to action, active states, brand surfaces and highlights |
| Secondary | Sky Blue | `#96D2F2` | Supporting surfaces, tags, illustrations and mascot accents |
| Dark accent | Deep Navy | `#28339E` | Dark brand surfaces, hover and selected states |
| Background | Warm Cream | `#FBF5EA` | Brand and editorial backgrounds |
| Ink | Pika Black | `#0A0A0A` | Headlines, mascot and primary text |
| White | White | `#FFFFFF` | Cards, reversed typography and clean UI surfaces |
| Soft blue | Mist Blue | `#E8F5FC` | Subtle backgrounds, selected cards and tags |
| Soft cream | Pale Cream | `#FFF9F1` | Alternative section backgrounds |

Build recognition around blue, cream and black, with sky blue as support. Limit additional colours.

Optional hero or feature gradient: `#3027F4 → #4338FF → #96D2F2`. Use sparingly and keep gradients out of core UI controls.

## Typography

Use **Fredoka** for expressive headings and **Inter** for functional UI and body text. Source both from Google Fonts.

| Style | Font | Weight | Desktop | Mobile | Line height |
| --- | --- | --- | --- | --- | --- |
| Display XL | Fredoka | 650–700 | 72px | 48px | 0.95 |
| H1 | Fredoka | 650 | 56px | 40px | 1.0 |
| H2 | Fredoka | 600 | 40px | 32px | 1.05 |
| H3 | Fredoka | 600 | 28px | 24px | 1.15 |
| Large body | Inter | 400 | 20px | 18px | 1.5 |
| Body | Inter | 400 | 16px | 16px | 1.5 |
| Small | Inter | 400–500 | 14px | 14px | 1.4 |
| Button | Inter | 600 | 15px | 15px | 1.0 |
| UI label | Inter | 600 | 12px | 12px | 1.2 |

Line heights are unitless. Small category labels use Inter 600 at 11–12px, uppercase, with `0.08em` letter spacing. Keep Fredoka out of paragraphs and dense UI.

## Logo and illustration

Use the supplied front-facing Pika holding a lightbulb as the primary mascot. Keep its silhouette simple, chunky and slightly imperfect; use it selectively.

Supporting illustrations use consistent-weight, hand-drawn doodle lines: Pika Blue on cream or black on white. Keep curves slightly imperfect rather than using polished corporate icons or emoji styling.

| Motif | Meaning |
| --- | --- |
| Lightbulb with three rays | Capturing an idea |
| Four-point star | Inspiration or a surfaced idea |
| Cursor or pen nib | Moving from thinking to making |
| Overlapping sheets or cards | Organising creative inputs |
| Overlapping circles or connected dots | Connections between ideas |
| Unfinished circle becoming complete | Progress |
| Small spark marks | A transformation or enhancement |

## Motion

Motion should support the task and make Pika feel like a quiet creative companion.

| Interaction | Timing and behaviour |
| --- | --- |
| UI micro-interactions | 150–250ms, ease-out |
| Cards entering or moving | 300–450ms, soft spring |
| Mascot movement | 400–800ms |
| Idle blink | Irregular intervals of roughly 4–8 seconds |
| Bulb pulse | Approximately 600ms; scale `1 → 1.06 → 1`; maximum two repetitions |
| Interactive doodle hover | Rotate approximately 2–4° or scale to 1.03–1.05 |
| Page transitions | Prefer sliding, stacking, appearing or drawing in |

Avoid constant floating elements, glowing gradients, particles and excessive bouncing.

### Mascot states

| State | Behaviour |
| --- | --- |
| Idle | Occasional blink and subtle breathing |
| Thinking | Eyes look upwards; bulb pulses once or twice |
| Idea found | Eyes widen slightly; bulb lights up; three rays appear |
| Working | Eyes glance between relevant elements; bulb subtly bobs |
| Success | Small body bounce followed by one sparkle |
| Curious | Head tilts approximately 5°; eyes follow the relevant element |
| Waiting | Slow blink; otherwise still |
| Error | Bulb briefly goes out; Pika looks towards it; avoid sad or red mascot states |

## UI shapes and depth

| Element | Specification |
| --- | --- |
| Cards | 16px corner radius |
| Large containers and modals | 20–24px corner radius |
| Inputs | 12–14px corner radius |
| Buttons | 14px radius or `999px` pill, depending on context |
| Small tags | `999px` pill |
| Borders | `1px solid #E7E5E0` |
| Optional shadow | `0 4px 20px rgba(10, 10, 10, 0.06)` |

Use colour, spacing and borders for hierarchy. Keep shadows light and avoid making every element pill-shaped.

## Visual references

These are references for design principles, not assets to copy.

| Reference | What to take from it |
| --- | --- |
| Dropbox | Separate an expressive creative brand from a calm, usable product interface. |
| Figma | Combine playful collaboration with a systematic workspace. |
| Notion | Use restraint and clear information density to keep the workspace calm. |
| Headspace | Communicate character through small changes in expression and movement. |
| Duolingo | Build mascot recognition, but use much less intensity so Pika supports the task. |
| Nothing | Build a recognisable identity from a tightly limited set of visual ingredients. |
| Miro | Represent messy thinking visually while keeping the product organised. |

## Supplied assets

- [Logo SVG](../logo/pika-logo-v1.svg): traced vector artwork.
- [Logo PNG](../logo/pika-logo-v1.png) and [original JPEG](../logo/pika-logo-v1.jpg).
- [Visual guideline PNG](pika-brand-guidelines-v1.png) and [original JPEG](pika-brand-guidelines-v1.jpg).
- [Visual guideline SVG](pika-brand-guidelines-v1.svg): embeds the supplied image; its individual elements are not editable vectors.
