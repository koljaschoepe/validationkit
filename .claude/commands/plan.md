---
description: Erstelle einen optimalen Plan via mehrrundige Discovery-Klärung. Schreibe nach docs/plans/<slug>.md.
---

Du planst eine konkrete Änderung am Projekt. Argument vom User: `$ARGUMENTS`
(typischerweise ein Kebab-Case-Slug wie `magic-link-rate-limit` oder
`fix-drift-pagination`; ggf. mit Freitext-Beschreibung dahinter).

**Dein Job ist nicht, schnell einen Plan zu schreiben — sondern einen Plan zu schreiben, hinter dem keine Vermutungen mehr stecken.** Frag lieber 12× kurz als 1× falsch zu raten. Der User will Klarheit, keine Geschwindigkeit.

## Phase A — Discovery (vor jedem Schreibversuch)

### A.1 Kontext aufbauen

1. **Lies `.claude/CLAUDE.md`** für Repo-Kontext.
2. **Lies thematisch verwandte Plan-Files** in `docs/plans/` + `docs/plans/done/`. Grep nach 2–3 Keywords aus dem Slug. Wenn der Slug `nova-2-*` ist, lies den Master-Plan. Wenn `fix-*`, suche nach betroffenem Code-Bereich.
3. **Lies relevanten Code** gezielt (kein Repo-Wide-Scan außer der Slug ist Repo-weit).
4. **Notiere intern** (nicht im Plan-File, noch nicht):
   - Was du zu wissen glaubst → Confidence pro Sektion (High/Mid/Low)
   - Welche Vermutungen du machst
   - Welche Patterns du im Repo identifiziert hast

### A.2 Frage-Runden (immer mindestens 2, max. 4)

**Regel für jede AskUserQuestion-Frage:**

- **Maximal 1–2 Sätze pro Option.** User soll in <5s lesen + entscheiden.
- **Erste Option immer Suffix `(Recommended)`** mit begründeter Empfehlung. Wenn du keine Empfehlung hast → frag NICHT — recherchiere weiter im Code.
- **Vierte Option ist via AskUserQuestion automatisch "Other" (Freitext).** Du musst sie nicht explizit listen.
- Klare, deutsche Sprache. Code-Terms (file paths, function names) okay.
- Maximal 4 Fragen pro AskUserQuestion-Call.

**Runde 1 — Scope & Intent (immer):**

1. **Was-für-Change** — Refactor / Feature / Bugfix
2. **Scope-Breite** — Single-File / Single-Package / Cross-Package
3. **Zeit-Schätzung** — Mini-Sprint (≤2h) / Half-Day (2–4h) / Multi-Session (>1 Tag)
4. **Verwandte Pläne** — kein Vorgänger / bezieht sich auf [X] / Sub-Plan von [Y]

**Runde 2 — Risk-Surface (immer):**

1. **DB-Touching?** — Nein / Additive (neue Tables/Columns) / Destructive (DROP/RENAME)
2. **Auth/Permission?** — Nein / Read-Permission / RBAC-Erweiterung
3. **External-API?** — Nein / 1 Provider Reads / Multi-Provider oder Writes/Webhook
4. **Secrets/Env-Vars?** — Nein / nur DEV (lokales Mailpit/Redis) / auch PROD (Vercel-Env)

**Runde 3 — Execution-Shape (conditional: nur wenn ≥1 Risk-Surface ≠ Nein, ODER Multi-Session):**

1. **Rollout-Strategie** — Direkt-Merge / Branch+Review / Feature-Flag
2. **Test-Tier** — Typecheck+Vitest / + Integration (msw/api-routes) / + Playwright E2E
3. **Existing-Pattern** — Folge [konkretem Pattern X] (Recommended wenn gefunden) / wähle aus mehreren / neues Pattern definieren
4. **Out-of-Scope** — alles im Plan / Claude schlägt V2-Cut vor / User füllt aus

**Runde 4 — Deep-Dive (conditional, nur bei vorhergehenden destructive/RBAC/Webhook/Feature-Flag-Antworten):**

Beispiele für conditional follow-ups:

- DB destructive → Soft-Delete-Window? Migration-Reversibilität?
- RBAC → Welches Modell (RLS vs App-Layer)?
- Feature-Flag → Backend (env-var / DB-row / LD)?
- Multi-Session → PR-Schnitt-Strategie (1 großer vs N kleine)?
- External-API Webhook → Signing-Pattern (HMAC vs JWT)?

### A.3 Stopp-Bedingung (Klarheits-Schwelle)

Vor jeder Runde intern checken:

