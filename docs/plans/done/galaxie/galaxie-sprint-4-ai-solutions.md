# Plan — Galaxie Sprint G4: AI-Solutions

> Erstellt: 2026-05-19
> Status: ✅ Done — shipped 2026-05-19
> Slug: `galaxie-sprint-4-ai-solutions`
> Branch: `feat/galaxie-sprint-4-ai-solutions`
> Outcome: Inspector zeigt echte AI-Solutions (@vk/fixes integration) mit Rationale + Unified-Diff + Confidence-Badge. Lazy on-demand-Generation, cached in `solution`-Tabelle. FileAsteroid alpha bandet Confidence visuell.

---

## 1. Ziel

Inspector "AI Solution"-Tab zeigt echte Solutions aus `@vk/fixes` statt Mock-Diff. Solutions werden on-demand beim ersten Inspector-Open generiert, gecached in der `solution`-Tabelle, und färben den FileAsteroid via Confidence-Opacity ein.

## 2. Endzustand

**DB-Schema:**
- Neue Tabelle `solution` (id, finding_id FK UNIQUE, status, patch text, rationale text, confidence varchar(10), deterministic boolean, files_touched jsonb, generator_version varchar, generated_at, failure_reason text).
- Migration 0009 additiv, kein Daten-Risk.

**On-Demand-Generation:**
- Inspector mountet → server-action `getOrGenerateSolution(findingId, userId)` läuft.
- Cache-Hit (status='ready') → return cached solution sofort.
- Cache-Miss → INSERT pending row → @vk/fixes generateFixAsync → UPDATE status=ready/failed → return solution. Membership-Gate. updateTag(galaxie:workspace:<id>).
- LLM-augmented categories ohne `ANTHROPIC_API_KEY` → status='failed' mit reason='no-llm-key'.
- Anthropic-only per CLAUDE.md-Constraint. Kein OpenAI-Fallback in G4.

**Inspector "AI Solution"-Tab:**
- Loading-State (Spinner + "Generating solution…") solange status='pending'.
- Ready-State: Rationale-Markdown oben, dann unified-diff in `<pre>` mit `+`-Lines grün und `-`-Lines rot (minimal styling per Q4.3-Default).
- Confidence-Badge (low/mid/high) als Pill oben rechts der Rationale.
- Deterministic-Flag als kleine "auto"-Marker (kein LLM-Risk).
- Apply-Button bleibt disabled mit "Coming in Sprint G5"-Tooltip.
- Failed-State: Reason + Retry-Button.
- Unsupported-Category (z.B. conflicting-rules): "No solution generator for this finding type yet." (statt Spinner).

**Confidence-Visualization auf Asteroid:**
- DAL erweitert FileNode mit `solutionStatus: 'none' | 'pending' | 'ready' | 'failed'` + `solutionConfidence?: 'low' | 'mid' | 'high'`.
- FileAsteroid Render: `alpha` basierend auf `solutionStatus + confidence` (none=0.6, pending=0.6+Pulse, ready+high=1.0, ready+mid=0.85, ready+low=0.7, failed=0.4 grau).
- GalaxieScene re-rendert auf updateTag (revalidate via cache-tag-flush).

**Coverage (Q4.4-Default):**
- Solutions werden generiert für alle Findings außer Severity=Exceptional.
- Conflicting-rules (kein Fixer im @vk/fixes) bekommt Solution-Status='unsupported' (special-cased, kein "failed").

**Tests grün:**
- `pnpm test` mind. 43/43 vitest (39 G3-Bestand + 4 G4-neue für solution-DAL Logic).
- `pnpm typecheck` grün.
- `pnpm build` grün.
- Manuelle E2E: Inspector öffnen für ein File-Asteroid (z.B. "ghost-agent never referenced") → Spinner ~5s → echter Diff (deterministic, unused-agent generator).

## 3. Schritte

### A. Schema + Migration (~2h)

- [x] `packages/db/src/schema.ts`: `solution`-Tabelle + `solutionRelations`. Foreign-Key `finding_id` mit UNIQUE-Constraint (1 Solution pro Finding).
- [x] `pnpm db:generate` erzeugt `0009_<auto>.sql`.
- [x] `pnpm db:migrate` lokal verifizieren.
- [x] `pnpm --filter @vk/db build` (rebuild dist).

