import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Datenschutzerklärung — ValidationKit",
  description:
    "Informationen zur Verarbeitung personenbezogener Daten nach Art. 13 DSGVO.",
};

// ⚠️ BUNDLE F — VOR GO-LIVE: datenschutz@<domain> + Anschrift werden mit der
// Domain (Wave 3) final gesetzt; Verantwortlicher = Impressum. KI-erstellter
// Standard-Text auf Basis DSGVO/Art. 13 — keine Rechtsberatung.
const CONTROLLER = {
  name: "Kolja Schöpe",
  // Konsistent mit den übrigen Legal-Seiten; finale Domain in Wave 3.
  email: "datenschutz@validationkit.app",
};

function Li({ children }: { children: React.ReactNode }) {
  return <li className="text-muted-foreground">{children}</li>;
}

export default function DatenschutzPage() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12"
    >
      <SiteNav />

      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Datenschutzerklärung
        </h1>
        <p className="text-sm text-muted-foreground">
          Informationen über die Verarbeitung personenbezogener Daten nach
          Art. 13 / 14 DSGVO. Verantwortlicher und Anschrift siehe{" "}
          <Link
            href={"/legal/impressum" as never}
            className="underline-offset-4 hover:underline"
          >
            Impressum
          </Link>
          .
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>1. Verantwortlicher</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Verantwortlicher im Sinne der DSGVO ist {CONTROLLER.name}
            (Einzelunternehmen). Anschrift siehe Impressum. Anfragen zum
            Datenschutz: {CONTROLLER.email}.
          </p>
          <p>
            Wir haben keinen Datenschutzbeauftragten bestellt: Als
            Einzelunternehmen mit weniger als 20 ständig mit der Verarbeitung
            beschäftigten Personen und ohne umfangreiche Verarbeitung besonderer
            Kategorien besteht keine Bestellpflicht nach Art. 37 DSGVO / § 38
            BDSG.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Verarbeitete Daten, Zwecke und Rechtsgrundlagen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              Konto, E-Mail und Anmeldung (Magic-Link)
            </p>
            <p>
              E-Mail-Adresse und Konto-/Session-Daten zur Bereitstellung des
              Dienstes und zur passwortlosen Anmeldung. Rechtsgrundlage:
              Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung). Bei der
              Anmeldung per Magic-Link sowie bei jeder Session werden zu
              Sicherheitszwecken IP-Adresse und User-Agent verarbeitet —
              Rechtsgrundlage Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
              Interesse an Missbrauchs- und Angriffsabwehr).
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-medium text-foreground">
              Workspaces, Mitgliedschaften, verbundene Repositories
            </p>
            <p>
              Workspace-, Mitglieds- und Repository-Stammdaten zur
              Bereitstellung der Mehrbenutzer- und Audit-Funktionen.
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-medium text-foreground">
              Zahlungs- und Rechnungsdaten (Stripe)
            </p>
            <p>
              Zur Abwicklung kostenpflichtiger Tarife verarbeiten wir
              Kundenstamm-, Abonnement- und Rechnungsdaten. Die
              Zahlungsabwicklung erfolgt über Stripe; vollständige
              Kartendaten werden ausschließlich von Stripe verarbeitet, nicht
              von uns gespeichert. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO
              (Vertrag) sowie Art. 6 Abs. 1 lit. c DSGVO i. V. m. § 147 AO /
              § 14b UStG (gesetzliche Aufbewahrungspflicht für Rechnungen).
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-medium text-foreground">
              Audit-Inhalte (Repository-Konfigurationsdateien)
            </p>
            <p>
              Zur Durchführung der Audits verarbeiten wir die übergebenen
              Repository-Inhalte (insb. AGENTS.md / CLAUDE.md / SKILL.md) sowie
              die erzeugten Befunde. Diese Inhalte verarbeiten wir im Auftrag
              und auf Weisung des jeweiligen Kunden; insoweit ist der Kunde
              Verantwortlicher und wir Auftragsverarbeiter (siehe{" "}
              <Link
                href={"/legal/dpa" as never}
                className="underline-offset-4 hover:underline"
              >
                Auftragsverarbeitungsvertrag
              </Link>
              ). Rechtsgrundlage gegenüber dem Kunden: Art. 6 Abs. 1 lit. b
              DSGVO i. V. m. Art. 28 DSGVO.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-medium text-foreground">
              Audit-Trail, Einwilligungs- und Webhook-Protokolle
            </p>
            <p>
              Zum Nachweis von Entscheidungen (z. B. Zustimmung zum
              Auftragsverarbeitungsvertrag, einschließlich IP-Adresse und
              User-Agent zum Zeitpunkt der Zustimmung) sowie zur Verarbeitung
              von Zahlungs- und Plattform-Webhooks führen wir Protokolle.
              Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (Nachweis- und
              Sicherheitsinteresse, Art. 7 Abs. 1 DSGVO).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Empfänger und Auftragsverarbeiter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Wir setzen sorgfältig ausgewählte Dienstleister als
            Auftragsverarbeiter (Art. 28 DSGVO) ein, u. a. für Hosting,
            Datenbank, Zahlungsabwicklung, E-Mail-Versand, Hintergrund-Jobs und
            KI-gestützte Analyse. Die aktuelle, vollständige Liste mit Zweck und
            Sitz finden Sie in unserer{" "}
            <Link
              href={"/legal/subprocessors" as never}
              className="underline-offset-4 hover:underline"
            >
              Subprozessoren-Liste
            </Link>{" "}
            (u. a. Stripe, Resend, Anthropic, OpenAI, Inngest, Neon, Vercel).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Drittlandübermittlung (USA)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Einige der eingesetzten Dienstleister verarbeiten Daten in den USA.
            Die Übermittlung erfolgt auf Grundlage der
            EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO) und,
            soweit der jeweilige Anbieter zertifiziert ist, auf Grundlage des
            EU-US Data Privacy Framework (Angemessenheitsbeschluss nach Art. 45
            DSGVO). Eine Transfer-Folgenabschätzung (TIA) liegt vor.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Speicherdauer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="space-y-1">
            <Li>
              Konto- und Workspace-Daten: bis zur Löschung des Kontos; das
              Konto kann jederzeit selbst gelöscht werden (sofortige
              Hard-Löschung).
            </Li>
            <Li>
              Rechnungs- und Buchungsbelege: 10 Jahre (§ 147 AO, § 14b UStG).
            </Li>
            <Li>Audit-Trail-/Nachweisdaten: bis zu 12 Monate.</Li>
            <Li>
              Sicherheits-Metadaten (IP/User-Agent) auf erhaltenen
              Nachweis-Zeilen werden bei Konto-Löschung anonymisiert
              (auf NULL gesetzt).
            </Li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Cookies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Wir setzen ausschließlich technisch notwendige Cookies ein; es
            findet kein Tracking und keine Analyse durch Dritte statt. Ein
            Einwilligungsbanner ist daher nach § 25 Abs. 2 Nr. 2 TDDDG nicht
            erforderlich.
          </p>
          <ul className="space-y-1">
            <Li>
              <span className="font-mono text-xs">Better-Auth-Session</span> —
              Anmeldung/Session (technisch notwendig).
            </Li>
            <Li>
              <span className="font-mono text-xs">
                vk_default_workspace_slug
              </span>{" "}
              — Merkt den zuletzt genutzten Workspace (funktional).
            </Li>
            <Li>
              <span className="font-mono text-xs">sidebar</span> — UI-Zustand
              der Seitenleiste (funktional).
            </Li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Ihre Rechte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16),
            Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
            Datenübertragbarkeit (Art. 20) sowie Widerspruch gegen die
            Verarbeitung (Art. 21 DSGVO). Anfragen richten Sie an{" "}
            {CONTROLLER.email}.
          </p>
          <p>
            Soweit die Verarbeitung auf einer Einwilligung beruht, können Sie
            diese jederzeit mit Wirkung für die Zukunft widerrufen.
          </p>
          <p>
            Sie haben zudem das Recht, sich bei einer
            Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77 DSGVO) —
            zuständig ist die Landesdatenschutzbehörde des Bundeslandes, in dem
            der Verantwortliche seinen Sitz hat.
          </p>
        </CardContent>
      </Card>

      {/* English convenience translation. The German version above is authoritative. */}
      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          Privacy policy (English)
        </h2>
        <p className="text-sm text-muted-foreground">
          Convenience summary — the German version above is the legally
          authoritative text.
        </p>
        <Card>
          <CardContent className="space-y-3 py-6 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Controller:</span>{" "}
              {CONTROLLER.name} (sole proprietor; address in the legal notice).
              Privacy contact: {CONTROLLER.email}.
            </p>
            <p>
              <span className="font-medium text-foreground">
                What we process &amp; why:
              </span>{" "}
              account/email/session data and workspace data to provide the
              service (Art. 6(1)(b) GDPR); IP + user-agent at sign-in and per
              session for security (Art. 6(1)(f)); billing data via Stripe,
              retained 10 years for tax law (Art. 6(1)(b)+(c)); repository audit
              content processed as a processor on the customer&apos;s behalf
              (Art. 28 GDPR, see the{" "}
              <Link
                href={"/legal/dpa" as never}
                className="underline-offset-4 hover:underline"
              >
                DPA
              </Link>
              ).
            </p>
            <p>
              <span className="font-medium text-foreground">
                Processors &amp; transfers:
              </span>{" "}
              see the{" "}
              <Link
                href={"/legal/subprocessors" as never}
                className="underline-offset-4 hover:underline"
              >
                sub-processors list
              </Link>
              ; US transfers rely on the EU Standard Contractual Clauses and the
              EU-US Data Privacy Framework where certified.
            </p>
            <p>
              <span className="font-medium text-foreground">Your rights:</span>{" "}
              access, rectification, erasure, restriction, portability and
              objection (Art. 15–21 GDPR), and the right to lodge a complaint
              with a supervisory authority (Art. 77 GDPR). No tracking cookies —
              only strictly-necessary/functional cookies, so no consent banner
              is required.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
