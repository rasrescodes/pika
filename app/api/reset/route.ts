import { crossSite } from "@/lib/guard";
import { remove } from "@/lib/store";

export const runtime = "nodejs";

// Clears taste memory and the current Wall so the next judge starts fresh. Keeps the chosen brand.
export async function POST(req: Request) {
  const refused = crossSite(req);
  if (refused) return refused;
  remove("taste");
  remove("wall");
  return Response.json({ ok: true });
}
