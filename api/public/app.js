// Pika UI front end: loads examples, calls /v1/check and /v1/improve, and shows sandboxed previews.
const $ = (id) => document.getElementById(id);
const area = $("html");
const status = $("status");
let improved = "";

// The curl examples show this server's own address.
for (const id of ["curl-check", "curl-improve"]) $(id).textContent = $(id).textContent.replace("https://pika.example", location.origin);

function say(text, isError = false) {
  status.textContent = text;
  status.classList.toggle("error", isError);
}

async function loadSample(name) {
  const res = await fetch(`/samples/${name}.html`);
  area.value = await res.text();
  document.querySelectorAll(".chip[data-sample]").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.sample === name)));
}
$("hero-cta").addEventListener("click", () => setTimeout(() => area.focus({ preventScroll: true }), 400));
document.querySelectorAll("[data-sample]").forEach((el) =>
  el.addEventListener("click", async (e) => {
    if (el.tagName === "A") e.preventDefault();
    await loadSample(el.dataset.sample);
    if (el.tagName === "A") $("try").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    area.focus({ preventScroll: true });
  }),
);

// Previews: the page at 1280px wide, scaled to the pane and scrollable inside it; scripts off (sandbox without allow-scripts).
function preview(holder, html) {
  holder.replaceChildren();
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "");
  frame.setAttribute("title", "Preview");
  frame.setAttribute("loading", "lazy");
  frame.srcdoc = html;
  holder.append(frame);
  const fit = () => {
    const k = holder.clientWidth / 1280;
    frame.style.transform = `scale(${k})`;
    frame.style.height = `${holder.clientHeight / k}px`;
  };
  new ResizeObserver(fit).observe(holder);
  fit();
}

function listFindings(ul, result) {
  ul.replaceChildren();
  // Several findings can share a rule; show each rule once with a count.
  const counts = new Map();
  for (const f of result.findings) counts.set(f.rule, { f, n: (counts.get(f.rule)?.n ?? 0) + 1 });
  for (const { f, n } of counts.values()) {
    const li = document.createElement("li");
    li.className = f.category === "slop" ? "slop" : "";
    li.textContent = `${f.name || f.rule}${n > 1 ? ` x${n}` : ""}`;
    if (f.description) li.title = f.description;
    ul.append(li);
  }
  for (const f of result.brandNotes ?? []) {
    const li = document.createElement("li");
    li.className = "note";
    li.textContent = `Brand note: ${f.name || f.rule}`;
    li.title = "Judges your brand's own colours or fonts, so it is not counted.";
    ul.append(li);
  }
  if (!ul.children.length) {
    const li = document.createElement("li");
    li.className = "none";
    li.textContent = "No findings.";
    ul.append(li);
  }
}

function setNum(el, n, good) {
  el.textContent = String(n);
  $(el.id.replace("num", "word")).textContent = n === 1 ? "finding" : "findings";
  el.classList.toggle("good", !!good);
}

async function call(path, payload) {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const data = await res.json().catch(() => ({ error: "The server sent an unexpected reply." }));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
  return data;
}

function busy(on) {
  $("check").disabled = on;
  $("improve").disabled = on;
}

function needHtml() {
  const html = area.value.trim();
  if (!html) {
    say("Paste a section first, or load an example.", true);
    area.focus();
  }
  return html;
}

$("check").addEventListener("click", async () => {
  const html = needHtml();
  if (!html) return;
  busy(true);
  say("Checking against 62 design rules...");
  try {
    const r = await call("/v1/check", { html });
    $("results").hidden = false;
    $("after-pane").hidden = true;
    $("thinking").hidden = true;
    preview($("b-frame"), html);
    setNum($("b-num"), r.findings.length);
    listFindings($("b-list"), r);
    say(r.findings.length ? `${r.findings.length} findings in ${r.ms} ms. Redesign it to fix them.` : `No findings in ${r.ms} ms. A redesign can still tighten composition and type.`);
  } catch (e) {
    say(e.message, true);
  } finally {
    busy(false);
  }
});

