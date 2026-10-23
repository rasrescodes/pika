// Server-side screenshot of a sanitised section: headless Chromium with JavaScript disabled and every
// request that is not data: or about: aborted (the fourth defence layer). Returns a JPEG data URL.
import { chromium, type Browser } from "playwright";

let browser: Promise<Browser> | null = null;
function getBrowser(): Promise<Browser> {
  if (!browser) browser = chromium.launch();
  return browser;
}

export type Shot = { dataUrl: string; blockedRequests: number };

export async function screenshot(safeHtml: string): Promise<Shot> {
  const b = await getBrowser();
  const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 720 }, offline: true });
  let blocked = 0;
  await ctx.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith("data:") || url.startsWith("about:")) return route.continue();
    blocked++;
    return route.abort();
  });
  try {
    const page = await ctx.newPage();
    await page.setContent(safeHtml, { waitUntil: "load", timeout: 10_000 });
    const buf = await page.screenshot({ type: "jpeg", quality: 70, clip: { x: 0, y: 0, width: 1280, height: 720 } });
    return { dataUrl: `data:image/jpeg;base64,${buf.toString("base64")}`, blockedRequests: blocked };
  } finally {
    await ctx.close();
  }
}
