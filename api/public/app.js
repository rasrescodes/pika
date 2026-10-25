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

// Previews: a 1280 x 720 page scaled to the pane, scripts off (sandbox without allow-scripts), no outside requests (CSP).
function preview(holder, html) {
  holder.replaceChildren();
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "");
  frame.setAttribute("title", "Preview");
  frame.setAttribute("loading", "lazy");
  frame.srcdoc = html;
  holder.append(frame);
  const fit = () => (frame.style.transform = `scale(${holder.clientWidth / 1280})`);
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
