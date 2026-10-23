import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@/src/styles/tokens.css";
import "./globals.css";

const newsreader = Newsreader({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-newsreader" });

export const metadata: Metadata = {
  title: "Pika: an art director that learns your taste",
  description: "Pika generates website sections, the Juror scores them like an Awwwards jury, and your corrections teach it your taste.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${newsreader.variable} ${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
