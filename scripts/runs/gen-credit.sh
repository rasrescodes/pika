#!/bin/zsh
# Jobs that need Mubit credit: Juror scores for detector-only exams, the missing Sonnet sections, and timed
# Sonnet runs for the scorecard's speed and cost. Stays within Mubit's 4 calls in flight.
cd ${PIKA_DIR:-$(pwd)}
set -a; . ./.env; set +a
: "${IMPECCABLE_BIN:?set IMPECCABLE_BIN to the native impeccable binary (see OPERATE.md)}"
LOG=data/gen/gen.log
note() { echo "$(date -u +%FT%TZ) gen-credit: $*" >> $LOG; }
note "start"
npx tsx scripts/gen-rejudge.ts hold-local-ft >> $LOG 2>&1 &
npx tsx scripts/gen-distill.ts --tag hold-sonnet-plain --prompt generator-v1 --split holdout --variants 2 --concurrency 1 >> $LOG 2>&1 &
( npx tsx scripts/gen-distill.ts --tag hold-sonnet-skills-timed --split holdout --variants 1 --concurrency 1 --skip-judge >> $LOG 2>&1
  npx tsx scripts/gen-distill.ts --tag hold-sonnet-plain-timed --prompt generator-v1 --split holdout --variants 1 --concurrency 1 --skip-judge >> $LOG 2>&1 ) &
wait
npx tsx scripts/gen-layout.ts hold-sonnet-plain >> $LOG 2>&1
npx tsx scripts/gen-scorecard.ts >> $LOG 2>&1
note "done"
