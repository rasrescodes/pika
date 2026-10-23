// Ranking: the Juror's order by overall score (ties by design), then the art director's pins on top.
import type { Verdict } from "./juror";

export type RankedCard = { id: string; verdict: Verdict };

export function jurorOrder<T extends RankedCard>(cards: T[]): T[] {
  return [...cards].sort((a, b) => b.verdict.overall - a.verdict.overall || b.verdict.scores.design - a.verdict.scores.design || a.id.localeCompare(b.id));
}

// Apply the art director's chosen order (card ids, top first) over the Juror's order.
export function applyOrder<T extends RankedCard>(cards: T[], order: string[]): T[] {
  const byId = new Map(cards.map((c) => [c.id, c]));
  const pinned = order.map((id) => byId.get(id)).filter((c): c is T => !!c);
  const rest = jurorOrder(cards.filter((c) => !order.includes(c.id)));
  return [...pinned, ...rest];
}

// Move one card to a 1-based position, returning the new full order of ids.
export function moveTo(ids: string[], id: string, position: number): string[] {
  const without = ids.filter((x) => x !== id);
  const at = Math.max(0, Math.min(without.length, position - 1));
  return [...without.slice(0, at), id, ...without.slice(at)];
}
