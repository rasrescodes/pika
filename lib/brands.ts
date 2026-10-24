export type Brand = {
  id: string;
  name: string;
  colours: { bg: string; ink: string; accent: string; soft: string };
  displayFont: "serif" | "sans" | "mono";
  bodyFont: "serif" | "sans" | "mono";
  tone: string;
  headline: string;
  alternates?: string[];
  subline: string;
  action: string;
  source: string;
};

export const PRESETS: Brand[] = [
  {
    id: "pika",
    name: "Pika",
    colours: { bg: "#FBF5EA", ink: "#0A0A0A", accent: "#3027F4", soft: "#96D2F2" },
    displayFont: "sans",
    bodyFont: "sans",
    tone: "friendly, creative and calm; a quiet companion that turns ideas into reality",
    headline: "An art director that learns your taste",
    alternates: ["Twelve designs. One opinion that counts", "Overrule the Juror once", "The critic that takes notes"],
    subline: "Generate a wall of designs. Overrule the Juror once. Watch the next batch come back your way.",
    action: "Generate a wall",
    source: "Kimberley's Pika brand guidelines v1",
  },
  {
    id: "mubit",
    name: "Mubit",
    colours: { bg: "#d2dad1", ink: "#263b32", accent: "#d9421d", soft: "#efbd73" },
    displayFont: "mono",
    bodyFont: "sans",
    tone: "calm, technical, precise",
    headline: "The runtime calibration layer for AI agents",
    alternates: ["Your frontier models stay in place", "Capture the run. Calibrate the next one", "Connect, capture, calibrate, evaluate"],
    subline: "Your frontier models stay in place. Every run teaches the next one.",
    action: "Connect your agent",
    source: "Colours and copy from mubit.ai",
  },
];

export function fontStack(kind: Brand["displayFont"]): string {
  // Single quotes inside: these stacks are embedded in double-quoted inline style attributes.
  if (kind === "serif") return "Georgia, 'Times New Roman', serif";
  if (kind === "mono") return "Menlo, 'Courier New', monospace";
  return "'Helvetica Neue', Helvetica, Arial, sans-serif";
}

export function brandSummary(b: Brand): string {
  return `Brand: ${b.name}. Tone: ${b.tone}. Colours: background ${b.colours.bg}, ink ${b.colours.ink}, accent ${b.colours.accent}. Headline: "${b.headline}".`;
}
