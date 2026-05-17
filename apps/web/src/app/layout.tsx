import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

// Force runtime rendering for every page.
// Reason: Vercel Marketplace-Integration env vars (e.g. Neon DATABASE_URL)
// are runtime-only — they are NOT exposed to the build process. Static
// prerendering would freeze `isAuthEnabled() === false` into the HTML.
// Phase-2 optimization: switch to per-route opt-in static where auth-irrelevant.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ValidationKit — Cross-Vendor Agent-File Audit",
  description:
    "Point at a repo. Get a deterministic audit of CLAUDE.md, AGENTS.md, .claude/agents, commands and skills. No vibe scores.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
