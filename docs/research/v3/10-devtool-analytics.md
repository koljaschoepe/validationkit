# 10 — Dev-Tool Analytics für Privacy-sensitive lokale CLI-Frameworks

> **Datum:** 2026-05-14
> **Owner:** Kolja Schöpe (kol.schoepe@gmail.com)
> **Kontext:** ValidationKit. CLI-Layer läuft in Claude Code, Cursor, Codex CLI, Gemini CLI — lokal auf User-Hardware. Hosted-Web-App auf Vercel (EU). Solo-Founder, DE, MM-Buyer-Pool.
> **Frage:** Wie messen wir Usage (Adoption, Retention, Funnel, Friction-Points) ohne Anthropic/Cursor-Telemetry und ohne DSGVO-Verstöße?

---

## TL;DR (Bottom-Line-Up-Front)

**Drei Pattern, die für MM-Buyer DSGVO-konform UND solo-buildable sind:**

1. **Pattern E — Claude Code Hooks-System + HTTP-Beacon (Top-Pick).** Native, multi-event, kann auf SessionStart konsentieren, sendet pseudonymisierte Events an EU-PostHog/Plausible. Engineering-Effort: ~3 Tage. Multi-Provider-Fähig via SKILL.md-Wrapper. DSGVO-konform mit Opt-In-on-First-Run.
2. **Pattern F — AI-Gateway-Proxy (Strong Second).** Vercel AI Gateway zwischen User-CLI und Anthropic/OpenAI. Du siehst Tokens, Latenz, Modell-Wahl, Fehlerrate pro pseudonymem User-Key — ohne dass der Code je dein System verlässt. Voraussetzung: User muss freiwillig deinen Gateway-Key verwenden (Tier-Mechanik / Hosted-App-Bind).
3. **Pattern A (lite) — Opt-In-SDK auf `validationkit init`.** Single-Toggle bei Erstinstallation. Sendet anonyme Aggregat-Events. Verhindert Vendor-Lock-in (funktioniert auch wenn User nicht in Claude Code ist).

**Anti-Empfehlung:** Git-Log-Parsing, GitHub-API-Polling und Cursor-eigene Telemetry — alle drei sind entweder rechtlich grenzwertig (Pattern C, D) oder kontroll-unzuverlässig (kein Cursor-Telemetry-API verfügbar).

