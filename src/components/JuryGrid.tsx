"use client";

import { useState } from "react";
import styles from "./JuryGrid.module.css";

export type JuryCard = { slug: string; awwwardsUrl: string; jury: number; juryTop: string; pred: number | null; predTop: string | null; hasThumb: boolean };

// Held-out sites: Pika's prediction is shown, the real jury score stays hidden until the reveal.
export default function JuryGrid({ cards }: { cards: JuryCard[] }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <section aria-labelledby="held-title">
      <div className={styles.head}>
        <div>
          <p className="marker">Held out</p>
          <h2 id="held-title" className={styles.h2}>{cards.length} sites Pika never trained on</h2>
        </div>
        <button className="btn" data-testid="reveal-jury" onClick={() => setRevealed((r) => !r)}>
          {revealed ? "Hide the jury" : "Reveal the jury"}
        </button>
      </div>
      <ul className={styles.grid} data-testid="jury-grid">
        {cards.map((c) => (
          <li key={c.slug} className={styles.card} data-testid="jury-card">
            <a href={c.awwwardsUrl} target="_blank" rel="noreferrer" className={styles.thumb} aria-label={`${c.slug} on Awwwards`}>
              {c.hasThumb && <img src={`/api/file/sites/${c.slug}/thumb.jpg`} alt="" loading="lazy" />}
            </a>
            <p className={styles.name}>{c.slug.replace(/-/g, " ")}</p>
            <dl className={styles.scores}>
              <div><dt>Pika</dt><dd className="num">{c.pred !== null ? c.pred.toFixed(2) : "Pending"}</dd></div>
              <div><dt>Jury</dt><dd className="num" data-testid="jury-score" data-hidden={!revealed || undefined}>{revealed ? c.jury.toFixed(2) : "?"}</dd></div>
            </dl>
            <p className={styles.top}>
              {revealed ? `Jury rewarded ${c.juryTop} most` : "Jury's strongest criterion hidden"}
              {c.predTop ? `; Pika said ${c.predTop}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