### B. Solution-DAL + Server-Action (~5h)

- [x] `apps/web/src/lib/solution-dal.ts` (NEU):
  - `getSolution(findingId)` → DB-lookup.
  - `getOrGenerateSolution(userId, findingId)` → atomic cache-or-generate. Membership-Gate. INSERT pending → call `@vk/fixes.generateFixAsync` (mit `rawScan` aus scan-JSONB rekonstruiert) → UPDATE status. Returnt Solution oder null bei unsupported.
  - `listSolutionStatusByFinding(findingIds: string[])` → Map<findingId, status> für DAL-Bulk-Load.
  - `revalidateSolutionForFinding(findingId)` → trigger updateTag(galaxie:workspace:<id>).
- [x] `apps/web/src/lib/solution-actions.ts` (NEU): server-action wrapper `requestSolution(findingId)` für Client-Component-Aufruf.
- [x] Rekonstruktion von ParserResult aus `scan.raw_scan` JSONB-Spalte: helper `loadScanContext(scanId): Promise<ParserResult>`.

### C. DAL-Galaxie erweitern (~2h)

- [x] `apps/web/src/lib/dal/galaxie.ts` `loadWorkspaceData`: nach Findings-Query auch Solutions-Bulk-Query. Map findingId → solutionStatus + confidence.
- [x] `FileNode` Type extend: `solutionStatus: 'none' | 'pending' | 'ready' | 'failed' | 'unsupported'`, `solutionConfidence?: 'low' | 'mid' | 'high'` (in `lib/galaxie/types.ts`).
- [x] `lib/galaxie/mock-data.ts`: Mock-Files bekommen plausible random solutionStatus für /-Public-Demo (damit Confidence-Opacity sichtbar ist).

### D. FileAsteroid Confidence-Render (~2h)

- [x] `components/galaxie/pixi/FileAsteroid.ts`: Constructor liest `file.solutionStatus` + `file.solutionConfidence`. Setzt `alpha` per Mapping:
  ```ts
  function alphaFor(status, confidence): number {
    if (status === 'ready' && confidence === 'high') return 1.0;
    if (status === 'ready' && confidence === 'mid') return 0.85;
    if (status === 'ready' && confidence === 'low') return 0.7;
    if (status === 'pending') return 0.6;
    if (status === 'failed') return 0.4;
    return 0.6;
  }
  ```
- [x] Falls status='pending': GSAP-Pulse-Animation (alpha 0.4↔0.7 in Loop) bis revalidateTag.
- [x] `severity-colors.test.ts` + `mock-data.test.ts`: ggf. Typ-Update.

### E. Inspector "AI Solution"-Tab rewrite (~4h)

- [x] `apps/web/src/components/galaxie/AISolutionPlaceholder.tsx` rename zu `AISolutionPanel.tsx` (oder bleibt name, content rewrite).
- [x] State-Machine: 
  - status='unsupported' → "No solution generator for <category>." + dim text.
  - status='none' or first-mount → call requestSolution(findingId) via Server-Action → set local-state 'pending'.
  - status='pending' → Spinner + "Generating solution…" + estimated-time.
  - status='ready' → Rationale (markdown-light) + diff-`<pre>`.
  - status='failed' → reason + Retry-Button (re-trigger requestSolution).
- [x] Diff-Renderer: split patch by `\n`, jede Line gets className based on first char (`+` → text-green-400, `-` → text-red-400, `@@ ` → text-blue-400, other → text-white/60).
- [x] Apply-Button: disabled mit Tooltip "Apply lands in Sprint G5 — GitHub-App-PR-Workflow."
- [x] Confidence-Pill: low=gray, mid=blue, high=green; deterministic=outline-only.

### F. Inspector polling for pending solutions (~1h)

- [x] Wenn Inspector mountet mit status='none' oder 'pending': React-effect ruft `requestSolution`, danach poll mit setInterval(2s) auf `getSolution` bis status≠pending. Max 30s, dann zeigt timeout-error.
- [x] Optimization: Server-Action returnt sofort die fertige Solution wenn cache-hit, kein poll nötig.

