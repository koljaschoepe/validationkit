---
description: Pre-launch readiness check — runs through GTM, distribution, copy, tech, and legal gates before any public launch milestone
argument-hint: "<which launch: phase-0 | week-1 | pro-tier-go-live | re-brand | etc.>"
---

Run a pre-launch readiness check.

**Launch event:** $ARGUMENTS

Process — gehe systematisch durch alle Gates. Berichte pro Gate: ✅ ready / ⚠ blocking / 🟡 risky-but-go.

### 1. PRD-Konformität
- [ ] Ist das Launch-Ziel in PRD §29 Roadmap verankert?
- [ ] Sind alle Decisions in §32 Decisions Log auf "Accepted" und korrespondierende ADRs vorhanden?
- [ ] Open Questions (§30) die diesen Launch blockieren — sind sie resolved?

### 2. Tech / Build
- [ ] Reference-Implementation läuft end-to-end? (Lauf `/dogfood` falls noch nicht)
- [ ] Multi-Provider-Test: läuft in Claude Code AND Cursor AND Codex CLI?
- [ ] Snapshot-Tests in CI sind grün?
- [ ] Token-Budget-Caps via AI Gateway sind gesetzt?
- [ ] `npx create-validationkit@latest` (oder Re-Brand-Name) funktioniert auf frischem Repo?

### 3. Copy / Brand
- [ ] README durch `brand-voice-keeper` gelaufen?
- [ ] Tagline + Counter-Tagline auf Landing-Page (PRD §23.4)?
- [ ] Severity-Bänder (keine Fake-Precision-Scores) in allen User-facing Outputs?
- [ ] Citations inline in Marketing-Copy?
- [ ] Keine Emojis / "AI-powered"-Buzzwords?

### 4. Distribution Setup
- [ ] X/Twitter-Account aktiv mit ≥4 Wochen Build-in-Public-Cadence?
- [ ] HN Show-HN-Post-Draft vorbereitet?
- [ ] r/ClaudeAI-Post-Draft vorbereitet (Mod-Rules gecheckt)?
- [ ] ProductHunt-Listing-Draft vorbereitet?
- [ ] `awesome-claude-code` / VoltAgent / `claude-plugins-official` PR-Drafts liegen bereit?
- [ ] Founder-Blog-Post "Why I built X" geschrieben?
- [ ] 8 SEO-Comparison-Pages (`/vs/<competitor>`) live oder draft?

### 5. Influencer / Newsletter Outreach
- [ ] Theo / swyx / Console.dev / TLDR AI / Fireship — pre-launch warmup-Touches versendet?
- [ ] Lenny Rachitsky (für Studio-Tier-Launches)?

### 6. Legal / Trust
- [ ] LICENSE-File korrekt (MIT für Core)?
- [ ] CONTRIBUTING.md vorhanden?
- [ ] Privacy Policy / ToS für Web-App (Phase 1+)?
- [ ] CAN-SPAM / GDPR Consent-Gate vor Resend-Send (Phase 1+)?
- [ ] DSGVO-konformes Tracking (Plausible PostHog EU-Region)?

### 7. Monetization Readiness (Phase 1+)
- [ ] Stripe-Integration live + getestet?
- [ ] $19 Pro / $5 PAYG / Free-Cloud-Tier in der UI sichtbar?
- [ ] Budget-Caps pro User-Tier durchgesetzt?
- [ ] Persona-Library-Lock-in funktional (Retention-Hebel)?

### 8. Konkurrenz-Watch
- [ ] `/compete-check` in den letzten 30 Tagen gelaufen?
- [ ] Keine RED-flag-Findings unbehandelt?

### 9. Founder-Capacity
- [ ] Hat Founder die nächsten 14 Tage Verfügbarkeit für Reaktion auf Launch-Reaktionen?
- [ ] Co-Founder-Distribution-Profil entweder gesourct oder als bewusste "solo solo"-Decision logged?

### 10. Rollback-Plan
- [ ] Was, wenn Launch flach läuft? Pivot-Trigger aus §28.4 reviewed?
- [ ] Was, wenn ein Bug viral wird? Hotfix-Path definiert?

---

**Aggregat-Verdict:**
- ≥3 ⚠ blocking → **DELAY 1–2 weeks, fix gates, re-run**
- 0 blocking + ≤3 🟡 risky → **GO mit Mitigation-Notes**
- 0 blocking + 0 risky → **GO clean**

Schreibe Output nach `launch-checks/<YYYY-MM-DD>-<launch-event>.md` für späteres Retro.
