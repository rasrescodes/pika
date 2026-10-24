#!/bin/zsh
# Round 2 of the Generator distillation: train on sections clean to both the detector and the layout check
# (Luka's train-skills plus Rassa's train-skills-rassa), two passes, then the detector-only holdout exam.
cd ${PIKA_DIR:-$(pwd)}
set -a; . ./.env; set +a
: "${IMPECCABLE_BIN:?set IMPECCABLE_BIN to the native impeccable binary (see OPERATE.md)}"
PY=${VENV_BIN:-.venv/bin}
MODEL=mlx-community/Qwen3-4B-Instruct-2507-4bit
LOG=data/gen/gen.log
OUT=data/gen/adapters/gen-skills-r2
ITERS=${ITERS:-300}
note() { echo "$(date -u +%FT%TZ) gen-round2: $*" >> $LOG; }
note "dataset"
npx tsx scripts/gen-dataset.ts train-skills,train-skills-rassa 1 >> $LOG 2>&1 || { note "dataset failed"; exit 1; }
if [ ! -f $OUT/$(printf %07d $ITERS)_adapters.safetensors ]; then
  note "fine-tune ($ITERS steps)"
  $PY/python -m mlx_lm lora --model $MODEL --train --data data/gen/dataset --adapter-path $OUT \
    --fine-tune-type lora --mask-prompt --num-layers 16 --batch-size 1 --iters $ITERS --learning-rate 1e-4 \
    --max-seq-length 4096 --grad-checkpoint --steps-per-report 10 --steps-per-eval 100 --val-batches 8 --save-every 100 >> $LOG 2>&1 \
    || { note "fine-tune failed"; exit 1; }
fi
note "holdout exam (detector only)"
$PY/mlx_lm.server --model $MODEL --port 8080 --log-level WARNING --adapter-path $OUT 2>>data/gen/server.log &
SERVER=$!
until curl -sf http://127.0.0.1:8080/v1/models >/dev/null; do sleep 2; done
npx tsx scripts/gen-distill.ts --tag hold-local-ft2 --prompt generator-v1 --split holdout --variants 2 --concurrency 1 --backend local --skip-judge >> $LOG 2>&1
kill $SERVER
npx tsx scripts/gen-layout.ts hold-local-ft2 >> $LOG 2>&1
npx tsx scripts/gen-scorecard.ts >> $LOG 2>&1
note "done"
