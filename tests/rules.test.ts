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
