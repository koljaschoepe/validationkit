# Bundle C — State-Polish (Empty · Loading · Error)

> Master: `../saas-premium-overhaul.md` · Severity: **Strong** · Effort: **M**
> Status: ⏸ **Defer → `frontend-pre-ga-polish.md`** · Confidence: High

## Reconciliation

`frontend-pre-ga-polish.md` (High) deckt bereits ab: `loading.tsx` → `<GalaxieSkeleton/>` (CLS-Fix), `global-error.tsx` `lang="de"`, Toast-System (6 silent Forms), Scan-Detail-Loading-Skelett. Das ist die kanonische State-Polish-Arbeit.

## Delta gegenüber frontend-pre-ga-polish

- Empty-States mit **Next-Action** pro Daten-Surface (nicht nur „leer").
- Inspector-Leerzustand klarer.
- Error-Copy durchgängig deutsch + handlungsleitend (über die dort gelisteten Routes hinaus).

## Empfehlung

Diese Deltas als Erweiterung in `frontend-pre-ga-polish.md` einpflegen statt parallel bauen. `EmptyState`-Primitive (ui-vk) konsequent nutzen.
