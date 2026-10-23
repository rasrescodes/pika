# INSIGHTS

What we learn about Mubit, the Juror and the demo while building. One line each, with the evidence.

- Mubit groups calls into one task only when the system prompt, model, tools, tool choice and output format match. Put the design being judged in the user message, never in the system prompt. (docs: Tasks and sessions)
- Numbers, dates and IDs in the system prompt don't split a task; names do. (docs: Tasks and sessions)
