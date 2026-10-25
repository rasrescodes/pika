#!/bin/zsh
# Waits for the Generator fine-tune to finish, then has the fine-tuned student sit the holdout exam.
# Detector only (--skip-judge), so it runs without Mubit credit; add Juror scores later with gen-rejudge.ts.
cd ${PIKA_DIR:-$(pwd)}
set -a; . ./.env; set +a
: "${IMPECCABLE_BIN:?set IMPECCABLE_BIN to the native impeccable binary (see OPERATE.md)}"
PY=${VENV_BIN:-.venv/bin}
MODEL=mlx-community/Qwen3-4B-Instruct-2507-4bit
LOG=data/gen/gen.log
OUT=data/gen/adapters/gen-skills
note() { echo "$(date -u +%FT%TZ) gen-exam: $*" >> $LOG; }
while pgrep -f "mlx_lm lora" >/dev/null; do sleep 20; done
[ -f $OUT/0000150_adapters.safetensors ] || { note "no finished adapter"; exit 1; }
note "fine-tuned holdout (detector only)"
$PY/mlx_lm.server --model $MODEL --port 8080 --log-level WARNING --adapter-path $OUT 2>>data/gen/server.log &
SERVER=$!
until curl -sf http://127.0.0.1:8080/v1/models >/dev/null; do sleep 2; done
for tag in hold-local-ft; do
  npx tsx scripts/gen-distill.ts --tag $tag --prompt generator-v1 --split holdout --variants 2 --concurrency 1 --backend local --skip-judge >> $LOG 2>&1
done
kill $SERVER
note "done"
