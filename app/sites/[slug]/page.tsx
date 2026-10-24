import { notFound } from "next/navigation";
import { readFileSync, existsSync } from "node:fs";
import Link from "next/link";
import Header from "@/src/components/Header";
import LoopViewer from "@/src/components/LoopViewer";
import { getSite, listRuns } from "@/lib/loopData";

export const dynamic = "force-dynamic";

function reference(slug: string) {
  const f = "data/baseline/results.json";
  if (!existsSync(f)) return null;
  const r = JSON.parse(readFileSync(f, "utf8")) as { sites: Record<string, { image: number; visible: number }> };
  return r.sites[slug] ?? null;
}

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = getSite(slug);
  if (!site) notFound();
  const runs = listRuns(slug);
  return (
    <>
      <Header current="sites" />
      <main style={{ padding: "28px 32px 80px" }}>
        <p className="marker"><Link href="/sites" prefetch={false} style={{ textDecoration: "none" }}>Sites</Link> / {site.heldOut ? "held out" : "training"}</p>
        <h1 style={{ font: "650 48px/1 var(--font-display)", letterSpacing: "-0.01em", margin: "10px 0 24px" }}>Can Pika rebuild it blind?</h1>
        <LoopViewer site={site} runs={runs} reference={reference(slug)} />
      </main>
    </>
  );
}
