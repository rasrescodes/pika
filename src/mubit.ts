// Every LLM call in Pika goes through here, and so through Mubit.
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, existsSync } from "node:fs";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

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

export async function ask(call: Call): Promise<Reply> {
  const started = Date.now();
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
  const out = data.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  return {
    text: out,
    requestId: response.headers.get("x-middleware-request-id"),
    ms: Date.now() - started,
    inTokens: data.usage.input_tokens,
    outTokens: data.usage.output_tokens,
  };
}
