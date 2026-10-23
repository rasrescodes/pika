# Pika

An AI art director that learns your taste.

Pika generates on-brand website sections from a client's brand kit, then a critic model, the Juror, scores every version the way an Awwwards jury does (design, usability, creativity, content). When the art director overrides the Juror, that correction goes through Mubit and becomes a model update, so the next batch is ranked the way they would rank it.

Built at Night Shift, the Mubit hackathon (London, 23 to 25 Oct 2026), by Rassa and Luka.

## Why it fits the brief
- **Recurring task:** design critique. Every studio reviews dozens of options a day.
- **Corrections become model updates:** the art director's overrides train the Juror through Mubit.
- **Own your intelligence layer (main track):** a small trained critic is cheap enough to judge 100 designs instead of 5. Show quality, cost and speed against the big model side by side.

## Start here
- `docs/BRIEF.md`: the event, tracks, judging, and verified Mubit facts.
- `docs/PLAN.md`: what we build, in order, and who does what.
- `AGENTS.md`: rules for any AI agent working in this repo.

## Setup
```bash
cp .env.example .env   # add your MUBIT_API_KEY
node scripts/mubit-smoke.mjs   # proves calls go through Mubit
```
