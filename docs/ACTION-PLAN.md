# Action plan: training, Saturday 24 Oct evening

Owner: Luka (with his agent). Written 18:30. Explainer for the team: https://claude.ai/artifact/2QCvM3KrxcdNmjzYg21dZM (ask Luka to share it).

## Blocker (20:30)
- **Mubit's starter credit is used up on both routes** for our project (Anthropic and OpenAI return `402 starter_credit_used_up`). Nothing that goes through Mubit runs until someone adds their own Anthropic key (and OpenAI if the app uses GPT) under Provider keys in the Mubit console: https://app.mubit.ai/console/provider-keys. Calls still go through Mubit, so the hackathon rule holds.
- Until then: the Generator exam runs detector-only (`scripts/runs/gen-exam.sh`), and Juror scores are added afterwards with `npx tsx scripts/gen-rejudge.ts <tag>`.

## Generator scorecard (new, the main track's "quality, cost and latency side by side")
- `npx tsx scripts/gen-scorecard.ts` prints the table and writes `data/gen/scorecard.json`. Every section now records its time and tokens.
- Once credit is back: rerun Sonnet's holdout sections into a timed tag (or `gen-rejudge` plus a fresh timed run) so latency and cost come from measurement, not estimates.
- Round 2 fine-tune overnight: add Rassa's 56 clean sections (`rassa/gen-more`, merge its brands into `data/gen/brands.json`) to the 172.

## Where things stand
- **Generator distillation** (`feat/generator-distill`, see `changes/2026-10-24-generator-distill.md`): Sonnet with `generator-skills-v1` made 220 sections; 172 passed the slop detector with no findings; the local Qwen3 4B is fine-tuning on 150 of them with the plain `generator-v1` prompt (step 60 of 150 at 18:24).
- **Holdout so far** (24 sections per contender: bento and magazine layouts, 2 preset and 4 unseen brands):

  | Contender | Juror /10 | Findings per page | Clean pages |
  |---|---|---|---|
  | Local 4B, untrained | 4.87 | 1.12 | 12/24 |
  | Sonnet, generator-v1 | 7.30 | 3.95 | 4/22 |
  | Sonnet, generator-skills-v1 | 7.17 | 0.21 | 21/24 |
  | Local 4B, fine-tuned | pending | pending | pending |

- **Mubit Describer batch** (`feat/local-training` checkout): baseline and epoch 1 done (DOM holdout 77.7 to 85.7 on 31 paired sites; image 92.6 to 92.8). Paused during epoch 2 so the Generator could use Mubit's 4 calls in flight. Resumes where it stopped.
- **Local Describer**: iteration-100 adapter scored 40.1 to 59.5 on holdout, but the gain is all in the DOM measurement (pixel similarity 0.63 to 0.57). The Sonnet-distilled retrain (145 examples ranked by pixel similarity) was killed for memory at 15:09 and is parked.

## Tonight, in order (one at a time: Mubit allows 4 calls in flight, the Mac has 16 GB)
1. [ ] Keep the Mac awake: plugged in, lid open, `caffeinate -dimsu &`. Lid closed means sleep, and everything pauses.
2. [ ] Generator fine-tune finishes (about 18:55), then `scripts/runs/gen-local.sh` runs the holdout exam for the fine-tuned student by itself (about 19:35). Output: `data/gen/hold-local-ft/results.jsonl`.
3. [ ] Rerun the 2 missing Sonnet plain-prompt holdout sections: `npx tsx scripts/gen-distill.ts --tag hold-sonnet-plain --prompt generator-v1 --split holdout --variants 2 --concurrency 1` (resumes, only the gaps run).
4. [ ] Fill the fine-tuned row in the table above, in the explainer, and in `DECISIONS.md`. Report Juror and detector together, never one alone.
5. [ ] Resume the Mubit Describer batch from the `feat/local-training` checkout, after step 3 (not beside it): `env $(grep -v '^#' data/batch/READY | xargs) BATCH_CONCURRENCY=3 npm run batch`.
6. [ ] Retrain the local Describer on Sonnet's best DOM rounds, ranked by pixel similarity: `scripts/sonnet-distill.sh` in the `feat/local-training` checkout. Not beside step 2: one fine-tune at a time.
7. [ ] After 01:00 (Mubit's daily training reset): check the Mubit console, Tasks then Adapters, for the Describer and `generator-skills-v1` tasks.

## Tomorrow morning
8. [ ] Side-by-side gallery for the demo: the same brief from the untrained 4B, Sonnet plain, Sonnet with skills, and the fine-tuned 4B, each with its Juror score and findings.
9. [ ] Decide with Rassa whether the fine-tuned Generator goes on the Wall (it runs locally; the app's Generator goes through Mubit today).
10. [ ] If the fine-tuned student is close to Sonnet with skills: a second round with more data (more variants per brief, best-of selection with the Juror) and its own best outputs added.
11. [ ] Fix the Describer's empty replies (about 1 in 9 DOM calls): Sonnet 5.5 thinks by default and uses the whole 1,600-token limit. Raise `maxTokens` in `src/agents.ts`. Check with the Mubit team first whether a changed limit splits the task.

## Merges
12. [ ] PR `feat/local-training` into `main`: local backend asks for `default_model` (otherwise LoRA adapters are ignored), one request at a time, empty-reply guard in `src/mubit.ts`, `BATCH_CONCURRENCY`, dataset from Mubit rounds ranked by pixel similarity.
13. [ ] PR `feat/generator-distill` into `main` after 12 (it shares `src/mubit.ts`), with the results filled in.

## For people only (also in HUMAN-NEEDED.md)
- [ ] Ask the Mubit team: can the app call a trained adapter; do long outputs (1,600 to 6,000 characters) train; can the 4-calls-in-flight limit be raised for the event.
- [ ] Rotate the Mubit API key: it was pasted into an agent chat.
- [ ] Check the provider terms on training a model from Sonnet's outputs before presenting it as a product.
- [ ] Share the explainer with Rassa and Kimberley; Kimberley to sanity-check its use of brand v1.

## Known caveats to say out loud in the demo
- The local models are stand-ins for Mubit's adapters and run offline.
- The Juror is a model and the detector is Impeccable's rules (Apache 2.0); neither is a human jury.
- Training targets are Sonnet's outputs with a prompt condensed from three open skills (credits in `prompts/NOTICE-skills.md`).
- The Mubit Describer gain after epoch 1 is Sonnet using written lessons, not a retrained model.
