# Brief

## The event
Night Shift: $65K Mubit Hackathon, central London.
- Hacking: Fri 23 Oct 19:30 to **Sun 25 Oct 10:00 code freeze** (clocks go back 02:00 to 01:00 on Sunday).
- Sun 10:30 judging round 1 is an **expo** (noisy hall, demo repeated to several judges). 12:30 finalist demos on stage. 13:30 awards.
- Prizes: $15k / $10k / $5k cash, top 3 judged across all tracks, plus credits.
- Rules: all project code written during the event (open-source libraries and our own tooling allowed). **Every LLM call must go through Mubit.** At least one of us must be there for Sunday's demos.

## The brief
Route your LLM calls through Mubit and turn your corrections into model updates for a recurring task.

## Tracks
1. **Recurring tasks:** extraction, triage, support replies, review, routing. Show corrections becoming model updates.
2. **Own your intelligence layer:** move a workload from a closed model to a task-adapted open model. Show quality, cost and latency side by side. **(Pika's main track.)**
3. **Fast refresh:** workloads that keep changing. Show model updates keeping pace.

## Judging (equal weight)
1. Use of Mubit: show a correction turning into a model update in the demo.
2. Usefulness: a real recurring task someone would want handled.
3. Technical execution: it works and holds up under questions.
4. Demo: clear, live, within the time limit.

## Mubit facts (checked against docs.mubit.ai/llms-full.txt on 23 Oct)
- **It is a proxy.** Change the SDK base URL and use the Mubit key; model IDs stay the same.
  - OpenAI: `https://api.mubit.ai/openai/v1`
  - Anthropic: `https://api.mubit.ai/anthropic` (no `/v1`)
  - Gemini: `https://api.mubit.ai/gemini` (no `/v1beta`)
  - OpenRouter / Groq / Together / Mistral: `https://api.mubit.ai/compat/<service>/v1`
  - Use the base URL the console's Connect page shows.
- **Routes:** chat / responses / embeddings / messages / generateContent. **No image generation.** Image input to chat models should work.
- **Tasks:** calls with the same system prompt, model, tools, tool choice and output format form one task. Keep the Juror's system prompt fixed; put the design being judged in the user message. Numbers and IDs in the prompt don't split a task; names do.
- **Adapters:** after about 25 kept examples, Mubit trains a small open model for the task, tested against the big model's answers. A passing version is compared in the console's **Try models** page.
- **Apps cannot call an adapter by model ID** (public docs). Ask the Mubit team whether we can serve it from our app at the event.
- **Training limits:** a daily training cap (resets 00:00 UTC) and a pause between trainings. Train overnight; don't plan to retrain live on stage.
- **Long outputs can fail training** ("examples too long to train on"). The Juror's output must be short: scores plus one-line reasons, not whole pages.
- **Corrections:** the public proxy docs show no corrections API (Requests has a Rating column). Get the mechanism from the kickoff or the early-access email. The `@mubit-ai/sdk` package (`feedback()`, `recordOutcome()`, `remember()`) is Mubit's separate memory product.
- Mubit records request and reply content by default, so no secrets in prompts.

## Questions for the Mubit team (ask at office hours)
1. How do corrections reach the adapter? Can a corrected answer become a training example?
2. Can our app call a trained adapter directly, so the demo can switch big model to small model live?
3. Does image input count toward the task and training?
