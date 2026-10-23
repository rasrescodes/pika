import { remove } from "@/lib/store";

export const runtime = "nodejs";

// Clears taste memory and the current Wall so the next judge starts fresh. Keeps the chosen brand.
export async function POST() {
  remove("taste");
  remove("wall");
  return Response.json({ ok: true });
}
