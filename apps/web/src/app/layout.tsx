import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

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
