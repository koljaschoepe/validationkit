# Bundle D — Mobile-Dichte & Responsive-Triage

> Master: `../saas-premium-overhaul.md` · Severity: **Mid** · Effort: **S–M**
> Status: ⏸ **Defer → `frontend-pre-ga-polish.md`** (teil-erledigt durch Bundle A) · Confidence: Mid

## Reconciliation

- `frontend-pre-ga-polish.md` deckt Touch-Targets ≥44px (`data-touch`/`h-11`) + `SettingsLayout`-Mobile-Accordion ab.
- **Bundle A teil-adressiert das schon:** das Mobile-Gate (`GalaxieRoot:83`) rendert jetzt dieselbe aufgewertete Konsole inkl. group-by + Heat-Leiste; alle Tap-Targets der Konsole sind bereits `minHeight: 44`.

## Rest-Delta

- Group-by-Toolbar auf 375px: passt sie ohne horizontale Scroll-Falle? (Heute `flex-wrap` — visuell prüfen.)
- Heat-Leiste ist `hidden sm:flex` → auf Mobile aktuell ausgeblendet; ggf. kompakte Mobile-Variante (Kill-Count bleibt sichtbar).

## Empfehlung

Visuelle Mobile-QA der Konsole (375px) als erster Schritt; Rest in frontend-pre-ga-polish.
