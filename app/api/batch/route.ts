import { runBatch } from "@/lib/wall";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Streams each judged card as it finishes (Server-Sent Events), then a final "done" event.
export async function POST() {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      try {
        const state = await runBatch((card) => send("card", card));
        send("done", { batchId: state.batchId, batchMs: state.batchMs });
      } catch (e) {
        console.error("[batch] failed:", e);
        send("failed", { message: "The batch could not finish. Try again." });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache" } });
}
