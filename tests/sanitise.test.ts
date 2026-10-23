import { describe, it, expect } from "vitest";
import { sanitise, CSP } from "@/lib/sanitise";

const vectors: [string, string][] = [
  ["script tag", '<script>alert(1)</script><h1>x</h1>'],
  ["inline handler", '<img src="data:image/png;base64,AA" onerror="alert(1)">'],
  ["javascript url", '<a href="javascript:alert(1)">x</a>'],
  ["external img", '<img src="https://evil.example/p.png">'],
  ["css import", "<style>@import url(https://evil.example/a.css);</style>"],
  ["css url", "<div style=\"background:url('https://evil.example/b.png')\"></div>"],
  ["svg href", '<svg><image href="https://evil.example/c.png"/></svg>'],
  ["svg xlink", '<svg><use xlink:href="https://evil.example/s.svg#a"/></svg>'],
  ["meta refresh", '<meta http-equiv="refresh" content="0;url=https://evil.example">'],
  ["link stylesheet", '<link rel="stylesheet" href="https://evil.example/x.css">'],
  ["iframe", '<iframe src="https://evil.example"></iframe>'],
  ["object", '<object data="https://evil.example/x.swf"></object>'],
];

describe("sanitise", () => {
  for (const [name, html] of vectors) {
    it(`removes ${name}`, () => {
      const out = sanitise(html);
      expect(out).not.toMatch(/evil\.example/);
      expect(out).not.toMatch(/<script|javascript:|onerror=|@import|<iframe|<object/i);
    });
  }

  it("keeps data: images and inline styles, and injects the CSP first", () => {
    const out = sanitise('<div style="color:red"><img src="data:image/png;base64,AA"></div>');
    expect(out).toContain('src="data:image/png;base64,AA"');
    expect(out).toContain("color:red");
    expect(out).toContain(CSP);
    expect(out.indexOf("Content-Security-Policy")).toBeLessThan(out.indexOf("<div"));
  });
});
