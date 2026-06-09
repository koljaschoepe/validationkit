# Bundle F — Map-Tab-Job schärfen

> Master: `../saas-premium-overhaul.md` · Severity: **Mid** · Effort: **S**
> Status: 🔵 Draft — folgt auf Bundle A · Confidence: Mid

## 1. Ziel

Nach Bundle A ist die Galaxie ein Map-Tab. Damit sie nicht **verwaist** (Critic #8), braucht sie einen expliziten Job: **Customer-/Portfolio-Severity-Geographie** (1-Blick-Überblick „welcher Kunde brennt"), NICHT Drilldown-Triage (das macht jetzt die Konsole).

## 2. Discovery-Entscheidungen (offen — `/plan` klären)

- Soll Klick auf eine Sonne in den **Konsole-Tab zurückspringen, vorgefiltert auf das Repo**? (Empfohlen — schließt den Loop Map→Konsole.)
- Braucht der Map-Tab einen eigenen Empty-/Onboarding-Hinweis („Überblick — zum Bearbeiten in die Konsole")?

## 3. Vorgeschlagene Richtung

- State-Lift in `GalaxieRoot.InteractiveGalaxie`: `selectedRepoId` + `setView`. Sun-Klick-Callback aus `GalaxieScene` (neuer optionaler Prop, **kein** Innereien-Umbau — nur ein `onSunActivate(repoId)` durchreichen) → `setView('console')` + Filter-Vorwahl.
- Konsole nimmt einen optionalen `focusRepoId`-Prop (scroll-to + highlight).

## 4. Risiken

`GalaxieScene` darf laut Verdict nicht in den Innereien umgebaut werden → nur ein Callback-Prop durchreichen, Sun-Hit-Test existiert bereits. Wenn das mehr als ein Prop wird → eigenes Ticket.

## 5. Out-of-Scope

Galaxie-Rendering/Layout-Änderungen · neue Visualisierungs-Paradigmen.
