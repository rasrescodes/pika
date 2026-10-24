import type { Metadata } from "next";
import { Fredoka, Inter } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import "@/src/styles/tokens.css";
import "./globals.css";

// Kimberley's brand type: Fredoka for expressive headings, Inter for UI and body (brand/guidelines).
const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Pika: an art director that learns your taste",
  icons: { icon: "/brand/pika-icon.svg" },
  description: "Pika generates website sections, the Juror scores them like an Awwwards jury, and your corrections teach it your taste.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${fredoka.variable} ${inter.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
