import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "AGB · ValidationKit",
  description:
    "Allgemeine Geschäftsbedingungen (AGB) der ValidationKit für die Nutzung des SaaS-Dienstes, inkl. Abo- und Credit-Preisen, Laufzeit und Haftung.",
};

// ⚠️ BUNDLE F — KI-erstellter Standard-Text für ein deutsches B2B-SaaS-
// Einzelunternehmen. Vor Go-Live anwaltliche Review (Master-Plan §11). Keine
// Rechtsberatung. Anbieter/Anschrift = Impressum. Finale Domain in Wave 3.

export default function AgbPage() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12"
    >
      <SiteNav />
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Allgemeine Geschäftsbedingungen (AGB)
        </h1>
        <p className="text-sm text-muted-foreground">
          Diese AGB regeln die Nutzung von ValidationKit. Sie gelten ergänzend
          zu unserem{" "}
          <Link
            href={"/legal/dpa" as never}
            className="underline-offset-4 hover:underline"
          >
            Auftragsverarbeitungsvertrag
          </Link>{" "}
          und der{" "}
          <Link
            href={"/legal/subprocessors" as never}
            className="underline-offset-4 hover:underline"
          >
            Subprozessoren-Liste
          </Link>
          . Anbieter und Anschrift siehe{" "}
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
          <CardTitle>1. Geltungsbereich und Vertragspartner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Diese Allgemeinen Geschäftsbedingungen gelten für sämtliche
            Verträge über die Nutzung des SaaS-Dienstes ValidationKit zwischen
            dem im Impressum genannten Anbieter (nachfolgend „Anbieter“) und dem
            Kunden (nachfolgend „Kunde“).
          </p>
          <p>
            Das Angebot richtet sich ausschließlich an Unternehmer im Sinne des
            § 14 BGB, juristische Personen des öffentlichen Rechts und
            öffentlich-rechtliche Sondervermögen. Verbraucher im Sinne des § 13
            BGB sind nicht Adressaten des Angebots.
          </p>
          <p>
            Abweichende, entgegenstehende oder ergänzende Bedingungen des Kunden
            werden nicht Vertragsbestandteil, es sei denn, der Anbieter stimmt
            ihrer Geltung ausdrücklich in Textform zu.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Vertragsgegenstand und Leistungsbeschreibung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            ValidationKit ist eine Software-as-a-Service-Plattform zur
            Prüfung (Audit) von KI-Agenten-Konfigurationsdateien in
            Quellcode-Repositories. Audits werden gegen Drittanbieter-LLMs
            (Anthropic, OpenAI) ausgeführt und erzeugen Befunde sowie
            Lösungsvorschläge.
          </p>
          <p>
            Der konkrete Leistungsumfang ergibt sich aus der zum
            Vertragsschluss gewählten Tarifstufe und der jeweils aktuellen
            Leistungsbeschreibung auf der{" "}
            <Link href="/pricing" className="underline-offset-4 hover:underline">
              Preisseite
            </Link>
            . Der Anbieter stellt dem Kunden die Software über das Internet zur
            Nutzung bereit; eine Überlassung der Software zum dauerhaften
            Verbleib (Kauf) erfolgt nicht.
          </p>
          <p>
            Der Anbieter ist berechtigt, den Dienst fortzuentwickeln und
            anzupassen, soweit der vertraglich geschuldete Leistungsumfang
            dadurch nicht wesentlich eingeschränkt wird.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Vertragsschluss und Nutzerkonto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Der Vertrag kommt mit der Registrierung des Kunden und der
            Bestätigung durch den Anbieter, spätestens jedoch mit der
            Bereitstellung des Zugangs zustande. Für kostenpflichtige Tarife
            kommt der Vertrag mit Abschluss des Bestellvorgangs über den
            Zahlungsdienstleister zustande.
          </p>
          <p>
            Der Kunde ist verpflichtet, seine Zugangsdaten geheim zu halten und
            vor dem Zugriff Dritter zu schützen. Der Kunde ist für sämtliche
            Aktivitäten verantwortlich, die über sein Nutzerkonto erfolgen.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Abo- und Credit-Preise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            ValidationKit nutzt ein hybrides Preismodell aus Abonnement und
            Credits:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              Ein monatliches oder jährliches Abonnement enthält je
              Abrechnungszeitraum ein Credit-Kontingent.
            </li>
            <li>
              Jedes Audit verbraucht Credits: 1 Credit für ein Quick-Audit und
              5 Credits für ein Deep-Audit.
            </li>
            <li>
              <strong>
                Über das Kontingent hinausgehende Credits (Überverbrauch) werden
                mit 0,30 € je Credit abgerechnet.
              </strong>{" "}
              Dieser Satz ist so kalkuliert, dass er die zugrunde liegenden
              KI-Rechenkosten, die Zahlungsabwicklungsgebühren sowie eine kleine
              Servicemarge annähert.
            </li>
            <li>
              Vorausbezahlte Credit-Pakete (25 € für 100 Credits, 99 € für 500
              Credits) sind verfügbar; Pakete verfallen 12 Monate nach Kauf.
            </li>
          </ul>
          <p>
            Jede Rechnung weist Abonnement, Überverbrauchs-Credits und
            Umsatzsteuer gesondert aus. Es gibt keinen verdeckten Aufschlag; den
            KI-Rechenkostenanteil können Sie in Ihrem Workspace-KI-Nutzungslog
            nachvollziehen.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Preisänderungen durch Anbieterkosten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Der Anbieter zahlt Anthropic und OpenAI pro Token für die
            KI-Rechenleistung hinter jedem Audit. Die Preise dieser Anbieter
            können sich ohne Vorankündigung ändern. Der Anbieter behält sich
            vor, den Credit-Überverbrauchssatz (derzeit 0,30 € je Credit) als
            Reaktion auf wesentliche Preisänderungen der Anbieter anzupassen.
          </p>
          <p>
            <strong>30-Tage-Ankündigung:</strong> Jede Satzänderung wird dem
            Workspace-Inhaber mindestens 30 Tage vor Inkrafttreten per E-Mail
            angekündigt. Bestehende Abrechnungszeiträume werden nicht rückwirkend
            neu bepreist; der neue Satz gilt ab der nächsten Verlängerung.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Zahlung und Abwicklung (Stripe)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Sämtliche angegebenen Preise verstehen sich zuzüglich der jeweils
            gesetzlichen Umsatzsteuer. Die Zahlungsabwicklung erfolgt über den
            Zahlungsdienstleister Stripe. Mit Abschluss eines kostenpflichtigen
            Tarifs ermächtigt der Kunde den Anbieter, die fälligen Entgelte über
            das gewählte Zahlungsmittel einzuziehen.
          </p>
          <p>
            Abonnemententgelte sind im Voraus für den jeweiligen
            Abrechnungszeitraum fällig. Überverbrauchs-Credits und
            Credit-Pakete werden nach Verbrauch bzw. Kauf abgerechnet. Gerät der
            Kunde mit einer Zahlung in Verzug, ist der Anbieter berechtigt, den
            Zugang nach vorheriger Ankündigung in Textform vorübergehend zu
            sperren.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Umsatzsteuer und Reverse-Charge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Die Umsatzsteuer wird über Stripe Tax erhoben. B2B-Kunden aus der EU
            mit gültiger USt-IdNr. profitieren vom Reverse-Charge-Verfahren; die
            Rechnung enthält den Hinweis „Steuerschuldnerschaft des
            Leistungsempfängers / Reverse Charge“. Für Leistungsempfänger ohne
            gültige USt-IdNr. wird die jeweils geltende Umsatzsteuer berechnet.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Laufzeit, Verlängerung und Kündigung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Abonnements werden für den gewählten Abrechnungszeitraum (monatlich
            oder jährlich) abgeschlossen und verlängern sich automatisch um den
            jeweils gewählten Zeitraum, sofern sie nicht zum Ende des laufenden
            Zeitraums gekündigt werden.
          </p>
          <p>
            Die Kündigung ist jederzeit zum Ende des laufenden bezahlten
            Zeitraums über das Stripe-Kundenportal möglich; der Zugang bleibt bis
            zum Ende des bezahlten Zeitraums erhalten. Eine anteilige Erstattung
            für nicht genutzte Teilzeiträume erfolgt nicht.
          </p>
          <p>
            Vorausbezahlte Credit-Pakete sind nach dem Kauf von der Erstattung
            ausgeschlossen. Nicht verbrauchte Credits eines aktiven
            Abrechnungszeitraums werden nicht in den nächsten Zeitraum
            übertragen. Das Recht zur außerordentlichen Kündigung aus wichtigem
            Grund bleibt für beide Parteien unberührt.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. BYOK-Option (Bring-Your-Own-Key)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Pro- und Agency-Workspaces können in den Workspace-KI-Einstellungen
            „Bring-Your-Own-Key“ (BYOK) aktivieren. Ist BYOK aktiv, laufen alle
            Audits gegen das eigene Anthropic- oder OpenAI-Konto des Kunden; der
            Anbieter rechnet für diesen Workspace keine KI-Rechenleistung mehr
            ab (die Abonnemententgelte bleiben in voller Höhe geschuldet).
          </p>
          <p>
            Vom Kunden bereitgestellte API-Schlüssel werden verschlüsselt
            gespeichert (AES-256-GCM, ADR-0008) und sind nach dem Speichern nicht
            mehr über das Kundenportal auslesbar. Sie können lediglich rotiert
            oder entfernt werden.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>10. Faire Nutzung und Rate-Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Die Audit-Auslöse-Rate je Workspace skaliert mit der Tarifstufe
            (Free 60/Stunde, Starter 200/Stunde, Pro 1 000/Stunde, Agency
            5 000/Stunde). Diese Grenzen sind weiche Obergrenzen zur Vermeidung
            ausufernder Automatisierung. Bei anhaltendem Missbrauch kann der
            Zugang nach vorheriger Mitteilung in Textform vorübergehend
            gesperrt werden.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>11. Verfügbarkeit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Der Anbieter bemüht sich um eine hohe Verfügbarkeit des Dienstes,
            schuldet jedoch keine ununterbrochene Verfügbarkeit. Ausgenommen
            sind insbesondere Zeiten geplanter Wartung sowie Störungen außerhalb
            des Einflussbereichs des Anbieters (höhere Gewalt, Ausfälle von
            Vorleistungen Dritter wie Hosting-, LLM- oder
            Zahlungsdienstleistern).
          </p>
          <p>
            Geplante Wartungsarbeiten werden, soweit zumutbar, vorab angekündigt
            und nach Möglichkeit in nutzungsschwache Zeiten gelegt.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>12. Pflichten des Kunden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Der Kunde stellt sicher, dass er zur Übermittlung der von ihm in den
            Dienst eingebrachten Inhalte (insbesondere Repository-Inhalte) und
            zu deren Verarbeitung durch den Anbieter berechtigt ist. Der Kunde
            verarbeitet die Inhalte als Verantwortlicher; der Anbieter handelt
            insoweit als Auftragsverarbeiter (siehe{" "}
            <Link
              href={"/legal/dpa" as never}
              className="underline-offset-4 hover:underline"
            >
              Auftragsverarbeitungsvertrag
            </Link>
            ).
          </p>
          <p>
            Der Kunde unterlässt jede missbräuchliche Nutzung des Dienstes,
            insbesondere Eingriffe in die Sicherheit, das Umgehen von Limits
            sowie das Einbringen rechtswidriger Inhalte.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>13. Gewährleistung und Haftung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Der Dienst wird „wie besehen“ bereitgestellt. Die von KI erzeugten
            Befunde und Lösungsvorschläge stellen Hinweise dar und ersetzen
            keine eigene fachliche Prüfung durch den Kunden; eine bestimmte
            inhaltliche Richtigkeit oder ein bestimmter Erfolg wird nicht
            geschuldet.
          </p>
          <p>
            Der Anbieter haftet unbeschränkt bei Vorsatz und grober
            Fahrlässigkeit, bei Verletzung von Leben, Körper oder Gesundheit
            sowie nach dem Produkthaftungsgesetz. Bei leicht fahrlässiger
            Verletzung wesentlicher Vertragspflichten (Kardinalpflichten) haftet
            der Anbieter der Höhe nach begrenzt auf den vertragstypischen,
            vorhersehbaren Schaden. Im Übrigen ist die Haftung ausgeschlossen.
          </p>
          <p>
            Soweit die Haftung dem Grunde nach besteht und nicht zwingend
            gesetzlich höher angesetzt ist, ist die Gesamthaftung für jeglichen
            Anspruch auf die in den 12 Monaten vor dem schadensbegründenden
            Ereignis gezahlten Entgelte begrenzt.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>14. Schlussbestimmungen und Gerichtsstand</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss
            des UN-Kaufrechts (CISG).
          </p>
          <p>
            Ist der Kunde Kaufmann, juristische Person des öffentlichen Rechts
            oder öffentlich-rechtliches Sondervermögen, ist ausschließlicher
            Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit
            diesem Vertrag der Geschäftssitz des Anbieters (siehe Impressum).
          </p>
          <p>
            Änderungen und Ergänzungen dieser AGB bedürfen der Textform. Sollten
            einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der
            übrigen Bestimmungen unberührt; an die Stelle der unwirksamen
            Bestimmung tritt die gesetzlich zulässige Regelung, die dem
            wirtschaftlichen Zweck am nächsten kommt.
          </p>
        </CardContent>
      </Card>

      <footer className="text-xs text-muted-foreground">
        Version 1.0, Stand 2026-05-21. Anwaltliche Review von AGB + DPA steht
        aus (Master-Plan §11 out-of-scope). Bei Fragen schreiben Sie an{" "}
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
