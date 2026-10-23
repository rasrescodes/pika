# Build log

- W1 (23 Oct 23:34): tokens generator, lib/llm (Mubit + MOCK), brands (Pika, Mubit), families, MOCK generator (12 layouts), sanitiser (4-layer defence, layer 1), juror (constant prompt, zod, MOCK baselines), taste memory, rank, store; prompts generator-v1; 22 unit tests pass.
- W2 (24 Oct 00:1x): lib/shot (JS-off, network-blocked Chromium), lib/wall batch pipeline (concurrency 4), API routes (batch SSE, correction, reset, state, brand), Wall UI (streaming cards, ranking, FLIP, drag/click/keyboard corrections, sheet, taste memory), not-found redirect. Visual pass 1 fixed font-stack quoting bug in inline styles + card meta layout.
- W3 (24 Oct): lib/scorecard (schemas, data hash, directional rule, cost, median), scripts/scorecard.ts (real runs only), scripts/check-demo-ready.ts (strict validator + hashed verdict), /scorecard (sourced rows, cost/speed, method, honest empty state, proof table), /brand (Pika + Mubit presets, custom form). data/scorecard/README.md for the team.
