# INSIGHTS

What we learn about Mubit, the Juror and the demo while building. One line each, with the evidence.

- Mubit groups calls into one task only when the system prompt, model, tools, tool choice and output format match. Put the design being judged in the user message, never in the system prompt. (docs: Tasks and sessions)
- Numbers, dates and IDs in the system prompt don't split a task; names do. (docs: Tasks and sessions)

- Scorer sanity (tests/score.test.ts, 24 Oct): identical copy >= 98, blank page far lower, bigger misplacement scores lower, full mask leaves visible < 0.05. All pass.
- Measurement copy (no AI) on 34 held-out sites: DOM score 100 everywhere, image score mean 44.5 (text-led heroes 86 to 95). DOM mode can saturate without learning; lead with image mode. See changes/2026-10-24-measurement-baseline.md.
