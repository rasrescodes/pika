// Renders HTML exactly the way scripts/capture shoots the originals, so the comparison is fair.
import { chromium, type Browser } from "playwright";
import { measurePage, type Measure } from "./measure.ts";

export const VIEWPORT = { width: 1440, height: 900 };

let browser: Browser | undefined;

export async function render(html: string): Promise<{ png: Buffer; measure: Measure }> {
  browser ??= await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
    colorScheme: "light",
    locale: "en-GB",
  });
  try {
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 30_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    const png = await page.screenshot({ type: "png" });
    return { png, measure: await measurePage(page) };
  } finally {
    await context.close();
  }
}

export async function renderHtml(html: string): Promise<Buffer> {
  return (await render(html)).png;
}

export async function closeBrowser() {
  await browser?.close();
  browser = undefined;
}
