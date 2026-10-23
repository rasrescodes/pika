# Screens
1. `/` the Wall: states: first load (ready, previous batch or prompt to generate), generating (cards stream in, progress), done (ranked), correction sheet open, error card (invalid Juror JSON or generator failure), MOCK chip / MUBIT chip, taste memory empty and filled, after reset.
2. `/brand`: preset list (Pika, Mubit), form, saved confirmation, validation errors.
3. `/scorecard`: empty state (no run yet, method + command), results table, correction-proof table, demo-ready PASS stamp, cost "unavailable" cells.
4. Unknown route -> redirect to `/`.
