---
description: Führe einen Plan aus docs/plans/<slug>.md Schritt-für-Schritt aus und verschiebe ihn nach Abschluss in done/.
---

Du führst einen bereits geschriebenen Plan aus. Argument: `$ARGUMENTS` (Slug).

## Vorgehen

1. **Lies `docs/plans/$ARGUMENTS.md`.** Wenn die Datei nicht existiert: Fehler
   melden + die naheliegendsten Slugs aus `docs/plans/` listen.
2. **Lies `.claude/CLAUDE.md`** um den Repo-Kontext aufzufrischen.
3. **TaskCreate** für jeden Schritt aus dem Plan §3. Setze Status auf
   `in_progress`, sobald du einen Schritt startest.
4. **Arbeite die Schritte sequentiell ab.** Nach jedem Schritt:
   - Markiere die Markdown-Checkbox im Plan-File: `- [ ]` → `- [x]`.
   - TaskUpdate auf `completed`.
5. **Test-Schritt:** führe den Test-Plan aus §5 des Plan-Files aus.
   Build + Typecheck + ggf. spezifische Tests. Wenn etwas rot ist: STOP,
   updaten und nachfragen.
6. **Wenn alle Schritte grün:**
   - Aktualisiere `Status:` im Plan-File auf `✅ Done — <Datum>`.
   - Verschiebe `docs/plans/$ARGUMENTS.md` → `docs/plans/done/$ARGUMENTS.md`
     mittels `git mv` falls Git, sonst Bash `mv`.
7. **Antwort an den User:** Was wurde geändert (kurze Liste), wo der Plan jetzt
   liegt, Test-Status.

## Wenn ein Schritt blockiert ist

- Plan-File **nicht löschen**.
- Im Plan §7 (Open Questions) die Blocker dokumentieren.
- AskUserQuestion mit max. 4 Optionen, wie weiter.

## Anti-Patterns

- Keinen Plan-Schritt skippen.
- Keinen neuen Schritt erfinden, ohne den Plan vorher zu updaten.
- Keine Commits ohne User-Aufforderung.
- Kein Deploy.
