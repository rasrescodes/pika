// Every LLM call in Pika goes through here, and so through Mubit.
// LLM_BACKEND=local is the one exception, for the offline dev loop: a model running on this machine
// (mlx_lm.server or any OpenAI-compatible server at LOCAL_LLM_URL). No provider is called, Mubit sees nothing.
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, existsSync } from "node:fs";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

export const BACKEND = process.env.LLM_BACKEND === "local" ? "local" : "mubit";
const LOCAL_URL = process.env.LOCAL_LLM_URL || "http://127.0.0.1:8080";

export const MODELS = {
  describer: process.env.DESCRIBER_MODEL || "claude-sonnet-5-5",
  builder: process.env.BUILDER_MODEL || "claude-sonnet-5-5",
  critic: process.env.CRITIC_MODEL || "claude-sonnet-5-5",
};

let client: Anthropic | undefined;
function mubit() {
  const apiKey = process.env.MUBIT_API_KEY;
  if (!apiKey) throw new Error("Set MUBIT_API_KEY in .env (see .env.example).");
  // authToken: null so a stray ANTHROPIC_AUTH_TOKEN is never sent beside the Mubit key (Mubit answers 401).
  client ??= new Anthropic({
    baseURL: process.env.MUBIT_ANTHROPIC_URL || "https://api.mubit.ai/anthropic",
    apiKey,
    authToken: null,
  });
  return client;
}

export type Content = Anthropic.ContentBlockParam[];

export function image(png: Buffer, mediaType: "image/png" | "image/jpeg" = "image/png"): Anthropic.ImageBlockParam {
  return { type: "image", source: { type: "base64", media_type: mediaType, data: png.toString("base64") } };
}

export function text(t: string): Anthropic.TextBlockParam {
  return { type: "text", text: t };
}

export type Call = {
  model: string;
  system: string; // fixed per task: never put per-call data here
  content: Content;
  maxTokens: number;
  session?: string; // Mubit splits test cases by session (metadata.user_id on Anthropic)
  record?: boolean; // false keeps the call out of Mubit's record and out of training
};

export type Reply = { text: string; requestId: string | null; ms: number; inTokens: number; outTokens: number };

// Running totals for this process, so a batch can report usage and stop at a budget.
export const usage = { calls: 0, inTokens: 0, outTokens: 0 };

// Text only: the local model has no eyes, so the local loop runs in DOM mode.
async function askLocal(call: Call, started: number): Promise<Reply> {
  if (call.content.some((b) => b.type !== "text")) throw new Error("LLM_BACKEND=local is text only: use --mode dom");
  const res = await fetch(`${LOCAL_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      // mlx_lm.server applies its --adapter-path only to "default_model"; any other name loads the bare model.
      model: "default_model",
      max_tokens: call.maxTokens,
      temperature: Number(process.env.LOCAL_TEMPERATURE ?? 0.3),
      messages: [
        { role: "system", content: call.system },
        { role: "user", content: call.content.map((b) => (b.type === "text" ? b.text : "")).join("\n\n") },
      ],
    }),
  });
  if (!res.ok) throw new Error(`local model ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[]; usage?: { prompt_tokens: number; completion_tokens: number } };
  const inTokens = data.usage?.prompt_tokens ?? 0;
  const outTokens = data.usage?.completion_tokens ?? 0;
  usage.inTokens += inTokens;
  usage.outTokens += outTokens;
  return { text: data.choices[0]?.message.content ?? "", requestId: null, ms: Date.now() - started, inTokens, outTokens };
}

export async function ask(call: Call): Promise<Reply> {
  const started = Date.now();
  usage.calls++;
  if (BACKEND === "local") return askLocal(call, started);
  const { data, response } = await mubit()
    .messages.create(
      {
        model: call.model,
        max_tokens: call.maxTokens,
        system: call.system,
        messages: [{ role: "user", content: call.content }],
        ...(call.session ? { metadata: { user_id: call.session } } : {}),
      },
      call.record === false ? { headers: { "x-middleware-record": "metadata" } } : undefined,
    )
    .withResponse();
  usage.inTokens += data.usage.input_tokens;
  usage.outTokens += data.usage.output_tokens;
  const out = data.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  return {
    text: out,
    requestId: response.headers.get("x-middleware-request-id"),
    ms: Date.now() - started,
    inTokens: data.usage.input_tokens,
    outTokens: data.usage.output_tokens,
  };
}
