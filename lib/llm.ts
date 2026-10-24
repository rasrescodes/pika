// The only place Pika talks to a model. Every call goes to MUBIT_BASE_URL (the hackathon rule);
// with no key or model configured, Pika runs in MOCK mode and callers use their fixtures instead.
import OpenAI from "openai";
import { read, write } from "./store";

export type Mode = "MOCK" | "MUBIT";

export type ChatInput = {
  system: string;
  user: string;
  images?: string[];
  maxTokens: number;
  temperature?: number;
  model?: string;
  // false = ask Mubit not to keep this call for training (held-out evaluation). Header from Mubit's docs.
  record?: boolean;
};

export type ChatResult = {
  text: string;
  usage?: { input: number; output: number };
  ms: number;
  model: string;
};

export const DEFAULT_BASE_URL = "https://api.mubit.ai/openai/v1";

// The hackathon rule: every call goes through Mubit. A base URL on any other host is refused, so the
// LIVE · MUBIT badge can only ever mean calls really go to Mubit.
export function isMubitUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && (u.hostname === "mubit.ai" || u.hostname.endsWith(".mubit.ai"));
  } catch {
    return false;
  }
}

export function mode(): Mode {
  const base = process.env.MUBIT_BASE_URL || DEFAULT_BASE_URL;
  return process.env.MUBIT_API_KEY && process.env.MODEL && isMubitUrl(base) ? "MUBIT" : "MOCK";
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

// Spend guard: a hard cap on paid model calls per day (PIKA_MAX_CALLS_PER_DAY, default 300).
// Calls over the cap are refused before they reach Mubit, so nothing over the cap is ever charged.
export class SpendCapError extends Error {}
export function callsToday(): { date: string; calls: number } {
  const today = new Date().toISOString().slice(0, 10);
  const s = read<{ date: string; calls: number }>("spend", { date: today, calls: 0 });
  return s.date === today ? s : { date: today, calls: 0 };
}
function reserveCall(): void {
  const cap = Number(process.env.PIKA_MAX_CALLS_PER_DAY ?? 300);
  const s = callsToday();
  if (s.calls >= cap) throw new SpendCapError(`Daily cap of ${cap} model calls reached; raise PIKA_MAX_CALLS_PER_DAY on purpose to continue.`);
  write("spend", { date: s.date, calls: s.calls + 1 });
}

export async function chat(input: ChatInput): Promise<ChatResult> {
  if (mode() !== "MUBIT") throw new Error("chat() called in MOCK mode");
  reserveCall();
  const model = input.model || (process.env.MODEL as string);
  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [{ type: "text", text: input.user }];
  for (const url of input.images ?? []) content.push({ type: "image_url", image_url: { url } });

  const started = performance.now();
  const res = await mubit().chat.completions.create(
    {
      model,
      max_tokens: input.maxTokens,
      temperature: input.temperature ?? 0,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content },
      ],
    },
    input.record === false ? { headers: { "x-middleware-record": "metadata" } } : undefined,
  );
  const ms = Math.round(performance.now() - started);
  return {
    text: res.choices[0]?.message?.content ?? "",
    usage: res.usage ? { input: res.usage.prompt_tokens, output: res.usage.completion_tokens } : undefined,
    ms,
    model,
  };
}
