"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./BrandForm.module.css";
import type { Brand } from "@/lib/brands";

type Draft = Omit<Brand, "id" | "source">;

export default function BrandForm({ presets, current }: { presets: Brand[]; current: Brand }) {
  const router = useRouter();
  const [selected, setSelected] = useState(current.id);
  const [draft, setDraft] = useState<Draft>({ ...current });
  const [message, setMessage] = useState<string | null>(null);

  async function save(body: unknown) {
    setMessage(null);
    const res = await fetch("/api/brand", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error ?? "That brand could not be saved.");
    setSelected(data.brand.id);
    setMessage(`${data.brand.name} is now on the Wall. Generate a batch to see it.`);
    router.refresh();
  }

  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDraft({ ...draft, [k]: e.target.value });
  const setColour = (k: keyof Brand["colours"]) => (e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, colours: { ...draft.colours, [k]: e.target.value } });

  return (
    <main className={styles.main}>
      <p className="marker">Brand kit</p>
      <h1 className={styles.title}>Whose wall is it?</h1>

      <section className={styles.presets} aria-label="Preset brands">
        {presets.map((p) => (
          <button key={p.id} className={styles.preset} aria-pressed={selected === p.id} onClick={() => save({ preset: p.id })}>
            <span className={styles.swatches}>
              {[p.colours.bg, p.colours.ink, p.colours.accent, p.colours.soft].map((c) => <i key={c} style={{ background: c }} />)}
            </span>
            <strong>{p.name}</strong>
            <span className={styles.source}>{p.source}</span>
          </button>
        ))}
      </section>

      <form
        className={styles.form}
        data-testid="brand-form"
        onSubmit={(e) => {
          e.preventDefault();
          save({ custom: draft });
        }}
      >
        <h2 className={styles.h2}>Or describe your own</h2>
        <label>Name<input value={draft.name} onChange={set("name")} maxLength={40} required /></label>
        <label>Headline<input value={draft.headline} onChange={set("headline")} maxLength={90} required /></label>
        <label>Supporting line<input value={draft.subline} onChange={set("subline")} maxLength={160} required /></label>
        <label>Action<input value={draft.action} onChange={set("action")} maxLength={30} required /></label>
        <label>Tone<input value={draft.tone} onChange={set("tone")} maxLength={80} required /></label>
        <fieldset className={styles.colours}>
          <legend>Colours</legend>
          {(["bg", "ink", "accent", "soft"] as const).map((k) => (
            <label key={k}>
              {{ bg: "Background", ink: "Ink", accent: "Accent", soft: "Soft" }[k]}
              <input type="color" value={draft.colours[k]} onChange={setColour(k)} />
            </label>
          ))}
        </fieldset>
        <div className={styles.row}>
          <label>Display type
            <select value={draft.displayFont} onChange={set("displayFont")}><option value="serif">Serif</option><option value="sans">Sans</option><option value="mono">Mono</option></select>
          </label>
          <label>Body type
            <select value={draft.bodyFont} onChange={set("bodyFont")}><option value="sans">Sans</option><option value="serif">Serif</option><option value="mono">Mono</option></select>
          </label>
        </div>
        <button className="btn" type="submit">Use this brand</button>
        {message && <p role="status" className={styles.message}>{message}</p>}
      </form>
    </main>
  );
}
