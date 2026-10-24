# HUMAN-NEEDED

Things only a person can do. Tick when done.

- [ ] **Blocking everything tonight:** Rassa and Luka: each get a Mubit key (early-access email) and put it in your own `.env`. The batch starts by itself once `.env` has `MUBIT_API_KEY` (see OPERATE.md).
- [ ] Luka: accept the GitHub invite to rasrescodes/pika.
- [ ] Kimberley: accept the GitHub invite to rasrescodes/pika, then read brand/README.md.
- [ ] FEASIBILITY SPIKE (deadline Sat 24 Oct 10:00): with a Mubit key in .env, run `node scripts/mubit-smoke.mjs`, `node scripts/spike-image.mjs`, then `node scripts/spike-task.mjs scripts/fixtures/sections 30`, and check the console shows ONE Juror task. Details: .oneshot/feasibility.md.
- [ ] JURY MODE (Rassa's version): with a key in .env, run `npm run jury:plan` (spends nothing, prints 246 calls) then `npm run jury`. Results appear on /jury. Check Mubit's console: the Juror task should form from the 178 training calls.
- [ ] Fill data/scorecard/sites.json: at least 8 Awwwards sites with their public jury scores (design, usability, creativity, content), source URL, and a screenshot we take ourselves.
- [ ] Fill data/pricing.json from the provider's public pricing page for the model we use.
- [ ] Ask the Mubit team: how do corrections reach the adapter, and can a corrected answer become a training example?
- [ ] Ask the Mubit team: can our app call a trained adapter directly, so the demo switches big model to small model live?
- [ ] Ask the Mubit team: does image input (screenshots) count toward the task and training?
- [ ] Pick the stack together (default: Next.js + TypeScript, OpenAI SDK pointed at Mubit).
- [ ] Choose the held-out scorecard sites and record their public Awwwards scores.
- [ ] Ask the Mubit team: which Claude models does the starter credit serve (or do we add our own Anthropic key)?
- [ ] Ask the Mubit team: is Banyan Sapling served anywhere we can call through Mubit? (stretch only)
- [ ] Luka: rotate the Mubit API key (it was pasted into an agent chat), then update `.env` in every checkout.
- [ ] Ask the Mubit team: do long outputs (1,600 to 6,000 characters) train, and can the 4-calls-in-flight limit on the starter credit be raised for the event?
- [ ] Check the provider terms on training a model from Sonnet's outputs before we present the distilled Generator as a product.
- [ ] Luka: share the training explainer (https://claude.ai/artifact/2QCvM3KrxcdNmjzYg21dZM) with Rassa and Kimberley; Kimberley to sanity-check its use of brand v1.
