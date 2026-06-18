import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Open-Source-Lizenzen · ValidationKit",
  description:
    "Übersicht der wichtigsten in ValidationKit eingesetzten Open-Source-Bibliotheken und ihrer Lizenzen.",
};

// Bundle F — German OSS attribution page. The full grouped notice lives in the
// repo-root THIRD_PARTY_NOTICES.md (regenerate via `pnpm licenses list --prod`).
// This page surfaces the key user-relevant dependencies; counts are approximate
// and reflect the production dependency tree as of the date in the footer.

interface OssDep {
  name: string;
  license: string;
  purpose: string;
  url: string;
}

const KEY_DEPS: ReadonlyArray<OssDep> = [
  {
    name: "Next.js",
    license: "MIT",
    purpose: "Web-Framework (App Router, Rendering)",
    url: "https://github.com/vercel/next.js",
  },
  {
    name: "React / React DOM",
    license: "MIT",
    purpose: "UI-Laufzeit und Komponentenmodell",
    url: "https://github.com/facebook/react",
  },
  {
    name: "Drizzle ORM",
    license: "Apache-2.0",
    purpose: "Typsicheres Postgres-ORM und Migrationen",
    url: "https://github.com/drizzle-team/drizzle-orm",
  },
  {
    name: "Better-Auth",
    license: "MIT",
    purpose: "Authentifizierung (passwortlose Magic-Link-Anmeldung)",
    url: "https://github.com/better-auth/better-auth",
  },
  {
    name: "Stripe Node SDK",
    license: "Apache-2.0",
    purpose: "Abrechnung, Rechnungen, Kundenportal",
    url: "https://github.com/stripe/stripe-node",
  },
  {
    name: "@ai-sdk/anthropic, @ai-sdk/openai",
    license: "Apache-2.0",
    purpose: "LLM-Provider-SDKs für Audits",
    url: "https://github.com/vercel/ai",
  },
  {
    name: "nodemailer",
    license: "MIT",
    purpose: "SMTP-E-Mail-Versand (Resend in Produktion)",
    url: "https://github.com/nodemailer/nodemailer",
  },
  {
    name: "react-email",
    license: "MIT",
    purpose: "Transaktions-E-Mail-Templates",
    url: "https://github.com/resend/react-email",
  },
  {
    name: "Zod",
    license: "MIT",
    purpose: "Laufzeit-Schema-Validierung",
    url: "https://github.com/colinhacks/zod",
  },
  {
    name: "Tailwind CSS",
    license: "MIT",
    purpose: "CSS-Framework",
    url: "https://github.com/tailwindlabs/tailwindcss",
  },
  {
    name: "lucide-react",
    license: "ISC",
    purpose: "Icon-Set",
    url: "https://github.com/lucide-icons/lucide",
  },
  {
    name: "OpenTelemetry (@opentelemetry/*)",
    license: "Apache-2.0",
    purpose: "Tracing / Observability",
    url: "https://github.com/open-telemetry/opentelemetry-js",
  },
];

interface LicenseFamily {
  license: string;
  count: string;
  note: string;
}

const LICENSE_FAMILIES: ReadonlyArray<LicenseFamily> = [
  { license: "MIT", count: "~446", note: "Permissiv" },
  { license: "Apache-2.0", count: "~107", note: "Permissiv (mit Patentlizenz)" },
  { license: "ISC", count: "~28", note: "Permissiv (MIT-äquivalent)" },
  { license: "BSD-3-Clause", count: "~17", note: "Permissiv" },
  { license: "BSD-2-Clause", count: "~6", note: "Permissiv" },
  { license: "MPL-2.0", count: "2", note: "Schwaches Copyleft (dateibezogen)" },
  { license: "Sonstige", count: "~6", note: "0BSD, MIT-0, Unlicense, Dual-Lizenzen" },
];

export default function OssPage() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12"
    >
      <SiteNav />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Open-Source-Lizenzen
        </h1>
        <p className="text-sm text-muted-foreground">
          ValidationKit baut auf Open-Source-Software auf. Wir danken den
          Maintainerinnen und Maintainern der folgenden Projekte. Sämtliche in
          Produktion gebündelten Abhängigkeiten stehen unter permissiven oder
          schwach-copyleft-Lizenzen (dateibezogenes MPL-2.0); es ist keine
          starke Copyleft-Lizenz (GPL/AGPL/LGPL) im Produktions-Abhängigkeitsbaum
          enthalten.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Wichtige eingesetzte Bibliotheken</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y">
            {KEY_DEPS.map((d) => (
              <li key={d.name} className="flex flex-col gap-1 py-3">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={d.url as never}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {d.name}
                  </Link>
                  <span className="font-mono text-xs text-muted-foreground">
                    {d.license}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{d.purpose}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lizenz-Übersicht (Produktions-Abhängigkeiten)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y">
            {LICENSE_FAMILIES.map((f) => (
              <li
                key={f.license}
                className="flex items-center justify-between gap-2 py-2.5 text-sm"
              >
                <span className="font-mono text-xs text-foreground">
                  {f.license}
                </span>
                <span className="text-muted-foreground">{f.note}</span>
                <span className="text-muted-foreground tabular-nums">
                  {f.count} Pakete
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vollständige Auflistung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Eine gruppierte Gesamtübersicht aller Lizenzfamilien findet sich in
            der Datei{" "}
            <span className="font-mono text-xs">THIRD_PARTY_NOTICES.md</span> im
            Wurzelverzeichnis des Repositorys. Die maßgebliche,
            maschinenlesbare Quelle bleibt die Lockfile{" "}
            <span className="font-mono text-xs">pnpm-lock.yaml</span> sowie die
            jeweilige <span className="font-mono text-xs">LICENSE</span>-Datei
            jeder Abhängigkeit.
          </p>
          <p>
            Die Übersicht lässt sich jederzeit reproduzieren mit{" "}
            <span className="font-mono text-xs">pnpm licenses list --prod</span>.
          </p>
        </CardContent>
      </Card>

      <footer className="text-xs text-muted-foreground">
        Stand 2026-06-18. Paketzahlen sind Näherungswerte und beziehen sich auf
        den Produktions-Abhängigkeitsbaum. Bei Fragen zur Lizenzierung schreiben
        Sie an{" "}
        <a
          href="mailto:legal@validationkit.app"
          className="underline-offset-4 hover:underline"
        >
          legal@validationkit.app
        </a>
        .
      </footer>
    </main>
  );
}
