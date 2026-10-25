#!/bin/zsh
# Once Mubit's train-e1 is done: fine-tune the local Describer on Sonnet's best DOM rounds (ranked by pixel
# similarity), then eval holdout under tag local-sonnet. Runs beside the Mubit batch.
cd ${PIKA_DIR:-$(pwd)}
LOG=data/local/local.log
SITES=.claude/worktrees/agent-a6f139037185ed165/data/sites
MODEL=mlx-community/Qwen3-4B-Instruct-2507-4bit
OUT=data/local/adapters/sonnet-px
note() { echo "$(date -u +%FT%TZ) $*" | tee -a $LOG; }

until grep -q "train-e1 done" data/batch/batch.log; do sleep 30; done
note "sonnet-distill: building dataset from Mubit rounds"
mkdir -p data/local/dataset-sonnet
DATASET_SOURCES=mubit DATASET_RANK=pixel npx tsx scripts/local-dataset.ts $SITES 40 >> $LOG 2>&1 || { note "sonnet-distill: dataset failed"; exit 1; }
cp data/local/dataset/*.jsonl data/local/dataset/sources.json data/local/dataset-sonnet/
note "sonnet-distill: $(tail -1 $LOG)"
if [ ! -f $OUT/0000100_adapters.safetensors ]; then
  .venv/bin/python -m mlx_lm lora --model $MODEL --train --data data/local/dataset-sonnet --adapter-path $OUT \
    --fine-tune-type lora --mask-prompt --num-layers 16 --batch-size 1 --iters 100 --learning-rate 1e-4 \
    --max-seq-length 8192 --grad-checkpoint --steps-per-report 10 --steps-per-eval 100 --val-batches 5 --save-every 50 >> $LOG 2>&1 \
    || { note "sonnet-distill: fine-tune failed"; exit 1; }
fi
note "sonnet-distill: server with $OUT"
.venv/bin/mlx_lm.server --model $MODEL --port 8080 --log-level WARNING --adapter-path $OUT 2>>$LOG &
SERVER=$!
until curl -sf http://127.0.0.1:8080/v1/models >/dev/null; do sleep 2; done
LLM_BACKEND=local LOCAL_MODEL_LABEL=lora-sonnet-px LOCAL_TEMPERATURE=0 npx tsx src/loop.ts --sites $SITES --mode dom \
  --split holdout --no-lessons --rounds 1 --concurrency 1 --tag local-sonnet --resume >> $LOG 2>&1
kill $SERVER
note "sonnet-distill: done (tag local-sonnet)"