$("improve").addEventListener("click", async () => {
  const html = needHtml();
  if (!html) return;
  busy(true);
  $("results").hidden = false;
  $("after-pane").hidden = true;
  $("thinking").hidden = false;
  preview($("b-frame"), html);
  say("Checking, then redesigning...");
  try {
    const r = await call("/v1/improve", { html, record: $("record").checked });
    improved = r.html;
    setNum($("b-num"), r.before.findings.length);
    listFindings($("b-list"), r.before);
    setNum($("a-num"), r.after.findings.length, r.after.findings.length < r.before.findings.length);
    listFindings($("a-list"), r.after);
    $("thinking").hidden = true;
    $("after-pane").hidden = false;
    preview($("a-frame"), r.html);
    $("a-meta").textContent = `${(r.ms / 1000).toFixed(1)} s, about $${r.usage.costUsd.toFixed(3)}, ${r.model} through Mubit${r.recorded ? "" : ", not kept for training"}.`;
    say(`Findings went from ${r.before.findings.length} to ${r.after.findings.length}.`);
    refreshQuota();
  } catch (e) {
    $("thinking").hidden = true;
    say(e.message, true);
  } finally {
    busy(false);
  }
});

$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(improved);
    say("Copied the redesigned HTML.");
  } catch {
    say("Copying was blocked by the browser; use Download instead.", true);
  }
});
$("download").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([improved], { type: "text/html" }));
  a.download = "pika-redesign.html";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

async function refreshQuota() {
  try {
    const s = await (await fetch("/v1/status")).json();
    $("quota").textContent = s.model
      ? `Checking is free. ${s.redesignsLeftToday} redesigns left today.`
      : "Checking is free. Redesigns are switched off on this server.";
    if (!s.model) $("improve").disabled = true;
  } catch {}
}
refreshQuota();

// Before and after slider: drag, click or use the arrow keys.
const stage = $("stage");
const handle = $("handle");
function setPos(pct) {
  pct = Math.max(0, Math.min(100, pct));
  stage.style.setProperty("--pos", `${pct}%`);
  handle.setAttribute("aria-valuenow", String(Math.round(pct)));
}
function fromEvent(e) {
  const r = stage.getBoundingClientRect();
  setPos(((e.clientX - r.left) / r.width) * 100);
}
let dragging = false;
stage.addEventListener("pointerdown", (e) => {
  dragging = true;
  stage.setPointerCapture(e.pointerId);
  fromEvent(e);
});
stage.addEventListener("pointermove", (e) => dragging && fromEvent(e));
stage.addEventListener("pointerup", () => (dragging = false));
stage.addEventListener("pointercancel", () => (dragging = false));
handle.addEventListener("keydown", (e) => {
  const now = Number(handle.getAttribute("aria-valuenow"));
  if (e.key === "ArrowLeft") setPos(now - 5);
  else if (e.key === "ArrowRight") setPos(now + 5);
  else return;
  e.preventDefault();
});
setPos(50);

