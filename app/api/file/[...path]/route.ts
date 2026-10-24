import { readFileSync } from "node:fs";
import { servableFile } from "@/lib/loopData";

export const runtime = "nodejs";

// Serves only screenshots: data/sites/<slug>/{original.png,thumb.jpg}, data/runs/<slug>/<run>/r<N>/build.png
// and data/baseline/<slug>.png. Never site code, never anything outside data/.
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const hit = servableFile(path);
  if (!hit) return new Response("Not found", { status: 404 });
  return new Response(readFileSync(hit.file), { headers: { "content-type": hit.type, "cache-control": "public, max-age=3600" } });
}
