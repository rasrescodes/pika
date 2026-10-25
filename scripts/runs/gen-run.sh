#!/bin/zsh
cd ${PIKA_DIR:-$(pwd)}
set -a; . ./.env; set +a
: "${IMPECCABLE_BIN:?set IMPECCABLE_BIN to the native impeccable binary (see OPERATE.md)}"
# Mubit's starter credit: 4 calls in flight per project. Training set gets 3, holdout comparisons 1.
npx tsx scripts/gen-distill.ts --tag train-skills --split train --variants 1 --skip-judge --concurrency 3 >> data/gen/gen.log 2>&1 &
( npx tsx scripts/gen-distill.ts --tag hold-sonnet-skills --split holdout --variants 2 --concurrency 1 >> data/gen/gen.log 2>&1
  npx tsx scripts/gen-distill.ts --tag hold-sonnet-plain --prompt generator-v1 --split holdout --variants 2 --concurrency 1 >> data/gen/gen.log 2>&1 ) &
wait
echo "$(date -u +%FT%TZ) gen-run: all done" >> data/gen/gen.log
