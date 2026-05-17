# 19 — Naming, Domain & Trademark Research

**Brief:** Verfügbarkeitsprüfung der im PRD §16 vorgeschlagenen Namen (ValidationKit, ProofStack, DemandLab, SignalKit, Validar, PMFKit) plus 5–8 starke Alternativen mit Top-3-Empfehlung.
**Datum:** 2026-05-14
**Method:** WebSearch + WebFetch (npm, GitHub-Orgs, Domain-Probes, USPTO-Indikatoren, SaaS-Konkurrenzscan). WHOIS-Daten konnten nicht direkt gezogen werden; .com/.io-Aussagen unten basieren auf Indizien (parking pages, sale listings, etablierte Sites). "Wahrscheinlich verfügbar" heißt: kein indexierter Use + kein Trademark-Treffer; finale Sicherheit braucht Namecheap/Markmonitor.

---

## 1. Bewertung der PRD-Namen

### 1.1 Übersichtstabelle

| Name | .com | .dev | .ai | .io | GitHub-Org | npm | Trademark / Konflikt | Risiko-Score (1–10, 1=safe) |
|---|---|---|---|---|---|---|---|---|
| **ValidationKit** | unklar (kein bekannter Live-Use) | unklar | unklar | unklar | TAKEN (validation-kit, Java/Spring, 1 star, active Feb 2026) | wahrscheinlich frei (keine Treffer) | Generic-Term, kein TM-Treffer | 5 |
| **ProofStack** | FOR SALE (parked) | TAKEN (proofstack.dev — credential verification SaaS, live) | unklar (proofstack-ai.vercel.app existiert als direkter Konkurrent) | TAKEN (proofstack.io — Singapore copyright/blockchain, founded 2014, $2M raised) | TAKEN (dormant) | frei | DREI aktive Firmen, davon **eine direkter Konkurrent** (Pre-MVP Validation Network für Solo-Foundern) | **10 — DEAD** |
| **DemandLab** | TAKEN (demandlab.com — B2B Martech Agency, Inc. 5000, founded 2009) | unklar | unklar | unklar | TAKEN (verified org, dbt-superset-lineage repo) | frei | Etablierte Marke seit 16 Jahren, dürfte common-law TM in MarTech haben | **9 — high TM risk** |
| **SignalKit** | TAKEN (signalkit.com — K-12 communication, acquired by ParentSquare 2020, still active sub-brand) | unklar | unklar | unklar | TAKEN (Ruby OAuth forks, dormant since 2011) | TAKEN (signals lib + Swift framework) | Zusätzlich Open-Source-Frameworks (Swift, JS), plus Signal Messenger TM-Conflict-Potenzial | **9** |
| **Validar** | TAKEN (validar.com — Validar Inc., event lead capture & registration, since 2005, Salesforce AppExchange listed) | unklar | unklar | unklar | TAKEN (empty user account) | wahrscheinlich frei | 20 Jahre alte etablierte Marke in event-tech; common-law TM stark; SaaS-Class-9 Konflikt wahrscheinlich; "validar" = Spanish "to validate" (descriptive — TM-Schutz schwach) | **8** |
| **PMFKit** | TAKEN — und der Holder ist ein **direkter Konkurrent** ("Diagnose your product. Decide what to build next.") | unklar | unklar | unklar | nicht existent | frei | Direkter Wettbewerber im selben Use-Case | **10 — DEAD** |

### 1.2 Detail-Findings

**ValidationKit (Working Title):**
- `github.com/validationkit` ist von einem Java-Bean-Validation-Projekt belegt (1 Star, Last Update Feb 2026). Niedriges Verwechslungsrisiko, aber Handle ist weg → wir müssten `getvalidationkit` / `validationkithq` nehmen.
- Generic-genug, dass kein TM-Pre-Empt sichtbar ist.
- **Schwerstes Problem ist nicht Verfügbarkeit, sondern Branding:** "-Kit" suffix klingt wie Tool/Boilerplate (vgl. PaymentKit, SwiftKit, useSAASkit). Stripe, Figma, Linear, Vercel — keine nutzt einen Toolbox-Suffix. Headroom für Plattform/Kategorie ist limitiert.

**ProofStack — KILL.**
Drei aktive Firmen tragen den Namen, davon eine ist ein direkter Pre-MVP-Validation-Konkurrent (proofstack-ai.vercel.app: "10 Warm ICP Intros in 7 Days"). Selbst wenn proofstack.com verkauft würde (Listing aktiv), bekommt jeder Launch sofort Trademark- und Verwechslungsklagen. Tot.

