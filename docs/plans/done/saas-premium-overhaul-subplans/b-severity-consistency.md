# Bundle B — Severity-Sprache-Konsistenz (Rest-Audit)

> Master: `../saas-premium-overhaul.md` · Severity: **Strong** · Effort: **S**
> Status: ⏸ **Defer** — Großteils bereits geshippt · Confidence: Mid

## Reconciliation

`galaxie-legibility-rework.md` (High-Confidence, pixelgenau) hat die kanonische Severity-Palette bereits definiert; **`lib/galaxie/severity-colors.ts` SHIPPT sie schon** (`SEVERITY_HEX.Kill = '#f4604e'` etc.), `SeverityBadge` nutzt CSS-Vars als Single-Source. Der Critic (#2) bestätigt: die behauptete „Farb-Quelle teils inline"-Divergenz ist ohne file:line-Beleg.

## Rest-Aufgabe (klein)

- Audit: gibt es noch Surfaces mit **inline** Severity-Farben statt `SEVERITY_HEX`/CSS-Var? (grep `#f4604e`/`#c64a3a`/hardcoded). Falls ja → auf Single-Source umstellen.
- Findings-Copy-Ton vereinheitlichen (deutsch, handlungsleitend) — überlappt Bundle C.

## Empfehlung

Kein eigener Build. Rest in `galaxie-legibility-rework.md` mitführen oder als Micro-Polish (Bundle G) erledigen.
