// The same user message as lib/generator.ts, so a trained student drops into generate() unchanged.
import { brandSummary, fontStack, type Brand } from "../lib/brands";
import { FAMILY_BRIEF, type Family } from "../lib/families";
export const userMessage = (b: Brand, f: Family) =>
  `${brandSummary(b)} Subline: "${b.subline}". Action: "${b.action}". Display font stack: ${fontStack(b.displayFont)}. Body font stack: ${fontStack(b.bodyFont)}.\nLayout direction: ${FAMILY_BRIEF[f]}.`;