**DemandLab — KILL.**
demandlab.com ist eine seit 2009 betriebene, Inc.-5000-gelistete, internationale Martech-Agency mit verifizierter GitHub-Org und Marken-Footprint. Klar etablierte Common-Law-Marke in *Marketing-Technologie* — und unsere Validation-Plattform sitzt direkt in dieser Class (Software für Marketing/Demand). Cease-and-Desist ist hier Frage von "wann", nicht "ob".

**SignalKit — KILL.**
signalkit.com gehört Signal Kit (ParentSquare-Subsidiary, K-12 communication). Plus zwei Open-Source-Frameworks (Swift, JS) auf GitHub. Plus npm-Package "signalkit" published. Plus Signal Messenger (das Signal-TM ist global aggressiv geschützt). Sechsfach belegt.

**Validar — Risk too high.**
Validar Inc. (validar.com) ist seit 2005 in Event-Lead-Capture aktiv, listed auf Salesforce AppExchange, hat Produkt-Suite (vCapture). Auch wenn "validar" als spanisches Verb deskriptiv ist (= TM-Schutz schwach), führt das im B2B-Software-Markt zu Verwechslungsrisiko, weil Validar ebenfalls B2B-Marketing-Tooling macht (Lead Capture, Registration, Marketing-Integrationen). International ist es zudem für Deutsch-/Englischsprachige nicht klar verständlich — "Validar" klingt nach unfertigem Pharma-Brand.

**PMFKit — KILL.**
pmfkit.com ist live, mit dem Tagline "Diagnose your product. Decide what to build next." Das ist *exakt* unsere Wertversprechung — direkter Wettbewerber, Name auf .com gebunden. Tot.

**Zwischenfazit PRD-Liste:** 4 von 6 Namen sind kategorisch ausgeschlossen (ProofStack, DemandLab, SignalKit, PMFKit). Validar ist riskant. ValidationKit ist machbar, aber strategisch limitiert ("-Kit" = Werkzeug, nicht Plattform).

---

## 2. Eigene Alternativ-Vorschläge

**Filter-Kriterien:**
- 4–7 Buchstaben oder ein klares zusammengesetztes Wort (memorable)
- Kein "-Kit", kein "-Tool", kein "-App", kein "-AI" Suffix
- Kategorie-frei genug, dass das Produkt zur Plattform werden kann (Stripe, Notion, Linear-Schule)
- International aussprechbar
- Verfügbar auf mindestens einer Premium-TLD (.com bevorzugt, .dev/.ai akzeptabel)
- Kein direkter SaaS-Konkurrent mit gleichem Namen

### 2.1 Alternative Übersicht

| # | Name | Klang | Memorability | .com Wahrscheinlichkeit | Headroom | Aussprache intl. | Konnotation | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | **Probend** | 5 | 4 | mittel (frei laut Erst-Check) | hoch — "probe + end-to-end" | gut | neutral, klingt scientific | strong |
| 2 | **Truen** | 4 | 4 | unklar | hoch — abstract | gut | neutral | medium |
| 3 | **Validora** | 4 | 4 | mittel (.com unklar, .io wahrscheinlich) | hoch — eigenständig genug | gut, klingt italienisch/elegant | neutral, weiblich, freundlich | strong |
| 4 | **Crucio** | 4 | 5 | wahrscheinlich frei (kein Major-Use) | hoch — "crucible/crux" Wurzel ohne Werkzeug-Suffix | gut | **Harry-Potter-Spell-Konflikt** (Folter-Fluch) | KILL |
| 5 | **Pondera** | 5 | 4 | unklar | hoch — lateinisch "to weigh" | gut, klingt edel | "ponder" auf Englisch sehr positiv | strong |
| 6 | **Verym** / **Veryx** | 3 | 4 | wahrscheinlich frei | hoch — gemacht | gut | neutral, etwas neutral-langweilig | medium |
| 7 | **Cohere** | 5 | 5 | TAKEN (Cohere AI, $5B+ LLM company) | wäre hoch | — | — | KILL |
| 8 | **Anchora** | 4 | 4 | unklar | hoch — "anchor" als Metapher für "Daten verankern Entscheidungen" | gut | positiv | medium |
| 9 | **Foundry** | 5 | 5 | TAKEN (Palantir Foundry — verheerend) | — | — | — | KILL |
| 10 | **Klar** | 4 | 5 | TAKEN (Klar.com, Klarna-Konflikt) | — | — | — | KILL |
| 11 | **Sondr** | 5 | 5 | wahrscheinlich frei | hoch — von "sonder" und "sound", nautisches Loten | gut | positiv, geheimnisvoll, designer-vibe | **strong** |
| 12 | **Kerno** | 4 | 5 | mittel | hoch — "kernel/core" | gut | positiv, technisch | medium |

