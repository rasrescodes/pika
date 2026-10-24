import { describe, it, expect } from "vitest";
import { topCriterion, clearPairs, evaluate, jurySites, type JurySite } from "@/lib/jury";

const site = (slug: string, overall: number, heldOut = true, top: "design" | "creativity" = "creativity"): JurySite => ({
  slug, url: "", awwwardsUrl: "", heldOut, visualStyle: "x", layoutStyle: "y", hasThumb: false,
  jury: { design: top === "design" ? 8 : 7, usability: 7, creativity: top === "creativity" ? 8 : 7, content: 7, overall },
});

describe("jury maths", () => {
  it("finds the criterion the jury rewarded most", () => {
    expect(topCriterion({ design: 7.1, usability: 6.9, creativity: 7.8, content: 7.2 })).toBe("creativity");
  });

  it("keeps only pairs with a clear gap", () => {
    expect(clearPairs([site("a", 7.2), site("b", 7.3), site("c", 7.6)]).map(([x, y]) => x.slug + y.slug)).toEqual(["ac"]);
  });

  it("scores only held-out sites, and a perfect predictor gets zero error and full accuracy", () => {
    const sites = [site("a", 7.2), site("c", 7.6, true, "design"), site("t", 7.4, false)];
    const perfect = sites.map((s) => ({ slug: s.slug, scores: { design: s.jury.design, usability: s.jury.usability, creativity: s.jury.creativity, content: s.jury.content }, overall: s.jury.overall, note: "", ms: 0 }));
    const r = evaluate(perfect, sites);
    expect(r.n).toBe(2);
    expect(r.maeOverall).toBe(0);
    expect(r.topCriterionAccuracy).toBe(1);
    expect(r.pairAccuracy).toBe(1);
  });

  it("reads the real dataset: every site has all four criteria and an overall", () => {
    const all = jurySites();
    expect(all.length).toBeGreaterThan(200);
    expect(all.filter((s) => s.heldOut).length).toBeGreaterThanOrEqual(30);
    for (const s of all) expect(Object.values(s.jury).every((v) => typeof v === "number")).toBe(true);
  });
});
