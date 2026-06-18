# Bundle A — Mission Control (Konsole = Default, Galaxie = Map-Tab)

> Master: `../saas-premium-overhaul.md` · Severity: **Kill** · Effort: **M–L**
> Status: 🟡 In Arbeit — Branch `overnight/saas-premium-overhaul` (2026-06-10)
> Confidence: **High** (Code-Anker verifiziert, reine Logik unit-getestet)

## 1. Ziel & Kontext

Die Default-Workspace-Surface von der Pixi-Galaxie auf eine **verdichtete Triage-Konsole** invertieren. Lenas Job = Triage über 5–30 Repos („was brennt, fix es zuerst") = sortierbare Rangliste, keine räumliche Suche. Die Galaxie bleibt **1:1 erhalten** als on-demand „Map"-Tab. Evolution, kein Rewrite. Schließt zugleich den a11y-Kill (mouse-only Canvas auf dem kritischen Pfad).

## 2. Discovery-Entscheidungen (getroffen)

- **Group-by-Achsen:** Repo (default) · Severity · Rule (= `finding.category`) · Customer · Folder.
- **Default-Sort:** Triage-Priorität = (Kill-Count desc, dann Weak desc, dann Findings-Total desc).
- **Heat-Leiste:** gestapelte Severity-Segmente in `SEVERITY_HEX` pro Repo/Customer/Rule-Zeile — die „in 3 Sekunden"-Glyphe.
- **Click-Sun→Konsole-Filter:** **NICHT** hier (würde `GalaxieScene`-Innereien anfassen) → Bundle F.

## 3. Problem & Evidenz

- `GalaxieRoot.tsx:111` — Default-View war `'galaxy'` (Pixi mouse-only auf kritischem Pfad).
- `SolarListView.tsx` — hatte Severity-Filter-Chips + Aggregate-Rows, aber **kein** group-by, **kein** Sort, **keine** Heat-Leiste (Critic #4 — kein „80%-Prototyp").
- `solar-layout.ts` — Orbit-Winkel = `hashString`-Anti-Kollision (bedeutungslos als Sortier-Signal).
- Datenmodell (`types.ts`): `FileNode.severity/category/customerId/repoId`, `Customer`, `Repo`, `FindingRef.category` → alle 5 Group-by-Achsen datenseitig vorhanden.

## 4. Vorgeschlagene Richtung (umgesetzt)

1. Reine Aggregations-Logik in neues Modul `lib/galaxie/console-grouping.ts` extrahieren (sort/group/heat) → voll unit-testbar ohne DOM/Auth.
2. `SolarListView` → Mission-Control-Konsole: Group-by-Toolbar + Triage-Summary + Heat-Leiste + Kill-Count + 5 Achsen, Inspector-Wiring (file + folder) erhalten.
3. `GalaxieRoot.InteractiveGalaxie` Default `'console'`, Toggle relabeln (Konsole zuerst, Map zweitens).

## 5. Konkrete Schritte

- [x] `lib/galaxie/console-grouping.ts` — `GroupBy`, `severityCounts`, `heatSegments`, `triageComparator`, `sectionsByRepo/Customer/Severity/Rule/Folder`, `CATEGORY_LABEL`.
- [x] `lib/galaxie/console-grouping.test.ts` — Unit-Tests (sort, heat, group-by, uncategorized, customer-filter, folder-flatten).
- [x] `components/galaxie/SolarListView.tsx` — Konsole-Rewrite (group-by Toolbar, Heat-Leiste, Triage-Sort, 5 Achsen, deutsche Empty/No-Match-Copy).
- [x] `components/galaxie/GalaxieRoot.tsx` — Default-Flip `console`, Toggle „Konsole / Map".

### Review-Pass (3-Agent-Adversarial, 2026-06-10 · commits A.1 `aa450e2`, A.2)
Regression-Agent: 0 Regressions (Landing-Hero via `static-demo`-Gate geschützt, API stabil, alte Toggle-Werte migriert, keine Import-Zyklen). Gefixt:
- [x] **W1**: Triage-Counts/Heat/Sort filter-unabhängig (`data.files` statt `visibleFiles`) — Rang bleibt beim Chip-Toggle stabil.
- [x] Heat-Leiste: `flex-basis` statt `float`-in-`flex` (robuste Stack-Bar).
- [x] Mobile-Kill-Signal: „N Kill"-Text auf Folder-Cards + Section-Headern (Heat-Leiste ist `hidden < sm`).
- [x] a11y: `radiogroup`/`radio`+`aria-checked` (group-by + View-Toggle), `aria-live` auf Summary, `focus-visible`-Ringe auf allen Buttons.
- [x] i18n: deutsche group-by-/Kategorie-Labels + „Submodul".
- [x] No-Match: Premium-Empty-State + „Filter zurücksetzen".
- [x] **M6**: Expand/Collapse-All-Toggle (repo + customer modes).
- Deferred → Bundle G: Toggle-Tooltip-on-focus (M2), Saved-Views/URL-State/Deep-Links (Critic #6).

## 6. Files-to-Change

`lib/galaxie/console-grouping.ts` (neu) · `lib/galaxie/console-grouping.test.ts` (neu) · `components/galaxie/SolarListView.tsx` · `components/galaxie/GalaxieRoot.tsx`.

## 7. Tests/Verifikation

- Unit: `console-grouping.test.ts` (reine Logik).
- typecheck + lint + bestehende Galaxie-Tests grün.
- **Visuelle QA (auth-gated Workspace-Route) = Morgen-Aufgabe** — kein unauthed Zugang zur Konsole; Mock-Daten-Fallback rendert die Logik aber deterministisch.

## 8. Acceptance-Kriterien

- [x] Default-View ist die Konsole, Kill-Repos oben (Triage-Sort).
- [x] Group-by-Toolbar schaltet alle 5 Achsen.
- [x] Heat-Leiste + Kill-Count pro Repo-Zeile.
- [x] Klick auf File-/Folder-Zeile öffnet denselben Inspector.
- [x] Map-Tab lädt Galaxie nur on-demand (bestehendes `dynamic ssr:false`).
- [ ] Visuelle QA Desktop + Mobile (User, morgen).

## 9. Risiken & Rollout

- **Virtualisierung** (Critic #7): bei 30+ Repos × N Findings kann die Liste lang werden — heute kein Window-ing. Akzeptabel für aktuelle Workspace-Größen; Virtualisierung = Folge-Ticket falls Jank.
- Mobile-Gate (`GalaxieRoot:83`) rendert jetzt dieselbe aufgewertete Konsole → Mobile profitiert gratis (teil-adressiert Bundle D).
- Reduced-Motion bleibt `StaticGalaxieSVG` (unberührt).

## 10. Out-of-Scope

Click-Sun→Filter (Bundle F) · Saved-Views/URL-State/Deep-Links (Critic #6 → Bundle G) · Virtualisierung · Map-Tab-Job-Schärfung (Bundle F) · Galaxie-Rendering-Änderungen.
