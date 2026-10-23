// Mutating routes refuse cross-site browser requests, so a web page open on the demo laptop cannot
// reset the demo, change the brand, save corrections or spend calls. The server also listens on
// 127.0.0.1 only, so other devices cannot reach it at all.
export function crossSite(req: Request): Response | null {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return Response.json({ error: "Cross-site request refused" }, { status: 403 });
  return null;
}
