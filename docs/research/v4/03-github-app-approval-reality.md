# 03 — GitHub-App-Approval-Hürde — Reality-Check

**Track:** B1 (PRD-v4 Stress-Test, ContextForge)
**Datum:** 2026-05-16
**Autor:** Research-Agent B1 (Claude Code, Opus 4.7)
**Status:** Verdict-tragend
**Risiko-Slot:** PRD Risiko #6 "GitHub-App-Approval-Hürde" (current: Hoch/Mittel)

---

## TL;DR

**Severity-Band:** **Mid — verschiebbar Richtung Strong, wenn drei Mitigations Day-1 in Place sind.**

Die GitHub-App-Approval-Hürde ist **kein Deal-Killer für ContextForge im PLG-Segment** (Solo-Devs + kleine Agenturen mit eigenen Repos), aber ein **substantieller Throughput-Dämpfer im B2B-Pfad** ("Agentur Lena installiert App in Kundenorg X"). Die Risk-Re-Calibration:

- **Probability Hoch ist korrekt.** Mindestens **eine** Reibungsstufe (Admin-Approval, Vendor-Security-Questionnaire, oder DPA-Anforderung) trifft praktisch jeden Customer-Install im SMB-bis-Mittelstand-Korridor. Die naive "Zwei-Click-Install"-Annahme aus CodeRabbit-Marketing greift nur, wenn der Endkunde **selbst Org-Owner ist und keine separate IT-Genehmigung braucht** — und genau das ist bei Lena's Kunden definitionsgemäss **nicht** gegeben (sonst würde Lena nicht den Repo "managen").
- **Impact "Mittel" ist zu optimistisch. Realität: Mittel-bis-Hoch im Time-to-Value (TTV), Niedrig im Conversion-Verlust** — sofern ContextForge die unten genannten 3 Mitigations Day-1 baut. Ohne Mitigations: Hoch im TTV **und** Hoch im Conversion-Verlust (geschätzt 35–60 % Drop-off bei Multi-Stakeholder-Approval-Flows, basierend auf Konvu-Anekdote und allgemeinem Enterprise-Sales-Verhalten).

**Ein-Satz-Verdict:** Die Hürde existiert, ist aber durch (a) ein Day-1-DPA-Template, (b) einen sichtbaren Trust-Center-Pseudo-MVP (auch ohne SOC-2), und (c) einen requester→admin-Bridge-Flow auf Mid-Severity reduzierbar. **Keep Risk #6 als "Hoch/Mittel-Hoch"**, aber rüste mit konkreten Phase-0-Liefergegenständen.

---

## 1. Realitäts-Check der Approval-Mechanik

### 1.1 GitHub's offizielle Mechanik

GitHub unterscheidet drei Installations-Pfade:

1. **Direct Install** — User ist Org-Owner und installiert direkt.
2. **Repo-Admin-Install** — Repo-Admin kann App installieren, **nur wenn** die App keine Org-Permissions und keine "repository administration"-Permission verlangt ([GitHub Docs — Installing a GitHub App from a third party](https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-a-third-party)).
3. **Request-Install** — Wer auch immer "Install" klickt, bekommt einen Button-State "Install and request" oder "Request" angezeigt. Die Anfrage geht an die Org-Owner.