### G. revalidate-Tag-Wiring (~1h)

- [x] `getOrGenerateSolution` ruft `updateTag(galaxieWorkspaceTag(workspaceId))` nach Generation, sodass galaxie alpha-Werte refreshen.
- [x] Nachprüfen, dass updateTag in der server-action erlaubt ist (es ist).

### H. Tests + Build + Sprint-Close (~3h)

- [x] `apps/web/src/lib/solution-dal.test.ts` (NEU): alphaFor-mapping, status-state-machine, conflicting-rules → unsupported.
- [x] `apps/web/src/components/galaxie/diff-renderer.test.ts` (NEU): patch-line-classification.
- [x] `pnpm typecheck && pnpm test && pnpm build` grün.
- [x] Browser-E2E (Playwright):
  - Galaxie auf `/ws-…?debug=1` → Asteroiden zeigen unterschiedliche Alpha (vorher alle 1.0, jetzt 0.6 weil keine Solutions).
  - Click auf "ghost-agent" Finding (deterministic, unused-agent): Inspector öffnet, "Generating…" für 0.5s, dann echter Diff sichtbar.
  - Asteroid wird auf alpha=1.0 (high confidence + ready) wenn Inspector geschlossen + Galaxie revalidated.
  - Click auf "Conflicting" Finding (kein Fixer): "No solution generator for conflicting-rules" statt Spinner.
- [x] Plan-File-Boxen, Status → ✅ Done, `mv` zu `docs/plans/done/`.

## 4. Files-to-Change

| Datei | Aktion | Was |
|---|---|---|
| `packages/db/src/schema.ts` | EDIT | `solution`-Tabelle + Relations. |
| `packages/db/drizzle/0009_<auto>.sql` | NEW | Migration auto-gen. |
| `apps/web/src/lib/solution-dal.ts` | NEW | getOrGenerateSolution, getSolution, listSolutionStatusByFinding, loadScanContext. |
| `apps/web/src/lib/solution-dal.test.ts` | NEW | Status-State-Machine + alphaFor-Mapping. |
| `apps/web/src/lib/solution-actions.ts` | NEW | requestSolution Server-Action wrapper. |
| `apps/web/src/lib/dal/galaxie.ts` | EDIT | `loadWorkspaceData` join solution-statuses ins FileNode. |
| `apps/web/src/lib/galaxie/types.ts` | EDIT | FileNode extend solutionStatus + solutionConfidence. |
| `apps/web/src/lib/galaxie/mock-data.ts` | EDIT | Mock-FileNode bekommt random plausible solutionStatus für `/` Public-Demo. |
| `apps/web/src/components/galaxie/pixi/FileAsteroid.ts` | EDIT | alpha-Mapping nach status+confidence, optional GSAP-Pulse für pending. |
| `apps/web/src/components/galaxie/AISolutionPlaceholder.tsx` | REWRITE | Echtes State-Machine: unsupported / pending-poll / ready+diff / failed+retry. |
| `apps/web/src/components/galaxie/diff-renderer.tsx` | NEW | Minimal unified-diff-renderer mit ±-Color. |
| `apps/web/src/components/galaxie/diff-renderer.test.ts` | NEW | Line-classification-Test. |

## 5. Test-Plan

**Automatisch:**
- `pnpm typecheck` grün.
- `pnpm test` grün — mind. 43/43 vitest (39 G3 + 4 G4):
  - solution-dal: state-machine + alphaFor (2 tests).
  - diff-renderer: line-classification (2 tests).
- `pnpm build` grün — incl. neue solution-action.
- Migration roundtrip: `pnpm db:migrate` durchläuft auf bestehender DB.

**Manuell (Playwright, eingeloggt):**
- `/ws-…?debug=1` → Galaxie zeigt Asteroiden mit alpha=0.6 (keine Solutions yet).
- Click auf "Agent ghost-agent never referenced" → Inspector "AI Solution"-Tab automatisch ausgewählt (first-mount-default ändert sich auf "ai" für Findings mit Solution, oder bleibt "Detail"? — wahrscheinlich "Detail" wie heute, User klickt zu "AI solution"). Tab-Switch zu "AI solution" → Spinner ~0.5s (deterministic, schnell) → Diff: `- # Agent: ghost-agent\n- # Triggers on: never\n…` mit ±-Color.
- Confidence-Pill "high" + deterministic-Marker.
- DB-Query: `SELECT * FROM solution WHERE finding_id = '...';` zeigt ready-Row.
- Reload-Page → Inspector öffnet schon mit ready (cache hit, kein Spinner).
- Click auf "Conflicting rules" Finding (falls existiert): "No solution generator" Banner statt Spinner.
- Galaxie nach Solution-Generation: asteroid-alpha = 1.0 für ready+high.

