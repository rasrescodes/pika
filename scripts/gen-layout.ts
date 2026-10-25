// Layout check for generated sections: renders each page (JavaScript off, as on the Wall) and counts text that is
// covered by another element, overlaps other text, or runs outside the 1280x720 frame. The slop detector reads the
// HTML and can't see these; the fine-tuned student's worst pages fail exactly here.
// Usage: npx tsx scripts/gen-layout.ts <tag> [tag...]   (adds `layout` and `layoutIssues` to each results row)
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { sanitise } from "../lib/sanitise";

type Issue = { kind: "covered" | "overlap" | "clipped"; text: string };

// Runs in the page. Text elements are those with their own non-blank text.
function inspect(): Issue[] {
  const els = [...document.querySelectorAll("body *")].filter((el) =>
    [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? "").trim().length > 0),
  ) as HTMLElement[];
  const boxes = els
    .map((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return { el, r: range.getBoundingClientRect(), text: (el.textContent ?? "").trim().slice(0, 40) };
    })
    // Text of three characters or fewer (a big "4", an arrow) is treated as decoration: designers bleed and layer it on purpose.
    .filter((b) => b.text.replace(/\s/g, "").length > 3)
    .filter((b) => b.r.width > 2 && b.r.height > 2 && getComputedStyle(b.el).visibility !== "hidden" && Number(getComputedStyle(b.el).opacity) > 0.05);
  const issues: Issue[] = [];
  for (const b of boxes) {
    const { r } = b;
    if (r.left < -2 || r.top < -2 || r.right > 1282 || r.bottom > 722) issues.push({ kind: "clipped", text: b.text });
    // Covered: at most points inside the text box, the topmost element is not this element or inside it.
    const pts = [[0.5, 0.5], [0.25, 0.3], [0.75, 0.3], [0.25, 0.7], [0.75, 0.7]].map(([x, y]) => [r.left + r.width * x, r.top + r.height * y]);
    const hidden = pts.filter(([x, y]) => {
      if (x < 0 || y < 0 || x > 1280 || y > 720) return false;
      const top = document.elementFromPoint(x, y);
      return top && top !== b.el && !b.el.contains(top) && !top.contains(b.el);
    }).length;
    if (hidden >= 3) issues.push({ kind: "covered", text: b.text });
  }
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], c = boxes[j];
      if (a.el.contains(c.el) || c.el.contains(a.el)) continue;
      const w = Math.min(a.r.right, c.r.right) - Math.max(a.r.left, c.r.left);
      const h = Math.min(a.r.bottom, c.r.bottom) - Math.max(a.r.top, c.r.top);
      const small = Math.min(a.r.width * a.r.height, c.r.width * c.r.height);
      if (w > 0 && h > 0 && (w * h) / small > 0.15) issues.push({ kind: "overlap", text: `${a.text} / ${c.text}` });
    }
  return issues;
}

const browser = await chromium.launch();
for (const tag of process.argv.slice(2)) {
  const f = `data/gen/${tag}/results.jsonl`;
  const rows = readFileSync(f, "utf8").trim().split("\n").map((l) => JSON.parse(l));
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 720 }, offline: true });
  await ctx.route("**/*", (route) => (/^(data|about):/.test(route.request().url()) ? route.continue() : route.abort()));
  const page = await ctx.newPage();
  for (const row of rows) {
    await page.setContent(sanitise(readFileSync(`data/gen/${tag}/${row.id}.html`, "utf8")), { waitUntil: "load", timeout: 10_000 });
    // JavaScript is off for the section, so run the check as a page-level evaluate (Playwright's own channel).
    const issues: Issue[] = await page.evaluate(inspect);
    row.layout = issues.length;
    row.layoutIssues = issues.slice(0, 8);
  }
  await ctx.close();
  writeFileSync(f, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
  const any = rows.filter((r) => r.layout > 0).length;
  const broken = rows.filter((r) => r.layout >= 5).length;
  console.log(`${tag}: ${rows.length} pages, ${any} with any layout issue, ${broken} broken (5 or more)`);
}
await browser.close();
