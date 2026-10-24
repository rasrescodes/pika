"use client";

import { useState } from "react";
import styles from "./LoopViewer.module.css";
import type { Run, Site } from "@/lib/loopData";

type Reference = { image: number; visible: number } | null;

// The demo moment: the original stays hidden while the blind rebuilds climb round by round,
// then the reveal puts the original next to the best rebuild.
export default function LoopViewer({ site, runs, reference }: { site: Site; runs: Run[]; reference: Reference }) {
  const [runId, setRunId] = useState(runs[0]?.id ?? null);
  const run = runs.find((r) => r.id === runId) ?? null;
  const [round, setRound] = useState(run ? run.rounds.length : 0);
  const [revealed, setRevealed] = useState(false);
  const current = run?.rounds[Math.max(0, Math.min(round, run.rounds.length) - 1)];

  return (
    <div className={styles.viewer} data-testid="loop-viewer">
      <div className={styles.stage}>
        <figure className={styles.frame} data-testid="original">
          <figcaption className="marker">The original</figcaption>
          <div className={styles.shot} data-hidden={!revealed || undefined}>
            <img src={`/api/file/sites/${site.slug}/original.png`} alt={revealed ? `${site.slug} hero as captured` : "Hidden until the reveal"} />
            {!revealed && (
              <button className={styles.reveal} data-testid="reveal" onClick={() => setRevealed(true)}>
                Reveal the original
              </button>
            )}
          </div>
        </figure>

        <figure className={styles.frame} data-testid="rebuild">
          <figcaption className="marker">{current ? `Blind rebuild, round ${current.round}` : "Blind rebuild"}</figcaption>
          <div className={styles.shot}>
            {current?.hasBuild ? (
              <img src={`/api/file/runs/${site.slug}/${run!.id}/r${current.round}/build.png`} alt={`Rebuild from round ${current.round}`} />
            ) : (
              <div className={styles.empty} data-testid="no-runs">
                <p>No loop runs for this site yet.</p>
                <p>They appear here as soon as the loop runs with a Mubit key.</p>
              </div>
            )}
          </div>
        </figure>
      </div>

      {run && current && (
        <section className={styles.rounds} aria-label="Rounds">
          <div className={styles.timeline} role="tablist" aria-label="Choose a round">
            {run.rounds.map((r) => (
              <button
                key={r.round}
                role="tab"
                aria-selected={r.round === current.round}
                className={styles.step}
                data-testid={`round-${r.round}`}
                onClick={() => setRound(r.round)}
              >
                <span className="num">{r.score.total.toFixed(1)}</span>
                <span className={styles.stepLabel}>Round {r.round}</span>
                <span className={styles.bar} style={{ height: `${Math.max(4, r.score.total)}%` }} />
              </button>
            ))}
          </div>

          <div className={styles.detail}>
            <dl className={styles.scores}>
              <div><dt>Total</dt><dd className="num" data-testid="round-total">{current.score.total.toFixed(1)}</dd></div>
              <div><dt>Structure</dt><dd className="num">{current.score.structure.toFixed(1)}</dd></div>
              <div><dt>Colour</dt><dd className="num">{current.score.colour.toFixed(1)}</dd></div>
              <div><dt>Edges</dt><dd className="num">{current.score.edges.toFixed(1)}</dd></div>
              <div><dt>Visible</dt><dd className="num">{Math.round(current.score.visible * 100)}%</dd></div>
            </dl>
            {current.fixes.length > 0 && (
              <div className={styles.fixes}>
                <p className="marker">The Critic&apos;s fixes for the next round</p>
                <ol>{current.fixes.map((f, i) => <li key={i}>{f}</li>)}</ol>
              </div>
            )}
            <details className={styles.spec}>
              <summary>The spec the Builder saw (it never sees the original)</summary>
              <pre>{current.spec}</pre>
            </details>
          </div>
        </section>
      )}

      <aside className={styles.facts}>
        <p className="marker">The site</p>
        <dl>
          <div><dt>Awwwards jury</dt><dd className="num">{site.jury?.overall?.toFixed(2) ?? "no score"}</dd></div>
          <div><dt>Award</dt><dd>{site.award ?? "Nominee"}</dd></div>
          <div><dt>Layout</dt><dd>{site.label.layout_style?.replace(/-/g, " ") ?? "Unlabelled"}</dd></div>
          <div><dt>Set</dt><dd>{site.heldOut ? `Held out, never trained on (${site.heldOutWhy})` : "Training"}</dd></div>
          {reference && <div><dt>Copying the measured text alone</dt><dd className="num" data-testid="reference">{reference.image.toFixed(1)}</dd></div>}
        </dl>
        <a href={site.awwwards_url} target="_blank" rel="noreferrer">See it on Awwwards</a>
        {runs.length > 1 && (
          <label className={styles.runPick}>
            Run
            <select value={runId ?? ""} onChange={(e) => { const r = runs.find((x) => x.id === e.target.value); setRunId(e.target.value); setRound(r ? r.rounds.length : 0); }}>
              {runs.map((r) => <option key={r.id} value={r.id}>{r.mode} · {r.tag} · first shot {r.firstShot.toFixed(1)}, best {r.best.toFixed(1)}</option>)}
            </select>
          </label>
        )}
      </aside>
    </div>
  );
}
