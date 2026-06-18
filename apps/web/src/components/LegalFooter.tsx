import Link from "next/link";

/**
 * LegalFooter — reusable footer linking the German legal pages
 * (Impressum, Datenschutz, AGB, Open-Source-Lizenzen).
 *
 * Single source of truth for the legally-required footer links so every
 * surface (landing, app shells) stays in sync. The links use `as never`
 * because the typed-routes manifest does not enumerate the `/legal/*`
 * routes, matching the existing pattern across the legal pages.
 */

interface LegalLink {
  href: string;
  label: string;
}

const LEGAL_LINKS: ReadonlyArray<LegalLink> = [
  { href: "/legal/impressum", label: "Impressum" },
  { href: "/legal/datenschutz", label: "Datenschutz" },
  { href: "/legal/agb", label: "AGB" },
  { href: "/legal/oss", label: "Open-Source-Lizenzen" },
];

export function LegalFooter({ className }: { className?: string }) {
  return (
    <footer className={className ?? "border-t border-border"}>
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row sm:px-8 font-mono type-mono-sm text-muted-foreground">
        <div>© 2026 ValidationKit</div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-6">
            <li>
              <Link href="/pricing" className="hover:text-foreground">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/trust" className="hover:text-foreground">
                Trust
              </Link>
            </li>
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href as never}
                  className="hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/status" className="hover:text-foreground">
                Status ●
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
