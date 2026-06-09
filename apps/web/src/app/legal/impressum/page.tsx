import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Impressum — ValidationKit",
  description: "Anbieterkennzeichnung nach § 5 DDG (ex-TMG).",
};

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️ BUNDLE F — VOR GO-LIVE AUSFÜLLEN. Diese Felder kann nur der Inhaber liefern.
// Name ist bekannt; Anschrift / Kontakt / USt-IdNr sind Platzhalter. E-Mail/Domain
// werden in Wave 3 (Domain-Kauf) final gesetzt. Pflicht nach § 5 DDG für ein
// geschäftsmäßiges Online-Angebot (Free-Tier + Self-Service-Checkout zählen schon).
// Hinweis: Dies ist ein KI-erstellter Standard-Text, keine Rechtsberatung.
// ─────────────────────────────────────────────────────────────────────────────
const OPERATOR = {
  name: "Kolja Schöpe",
  street: "[Straße und Hausnummer]",
  city: "[PLZ Ort]",
  country: "Deutschland",
  // Konsistent mit den übrigen Legal-Seiten (validationkit.app); die finale
  // Domain wird in Wave 3 global gesetzt. Catch-all-Weiterleitung einrichten.
  email: "impressum@validationkit.app",
  // Zweiter schneller Kontaktweg ist Pflicht — Telefon ODER Kontaktformular-Link:
  phone: "[Telefonnummer oder Kontaktformular]",
  // Kleinunternehmer (§ 19 UStG) → keine USt-IdNr (diese Zeile dann weglassen).
  // Sonst die deutsche USt-IdNr nach § 27a UStG eintragen:
  vatId: "[USt-IdNr gemäß § 27a UStG — oder als Kleinunternehmer (§ 19 UStG) weglassen]",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <span className="w-44 shrink-0 text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

export default function ImpressumPage() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-12"
    >
      <SiteNav />

      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Impressum</h1>
        <p className="text-sm text-muted-foreground">
          Anbieterkennzeichnung nach § 5 DDG (Digitale-Dienste-Gesetz, vormals
          § 5 TMG). Siehe auch unsere{" "}
          <Link
            href={"/legal/datenschutz" as never}
            className="underline-offset-4 hover:underline"
          >
            Datenschutzerklärung
          </Link>{" "}
          und{" "}
          <Link
            href={"/legal/agb" as never}
            className="underline-offset-4 hover:underline"
          >
            AGB
          </Link>
          .
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Diensteanbieter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Name" value={OPERATOR.name} />
          <Row label="Anschrift" value={`${OPERATOR.street}, ${OPERATOR.city}`} />
          <Row label="Land" value={OPERATOR.country} />
          <p className="pt-2 text-xs text-muted-foreground">
            Einzelunternehmen — kein Handelsregistereintrag, keine
            Geschäftsführer-Angabe erforderlich.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kontakt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="E-Mail" value={OPERATOR.email} />
          <Row label="Telefon / Kontakt" value={OPERATOR.phone} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Umsatzsteuer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="USt-IdNr (§ 27a UStG)" value={OPERATOR.vatId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verantwortlich für den Inhalt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Verantwortlich i. S. d. § 18 Abs. 2 MStV: {OPERATOR.name},
            Anschrift wie oben.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verbraucherstreitbeilegung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Wir sind nicht bereit und nicht verpflichtet, an
            Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
            teilzunehmen (§ 36 VSBG).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Haftung für Inhalte und Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten
            nach den allgemeinen Gesetzen verantwortlich (§ 7 Abs. 1 DDG). Nach
            §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht
            verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
            überwachen oder nach Umständen zu forschen, die auf eine
            rechtswidrige Tätigkeit hinweisen.
          </p>
          <p>
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren
            Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten
            Seiten ist stets der jeweilige Anbieter oder Betreiber
            verantwortlich. Bei Bekanntwerden von Rechtsverletzungen entfernen
            wir derartige Links umgehend.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Urheberrecht</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Die durch den Diensteanbieter erstellten Inhalte und Werke auf
            diesen Seiten unterliegen dem deutschen Urheberrecht.
            Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
            Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der
            schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>
        </CardContent>
      </Card>

      {/* English convenience translation. The German version above is authoritative. */}
      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          Legal notice (English)
        </h2>
        <p className="text-sm text-muted-foreground">
          Convenience translation — the German version above is the legally
          authoritative text.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Service provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Name" value={OPERATOR.name} />
            <Row
              label="Address"
              value={`${OPERATOR.street}, ${OPERATOR.city}, ${OPERATOR.country}`}
            />
            <Row label="Email" value={OPERATOR.email} />
            <Row label="Phone / contact" value={OPERATOR.phone} />
            <Row label="VAT ID (§ 27a UStG)" value={OPERATOR.vatId} />
            <p className="pt-2 text-xs text-muted-foreground">
              Sole proprietorship under German law (§ 5 DDG). We are neither
              willing nor obliged to participate in dispute-resolution
              proceedings before a consumer arbitration board (§ 36 VSBG).
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