Org-Owner können zusätzlich "third-party application restrictions" aktivieren ([GitHub Docs — Approving OAuth apps](https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/approving-oauth-apps-for-your-organization)), die **jegliche** Installation blockieren bis explizit genehmigt. Seit Dezember 2025 gibt es zusätzlich Granular-Controls darüber, *wer überhaupt eine Request stellen darf* ([GitHub Changelog 2025-12-22 — Control who can request apps](https://github.blog/changelog/2025-12-22-control-who-can-request-apps-for-your-organization/)) — also eine **Pre-Request-Gate** noch vor dem eigentlichen Approval.

ContextForge wird in der Lena-Lena's-Kunden-Konstellation fast immer in Pfad 3 landen, weil:
- Lena ist Outside Collaborator oder Member, nicht Owner, in der Kunden-Org.
- ContextForge braucht *org-level* read-Permission auf Code+PRs (sonst kann es Cross-Repo-Context nicht aggregieren — Kern-Value-Prop).
- Damit greift die Owner-Approval-Pflicht zwingend.

### 1.2 Der "Approver != Requester"-Bruch

Der zentrale strukturelle Defekt im Approval-Flow ist gut dokumentiert in der Praxis-Engineering-Literatur, am klarsten von Konvu ([Konvu Blog — Handling GitHub App Admin Approval Workflows](https://konvu.com/blog/github-app-admin-approval-workflows)):

> "When Sarah initially requested the installation, our system had no way to persist that request. Days later when Mike approved the installation, GitHub would redirect him to our callback with the installation details. But then, we had no context."

Übersetzt heißt das: GitHub's Approval-Redirect schickt den **Approver** auf den Vendor-Callback, **nicht den Requester**. Der Approver ist im typischen Mittelstand- bzw. Kunden-Szenario:
- ein IT-Admin, der ContextForge noch nie gesehen hat,
- der keinen Account bei ContextForge hat,
- der keinen Anreiz hat, durch den Onboarding-Flow zu klicken,
- und der nach Approval typischerweise schlicht den Tab schließt.

**Konsequenz:** Die Installation ist auf der GitHub-Seite "completed", aber auf der ContextForge-Seite **leerlaufend** — kein Mapping zurück zur ursprünglichen Lena-Session. Konvu nennt das "orphaned approval", und die einzige saubere Lösung ist eine Webhook- oder Polling-basierte Reconciliation-Schicht. Das ist **kein triviales Engineering** und für ein Phase-0-Solo-Produkt eine echte Komplexitätsanforderung.

### 1.3 Realistische Timeline-Bänder

Aus der gesammelten Comp-Evidenz (keine ein-zu-eins-Benchmark, sondern triangulated aus Snyk/Codacy/CodeClimate Docs + Konvu + Linear-Approval-Docs):

| Szenario | Typische Time-to-Install |
|---|---|
| Solo-Dev installiert in eigener User-Account / Solo-Org | **<5 Min** (echter Snyk/CodeRabbit-"viral 2-click"-Case) |
| Repo-Admin in kleiner Org, keine OAuth-Restrictions | **5–30 Min** (Slack-Ping an Owner, Owner installiert direkt) |
| **Lena-typischer Case: SMB-Kunde, Owner != Lena, keine formelle Security** | **1–5 Werktage** (Owner-Approval per Mail, ggf. Rückfrage, ggf. DPA-Anfrage) |
| Mittelstands-Kunde mit IT-Funktion, Vendor-Questionnaire | **2–6 Wochen** (SIG-Lite-Fragebogen, DPA-Verhandlung, ggf. SOC-2-Anfrage) |
| Enterprise mit CISO-Funktion | **8–16 Wochen+** (Pen-Test-Anforderung, voller Procurement) |

Quelle für die obere Hälfte: [Konvu Blog](https://konvu.com/blog/github-app-admin-approval-workflows), [Snyk Docs — GitHub Cloud App](https://docs.snyk.io/developer-tools/scm-integrations/organization-level-integrations/github-cloud-app), [CodeClimate — Approve as third-party in GitHub](https://docs.codeclimate.com/docs/approve-code-climate-as-a-third-party-application-in-github-1). Untere Hälfte: extrapoliert aus dem Sprinto-Startup-Sales-Questionnaire-Playbook ([Sprinto — Security Questionnaires for Startups](https://sprinto.com/blog/security-questionnaires-for-startups/)), wo "73 % failure rate of SaaS startups in vendor security assessments" als gerundete Branchen-Schätzung zitiert wird.

---

## 2. Konversions-Rate-Benchmarks aus Comps

Das ist der **schwächste Teil der Recherche**: Keine der verglichenen Firmen (Snyk, CodeClimate, DeepSource, Greptile, CodeRabbit, GitGuardian, Sourcegraph, Aikido, Semgrep, Pixee) hat öffentlich Install-Funnel-Conversion publik gemacht. Was wir haben:

### 2.1 GitGuardian — der einzige harte Datenpunkt

[GitGuardian Blog März 2025 — Most-installed GitHub Marketplace App](https://blog.gitguardian.com/gitguardian-is-now-the-overall-most-installed-github-marketplace-app-2/):
- **418k installations**
- **12.7M Repos** protected
- **1.8M Emails/Jahr** im "Good Samaritan"-Programm (Pre-Install-Outreach)

Implizite Funnel-Math: Wenn 1.8M Mails/Jahr zu *kumulativ* 418k Installs führen (über die Lifetime), liegt die Email-zu-Install-Conversion **deutlich unter 5 %**, eher im **1–3 %-Korridor**. Aber: GitGuardian-Mails gehen an Devs, die *gerade ein Secret geleakt* haben — ein extrem warmer Trigger. ContextForge wird so warme Trigger nicht haben.

### 2.2 CodeRabbit — der "viral 2-click"-Claim

[Sacra Profile auf CodeRabbit](https://sacra.com/c/coderabbit/): 8000+ paying customers (Sep 2025), 100k+ OSS-Projects, 2M+ Repos reviewed, 13M+ PRs processed, $88M total funding.

Das CodeRabbit-Marketing inszeniert den "two-click installation"-Flow. Aber: 100k OSS-Installs zu 8k paying customers = **8 % Free-to-Paid** — ungefähr das Doppelte des PLG-Branchen-Median (5 % laut [Product-Led Foundations](https://www.productled.org/foundations/product-led-growth-metrics)). Das ist nicht "Install-Conversion", sondern "Free-Tier-to-Paid". Die *eigentliche* Install-Conversion (Marketplace-Visit → Install) ist nicht publik.

**Wichtiger Reality-Check:** CodeRabbit operiert im **personal-account-Bottom-Up-Modus**: Devs installieren auf eigene OSS-Repos zuerst, später auf Work-Repos. Das ist **nicht** das ContextForge-Use-Case-Pattern, wo Lena von Tag 1 in der Kunden-Org installieren *muss*.

### 2.3 Snyk

[GitHub Marketplace Snyk](https://github.com/marketplace/snyk): **238.393 Installs** (von der Suche extrahiert). Snyk ist seit ~2015 auf dem Markt, Multi-Hundert-Mio-ARR, hat full enterprise-sales-team. Das ist **kein** relevanter Comp für Phase 0 — aber ein Existenz-Beweis, dass die Hürde überwindbar ist.

### 2.4 Was wir **nicht** haben

- Keine publizierte "Marketplace-Listing-View → Install-Start → Install-Complete"-Funnel-Conversion von **keinem einzigen** dieser Vendors.
- Keine "Request-sent → Owner-approved"-Conversion.
- Keine "App-installed → activated (= first useful event)"-Conversion.

**Diese Daten existieren nur intern.** Verfügbar wären sie nur durch direkten Founder-Outreach (Greptile, CodeRabbit-Early-Days, oder Indie-Hackers-Interviews) — siehe "Testable Assumptions" unten.

### 2.5 Allgemeine PLG-Benchmarks als Schätz-Untergrenze

Aus [Product-Led Foundations](https://www.productled.org/foundations/product-led-growth-metrics) und [SlashExperts PLG Guide](https://slashexperts.com/post/plg-conversion-rates-and-optimization-guide/):
- Freemium-Signup-Rate (Visitor → Signup): **6 %** Median
- Activation-Rate (Signup → Aha-Moment): **20–40 %** durchschnittlich, **40–60 %** Top-Performer
- Free-to-Paid: **2–5 %** durchschnittlich

Auf ContextForge übertragen und **konservativ angesetzt**:
- Marketplace-Listing-Visit → Install-Klick: ~**6 %**
- Install-Klick → Approval-completed (in Owner != Requester-Fall): **40–60 %** Verlust durch Approver-Drop-Off (Konvu-Empirik) → **40–60 % Through-Rate**
- App-installed → Activated (First-Cited-Insight): **30–50 %**

Kombiniert: **1.2–2.0 % Marketplace-Visit-to-Activated.** Das ist **brutal**, aber realistisch für Cold-Funnel ohne pre-existing Trust.

**Konsequenz für PRD:** Phase-0-Acquisition kann nicht über Marketplace-Cold-Traffic laufen. Muss über **warm pipeline** (Lena hat den Kunden bereits + Lena führt den Kunden durch die Installation). Das verändert das Funnel-Modell fundamental — und genau hier liegt der Strategic-Wert des Hybrid-Layered-Pivots (PRD §11): Productized-Service-Pfad umgeht den Cold-Marketplace-Funnel komplett.

---

## 3. SMB-CTO-Trust-Signal-Realities

### 3.1 Die Trust-Signal-Hierarchie (empirisch, Branchen-Median)

Aus [Sprinto](https://sprinto.com/blog/security-questionnaires-for-startups/), [Workstreet — SOC 2 for Startups](https://www.workstreet.com/blog/soc-2-for-startups), und [Carbide Security — Questionnaire Trajectory](https://carbidesecure.com/resources/security-questionnaire-hits-startup/):

| Signal | Customer-Acceptance-Effect | ContextForge-Phase-0-Verfügbarkeit |
|---|---|---|
| SOC-2 Type II | "Top-of-Checkliste" für Enterprise InfoSec | **Nein** (3–6 Monate Build, ~$15–40k) |
| SOC-2 Type I | Hilft im Mittelstand, nicht Enterprise | **Nein, aber 6–8 Wochen erreichbar mit Vanta/Drata** |
| Public Trust Center (SafeBase-Pattern) | Beschleunigt Sales-Cycle signifikant | **Ja, MVP in 1–2 Wochen baubar** |
| DPA-Template ready | GDPR-Hard-Requirement, kein Nice-to-Have | **Day-1-Anforderung** |
| Customer-References (named) | Stärkster Signal für SMB | **Phase-0-Henne-Ei-Problem** |
| Open-Source-Repo (gut maintained) | Mid-Strength-Signal für Devs, schwach für CTOs | **Yes — already PRD §16 Plan** |
| Pen-Test-Report | Enterprise-Hard-Requirement | **Nein, ~$8–25k** |

Quelle für Trust-Center-Importance: [CISO Series — Turning Trust into a Growth Engine with SafeBase](https://cisoseries.com/turning-trust-into-a-growth-engine-with-safebase/), wo SafeBase deutlich macht, dass "Buyers now visit a vendor's Trust Center before every contract bid, RFP, and new product purchase."

### 3.2 Das Henne-Ei-Problem

Klassisch: SMB-CTO will Customer-References sehen → ContextForge hat noch keine Customers → SMB-CTO blockiert → keine Customers → ...

**Realistische Umgehung:**

1. **Open-Source-First gibt Trust-Karma** (PRD-Constraint #6). Ein gut-maintained MIT-OSS-Core mit transparenter Architektur-Doku ist für SMB-CTOs in der Indie-Hacker-/Boutique-Agency-Welt ein **legitimer Trust-Proxy**, insbesondere wenn der GitHub-App-Source-Code (oder zumindest die Permissions-Begründung pro Scope) öffentlich einsehbar ist.

2. **"Beta-Partner-Disclosure"-Framing.** Lena erklärt: "Wir sind Beta. ContextForge ist gerade in Phase 0. Hier ist der Source-Code, hier sind die Permissions, hier ist mein persönlicher Vertrag mit ContextForge." Das funktioniert für **Solopreneur-Kunden und Mikro-SMB-Kunden** mit Persönlichkeits-Trust. Es funktioniert **nicht** für SMB-Kunden mit eigener IT-Funktion.

3. **Read-only-Default.** Siehe §6 unten — die niedrigere Permission-Stufe ist der konkreteste Trust-Signal-Hebel, den ContextForge **technisch** ziehen kann, ohne 3–6 Monate Compliance-Build.

### 3.3 Welche Trust-Signal-Schwelle braucht es konkret für Lena's Kunden?

Lena's Kunden sind annahmegemäß SMBs (10–200 Mitarbeiter, eigene Repos, Lena ist External-Consultant). Die kritischen Trust-Signale für diese Cohorte (sortiert nach Wirkung pro investiertem Phase-0-Euro):

1. **DPA-Template ready Day 1** (gesetzliche Pflicht; siehe §4)
2. **Trust-Center-Lite + Permissions-Begründungs-Page** (1–2 Tage Build, hoher Marginal-Return)
3. **Read-only-Default mit Opt-in-Write** (Architecture-Decision, jetzt entscheiden, nicht in Phase 2)
4. **Lena-vermittelte Persönlichkeits-Bürgschaft** (Productized-Service-Modell, PRD §11)
5. **SOC-2-Type-I** (erst ab Phase 1, M3+, nicht Phase 0)

---

## 4. DPA-Requirement-Check (Day-1-Pflicht?)

### 4.1 Rechtliche Realität

Aus [Secure Privacy Blog — SaaS DPAs](https://secureprivacy.ai/blog/data-processing-agreements-dpas-for-saas) und [GDPR.eu — Article 28](https://gdpr.eu/data-processing-agreement/):

> "A data processing agreement for SaaS isn't optional paperwork — it's mandatory infrastructure for enterprise sales. Every SaaS company processing customer data on their behalf must provide a GDPR-compliant DPA."

Article 28 GDPR ist eindeutig: Wenn ContextForge personenbezogene Daten des Kunden verarbeitet (und Code-Authoren-Namen, Commit-Mails, PR-Kommentare **sind** personenbezogene Daten unter GDPR), **muss** ein DPA zwischen ContextForge und dem Kunden bestehen — egal ob der Kunde danach fragt oder nicht.

**Praktischer Default in der SaaS-Welt:** Die meisten SaaS-Vendors haben einen "Standard-DPA" als PDF/Online-Form bereit, der bei Account-Anlage automatisch akzeptiert wird (Click-Wrap) — analog zu Stripe, Vercel, Resend.

### 4.2 ContextForge-Specific: Ist Day-1-DPA-Pflicht?

**Ja.** Drei Gründe:

1. **DACH-Kunden werden danach fragen.** Im PRD ist DACH-Indie-Hacker-Kohorte explizit Ziel-Markt. DACH-Solopreneurs sind unter GDPR direkt verpflichtet, **selbst** mit ihren Auftragsverarbeitern DPAs abzuschließen. Wenn ContextForge keinen DPA-Template hat, kann der Kunde rechtlich nicht onboarden — selbst wenn er es will.

2. **Code-Daten sind Mixed-Data.** Code enthält Author-Mails, Author-Namen, oft auch Customer-Daten in Test-Fixtures oder Migration-Files. Das macht den Datenschutz-Scope unscharf — gerade dann ist DPA pflicht.

3. **DPA-Template ist billig.** Eine [Juro Template](https://juro.com/contract-templates/dpa-data-processing-agreement) oder [GDPR.eu Template](https://gdpr.eu/data-processing-agreement/) ist Open-Source, in 1–2 Tagen mit einem DSGVO-Anwalt (~€500–1500) production-ready. Es gibt **keinen Grund**, das nicht Day-1 zu haben.

### 4.3 Was MUSS der DPA-Template Day-1 enthalten?

Hard-Requirements aus GDPR Article 28:
- Datenkategorien (hier: Code, Author-Metadata, ggf. PR-Kommentare)
- Verarbeitungszwecke (Validation-Analyse, Cross-Repo-Context)
- Subprocessor-Liste (hier: Vercel, Neon, Anthropic AI Gateway, Clerk, Stripe, Resend — **jeder einzelne mit eigenem DPA-Link**)
- Sicherheitsmaßnahmen (Encryption-at-Rest, Access-Controls, Retention)
- Sub-Processor-Notification-Rights
- Audit-Rights des Controllers
- Standard-Contractual-Clauses für US-Subprocessor (Anthropic, Vercel — beide US-headquartered, brauchen SCCs für DACH-Customers)

**Risk-Flag:** Anthropic AI Gateway als Subprocessor ist für DACH-DSGVO-Kunden ein **echter Politikum**. ContextForge muss Day-1 entweder (a) explizit EU-Hosted-LLM-Routing über AI Gateway konfigurieren, oder (b) den Subprocessor-Disclosure offen kommunizieren und ggf. einen "EU-Only-Mode" als Tier-Switch anbieten.

### 4.4 Verdict für PRD

**DPA-Template ist Day-1-Hard-Requirement.** Nicht "wäre nice", sondern "blockiert ersten DACH-Customer-Onboarding ohne". Aufnahme in Phase-0-Lieferliste empfohlen.

---

## 5. PAT-Alternative — der Trade-Off

### 5.1 Was sind PATs?

Personal Access Tokens — User-gebundene Auth-Tokens mit konfigurierbarem Scope und Ablaufzeitraum. Aus [Aembit Blog — Replacing PAT with GitHub App](https://aembit.io/blog/replacing-a-github-personal-access-token-with-a-github-application/) und [GitHub Blog — Fine-grained PATs](https://github.blog/security/application-security/introducing-fine-grained-personal-access-tokens-for-github/):

| Dimension | PAT (Fine-Grained) | GitHub App |
|---|---|---|
| Token-Lifetime | 7–90 Tage oder kein Ablauf | 8 Stunden (Installation-Token) |
| Scope | User-Account-bound | Org-Installation-bound |
| Rate-Limit | 5000 req/h pro User | 15000 req/h pro Installation |
| Setup-Aufwand | 2 Min (User klickt, kopiert Token) | 5–30 Min minimum, oft Tage |
| Approval-Pfad | **User selbst** — keine Org-Owner-Eingriff | Org-Owner-Approval bei restricted Orgs |
| Audit-Trail | Aktionen erscheinen als User | Aktionen erscheinen als App |
| Blast-Radius bei Leak | User-bound, ggf. weitreichend | Org-bound, ggf. limitiert auf installed Repos |

### 5.2 Der PAT-Trade-Off für ContextForge

**Hat-Conversion-Vorteil:** Ja, dramatisch. Lena kann ihren *eigenen* PAT generieren und damit ContextForge auf Kunden-Repos zugreifen lassen — **ohne** dass die Kunden-Org überhaupt eine Installation autorisieren muss. Das verkürzt Time-to-Value auf **<5 Minuten**.

**Hat Architecture-Schulden:** Massiv.
- **Sicherheits-Bombe.** Wenn Lena's PAT leakt, hat der Angreifer Lena's vollen GitHub-Account-Scope, nicht nur ContextForge-Scope. Aus [Endor Labs — CodeRabbit Incident](https://www.endorlabs.com/learn/when-coderabbit-became-pwnedrabbit-a-cautionary-tale-for-every-github-app-vendor-and-their-customers): "a widely installed GitHub App with write permissions is a powerful blast-radius multiplier. The moment app credentials leak, every customer who granted those permissions inherits the incident." Mit PAT ist der Blast-Radius **noch schlimmer**, weil er nicht durch Org-Permissions begrenzt wird.
- **Rotation-Pflicht.** Fine-grained PATs müssen alle 7–90 Tage rotiert werden. Solopreneur-Lena wird das vergessen, der PAT läuft ab, ContextForge stoppt, Lena verliert Vertrauen.
- **GDPR-Disaster.** Lena verarbeitet Kunden-Daten unter ihrer eigenen GitHub-Identity. Audit-Trail beim Kunden zeigt "Lena hat Code gezogen", obwohl es technisch ContextForge war. Das ist eine GDPR-Joint-Controller-Falle.
- **GitHub's eigene Richtung.** GitHub pusht aktiv weg von PATs ([Bruno Terra — Still using PATs in 2025?](https://bmterra.eu/articles/010625-using-github-apps/), [Aembit](https://aembit.io/blog/replacing-a-github-personal-access-token-with-a-github-application/)). PAT-only-Architektur ist zukunfts-toxisch.

### 5.3 Hybrid-Empfehlung

**Default-Architektur:** GitHub App (canonical, secure, GDPR-compliant).

**Phase-0-Workaround für Friction-Free-Onboarding:** Optional PAT-Mode als **Beta-Feature** mit explizitem Disclaimer ("Dies ist ein Beta-Pfad. Wir empfehlen die GitHub-App-Installation für Production-Setups. Dein PAT wird verschlüsselt at-rest gespeichert und rotiert jeden 7. Tag automatisch."). Das gibt Lena Zwei-Klick-Onboarding im Dogfood-Modus, ohne die Architektur permanent zu kompromittieren.

**Klarer Sunset-Pfad:** Ab Phase 1 (M3) wird PAT-Mode deprecated. Ab Phase 2 (M9) abgeschaltet.

---

## 6. Read-Only vs Write — die Friction-Differenz

### 6.1 GitHub's Permission-UX

Wichtige Tatsache aus [GitHub Community Discussion #37117](https://github.com/orgs/community/discussions/37117): GitHub hat 2024 das "act on your behalf"-Warning entfernt für reine User-Read-Only-Apps — aber für Apps, die *repo*, *org*, oder *enterprise* Permissions verlangen, **bleibt das Warning bestehen**.

Das ist ein konkretes UX-Signal: GitHub selbst behandelt Repo-Read-Only **nicht** so harmlos wie der Common-Sense-Verstand annimmt. Aus Sicht eines paranoiden Org-Admins:

- **Read-only Code-Access** = "Vendor kann unseren gesamten Source-Code ständig pullen, indexieren, in seine LLM-Pipeline schicken." Das ist Trade-Secret-Disclosure.
- **Read-only PR-Access** = "Vendor kann jeden internen Engineering-Konflikt im PR-Kommentar lesen."
- **Write-Access** = "Vendor kann unseren Codebase manipulieren."

Aus pragmatischer SMB-CTO-Sicht ist der **Sprung von 0 zu Read-Only signifikant**. Der Sprung von Read-Only zu Write ist **inkrementell**. Aber der Sprung beeinflusst Approval-Wahrscheinlichkeit absolut.

### 6.2 Empirie

Es gibt **keine** quantitative Studie, die "Read-Only-Approval-Rate vs Write-Approval-Rate" misst. Aber wir haben qualitative Evidenz:

- **Snyk Cloud App vs OAuth-Legacy:** Snyk's eigene Migration vom OAuth-Legacy zu GitHub-App war primär motiviert durch "granular repository-level permissions" ([Snyk Docs — GitHub Cloud App](https://docs.snyk.io/developer-tools/scm-integrations/organization-level-integrations/github-cloud-app)). Das impliziert, dass Snyk's Customers den Granular-Permissions-Path bevorzugen — und Read-Only ist die granulärste Stufe.
- **CodeRabbit-Incident** ([Endor Labs](https://www.endorlabs.com/learn/when-coderabbit-became-pwnedrabbit-a-cautionary-tale-for-every-github-app-vendor-and-their-customers)): Der RCE-Vorfall war *deshalb* so kritisch, weil CodeRabbit Write-Permissions hatte. Hätten sie nur Read gehabt, wäre der Blast-Radius eine Größenordnung kleiner. Das ist ein konkretes Argument, das ContextForge in Sales-Konversationen verwenden kann: "Wir sind read-only **by design**, deshalb ist unser CodeRabbit-Risk-Profil nicht-existent."

### 6.3 Empfehlung für ContextForge

- **Default Day-1: Read-Only.** Code+PR-Read, kein Write, keine Org-Admin-Permissions. Das maximiert Approval-Rate und entspricht der Permissions-Granularitäts-Best-Practice.
- **Opt-In-Write per separater Installation-Update.** Sobald Customer Confidence aufgebaut ist (e.g. "ContextForge soll Validation-Findings als PR-Comments posten"), kann der Customer die Permissions in der GitHub-App-Settings *explizit erhöhen*. Das ist ein zweiter Approval-Schritt, aber er kommt **nach** dem Trust-Aufbau.
- **Klare Permissions-Begründung-Page.** Auf der Marketplace-Listing und im Trust-Center: für jede einzelne Permission eine Ein-Satz-Begründung. Vorbild: das was GitGuardian und Snyk in ihren Docs machen.

---

## 7. Conversion-Rate-Comp-Data: Sourcegraph/CodeRabbit/Linear in Sub-100-Customer-Phase

**Datenlage: Praktisch nicht vorhanden.** Keiner der drei hat öffentliche Funnel-Data aus der Sub-100-Phase publiziert. Was wir indirekt rekonstruieren können:

### Sourcegraph

Sourcegraph wurde 2013 gegründet. Die GitHub-App-Integration ist relativ jung; früher lief alles über OAuth-User-Tokens. Die Enterprise-First-DNA von Sourcegraph (Quinn Slack, Y Combinator W14) bedeutet, dass der Bottom-Up-Install-Funnel **nicht ihr Primärpfad** war — sie haben von Anfang an Sales-Led mit Self-Hosted-Deploy gearbeitet. Das ist **kein** Comp für ContextForge im PLG-Pfad, aber **ein** Comp für den Productized-Service-Pfad.

### CodeRabbit

CodeRabbit (gegründet Anfang 2023, $88M total funding, 8000 paying customers in Q3 2025 — [Sacra](https://sacra.com/c/coderabbit/)) hat aggressiv Bottom-Up PLG gespielt. Es gibt keine publizierten Sub-100-Customer-Funnel-Daten, aber das Wachstums-Muster (0 → 8k paying in ~30 Monaten) impliziert, dass die Install-Friction **überwindbar** war, gerade weil CodeRabbit massiv auf OSS-Projects ging (= keine Org-Approval-Hürde, weil Maintainer = Org-Owner = direkter Approver).

### Linear

Linear ist *kein* GitHub-Marketplace-Tool, sondern integriert *mit* GitHub. Die Linear-GitHub-Integration ([Linear Docs — GitHub Integration](https://linear.app/docs/github-integration)) zeigt aber: Linear hat sich entschieden, *Workspace-level Third-Party-App-Approvals* explizit als Feature zu bauen ([Linear Docs — Third-Party App Approvals](https://linear.app/docs/third-party-application-approvals)) — was zeigt, dass selbst eine starke PLG-Marke wie Linear die Customer-Side-Approval-Friction ernst nimmt.

### Was bleibt: Methodisches Fazit

Sub-100-Conversion-Daten sind **proprietary**. Sie sind nur durch direkte Outreach-Interviews mit Indie-Founders (Greptile, Aikido, Pixee, junior Toolings) ableitbar. Das ist eine konkrete Discovery-Interview-Frage für Phase 0.

---

## 8. Drei testbare Annahmen für Discovery-Interviews

Diese drei Annahmen muss ContextForge in den 20 Mom-Test-Interviews (PRD §31) validieren:

### Assumption A — "Lena's Kunden lassen sich überzeugen"

**Hypothese:** ≥60 % der Kunden einer Boutique-Code-Agentur (10–200 Mitarbeiter Customer-Size) werden eine GitHub-App-Installation mit Read-Only-Permissions innerhalb von 5 Werktagen genehmigen, wenn die Agentur (Lena) den Onboarding-Flow durchführt **und** ein DPA-Template + Trust-Center-Pseudo bereitsteht.

**Test:** Frage 5–7 reale Code-Agenturen (Lena-Personas) nach ihren Customer-Conversion-Erfahrungen mit anderen GitHub-Tools (Snyk, Sentry, Linear, CodeRabbit). Spezifische Frage: "Wenn Du Snyk in einer Kunden-Org installieren wolltest, wie viele Werktage hat es im Median gebraucht? Wie viele Kunden haben es komplett abgelehnt?"

**Falsifikation:** Wenn <40 % der Kunden zustimmen oder Median >10 Werktage, ist Risiko #6 wirklich Hoch/Hoch und ContextForge braucht ein PAT-Bypass-Tier oder ein Self-Hosted-Tier Day 1.

### Assumption B — "DPA-Anfrage ist die häufigste Reibung"

**Hypothese:** In >50 % der Customer-Approval-Prozesse ist die DPA-Anfrage des Kunden der **erste konkrete Block** (vor SOC-2-Frage, vor Pen-Test-Frage, vor Customer-Reference-Frage).

**Test:** Frage in den Mom-Test-Interviews mit Lena-Personas: "Beim letzten neuen Vendor, den Du in eine Kunden-Org installieren wolltest — was war der erste konkrete Block? In welcher Reihenfolge kamen die Fragen?"

**Falsifikation:** Falls Customer-Reference (Henne-Ei) >50 % als erstes kommt statt DPA, muss ContextForge in Phase 0 in *Beta-Customer-Logos* investieren, nicht in DPA-Templates.

### Assumption C — "Read-Only ist material differenzierend"

**Hypothese:** Bei sonst gleichem Tooling-Pitch sagen ≥30 % mehr SMB-CTOs "Ja" zu Read-Only-GitHub-App als zu Read+Write.

**Test:** A/B-Tests in den Discovery-Interviews. Zwei Pitch-Varianten desselben Tools, eine mit Read-Only-Default, eine mit Write-Default. Frage: "Welchen würdest Du in Deiner Org installieren?"

**Falsifikation:** Falls Read-Only keine signifikante Conversion-Lift bringt, ist die "Read-Only-by-design"-Architektur-Investition Phase 0 nicht priorisiert. Dann kann ContextForge bereits Write-Permissions Day 1 verlangen und parallel mit anderen Trust-Signalen arbeiten.

---

## 9. Mitigations — was ContextForge konkret Day-1 bauen MUSS

Aufgereiht in Reihenfolge der Wirkung pro investiertem Aufwand:

### Mitigation 1: DPA-Template + Subprocessor-Page (Aufwand: 2 PD)

- DPA-Template auf Basis [GDPR.eu Template](https://gdpr.eu/data-processing-agreement/), durch DACH-DSGVO-Anwalt validiert (~€800–1500).
- Subprocessor-Liste publik unter `contextforge.io/subprocessors`: Vercel, Neon, Clerk, AI Gateway (mit Anthropic/OpenAI als Sub-Sub), Stripe, Resend.
- Click-Wrap-DPA bei Customer-Onboarding (analog Stripe).

### Mitigation 2: Trust-Center-Pseudo-MVP (Aufwand: 1 PD)

- Public Page `contextforge.io/trust`: Permissions-Begründungs-Table, Architecture-Diagram, Encryption-Policy, Data-Retention-Policy, Subprocessor-Liste, Incident-Disclosure-Commitment.
- Keine SafeBase-Investment in Phase 0 (zu teuer). Stattdessen statische Next.js-Page. Upgradepfad zu SafeBase ab Phase 2.

### Mitigation 3: Requester→Approver-Bridge (Aufwand: 3–5 PD)

- Konvu-Pattern implementieren: ContextForge speichert bei "Install request" den Requester (Lena-Session) und matched per Webhook auf Org-Approval.
- Approver landet auf "Thanks, we've notified Lena"-Page, nicht Onboarding-Flow.
- Lena bekommt In-App-Notification, kann Install-fertig-Step ausführen.

### Mitigation 4: Read-Only-Default + Opt-In-Write (Aufwand: 1 PD Architecture-Decision)

- App-Manifest schreibt Read-Only-Permissions-Set als Default.
- Opt-In-Write als separate Installation-Update-Flow.

### Mitigation 5: Persistent Install-Status-UI (Aufwand: 2 PD)

- Lena's Dashboard zeigt klar: "Customer Acme Corp — Install pending Owner approval (3 Tage ausstehend) → [Reminder senden]".
- Reminder-Flow per Email an Customer-Owner mit pre-written Subject-Line ("ContextForge Installation Request from Lena").

### Aggregierter Aufwand

**9–12 PD = ~2–3 Wochen Solo-Engineering-Aufwand.** Aufnahme in Phase-0-PRD §16 Tech-Stack-Sektion oder als eigener Phase-0-Liefergegenstand "GitHub-App-Onboarding-Layer".

---

## 10. Final Verdict — Risiko-Re-Calibration

### Update zu PRD Risiko #6

**Current:** "GitHub-App-Approval-Hürde — Hoch probability, Mittel impact"

**Empfohlen:**

> **GitHub-App-Approval-Hürde — Hoch probability, Mittel-Hoch impact (conditional auf Mitigation-Build).**
>
> Probability bleibt Hoch: jeder Customer-Install in der Lena-Konstellation trifft mindestens auf eine Reibungs-Stufe (Owner-Approval, Vendor-Questionnaire, oder DPA-Anfrage).
>
> Impact ist Mittel-Hoch in TTV (Time-to-Value), Niedrig in Conversion-Loss **sofern** die fünf Day-1-Mitigations (§9) gebaut sind. Ohne Mitigations: Hoch in beidem.
>
> Severity-Band für die Hürde als Ganzes: **Mid.** Sie ist kein Deal-Killer, weil drei strukturelle Faktoren sie abfedern: (a) GitHub-App-Approval ist ein bekanntes Friction-Pattern, das Vendors wie Snyk, GitGuardian, CodeRabbit erfolgreich überwunden haben; (b) Lena's Productized-Service-Modell trägt die Approval-Friction durch den Service hindurch (PRD §11 Hybrid-Layered-Pivot); (c) Read-Only-by-Design minimiert die CISO-pushback-Wahrscheinlichkeit erheblich.

### Severity-Bänder im Detail

| Aspekt | Severity | Begründung |
|---|---|---|
| Probability of friction event | **Strong (= probable)** | Praktisch sicher in der Lena-Konstellation |
| Impact on TTV | **Mid-to-Strong** | 5 Werktage bis 6 Wochen je Customer |
| Impact on Conversion | **Mid** mit Mitigations, **Strong** ohne | 35–60 % Drop-off-Risiko |
| Deal-Killer-Probability | **Weak (= unwahrscheinlich)** | Comps haben es überlebt |
| Mitigation-Cost | **Mid** | 2–3 Wochen Engineering Day 1 |

**Hauptaussage:** **Manageable Friction, nicht Deal-Killer.** Aufnahme von Mitigation-Liste §9 als Phase-0-Hard-Requirement.

---

## Appendix: Quellen

### Konversions- und Funnel-Daten
- [Konvu Blog — Handling GitHub App Admin Approval Workflows](https://konvu.com/blog/github-app-admin-approval-workflows)
- [GitGuardian — Most-installed GitHub Marketplace App Blog](https://blog.gitguardian.com/gitguardian-is-now-the-overall-most-installed-github-marketplace-app-2/)
- [Sacra Profile — CodeRabbit revenue, valuation & funding](https://sacra.com/c/coderabbit/)
- [Product-Led Foundations — PLG Metrics](https://www.productled.org/foundations/product-led-growth-metrics)
- [SlashExperts — PLG Conversion Rates Guide](https://slashexperts.com/post/plg-conversion-rates-and-optimization-guide/)

### GitHub-App Mechanik
- [GitHub Docs — Installing a GitHub App from a third party](https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-a-third-party)
- [GitHub Docs — Authorizing GitHub Apps](https://docs.github.com/en/apps/using-github-apps/authorizing-github-apps)
- [GitHub Docs — Approving OAuth apps for your organization](https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/approving-oauth-apps-for-your-organization)
- [GitHub Changelog 2025-12-22 — Control who can request apps](https://github.blog/changelog/2025-12-22-control-who-can-request-apps-for-your-organization/)
- [GitHub Changelog 2025-07-01 — Enterprise-level access for GitHub Apps](https://github.blog/changelog/2025-07-01-enterprise-level-access-for-github-apps-and-installation-automation-apis/)
- [GitHub Community Discussion #37117 — "act on your behalf" warning](https://github.com/orgs/community/discussions/37117)

### Comp-Vendor-Docs
- [Snyk Docs — GitHub Cloud App](https://docs.snyk.io/developer-tools/scm-integrations/organization-level-integrations/github-cloud-app)
- [Snyk on GitHub Marketplace (238k installs)](https://github.com/marketplace/snyk)
- [CodeClimate — Approve as third-party application in GitHub](https://docs.codeclimate.com/docs/approve-code-climate-as-a-third-party-application-in-github-1)
- [DeepSource on GitHub Marketplace](https://github.com/marketplace/deepsource-io)
- [CodeRabbit Docs](https://docs.coderabbit.ai/platforms/github-enterprise-server)
- [Greptile Enterprise](https://www.greptile.com/enterprise)
- [GitGuardian Docs — Integrate GitHub](https://docs.gitguardian.com/internal-monitoring/integrate-sources/vcs-integrations/github)
- [Aikido Docs — Connect GitHub Organization](https://help.aikido.dev/code-scanning/connect-your-source-code/connect-github-account-to-aikido)
- [Linear Docs — Third-Party App Approvals](https://linear.app/docs/third-party-application-approvals)
- [Linear Docs — GitHub Integration](https://linear.app/docs/github-integration)
- [Sourcegraph Docs — GitHub Integration](https://docs.sourcegraph.com/admin/code_hosts/github)

### Security & Risk
- [Endor Labs — When CodeRabbit became PwnedRabbit](https://www.endorlabs.com/learn/when-coderabbit-became-pwnedrabbit-a-cautionary-tale-for-every-github-app-vendor-and-their-customers)
- [Aembit Blog — Replacing PAT with GitHub Application](https://aembit.io/blog/replacing-a-github-personal-access-token-with-a-github-application/)
- [GitHub Blog — Fine-grained personal access tokens](https://github.blog/security/application-security/introducing-fine-grained-personal-access-tokens-for-github/)
- [Bruno Terra — Still Using PATs in 2025?](https://bmterra.eu/articles/010625-using-github-apps/)

### Trust, SOC-2, DPA
- [Sprinto — Security Questionnaires for Startups](https://sprinto.com/blog/security-questionnaires-for-startups/)
- [Workstreet — SOC 2 for Startups 2026](https://www.workstreet.com/blog/soc-2-for-startups)
- [Carbide Security — Questionnaire Trajectory](https://carbidesecure.com/resources/security-questionnaire-hits-startup/)
- [CISO Series — Turning Trust into Growth Engine with SafeBase](https://cisoseries.com/turning-trust-into-a-growth-engine-with-safebase/)
- [Secure Privacy — SaaS DPA Guide](https://secureprivacy.ai/blog/data-processing-agreements-dpas-for-saas)
- [GDPR.eu — Data Processing Agreement Template](https://gdpr.eu/data-processing-agreement/)
- [Juro — DPA Template](https://juro.com/contract-templates/dpa-data-processing-agreement)

---

*Track B1 — research complete. Verdict: Mid-Severity, manageable mit 5 konkreten Day-1-Mitigations. Risiko #6 Re-Calibration: Hoch/Mittel-Hoch (conditional). Phase-0-Hard-Requirements: DPA-Template, Trust-Center-Pseudo, Requester-Bridge, Read-Only-Default, Install-Status-UI. Total: ~9–12 PD Aufwand.*
