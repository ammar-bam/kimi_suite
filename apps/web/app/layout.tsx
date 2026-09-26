import type { Metadata } from "next";
import "./globals.css";
import Header from "./_components/header";
import { ToastContainer } from "./_components/toast";

export const metadata: Metadata = {
  title: "KimiAI Suite",
  description: "Modular AI productivity suite powered by KIMI"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-1">{children}</div>
        <ToastContainer />
      </body>
    </html>
  );
}