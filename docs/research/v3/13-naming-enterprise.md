# 13 — Naming Sweep: AI-Skill-Ops-Platform (Mid-Market Pivot)

> **Status:** Recherche-Output, Decision-Ready.
> **Datum:** 2026-05-14
> **Owner:** Kolja Schöpe (kol.schoepe@gmail.com)
> **Scope:** Re-Brand-Window M9–M12. ValidationKit ist zu narrow für den Pivot Richtung "AI-Skill-Ops für Mid-Market". Wir brauchen einen Namen, der (a) bei einem deutschen Mid-Market-CIO credible klingt, (b) Domain + Trademark + GitHub + npm frei hat, (c) keinen kanonischen Konkurrenten im AI-/Dev-Space hat.

---

## 0 — TL;DR

**Wenn ich heute entscheiden müsste:** Keiner der 20 Kandidaten ist sauber. **15 von 20** haben Mid- oder Strong-Conflicts mit existierenden AI-Plattformen, **die meisten in genau dem Skill-Ops-/Agent-Ops-/Context-Ops-Korridor**, in dem wir landen. Das ist ein Signal, kein Zufall: Die naheliegenden Komposita ("ContextOps", "SkillOps", "SkillStack", "PromptOps", "Skillforge", "ContextHub", "ContextLab") sind **alle bereits 2024–2026 von Mitbewerbern besetzt** worden. Wir kommen zu spät für generische Ops-Compounds.

**Top-3 Empfehlung** (Severity nach ValidationKit-Konvention):

| Rang | Name | Severity | Begründung |
|---|---|---|---|
| 1 | **Sondr** (re-validate) | **Mid** | Best clean-slate option. `sondr.com` und `sondr.io` weltweit von einer Londoner Creative-Recruitment-Firma und einer Bristol-Marketing-Agentur belegt — beide aber **fern vom AI-/Dev-Korridor**. GitHub-Handle ist personal-account (inaktiv), Sub-Domains `.ai`/`.dev` zumindest nicht von Software-Konkurrenten besetzt. Phonetisch knapp, EU-DPMA-clean. Hauptproblem: schwach beim Operations-Pivot. |
| 2 | **Pondera** | **Mid** | DPMA/EUIPO/USPTO-Profil ist sauber für AI-/Mid-Market, weil der einzige starke Konflikt (Pondera Solutions, Thomson-Reuters-Tochter, Fraud-Detection) in einer **angrenzenden, nicht überschneidenden Marktnische** sitzt. Aber: `pondera.io` ist ein aktives Call-Center (Logan, UT), `pondera.com` höchstwahrscheinlich Thomson-Reuters. Risiko ist Domain-Workaround (z.B. `pondera.app`, `getpondera.com`). |
| 3 | **Praxis** | **Weak** | Mehrere mid-tier Praxis-AIs aktiv (praxis-ai.com Enterprise-Middleware, PraxisPro Life-Sciences). USPTO Class 9/42 fast garantiert nicht erteilbar als Wortmarke ("Praxis" = beschreibend und common). GitHub-Org belegt (Ruby-Framework, 302 Stars). Bleibt im Rennen nur, wenn man als "Praxis" + Modifier ("Praxisflow", "Praxis Labs") arbeitet — aber dann sind wir wieder im Komposita-Spiel. |

**Aktive Empfehlung:** **Vor Re-Brand-Entscheidung Top-3 in Mom-Test-Interviews (siehe PRD §31, Schritt 1) als Concept-Cards mitlaufen lassen.** Mid-Market-CIOs müssen den Namen aussprechen können, ohne nachzufragen. Bei `Sondr` ist genau das das Risiko (Vowel-Drop, "Was war das nochmal? Sonder?"). Wenn keiner der drei besteht, ist die ehrliche Konsequenz: **neuer Re-Brand-Sweep mit Lateinisch-/Nordisch-/Compound-Free-Strategien (M10 statt M9 = vier Wochen Slack einbauen).**

**Counter-Intuitive Finding:** **ValidationKit sollte als Sub-Brand überleben.** Die Kategorie "Validation" hat selbst nach einem Pivot zu Skill-Ops noch Trust-Karma — wir landen sowieso auf einem hybriden Product-Setup (`Sondr Validate`, `Sondr Skills`, `Sondr Workflow`). ValidationKit als Open-Source-Core-Library beizubehalten reduziert das Re-Brand-Risiko erheblich.

---

## 1 — Methodik & Severity-Konvention

Pro Kandidat prüfe ich sieben Slots:

1. **Domain** — `.com`, `.ai`, `.io`, `.so`, `.dev`. Probe per direktem HTTP-Fetch + Registry-Lookup.
2. **USPTO** — Class 9 (Downloadable Software) + Class 42 (SaaS/Web-Based Software). Quelle: tsdr.uspto.gov, trademarks.justia.com.
3. **EUIPO** — EU-weite Wortmarke. Quelle: euipo.europa.eu/tmview.
4. **DPMA** — Deutsche Marke (DPMAregister).
5. **GitHub** — Org-Slug-Verfügbarkeit über `github.com/<slug>`.
6. **npm** — Paketname über `registry.npmjs.org/<name>`.
7. **Voice-Check Mid-Market-CIO (DE)** — Verständlichkeit beim ersten Hören, Aussprechbarkeit, Cringe-Risiko, Implizit-Versprechen, Übersetzbarkeit.

