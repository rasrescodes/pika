# Generator distillation: a custom Pika Generator that avoids AI slop

Luka, 24 Oct 15:00. Status: building on `feat/generator-distill`. Rassa: this touches your Generator, but nothing in `lib/generator.ts` or `prompts/generator-v1.md` changes.

## Why
Training the local Describer raised its score through layout measurements, not through how the rebuilds look (holdout 40.1 to 59.5, pixel similarity 0.63 to 0.57). What we want is better front-end output from our own model. The Generator is the model that produces it.

## What
1. Teacher prompt `prompts/generator-skills-v1.md`: `generator-v1` plus a condensed set of rules from three open design skills (credited in the prompt and in `prompts/NOTICE-skills.md`):
   - Impeccable, Paul Bakaus, Apache 2.0 (github.com/pbakaus/impeccable)
   - awwwards-skill, Alessandro Boni, MIT (github.com/SandroHub013/awwwards-skill): the Awwwards rubric
   - claude-skill-awwwards, tponscr-debug, MIT per its README (github.com/tponscr-debug/claude-skill-awwwards)
2. Generate through Mubit (Sonnet): 6 brands x 12 families x 4 variants, same user message as `lib/generator.ts`.
3. Grade with no human: Impeccable's deterministic detector (count of AI-slop patterns) and our Juror (`jury-v1`). Keep the best variant per brief.
4. Fine-tune the local Qwen3 4B on brief -> best HTML, with the plain `generator-v1` system prompt, so the skills live in the weights, not the prompt.
5. Eval on held-out briefs (one variant seed and two families never trained on): base 4B, fine-tuned 4B, Sonnet + generator-v1, Sonnet + skills. Report slop count and Juror score side by side.

## What it changes for others
- New Mubit task (the skills prompt is a new system prompt). Existing Generator and Juror tasks are untouched; Juror calls here are sent with record=false so they don't add to its training.
- No app change. If the fine-tuned model wins, wiring it into the Wall is a separate decision.

## Honest notes
- The local model is a stand-in for a Mubit adapter, and it runs offline. Distilling Sonnet's outputs is the same pattern Mubit runs; check provider terms before presenting it as a product.
- The slop detector is someone else's rules; the Juror is our own model's opinion. Neither is a human jury.
