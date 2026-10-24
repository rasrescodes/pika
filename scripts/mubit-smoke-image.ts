// Proves an image call reaches Claude through Mubit. Usage: npm run smoke:image
// Then check the call (with its image) in the Mubit console under Requests.
import { renderHtml, closeBrowser } from "../src/render.ts";
import { ask, image, text, MODELS } from "../src/mubit.ts";

const png = await renderHtml(
  `<!doctype html><body style="margin:0;background:#0b3d2e;display:grid;place-items:center;height:900px">
   <h1 style="font:700 160px/1 Georgia,serif;color:#f4d35e;margin:0">Pika</h1></body>`,
);
await closeBrowser();

const reply = await ask({
  model: MODELS.describer,
  system: "Name the background colour and the word shown, as: colour hex, word.",
  content: [image(png), text("Smoke test.")],
  maxTokens: 50,
});
console.log(`${MODELS.describer} via Mubit in ${reply.ms} ms (${reply.requestId}):`, reply.text);