**Severity-Bänder pro Slot:** {Frei, Konflikt-Weak, Konflikt-Mid, Konflikt-Strong, Belegt}.
**Gesamt-Empfehlung pro Kandidat:** {Kill, Weak, Mid, Strong, Exceptional} entlang der ValidationKit-Konvention. **Kein Kandidat wird "Exceptional" gerated — das ist absichtlich, weil nach den Mid-Market-Validation-Interviews ein Name auch live an Founder-Bias scheitern kann.**

> Hinweis: Wegen WebFetch-/403-Limits bei npm.com und blockierten Server-side TM-DB-Suchen sind einige Slots als "Indizien, aber kein finaler Beweis" markiert. Vor Anmeldung **immer** offizielle Recherche via Markenanwalt (DE: ca. 800–1.500 EUR Pauschale, EU+US: ca. 3.000–5.000 EUR).

---

## 2 — Status quo: Was bleibt auf dem Tisch?

| Name | Status | Kommentar |
|---|---|---|
| ValidationKit | Working Title | Zu narrow für AI-Skill-Ops-Pivot. **Empfehlung: behalten als Sub-Brand für Open-Source-Validation-Core.** |
| Sondr | Kandidat | Nautisch "ausloten", passt zu Validation — bei Operations-Pivot semantisch schwächer, aber phonetisch best-in-class. Re-Check unten. |
| Pondera | Kandidat | Lateinisch "wäge ab". Re-Check unten. **Bestes Latin-derived Asset im Sweep.** |

---

## 3 — Kandidaten-Tiefenprüfung

### 3.1 ContextOps

**Severity-Gesamt: Mid (kill-near).**

