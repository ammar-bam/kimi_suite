import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KimiAI Suite",
  description: "Modular AI productivity suite powered by KIMI"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
