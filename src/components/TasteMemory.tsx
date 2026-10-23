import styles from "./TasteMemory.module.css";
import type { TasteItem } from "@/lib/taste";
import { TASTE_IN_PROMPT } from "@/lib/taste";

export default function TasteMemory({ items }: { items: TasteItem[] }) {
  return (
    <aside className={styles.rail} data-testid="taste-memory" aria-labelledby="taste-title">
      <p className="marker" id="taste-title">Taste memory</p>
      <p className={styles.explain}>
        Your last {TASTE_IN_PROMPT} corrections travel with every Juror call through Mubit, so the next batch is judged your way, and Mubit trains its small model on those calls.
      </p>
      {items.length === 0 ? (
        <p className={styles.empty}>No corrections yet. Overrule the Juror on any card.</p>
      ) : (
        <ol className={styles.list}>
          {items.map((t, i) => (
            <li key={t.id} data-testid="taste-item" className={styles.item} data-active={i < TASTE_IN_PROMPT || undefined}>
              <blockquote className={styles.quote}>{t.reason || "No reason given"}</blockquote>
              <p className={styles.what}>
                {t.family} layout, <span className="num">#{t.from}</span> to <span className="num">#{t.to}</span>
                {t.directorScores ? ", re-scored" : ""}
                {i >= TASTE_IN_PROMPT ? ", archived" : ""}
              </p>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
