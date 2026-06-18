# Bundle F — Map-Tab-Job schärfen

> Master: `../saas-premium-overhaul.md` · Severity: **Mid** · Effort: **S**
> Status: 🔵 Draft — folgt auf Bundle A · Confidence: Mid

## 1. Ziel

Nach Bundle A ist die Galaxie ein Map-Tab. Damit sie nicht **verwaist** (Critic #8), braucht sie einen expliziten Job: **Customer-/Portfolio-Severity-Geographie** (1-Blick-Überblick „welcher Kunde brennt"), NICHT Drilldown-Triage (das macht jetzt die Konsole).

## 2. Discovery-Entscheidungen (offen — `/plan` klären)

- Soll Klick auf eine Sonne in den **Konsole-Tab zurückspringen, vorgefiltert auf das Repo**? (Empfohlen — schließt den Loop Map→Konsole.)
- Braucht der Map-Tab einen eigenen Empty-/Onboarding-Hinweis („Überblick — zum Bearbeiten in die Konsole")?

## 3. Vorgeschlagene Richtung

**Plumbing verifiziert (2026-06-10):** `GalaxieScene` hat den Sun-Klick-Pfad bereits — `handleSunClick` (`GalaxieScene.tsx:493`) → `onSunClick(repoId)` (Prop `:788`, Call `:1000`). Heute macht der Klick nur einen Kamera-Tween.

- Optionalen Prop `onSunActivate?(repoId)` an `GalaxieScene`-Props ergänzen, im bestehenden `handleSunClick` zusätzlich aufrufen (**kein** Innereien-Umbau, optional → kein Verhalten ohne Prop).
- State-Lift in `GalaxieRoot.InteractiveGalaxie`: `focusRepoId` + `setView('console')`.
- Konsole nimmt optionalen `focusRepoId`-Prop (scroll-to + highlight).

**Warum heute deferred:** Der Mehrwert (Filter/Scroll/Highlight-Gefühl) ist nur visuell auf der auth-gated Workspace-Map verifizierbar — blind geshippt riskiert es ein janky Halb-Feature. Supervised umsetzen.

## 4. Risiken

`GalaxieScene` darf laut Verdict nicht in den Innereien umgebaut werden → nur ein Callback-Prop durchreichen, Sun-Hit-Test existiert bereits. Wenn das mehr als ein Prop wird → eigenes Ticket.

## 5. Out-of-Scope

Galaxie-Rendering/Layout-Änderungen · neue Visualisierungs-Paradigmen.
