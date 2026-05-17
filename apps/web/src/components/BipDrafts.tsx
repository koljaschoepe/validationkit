"use client";

import { useState } from "react";
import type { BipDraftSet } from "@vk/bip-generator";

export function BipDrafts({ set }: { set: BipDraftSet }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(format: string, body: string) {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(format);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="findings">
      {set.drafts.map((d) => (
        <div key={d.format} className="finding" data-sev="Strong">
          <div className="head">
            <span className="title">{d.title}</span>
            <span className="cat">
              {d.charCount} chars · {d.format}
            </span>
            <button
              type="button"
              onClick={() => copy(d.format, d.body)}
              style={{
                marginLeft: "auto",
                background: "transparent",
                color: "var(--accent)",
                border: "1px solid var(--border)",
                padding: "0.2rem 0.6rem",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              {copied === d.format ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "0.9rem",
              margin: "0.4rem 0 0",
              color: "var(--fg-dim)",
            }}
          >
            {d.body}
          </pre>
        </div>
      ))}
    </div>
  );
}
