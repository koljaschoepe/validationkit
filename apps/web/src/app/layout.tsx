import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SkipToContent } from "@/components/SkipToContent";
import { GlobalMotionConfig } from "@/components/GlobalMotionConfig";

// Phase Nova-2 P7: `display: 'swap'` keeps the fallback visible during font
// fetch (no FOIT). `adjustFontFallback: true` is on by default in next/font
// — we pin it explicit so future Next versions can't silently drop it.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: true,
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  adjustFontFallback: true,
});

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

// Mobile viewport: width=device-width is mandatory or mobile browsers scale
// the page arbitrarily and touch-targets misalign. `viewport-fit=cover` lets
// us extend behind iOS notches when needed.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn(geist.variable, geistMono.variable)}>
      <body className="font-sans antialiased">
        <SkipToContent />
        <GlobalMotionConfig>
          <TooltipProvider>{children}</TooltipProvider>
        </GlobalMotionConfig>
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