**Verifizierungs-Greps:**
- `grep -r "Mock-Diff" apps/web/src/components/galaxie/` darf 0 Treffer haben (Mock-Diff aus G3 ist raus).
- `grep -r "Coming in Sprint G4" apps/web/src/components/galaxie/` darf 0 Treffer haben (Placeholder-Banner weg, durch echte Solution ersetzt). Aber "Coming in Sprint G5" für Apply-Button BLEIBT.

## 6. Risiken + Rollback

| Risiko | Severity | Mitigation |
|---|---|---|
| @vk/fixes generators schlagen fehl wegen scan.raw_scan-JSONB-Roundtrip-Verlust (z.B. Date-Strings statt Date-Objects) | Strong | loadScanContext mappt JSONB → ParserResult mit expliziter Re-Hydration. Vitest deckt das ab. Failure-Path: status='failed' mit reason, Retry-Button. |
| Anthropic API rate-limit oder Cost-spike bei context-bloat-LLM bei vielen findings | Mid | Lazy (on-demand) generation begrenzt Cost auf "vom User wirklich angeschaute" findings. Plus: solution-cache verhindert Re-Generation. Plus: pro-User-Rate-Limit ist in @vk/billing schon implementiert (canRunAudit-style Gate via canGenerateSolution erweiterbar). G4 nimmt das nicht mit; G6 Polish optional. |
| Inspector polling bricht wenn User Tab schließt (Solution-Generation läuft weiter, dann zombie-Row) | Mid | INSERT pending → UPDATE ist atomic. Wenn Generation crashed, bleibt 'pending' Row. Cleanup-Job in Inngest cron (1h-old pending → 'failed' mit reason='timeout'). G4 ohne cleanup; manuell DELETE wenn nötig. |
| FileAsteroid-alpha mit GSAP-Pulse für pending → bei 150+ Asteroiden FPS-Drop | Mid | Pulse nur für `inspectorFileId === file.id` (= 1 asteroid max). Andere pending bleiben statisch dim. Plan §6 documented. |
| `pnpm build` bricht weil `solution-dal.ts` "use server" + Drizzle-imports in client-bundle laufen | Mid | server-action-Pattern (separate file mit "use server") trennt das sauber. Wenn Build crashed, server-action-file-isolation via dynamic-import wie in customer-actions.ts. |
| Diff-Renderer mit sehr großem patch (>2k Lines) crasht React-Render | Weak | <pre> mit explicit overflow-y-auto + max-height. Plus: truncate-with-"…show all" wenn >500 Lines. G4 baut keinen Truncate; risk-accepted. |
| Mock-data für `/` Public-Demo ohne real-DB-Generation → mock-FileNodes haben fake `solutionStatus` aber ohne echten Diff → Confusion | Weak | Public-Demo Inspector zeigt "Mock-Demo, sign in for real solutions" für mock-findings. Im /-route. |

**Rollback:**
- Branch `feat/galaxie-sprint-4-ai-solutions`. `git checkout main` (oder zurück zu G3-Branch) = voller Code-Rollback.
- DB-Rollback: `DROP TABLE solution;` + Migration-Journal-Entry entfernen. solution-Tabelle ist standalone, kein FK von repo/scan/finding auf solution → drop ist safe.

## 7. Open Questions

(leer — alle 4 Master-Decisions vorab geklärt:
- Generation = on-demand-lazy,
- Apply bleibt disabled in G4,
- Diff-Viewer = minimal monospace mit ±-Color,
- Coverage = alle Severities außer Exceptional.)

---

**Ausführungs-Trigger:** `/execute galaxie-sprint-4-ai-solutions` nach User-Review.
