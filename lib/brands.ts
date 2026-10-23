export type Brand = {
  id: string;
  name: string;
  colours: { bg: string; ink: string; accent: string; soft: string };
  displayFont: "serif" | "sans" | "mono";
  bodyFont: "serif" | "sans" | "mono";
  tone: string;
  headline: string;
  subline: string;
  action: string;
  source: string;
};

export const PRESETS: Brand[] = [
  {
    id: "pika",
    name: "Pika",
    colours: { bg: "#ffffff", ink: "#000000", accent: "#ff5d1f", soft: "#ffead9" },
    displayFont: "serif",
    bodyFont: "sans",
    tone: "confident, editorial, a critic with taste",
    headline: "An art director that learns your taste",
    subline: "Generate a wall of designs. Overrule the Juror once. Watch the next batch come back your way.",
    action: "Generate a wall",
    source: "Provisional Pika tokens (DESIGN.md); Kimberley's brand replaces them",
  },
  {
    id: "mubit",
    name: "Mubit",
    colours: { bg: "#d2dad1", ink: "#263b32", accent: "#d9421d", soft: "#efbd73" },
    displayFont: "mono",
    bodyFont: "sans",
    tone: "calm, technical, precise",
    headline: "The runtime calibration layer for AI agents",
    subline: "Your frontier models stay in place. Every run teaches the next one.",
    action: "Connect your agent",
    source: "Colours from mubit.ai (unconfirmed); copy from mubit.ai",
  },
];

export function fontStack(kind: Brand["displayFont"]): string {
  if (kind === "serif") return 'Georgia, "Times New Roman", serif';
  if (kind === "mono") return 'Menlo, "Courier New", monospace';
  return '"Helvetica Neue", Helvetica, Arial, sans-serif';
}

export function brandSummary(b: Brand): string {
  return `Brand: ${b.name}. Tone: ${b.tone}. Colours: background ${b.colours.bg}, ink ${b.colours.ink}, accent ${b.colours.accent}. Headline: "${b.headline}".`;
}
