// Usage: npm run score -- original.png rebuild.png [masks.json]
import { readFileSync } from "node:fs";
import { score } from "./score.ts";

const [a, b, m] = process.argv.slice(2);
if (!a || !b) {
  console.error("Usage: npm run score -- original.png rebuild.png [masks.json]");
  process.exit(1);
}
const masks = m ? JSON.parse(readFileSync(m, "utf8")) : [];
console.log(await score(readFileSync(a), readFileSync(b), masks));
