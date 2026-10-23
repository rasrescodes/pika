// Taste memory: the art director's corrections, newest first. The most recent ones travel in the
// Juror's USER message (never the system prompt), so the next call applies them immediately.
import type { Family } from "./families";
import { FAMILY_BRIEF } from "./families";
import type { Scores } from "./juror";

export type TasteItem = {
  id: string;
  cardId: string;
  family: Family;
  from: number;
  to: number;
  reason: string;
  jurorScores: Scores;
  directorScores?: Scores;
  at: string;
};

export const TASTE_IN_PROMPT = 6;

export function tasteNotes(items: TasteItem[]): string {
  const recent = items.slice(0, TASTE_IN_PROMPT);
  if (recent.length === 0) return "No art director notes yet.";
  const lines = recent.map((t) => {
    const avg = (x: Scores) => (x.design + x.usability + x.creativity + x.content) / 4;
    const moved = t.to < t.from
      ? `moved it up from #${t.from} to #${t.to}`
      : t.to > t.from
        ? `moved it down from #${t.from} to #${t.to}`
        : t.directorScores
          ? `scored it ${avg(t.directorScores).toFixed(1)} where the Juror said ${avg(t.jurorScores).toFixed(1)} (design ${t.directorScores.design}, usability ${t.directorScores.usability}, creativity ${t.directorScores.creativity}, content ${t.directorScores.content})`
          : "kept it where it was";
    const why = t.reason ? `: "${t.reason}"` : "";
    return `- A ${FAMILY_BRIEF[t.family]} layout: the art director ${moved}${why}.`;
  });
  return `Art director notes (their taste, from past corrections):\n${lines.join("\n")}`;
}

// Net preference per family: promotions minus demotions, used by the MOCK Juror.
export function familyBias(items: TasteItem[]): Map<Family, number> {
  const bias = new Map<Family, number>();
  for (const t of items) {
    // Proportional to the move: dragging #7 to #1 says more than nudging #3 to #2.
    const avg = (x: Scores) => (x.design + x.usability + x.creativity + x.content) / 4;
    const d = (t.from - t.to) * 0.35 + (t.directorScores ? avg(t.directorScores) - avg(t.jurorScores) : 0);
    bias.set(t.family, (bias.get(t.family) ?? 0) + d);
  }
  return bias;
}
