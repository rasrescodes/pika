// Generated HTML is untrusted model output. This is the first of four defences (then the CSP meta,
// the sandboxed iframe, and the JavaScript-off, network-blocked screenshot browser).

export const CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:";
const MAX_BYTES = 6 * 1024;

export function sanitise(input: string): string {
  let html = input.slice(0, MAX_BYTES * 2);

  // Whole elements that can execute, embed or navigate.
  html = html.replace(/<(script|iframe|object|embed|frame|frameset|applet|base|form)\b[\s\S]*?<\/\1\s*>/gi, "");
  html = html.replace(/<(script|iframe|object|embed|frame|frameset|applet|base|link|meta|form|input|button)\b[^>]*>/gi, "");

  // Inline event handlers and javascript: URLs.
  html = html.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  html = html.replace(/(href|src|xlink:href|action|formaction)\s*=\s*("|')?\s*javascript:[^"'>\s]*\2?/gi, "");

  // Any attribute URL that is not a data: URI or an in-page fragment.
  html = html.replace(/\s(href|src|xlink:href|srcset|poster|background)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi, (m, attr, _q, d, s, u) => {
    const v = (d ?? s ?? u ?? "").trim();
    return v.startsWith("data:") || v.startsWith("#") ? m : "";
  });

  // CSS that can fetch: @import, and url() that is not data:.
  html = html.replace(/@import[^;]*;?/gi, "");
  html = html.replace(/url\(\s*(['"]?)(?!data:)[^)]*\1\s*\)/gi, "none");

  return withCsp(html);
}

function withCsp(html: string): string {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${CSP}">`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (h) => `${h}${meta}`);
  return `<!doctype html><html><head>${meta}<meta charset="utf-8"></head><body style="margin:0">${html}</body></html>`;
}
