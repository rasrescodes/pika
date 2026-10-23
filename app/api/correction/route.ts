import { crossSite } from "@/lib/guard";
import { z } from "zod";
import { read, write } from "@/lib/store";
import { getWall, getTaste } from "@/lib/wall";
import { applyOrder, moveTo } from "@/lib/rank";
import type { TasteItem } from "@/lib/taste";
import type { Card, WallState } from "@/lib/wall";

export const runtime = "nodejs";

const score = z.number().int().min(1).max(10);
const Body = z.object({
  cardId: z.string(),
  to: z.number().int().min(1).max(12),
  reason: z.string().trim().min(3, "Say what about the design").max(200),
  scores: z.object({ design: score, usability: score, creativity: score, content: score }).optional(),
});

export async function POST(req: Request) {
  const refused = crossSite(req);
  if (refused) return refused;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid correction" }, { status: 400 });
  const wall = getWall();
  if (!wall) return Response.json({ error: "No wall yet" }, { status: 409 });

  const judged = wall.cards.filter((c): c is Card & { verdict: NonNullable<Card["verdict"]> } => !!c.verdict);
  const ids = applyOrder(judged, wall.order).map((c) => c.id);
  const from = ids.indexOf(parsed.data.cardId) + 1;
  const card = judged.find((c) => c.id === parsed.data.cardId);
  if (!card || from === 0) return Response.json({ error: "Unknown card" }, { status: 404 });

  const order = moveTo(ids, card.id, parsed.data.to);
  const item: TasteItem = {
    id: `${Date.now().toString(36)}-${card.family}`,
    cardId: card.id,
    family: card.family,
    from,
    to: parsed.data.to,
    reason: parsed.data.reason.trim(),
    jurorScores: card.verdict.scores,
    directorScores: parsed.data.scores,
    at: new Date().toISOString(),
  };
  const taste = [item, ...getTaste()];
  write("taste", taste);
  const next: WallState = { ...wall, order };
  write("wall", next);
  return Response.json({ wall: next, taste });
}
