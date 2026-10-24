import Link from "next/link";
import Header from "@/src/components/Header";
import styles from "./sites.module.css";
import { listSites, listRuns } from "@/lib/loopData";

export const dynamic = "force-dynamic";

export default async function Sites({ searchParams }: { searchParams: Promise<{ set?: string }> }) {
  const { set } = await searchParams;
  const all = listSites().filter((s) => !s.label.bad_capture);
  const shown = set === "holdout" ? all.filter((s) => s.heldOut) : set === "train" ? all.filter((s) => !s.heldOut) : all;
  const withRuns = new Set(all.filter((s) => listRuns(s.slug).length > 0).map((s) => s.slug));
  return (
    <>
      <Header current="sites" />
      <main className={styles.main}>
        <p className="marker">Sites</p>
        <h1 className={styles.title}>{all.length} award-winning heroes</h1>
        <p className={styles.dek}>Captured from Awwwards with their jury scores. Pika learns on the training set and is scored on the held-out set, which it never trains on.</p>
        <nav className={styles.filters} aria-label="Filter sites">
          {[["", "All"], ["train", "Training"], ["holdout", "Held out"]].map(([v, l]) => (
            <Link key={v} href={v ? `/sites?set=${v}` : "/sites"} prefetch={false} aria-current={(set ?? "") === v ? "page" : undefined}>{l}</Link>
          ))}
        </nav>
        <ul className={styles.grid} data-testid="site-grid">
          {shown.map((s) => (
            <li key={s.slug}>
              <Link href={`/sites/${s.slug}`} prefetch={false} className={styles.card} data-testid="site-card">
                <span className={styles.thumb}>{s.hasThumb && <img src={`/api/file/sites/${s.slug}/thumb.jpg`} alt="" loading="lazy" />}</span>
                <span className={styles.row}>
                  <span className={styles.name}>{s.slug.replace(/-/g, " ")}</span>
                  <span className="num">{s.jury?.overall?.toFixed(2) ?? "no score"}</span>
                </span>
                <span className={styles.meta}>
                  {s.label.layout_style?.replace(/-/g, " ") ?? "unlabelled"}
                  {s.heldOut ? " · held out" : ""}
                  {withRuns.has(s.slug) ? " · has runs" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
