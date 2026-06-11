# S6 — Frontend, Accessibility, Performance & SEO · Second-Opinion Audit · 2026-06-10
Modell: Fable 5 (claude-fable-5) · Methode: static + targeted dynamic (Build, `next start`, Lighthouse-CI desktop, rechnerische OKLCH→sRGB-Kontrastanalyse) · read-only

## Threat-Model & In-Scope-Annahmen

- **Risikoträger statt klassischer Angreifer:** (a) Nutzer mit Behinderung — Screenreader, Tastatur-only, Farbsehschwäche (Deuteranopie) — werden vom frischen 3-Farben-Design ausgeschlossen → Qualitäts-/Reputationsrisiko (BFSG trifft DACH-B2B nicht hart, daher a11y-Fails ≠ automatischer Rechtsbruch); (b) anonymer Erstbesucher auf langsamer Verbindung → CWV/Bundle/No-JS; (c) Suchmaschinen-/Social-Crawler → SEO/OG.
- **Kronjuwelen:** Erstkontakt-Conversion (Landing-Hero + Anon-Audit), Triage-Workflow (Konsole `SolarListView`), konsistente Severity-Semantik (Rot/Orange/Grün als Vertrauensanker), Auffindbarkeit.
- **Out-of-scope:** B2C-Cookie-Banner, Marketing-Material, pgvector, User-externe Tasks, alle Known-Issues aus §7.0 (Scan-Detail-Erst-Audit-Kill nur neu bewertet: designt oder roh).
- **Methoden-Constraints:** Kein Playwright (Env tot) → visuelle Checks als manuelle User-Aufgaben notiert (Liste am Ende). Kontrast rechnerisch (Ottosson-OKLab-Referenzmatrix, WCAG-Relative-Luminance) + LHCI-axe-Kreuzvalidierung.

**Dynamische Checks ausgeführt:**
- `pnpm --filter @vk/web build` — exit 0; Routen-Tabelle: **alle** App-Routen ƒ/dynamic, nur robots/sitemap/sub-processors ○ static.
- `next start` (Port 3987, nach Build): Erstversuch 500 → Env-Validation verlangt `NEXT_PUBLIC_APP_URL` fatal in production (guter Guard, entkräftet Sitemap-localhost-Sorge).
- First-Load-JS gemessen (Script-Tags der gerenderten HTML + gzip der Chunks): `/` = **1051 KB raw / 328 KB gzip**, `/pricing` = 227 KB gzip, `/login` = 244 KB gzip, `/legal/impressum` = **227 KB gzip**.
- LHCI (Chrome for Testing aus Playwright-Cache, desktop preset): `/` **perf 98 · a11y 96 · bp 100 · seo 100** (LCP 1.1 s, CLS 0, TBT 0 ms); `/pricing` und `/legal/impressum` je 100/100/100/100. A11y-Fails auf `/`: `color-contrast` + `label-content-name-mismatch`.
- LCP-Element der Landing = `h1#hero-headline` (per LHCI bestätigt).

## Findings (Übersicht)

