#!/bin/bash
# Starts the overnight batch once both are true:
#   .env has a MUBIT_API_KEY, and data/batch/READY exists (written once sites, labels and prompts are in place).
# data/batch/READY holds the env for the batch, one VAR=value per line (for example BATCH_SITES=..., DESCRIBER_PROMPT=v2).
cd "$(dirname "$0")/.." || exit 1
until grep -q '^MUBIT_API_KEY=..*' .env 2>/dev/null && [ -f data/batch/READY ]; do sleep 60; done
[ "$(git branch --show-current)" = "feat/loop" ] || { echo "not on feat/loop: not starting" >> data/batch/batch.log; exit 1; }
set -a; . data/batch/READY; set +a
exec npx tsx src/batch.ts
