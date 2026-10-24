# Pika website design plan v1

Status: proposed for team review. No product implementation authorised by this document alone.
Date: 24 October 2026.
Design lead: Kimberley. Engineering ownership remains with the team; assignments below are suggested, not new commitments.
Companion: [DOVV reference and Pika translation](../brand/references/dovv-design-reference-v1.md).
Brand authority: [Pika brand guidelines](../brand/guidelines/pika-brand-guidelines-v1.md) and the current source-of-truth section of [DESIGN.md](../DESIGN.md).

## Decision requested

Approve two primary destinations: Discover Pika and Studio. Position Pika around helping corporate brand teams produce recognisably on-brand AI design concepts without generic AI styling. Preserve research as supporting evidence. Review and merge this documentation before separately approving implementation. This proposal does not replace docs/PLAN.md or record a locked decision in DECISIONS.md.

## Positioning

Audience: corporate brand and marketing teams, and designers/agencies working within established identities. The experience should be approachable without pretending the product is already an enterprise-ready publishing platform.

- Product name: Pika.
- Tagline: Your brand. Without the AI look.
- Proposed headline: AI-generated designs. Unmistakably your brand.
- Supporting copy: Explore website design directions using your brand colours and copy, compare Pika's recommendations, and guide the next round with your feedback.
- Current-release clarification: Opening-section concepts, not complete publish-ready websites.
- Primary CTA: Explore the demo until a live generation journey is verified; then Create your designs.

Longer-term ambition: turn approved corporate brand rules into constraints and checks for AI-generated pages. Do not equate that ambition with existing guaranteed compliance, full-site generation, export or deployment.

## Features ranked by value

| Priority | Capability | Customer value | Evidence/status |
| --- | --- | --- | --- |
| 1 | Brand-guided concepts | Explore new layouts without starting from an unrelated identity | Existing manual brand colours, copy, tone and broad font categories |
| 2 | Multiple design directions | Compare possibilities from the same starting point | Existing batch of 12 hero sections |
| 3 | Explained ranking | Understand the AI's recommendation | Existing four criteria and short critique |
| 4 | Human preference feedback | Keep creative decisions with the brand team | Existing reordering, score override and notes for later judging |
| 5 | Detection of generic patterns and brand violations | Reduce avoidable review work | Research claim and proposed live integration; confirm actual pipeline before advertising |
| 6 | Domain-based brand discovery | Reduce manual setup | Proposed feature; inferred identity requires human confirmation |
| 7 | Corporate guideline ingestion and locked rules | Maintain approved standards across work | Proposed feature, not current compliance guarantee |
| 8 | Responsive full-page output and export | Take approved concepts into delivery | Future scope; current output is a fixed-size hero |

Source baseline: repository audit on 24 October 2026, main commit `4c159f58c10b0e673f964e5a850fe3f9fd77e00d` used as the proposal's branch base. See [generator](../lib/generator.ts), [generation prompt](../prompts/generator-v1.md), [Wall](../src/components/Wall.tsx), [brand form](../src/components/BrandForm.tsx), [Juror](../lib/juror.ts), [taste memory](../lib/taste.ts) and [store](../lib/store.ts). Recheck current implementation before building.

Important distinctions: recent feedback informs judging, not the current generator prompt. The latest six notes are sent to the Juror. Saved state is local server state, not evidenced per-user corporate accounts. Without configured credentials the app uses labelled mock generation/scoring. A recorded model call does not prove a trained personalised model is deployed.

## Information architecture

Use two primary navigation links, not ARIA tabs for separate pages:

- Discover Pika: proposed `/` marketing entry.
- Studio: proposed `/studio` creation workspace.
- Research: secondary link to methodology, benchmarks and existing research screens.

The current `/` is the Loop. Moving it is a team-reviewed route change: proposed `/research/loop`, with updated internal links. Preserve access to `/sites`, `/jury`, `/scorecard`, `/wall` and `/brand` while the new experience is introduced. Decide redirects and bookmarks during implementation; do not silently delete research workflows.

