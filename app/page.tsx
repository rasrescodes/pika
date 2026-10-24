import Link from "next/link";
import { readFileSync, existsSync } from "node:fs";
import Header from "@/src/components/Header";
import LoopViewer from "@/src/components/LoopViewer";
import styles from "./loop.module.css";
import { listSites, listRuns, getSite } from "@/lib/loopData";
import { mode } from "@/lib/llm";

export const dynamic = "force-dynamic";

type Baseline = { sites: Record<string, { image: number; visible: number }> };

export default function LoopHome() {
  const sites = listSites().filter((s) => !s.label.bad_capture);
  const holdout = sites.filter((s) => s.heldOut);
  const runsBySite = new Map(sites.map((s) => [s.slug, listRuns(s.slug)]));
  const allRuns = [...runsBySite.values()].flat();
  const baseline: Baseline | null = existsSync("data/baseline/results.json") ? JSON.parse(readFileSync("data/baseline/results.json", "utf8")) : null;

  // Feature the held-out site with the most rounds; before any runs, the text-led held-out site that
  // the measurement copy scores best on (it reads clearly on a projector).
  const withRuns = holdout.filter((s) => (runsBySite.get(s.slug) ?? []).length > 0);
  const featuredSlug =
    withRuns.sort((a, b) => (runsBySite.get(b.slug)![0].rounds.length - runsBySite.get(a.slug)![0].rounds.length))[0]?.slug ??
    (baseline ? Object.entries(baseline.sites).sort((a, b) => b[1].image - a[1].image)[0]?.[0] : holdout[0]?.slug);
  const featured = featuredSlug ? getSite(featuredSlug) : null;

  return (
    <>
      <Header current="loop">
        <span className="chip-mode" data-testid="mode-chip" title={mode() === "MOCK" ? "No Mubit key: the loop has not run yet" : "Every call goes through Mubit"}>
          {mode() === "MOCK" ? "NO KEY YET" : "LIVE · MUBIT"}
        </span>
      </Header>
      <main className={styles.main} data-testid="loop-home">
        <section className={styles.intro}>
          <p className="marker">The Loop</p>
          <h1 className={styles.title}>Pika rebuilds award-winning sites <em>blind</em>, and gets better every time.</h1>
          <ol className={styles.steps}>
            <li><strong>Describe.</strong> Pika looks at an Awwwards winner and writes a build spec.</li>
            <li><strong>Build blind.</strong> A second model builds the page from the spec alone. It never sees the original.</li>
            <li><strong>Score.</strong> Plain code compares the rebuild with the original. No model, so it can&apos;t flatter itself.</li>
            <li><strong>Correct.</strong> The Critic&apos;s fixes become the next spec, and Mubit trains a small model on what worked.</li>
          </ol>
        </section>

        <section className={styles.stats} aria-label="Progress">
          <div><span className="num">{sites.length}</span> sites captured</div>
          <div><span className="num">{holdout.length}</span> held out, never trained on</div>
          <div><span className="num">{allRuns.length}</span> loop runs so far</div>
          <div><span className="num">{allRuns.reduce((a, r) => a + r.rounds.length, 0)}</span> rounds scored</div>
        </section>

        {featured && (
          <section aria-label="Featured site">
            <div className={styles.featuredHead}>
              <p className="marker">Held-out site</p>
              <Link href={`/sites/${featured.slug}`} prefetch={false}>Open this site</Link>
            </div>
            <LoopViewer site={featured} runs={runsBySite.get(featured.slug) ?? []} reference={baseline?.sites[featured.slug] ?? null} />
          </section>
        )}
      </main>
    </>
  );
}