### 2.2 Top-Empfehlungen aus der Alternativ-Liste

Nach Aussortieren der Konflikte (Crucio/HP, Cohere/LLM, Foundry/Palantir, Klar/Klarna) bleiben als ernsthafte Optionen:

1. **Sondr** — kategorie-frei, designer-friendly, von "sounding/loten" (Tiefenmessung = Validation-Metaphorik), kurz, einprägsam, kein bekannter SaaS-Konflikt im Bereich. Wahrscheinlichkeit .com mittel, .io/.dev sehr wahrscheinlich frei.
2. **Pondera** — lateinisch "to weigh/consider"; klingt edel und reif (vgl. Notion, Linear); konzeptionelle Brücke "Evidence-Weighing"; gute Story für Marken-Narrativ.
3. **Probend** — semantisch direkt ("probe" = customer probing, "end" = decision endpoint); klingt scientific-rigorous, was zum Anti-Synthetic-Personas-Narrativ passt.
4. **Validora** — Spanish/Italian-grammar-Form, weicher als "Validar"; klingt mehr nach Marken-Universum als nach Werkzeug.
5. **Anchora** — "Daten verankern Entscheidungen"; Metapher trägt das Produkt-Narrativ; .com riskanter (gibt Anchora-LLC-Holdings).

---

## 3. Final-Empfehlung (Top 3 + safe/ambitious split)

### 3.1 Top 3

#### Platz 1 — **Sondr** (Ambitious Pick)

**Pro:**
- Kategoriedefinierend wie Stripe, Linear, Notion. Klingt wie Plattform, nicht wie Werkzeug.
- Etymologie ("sounding" = nautisches Loten der Tiefe vor dem Schiffsstart) ist die *perfekte* Metapher für Demand-Validation vor Build-Start. Branding-Story schreibt sich selbst.
- 5 Buchstaben, eine Silbe, international sprechbar. Memorable.
- Kein direkter SaaS-Konflikt indexiert. Hoher Headroom.
- Lässt Produkt-Expansion zu (von Validation zu allgemeiner Founder-Intelligence-Plattform).

**Contra:**
- .com sehr wahrscheinlich teuer/parked. Wir würden initial mit `sondr.ai` oder `sondr.dev` launchen müssen.
- "Sondr" hat in Norwegisch "Sønder" als Anklang (= "süd"/"separated"), niedriges aber existierendes Risiko in Skandinavien.
- Schreibweise muss gelernt werden ("sounder" ist falsch geschrieben).

#### Platz 2 — **Pondera** (Safe + Ambitious Hybrid)

**Pro:**
- Lateinisch "ponderare" = abwägen/gewichten — semantisch perfekt für Evidence-Weighing.
- Klingt edel/reif/erwachsen, anders als kit-/tool-/.ai-Inflation. Vergleichbar mit Notion/Linear Reife.
- "Ponder" englisch ist positiv konnotiert.
- Plattform-Headroom hoch.
- Internationale Aussprache trivial.

**Contra:**
- Längeres Wort (3 Silben).
- Existierende Klein-Brands (Pondera Solutions = HHS-Fraud-Detection) — separater Markt, aber TM-Klasse-9 Overlap muss geprüft werden.
- Klingt eher konservativ-akademisch — weniger Indie-Hacker-Vibe.

#### Platz 3 — **ValidationKit** (Safe Pick — der Working Title selbst)

**Pro:**
- Selbsterklärend. SEO-friendly für "validation"-Searches.
- Niedriges TM-Risiko (deskriptiv).
- Schon im PRD verankert, Team-Recognition hoch.
- Java-Repo-Konflikt ist niedrig (1 Star, anderer Use-Case, lower-case `validation-kit`).

**Contra (entscheidend):**
- "-Kit" Suffix limitiert Plattform-Ambition. Niemand wird "Sondr is the Stripe of validation" sagen, aber "ValidationKit ist ein kit" — selbst-erklärt sich tools-haft.
- Generischer Name = schwacher Trademark-Schutz = jeder Konkurrent kann "FounderValidationKit" launchen ohne Verstoß.
- 50-Jahre-Kategorie-Vision braucht einen Brand, der mit dem Produkt mitwächst. ValidationKit kann nicht zum "OS für Founder-Intelligence" werden, ohne neu zu branden.
- `.com` Verfügbarkeit unklar; `github.com/validationkit` weg.

### 3.2 Empfehlung an Founder

