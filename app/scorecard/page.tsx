import { z } from "zod";
import Header from "@/src/components/Header";
import styles from "./scorecard.module.css";
import { FILES, Site, Results, TryModel, Price, Proof, Verdict, readJson, dataHash, directional, costPer100, median } from "@/lib/scorecard";

export const dynamic = "force-dynamic";

const crit = ["design", "usability", "creativity", "content"] as const;
const mean = (o: Record<(typeof crit)[number], number>) => crit.reduce((a, k) => a + o[k], 0) / 4;

export default function Scorecard() {
  const sites = z.array(Site).safeParse(readJson(FILES.sites));
  const results = Results.safeParse(readJson(FILES.results));
  const tries = z.array(TryModel).safeParse(readJson(FILES.trymodels) ?? []);
  const pricing = z.record(z.string(), Price).safeParse(readJson(FILES.pricing) ?? {});
  const proof = Proof.safeParse(readJson(FILES.proof));
  const verdict = Verdict.safeParse(readJson(FILES.verdict));
  const ready = verdict.success && verdict.data.status === "PASS" && verdict.data.dataHash === dataHash();
  const hasRows = sites.success && sites.data.length > 0 && results.success;

  const runs = results.success ? results.data.runs : [];
  const big = runs.filter((r) => r.kind === "big");
  const small = runs.filter((r) => r.kind === "small");
  const bigModel = big[0]?.model;
  const smallModel = small[0]?.model;
  const prices = pricing.success ? pricing.data : {};

  return (
    <>
      <Header current="scorecard" />
      <main className={styles.main} data-testid="scorecard">
        <p className="marker">Scorecard</p>
        <h1 className={styles.title}>Does the Juror have taste?</h1>
        <p className={styles.dek}>
          The Juror against the real Awwwards jury on sites it has never seen, the big model against Mubit&apos;s small trained model, and what each costs.
        </p>

        {ready && <p data-testid="demo-ready-pass" className={styles.pass}>Checked: every number below is sourced and recorded ({verdict.success ? new Date(verdict.data.checkedAt).toLocaleString("en-GB") : ""}).</p>}

        {!hasRows ? (
          <section className={styles.empty}>
            <h2>No scorecard run yet</h2>
            <p>
              Add at least 8 Awwwards sites with their jury scores to <code>data/scorecard/sites.json</code>, then run <code>npm run scorecard</code> with a Mubit key. Nothing here is estimated.
            </p>
          </section>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Site</th>
                <th className="num">Awwwards jury</th>
                <th className="num" data-testid="col-big">Juror, {bigModel ?? "big model"}</th>
                <th className="num" data-testid="col-small">Juror, {smallModel ?? "Mubit adapter (recorded in Try models)"}</th>
              </tr>
            </thead>
            <tbody>
              {sites.data.map((s) => {
                const b = big.find((r) => r.site === s.id);
                const sm = small.find((r) => r.site === s.id) ?? (tries.success ? tries.data.find((t) => t.site === s.id) : undefined);
                return (
                  <tr key={s.id} data-testid="scorecard-row">
                    <td><a href={s.awwwardsUrl} target="_blank" rel="noreferrer">{s.name}</a></td>
                    <td className="num" data-testid="jury-score">{mean(s.jury).toFixed(2)}</td>
                    <td className="num" data-testid="big-score">{b ? b.overall.toFixed(1) : "not run"}</td>
                    <td className="num" data-testid="small-score">{sm ? mean(sm.scores).toFixed(1) : "not run"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <section className={styles.grid}>
          <div data-testid="cost-latency" className={styles.panel}>
            <p className="marker">Cost and speed</p>
            {[{ label: "Big model", model: bigModel, rs: big }, { label: "Small model", model: smallModel, rs: small }].map(({ label, model, rs }) => {
              const cost = model ? costPer100(model, rs, prices) : { value: null, reason: "not run yet" };
              const ms = median(rs.map((r) => r.ms));
              return (
                <dl key={label} className={styles.stat}>
                  <dt>{label}{model ? `, ${model}` : ""}</dt>
                  <dd><span className="num">{ms !== null ? `${ms} ms` : "unavailable"}</span> median per critique</dd>
                  <dd><span className="num">{cost.value !== null ? `$${cost.value}` : "unavailable"}</span> per 100 critiques{cost.reason ? ` (${cost.reason})` : ""}</dd>
                </dl>
              );
            })}
            {!smallModel && <p className={styles.small}>Small-model cost and speed are not measurable from our app unless Mubit lets apps call the adapter. Mubit&apos;s console comparison is shown instead.</p>}
          </div>

          <div data-testid="method" className={styles.panel}>
            <p className="marker">Method</p>
            <ul className={styles.method}>
              <li>Held-out sites: picked by hand, never used for corrections. Jury scores copied from each site&apos;s Awwwards page (linked).</li>
              <li>Each critique is one Juror call through Mubit: the same fixed instructions, a screenshot we took, no art director notes.</li>
              <li>Speed: wall-clock time per call. Cost: token usage returned by the provider times the published price in <code>data/pricing.json</code>, mean per call, times 100.</li>
              <li>Anything missing shows as unavailable. Nothing is estimated.</li>
            </ul>
          </div>
        </section>

        {proof.success && (
          <section data-testid="correction-proof" className={styles.panel}>
            <p className="marker">Correction proof</p>
            <h2 className={styles.h2}>Did one correction change the small model?</h2>
            <p className={styles.small}>
              Same six frozen inputs, no notes in either. Adapter {proof.data.before.adapterVersion} before the correction, {proof.data.after.adapterVersion} after. Moved the right way on{" "}
              <span className="num">{directional(proof.data).moved} of 6</span> ({directional(proof.data).pass ? "passes" : "does not pass"} the 4 of 6 rule).
            </p>
          </section>
        )}
      </main>
    </>
  );
}