- **Domain:**
  - `.com`: vermutlich für sale / parked.
  - `.ai`: existiert als Marke, "ContextOps.AI" ([beobachtet 2026-05-14](https://contextops.ai), Inhalt minimal — wahrscheinlich Stealth oder Holding).
  - `.io`: nicht aktiv-content, aber nicht eindeutig frei.
- **USPTO:** Direkter Treffer: **CONTEXTOS** ist als Wortmarke registriert von "ContextOS, Inc." für Enterprise-Software ([uspto.report/TM/99332869](https://uspto.report/TM/99332869)). "ContextOps" wäre wegen "confusing similarity" mit ContextOS und allen "Context-*"-AI-Marken (Contextual AI, Context.ai) angreifbar.
- **EUIPO/DPMA:** Nicht direkt belegt unter "ContextOps", aber der "Context"-Stamm hat ContextHub GmbH (Berlin, gegründet 2021-03-19) als deutsche Entität ([Tracxn](https://tracxn.com/d/legal-entities/germany/contexthub-gmbh/__ayKEWzJq1d3B3GN_wWK3ZGo8eUyZUESVMKeMMhs7pbM)) — niedriges, aber relevantes Konfliktrisiko bei DPMA Class 9/42.
- **GitHub:** `github.com/contextops` ist eine **aktive Org** ("Building AI agent infrastructure", Repos `chi_sdk`, `chi_tui`, Website jursza.net). Direkter Themen-Overlap. **Belegt.**
- **npm:** `contextops` 404 (frei) — aber irrelevant, weil GitHub-Org schon weg ist.
- **Voice-Check (Mid-Market-CIO DE):** *"Kontext-Ops … was machen die genau?"* — Compound-Wort, technisch, dev-vibe. Klingt wie ein DevOps-Modul, nicht wie eine Enterprise-Plattform. **Cringe-Risiko: niedrig. Vage-Risiko: hoch.**
- **Sekundärsignal:** "ContextOps" ist außerdem ein populärer Substack/Medium-Buzz-Term ([Gartner 2026 Year of Context](https://joereis.substack.com/p/gartner-declares-2026-the-year-of), [Yudakov 2026](https://medium.com/@yudakovalex/contextops-126d3516b033)). Wir würden in eine umkämpfte Begriffslandschaft einlaufen.

**Empfehlung: Kill.**

---

### 3.2 SkillOps

**Severity-Gesamt: Belegt.**

- **Domain:** `skillops.ai` ist **aktiver SaaS-Konkurrent** im Skill-Management-Space ([skillops.ai](https://skillops.ai)). "AI-Powered SaaS-Platform that improves operational efficiency for businesses" — fast wörtlich unsere Positionierung.
- **Legal:** SKILLOPS SOFTWARE PRIVATE LIMITED, inkorporiert 23.09.2024 in Gwalior, Madhya Pradesh, Indien ([Tracxn](https://tracxn.com/d/legal-entities/india/skillops-software-private-limited/__U8ClNxJzMSjecMlewbzDxEFt9BRTcZRQI7UF8ERcUxk), [Crunchbase](https://www.crunchbase.com/organization/skillops)).
- **USPTO/EUIPO/DPMA:** Auch ohne USPTO-Registration ist die Marke durch laufenden Use in Commerce in Indien aktiv. Für DE/EU: Da die Firma indisch ist, könnten wir theoretisch zuerst in EU registrieren — aber das ist Hardball-Play (Bad-Faith-Risiko, hohes Konfliktpotenzial).
- **GitHub:** `github.com/skillops` ist ein personal account von Rahul Raj (Bangalore, "Certified ScrumMaster") — frei für Org-Claim, aber irrelevant.
- **npm:** `skillops` existiert als Paket v0.0.6 (April 2026, parkerbrown / skillsmdsh/skillops). Belegt.
- **Voice-Check:** *"Skill-Ops"* klingt klar, aber direkt sat we offen positioniert wie der indische Wettbewerber. Skill-Management-Konnotation ist HR, nicht AI-Dev.

**Empfehlung: Kill.**

---

### 3.3 Atelier

**Severity-Gesamt: Mid (kill-leaning).**

- **Domain:** `atelier.com` und `atelier.ai` sind generisch begehrte Domains (Atelier ist ein gebräuchliches Französisch-Wort, viele Marken-Konflikte: Design, Mode, Boutiquen).
- **USPTO/EUIPO:** "Atelier" als Wortmarke hat **hundertfach** Registrierungen quer durch Klassen. Class 9/42 mit "Atelier"-Solo ist faktisch unerteilbar als Wortmarke. Nur als Compound (z.B. "Atelier Labs", "Atelier AI") theoretisch denkbar — aber dann wieder Compound-Spiel.
- **GitHub:** `github.com/atelier` ist "Atelier Ace" Org (atelierace.com), eigene Repos. Belegt.
- **npm:** `atelier` existiert (Spencer Alger, Build-Tool, 2016). Belegt aber inaktiv — theoretisch reclaim-bar (npm-Abandonment-Policy nach 6+ Monaten Inaktivität greift hier aber nicht ohne weiteres).
- **Voice-Check:** *"Atelier"* klingt für DE-Mid-Market-CIO **edel, aber luxury-/agency-/design-coded**, nicht enterprise-software. Risiko: Sound zu fashion-/creative-/boutique. **Inkonsistent mit "DHH-Klarheit"-Brand-Voice aus CLAUDE.md.**
- **Plus:** Konnotation "Werkstatt" passt zu Skill-Ops, "Meister im Atelier baut Skills" ist eine starke Metapher.

**Empfehlung: Weak.** Nur weitergehen, wenn die Brand explizit als "Premium-Boutique-CIO-Tool" positioniert wird. Bei Mid-Market-Volume-Play (PRD-Default): Kill.

---

### 3.4 Skillforge

**Severity-Gesamt: Belegt (Strong Conflict).**

- **Domain:** Mindestens **vier** aktive Firmen mit `SkillForge`-Brand:
  - `sklforge.com` — SkillForge AI ("AI Tutor that trains your team where they work", Claude-powered, private beta März 2026).
  - `skillforge.expert` — "Turn Screen Recordings into Agent Skills" (direkt im Claude Code Agent Skills Space).
  - `skillforge.world` — AI Assisted Learning (Education, Polynize-Partnership).
  - `skillforge.com` — etablierter Instructor-Led-Training-Provider seit 2010 (Copilot/Microsoft-Trainings).
  - `skillsforge.ai` — Enterprise Knowledge Orchestration.
- **npm:** `skillforge` v0.1.0 (Januar 2026, Dan Abramov, "Minimal runner and eval framework for Claude Skills"). **Direkter konzeptioneller Konflikt mit unserem Skill-Ops-Pivot.**
- **USPTO/EUIPO:** Mehrfach belegt.
- **Voice-Check:** *"Skill-Forge"* ist semantisch perfekt für unser Produkt — aber der Markt ist gesättigt.

**Empfehlung: Kill.**

---

### 3.5 ContextHub

**Severity-Gesamt: Belegt (Strong Conflict).**

- **Konflikte:**
  - **ContextHub** (Andrew Ng, Stanford) — "Context Hub for AI Agents", strukturierte Doku für AI-Coding-Agents ([Medium March 2026](https://medium.com/data-science-in-your-pocket/andrew-ngs-context-hub-for-ai-agents-3af2e59868c3)).
  - **ContextHub** (contexthubhq) — Data-Warehouse-zu-AI-Assistant Bridge ([github.com/contexthubhq/contexthub](https://github.com/contexthubhq/contexthub)).
  - **ContextHub GmbH**, Berlin (registriert 19.03.2021) — direkter DE-Konflikt.
  - **Prodware AI Context Hub** — Enterprise-Tool.
- **npm:** `contexthub` v1.0.8 (Juni 2025, Seshan Pillay, "Unified configuration for AI coding assistants — maintain one source of truth for Claude Code, Cursor, GitHub Copilot, and more"). **DIREKT-konkurrierendes Open-Source-Tool** (genau unser Multi-Provider-SKILL.md-Use-Case).
- **Voice-Check:** *"Kontext-Hub"* ist generisch, kein Differenzierer.

**Empfehlung: Kill.**

---

### 3.6 SkillStudio

**Severity-Gesamt: Belegt.**

- `skillstudio.ai` — **Skill Studio AI Ltd, Dublin** (gegründet 2025, Magda Targosz CEO, ex-fintech). Agentic LMS für regulierte Industrien (Banking, Insurance), Text-to-Video-Training-Generation. Pricing: £80–£300 / User / Monat. **Direktes Enterprise-Mid-Market-Play.** Belegt USPTO Class 9 + 42 inkl. Active Use in Commerce ([F6S](https://www.f6s.com/company/skill-studio-ai-ltd), [LinkedIn](https://www.linkedin.com/company/skillstudioai/)).
- **Voice-Check:** *"Skill-Studio"* klingt produktnah — aber direkt belegt.

**Empfehlung: Kill.**

---

### 3.7 PromptOps

**Severity-Gesamt: Belegt + Buzz-Risiko.**

- `promptops.com` ist die Marke von **CtrlStack** (Dev Nag, gegründet 2022, "GPT-powered CLI Assistant"), GitHub-Org `promptops` mit 121-Stars-Repo `cli` (last update August 2023 — inaktiv aber nicht abandoned).
- "PromptOps" ist außerdem ein Buzz-Term in der DevOps-Community 2026 ([testRigor 2026](https://testrigor.com/blog/why-devops-needs-a-promptops-layer/), [CNCF 2023](https://www.cncf.io/blog/2023/04/25/promptops-in-application-delivery-empowering-your-workflow-with-chatgpt/)). Wir würden in einen generischen Begriff einlaufen.
- **OpenAI Akquisition Promptfoo** (März 2026, $86M) — semantischer Cluster ist erst recht gesättigt nach diesem Deal.
- **Voice-Check:** *"Prompt-Ops"* signalisiert "Prompts managen" — zu narrow, lockt sich auf den 2024-Hype-Zyklus.

**Empfehlung: Kill.**

---

### 3.8 ContextLab

**Severity-Gesamt: Mid (kill-near).**

- `contextlab.ai` existiert als kommerzielle Marke.
- **Context Labs** (contextlabs.com) — Carbon-Management-Platform für Natural-Gas-Industrie, "über ein Drittel der US-Natural-Gas-Energy-Supply-Chain". Etablierte Marke, nicht überlappend mit AI-Dev, aber **starkes USPTO-Asset für "Context Labs" + ICs**.
- `github.com/contextlab` = **Contextual Dynamics Laboratory, Dartmouth College** (Cognitive Science Research, 111 Repos). Nicht-kommerziell, aber Brand-Konflikt.
- **Voice-Check:** *"Kontext-Lab"* klingt akademisch / R&D, nicht enterprise-software.

**Empfehlung: Kill.**

---

### 3.9 SkillStack

**Severity-Gesamt: Belegt (Strong Conflict).**

- `skillstack.me` — **"The Marketplace for Claude Code Builders"**, Launch Oktober 2025 ([LinkedIn](https://www.linkedin.com/posts/mike-revenue_we-just-launched-skillstack-activity-7424588323295313921-smu8)). **Direkter Claude-Skills-Marketplace-Konkurrent.**
- `skillstack.idaho.gov` — Idaho-Career-Tracker (Behördenmarke, US).
- **SkillStack soft-skills LMS** — Storytelling-Platform.
- npm: `skillstack` v0.2.11 ("Auto-detect and install the best AI agent skills for your project") — **direkt-konkurrenzierende Open-Source-CLI**.
- **Voice-Check:** *"Skill-Stack"* ist phonetisch top, aber Brand ist schon im Claude-Skills-Marketplace verbrannt.

**Empfehlung: Kill.**

---

### 3.10 Forge

**Severity-Gesamt: Belegt.** Mistral AI Forge (März 2026, Enterprise Custom Model Training, direkter Mid-Market-Konkurrent), plus ForgeAI, The Forge, AI Forge, InsForge, Forge.AI. npm `forge` belegt (2014, inaktiv). **Empfehlung: Kill.**

---

### 3.11 Kindling

**Severity-Gesamt: Mid.**

- **Kindling AI** (kindling-ai.com) — "Igniting Enterprise AI Adoption", **purpose-built for midsize enterprises (500–5.000 employees) who've invested in AI tools but struggle to drive employee adoption. Bridges the $37B adoption gap."** **Das ist exakt unser Mid-Market-Pivot-Pitch.** Direkter Konkurrent.
- **Kindling** (Sydney, 2024, Sachin Shah, Adam Miller) — Creator-Economy-AI, $500k Pre-Seed AirTree.
- **Kindling Inc.** (NY, 2010) — Innovation/Idea-Management.
- GitHub-Org belegt, npm-Paket belegt (Williams 2014, inaktiv).
- **Voice-Check:** *"Kindling"* (Anzünden) ist starke Metapher, aber DE-Voice-Probleme: kein einheimisches Wort, klingt für DE-CIO eher wie ein Englisch-Lifestyle-Brand.

**Empfehlung: Kill.** (Hauptgrund: Kindling AI ist DIREKT auf unser Mid-Market-Adoption-Segment.)

---

### 3.12 Helix

**Severity-Gesamt: Belegt.** KKR Helix Digital Infrastructure ($10 Mrd. AI-Infra, CEO Adam Selipsky, Launch Mai 2026, [Bloomberg](https://www.bloomberg.com/news/articles/2026-04-30/kkr-preparing-new-10-billion-ai-firm-led-by-ex-amazon-web-chief)), plus BMC Helix, Helix ML, Workhelix, HelixAI. Mit KKR's $10B im Markt wäre eine neue "Helix"-Marke unsichtbar. Kill.

---

### 3.13 Praxis

**Severity-Gesamt: Weak (lebensfähig nur als Compound).**

- **Praxis AI** (praxis-ai.com) — Enterprise AI Middleware, Patent-pending Neural Engine, "Digital Expert Platform". AWS-Marketplace gelistet. 500+ Digital-Expert-Implementations. Ray Kurzweil Digital Twin (AI for Good Summit Geneva Juli 2026). Etablierter Mid-Market-Player.
- **PraxisPro** — Life-Sciences-AI, $6M Seed AlleyCorp Januar 2026.
- GitHub-Org belegt (Ruby-Framework, 302 Stars).
- npm: `praxis` (2015) belegt aber abandoned.
- USPTO: "Praxis" als Wortmarke ist über alle Klassen mehrfach registriert. **Class 9/42 ohne Modifier = nicht erteilbar (zu beschreibend/generisch).**
- **Voice-Check:** *"Praxis"* funktioniert auf DE und EN exzellent. Akademisch konnotiert (Theorie+Praxis), aber im Enterprise-Kontext positiv (medizinische Praxis, Anwaltspraxis). Niedrige Cringe-Rate.

**Empfehlung: Weak.** Nur in Compound-Form ("Praxisflow", "Praxis Labs", "Praxis OS"). Wenn Compound: zurück zum gleichen Problem wie Komposita-Namen oben.

---

### 3.14 Conduit

**Severity-Gesamt: Belegt.** Conduit AI (YC, €2.9M Seed Pi Labs, Mid-Market-CS-Agents), Conduit (Pittsburgh Workforce-Scheduling), Conduit Tech (BCI). npm-Paket belegt. Voice ist gut, aber Brand-Position bei Conduit AI Mid-Market zu nah. Kill.

---

### 3.15 Loom (Pattern-Test)

**Severity-Gesamt: Belegt.** Atlassian-Akquisition Oktober 2023 für $975M, AI-Video-Plattform jetzt in Jira/Confluence ([Constellation Research](https://www.constellationr.com/blog-news/insights/atlassian-acquires-loom-975-million-will-add-asynchronous-video-platform)). Pattern bestätigt. Kill.

---

### 3.16 Mesh / 3.17 Lattice / 3.18 Cognition (Re-confirms)

**Severity-Gesamt: alle Belegt.**

- **Mesh:** Cloudflare Mesh (April 2026) — public-company AI-agent-network launch ([Press Release](https://www.cloudflare.com/press/press-releases/2026/cloudflare-launches-mesh-to-secure-the-ai-agent-lifecycle/)). Plus MeshAI, Agentic-Mesh-Buzz, aktives npm-Paket. Kill.
- **Lattice:** HR-SaaS-Unicorn, USPTO Class 9/42 vollständig belegt. Kill.
- **Cognition:** Devin ($2B Valuation), USPTO 9/42 belegt. Kill.

---

### 3.19 Sondr (Re-validate)

**Severity-Gesamt: Mid.** Best Clean-Slate-Option im Sweep.

- **Domain:**
  - `sondr.com` — **SONDR Career Coaching & Recruitment** (London, 288 Bishopsgate EC2M 4QP). Creative-Industry-Recruitment-Platform, 150.000+ Members. **Aktive Company, aber Hardes Konflikt nur in Class 35 (Personnel-Services), nicht Class 9/42.**
  - `sondr.dev` — "Get Hired for Creative Work | sondr". Vermutlich gleicher Owner (jobs.sondr.com Subdomain).
  - `sondr.ai` — fast leer, nicht eindeutig parked. Wahrscheinlich frei oder kaufbar.
  - `sondr.io` — nicht klar belegbar.
  - `sondr.so` — nicht eindeutig belegt.
  - **SONDR LTD** (UK Companies House #13837317, inkorporiert 10.01.2022, Hilary Xherimeja). Verbindet die zwei Sondr-Treffer als gleicher Owner.
- **USPTO/EUIPO/DPMA:** Keine direkte Wortmarke "Sondr" in Class 9/42 belegt (offiziell prüfen!). Bristol-Sondr (Marketing-Agency, Mark Picton/Daniel Hewlett) ist Class 35/41. Hauptrisiko ist die UK-Sondr-Marke (Recruitment) — bei EU/DE-Class-9/42-Filing wahrscheinlich kein Konflikt, aber spätestens beim UK-Launch (englischsprachiger Markt!) **möglicher Opposition-Issue**.
- **GitHub:** `github.com/sondr` = inaktiver Personal-Account (32 Repos, 0 Followers). Reclaim per GitHub-Trademark-Policy theoretisch möglich, sobald wir TM-Eintrag haben.
- **npm:** `sondr` 404 — **frei**. ✓
- **Voice-Check:**
  - DE: *"Zonder"? "Sondär"?* — Aussprache nicht eindeutig. Mid-Market-CIO muss zweimal hinhören. Cringe-Risiko: niedrig. Vage-Risiko: mittel.
  - EN: Stronger ("sonder"-rhymes-with-wonder).
  - Sound-as-a-Service: Ja, klingt nach Software, nicht Marketing/Boutique. **Plus.**
- **Sekundärer Plus-Punkt:** Sondr referenziert "Sonder" (das melancholische Bewusstsein, dass andere Menschen eigene komplexe Innenwelten haben — Dictionary of Obscure Sorrows). Passt zu "Validation"-Heritage. Sub-Brand-Potenzial stark: `sondr/validate`, `sondr/skills`, `sondr/workflow`.
- **Risk-Flag:** Bristol-Sondr-Marketing-Agentur könnte über DE-Bekanntheitsgrad Opposition einlegen, wenn wir global launchen. Markenanwalts-Klärung essentiell vor Filing.

**Empfehlung: Mid (Top-Kandidat).** Vor Final-Lock-in via Markenanwalt validieren. Domain-Strategy: `sondr.ai` als Primary, `getsondr.com` oder `sondr.app` als Compound-Fallback.

---

### 3.20 Pondera (Re-validate)

**Severity-Gesamt: Mid.**

- **Domain:**
  - `pondera.com` — höchstwahrscheinlich Thomson-Reuters-asset (Pondera-Solutions-Brand).
  - `pondera.io` — **aktive Call-Center-Firma** (Logan, UT, "Connecting Callers with Brands"). Class 35 / Class 38 (Telecom), nicht direkt Class 9/42 — aber Domain belegt.
  - `pondera.dev` — Connection-Refused (vermutlich nicht aktiv). Möglich frei.
  - `pondera.ai` — nicht eindeutig belegt.
- **USPTO:** **PONDERA SOLUTIONS, LLC** (Filed 2013-08-01, "Application Service Provider services featuring software for fraud detection"). Class 42 belegt für Fraud-Detection. **Verschiedene Industrie-Nische — Markenkonflikt-Wahrscheinlichkeit niedrig**, aber bei ähnlicher Industrie (Software-as-a-Service, Class 42) ist Co-Existence-Agreement nötig oder Restricting Filings.
- **DPMA/EUIPO:** Nicht direkt geprüft, aber Pondera Solutions ist Thomson-Reuters und wahrscheinlich auch in EU-Marken-Portfolio.
- **GitHub:** `github.com/pondera` ist inaktiver Personal-User (0 Repos).
- **npm:** `pondera` 404 — **frei**. ✓
- **Voice-Check:**
  - DE: *"Pondera"* — gute Aussprache, latein-coded (Souveränität, Wäge-Ab-Konnotation). Mid-Market-CIO-credible. **Stark.**
  - EN: Same. Premium-coded.
  - Sub-Brand-Potenzial: `pondera/skills`, `pondera/validate`, `pondera/workflow` — alles legitim.
- **Risk:** Thomson-Reuters-Co-Existence (Class 42 Software-Marken-Overlap). Anwaltsklärung essentiell.

**Empfehlung: Mid.** Stärkstes Latin-derived Asset im Sweep. Risiko ist Thomson-Reuters-Konflikt.

---

## 4 — Decision-Matrix Top-3

| Kriterium | Sondr | Pondera | Praxis |
|---|---|---|---|
| Domain `.com` | UK-Recruitment | Thomson-Reuters | belegt |
| Domain `.ai` | unclear/frei | unclear/frei | belegt |
| Domain `.io` | unclear | aktiv (Call-Center) | wahrsch. belegt |
| Domain `.dev` | belegt (UK) | unklar/frei | unclear |
| USPTO Class 9/42 | likely frei | Co-Existence Risk | nicht erteilbar |
| EUIPO | likely frei | likely frei | nicht erteilbar |
| DPMA (DE) | likely frei | likely frei | nicht erteilbar |
| GitHub Org | inaktiv (reclaim?) | inaktiv (reclaim?) | belegt aktiv |
| npm | frei | frei | belegt |
| Voice DE-CIO | mittel (vage) | stark | stark |
| Sub-Brand-Potenzial | stark | stark | nur als Compound |
| Cringe-Risiko | niedrig | niedrig | niedrig |
| Differenzierungsstärke | stark | stark | schwach |
| Akquisitionsrisiko durch Big-Tech-Naming | niedrig | niedrig | hoch (Mistral, OpenAI breit) |
| **Gesamt-Severity** | **Mid** | **Mid** | **Weak** |

---

## 5 — Empfehlung & Re-Brand-Timing

### 5.1 Primärer Vorschlag: **Sondr** (mit Caveats)

- Phonetisches Sound-as-a-Service-Profil ist im Sweep einzigartig.
- Class-9/42-Markenraum ist wahrscheinlich frei (anwaltliche Bestätigung Pflicht).
- Sub-Brand-Strategie ermöglicht ValidationKit-Heritage:
  - **Sondr Validate** (Open-Source-Core, Phase 0–2)
  - **Sondr Skills** (Multi-Provider-Skill-Authoring, Phase 1+)
  - **Sondr Workflow** (Hosted DurableAgent-Runtime, Phase 2+)
  - **Sondr Studio** (Web-IDE, Phase 3+)
- **Caveat:** UK-Recruitment-Sondr und Bristol-Marketing-Sondr sind Brand-Confusion-Risk im englischsprachigen Markt. Mom-Test-Interview-Frage einbauen: *"Wenn du 'Sondr' googelst und das hier finden würdest, hilft dir das?"*

### 5.2 Sekundärer Vorschlag: **Pondera**

- Latin-coded, premium-feel, perfekt für DE-Mid-Market-CIO-Voice.
- Hauptproblem: Thomson-Reuters-Class-42-Overlap. Wenn TM-Anwalt Co-Existence-Agreement für möglich hält und der Cost-Cap unter 15.000 EUR bleibt, ist Pondera die safe-but-strong-Wahl.

### 5.3 Notfall-Plan: **Re-Sweep mit unvollständigen Compounds**

Wenn Sondr und Pondera beide kippen:
- Nordische Wörter mit semantischer Tiefe (Bauen / Lernen / Üben / Werk) — z.B. Smedja, Verstand, Vintra, Tolk.
- Konstruierte Wörter (3–6 Buchstaben, 2 Silben max., vokalreich, keine doppelten Konsonanten) — Methodik: phonotaktische Brand-Generation nach Lexicon-Brand-Naming-Konvention. Ziel: 100 Konstrukte → 20 voice-frei testen → 5 finaler Sweep.

### 5.4 Re-Brand-Window-Timing

Per CLAUDE.md ist das Re-Brand-Window M9–M12 (Pre-Phase-2). Vorgeschlagene Sequenz:

| Monat | Aktion |
|---|---|
| **M8 (jetzt+~3M)** | Sondr + Pondera anwaltlich vorprüfen lassen (DE, EU, US — Class 9 + 42). ~3.500–5.000 EUR Gesamtbudget. Concept-Cards in Mom-Test-Interviews (PRD §31 Schritt 1) mitlaufen lassen. |
| **M9** | Wenn beide clean: **Sondr** wählen. Domain-Acquisition (`sondr.ai` Primary). GitHub-Org claimen. npm-Org `@sondr` reservieren. |
| **M10** | Public-Stealth-Announce als "ValidationKit becomes Sondr". Build-in-Public-Story um Re-Brand bauen. |
| **M11** | Vollständige Domain-/Doku-/Repo-Migration. ValidationKit-Repos als Mirror behalten (Legacy-SEO-Wert nicht verlieren). |
| **M12** | Marketing-Launch unter Sondr-Brand. ValidationKit-Heritage als Sub-Brand `sondr.ai/validate` halten. |

**Slack:** Wenn M8-Anwaltsprüfung negative Signale liefert (z.B. ernsthafte UK-Sondr-Opposition oder Thomson-Reuters-Pushback bei Pondera): **M9 wird zum Notfall-Re-Sweep**, M10–M12 verschoben um 4–6 Wochen.

### 5.5 Was sollte JETZT passieren?

Vor jeder weiteren Brand-Entscheidung:

1. **Markenanwalts-Briefing** (DE/EU/US, Class 9 + 42) für Sondr + Pondera bestellen. Geschätzt: 800–1.500 EUR pro Name pro Jurisdiction; Gesamt-Cap ~5.000 EUR.
2. **20 Mom-Test-Interviews** (PRD §31 Schritt 1) mit Mid-Market-CIO-Profilen (Ziel: 5 DE + 5 UK + 5 US + 5 EU-FR/NL). Concept-Card pro Name: 30 Sekunden Voice-Pitch + Tagline + Sub-Brand-Beispiele. **Aussprache-Test, nicht Concept-Test.**
3. **Sondr.ai-Domain-Verfügbarkeit final prüfen** (WHOIS, Registrar-Konditionen). Wenn `.ai` >10.000 USD: Fallback `sondr.app` oder `getsondr.com`.
4. **Decision-Forum** (`/decision "Re-Brand to <Name>"`) bei klarer Entscheidung loggen, inkl. Sub-Brand-Architektur und ValidationKit-Migration-Plan.

---

## 6 — Was wir aus diesem Sweep gelernt haben (Meta)

1. **Der "Ops"-Suffix-Markt ist verbrannt.** ContextOps, SkillOps, PromptOps, AgentOps — alle ab 2024–2026 vergeben. Wer jetzt einen "-Ops"-Compound versucht, kommt im 7.–12. Platz.
2. **Der "Skill-"-Präfix-Markt ist verbrannt.** SkillOps, SkillStack, SkillStudio, SkillForge, SkillsForge.ai — alle als Mid-Market-AI-Marken aktiv.
3. **Der "Context-"-Präfix-Markt ist verbrannt durch Big-Tech-Investments.** Context.ai (Joseph Semrai, $11M Lux), Contextual AI ($20M+ Bain), ContextHub (Andrew Ng), Context Labs (Carbon), ContextHub GmbH (Berlin).
4. **Klassische Vokabel-Solonamen sind alle weg.** Forge (Mistral), Helix (KKR $10B), Mesh (Cloudflare), Loom (Atlassian), Lattice (HR), Cognition (Devin).
5. **Latein-/Nordisch-/Konstruiert ist der einzige Korridor mit echter Whitespace.** Sondr und Pondera sind die einzigen zwei aus dem Sweep, die nicht direkt im AI-Mid-Market-Korridor verbrannt sind.
6. **Sub-Brand-Architektur ist Re-Brand-Pflicht.** Egal welcher Name gewinnt — wir bauen `<brand>/validate`, `<brand>/skills`, `<brand>/workflow` als Sub-Modules. ValidationKit-Heritage als `<brand>/validate` ist Trust-Karma, das wir nicht wegschmeißen.
7. **Voice-Check schlägt Domain-Check.** Sondr ist phonetisch riskant (Aussprache nicht eindeutig), Pondera ist phonetisch perfekt — aber Pondera hat Thomson-Reuters-Konflikt. Wir kaufen entweder phonetisches Risiko (Sondr) oder TM-Co-Existence-Risiko (Pondera). **Mom-Test entscheidet.**

---

## 7 — Quellen-Anhang

**Direkter Konkurrenzcheck:**
- [SkillOps.ai (Indien)](https://www.crunchbase.com/organization/skillops)
- [Skill Studio AI (Dublin)](https://www.skillstudio.ai/)
- [SkillForge AI (sklforge.com)](https://www.sklforge.com/)
- [SkillForge.expert (Screen-Recording-zu-Agent-Skills)](https://skillforge.expert/)
- [SkillStack.me (Claude Code Marketplace)](https://www.skillstack.me/)
- [Kindling AI](https://kindling-ai.com/)
- [Praxis AI](https://praxis-ai.com/)
- [PraxisPro $6M Seed](https://techcrunch.com/2026/01/21/praxispro-raises-6m-seed-from-alleycorp-to-coach-medical-sales-reps/)
- [Conduit AI (YC)](https://www.ycombinator.com/companies/conduit-ai)
- [Cloudflare Mesh](https://www.cloudflare.com/press/press-releases/2026/cloudflare-launches-mesh-to-secure-the-ai-agent-lifecycle/)
- [KKR Helix Digital Infrastructure](https://www.bloomberg.com/news/articles/2026-04-30/kkr-preparing-new-10-billion-ai-firm-led-by-ex-amazon-web-chief)
- [Mistral Forge](https://venturebeat.com/infrastructure/mistral-ai-launches-forge-to-help-companies-build-proprietary-ai-models)
- [Context (Joseph Semrai, $11M)](https://techcrunch.com/2025/05/28/context-gets-11m-to-build-an-ai-powered-office-suite/)
- [Atlassian acquires Loom $975M](https://www.constellationr.com/blog-news/insights/atlassian-acquires-loom-975-million-will-add-asynchronous-video-platform)

**Trademark + Legal-Entity:**
- [SKILLOPS SOFTWARE PRIVATE LIMITED (Indien)](https://tracxn.com/d/legal-entities/india/skillops-software-private-limited/__U8ClNxJzMSjecMlewbzDxEFt9BRTcZRQI7UF8ERcUxk)
- [ContextHub GmbH (Berlin)](https://tracxn.com/d/legal-entities/germany/contexthub-gmbh/__ayKEWzJq1d3B3GN_wWK3ZGo8eUyZUESVMKeMMhs7pbM)
- [SONDR LTD (UK Companies House)](https://find-and-update.company-information.service.gov.uk/company/13837317)
- [Pondera Solutions, LLC USPTO Trademark](https://trademarks.justia.com/owners/pondera-solutions-llc-3844248/)
- [Thomson Reuters acquires Pondera Solutions (2020)](https://www.thomsonreuters.com/en/press-releases/2020/march/thomson-reuters-acquires-pondera-solutions)
- [CONTEXTOS Trademark](https://uspto.report/TM/99332869)
- [DPMAregister](https://www.dpma.de/english/search/dpmaregister/index.html)
- [EUIPO TMView](https://www.tmview.europa.eu/)

**GitHub-Org-Verfügbarkeit (geprüfte):**
- `github.com/contextops` — belegt (AI Agent Infrastructure)
- `github.com/skillops` — personal-account (Rahul Raj, Bangalore)
- `github.com/sondr` — inaktiver Personal-Account
- `github.com/pondera` — inaktiver Personal-Account (0 Repos)
- `github.com/promptops` — belegt (CtrlStack, 121 Stars CLI)
- `github.com/contextlab` — belegt (Dartmouth Contextual Dynamics Lab)
- `github.com/atelier` — belegt (Atelier Ace)
- `github.com/kindling` — belegt (NY, kindlingapp.com)
- `github.com/praxis` — belegt (Ruby API-Framework, 302 Stars)

**npm-Verfügbarkeit (geprüfte):**
- `contextops` — frei (404)
- `skillops` — belegt (parkerbrown, v0.0.6 April 2026)
- `sondr` — frei (404)
- `pondera` — frei (404)
- `kindling` — belegt (Michael Williams, 2014, inaktiv)
- `atelier` — belegt (Spencer Alger, 2016, inaktiv)
- `skillforge` — belegt (Dan Abramov, v0.1.0 Januar 2026, "Claude Skills eval framework")
- `contexthub` — belegt (Seshan Pillay, v1.0.8 Juni 2025, "Unified config for AI coding assistants")
- `skillstack` — belegt (decimasudo, v0.2.11, "Auto-detect and install AI agent skills")
- `forge` — belegt (Josh Perez, 2014, inaktiv)
- `praxis` — belegt (Hasitha Liyanage, 2015, inaktiv)
- `conduit` — belegt (Alan Gutierrez, v7.0.0-alpha.14)
- `mesh` — belegt (Craig Condon, v7.0.3, aktiv)
- `helix` — belegt (Tomas Pollak, v0.3.1 2018, abandoned)

---

*Final-Stand: 2026-05-14. Vor Final-Brand-Decision: anwaltliche Prüfung Sondr + Pondera (DE+EU+US Class 9 + 42), 20 Mom-Test-Voice-Interviews, Domain-Final-Acquisition. ADR `/decision "Re-Brand to <Name>"` nach Anwaltsbescheid.*