| ID | Severity | go-live-blocker | Titel | file:line | verification |
|----|----------|-----------------|-------|-----------|--------------|
| S6-01 | Weak | no | Weak-Severity-Text + destructive-Button verfehlen Kontrast-AA (3.4–3.7:1 bei 11–14 px) | apps/web/src/app/globals.css:120 · apps/web/src/components/ui/severity-badge.tsx:38 | verified |
| S6-02 | Weak | no | Low-Alpha-Metatexte (white/30–/40, muted-foreground/60–/70) bei 10–11 px unter AA — axe-bestätigt | apps/web/src/components/galaxie/SolarListView.tsx:633 u.a. | verified |
| S6-03 | Weak | no | Inspector: `role="dialog" aria-modal="true"` ohne jedes Fokus-Management | apps/web/src/components/galaxie/Inspector.tsx:136 | verified |
| S6-04 | Mid | no | ARIA-Pattern-Verstöße: radiogroup + tree ohne Pfeiltasten/Roving-Tabindex | apps/web/src/components/galaxie/SolarListView.tsx:214 · apps/web/src/components/landing/RepoTreeView.tsx:76 | verified |
| S6-05 | Mid | no | Label-in-Name-Mismatch auf Landing-Drill-Buttons (WCAG 2.5.3, axe-Fail) | apps/web/src/components/galaxie/SolarListView.tsx:426 | verified |
| S6-06 | Mid | no | Hero server-rendert mit `opacity:0` — ohne JS unsichtbar, LCP an Hydration gekettet | apps/web/src/components/landing/HeroText.tsx:51 | verified |
| S6-07 | Mid | no | First-Load-JS schwer (328 KB gzip Landing, 227 KB gzip Legal-Text), 0 dynamic imports, 0 statische Marketing-Routen | apps/web/src/app/page.tsx:16 · apps/web/src/app/layout.tsx:27 | verified |
| S6-08 | Mid | no | Sprach-Inkonsistenz: `lang="de"` + englische Metadata + gemischtsprachige UI | apps/web/src/app/layout.tsx:41,71 | verified |
| S6-09 | Mid | no | SEO-Politur: kein og:image trotz `summary_large_image`, kein canonical, Sitemap ohne Impressum/Datenschutz | apps/web/src/app/layout.tsx:52 · apps/web/src/app/sitemap.ts:5 | verified |
| S6-10 | Mid | no | Stale Default-Label „Back to galaxy" in Workspace-Settings (Galaxie retired) | apps/web/src/components/ui-vk/SettingsLayout.tsx:33 | verified |
| S6-11 | Weak | no | Mobile-Repo-Drill: `fixed`-Pill-Bar kann aus dem Hero-Frame auf den Seiten-Viewport ausbrechen | apps/web/src/components/landing/RepoConsole.tsx:441 | uncertain |

**Tally: 0 Kill · 4 Weak · 7 Mid · 0 go-live-blocker.**

## Findings (Detail)