> Kann ich JETZT, mit den gegebenen Antworten, JEDE dieser Plan-Sektionen ohne weitere Vermutung schreiben?
>
> §5 Ziel · §6 Endzustand · §7 Schritte · §8 Files · §9 Test-Plan · §10 Risiken (alle Severity-Bänder?) · §11 Rollout · §12 Out-of-Scope

- Wenn alle ✓ → Discovery beenden, in Phase B.
- Wenn ≥1 ✗ → eine weitere Runde mit gezielter Fragen-Auswahl.
- Hard-Cap: 4 Runden. Nach Runde 4 verbleibende Lücken in §13 Open Questions dokumentieren, NICHT weiter raten.

## Phase B — Plan-File schreiben

Schreibe `docs/plans/<slug>.md` mit dieser Struktur:

```markdown
# Plan — <Titel>

> Erstellt: <Datum>
> Status: 🟡 In Review
> Slug: `<slug>`
> Confidence: High/Mid/Low — basiert auf {N} User-Entscheidungen + Code-Audit von {M} Files
> Voraussetzung (falls Sub-Plan): siehe `docs/plans/<parent>.md`

## 1. Ziel
Ein Satz. Was ist nach Execute anders?

## 2. User-Entscheidungen (Audit-Trail aus Discovery)
| ID | Runde | Frage | Antwort |
|----|-------|-------|---------|
| Q1 | 1.1   | Scope | ...     |

## 3. Existing-Patterns im Repo (Vorbild)
- `path/to/file.ts:L1-L40` — was es zeigt, warum wir dem folgen.

## 4. Alternativen, die wir bewusst NICHT wählen
- Alt-A: ... → Verworfen wegen ...

## 5. Endzustand
Konkret: welcher Code-Pfad, welches UI-Verhalten, welcher Test grün?

## 6. Schritte
- [ ] Schritt 1 (Datei: …)
- [ ] Schritt 2 (Datei: …)
- [ ] Test-Schritt
- [ ] Build + Typecheck

(Bei Multi-Session-Scope: in Phasen A/B/C/... aufteilen.)

## 7. Files-to-Change
| Datei | Aktion (NEW/EDIT/DELETE/MOVE) | Was passiert |
|-------|-------------------------------|--------------|

## 8. Test-Plan

**Automatisch:**
- `pnpm typecheck` ✓
- `pnpm test` ✓ — neue Tests: ...
- (falls Test-Tier ≥ Integration) `pnpm test:integration` ✓
- (falls Test-Tier = Playwright) `pnpm test:e2e` ✓

**Manuell:**
- [ ] Manuell-Check 1: ...

## 9. Risiken + Mitigation
| Risiko | Severity | Mitigation |
|--------|----------|------------|
| ...    | Kill/Strong/Mid/Weak | ... |

(Severity-Bänder: Konvention aus CLAUDE.md.)

## 10. Rollout
- Strategie: Direkt-Merge / Branch+Review / Feature-Flag / Staged
- Pre-Deploy-Gates: ...
- Post-Deploy-Verifikation: ...
- Rollback-Trigger: ...
- Rollback-Schritte: ...

## 11. Out-of-Scope (V2 / separater Plan)
- ...

## 12. Open Questions (nur Post-Execute-Items)
- (Idealerweise leer. Wenn nicht: ehrlich gemachte Notiz, was im Execute geklärt werden muss.)

## 13. Geschätzter Aufwand
- Phase A: ...h
- Gesamt: ...h. Empfehlung: N PRs.
```

## Phase C — User-Review-Loop

Nach Plan-Write:

1. Antwort an den User:
   - Pfad zum Plan-File
   - 3-Satz-Summary
   - Confidence-Level
   - Liste aller gestellten Fragen + Antworten (verifizierbar)
2. AskUserQuestion mit:
   - Ready für `/execute <slug>` (Recommended)
   - Sektion X anpassen (sub-AskUserQuestion mit Sektionen)
   - Re-Plan from scratch (zurück zu Phase A)

## Anti-Patterns

- Kein Code in dieser Phase, nur Plan-File.
- Keine Frage stellen, ohne Recommended-Vorschlag mit Begründung.
- Keine vagen Schritte ("API verbessern") — immer Datei + konkrete Änderung.
- Wenn Slug eine Datei nennt, die nicht existiert → Discovery-Runde, nicht raten.
- Open Questions am Ende ist NICHT okay für load-bearing Architektur-Decisions — die kommen vorne in §2.
- Kein Plan-File schreiben, solange ein Section-Item nur "TBD" oder "..." ist.
- Confidence Low → Phase A nochmal, nicht Plan-File mit Low schreiben.
