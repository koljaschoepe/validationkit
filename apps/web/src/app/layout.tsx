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

// Nova-3a Bundle B (Sub-6 K4): root-layout `force-dynamic` removed. Pages that
// touch dynamic APIs (cookies(), headers(), DAL) opt-in to dynamic rendering
// automatically. SiteNav reads `cookies()` via getSessionUser(), so any page
// that mounts it stays dynamic. Pure marketing routes (e.g. legal/*) can now
// statically prerender or use `'use cache'` for full edge-cached HTML.

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "ValidationKit — Agent-File Audit",
    template: "%s · ValidationKit",
  },
  description:
    "Point at a public GitHub repo. Get a deterministic audit of CLAUDE.md, AGENTS.md, .claude/agents, .cursor/rules, and 8 more vendor formats. No vibe scores.",
  applicationName: "ValidationKit",
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "ValidationKit",
    title: "ValidationKit — Agent-File Audit",
    description:
      "Deterministic audits for AGENTS.md, CLAUDE.md, and 8 more vendor formats. No vibe scores.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ValidationKit — Agent-File Audit",
    description:
      "Deterministic audits for AGENTS.md, CLAUDE.md, and 8 more vendor formats. No vibe scores.",
  },
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
    <html lang="de" className={cn(geist.variable, geistMono.variable)}>
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
