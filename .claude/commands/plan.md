---
description: Erstelle einen detaillierten Plan für ein Feature, einen Bug oder ein Refactor und schreibe ihn nach docs/plans/<slug>.md.
---

Du planst eine konkrete Änderung am Projekt. Argument vom User: `$ARGUMENTS`
(typischerweise ein Kebab-Case-Slug wie `magic-link-rate-limit` oder
`fix-drift-pagination`; ggf. mit Freitext-Beschreibung dahinter).

## Vorgehen

1. **Lies `.claude/CLAUDE.md`** um den Repo-Kontext aufzufrischen.
2. **Lies relevante Code-Bereiche** (Explore-Agent oder gezielt Grep/Read),
   abhängig vom Slug. Spar dir Repo-Wide-Scans, wenn der Slug eindeutig ist.
3. **Wenn die Anforderung unklar ist:** AskUserQuestion mit max. 4 Optionen,
   bevor du den Plan schreibst. Lieber 1 gute Frage als 5 falsche Annahmen.
4. **Schreibe** `docs/plans/<slug>.md` mit dieser Struktur:

   ```markdown
   # Plan — <Titel>

   > Erstellt: <Datum>
   > Status: 🟡 In Review

   ## 1. Ziel
   Eine Sache, ein Satz. Was ist nach Execute anders?

   ## 2. Endzustand
   Konkret: welcher Code-Pfad, welches UI-Verhalten, welcher Test grün?

   ## 3. Schritte
   - [ ] Schritt 1 (Datei: …)
   - [ ] Schritt 2 (Datei: …)
   - [ ] Test-Schritt
   - [ ] Build + Typecheck

   ## 4. Files-to-Change
   | Datei | Was passiert                              |
   |-------|-------------------------------------------|
   | …     | Neue Funktion / Anpassung / Delete        |

   ## 5. Test-Plan
   - Manuell: …
   - Automatisch: `pnpm test` / `pnpm eval` / spezifisches `vitest <file>`

   ## 6. Risiken + Rollback
   - Risiko: …
   - Rollback: `git checkout <branch>` reicht / DB-Migration nötig: …

   ## 7. Open Questions
   - (leer, wenn alles klar; sonst hier listen)
   ```

5. **Schreibe nichts weiter als das Plan-File.** Keine Code-Edits in dieser Phase.
6. Antwort an den User: Pfad zum Plan-File + 2–3 Sätze Zusammenfassung +
   Hinweis: "review + ruf `/execute <slug>` wenn ok."

## Anti-Patterns

- Kein Code schreiben. Nur Plan-File.
- Keinen Plan ohne Test-Sektion.
- Keine vagen Schritte ("API verbessern") — immer Datei + konkrete Änderung.
- Wenn der Slug eine Datei nennt, die nicht existiert — Frag nach, nicht raten.
