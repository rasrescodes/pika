// The only place Pika talks to a model. Every call goes to MUBIT_BASE_URL (the hackathon rule);
// with no key or model configured, Pika runs in MOCK mode and callers use their fixtures instead.
import OpenAI from "openai";

export type Mode = "MOCK" | "MUBIT";

export type ChatInput = {
  system: string;
  user: string;
  images?: string[];
  maxTokens: number;
  temperature?: number;
  model?: string;
};

export type ChatResult = {
  text: string;
  usage?: { input: number; output: number };
  ms: number;
  model: string;
};

export const DEFAULT_BASE_URL = "https://api.mubit.ai/openai/v1";

export function mode(): Mode {
  return process.env.MUBIT_API_KEY && process.env.MODEL ? "MUBIT" : "MOCK";
}

let client: OpenAI | null = null;
function mubit(): OpenAI {
  if (!client) {
    client = new OpenAI({
      baseURL: process.env.MUBIT_BASE_URL || DEFAULT_BASE_URL,
      apiKey: process.env.MUBIT_API_KEY,
    });
  }
  return client;
}

export async function chat(input: ChatInput): Promise<ChatResult> {
  if (mode() !== "MUBIT") throw new Error("chat() called in MOCK mode");
  const model = input.model || (process.env.MODEL as string);
  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [{ type: "text", text: input.user }];
  for (const url of input.images ?? []) content.push({ type: "image_url", image_url: { url } });

  const started = performance.now();
  const res = await mubit().chat.completions.create({
    model,
    max_tokens: input.maxTokens,
    temperature: input.temperature ?? 0,
    messages: [
      { role: "system", content: input.system },
      { role: "user", content },
    ],
  });
  const ms = Math.round(performance.now() - started);
  return {
    text: res.choices[0]?.message?.content ?? "",
    usage: res.usage ? { input: res.usage.prompt_tokens, output: res.usage.completion_tokens } : undefined,
    ms,
    model,
  };
}