**DSGVO-Killer-Erkenntnis (load-bearing):** Die deutsche Datenschutz-Praxis ([activeMind.legal](https://www.activemind.legal/guides/telemetry-data/), 2024+): *„Accordingly, you should not rely on your legitimate interest(s) as a legal basis [für Telemetry]"* — Consent **muss** vor erster Datenerhebung eingeholt werden, **darf nicht vor-angekreuzt sein**. Das tötet das ganze „Opt-Out wie Next.js"-Modell für DE-MM-Buyer.

---

## 1 — Problem-Statement

ValidationKit ist eine **cross-vendor CLI-Layer** (Claude Code / Cursor / Codex / Gemini CLI) + Hosted-Web-App. Die CLI läuft auf der Hardware des Users. Wir bekommen **kein** Telemetry-Signal von Anthropic über unsere User. Cursor hat Telemetry, aber sie ist nicht-zugänglich für Third-Party-Frameworks ([Cursor Privacy](https://cursor.com/privacy)). Wir brauchen aber Antworten auf:

| Frage | Warum sie geschäftskritisch ist |
|---|---|
| Wie viele Leute installieren `validationkit` per Woche? | Top-of-Funnel-Health. |
| Wie viele führen Schritt 1 → 2 → 3 aus? | Drop-off-Detection, UX-Iteration. |
| Welcher Skill wird wie oft gestartet, in welchem CLI-Host? | Multi-Provider-ROI (lohnt sich Cursor-Support?). |
| Wie viele Sessions enden im „Kill"-Verdict — wie viele im „Build"-Pack? | Validity-Calibration. Kein Severity-Band-Drift. |
| Wie viele User upgraden vom OSS-Core in den Hosted-Plan? | Conversion. |
| Wie viele Tokens verbrennt eine Average-Session? | Pricing-Sanity, AI-Gateway-Routing-Optimum. |

Ohne diese Daten ist der ganze „Build-in-Public + iterieren"-Approach (PRD §31) blind. Mit den falschen Mitteln (z.B. Auto-Telemetry ohne Consent in einem DE-MM-B2B-Kontext) zerstören wir die Founder-Reputation, die wir als „älterer Founder, der nicht lügt" aufbauen wollen.

---

## 2 — Recherche-Methodik & Quellenlage

Quellen-Tiers:
- **Tier 1 (Docs):** Anthropic Claude Code (Hooks, Monitoring), Vercel AI Gateway, GitHub, Next.js, Astro, Sentry, PostHog, Plausible, Fathom — Stand 2026-05.
- **Tier 2 (Legal-Praxis):** activeMind.legal Telemetry-Guide, gdpr-info.eu, German Compliance Institute.
- **Tier 3 (Engineering-Erfahrung):** GitHub-Issues, Engineering-Blogs, ColeMurray/claude-code-otel (OSS-Referenz).

Gap: Es gibt **keine publizierten Opt-In-Conversion-Rates** für CLI-Telemetry. Weder Homebrew, noch Stack Overflow, noch Next.js veröffentlichen Opt-Out-%. Wir arbeiten mit „direktionalem Wissen": Wenn ein Tool Opt-Out-Default fährt (Next.js, Vercel CLI, GitHub CLI seit April 2026), kann man unterstellen, dass ≥90% der Daten anfallen. Wenn ein Tool Opt-In-Default fährt (Astro nicht, aber die meisten europäisch-domizilierten Tools), liegt das Daten-Sample irgendwo bei 20–40% — das ist Augenmaß, keine Statistik.

---

## 3 — Die 6 Pattern im Detail

### 3.1 Pattern A — Opt-In-Telemetry-SDK (lokal-installiert)

**Wie es funktioniert:** `validationkit init` zeigt einen Consent-Prompt. Bei Zustimmung wird in `~/.validationkit/config.json` ein Pseudonym (UUIDv4, gesalted) gespeichert. Jeder CLI-Befehl pingt ein `events.validationkit.dev/v1/track` Endpoint mit `{event_name, anonymous_id, host_cli, version, duration_ms}`.

**Wer macht das so?**
- **Next.js** (Opt-Out): `next.config.json` → `telemetry: false` oder `NEXT_TELEMETRY_DISABLED=1`. Sammelt Command, Version, OS, Plugins, Build-Duration. Kein File-Pfad, kein Code-Content. ([Next.js Telemetry](https://nextjs.org/telemetry))
- **Astro** (Opt-Out): `astro telemetry disable` oder `ASTRO_TELEMETRY_DISABLED=1`. ([Astro](https://astro.build/telemetry/))
- **Vercel CLI** (Opt-Out): `vercel telemetry disable` oder `VERCEL_TELEMETRY_DISABLED=1`. ([Vercel CLI Telemetry](https://vercel.com/docs/cli/about-telemetry))
- **GitHub CLI** (Opt-Out seit April 2026, v2.91.0): `GH_TELEMETRY=false`, `DO_NOT_TRACK=true`, oder `gh config set telemetry disabled`. Pseudonymous. ([GitHub Changelog](https://github.blog/changelog/2026-04-22-github-cli-opt-out-usage-telemetry/))
- **Homebrew** (Opt-In via Notice): Zeigt Notice beim ersten Befehl. Analytics werden erst nach Notice aktiviert. ([Homebrew Analytics](https://docs.brew.sh/Analytics))

**Engineering-Effort (solo):** 2–4 Tage. Stack: Node-Module (`@validationkit/telemetry`), Endpoint auf Vercel-Function, PostHog-EU-Cloud als Backend (1M Events/Monat frei). ([PostHog Self-Host](https://posthog.com/docs/self-host))

**Privacy-Risk (DE/EU):**
- **Opt-Out-Default:** Rechtlich grenzwertig in DE. activeMind.legal sagt explizit: *„Accordingly, you should not rely on your legitimate interest(s) as a legal basis."* Heißt: B2B-Mid-Market-Compliance-Teams werden das in einem Security-Review als „No-Go" markieren.
- **Opt-In-Default mit erstem Prompt:** DSGVO-konform, aber Daten-Verlust 50–80% (Augenmaß).
- **Pseudonymisiert, kein Personenbezug, EU-Hosting:** Hebt das Risiko deutlich, aber Pseudonymisierung ≠ Anonymisierung im DSGVO-Sinne. Solange ein Re-Identifikations-Pfad theoretisch existiert (Salt-Reversal, IP-Re-Linkung), bleibt es personenbezogen.

**Verdict:** Solides Baseline-Pattern. ABER nur als **Opt-In-Default mit klarem Notice**, sonst killt es das MM-B2B-Trust-Argument. Verlust-Sample akzeptieren.

---

### 3.2 Pattern B — Skill-Wrapped Beacons

**Wie es funktioniert:** Jeder ValidationKit-Skill (SKILL.md) wrapped seinen Body in einen Wrapper-Call:
```bash
# implizit in jedem SKILL.md
validationkit-beacon start --skill=interview-synth
# … skill body …
validationkit-beacon end --skill=interview-synth --outcome=$LAST_EXIT
```

Das funktioniert über alle Provider (Claude Code, Cursor, Codex, Gemini) weil Skills universell sind — was uns von Pattern E unterscheidet, das nur in Claude Code läuft.

**Wer macht das so?** Niemand publik. Es ist ein **proprietary Pattern** — was Vorteil und Nachteil zugleich ist.

**Engineering-Effort (solo):** 1–2 Tage initial + Disziplin, in jedem SKILL.md-Template den Wrapper zu erzwingen. Verlinkt mit Pattern A (selber Backend).

**Privacy-Risk:** Identisch zu Pattern A. Vorsicht: Der Skill-Body kennt User-Inputs (z.B. „Meine Idee ist X"). Wenn der Wrapper das ausversehen mit-loggt, sammeln wir IP-mäßig Geschäftsgeheimnisse. **Strikte Whitelist** der Felder ist Pflicht (`skill_name`, `host_cli`, `exit_code`, `duration_ms` — sonst nichts).

**Verdict:** Stärkstes Pattern für **Cross-Provider-Sichtbarkeit**. Pflicht-Add-On zu Pattern A, nicht Replacement.

---

### 3.3 Pattern C — Git-Log-Parsing (`.claude/`-Folder-History)

**Idee:** Wenn User ValidationKit + Claude Code parallel benutzen, generieren beide Files in `.claude/` (Settings, Skills, Memory). Wir könnten via separater CLI „`validationkit insights`" lokale Git-Logs parsen und Insights zurückspielen.

**Problem 1 — Datenfluss:** Wenn die Daten nur lokal beim User bleiben, ist es nicht „Analytics" für uns. Wenn wir sie zu uns ziehen wollen, ist es Pattern A im Trenchcoat.

**Problem 2 — Privacy:** Git-Logs enthalten Commit-Messages, Autoren-Emails, evtl. Branch-Namen mit Kunden-Codes. Datenklasse: **eindeutig personenbezogen.** Selbst pseudonymisiert ist das ein Privacy-Anti-Pattern.

**Problem 3 — Realismus:** Nicht jeder User commitet `.claude/`. Manche `.gitignore`-en es. Daten-Sample ist verzerrt zugunsten von „diszipliniert-versionierenden" Usern — nicht unser Mainstream-Solopreneur.

**Engineering-Effort:** 1–2 Wochen für robuste Parser inkl. Privacy-Scrubbing. Hoher Wartungs-Overhead.

**Verdict:** **Anti-Pattern.** Streichen.

---

### 3.4 Pattern D — GitHub-API-Driven (File-Changes, Commit-Messages)

**Idee:** Wir hosten eine GitHub-App, die User über OAuth einbinden. Sie liest Repos, sucht nach `.claude/skills/validationkit-*.md` und tracked Adoption über öffentliche GitHub-Events.

**Wer macht das so?** Diverse OSS-Health-Dashboards (Repograph, Sourcegraph-OSS-Insights). Für CLI-Tool-Adoption-Tracking ist es **kein** Standard-Pattern.

**Problem 1 — Coverage:** Nur User mit GitHub + die ihre `.claude/`-Folder committen + die uns OAuth geben. Vermutlich <10% des realen Markts.

**Problem 2 — DSGVO:** GitHub-API-Daten enthalten Klar-Namen, Commit-Messages, Repos. Personenbezug ist eindeutig. Brauchen Auftragsverarbeitungsvertrag + DPA + Opt-In.

**Problem 3 — Engineering:** GitHub-App-Setup, OAuth-Flow, Rate-Limits, Webhook-Infrastruktur. Solo-Founder: ≥2 Wochen, mit Wartung dauerhaft.

**Verdict:** **Nicht jetzt.** Eventuell als Phase-3-Feature („connect your repo to see your validation→build-correlation") — nicht als Telemetry-Layer.

---

### 3.5 Pattern E — Claude Code Hooks-System (Top-Pick für CC-User)

**Wie es funktioniert:** Claude Code seit 2.1.0 (2026) hat ein **mächtiges Hooks-System** mit 25+ Lifecycle-Events. ValidationKit liefert eine `.claude/settings.json`-Snippet, der bei `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `SubagentStart`, `Stop` ein lokales Hook-Script triggert. Das Script kann **HTTP-POST machen** (seit Feb 2026 nativ als HTTP-Hook) oder lokal queue-en und batch-flushen.

**Was die Hooks liefern (Auszug aus [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)):**

| Event | Cadence | Was wir bekommen |
|---|---|---|
| `SessionStart` | once/session | model, source (startup/resume/clear/compact) |
| `UserPromptSubmit` | per turn | prompt-text (WARNUNG: PII) |
| `PreToolUse` | per tool call | tool_name, tool_input |
| `PostToolUse` | per tool call | tool_name, exit, duration |
| `SubagentStart`/`Stop` | per subagent | agent_type, agent_id |
| `InstructionsLoaded` | on CLAUDE.md load | file_path, memory_type |
| `Stop` | end of turn | — |
| `SessionEnd` | end of session | — |

**Direkter Auszug aus den Docs:**
> *"HTTP hooks make POST requests; command hooks can use curl/wget. Hooks can: write logs, read files, modify tool input, add context, block actions, run background tasks."*

**Wer macht das so?** [ColeMurray/claude-code-otel](https://github.com/ColeMurray/claude-code-otel) und [Marco Lancini's Setup](https://blog.marcolancini.it/2026/blog-my-claude-code-setup/) — beide nutzen Hooks für OTEL-Export. Anthropic selbst publishe das Pattern in der Doku.

**Engineering-Effort (solo):** 2–3 Tage. Ein `.claude/hooks/track.sh`-Script (60 Zeilen Bash), `.claude/settings.json` mit Hook-Konfig, HTTP-Endpoint auf Vercel-Function. Beim `validationkit init`-Befehl in ein User-Projekt installieren.

**Privacy-Risk:**
- Hooks laufen **lokal in der User-Shell**, mit Zugriff auf alles. Wenn wir es richtig konfigurieren: **Wir lesen nur Metadata, nie Content.**
- `UserPromptSubmit.prompt` ist **die heißeste PII-Quelle** — niemals roh transferieren. Nur Länge, Detection-Flags (hat URL? hat Email? hat Stripe-Key-Pattern?), evtl. Hash für Dedup.
- `additionalContext` (Hook→Claude-Injection) ist **unidirektional**, wir können kein User-Input nachträglich ziehen.
- Hooks werden in `settings.json` definiert, **User sieht im Code** was wir tun — Transparenz ist eingebaut.
- DSGVO: Erste Hook-Ausführung muss konsentiert sein. Lösung: Beim `validationkit init` ein klarer Consent-Prompt, Hook wird erst aktiviert nach Zustimmung; Default ist OFF.

**Multi-Provider-Limit:** Hooks sind **Claude-Code-spezifisch.** Cursor/Codex/Gemini haben keine vergleichbare Lifecycle-API. Heißt: Pattern E sammelt nur CC-User-Daten — für Cursor brauchen wir Pattern B (Skill-Wrapper).

**Verdict:** **Top-Pick für die ≥60% User-Pool die Claude Code als Host nehmen.** Kombiniert mit Pattern B für die Restpopulation.

---

### 3.6 Pattern F — AI-Gateway-Proxy (Token-Usage)

**Wie es funktioniert:** Vercel AI Gateway sitzt zwischen User-CLI und Anthropic/OpenAI/Google. Per [App Attribution](https://vercel.com/docs/ai-gateway/ecosystem/app-attribution) markiert jeder Request den absendenden Workflow. Im AI-Gateway-Dashboard sehen wir:
- Tokens-In/Out pro Modell, pro Tag, pro pseudonymer User-ID
- Latenz, Fehlerrate, Provider-Failover-Häufigkeit
- Cost pro Session

**Bedingung:** User muss freiwillig deinen Gateway-Key benutzen. Das funktioniert in **zwei Modi**:
1. **Hosted-App-Modus:** User loggt sich in `app.validationkit.dev` ein → wir geben ihm einen Scoped-Gateway-Key → seine CLI nutzt diesen. Du siehst alles. Verbreitung: 30–40% (vermutlich), die den Cloud-Plan testen.
2. **BYO-Key:** User behält seinen eigenen Anthropic/OpenAI-Key direkt → du siehst nix.

**Wer macht das so?** Praktisch jedes hosted AI-Tool. LiteLLM, OpenRouter, Helicone — Standard-Pattern. Spezifisch für CLI: [Vercel Changelog April 2026 - Claude Code on AI Gateway](https://vercel.com/changelog/ai-gateway-support-for-claude-code) zeigt: Anthropic-Subscription kann durch AI Gateway gerouted werden, Vercel-Dashboard zeigt Traffic.

**Engineering-Effort (solo):** 1–2 Tage. Vercel-Account, AI-Gateway-Setup, Key-Issuing-Flow in Hosted-App (Clerk-User → Gateway-Key-Mint), Doku-Update in CLI.

**Privacy-Risk:**
- **Tokens-Counts und Modell-Wahl sind harmlos** — keine PII.
- **Aber:** AI Gateway sieht den Prompt-Body. Wenn wir Spans/Traces aktivieren, könnte das in Vercel-Logs landen. Vercel ist EU-Hosting-fähig (Frankfurt) und SOC2/GDPR-konform. DPA verfügbar. Trotzdem: Disclose es im Privacy-Statement.
- User können `disallowPromptTraining` setzen ([Vercel Docs](https://vercel.com/docs/ai-gateway/capabilities/disallow-prompt-training)) — vorab konfigurieren wir das default-ON für ValidationKit-Traffic.

**Verdict:** **Strong Second.** Quasi gratis-bekommen, wenn der Hosted-Plan ohnehin auf Vercel AI Gateway läuft. Decken **Cost-Tracking + Provider-Health + Modell-Mix** ab — Pattern E/B decken **Behavioral-Funnel** ab. Komplementär, nicht Substitut.

---

## 4 — Compare-Patterns aus der Industrie

### 4.1 Sentry — Crash-Telemetry-Privacy-Trade-Off

Sentry sammelt Stack-Traces, Breadcrumbs, evtl. User-Context. Ist seit 2024 [EU-Data-Region](https://sentry.io/about/press-releases/sentry-announces-eu-data-region-significant-upgrades-to-its-performance-monitoring-platform-and-expansion-of-ecosystem-support/) verfügbar, GDPR-DPA-fähig. Aber:
> *"Sentry SDKs require opt-in consent via website or app consent banners to comply with EU regulations"* ([Sentry GDPR Best Practices](https://sentry.io/trust/privacy/gdpr-best-practices/))

Sentry für ValidationKit-CLI = **Crash-only**, nicht Behavioral. Sentry hat einen Node-SDK und kann via Hook (Pattern E) befeuert werden. Für Phase 1: **Skip**, Crashs sind nicht unser Engpass. Phase 2: **Add für Hosted-Web-App**, nicht für CLI.

### 4.2 Datadog APM

Hosted-only, B2C-prohibitiv teuer für Solo-Founder ($31/host/Monat × N-Server). Macht Sinn ab Serie-A. Heute: **Skip**.

### 4.3 PostHog Self-Hosted

[PostHog](https://posthog.com/) (MIT-Lizenz) ist der Dev-Tool-First-Player. EU-Cloud verfügbar, GDPR-konform out-of-the-box, 1M Events/Monat frei. Self-Host ab 4 vCPU/16 GB RAM via Docker. **Empfohlener Backend für Pattern A/B/E.** PostHog-EU-Cloud ist die Solo-Founder-Wahl: Free-Tier reicht für Phase 1–2, kein DevOps-Overhead.

### 4.4 Mixpanel für Desktop

Mehr B2C-Konsumenten-Funnel. Für Dev-Tool-CLI-Tracking historisch weniger nativ als PostHog/Plausible. **Skip**.

### 4.5 VSCode Marketplace Analytics

[`@vscode/extension-telemetry`](https://www.npmjs.com/package/@vscode/extension-telemetry) ist Microsofts Standard. Respektiert `telemetry.telemetryLevel`-Setting des Users. Per Default opt-in (wenn User Telemetry on hat), nutzt Application Insights. Marketplace zeigt aggregate Install-Counts. **Nicht relevant für unseren CLI-Stack**, aber das Pattern (zentrale Telemetry-Lib, die User-Settings respektiert) ist ein Vorbild.

### 4.6 JetBrains Plugin Analytics

JetBrains-Marketplace zeigt Aggregat-Counts, aber keine Per-Plugin-Detailed-Analytics. Plugin-Entwickler müssen eigene Tracking-Lib einbauen. **Lerneffekt:** Plattform-Daten reichen nie — Plugin-eigene Telemetry ist immer nötig.

### 4.7 Cursor Public-Telemetry-Statement

Cursor sammelt mit Privacy-Mode-Off: Prompts, Code-Snippets, Editor-Actions ([Cursor Privacy](https://cursor.com/privacy)). Business-Plan: Privacy-Mode forciert ON. **Cursor publisht Telemetry NICHT** an Third-Parties. Wenn unser CLI in Cursor läuft, sehen wir **nichts via Cursor**. Bedeutet: Pattern B (Skill-Wrapper) ist die einzige Option für Cursor-User.

### 4.8 Anthropic Claude Code Telemetry

[Claude Code Monitoring](https://code.claude.com/docs/en/monitoring-usage) ist **opt-in via Env-Var** `CLAUDE_CODE_ENABLE_TELEMETRY=1` + OTEL-Exporter-Config. **An den User exportiert**, nicht an Anthropic-as-Third-Party (Anthropic loggt nichts Code-mäßig). Heißt: User kann zu seinem OTEL-Backend pushen. ValidationKit kann **nicht** als Third-Party reinhören — der OTEL-Stream geht direkt an den vom User konfigurierten Collector. Aber: Wir können **dokumentieren**, wie User es selbst aktivieren — als „Power-User-Feature" in Enterprise-Verkaufsgesprächen.

### 4.9 Honeycomb für AI-Workloads

Honeycomb ist OTEL-native, fokussiert auf High-Cardinality-Traces. Macht Sinn für hosted Workflows in Phase 2+. Für CLI-Frontend zu schwer. **Skip Phase 1.**

---

## 5 — DSGVO / Privacy-Layer

### 5.1 B2B-Mid-Market-Tolerance

Mid-Market (50–500 MA, DACH) hat in 2026 typischerweise:
- DSB im Haus oder externer DPO-Service
- Security-Review-Prozess bei Tooling-Beschaffung mit ≥5 Fragen zu Datenfluss, Auftragsverarbeitung, EU-Hosting
- Toleranz für **Opt-In-Telemetry mit transparenter Dokumentation** und EU-Hosting/DPA — niedrig für **Opt-Out**, sehr niedrig für **versteckte Telemetry**

Der MM-Pool ist nicht „Privacy-Maximalist" — sie tolerieren PostHog-EU, Vercel, Sentry-EU. Sie wollen ein **Privacy-Statement, das sie an ihren DSB weiterleiten können**, und sie wollen einen DPA-Link unter `validationkit.dev/legal`.

### 5.2 Anonymisierung vs Pseudonymisierung

**Anonymisierung** (DSGVO ErwG 26): Daten so verarbeitet, dass **kein** Re-Identification-Pfad existiert. Fällt aus DSGVO-Scope. **Sehr schwer zu erreichen** mit Event-Streams (Salt+Hash+IP-Drop allein reicht oft nicht, weil Fingerprinting-Re-Identification möglich bleibt).

**Pseudonymisierung** (DSGVO Art. 4 Nr. 5): Daten lassen sich ohne zusätzliche Info nicht direkt einem Subject zuordnen, aber das Mapping existiert irgendwo. **Bleibt personenbezogen**, DSGVO gilt — aber reduziert Risiko.

**Praktisch für ValidationKit:**
- Generiere `anonymous_id = hash(salt, machine_uuid)` einmalig in `~/.validationkit/config.json`. Salt rotiert quartalsweise. Backend speichert **kein** Machine-UUID, nur den Hash.
- Lösche IPs server-side **vor** PostHog-Insert (Vercel-Function-Middleware).
- Strip alle `prompt`-Bodies via Hook-Whitelist.
- **Status:** Pseudonymisiert, nicht anonymisiert. DSGVO-Pflichten bleiben.

### 5.3 Opt-In vs Opt-Out: Legal in DE/EU für B2B-Dev-Tools

Die **load-bearing Quelle** ist [activeMind.legal Telemetry-Guide](https://www.activemind.legal/guides/telemetry-data/):

> *"Accordingly, you should not rely on your legitimate interest(s) as a legal basis."*
> *"Consent...should be obtained before the software is installed for the first time or before the software is started for the first time, but in any case before telemetry data is collected for the first time."*
> *"Opt-in is mandatory—the option must not be already selected by default."*

Das heißt für ValidationKit, betrieben aus Deutschland:
- **Opt-Out-Default ist riskant** (auch wenn Next.js/Vercel/GitHub-CLI es so machen — die operieren aus US, mit großer Legal-Abteilung, die Risiko absorbieren kann).
- **Opt-In-Default + transparenter Notice ist der sichere Pfad.**
- **B2B-Distinktion:** GDPR gilt auch in B2B, weil der CLI-User eine natürliche Person ist. „Business-only"-Argument trägt nicht.

### 5.4 DSGVO-Checkliste für unser Setup

- [ ] **Opt-In-Default** mit klarem `validationkit init`-Consent-Prompt (Single-Toggle, nicht vor-angekreuzt).
- [ ] **Privacy-Statement** auf `validationkit.dev/privacy` mit **Liste aller gesammelten Felder**, Backend-Provider (PostHog-EU, Vercel EU), Aufbewahrungsfrist (12 Monate roh, dann aggregiert).
- [ ] **DPA-Template** (Auftragsverarbeitungs-Vertrag) als PDF-Download für MM-Buyer.
- [ ] **DSB-Kontakt** (kann initial Owner sein) auf Privacy-Seite.
- [ ] **Recht auf Löschung:** Endpoint `DELETE /v1/me?anonymous_id=...` der den Hash in PostHog rauslöscht. Per CLI-Befehl `validationkit telemetry forget` auslösbar.
- [ ] **EU-Hosting:** PostHog-EU-Cloud (Frankfurt) + Vercel-EU-Region.
- [ ] **Salt-Rotation:** Quartalsweise, alte Hashes werden unbrauchbar.
- [ ] **Whitelist-Felder** als Code-Konstante in `@validationkit/telemetry`. Code-Review-Gate für jede Field-Erweiterung.
- [ ] **Audit-Log:** Jede Schema-Änderung wird in `decisions/` als ADR dokumentiert.

---

## 6 — Master-Tabelle: Pattern × Effort × Realismus × Privacy-Risk

| # | Pattern | Engineering-Effort (Solo) | Coverage (welcher Markt-Anteil?) | Privacy-Risk DE/EU MM | Datenqualität | Verdict |
|---|---|---|---|---|---|---|
| A | **Opt-In-SDK** | 2–4 Tage | ~30–50% (Opt-In-Rate Schätzung) | Niedrig (mit Opt-In + EU-Backend) | Mittel — Sample-Bias, aber Behavioral-Reichhaltig | **JA — Foundation** |
| B | **Skill-Wrapped Beacons** | 1–2 Tage zusätzlich | 100% der ValidationKit-Skills, alle Provider | Niedrig (Whitelist) | Hoch — Cross-Provider sichtbar | **JA — Komplement zu A** |
| C | Git-Log-Parsing | 1–2 Wochen | <20%, Bias zu „diszipliniert" | **Hoch** (Commit-Msgs personenbezogen) | Niedrig — verzerrt | **NEIN** |
| D | GitHub-API-Driven | ≥2 Wochen | <10%, OAuth-Hurdle | **Hoch** (PII + Auftragsverarbeitung) | Mittel | **NEIN (Phase 1)** |
| E | **Claude Code Hooks** | 2–3 Tage | ≥60% (Claude-Code-User-Anteil) | Niedrig (lokal, Whitelist) | **Sehr hoch** — Per-Event-Tracking | **JA — Top-Pick CC-Cohort** |
| F | **AI-Gateway-Proxy** | 1–2 Tage | ~30–40% (Hosted-Plan-User) | Niedrig (Vercel EU, DPA) | Hoch — Cost+Tokens+Latenz | **JA — Hosted-Pflicht** |

**Compare-Industry-Tools (Best-Of-Breed-Backend-Wahl):**

| Tool | Self-Host-möglich? | EU-Region | Solo-Budget? | Use-Case |
|---|---|---|---|---|
| **PostHog EU Cloud** | Ja | Frankfurt | Free 1M Events/Mo | Behavioral-Funnel — Empfehlung Backend für A/B/E |
| Plausible | Ja | DE (Falkenstein) | $9/Mo | Web-Analytics für `validationkit.dev` |
| Sentry EU | Ja | Frankfurt | $26/Mo dev | Crash-Tracking Hosted-App (Phase 2) |
| Datadog | Ja | EU-Region | $31/host/Mo | Skip Phase 1 |
| Vercel AI Gateway | Nein | EU-Region | $0 + nutzungs | Pattern F |
| Honeycomb | Ja | US default | Solo: zu schwer | Phase 3+ |
| Fathom | Nein | EU-Edge | $14/Mo | Plausible-Alternative |

---

## 7 — Empfehlung für ValidationKit

### 7.1 Phase 1 (0–100 Users): „Probe-Stack" (Mai 2026 → August 2026)

**Tooling:**
- **Backend:** PostHog EU Cloud (free tier).
- **CLI-Layer:** Pattern A (Opt-In-SDK) + Pattern B (Skill-Wrapper) — gemeinsamer `@validationkit/telemetry`-Module.
- **Hosted-Layer:** Pattern F via Vercel AI Gateway, automatisch durch Stack.
- **Crash-Tracking:** Sentry **nicht** in Phase 1 — User-Reports via GitHub-Issues sind aussagekräftiger bei kleinen N.

**Consent-Flow:**
```
$ validationkit init
ValidationKit collects anonymous usage data (skill name, host CLI, duration, exit code).
No prompt content or code is sent. Data is processed by PostHog (EU/Frankfurt).
See https://validationkit.dev/privacy.

[Y] Send anonymous usage data    [n] Don't send (default)
> 
```
Default ist `[n]`. Single-Tap-`Y`.

**Was wir messen:**
- Install-Count (`validationkit init`-Aufrufe)
- Skill-Launch-Count pro `skill_name × host_cli`
- Skill-Outcome (`outcome ∈ {complete, abort, error}`)
- Session-Dauer
- AI-Gateway: Tokens, Cost, Modell-Mix
- Hosted-Web-App-Sign-Ups (Clerk-Events)

**Was wir NICHT messen:**
- Inhalte (Prompts, Outputs, Idea-Text)
- Datei-Pfade, File-Inhalte
- Stripe-Customer-Data verknüpft mit anonymous_id (separate Pseudonym-Räume)

### 7.2 Phase 2 (100–1.000 Users)

**Add:**
- **Pattern E (Claude Code Hooks)** für Power-User-Cohort. Optional via `validationkit telemetry enable-hooks`.
- **Sentry EU** für Hosted-Web-App.
- **PostHog Self-Host Migration**, wenn >1M Events/Monat erreicht (vermutlich M9–M12).

### 7.3 Phase 3 (1k+ Users)

**Add:**
- **Honeycomb** für Workflow-Traces in DurableAgent.
- **OTEL-First** für alle Backend-Services.
- **Optional: GitHub-App** (Pattern D) als „Connect your repo for build-correlation" — *opt-in only*, separater Datenraum.

---

## 8 — Decision-Matrix & Quick-Wins

**Diese Woche (M1 Sprint):**
1. PostHog-EU-Cloud-Account anlegen (15 Min).
2. Vercel-Function `events.validationkit.dev/v1/track` boilerplate (30 Min).
3. `@validationkit/telemetry`-Modul Skeleton mit Whitelist-Schema (2 Std).
4. Privacy-Statement-Draft auf `validationkit.dev/privacy` (1 Std).

**Vor Open-Source-Release (M2):**
5. Opt-In-Consent-Flow in `validationkit init` (1 Tag).
6. Hook-basierter Beacon-Wrapper als `.claude/settings.json`-Template (1 Tag).
7. DPA-PDF-Template (juristisch reviewt, ~150€ Anwaltsstunde) (extern).
8. „How we track" Public-Doku-Seite auf `validationkit.dev/docs/telemetry` — Build-in-Public-Vertrauen.

**Quick-Win (vor Launch):**
9. `validationkit telemetry status` Befehl — User sieht in 1 Sekunde was an/aus ist.
10. `validationkit telemetry forget` Befehl — DSGVO Art. 17 Recht-auf-Löschung in 1 CLI-Aufruf.

**Anti-Quick-Win (NICHT machen):**
- Auto-Telemetry per Default — kostet uns DE-MM-Trust.
- Prompt-Body-Logging „nur kurz für Debugging" — wird zur Daten-Bombe.
- Cursor-spezifische Telemetry-Integration — gibt es nicht, Energie verschwendet.

---

## 9 — Anhang

### 9.1 Reference-Snippet: `.claude/hooks/track.sh`

```bash
#!/usr/bin/env bash
# ValidationKit Telemetry Hook (Pattern E)
# Activated only after explicit user opt-in via `validationkit init`.

set -euo pipefail

# Bail if not opted-in
CONSENT_FILE="$HOME/.validationkit/consent"
[[ -f "$CONSENT_FILE" ]] || exit 0

# Parse JSON from stdin (Claude Code hook input)
EVENT=$(jq -r '.hook_event_name')
SESSION=$(jq -r '.session_id')

# Anonymous ID (rotated salt)
ANON_ID=$(cat "$HOME/.validationkit/anon_id")

# Whitelist-only payload
PAYLOAD=$(jq -nc \
  --arg e "$EVENT" \
  --arg s "$SESSION" \
  --arg a "$ANON_ID" \
  --arg v "$(validationkit --version)" \
  '{event: $e, session_hash: ($s | @base64), anon_id: $a, vk_version: $v}')

# Fire-and-forget POST (5s timeout)
curl -sS -m 5 -X POST "https://events.validationkit.dev/v1/track" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" >/dev/null 2>&1 &

exit 0
```

### 9.2 Reference-Snippet: `.claude/settings.json` (Hook-Config)

```json
{
  "hooks": {
    "SessionStart": [{ "hooks": [{ "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/track.sh" }] }],
    "SubagentStart": [{ "hooks": [{ "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/track.sh" }] }],
    "Stop": [{ "hooks": [{ "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/track.sh" }] }]
  }
}
```

### 9.3 Reference: Consent-Wording (i18n DE/EN)

**DE:**
> ValidationKit kann anonyme Nutzungsdaten senden (Skill-Name, CLI-Host, Dauer, Exit-Code). **Keine Prompts, kein Code wird übertragen.** Datenverarbeitung durch PostHog (EU/Frankfurt). Datenschutz: validationkit.dev/datenschutz.
>
> [Y] Anonyme Daten senden     [n] Nicht senden (Standard)

**EN:**
> ValidationKit can send anonymous usage data (skill name, CLI host, duration, exit code). **No prompts or code are transmitted.** Processed by PostHog (EU/Frankfurt). Privacy: validationkit.dev/privacy.
>
> [Y] Send anonymous data     [n] Don't send (default)

---

## 10 — Quellen

**Claude Code Hooks & Telemetry:**
- [Hooks reference — Claude Code Docs](https://code.claude.com/docs/en/hooks) (Anthropic, 2026)
- [Monitoring — Claude Code Docs](https://code.claude.com/docs/en/monitoring-usage) (Anthropic, 2026)
- [Claude Code Hooks: Complete Guide to All 12 Lifecycle Events](https://claudefa.st/blog/tools/hooks/hooks-guide) (claudefa.st, 2026)
- [ColeMurray/claude-code-otel](https://github.com/ColeMurray/claude-code-otel) — OSS-Reference
- [Marco Lancini, My Claude Code Setup (2026 Edition)](https://blog.marcolancini.it/2026/blog-my-claude-code-setup/)

**Cursor / IDE-Telemetry:**
- [Cursor — Data Use & Privacy Overview](https://cursor.com/data-use)
- [Cursor — Privacy Policy](https://cursor.com/privacy)
- [VS Code Telemetry Docs](https://code.visualstudio.com/docs/configure/telemetry)
- [`@vscode/extension-telemetry`](https://www.npmjs.com/package/@vscode/extension-telemetry)

**CLI-Telemetry-Precedents:**
- [Next.js Telemetry](https://nextjs.org/telemetry) (Opt-Out, Verbose-Schema)
- [Vercel CLI Telemetry](https://vercel.com/docs/cli/about-telemetry)
- [Astro Telemetry](https://astro.build/telemetry/)
- [GitHub CLI Opt-Out Telemetry Changelog (Apr 2026)](https://github.blog/changelog/2026-04-22-github-cli-opt-out-usage-telemetry/)
- [Homebrew Anonymous Analytics](https://docs.brew.sh/Analytics)

**AI-Gateway / Token-Tracking:**
- [Vercel AI Gateway Docs](https://vercel.com/docs/ai-gateway)
- [Vercel AI Gateway — Claude Code Support](https://vercel.com/changelog/ai-gateway-support-for-claude-code)
- [Vercel AI Gateway — Disallow Prompt Training](https://vercel.com/docs/ai-gateway/capabilities/disallow-prompt-training)
- [LiteLLM AI Gateway](https://docs.litellm.ai/docs/simple_proxy)
- [OpenRouter Comparison 2026](https://relayplane.com/blog/llm-gateway-comparison-2026)

**Privacy-First Analytics-Backends:**
- [PostHog Self-Host Docs](https://posthog.com/docs/self-host) (MIT, EU-Cloud)
- [PostHog GDPR Analytics Tools](https://posthog.com/blog/best-gdpr-compliant-analytics-tools)
- [Plausible Data Policy](https://plausible.io/data-policy) (Frankfurt-hosted)
- [Fathom Cookieless Analytics](https://usefathom.com/why-fathom-analytics/cookieless-analytics)
- [Sentry EU Data Region Press Release](https://sentry.io/about/press-releases/sentry-announces-eu-data-region-significant-upgrades-to-its-performance-monitoring-platform-and-expansion-of-ecosystem-support/)
- [Sentry GDPR Best Practices](https://sentry.io/trust/privacy/gdpr-best-practices/)

**DSGVO / Legal:**
- [activeMind.legal — Lawful processing of telemetry data](https://www.activemind.legal/guides/telemetry-data/) (**load-bearing**)
- [Art. 6 GDPR — Lawfulness of processing (gdpr-info.eu)](https://gdpr-info.eu/art-6-gdpr/)
- [GDPR Compliance 2026: Germany Guide (GCI)](https://germancomplianceinstitute.com/blogs/news/gdpr-compliance-2026-a-guide-for-businesses-in-germany)
- [CMS Law — EU & German Data Protection 2025 Recap](https://cms-lawnow.com/en/ealerts/2026/01/2025-in-data-protection)
- [heydata — Opt-in/Opt-out und Double-Opt-In nach DSGVO](https://heydata.eu/en/magazine/opt-in-and-opt-out-how-does-double-opt-in-work-according-to-gdpr-2/)

**Observability für AI-Workloads (Phase-2+):**
- [Sealos — Claude Code Metrics Dashboard 2026](https://sealos.io/blog/claude-code-metrics/)
- [SigNoz — Bringing Observability to Claude Code](https://signoz.io/blog/claude-code-monitoring-with-opentelemetry/)
- [Elastic Security Labs — Monitoring Claude Code/Cowork](https://www.elastic.co/security-labs/claude-code-cowork-monitoring-otel-elastic)
- [VictoriaMetrics — Vibe coding tools observability](https://victoriametrics.com/blog/vibe-coding-observability/)

---

*Document version 1.0 — 2026-05-14. To be re-checked quarterly via `/compete-check` against new Anthropic/Cursor telemetry capabilities and DSGVO-jurisprudence shifts.*
