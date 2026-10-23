import { z } from "zod";
import { write } from "@/lib/store";
import { PRESETS } from "@/lib/brands";

export const runtime = "nodejs";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const font = z.enum(["serif", "sans", "mono"]);
const Custom = z.object({
  name: z.string().min(1).max(40),
  colours: z.object({ bg: hex, ink: hex, accent: hex, soft: hex }),
  displayFont: font,
  bodyFont: font,
  tone: z.string().min(1).max(80),
  headline: z.string().min(1).max(90),
  subline: z.string().min(1).max(160),
  action: z.string().min(1).max(30),
});
const Body = z.union([z.object({ preset: z.string() }), z.object({ custom: Custom })]);

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Check the brand fields" }, { status: 400 });
  if ("preset" in parsed.data) {
    const preset = PRESETS.find((p) => p.id === (parsed.data as { preset: string }).preset);
    if (!preset) return Response.json({ error: "Unknown preset" }, { status: 404 });
    write("brand", preset);
    return Response.json({ brand: preset });
  }
  const brand = { ...parsed.data.custom, id: `custom-${parsed.data.custom.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, source: "Entered by the art director" };
  write("brand", brand);
  return Response.json({ brand });
}