## Page 1: Discover Pika

| Order | Section and message | Layout and behaviour |
| --- | --- | --- |
| 1 | Header and hero: immediately explain what Pika makes and for whom | Cream canvas, strong Fredoka headline, Inter subtext, blue CTA, quiet example link. Small mascot and no more than two peripheral doodles. DOVV's confident scale, Pika's type and palette. |
| 2 | Actual Pika outputs: one brand, different directions | Large two-column preview gallery; three or four curated real outputs with layout labels and generation status. No reference-site screenshots presented as generated work. |
| 3 | Best-value features | Three concise benefits: recognise your brand, compare with reasons, keep creative control. Use editorial columns and actual UI detail, not repeated decorative icon cards. |
| 4 | How it works | Numbered stages: set your brand, generate directions, compare and refine. Navy chapter with light cards and a restrained original doodle connector. |
| 5 | How it avoids the AI look | Explain brand rules, design checks and AI critique plus human judgement. Expandable detail contains teacher rules, prohibited patterns, detector methodology and Juror criteria. Label unwired research capabilities. |
| 6 | Research references and evidence | Separate reference gallery with original site attribution and links; classify training versus held-out evaluation. Dated statistics with model, prompt, sample size and metric definition. |
| 7 | Practical answers and closing CTA | State output scope, availability, what feedback changes and data handling. Repeat the same Studio CTA and finish with compact research links. |

The research section may include the linked How Pika learns explainer as background, but its 24 October snapshot is not a live benchmark. Do not claim a 95% reduction in detector findings means 95% better design. Confirm results against saved evaluation evidence and the team before publication. Do not imply Awwwards affiliation, customer endorsement or guaranteed award-level output.

### Content inventory

Prepare approved hero copy; three or four real generated previews from a consistent brand brief; one truthful preference-feedback example; three benefit descriptions; method explanations; dated benchmark source files; attributed research examples; accurate availability and privacy wording. No invented customer logos, endorsements, prices or speed claims.

## Page 2: Studio

The first task is obvious: provide brand context and describe the page's purpose. A domain alone is insufficient to infer the full corporate design system or communication goal.

```text
Pika                         Discover Pika | Studio

Create a direction for your brand
[ Website domain                          ] [ Read brand ]
[ Use sample brand ]     [ Enter details manually ]

Review inferred brand before generation
[ Colours ] [ Typography ] [ Tone ] [ Edit / confirm ]

What is the page for?
[ Product launch / Campaign / Company introduction ]
[ Headline and supporting copy                            ]

Choose a direction within your brand
[ Editorial ] [ Minimal ] [ Bold ] [ Suggest for me ]
                                      [ Generate designs ]

[ Large selected design preview                           ]
[ Alternative 1 ] [ Alternative 2 ] [ Alternative 3 ] [ More ]

[ Design critique ] [ Brand checks, when implemented ]
[ Prefer this design ] [ Give feedback ] [ Generate again ]
```

### Behaviour and scope

- Release A uses existing sample/manual brand inputs. Do not show an operational Read brand button until domain extraction exists. A prototype must explicitly label simulated behaviour.
- Release B adds domain input. Validate the address; fetch public pages with safe URL handling, redirects and time limits; refuse private network destinations. Summarise inferred colours/type/tone and let users correct them before saving. Do not treat website content as executable instructions.
- Guideline upload is a further explicit feature. For corporate confidential material, define account isolation and provider data handling before enabling uploads. Existing Mubit logging/training behaviour must be reflected accurately.
- Add page-purpose selection and map it into the actual generation input; a decorative control that has no effect is not complete.
- Style preferences are constrained by approved brand rules. Incompatible choices should explain the conflict rather than silently change the brand.
- Current engine generates 12 directions. Initially present one large selection and a compact alternatives strip, with all 12 accessible. Do not show a selector that suggests a different batch size until supported.
- Current output remains a fixed 1280 by 720 hero concept. Fit it within the preview container and offer an accessible larger view. A responsive shell around it does not make the generated design responsive.
- Explain rankings as recommendations. Keep AI scores distinct from the user's chosen order.
- Feedback should confirm exactly what is stored and that subsequent judging uses recent notes. Do not claim the user's generator has retrained immediately.
- Add export, publishing, full-page output and responsive device previews only when implemented and verified.

