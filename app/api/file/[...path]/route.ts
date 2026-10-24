import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

// Serves only captured screenshots: data/sites/<slug>/{original.png,thumb.jpg}. Nothing else.
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  const rel = parts.join("/");
  const m = rel.match(/^sites\/([a-z0-9][a-z0-9-]{0,80})\/(original\.png|thumb\.jpg)$/);
  if (!m) return new Response("Not found", { status: 404 });
  const file = path.join(process.cwd(), "data", "sites", m[1], m[2]);
  if (!existsSync(file)) return new Response("Not found", { status: 404 });
  return new Response(readFileSync(file), { headers: { "content-type": m[2].endsWith(".jpg") ? "image/jpeg" : "image/png", "cache-control": "public, max-age=3600" } });
}