// Two worked examples share the slider, the numbers band and the whole-page scrollers.
const EXAMPLES = {
  nimbus: {
    url: "nimbus.example", before: "/compare-before.jpg", after: "/compare-after.jpg", pageBefore: "/page-before.jpg", pageAfter: "/page-after.jpg",
    nBefore: 43, nAfter: 0, secs: 84, cost: "$0.13",
    caption: "Drag to compare. Same words, same colours, nothing invented.",
    altBefore: "Before: purple gradients, gradient headline, glowing buttons, emoji icons and glass cards.",
    altAfter: "After: the same page with calm type, an asymmetric features section and no gradients or glows.",
    removed: [["Low contrast text", 11], ["Gradient text", 10], ["Side-stripe cards", 6], ["Icon tiles above headings", 6], ["Glowing shadows", 5], ["Eyebrow labels", 3], ["AI colour palette", 1], ["Filler words", 1]],
  },
  kairo: {
    url: "kairo.example", before: "/kairo-compare-before.jpg", after: "/kairo-compare-after.jpg", pageBefore: "/kairo-page-before.jpg", pageAfter: "/kairo-page-after.jpg",
    nBefore: 38, nAfter: 3, secs: 176, cost: "$0.31",
    caption: "Built from a published vibe-coding tutorial prompt. The yellow labels mark what the check found. Three small spacing notes remain after.",
    altBefore: "Before, with the check's labels: glowing buttons, gradient headline, nested cards and low contrast text.",
    altAfter: "After: a plain dark page with one accent colour, a left-aligned headline and a flat board.",
    removed: [["Glowing shadows", 18], ["Low contrast text", 7], ["Icon tiles above headings", 6], ["Gradient text", 4], ["Skipped heading level", 1], ["AI colour palette", 1], ["Pulsing status dot", 1]],
  },
};
function showExample(name) {
  const ex = EXAMPLES[name];
  const all = (key) => document.querySelectorAll(`[data-ex="${key}"]`);
  all("url").forEach((el) => (el.textContent = ex.url));
  all("before").forEach((el) => Object.assign(el, { src: ex.before, alt: ex.altBefore }));
  all("after").forEach((el) => Object.assign(el, { src: ex.after, alt: ex.altAfter }));
  all("page-before").forEach((el) => Object.assign(el, { src: ex.pageBefore, alt: `The full ${ex.url} page before.` }));
  all("page-after").forEach((el) => Object.assign(el, { src: ex.pageAfter, alt: `The full ${ex.url} page after.` }));
  all("n-before").forEach((el) => (el.textContent = ex.nBefore));
  all("n-after").forEach((el) => (el.textContent = ex.nAfter));
  all("secs").forEach((el) => (el.textContent = ex.secs));
  all("cost").forEach((el) => (el.textContent = ex.cost));
  all("caption").forEach((el) => (el.textContent = ex.caption));
  all("removed").forEach((ul) =>
    ul.replaceChildren(...ex.removed.map(([label, n]) => {
      const li = document.createElement("li");
      const b = document.createElement("b");
      b.textContent = n;
      li.append(`${label} `, b);
      return li;
    })),
  );
  document.querySelectorAll("[data-ex-pick]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.exPick === name)));
  document.querySelectorAll("[data-sync]").forEach((el) => (el.scrollTop = 0));
  loadSpots(name);
}
document.querySelectorAll("[data-ex-pick]").forEach((b) => b.addEventListener("click", () => showExample(b.dataset.exPick)));

// Detector labels: each finding the check reported, drawn where it was found on the before page.
// Positions come from a 1280px-wide render; the slider shows the top 1500px, the scroller the whole page.
const spotCache = {};
const tip = document.createElement("div");
tip.className = "spot-tip";
tip.hidden = true;
tip.setAttribute("role", "tooltip");
tip.id = "spot-tip";
document.body.append(tip);
let pinned = null;

function showTip(btn, findings) {
  tip.replaceChildren(
    ...findings.map((f) => {
      const box = document.createElement("div");
      const h = document.createElement("h4");
      h.textContent = f.n;
      box.append(h);
      if (f.d) {
        const d = document.createElement("p");
        d.className = "d";
        d.textContent = f.d;
        box.append(d);
      }
      const why = document.createElement("p");
      why.textContent = f.why;
      box.append(why);
      return box;
    }),
  );
  tip.hidden = false;
  const r = btn.getBoundingClientRect();
  const t = tip.getBoundingClientRect();
  const left = Math.min(Math.max(16, r.left), innerWidth - t.width - 16);
  const below = r.bottom + 8 + t.height < innerHeight;
  tip.style.left = `${left}px`;
  tip.style.top = `${below ? r.bottom + 8 : Math.max(16, r.top - t.height - 8)}px`;
}
function hideTip() {
  tip.hidden = true;
  pinned?.setAttribute("aria-expanded", "false");
  pinned = null;
}
function spotButton(cls, findings) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = cls;
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-describedby", "spot-tip");
  btn.setAttribute("aria-label", findings.map((f) => f.n).join(", "));
  btn.addEventListener("pointerdown", (e) => e.stopPropagation()); // keep the slider from dragging
  btn.addEventListener("mouseenter", () => !pinned && showTip(btn, findings));
  btn.addEventListener("mouseleave", () => !pinned && (tip.hidden = true));
  btn.addEventListener("focus", () => !pinned && showTip(btn, findings));
  btn.addEventListener("blur", () => !pinned && (tip.hidden = true));
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const same = pinned === btn;
    hideTip();
    if (same) return;
    pinned = btn;
    btn.setAttribute("aria-expanded", "true");
    showTip(btn, findings);
  });
  return btn;
}
function drawSpots(layer, data, cropH) {
  const h = Math.min(cropH ?? data.h, data.h);
  layer.style.aspectRatio = `${data.w} / ${h}`;
  const pct = (v, of) => `${(v / of) * 100}%`;
  const nodes = data.spots
    .filter((s) => s.y < h - 8)
    .map((s) => {
      const names = [...new Set(s.f.map((f) => f.n))];
      const btn = spotButton("spot", s.f);
      const label = document.createElement("span");
      label.textContent = names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0];
      btn.append(label);
      Object.assign(btn.style, { left: pct(s.x, data.w), top: pct(s.y, h), width: pct(s.w, data.w), height: pct(Math.min(s.h, h - s.y), h) });
      return btn;
    });
  const bar = document.createElement("div");
  bar.className = "spot-pagebar";
  for (const f of data.page) {
    const b = spotButton("spot-page", [f]);
    b.textContent = f.n;
    bar.append(b);
  }
  // Page-wide findings get a bar on the whole-page view only; on the slider it would cover the counts.
  layer.replaceChildren(...nodes, ...(data.page.length && !cropH ? [bar] : []));
}
async function loadSpots(name) {
  hideTip();
  try {
    spotCache[name] ??= await (await fetch(`/${name}-spots.json`)).json();
  } catch {
    return document.querySelectorAll("[data-spots]").forEach((l) => l.replaceChildren());
  }
  const data = spotCache[name];
  document.querySelectorAll('[data-spots="compare"]').forEach((l) => drawSpots(l, data, 1500));
  document.querySelectorAll('[data-spots="page"]').forEach((l) => drawSpots(l, data));
}
document.addEventListener("click", (e) => !tip.contains(e.target) && hideTip());
document.addEventListener("keydown", (e) => e.key === "Escape" && hideTip());
addEventListener("scroll", () => pinned && hideTip(), { passive: true, capture: true });
$("spots-toggle").addEventListener("click", (e) => {
  const on = e.currentTarget.getAttribute("aria-pressed") !== "true";
  e.currentTarget.setAttribute("aria-pressed", String(on));
  e.currentTarget.textContent = on ? "Labels on" : "Labels off";
  document.querySelectorAll("[data-spots]").forEach((l) => l.classList.toggle("off", !on));
  hideTip();
});
loadSpots("nimbus");

// The two whole-page scrollers move together.
const scrollers = [...document.querySelectorAll("[data-sync]")];
let syncing = false;
for (const el of scrollers)
  el.addEventListener("scroll", () => {
    if (syncing) return;
    syncing = true;
    const t = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
    for (const other of scrollers) if (other !== el) other.scrollTop = t * (other.scrollHeight - other.clientHeight);
    requestAnimationFrame(() => (syncing = false));
  });

// Cards enter once as they come into view; the header gains a rule once the page scrolls.
const io = new IntersectionObserver(
  (entries) => entries.forEach((en) => en.isIntersecting && (en.target.classList.add("in"), io.unobserve(en.target))),
  { rootMargin: "0px 0px -8% 0px" },
);
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 60}ms`;
  io.observe(el);
});
const headerEl = document.querySelector(".top");
addEventListener("scroll", () => headerEl.classList.toggle("scrolled", scrollY > 8), { passive: true });
