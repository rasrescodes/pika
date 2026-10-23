# DECISIONS

One line per decision: date and time, decision, why. Newest at the bottom.

- 2026-10-23 19:45: Idea is Pika (generator + Awwwards-style Juror that learns the art director's taste). Why: the team's pick; the narrow critique task fits Mubit far better than "generate whole websites", which is too long for adapter training and the most crowded idea in the room.
- 2026-10-23 19:45: Main track is "Own your intelligence layer" (cheap small critic judges 100 designs instead of 5). Why: the cost and speed story is visible and measurable.
- 2026-10-23 19:45: Scorecard = Juror vs real Awwwards jury scores on held-out sites, big vs small model. Why: the simulated judging panel's main doubt was "is it really learning taste?"; a hard scorecard answers it.
- 2026-10-23 19:45: Invoice generation dropped. Why: a different product; dilutes the demo.
- 2026-10-23 19:45: No SPEC.md yet; Luka reads the brief and plan first.
- 2026-10-23: Kimberley joins as design lead and owns brand/. Why: Pika is judged by design-literate people, so its own UI must look award-level.
- 2026-10-23 21:30: Loop stack is TypeScript on Node with tsx, `@anthropic-ai/sdk` pointed at Mubit's Anthropic route, Playwright for rendering, and a code-only score (SSIM, colour histogram, edge F1, media masked). Why: one language; a score with no LLM can't flatter itself. Only on `feat/loop` until the reproduction-loop proposal is agreed.
- 2026-10-23 21:30: Prompts v1 added: `prompts/describer.v1.md` (the trained task), `builder.v1.md`, `critic.v1.md`, `lessons.v1.md`. All per-call data (screenshot, previous spec, fixes, house lessons) goes in the user message, so each role stays one Mubit task. Freeze the Describer before the overnight run. Why: a changed system prompt or model starts a new task.
- 2026-10-23 21:30: Mubit session per site (`metadata.user_id = site-<slug>`). Why: Mubit holds back test cases by session, so one site's rounds never leak between training and testing.
- 2026-10-23 22:30: Second loop, `--mode dom`: the Describer reads `measure.json` as compact text (`prompts/describer-dom.v1.md`, its own Mubit task) and the fixes come from a code diff of original vs rebuild measurements (`src/dom-diff.ts`), not an LLM Critic. Why: text-only, so it trains even if Mubit can't train on images; cheaper; and deterministic. Inputs are about 700 tokens median, 2,200 max. Each mode keeps its own lessons file.
- 2026-10-23 23:30: Prompts v2 drafted on `prompts/v2` (Describer image and DOM, Builder, 9 layout playbooks); see `prompts/CHANGES-v2.md`. New spec grammar the Builder v2 follows literally, and a fixed fit script in the Builder. Not wired in: `src/agents.ts` still loads v1, and the loop must add a `PLAYBOOK:` block to the user message. Switching starts new Mubit tasks, so decide before the overnight run. Why: hand-built specs in the v2 format scored 89.2 (aardvark-book-club, image) and 72.1 (kern-society, DOM) with a literal reference build.
