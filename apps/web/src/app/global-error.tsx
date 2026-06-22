"use client";

import { useEffect } from "react";

/**
 * Top-level global error handler. This renders OUTSIDE the layout chain
 * (no SiteNav, no shadcn — the layout itself may be what's broken). Keep
 * the markup minimal and inline-styled so a layout failure can't cascade.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="de">
      <body
        style={{
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
          fontFamily: "system-ui, -apple-system, sans-serif",
          margin: 0,
          padding: "2rem 1.5rem",
          minHeight: "100vh",
        }}
      >
        <main
          style={{
            maxWidth: "32rem",
            margin: "4rem auto",
            border: "1px solid #525252",
            borderRadius: "0.5rem",
            padding: "1.5rem",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", margin: "0 0 0.75rem" }}>
            Auf Root-Ebene ist etwas fehlgeschlagen.
          </h1>
          <p style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>
            Das Layout selbst konnte nicht gerendert werden — das deutet
            meist auf eine Exception auf Server-Component-Ebene hin. Lade die
            Seite neu; falls das Problem bestehen bleibt, melde es unter{" "}
            <a
              href="https://github.com/koljaschoepe/validationkit/issues"
              style={{ color: "#fafafa", textDecoration: "underline" }}
            >
              GitHub Issues
            </a>
            .
          </p>
          {error.digest ? (
            <p
              style={{
                fontSize: "0.75rem",
                fontFamily: "monospace",
                color: "#a3a3a3",
                marginTop: "0.5rem",
              }}
            >
              digest: {error.digest}
            </p>
          ) : null}
          <p style={{ marginTop: "1rem" }}>
            <a
              href="/"
              style={{
                display: "inline-block",
                padding: "0.4rem 0.9rem",
                borderRadius: "0.375rem",
                background: "#fafafa",
                color: "#0a0a0a",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 500,
              }}
            >
              Startseite
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
