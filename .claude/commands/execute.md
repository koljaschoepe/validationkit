---
description: Führe einen Plan aus docs/plans/<slug>.md mit Pre-Flight, Block-Resolver, Dev-Server-Auto-Start. Verschiebe nach done/.
---

Du führst einen bereits geschriebenen Plan aus. Argument: `$ARGUMENTS` (Slug).

## Phase A — Pre-Flight

1. **Lies `docs/plans/$ARGUMENTS.md`.** Wenn die Datei nicht existiert: Fehler melden + die naheliegendsten 3–5 Slugs aus `docs/plans/` + `docs/plans/done/` listen.
2. **Lies `.claude/CLAUDE.md`** für Repo-Kontext.
3. **Confidence-Check:** Plan-Header sagt `Confidence: Low`? → AskUserQuestion:
   - Re-Plan first (Recommended)
   - Trotzdem starten + Risiko akzeptieren
   - Stop Execute
4. **Git-Branch-Status-Check:** `git status` clean?
   - Wenn modified files vorhanden → AskUserQuestion:
     - Commit-first der pending changes (Recommended bei thematisch passenden Files)
     - Stash + Execute + later pop
     - Continue ohne Stash (Risk-akzeptiert)
5. **Heuristik:** `isUIChange = (Files-to-Change ≥3 Files unter apps/web/src/)` — intern merken für Phase C.

## Phase B — Step-by-Step-Execution

1. **TaskCreate** für jeden Schritt aus Plan §6.
2. **Arbeite die Schritte sequentiell ab.** Pro Schritt:
   - TaskUpdate auf `in_progress`.
   - Edit/Write/Bash wie geplant.
   - Markiere die Checkbox im Plan-File: `- [ ]` → `- [x]`.
   - TaskUpdate auf `completed`.

### Step-Block-Resolver

Ein Schritt gilt als **blockiert** wenn:

- Geplanter File existiert nicht (Plan-Drift)
- Referenzierte API/Function/Variable existiert nicht (mehr)
- Test-Befehl funktioniert nicht (z.B. Script-Pfad changed)
- Edit erzeugt unerwarteten Typecheck/Build-Fehler den der Plan nicht antizipiert hat

Bei Block:

- **NIE raten.** STOP + AskUserQuestion:
  - "Schritt §X.Y plant Edit von `<file>` / API `<name>`. <Problem>. Vorschlag?"
  - Op1: Plan §X.Y updaten auf [konkrete Korrektur] (Recommended)
  - Op2: Schritt skippen + in §12 Open-Items dokumentieren
  - Op3: Re-Plan (Stop Execute, zurück zu `/plan <slug>`)
- Bei Op1 → Plan-File updaten, Schritt fortsetzen.

### Sub-Step-Adjustment

Wenn ein Schritt sich als 3× größer als geplant herausstellt (z.B. 5 statt 1 File anzufassen):

- STOP + AskUserQuestion:
  - Fortfahren, Scope erweitern (Recommended wenn Delta <30 min)
  - Sub-Plan auslagern (neues Plan-File-Stub `docs/plans/<slug>-step-X.md`)
  - Plan-File mit refined Sub-Steps updaten, dann fortfahren

## Phase C — Test + Verifikation

1. **§8 Automatische Tests:** alle ausführen. Bei Rot → STOP, fix-or-ask (kein Skip-and-Continue).
2. **§8 Manuelle Tests:** für jeden Check User um Verifikation bitten (AskUserQuestion):
   - "Manuell-Check N — funktioniert wie erwartet?"
   - Op1: Ja (Recommended)
   - Op2: Nein, hier ist was kaputt: [vermutete Diagnose]
   - Op3: Skippe, später manuell

3. **Dev-Server-Auto-Start (nur wenn `isUIChange = true`):**
   - Starte `pnpm --filter @vk/web dev` im Background (Bash mit `run_in_background: true`).
   - Lies die ersten ~50 Zeilen der Output bis URL erscheint (typisch `http://localhost:3000`).
   - Antwort an User: "Dev-Server läuft auf <URL>. Bitte visuelle Verifikation: [Liste der geänderten Routen]."
   - Bei non-UI-Plans skippen.

## Phase D — Plan-Abschluss

1. **Acceptance-Kriterien-Check** (aus Plan §10 Rollout):
   - AskUserQuestion: "Alle Acceptance-Kriterien erfüllt? Plan-File §10 zeigt: [Liste]"
   - Op1: Ja, alle erfüllt → ✅ Done (Recommended)
   - Op2: Nein, X fehlt noch → Plan bleibt aktiv, zurück zu Execute-Step
   - Op3: Ja mit deferrals: [Liste der deferred Items in §12 Open Questions]

2. **Bei Op1 oder Op3:**
   - Aktualisiere Status im Plan-File:
     ```
     > Status: ✅ Done — <Datum> (Confidence-At-Start: High/Mid/Low, {N} Steps abgehakt, {M} deferred, {K} manuelle Verifikationen pending)
     ```
   - `git mv docs/plans/$ARGUMENTS.md docs/plans/done/$ARGUMENTS.md`

3. **Antwort an User:**
   - Was wurde geändert (kurze Liste)
   - Plan-Pfad jetzt (`docs/plans/done/...`)
   - Test-Status (auto + manuell)
   - Dev-Server-URL falls UI-Change
   - Offene Items (falls Op3)

## Wenn ein Schritt blockiert ist (Fallback)

- Plan-File **nicht löschen**.
- Im Plan §12 (Open Questions) die Blocker dokumentieren.
- AskUserQuestion mit max. 4 Optionen, wie weiter.

## Anti-Patterns

- Keinen Plan-Schritt skippen ohne explizites User-Op2-OK.
- Keinen neuen Schritt erfinden, ohne den Plan vorher per Edit zu updaten.
- Keine Commits ohne User-Aufforderung.
- Kein `vercel deploy` oder ähnliches.
- Bei Block NIE raten — IMMER AskUserQuestion.
- Dev-Server nicht starten bei non-UI-Plans (unnötiger Process).
- Plan nicht nach done/ moven solange Acceptance-Kriterien ✗ sind.
- Status-Zeile darf nicht "✅ Done" sein wenn Manual-Checks pending sind — dann "✅ Done (manuelle QA pending: User-Aufgabe)".
