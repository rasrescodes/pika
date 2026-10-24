import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { moveTo, applyOrder } from "@/lib/rank";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx|mjs|js)$/.test(f) ? [p] : [];
  });
}

describe("hackathon rule: every LLM call goes through Mubit", () => {
  it("no provider base URLs anywhere in app code", () => {
    const provider = /api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com|openrouter\.ai\/api|api\.groq\.com|api\.together\.xyz|api\.mistral\.ai/;
    const offenders = ["app", "lib", "src", "scripts"]
      .flatMap((d) => { try { return files(d); } catch { return []; } })
      .filter((f) => provider.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("only lib/llm.ts constructs a model client", () => {
    const users = ["app", "lib", "src"]
      .flatMap((d) => { try { return files(d); } catch { return []; } })
      .filter((f) => /new OpenAI\(/.test(readFileSync(f, "utf8")));
    expect(users).toEqual([path.join("lib", "llm.ts")]);
  });
});

describe("ranking", () => {
  it("moves a card to the top and keeps the rest in order", () => {
    expect(moveTo(["a", "b", "c", "d"], "c", 1)).toEqual(["c", "a", "b", "d"]);
    expect(moveTo(["a", "b", "c", "d"], "a", 3)).toEqual(["b", "c", "a", "d"]);
  });

  it("applies the art director's order over the Juror's", () => {
    const v = (o: number) => ({ scores: { design: 5, usability: 5, creativity: 5, content: 5 }, overall: o, note: "", tasteApplied: false, ms: 0 });
    const cards = [{ id: "a", verdict: v(9) }, { id: "b", verdict: v(8) }, { id: "c", verdict: v(7) }];
    expect(applyOrder(cards, ["c", "a", "b"]).map((c) => c.id)).toEqual(["c", "a", "b"]);
  });
});

describe("spend guard", () => {
  it("refuses calls over the daily cap before they reach Mubit", async () => {
    const { mkdirSync } = await import("node:fs");
    process.env.MUBIT_API_KEY = "test-key-not-real";
    process.env.MODEL = "test-model";
    process.env.PIKA_MAX_CALLS_PER_DAY = "0";
    mkdirSync("data/state", { recursive: true });
    const { chat, SpendCapError } = await import("@/lib/llm");
    await expect(chat({ system: "s", user: "u", maxTokens: 5 })).rejects.toBeInstanceOf(SpendCapError);
    delete process.env.MUBIT_API_KEY;
    delete process.env.MODEL;
    delete process.env.PIKA_MAX_CALLS_PER_DAY;
  });
});

describe("Mubit-only provenance", () => {
  it("accepts only https mubit.ai hosts as the base URL", async () => {
    const { isMubitUrl } = await import("@/lib/llm");
    expect(isMubitUrl("https://api.mubit.ai/openai/v1")).toBe(true);
    expect(isMubitUrl("https://api.openai.com/v1")).toBe(false);
    expect(isMubitUrl("https://mubit.ai.evil.example/v1")).toBe(false);
    expect(isMubitUrl("http://api.mubit.ai/openai/v1")).toBe(false);
  });

  it("refuses cross-site requests to mutating routes", async () => {
    const { crossSite } = await import("@/lib/guard");
    expect(crossSite(new Request("http://127.0.0.1:3000/api/reset", { method: "POST", headers: { "sec-fetch-site": "cross-site" } }))?.status).toBe(403);
    expect(crossSite(new Request("http://127.0.0.1:3000/api/reset", { method: "POST", headers: { "sec-fetch-site": "same-origin" } }))).toBeNull();
  });
});

describe("file route only serves screenshots", () => {
  it("refuses traversal and anything that is not a screenshot", async () => {
    const { servableFile } = await import("@/lib/loopData");
    expect(servableFile(["..", "..", ".env"])).toBeNull();
    expect(servableFile(["sites", "..", "..", ".env"])).toBeNull();
    expect(servableFile(["sites", "2xa-studio", "measure.json"])).toBeNull();
    expect(servableFile(["runs", "x", "y", "r1", "build.html"])).toBeNull();
    expect(servableFile(["sites", "2xa-studio", "original.png"])?.type).toBe("image/png");
  });
});