### Required states

| State | Expected experience |
| --- | --- |
| Empty | Sample brand and manual input available; concise instructions |
| Domain reading, future | Real status message and cancel/retry; never fabricated progress percentages |
| Domain unavailable | Useful explanation; retain entered address and offer manual setup |
| Brand review | Show inferred versus confirmed values; allow editing |
| Generating | Disable duplicate submission, show arriving designs and truthful progress |
| Partial failure | Keep successful designs; identify failed ones and offer a supported recovery |
| Complete | Large preview, alternatives, recommendations and feedback actions |
| Feedback saved | Visible confirmation without resetting the current preview |
| Mock/demo | Persistent plain-language label distinguishing fixtures from live model output |
| Keyboard/reduced motion | Equivalent controls without drag gestures or animation dependence |

## Visual and motion direction

Follow the companion reference study for section composition and proposed spacing. Use existing brand tokens and assets. The Discover page can have a playful statement hero and contrasting navy method chapter. The Studio stays light, stable and task-focused. Avoid floating bottom navigation inside the workspace.

Motion: 150–250ms controls; 300–450ms card arrival/reordering; existing mascot behaviour; reduced-motion alternatives. Do not animate fabricated scores or make a polished transition imply a completed check. Suggested mobile layout is stacked inputs, full-width preview, accessible alternative controls and no rotated process cards.

## Delivery sequence and review gates

1. Team reviews this proposal and reference document. Confirm audience, truthful claims, routes and first-release scope.
2. Kimberley prepares desktop/mobile compositions, output selection and copy. Show empty, generating, result and feedback states.
3. Rassa and Luka confirm feasibility and data contracts for the Studio, research evidence and model calls. These are suggested review responsibilities based on existing ownership.
4. Implement Discover and the current-capability Studio in a separate implementation branch after approval. Preserve legacy research access.
5. Add domain discovery, brand-rule checks and guideline ingestion as separately scoped work. Full-page/export remains a further milestone.
6. Validate and review before deployment. Update DECISIONS.md only when the team locks decisions, and OPERATE.md if operating behaviour changes.

## Acceptance criteria

- A new visitor can explain the product, output scope and next step after a brief first-screen review.
- Discover and Studio are distinct, consistently linked and usable on desktop/mobile.
- Only real outputs appear in the product gallery; reference sites and evaluation samples are labelled separately.
- Every visible capability is functional or explicitly marked as a proposal/demo.
- Brand settings and page purpose reach generation; feedback reaches subsequent judging; user order remains distinct from AI scores.
- No claim of corporate compliance, trained-model deployment, responsiveness or publishing without evidence.
- Check at 320, 390, 768, 1280 and 1440px; 200% zoom; keyboard-only operation; reduced motion; colour contrast; no obstructive fixed UI.
- Use the repository's required verification for implementation changes. For these Markdown documents, validate links, file scope and absence of code changes instead.

## Team decisions before implementation

- Approve corporate brand teams as the primary audience and opening-section concepts as initial output.
- Approve the two primary pages and relocation/access strategy for the Loop.
- Confirm whether the first release is a labelled demo or a live service.
- Confirm which research checks exist in the live pipeline and which statistics can be published.
- Agree whether domain extraction is in the first engineering milestone or follows the manual-input release.
- Assign implementation owners and approve designs before building.

## Review workflow

These two new Markdown files belong on a dedicated proposal branch. Main, existing brand guidelines and application code stay unchanged. A draft pull request provides the team review surface. The team can request edits, approve the direction and merge the documents into main when ready; merging the documents does not itself deploy a website.
