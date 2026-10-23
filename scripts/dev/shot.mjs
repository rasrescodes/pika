import { chromium } from "playwright";
const [,, url, out, w = "1440", h = "900", gen = "1"] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs = [];
p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
p.on("pageerror", (e) => errs.push(String(e)));
await p.goto(url, { waitUntil: "networkidle" });
if (gen === "1") { await p.click("[data-testid=generate]"); await p.waitForSelector("[data-testid=batch-done]", { timeout: 60000 }); await p.waitForTimeout(600); }
await p.screenshot({ path: out, fullPage: false });
console.log("errors:", JSON.stringify(errs), "overflowX:", await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
await b.close();