### S6-01 · Weak-Severity-Text + destructive-Button verfehlen Kontrast-AA · Weak · go-live-blocker: no
- **Evidenz:** `apps/web/src/app/globals.css:120` + `apps/web/src/components/ui/severity-badge.tsx:38` + `apps/web/src/components/ui/button.tsx:19-20`
  ```css
  --sev-weak: oklch(0.55 0.15 28);           /* dimmer red (darker + less chroma than Kill) */
  ```
  ```tsx
  Weak: "border-[var(--color-sev-weak)] text-[var(--color-sev-weak)]",
  ```
  Rechnerisch (OKLab-Referenz, WCAG-Luminanz): Weak-Text `#b9473d` auf `--background` `#0b0c0e` = **3.74:1**, auf `--card` `#161719` = **3.43:1**, auf Konsolen-Row (white/3 %) = **3.55:1** — Badge-Text ist `type-mono-sm` = **11 px** → AA verlangt 4.5:1. Destructive-Button (dark: `bg-destructive/20 text-destructive`) = **3.68:1** bei 14 px medium („Delete workspace", `[workspace]/settings/danger/DeleteWorkspaceForm.tsx:55`). Gleiches Muster im `RepoTreeView`-Severity-Chip (10 px, `color-mix` 12 %-Fill, RepoTreeView.tsx:168-173).
- **Impact/Exploit-Pfad:** Das Weak-Band ist eines von 5 Kern-Severity-Signalen und erscheint auf jeder Triage-Fläche (Konsole, Inspector, Scan-Detail, Landing-Drill). Sehbehinderte/ältere Nutzer können das 11px-Uppercase-Label auf dunklem Grund nicht zuverlässig lesen — genau die Severity-Differenzierung, die das 3-Farben-System verspricht.
- **Confidence:** high
- **Verifikation:** verified — (1) „Large text (3:1 reicht)?" Nein: 11 px mono normalgewichtig, weit unter 18.66 px bold. (2) „Hellerer Kontext, wo es passt?" Alle realen Hintergründe (background/card/white-3 %/black-90) liegen zwischen 3.4 und 3.9:1. (3) „Light-Mode-Override?" globals.css hat keinen Light-Block; dark-first ist der einzige Ist-Zustand. Hinweis: Kill gefüllt (`--sev-on-kill` auf `--sev-kill`) = **4.85:1 PASS**; Mid 6.6:1, Strong 5.7:1, Exceptional 9.0:1 — nur Weak (+ destructive-Button) fällt.
- **Fix-Richtung (1 Satz, kein Code):** `--sev-weak` auf ca. `oklch(0.62–0.64 0.13 28)` aufhellen (bleibt klar dunkler/leiser als Kill) und die destructive-Button-Variante auf ≥4.5:1 nachziehen.

### S6-02 · Low-Alpha-Metatexte bei 10–11 px unter AA · Weak · go-live-blocker: no
- **Evidenz:** `apps/web/src/components/galaxie/SolarListView.tsx:633` (u. a.)
  ```tsx
  <span className="block truncate font-mono text-[10px] text-white/35">
    {context ? `${context} · ` : ''}{file.path}
  </span>
  ```
  Rechnerisch: `text-white/30` = 2.62:1, `/35` = 3.16:1, `/40` (Chip-off) = 2.2–3.7:1, `text-muted-foreground/70` (Hero-Microcopy, HeroText.tsx:97) = 3.60:1, Placeholder `/60` (RepoUrlPill.tsx:74) = 2.90:1. **LHCI-axe bestätigt** auf `/`: 3.6 / 3.51 / 3.71 / 3.23 auf genau diesen Klassen (`p.mt-4`, `span.ml-3`, `span.text-white/40`, `span.text-white/35` ×6).
- **Impact/Exploit-Pfad:** Datei-Pfade, Findings-Counts, Filter-Chip-Labels und das „Keine Kreditkarte"-Microcopy sind informationstragend; bei 10–11 px und <3.2:1 sind sie für einen relevanten Nutzeranteil schlicht unlesbar — auf der Kern-Triage-Fläche und im Hero.
- **Confidence:** high
- **Verifikation:** verified — (1) „Disabled/exempt?" Chip-off ist ein aktiver Toggle-Zustand, kein disabled-Element; Pfade/Counts sind Inhalt. (2) „Nur dekorativ?" Pfad ist das Identifikationsmerkmal der Zeile. (3) Unabhängige Quelle (axe) deckt sich mit eigener Rechnung.
- **Fix-Richtung:** Floor bei `white/50`–`/55` (≈4.5:1) für alles unter 12 px einziehen; Off-Zustand der Chips über Form (z. B. durchgestrichen/Outline) statt nur Alpha kommunizieren.

### S6-03 · Inspector: aria-modal-Dialog ohne Fokus-Management · Weak · go-live-blocker: no
- **Evidenz:** `apps/web/src/components/galaxie/Inspector.tsx:136-138`
  ```tsx
  <div ref={panelRef} role="dialog" aria-modal="true" aria-label={panelLabel}
  ```
  Im gesamten Inspector + SolarListView existiert kein `.focus()`, `autoFocus` oder `tabIndex`-Management (grep-verifiziert); das Panel portals ans body-Ende (Inspector.tsx:167).
- **Impact/Exploit-Pfad:** `aria-modal="true"` weist Screenreader an, alles außerhalb des Dialogs als inert zu behandeln — der Fokus bleibt aber auf der auslösenden Datei-Zeile *außerhalb*. SR-Nutzer landen in einem „toten" Bereich; Tastatur-Nutzer müssen durch die restliche Seite tabben, um das Panel (letzter DOM-Knoten) zu erreichen. ESC-Close (Z. 98-104) existiert, Fokus-Rückgabe beim Schließen fehlt ebenfalls.
- **Confidence:** high
- **Verifikation:** verified — (1) „Focus-Trap im Parent?" Nein, kein Aufrufer fokussiert das Panel. (2) „Ist es überhaupt modal?" Click-outside + ESC schließen, verhält sich nicht-modal → dann ist `aria-modal="true"` die falsche Semantik; so oder so inkonsistent. (3) `SignUpTeaseDialog` nutzt dagegen shadcn/Radix mit echtem Trap — das Pattern existiert im Repo.
- **Fix-Richtung:** Beim Öffnen Fokus ins Panel setzen + beim Schließen zurückgeben (oder `aria-modal` entfernen und als nicht-modales Panel auszeichnen); Radix Dialog/Sheet wäre der vorhandene Weg.

### S6-04 · ARIA-Pattern: radiogroup + tree ohne Pfeiltasten · Mid · go-live-blocker: no
- **Evidenz:** `apps/web/src/components/galaxie/SolarListView.tsx:214-224`
  ```tsx
  <div role="radiogroup" aria-label="Gruppieren nach" ...>
    <button ... role="radio" onClick={...} aria-checked={groupBy === o.value}
  ```
  und `apps/web/src/components/landing/RepoTreeView.tsx:76,133`: `role="tree"`/`role="treeitem"` mit Button *innerhalb* des treeitem; kein Arrow-Key-Handling, kein Roving-Tabindex in beiden Komponenten (nur Enter/Space in RepoTreeView.tsx:125-130).
- **Impact/Exploit-Pfad:** SR/Tastatur-Nutzern wird per Rolle ein APG-Interaktionsmuster (Pfeiltasten in Radiogroup/Tree) angekündigt, das nicht funktioniert; verschachtelter Button im treeitem erzeugt zudem Doppel-Semantik („treeitem … button"). Bedienbarkeit via Tab bleibt erhalten — deshalb Mid, nicht Weak.
- **Confidence:** high
- **Verifikation:** verified — (1) „Greift Radix/Library-Verhalten?" Nein, rohe native Buttons. (2) „Meldet axe?" Nein (axe prüft Pattern-Vollständigkeit nicht) — Verstoß ist gegen APG, nicht gegen axe-Regeln; Code-Evidenz eindeutig. (3) Tab-Bedienung funktioniert → kein Blocker.
- **Fix-Richtung:** Entweder ehrliche Semantik (Toggle-Buttons mit `aria-pressed` statt radio; Liste statt tree) oder das volle APG-Keyboard-Pattern nachrüsten.

### S6-05 · Label-in-Name-Mismatch auf Drill-Buttons · Mid · go-live-blocker: no
- **Evidenz:** `apps/web/src/components/galaxie/SolarListView.tsx:426-428` — axe-Fail `label-content-name-mismatch` auf `/` (6×):
  ```tsx
  aria-label={ drillMode ? `${section.repo.label} öffnen` : undefined }
  ```
  Sichtbarer Zeilentext umfasst zusätzlich Kill-Count + „N Findings", der Accessible Name ersetzt ihn komplett.
- **Impact/Exploit-Pfad:** WCAG 2.5.3 — Voice-Control-Nutzer, die sichtbaren Text diktieren („agent-runtime 12 Findings"), treffen den Button nicht zuverlässig; SR-Nutzer verlieren die Count-Information im Namen.
- **Confidence:** high
- **Verifikation:** verified — axe-Evidenz aus LHCI-Lauf gegen den Prod-Build; Code-Stelle deckungsgleich. „Ist `öffnen`-Suffix das Problem?" Nein — der Name *beginnt* mit dem sichtbaren Label, aber axe bemängelt die fehlenden übrigen sichtbaren Texte; `aria-label` weglassen (Inhalt trägt schon alles) löst es.
- **Fix-Richtung:** `aria-label` im Drill-Mode entfernen und die Aktion stattdessen z. B. via visually-hidden Suffix („öffnen") im Button-Inhalt ergänzen.

### S6-06 · Hero server-rendert mit opacity:0 · Mid · go-live-blocker: no
- **Evidenz:** `apps/web/src/components/landing/HeroText.tsx:51-69` (`m.div variants … initial="hidden"`); curl gegen Prod-Build zeigt im HTML:
  ```html
  <h1 id="hero-headline" class="…" style="opacity:0;transform:translateY(12px)">
  ```
  LHCI: LCP-Element = genau dieses `h1#hero-headline`.
- **Impact/Exploit-Pfad:** Eyebrow, H1, Subhead, CTAs und Konsolen-Frame sind ohne/vor JS unsichtbar — die komplette Above-fold. LCP ist damit an Bundle-Download + Hydration gekettet (desktop-lokal 1.1 s ok; auf Mobile/3G mit 328 KB gzip JS deutlich schlechter); No-JS-Besucher und strikte Content-Blocker sehen einen leeren Hero.
- **Confidence:** high (No-JS) / mid (realer Mobile-CWV-Impact ungemessen)
- **Verifikation:** verified — (1) „Löst CSS die Animation ohne JS?" Nein, motion/react animiert per JS. (2) „SEO-Schaden?" Googlebot rendert JS → Text indexierbar; Impact ist UX/CWV, nicht Indexierung. (3) Desktop-LHCI bleibt grün → deshalb Mid, nicht Weak.
- **Fix-Richtung:** Hero-Text statisch rendern und nur per CSS-`@starting-style`/Animation einblenden (oder `initial={false}` serverseitig), sodass HTML ohne JS sichtbar ist.

### S6-07 · First-Load-JS schwer, 0 dynamic imports, 0 statische Marketing-Routen · Mid · go-live-blocker: no
- **Evidenz:** Messung gegen Prod-Build (`next start`): `/` = 1051 KB raw / **328 KB gzip**, `/legal/impressum` (reine Textseite) = **227 KB gzip**; `grep next/dynamic|React.lazy` über `apps/web/src` = **0 Treffer**; Build-Routentabelle: alle Seiten ƒ. `apps/web/src/app/layout.tsx:27-31`:
  ```tsx
  // Pure marketing routes (e.g. legal/*) can now statically prerender or use
  // `'use cache'` for full edge-cached HTML.
  ```
  Der Kommentar beschreibt eine Möglichkeit, die keine Route nutzt (SiteNav→cookies hält alles dynamisch).
- **Impact/Exploit-Pfad:** Jeder anonyme Erstbesuch (auch Impressum/Datenschutz) zahlt ~230–330 KB gzip JS + Server-Render-TTFB ohne CDN-HTML-Cache; die Shared-Baseline (Root-Layout: Toaster/Tooltip/Motion + Console-Stack ohne Code-Splitting) dominiert. Desktop-Scores sind top — das Risiko ist Mobile-Feld-LCP/INP und unnötige Serverlast.
- **Confidence:** high (Messwerte) / mid (Feld-Impact)
- **Verifikation:** verified — (1) „Cache-Components-Adoption als Known-Issue?" CLAUDE.md nennt es als Nova-3a-Goal — *neu* hier: die gemessenen Zahlen + der irreführende Layout-Kommentar + dass selbst Legal-Seiten 227 KB JS laden. (2) „Sind 328 KB normal für die Live-Demo?" Für `/` vertretbar (Demo ist das Produkt), für `/legal/*` nicht. (3) LHCI desktop 98–100 → kein Blocker.
- **Fix-Richtung:** Legal-/Trust-Seiten ohne SiteNav-Session statisch (oder `'use cache'`) rendern und den Konsolen-Drill (`RepoConsole`+Inspector) hinter `next/dynamic` legen.

### S6-08 · Sprach-Inkonsistenz: lang="de" + englische Metadata + Misch-UI · Mid · go-live-blocker: no
- **Evidenz:** `apps/web/src/app/layout.tsx:41-42,71`
  ```tsx
  description: "Point at a public GitHub repo. Get a deterministic audit …",
  …
  <html lang="de" …>
  ```
  Landing/Konsole deutsch; Scan-Detail („Scan detail", „All scans", `toLocaleString("en-US")` in `[workspace]/scans/[id]/page.tsx:16`), FindingsList („Concession: Audit passed cleanly…") und Settings englisch — alles unter `lang="de"`.
- **Impact/Exploit-Pfad:** Screenreader sprechen englische Texte mit deutscher Stimme aus (WCAG 3.1.1/3.1.2); SERP-Snippet der deutschen Landing ist englisch; DACH-B2B-Zielgruppe bekommt einen inkonsistenten Sprach-Eindruck quer durch den Funnel.
- **Confidence:** high
- **Verifikation:** verified — (1) „Ist die App bewusst englisch und nur die Landing deutsch?" Möglich, aber dann wäre `lang="de"` global + deutsche OG-Locale (`de_DE`, layout.tsx:46) mit englischer Description trotzdem widersprüchlich. (2) curl bestätigt ausgeliefertes Markup. (3) Kein Blocker — Konsistenz-/Politur-Klasse.
- **Fix-Richtung:** Eine Sprachstrategie festlegen (de für Marketing-Funnel inkl. Metadata; App-Flächen einheitlich, notfalls `lang`-Attribute pro Subtree) und das en-US-Datumsformat auf de-DE ziehen.

### S6-09 · SEO-Politur: og:image/canonical fehlen, Sitemap unvollständig · Mid · go-live-blocker: no
- **Evidenz:** `apps/web/src/app/layout.tsx:52-57` deklariert `twitter.card: "summary_large_image"`, aber es gibt weder `openGraph.images` noch eine `opengraph-image.*`-Datei (find über `apps/web` = 0 Treffer, nur `sitemap.ts`/`robots.ts`); curl-HTML enthält kein `<link rel="canonical">`; `apps/web/src/app/sitemap.ts:5-15` listet `/legal/agb|dpa|subprocessors`, aber nicht `/legal/impressum` + `/legal/datenschutz` (Routen existieren).
- **Impact/Exploit-Pfad:** Geteilte Links (LinkedIn/X — primärer B2B-Kanal) rendern ohne Bild-Karte; fehlende canonicals riskieren Duplikat-Signale hinter Querystrings; Impressum/Datenschutz fehlen im Sitemap-Inventar (Footer-Link erfüllt §5-DDG-Auffindbarkeit, daher kein Rechtsthema).
- **Confidence:** high
- **Verifikation:** verified — (1) „Generiert Next OG automatisch?" Nur mit `opengraph-image`-Datei/Metadata — nicht vorhanden. (2) „Lighthouse-SEO 100?" Ja, aber LH prüft og:image/canonical-Vollständigkeit nicht. (3) robots.txt + sitemap.xml liefern 200 und sind korrekt verdrahtet — Basis steht (positiv).
- **Fix-Richtung:** Ein statisches `opengraph-image` + `alternates.canonical` pro Marketing-Route ergänzen und die zwei Legal-Routen in die Sitemap-Liste aufnehmen.

### S6-10 · Stale „Back to galaxy"-Label · Mid · go-live-blocker: no
- **Evidenz:** `apps/web/src/components/ui-vk/SettingsLayout.tsx:33` (`backLabel = 'Back to galaxy'`) + `apps/web/src/app/[workspace]/settings/layout.tsx:70`:
  ```tsx
  <SettingsLayout groups={groups} backHref={`/${workspace}`}>
  ```
  — kein `backLabel` übergeben → jeder Workspace-Settings-Screen zeigt sichtbar „Back to galaxy", obwohl die Galaxie am 2026-06-10 retired wurde (Ziel ist die Konsole).
- **Impact/Exploit-Pfad:** Sichtbarer toter Produktbegriff auf jeder Settings-Seite — verwirrt neue Nutzer und widerspricht dem Konsolen-Vokabular; (englisch, siehe auch S6-08).
- **Confidence:** high
- **Verifikation:** verified — (1) „Überschreibt ein Caller?" Nur `account/settings/layout.tsx:52` („Back to dashboard"); der Workspace-Caller nicht. (2) Kein Funktionsschaden → Mid (Begriffs-Leiche, Dead-Naming-Klasse analog §7.0-Pixi-Hinweis).
- **Fix-Richtung:** Default auf „Zurück zur Konsole" ändern (oder im Workspace-Layout explizit übergeben).

### S6-11 · Mobile-Repo-Drill: fixed-Pill-Bar kann aus dem Hero-Frame ausbrechen · Weak · go-live-blocker: no
- **Evidenz:** `apps/web/src/components/landing/RepoConsole.tsx:441`
  ```tsx
  <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black/95 px-4 py-3 backdrop-blur">
    <RepoUrlPill … />
  ```
  `MobileLayout` rendert <768 px (use-media-query.ts:27). Auf der Landing steckt RepoConsole im 42dvh-Hero-Frame (HeroText.tsx:112-126, `overflow-hidden rounded-xl`). `position:fixed` bindet an den Viewport, **außer** ein Ancestor hat eine aktive `transform` — die motion-Wrapper (ConsoleSurface.tsx:80-87) setzen `transform` nur während der Transition.
- **Impact/Exploit-Pfad:** Falls kein Containing-Block aktiv ist, klebt nach dem Repo-Drill eine viewportbreite schwarze URL-Bar am unteren Bildschirmrand *über* dem restlichen Landing-Content (Features/Footer) — und bleibt auch beim Weiterscrollen stehen. Im Workspace-Kontext (full-bleed) wäre dasselbe Markup korrekt.
- **Confidence:** low
- **Verifikation:** uncertain — statisch nicht entscheidbar, ob motion nach Transition-Ende `transform` (→ Containing-Block) stehen lässt oder auf `none` zurücksetzt; Playwright-Env tot. **Zur Klärung fehlt:** ein mobiler Visual-Check (siehe manuelle Aufgaben M1). Drin nach Protokoll-Regel (uncertain → max Weak, low).
- **Fix-Richtung:** In der Landing-Einbettung `absolute` statt `fixed` (Frame ist bereits `relative`/clipping) bzw. eine `contained`-Prop wie beim Inspector.

## Geprüft & verworfen (refuted)

| Vermutung | Warum verworfen |
|---|---|
| Sitemap/metadataBase fallen in Prod auf `http://localhost:3000` zurück (`sitemap.ts:3`) | `next start` ohne `NEXT_PUBLIC_APP_URL` schlägt fatal fehl — Env-Validation (instrumentation) erzwingt die Var in production; beobachtet als 500 + Log „NEXT_PUBLIC_APP_URL: required". |
| `--destructive-foreground` (weiß auf Kill-Rot, 3.87:1) als Kontrast-Fail | Token ist definiert (globals.css:126), aber kein Consumer: Button-`destructive`-Variante nutzt `text-destructive` auf `destructive/10–20`-Fill (button.tsx:19-20), Alerts ebenso. Der reale Fail dieser Variante (3.68:1) ist in S6-01 erfasst. |
| `SeverityDot` trägt Severity „hue-only" (Deuteranopie) | Dot-Farben unterscheiden sich auch in Lightness (0.55/0.62/0.68/0.74); Kill-Rows tragen zusätzlich „N Kill"-Text (SolarListView.tsx:445-449); `aria-label` nennt das Band (Z. 531); Expansion zeigt Text-Badges. Restrisiko (Weak- vs Mid-Dot) zu klein für eine eigene Finding. |
| Scan-Detail-Seite „noch roh" (Erst-Audit: Kill) | **Widerlegt — die Seite ist designt:** PageShell/PageHeader + Breadcrumb (`scans/[id]/page.tsx:69-82`), Stat-Karten + shadcn-Tables/Cards (ReportView.tsx:26-34), FindingsList mit Severity-Sortierung, Fix-Preview-Dialog, Toasts (FindingsList.tsx:45-360), eigener Loading-Skeleton (`scans/[id]/loading.tsx`). Verbleibender Makel: englische Texte + en-US-Datum → in S6-08 erfasst. |
| `viewport` ohne `width=device-width` / mit Zoom-Sperre | layout.tsx:63-67 setzt `width: "device-width", initialScale: 1` und **kein** `maximumScale` — Zoom erlaubt, korrekt. |

**Positiv (Strong/Exceptional, keine Findings):** Kill-Badge gefüllt = 4.85:1 PASS (das einzige laute Signal hält AA); globales `prefers-reduced-motion`-Reset (globals.css:241-250) + `MotionConfig reducedMotion="user"` an jeder Animationsfläche; Skip-Links (SkipToContent) mit `#main-content`-Zielen; globales `:focus-visible`-Ring-Styling inkl. `summary`; `next/font` mit `display:swap` + Fallback-Adjust; `next/image` mit `sizes`/`fill` + ehrlichen alt-Texten; sr-only-Findings-Liste in RepoConsole (RepoConsole.tsx:306-318); ehrliches Early-Access-Framing statt Fake-Logos; LHCI desktop 98–100/96–100/100/100, CLS 0.

## Completeness self-check

- **Nicht erreicht/gelesen:** Authentifizierte Flächen dynamisch (Workspace-Konsole, Settings-Forms, Scan-Detail mit echten Daten) — nur statisch auditiert + LHCI nur auf 3 öffentlichen Routen (desktop preset; kein mobile-Run, keine Feld-Daten). `RepoInspector`, `BlurOverlayCTA`, `SignUpTeaseDialog`, `UniversalSearch`, `ActivationChecklist` nur überflogen. Kein axe-Lauf auf authentifizierten Seiten.
- **Unbestätigte Annahmen:** (1) Mobile-fixed-Bar-Verhalten (S6-11) — statisch unentscheidbar; (2) realer Mobile-/Feld-CWV-Impact von S6-06/07; (3) 100dvh-Hero-Verhalten bei iOS-URL-Bar-Collapse; (4) Light-Mode existiert nicht als getesteter Pfad (kein `.light`-Block in globals.css — dark-first angenommen).
- **Manuelle visuelle User-Aufgaben (Playwright-Env tot):**
  - **M1:** Landing <768 px → Repo in der Hero-Konsole antippen → prüfen, ob die schwarze URL-Pill-Bar am *Seiten*-Viewport-Boden klebt statt im Hero-Frame (S6-11).
  - **M2:** 100dvh-Hero auf echtem iOS/Android: Layout-Shift beim URL-Bar-Collapse, Notch/`viewport-fit=cover`.
  - **M3:** Tastatur-Walkthrough Konsole: Datei-Zeile → Enter → Inspector: Wo landet der Fokus? ESC → kehrt er zurück? (S6-03 erleben).
  - **M4:** Severity-Farben unter Deuteranopie-Simulator (Weak- vs Mid-Dot in der Portfolio-Liste).
  - **M5:** Die 4 Feature-Screenshots (`public/landing/*.png`) auf Vor-Overhaul-Stand prüfen (bekanntes offenes Item, 1 Zeile).
