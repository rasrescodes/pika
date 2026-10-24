"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Header from "./Header";
import CorrectionSheet, { type Pending } from "./CorrectionSheet";
import TasteMemory from "./TasteMemory";
import styles from "./Wall.module.css";
import type { Card, WallState } from "@/lib/wall";
import type { Brand } from "@/lib/brands";
import type { TasteItem } from "@/lib/taste";
import type { Mode } from "@/lib/llm";

type Initial = { mode: Mode; brand: Brand; wall: WallState; taste: TasteItem[] };
type Judged = Card & { verdict: NonNullable<Card["verdict"]> };

function order(cards: Card[], pinned: string[]): Card[] {
  const judged = cards.filter((c): c is Judged => !!c.verdict);
  const failed = cards.filter((c) => !c.verdict);
  const byId = new Map(judged.map((c) => [c.id, c]));
  const top = pinned.map((id) => byId.get(id)).filter((c): c is Judged => !!c);
  const rest = judged
    .filter((c) => !pinned.includes(c.id))
    .sort((a, b) => b.verdict.overall - a.verdict.overall || b.verdict.scores.design - a.verdict.scores.design || a.id.localeCompare(b.id));
  return [...top, ...rest, ...failed];
}

export default function Wall({ initial }: { initial: Initial }) {
  const [cards, setCards] = useState<Card[]>(initial.wall?.cards ?? []);
  const [pinned, setPinned] = useState<string[]>(initial.wall?.order ?? []);
  const [taste, setTaste] = useState<TasteItem[]>(initial.taste);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(!!initial.wall);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overSlot, setOverSlot] = useState<number | null>(null);
  const [focus, setFocus] = useState<Card | null>(null);
  const [painted, setPainted] = useState<Set<string>>(new Set());

  const ranked = useMemo(() => order(cards, pinned), [cards, pinned]);
  const jurorBest = useMemo(() => order(cards, [])[0]?.id, [cards]);
  const judgedCount = cards.filter((c) => c.verdict).length;

  // FLIP: animate cards from their old position to their new one when the ranking changes.
  const refs = useRef(new Map<string, HTMLElement>());
  const last = useRef(new Map<string, DOMRect>());
  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    refs.current.forEach((el, id) => {
      const prev = last.current.get(id);
      const now = el.getBoundingClientRect();
      if (prev && !reduce && (prev.left !== now.left || prev.top !== now.top)) {
        el.animate(
          [{ transform: `translate(${prev.left - now.left}px, ${prev.top - now.top}px)` }, { transform: "translate(0, 0)" }],
          { duration: 280, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
        );
      }
      last.current.set(id, now);
    });
  }, [ranked]);

  useEffect(() => {
    (window as unknown as { __pika?: object }).__pika = { batchMs: initial.wall?.batchMs };
  }, [initial.wall]);

  // A judge never meets an empty Wall: in MOCK (free) the first batch starts by itself.
  // With a real key it waits for a click, so nothing spends money without someone asking.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!autoStarted.current && initial.mode === "MOCK" && !initial.wall) {
      autoStarted.current = true;
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    setRunning(true);
    setDone(false);
    setError(null);
    setCards([]);
    setPinned([]);
    setPainted(new Set());
    last.current.clear();
    const started = performance.now();
    try {
      const res = await fetch("/api/batch", { method: "POST" });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done: end } = await reader.read();
        if (end) break;
        buf += dec.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() ?? "";
        for (const ev of events) {
          const type = ev.match(/^event: (.*)$/m)?.[1];
          const data = ev.match(/^data: (.*)$/m)?.[1];
          if (!type || !data) continue;
          if (type === "card") setCards((cs) => [...cs, JSON.parse(data) as Card]);
          if (type === "done") {
            const ms = Math.round(performance.now() - started);
            (window as unknown as { __pika?: object }).__pika = { batchMs: ms };
            setBatchSecs((ms / 1000).toFixed(1));
            setDone(true);
          }
          if (type === "failed") setError(JSON.parse(data).message);
        }
      }
    } catch {
      setError("The batch could not finish. Check the server log and try again.");
    } finally {
      setRunning(false);
    }
  }

  async function reset() {
    await fetch("/api/reset", { method: "POST" });
    setCards([]);
    setPinned([]);
    setTaste([]);
    setDone(false);
    setError(null);
  }

  async function saveCorrection(p: Pending, reason: string, scores?: Pending["scores"]) {
    const res = await fetch("/api/correction", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cardId: p.cardId, to: p.to, reason, scores }),
    });
    if (!res.ok) {
      setError("That correction could not be saved.");
      return;
    }
    const body = (await res.json()) as { wall: NonNullable<WallState>; taste: TasteItem[] };
    setPinned(body.wall.order);
    setTaste(body.taste);
    setPending(null);
  }

  // Pointer drag: from a card's handle onto any slot.
  function startDrag(e: React.PointerEvent, id: string) {
    if (e.button !== 0) return;
    e.preventDefault();
    setDragId(id);
    const slotAt = (x: number, y: number) => {
      const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-slot]");
      return el ? Number(el.dataset.slot) : null;
    };
    const move = (ev: PointerEvent) => setOverSlot(slotAt(ev.clientX, ev.clientY));
    const sx = e.clientX, sy = e.clientY;
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      const to = slotAt(ev.clientX, ev.clientY);
      const from = ranked.findIndex((c) => c.id === id) + 1;
      setDragId(null);
      setOverSlot(null);
      // A click without movement opens the section full size; a drag to another slot is a correction.
      if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) {
        const card = ranked.find((c) => c.id === id);
        if (card?.html) setFocus(card);
        return;
      }
      if (to && to !== from) setPending({ cardId: id, from, to, kind: "move" });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function onCardKey(e: React.KeyboardEvent, id: string, position: number) {
    if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown" && e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    e.preventDefault();
    const to = e.key === "ArrowUp" || e.key === "ArrowLeft" ? Math.max(1, position - 1) : Math.min(ranked.length, position + 1);
    if (to !== position) setPending({ cardId: id, from: position, to, kind: "move" });
  }

  const [batchSecs, setBatchSecs] = useState<string | null>(initial.wall ? (initial.wall.batchMs / 1000).toFixed(1) : null);
  const pendingCard = pending ? ranked.find((c) => c.id === pending.cardId) : undefined;

  return (
    <>
      <Header current="wall">
        <span data-testid="mode-chip" className={styles.chip} data-mode={initial.mode} title={initial.mode === "MOCK" ? "No Mubit key configured: fixture sections and a rule-based Juror" : "Every call goes through Mubit"}>
          {initial.mode === "MOCK" ? "MOCK" : "LIVE · MUBIT"}
        </span>
        <button className="btn btn-quiet" data-testid="reset" onClick={reset} disabled={running}>
          Reset
        </button>
        <button className="btn" data-testid="generate" onClick={generate} disabled={running}>
          {running ? `Judging ${judgedCount} of 12` : "Generate batch"}
        </button>
      </Header>

      <main className={styles.main}>
        <section className={styles.wallCol} aria-labelledby="wall-title">
          <div className={styles.intro}>
            <p className="marker">The Wall</p>
            <h1 id="wall-title" className={styles.title}>
              {initial.brand.name}, judged by the <em>Juror</em>
            </h1>
            <p className={styles.dek}>
              Twelve hero sections, scored like an Awwwards jury on design, usability, creativity and content. Disagree? Drag a card or move it to the top, say why, and the next batch is judged your way.
            </p>
          </div>

          {error && <p role="alert" className={styles.error}>{error}</p>}
          {pinned.length > 0 && ranked.length > 0 && (
            <p className={styles.orderNote}>Order set by you. Scores are the Juror&apos;s; your next batch is judged with your notes.</p>
          )}

          {ranked.length === 0 && !running ? (
            <div className={styles.empty}>
              <p>No designs on the wall yet.</p>
              <button className="btn" onClick={generate}>Generate the first batch</button>
            </div>
          ) : (
            <ol className={styles.grid} data-testid="wall" aria-label="Designs ranked by the Juror">
              {ranked.map((card, i) => {
                const pos = i + 1;
                const v = card.verdict;
                return (
                  <li key={card.id} data-slot={pos} data-testid={`slot-${pos}`} className={styles.slot} data-over={overSlot === pos || undefined}>
                    <article
                      ref={(el) => { if (el) refs.current.set(card.id, el); else refs.current.delete(card.id); }}
                      data-testid="card"
                      data-card-id={card.id}
                      data-family={card.family}
                      data-rank={pos}
                      data-scored={v ? "true" : "false"}
                      data-taste-applied={v?.tasteApplied ? "true" : "false"}
                      className={styles.card}
                      data-dragging={dragId === card.id || undefined}
                      tabIndex={0}
                      onKeyDown={(e) => onCardKey(e, card.id, pos)}
                      aria-label={`Rank ${pos}, ${card.family} layout${v ? `, scored ${v.overall}` : ""}. Alt and arrow keys to move.`}
                    >
                      <div className={styles.preview} onPointerDown={(e) => startDrag(e, card.id)} data-testid="drag-handle" title="Click to view full size, drag to re-rank">
                        {card.html ? (
                          <iframe sandbox="" srcDoc={card.html} title={`${card.family} section`} tabIndex={-1} onLoad={() => setPainted((s) => new Set(s).add(card.id))} />
                        ) : (
                          <div className={styles.failed}>Not judged</div>
                        )}
                      </div>
                      <div className={styles.meta}>
                        <div className={styles.rankRow}>
                          <span data-testid="rank-badge" className={`num ${styles.rank}`}>
                            {pos}
                          </span>
                          {card.id === jurorBest && v && <span data-testid="rank-1" className={`${styles.best} pulse`} key={`best-${card.id}`}><Bulb />Best new design</span>}
                          {pos === 1 && pinned[0] === card.id && card.id !== jurorBest && <span className={styles.pick}>Your pick</span>}
                          {v && <span className={`num ${styles.score}`}>{v.overall.toFixed(1)}</span>}
                        </div>
                        {v ? (
                          <>
                            <dl className={styles.criteria}>
                              {(["design", "usability", "creativity", "content"] as const).map((k) => (
                                <div key={k}>
                                  <dt>{k}</dt>
                                  <dd className="num">{v.scores[k]}</dd>
                                </div>
                              ))}
                            </dl>
                            <p className={styles.note}>{v.note}</p>
                            <div className={styles.actions}>
                              {pos !== 1 && (
                                <button className={styles.link} data-testid="promote" onClick={() => setPending({ cardId: card.id, from: pos, to: 1, kind: "move" })}>
                                  Move to top
                                </button>
                              )}
                              <button className={styles.link} data-testid="rescore" onClick={() => setPending({ cardId: card.id, from: pos, to: pos, kind: "score", scores: v.scores })}>
                                Score it yourself
                              </button>
                            </div>
                          </>
                        ) : (
                          <p className={styles.note}>{card.error}</p>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ol>
          )}
          {done && !running && ranked.length > 0 && ranked.every((c) => !c.html || painted.has(c.id)) && (
            <p data-testid="batch-done" className={styles.status}>
              {judgedCount} of {cards.length} designs judged{batchSecs ? ` in ${batchSecs} s` : ""}{cards.length > judgedCount ? `; ${cards.length - judgedCount} could not be judged and are shown at the end` : ""}
              {taste.length > 0 ? `, with ${Math.min(taste.length, 6)} of your notes applied` : ""}.
            </p>
          )}
        </section>

        <TasteMemory items={taste} mode={initial.mode} />
      </main>

      {focus && (
        <div className={styles.focusScrim} onClick={() => setFocus(null)} role="dialog" aria-modal="true" aria-label={`${focus.family} section, full size`}>
          <div className={styles.focusFrame}>
            <iframe sandbox="" srcDoc={focus.html} title={`${focus.family} section, full size`} />
          </div>
          <p className={styles.focusCaption}>
            {focus.verdict ? `${focus.verdict.overall.toFixed(1)} · ${focus.verdict.note}` : ""} <span>Click anywhere to close</span>
          </p>
        </div>
      )}

      {pending && pendingCard && (
        <CorrectionSheet pending={pending} family={pendingCard.family} onCancel={() => setPending(null)} onSave={saveCorrection} />
      )}
    </>
  );
}

// Brand doodle: lightbulb with three rays (brand/guidelines illustration system).
function Bulb() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18h6M10 21h4M12 3v1.5M5.5 6l1 1M18.5 6l-1 1" />
      <path d="M8.5 15.5c-1.4-1-2.5-2.7-2.5-4.6a6 6 0 0 1 12 0c0 1.9-1.1 3.6-2.5 4.6" />
    </svg>
  );
}
