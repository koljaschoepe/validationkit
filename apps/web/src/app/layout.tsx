import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

// Force runtime rendering for every page.
// Reason: Vercel Marketplace-Integration env vars (e.g. Neon DATABASE_URL)
// are runtime-only — they are NOT exposed to the build process. Static
// prerendering would freeze `isAuthEnabled() === false` into the HTML.
// Phase-2 optimization: switch to per-route opt-in static where auth-irrelevant.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ValidationKit — Agent-File Audit",
  description:
    "Point at a public GitHub repo. Get a deterministic audit of CLAUDE.md, AGENTS.md, .claude/agents, .cursor/rules, and 8 more vendor formats. No vibe scores.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn(geist.variable, geistMono.variable)}>
      <body className="font-sans antialiased">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
