#!/bin/zsh
# Local half of the Generator distillation: base-model holdout eval now, then once train-skills is generated,
# build the dataset, fine-tune, and eval the fine-tuned student on the same holdout briefs.
cd ${PIKA_DIR:-$(pwd)}
set -a; . ./.env; set +a
: "${IMPECCABLE_BIN:?set IMPECCABLE_BIN to the native impeccable binary (see OPERATE.md)}"
PY=${VENV_BIN:-.venv/bin}
MODEL=mlx-community/Qwen3-4B-Instruct-2507-4bit
LOG=data/gen/gen.log
OUT=data/gen/adapters/gen-skills
note() { echo "$(date -u +%FT%TZ) gen-local: $*" >> $LOG; }
serve() {
  $PY/mlx_lm.server --model $MODEL --port 8080 --log-level WARNING "$@" 2>>data/gen/server.log &
  SERVER=$!
  until curl -sf http://127.0.0.1:8080/v1/models >/dev/null; do sleep 2; done
}
holdout() { npx tsx scripts/gen-distill.ts --tag $1 --prompt generator-v1 --split holdout --variants 2 --concurrency 1 --backend local >> $LOG 2>&1; }

note "base model holdout"
serve; holdout hold-local-base; kill $SERVER; sleep 3

while pgrep -f "tag train-skills" >/dev/null; do sleep 30; done
note "dataset"
npx tsx scripts/gen-dataset.ts train-skills 1 >> $LOG 2>&1 || { note "dataset failed"; exit 1; }
if [ ! -f $OUT/0000150_adapters.safetensors ]; then
  note "fine-tune"
  $PY/python -m mlx_lm lora --model $MODEL --train --data data/gen/dataset --adapter-path $OUT \
    --fine-tune-type lora --mask-prompt --num-layers 16 --batch-size 1 --iters 150 --learning-rate 1e-4 \
    --max-seq-length 4096 --grad-checkpoint --steps-per-report 10 --steps-per-eval 50 --val-batches 8 --save-every 50 >> $LOG 2>&1 \
    || { note "fine-tune failed"; exit 1; }
fi
note "fine-tuned holdout"
serve --adapter-path $OUT; holdout hold-local-ft; kill $SERVER
note "done"
