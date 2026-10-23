import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { JUROR_SYSTEM, parseReply, jurorUserMessage, mockJudge, overallOf, MAX_REPLY_CHARS, JurorError } from "@/lib/juror";
import { PRESETS } from "@/lib/brands";
import { FAMILIES } from "@/lib/families";
import { jurorOrder } from "@/lib/rank";
import type { TasteItem } from "@/lib/taste";

const pika = PRESETS[0];

describe("Juror contract (the Mubit task)", () => {
  it("system prompt is the constant file content, never templated", () => {
    expect(JUROR_SYSTEM).toBe(readFileSync("prompts/juror-v1.md", "utf8"));
    expect(JUROR_SYSTEM).not.toMatch(/\$\{|\{\{/);
  });

  it("brand and taste travel in the user message, not the system prompt", () => {
    const taste: TasteItem[] = [{ id: "t1", cardId: "c", family: "minimal", from: 7, to: 1, reason: "braver type", jurorScores: { design: 6, usability: 6, creativity: 5, content: 6 }, at: "now" }];
    const msg = jurorUserMessage(pika, taste);
    expect(msg).toContain("braver type");
    expect(msg).toContain("Pika");
    expect(JUROR_SYSTEM).not.toContain("braver type");
  });

  it("accepts a valid short reply and computes overall in the app", () => {
    const r = parseReply('{"design":8,"usability":7,"creativity":9,"content":6,"note":"Bold type, weak contrast."}');
    expect(overallOf(r)).toBe(7.5);
  });

  it("rejects invalid JSON, wrong shapes and over-long replies", () => {
    expect(() => parseReply("not json")).toThrow(JurorError);
    expect(() => parseReply('{"design":11,"usability":7,"creativity":9,"content":6,"note":"x"}')).toThrow(JurorError);
    expect(() => parseReply('{"design":8,"usability":7,"creativity":9,"content":6}')).toThrow(JurorError);
    expect(() => parseReply("x".repeat(MAX_REPLY_CHARS + 1))).toThrow(JurorError);
  });
});

describe("MOCK taste effect (controlled check behind JR-2)", () => {
  it("moving the #7 card to #1 makes that family #1 in the next batch", () => {
    const rank = (taste: TasteItem[]) =>
      jurorOrder(FAMILIES.map((f) => ({ id: f, family: f, verdict: mockJudge(pika, f, taste, taste.length > 0) })));
    const before = rank([]);
    const seventh = before[6];
    const taste: TasteItem[] = [{ id: "t", cardId: seventh.id, family: seventh.family, from: 7, to: 1, reason: "", jurorScores: seventh.verdict.scores, at: "now" }];
    const after = rank(taste);
    expect(after.findIndex((c) => c.family === seventh.family)).toBe(0);
  });
});
