import Header from "@/src/components/Header";
import JuryGrid, { type JuryCard } from "@/src/components/JuryGrid";
import styles from "./jury.module.css";
import { jurySites, topCriterion, readJson, type Prediction } from "@/lib/jury";

export const dynamic = "force-dynamic";

type Eval = { n: number; maeOverall: number; topCriterionAccuracy: number; pairAccuracy: number; pairs: number };
type Baselines = { dataset: { sites: number; train: number; heldOut: number; juryOverall: { mean: number; min: number; max: number } }; baselines: { maeOverall: { constantAverage: number }; topCriterionAccuracy: { alwaysMajority: number; majorityCriterion: string }; pairAccuracy: { coinFlip: number; pairs: number } } };
type Results = { model?: string; before: Eval; after: Eval; calibration: string; trainCalls: number };

const pct = (x: number) => `${Math.round(x * 100)}%`;

export default function JuryPage() {
  const sites = jurySites();
  const base = readJson<Baselines | null>("data/jury/baselines.json", null);
  const results = readJson<Results | null>("data/jury/results.json", null);
  const evalRun = readJson<{ predictions: Prediction[] } | null>("data/jury/runs/eval.json", null);
  const preds = new Map((evalRun?.predictions ?? []).map((p) => [p.slug, p]));
  const cards: JuryCard[] = sites.filter((s) => s.heldOut).map((s) => {
    const p = preds.get(s.slug);
    return { slug: s.slug, awwwardsUrl: s.awwwardsUrl, jury: s.jury.overall, juryTop: topCriterion(s.jury), pred: p?.overall ?? null, predTop: p ? topCriterion(p.scores) : null, hasThumb: s.hasThumb };
  });

  const rows: { task: string; detail: string; base: string; before: string; after: string; better: "lower" | "higher" }[] = base
    ? [
        { task: "Score within", detail: "average miss on the overall jury score", base: base.baselines.maeOverall.constantAverage.toFixed(3), before: results ? results.before.maeOverall.toFixed(3) : "Pending", after: results ? results.after.maeOverall.toFixed(3) : "Pending", better: "lower" },
        { task: "Strongest criterion", detail: "names the criterion the jury rewarded most", base: `${pct(base.baselines.topCriterionAccuracy.alwaysMajority)} (always ${base.baselines.topCriterionAccuracy.majorityCriterion})`, before: results ? pct(results.before.topCriterionAccuracy) : "Pending", after: results ? pct(results.after.topCriterionAccuracy) : "Pending", better: "higher" },
        { task: "Which did the jury prefer", detail: `${base.baselines.pairAccuracy.pairs} pairs with a clear gap`, base: `${pct(base.baselines.pairAccuracy.coinFlip)} (coin flip)`, before: results ? pct(results.before.pairAccuracy) : "Pending", after: results ? pct(results.after.pairAccuracy) : "Pending", better: "higher" },
      ]
    : [];

  return (
    <>
      <Header current="jury" />
      <main className={styles.main} data-testid="jury-page">
        <p className="marker">Jury mode</p>
        <h1 className={styles.title}>Does Pika see what the Awwwards jury sees?</h1>
        <p className={styles.dek}>
          The answer key is the real jury. Every miss on a training site becomes a correction, which reaches every later call through Mubit, and Mubit trains its small model on them. Held-out sites are never trained on, and Pika has to beat a free baseline to claim anything.
        </p>

        {base && (
          <p className={styles.dataset}>
            <span className="num">{base.dataset.sites}</span> Sites of the Day with jury scores · <span className="num">{base.dataset.train}</span> to learn from · <span className="num">{base.dataset.heldOut}</span> held out · jury overall {base.dataset.juryOverall.min} to {base.dataset.juryOverall.max}
          </p>
        )}

        <table className={styles.table} data-testid="jury-metrics">
          <thead>
            <tr><th>Task (held-out sites)</th><th className="num">Free baseline</th><th className="num">Pika, first try</th><th className="num">Pika, after corrections</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.task}>
                <td><strong>{r.task}</strong><span>{r.detail}; {r.better} is better</span></td>
                <td className="num">{r.base}</td>
                <td className="num">{r.before}</td>
                <td className="num">{r.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!results && <p className={styles.pending}>Pika&apos;s columns fill in after the first run with a Mubit key. Nothing here is estimated.</p>}

        {results?.calibration && (
          <section className={styles.notes} data-testid="calibration">
            <p className="marker">What the jury taught Pika</p>
            <pre>{results.calibration}</pre>
          </section>
        )}

        <JuryGrid cards={cards} />
      </main>
    </>
  );
}
