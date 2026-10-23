"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CorrectionSheet.module.css";
import type { Scores } from "@/lib/juror";

export type Pending = { cardId: string; from: number; to: number; kind: "move" | "score"; scores?: Scores };

const KEYS = ["design", "usability", "creativity", "content"] as const;

export default function CorrectionSheet({
  pending,
  family,
  onCancel,
  onSave,
}: {
  pending: Pending;
  family: string;
  onCancel: () => void;
  onSave: (p: Pending, reason: string, scores?: Scores) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [scores, setScores] = useState<Scores | undefined>(pending.scores);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onCancel]);

  const title =
    pending.kind === "score" ? `Score the ${family} layout yourself` : `Move the ${family} layout from #${pending.from} to #${pending.to}`;

  return (
    <div className={styles.scrim} onClick={onCancel}>
      <form
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          await onSave(pending, reason, pending.kind === "score" ? scores : undefined);
          setSaving(false);
        }}
      >
        <p className="marker">Your correction</p>
        <h2 id="sheet-title" className={styles.title}>{title}</h2>
        {pending.kind === "score" && scores && (
          <div className={styles.scores}>
            {KEYS.map((k) => (
              <label key={k}>
                <span>{k}</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={scores[k]}
                  className="num"
                  onChange={(e) => setScores({ ...scores, [k]: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })}
                />
              </label>
            ))}
          </div>
        )}
        <label className={styles.reasonLabel} htmlFor="reason">
          Why? The Juror reads this on every call from now on.
        </label>
        <textarea
          id="reason"
          ref={ref}
          data-testid="reason"
          className={styles.reason}
          maxLength={200}
          rows={3}
          placeholder="Braver type, more white space"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className={styles.actions}>
          <button type="button" className="btn btn-quiet" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn" data-testid="save-correction" disabled={saving}>
            {saving ? "Saving" : "Save correction"}
          </button>
        </div>
      </form>
    </div>
  );
}