- **Best ambitious pick: Sondr.** Wenn die Vision wirklich kategoriedefinierend für 50 Jahre ist, ist das das richtige Profil. Akzeptiert .ai/.dev statt .com initial.
- **Best safe pick: ValidationKit (Working Title behalten).** Wenn Launch-Speed >> Branding-Reife, dann mit dem Working Title launchen, später re-branden falls Plattform-Vision sich materialisiert. Risiko: "Re-Brand mit Traction" ist sehr schmerzhaft (Loom hat es geschafft, viele andere nicht).
- **Diplomatic middle: Pondera.** Wenn die Frage "wirken-wir-erwachsen-für-Enterprise-Kunden" relevant wird (Series B+), ist Pondera das einzige der drei, das in einem Boardroom natürlich klingt.

**Pragmatische Reihenfolge:** Validar/ProofStack/DemandLab/SignalKit/PMFKit aus PRD §16 streichen. Sondr und Pondera in Namecheap/Markmonitor live verifizieren (Domain + USPTO TESS + EUIPO + Singapore IPOS). Falls beide blockiert: ValidationKit als Working Title behalten, in 12 Monaten erneut nameshoppen, wenn Produkt-Schwerpunkt scharf ist.

---

## 4. Branding-Implikationen

Was sagt die Naming-Wahl über die Marke und das Selbstverständnis?

**Wenn ValidationKit:** wir sind ein professionelles Werkzeug für PMM-Praktiker. Wir konkurrieren mit Templates, Frameworks, Course-Bundles. Vergleichsgruppe: PostHog (Toolbox-Vibe), Beehiiv-Templates, useSAASkit. Plattform-Vision wird über Storytelling, nicht über den Namen, getragen.

**Wenn Sondr:** wir sind eine kategorie-definierende Plattform. Wir konkurrieren mit Linear, Notion, Stripe in Branding-Tier. Vergleichsgruppe: Pre-Build-Intelligence-Layer für Founder. Plattform-Vision ist im Namen kodiert. Pricing-Power höher, weil Brand-Equity höher.

**Wenn Pondera:** wir sind die "evidence-grade" Wahl für ernsthafte Founder und Investoren. Vergleichsgruppe: Crunchbase, PitchBook, CB Insights — Premium-Intelligence-Brands. Konservativer als Sondr, aber mit klarer Sektor-Identität.

**Markenstrategischer Subtext:** Die User-Vision ("kategorie-definierende Plattform für die nächsten 50 Jahre") ist mit "ValidationKit" als Working Title in produktiver Spannung. Stripe heißt nicht "PaymentKit". Figma heißt nicht "DesignKit". Linear heißt nicht "IssueKit". Wenn die 50-Jahre-Vision ernst gemeint ist, sollte der Name das tragen können — das spricht stark für Sondr oder Pondera.

**Empfehlung:** Domain-Sweep (5–10 Min auf Namecheap/Spaceship) für `sondr.com`, `sondr.ai`, `sondr.dev`, `pondera.com`, `pondera.ai`, `pondera.io`. Falls eine .com unter $10k zu haben ist → grünes Licht. Falls beide in $50k+ Bereich → ValidationKit behalten als Pragmatic-MVP-Brand, Re-Branding-Klausel im 12-Monats-Plan einbauen.

---

## 5. Caveats & Confidence

- **Domain-WHOIS konnte nicht direkt abgefragt werden** (Tool-Limitation). Die .com-Aussagen oben basieren auf indizierten Live-Sites, Sale-Listings (proofstack.com), und Suchindex-Coverage. **Empfehlung: Vor jeglicher Brand-Commitment Namecheap-Bulk-Check für Wunschnamen über alle TLDs.**
- **Trademark-Recherche basiert auf Google + USPTO-Index-Searches**, nicht auf vollem TESS-Filing-Review. Bei Top-3-Picks dringend $300–500 in eine professionelle Trademark-Suche (Gerben IP, JPG Legal o.ä.) investieren bevor das Logo finalisiert wird.
- **Alternativ-Vorschläge wurden auf SaaS-Konflikte gescannt**, aber nicht auf vollständige Markenregister-Konflikte (insb. EU/UK/Singapur/CN).
- **EU-/IPOS-Marken** wurden nicht direkt geprüft (außerhalb Tool-Reach). Bei internationaler Vision kritisch.

**Confidence:**
- "PRD-Namen ProofStack, DemandLab, SignalKit, PMFKit sind blockiert" → **hoch (90%+)**
- "Validar ist riskant aber nicht tot" → mittel (70%)
- "ValidationKit ist verfügbar genug für MVP-Launch" → mittel-hoch (75%)
- "Sondr und Pondera sind brand-strategisch überlegen" → hoch (80%)
- "Sondr.com / Pondera.com sind verfügbar oder bezahlbar" → niedrig-mittel (40–50%) — kritischer Check nötig
