# S4 — Backend-Flows, Background-Jobs & Observability · Second-Opinion Audit · 2026-06-10
Modell: Fabel 5 (claude-fable-5) · Methode: static + targeted dynamic (prod build + vitest) · read-only

## Threat-Model & In-Scope-Annahmen
- **Angreifer:** (a) anonymer Web-User, der die Landing-Audit-Form / GitHub-URL-Audit triggert; (b) authentifizierter Tenant-User, der Repos trackt; (c) eine ausgefallene 3rd-Party (Anthropic/Neon/Stripe/Inngest) als „Angreifer auf die Resilienz".
- **Kronjuwelen dieser Session:** Integrität & Idempotenz der Audit-Pipeline (Foreground + Inngest-Background), korrekte Credit-/Cost-Buchung am Hintergrund-Pfad, kein unbeschränkter LLM-Geldabfluss, kein Serverless-Hard-Fail bei Dependency-Outage, signierte Inngest-Webhooks, Fail-Fast-Env.
- **Explizit out-of-scope (nur 1-Zeiler):** Stripe-Geldpfad-Webhook-Idempotenz im Detail = S2. DB-Schema/Migrationen = S3. SSRF-Detailbewertung der GitHub-URL = S5. Sentry/Upstash-*Provisioning* = User-extern (aber Code-Wiring auditiert).
- **Known-Issues NICHT erneut gemeldet:** GitHub-URL-Audit ignoriert BACKGROUND_THRESHOLD (Bundle J, Timeout) · Auto-Overage-Durchreichung (Bundle B) · Migration-im-buildCommand (Bundle C). Wo unten ein NEUER Aspekt über das Bekannte hinausgeht, ist das markiert.

## da0babb Prod-Build-Blocker — Status: NICHT reproduziert (gefixt)
- **Commit da0babb** loggte einen vorbestehenden `next build`-Blocker: `membership.ts` ist `"use server"` und re-exportierte `type Role`; Turbopack fädelt jeden Export eines use-server-Moduls als Server-Action-Binding → RSC-Build bricht mit *„The export Role was not found in module lib/membership.ts"* auf `/[workspace]`, `/dashboard`, `/[workspace]/settings/members`.
- **Verifikation (dynamisch):** `pnpm --filter @vk/web build` → **Exit 0**, `✓ Compiled successfully in 31.2s`, `✓ Generating static pages (21/21)`. Alle drei zuvor brechenden Routen sind im Output (`ƒ /dashboard`, `ƒ /[workspace]/...`). Kein „export Role" mehr.
- **Ort des Fixes:** `apps/web/src/lib/membership.ts:8-15` — `Role` wird jetzt via `import { getUserRole, type Role } from "./authz"` bezogen, NICHT re-exportiert; ein Kommentarblock dokumentiert die Turbopack-Falle. SSOT = `@/lib/authz`.
- **Fazit:** Blocker existiert nicht mehr. ⚠️ Restrisiko (Prozess, nicht Code): Das Pre-Commit-/CI-Gate fährt typecheck/lint/test, aber **kein `next build`** → die Klasse build-only-Brüche bleibt unsichtbar bis zum Deploy. Siehe S4-04.

## Findings (Übersicht)
| ID | Severity | go-live-blocker | Titel | file:line | verification |
|----|----------|-----------------|-------|-----------|--------------|
| S4-01 | Weak | no | Auto-Track-Cron enqueued Audit OHNE workspaceId → kostenlose, unmetered LLM-Re-Audits | apps/web/src/lib/.../auto-track-repos.ts:86 + audit-requested.ts:68 | verified |
| S4-02 | Weak | no | `fetchRepoZipball` ohne Größen-Cap & ohne fetch-Timeout → Memory/Time-DoS am Foreground-GitHub-Audit | apps/web/src/lib/github-fetch.ts:67-96 | verified |
| S4-03 | Mid | no | LLM `generateText` ohne Timeout/AbortSignal → hängender Anthropic-Call blockt Foreground-Audit bis maxDuration | packages/llm/src/rules/conflicting-rules.ts:83 | verified |
| S4-04 | Mid | no | CI/Pre-Commit-Gate fährt kein `next build` → build-only-Brüche (Klasse da0babb) bleiben bis Deploy latent | (Prozess) docs/plans/saas-premium-overhaul.md §3b | verified |
| S4-05 | Weak | no | Keine Error-Tracking-/Alarm-Instrumentierung im Code-Pfad (instrumentation.ts nur Env-Validierung) | apps/web/src/instrumentation.ts:8-30 | uncertain |

## Findings (Detail)

### S4-01 · Auto-Track-Cron enqueued Audit OHNE workspaceId → kostenlose, unmetered LLM-Re-Audits · Weak · go-live-blocker: no
- **Evidenz:** `packages/inngest/src/functions/auto-track-repos.ts:86`
  ```ts
  await inngest.send({
    name: "audit/requested",
    data: { scanId: row.id, rootPath: r.rootPath },   // ← kein workspaceId, kein intensity
  });
  ```
  Und der Verbraucher `packages/inngest/src/functions/audit-requested.ts:54,68`:
  ```ts
  const meteringContext = workspaceIdFromPayload ? { ... } : undefined; // undefined → keine ai_usage_event-Buchung
  ...
  if (workspaceIdFromPayload) {            // false → consume-credits + auditRunCost komplett übersprungen
    await step.run("consume-credits", ...) // wird NICHT ausgeführt
  }
  const report = await step.run("audit", () => runAudit(scan, { includeLLM: true, ... })); // LLM läuft trotzdem
  ```
- **Impact/Exploit-Pfad:** Jeder getrackte Repo mit gesetztem `github_full_name` (user-setzbar via `AddRepoForm.tsx:33` → `customer-actions.ts:58` → `addRepoUnderCustomer`) wird alle 4h gepollt; bei SHA-Änderung enqueued der Cron ein `audit/requested` **ohne** `workspaceId`. Folge: `runAudit(..., includeLLM:true)` brennt echte Anthropic-Tokens, aber `consumeCredits` läuft nie, `auditRunCost` wird nie geschrieben und `meteringContext=undefined` unterdrückt sogar die `ai_usage_event`-Kostenzeile. Zahlende Kunden bekommen damit unbegrenzte, gratis Auto-Re-Audits; die Firma trägt die LLM-Kosten blind (nicht mal nachträglich rekonstruierbar). Bounded durch `DEFAULT_INTENSITY="quick"` und Repo-Anzahl, daher Weak — aber es ist ein echtes Billing-Integritäts-/Cost-Leck am Hintergrundpfad.
- **Confidence:** high
- **Verifikation:** verified — Widerlegungs-Fragen: (1) *Setzt der Foreground-Enqueue (`audit-action.ts:287`) workspaceId?* Ja — nur der Cron-Pfad lässt es weg, der Defekt ist auf auto-track isoliert. (2) *Ist `github_full_name` überhaupt je gesetzt → Cron erreichbar?* Ja, user-setzbar (AddRepoForm → addRepoAction). (3) *Fängt audit-requested den fehlenden workspaceId als Fehler ab?* Nein, der Code behandelt `undefined` als legitimen „anonymen" Hintergrundlauf. Pfad bis Impact gezogen.
- **Fix-Richtung:** Cron muss `workspaceId` (und gewünschte `intensity`) in den `audit/requested`-Payload aufnehmen, damit consume-credits + Metering am Hintergrundpfad greifen — analog zum Foreground-Enqueue.

### S4-02 · `fetchRepoZipball` ohne Größen-Cap & ohne fetch-Timeout → Memory/Time-DoS · Weak · go-live-blocker: no
- **Evidenz:** `apps/web/src/lib/github-fetch.ts:67-96`
  ```ts
  for (const tryUrl of [url, fallbackUrl, apiZipUrl]) {
    const res = await fetch(tryUrl, { headers, redirect: "follow" }); // kein signal/AbortController
    if (res.ok) { response = res; break; }
  }
  ...
  const buf = Buffer.from(await response.arrayBuffer()); // ganzes Zipball in den Heap, kein Content-Length-Check
  const zip = new AdmZip(buf);
  zip.extractAllTo(extractDir, true);                    // zusätzlich entpackt auf Disk, kein Entry-Limit
  ```
- **Impact/Exploit-Pfad:** Der GitHub-URL-Audit ist anonym erreichbar (`auditAction` → `auditGithubUrl`, anonym = quick). `fetchRepoZipball` zieht die komplette Zipball-Antwort via `arrayBuffer()` in den Speicher — ohne `Content-Length`-Gate und ohne Timeout. Ein großes öffentliches Repo (>256 MB entpackt, bzw. ein „Zip-Bomb"-artiges Repo) lässt die Vercel-Function am Heap-Limit OOM-en; eine langsam liefernde Antwort hängt bis zum undici-Default bzw. `maxDuration`. Das ist ein **neuer** Aspekt jenseits des bekannten BACKGROUND_THRESHOLD-Timeouts (Bundle J): selbst der nominell „kleine" Foreground-Pfad hat keine Eingangs-Schranke gegen Ressourcen-Erschöpfung. Begrenzt durch Anon-Rate-Limit 30/h pro IP → Weak.
- **Confidence:** mid
- **Verifikation:** verified — (1) *Gibt es weiter oben einen Size-Guard?* Nein, `scanRepository` läuft erst NACH dem vollständigen Download+Extract. (2) *Default-Timeout schützt?* Nur undici-Body/Headers-Defaults (~5 min), kein App-seitiger Cancel; die Memory-Erschöpfung ist davon unberührt. (3) *Nur authentifiziert erreichbar?* Nein, anonym über die Landing-Form.
- **Fix-Richtung:** Vor dem `arrayBuffer()` ein `AbortController`-Timeout + `Content-Length`-/Stream-Größen-Cap setzen und Zipball streamend mit Byte-Limit entpacken.

### S4-03 · LLM `generateText` ohne Timeout/AbortSignal → Foreground-Audit-Hang · Mid · go-live-blocker: no
- **Evidenz:** `packages/llm/src/rules/conflicting-rules.ts:83` (gleiches Muster in `context-bloat-llm.ts:73`)
  ```ts
  const result = await generateText({
    model,
    maxOutputTokens: selection.maxOutputTokens,
    output: Output.object({ schema: ConflictSchema }),
    prompt: buildPrompt(a, b),
  }); // kein abortSignal, kein maxRetries-Cap, kein per-call Timeout
  ```
- **Impact/Exploit-Pfad:** Der Foreground-Audit (anonym + signed-in unter BACKGROUND_THRESHOLD) ruft die LLM-Regeln synchron im Request auf. `generateText` hat keinen `abortSignal`/Timeout; hängt der Anthropic-Endpunkt (Netz-Stall, Provider-Incident), blockiert der Audit bis zum Vercel-`maxDuration` und liefert dem User einen harten Timeout statt graceful Degradation. Positiv: der `try/catch` pro Paar (Zeile 123-126) fängt *Fehler* sauber ab und überspringt sie — ein *hängender* (nicht fehlschlagender) Call wird davon aber nicht gerettet. Resilienz-Lücke, kein Datenverlust → Mid.
- **Confidence:** mid
- **Verifikation:** verified — (1) *Fängt der try/catch den Hang?* Nein, catch greift nur bei Reject, nicht bei einem nie-auflösenden Promise. (2) *Gibt es ein globales AI-SDK-Timeout?* Keines konfiguriert (grep nach `abortSignal/maxRetries/timeout` in packages/llm + packages/audit = 0 Treffer). (3) *Schützt maxDuration?* Es begrenzt den Schaden auf einen 500/Timeout, verhindert den Hang selbst nicht.
- **Fix-Richtung:** Pro LLM-Call ein `AbortSignal.timeout(...)` (z.B. 20-30s) durchreichen und bei Abbruch das Paar wie einen Fehler überspringen.

### S4-04 · CI/Pre-Commit-Gate fährt kein `next build` → build-only-Brüche bleiben latent · Mid · go-live-blocker: no
- **Evidenz:** Prozess-Befund, dokumentiert in `docs/plans/saas-premium-overhaul.md §3b` und im Kommentar `apps/web/src/lib/membership.ts:13-15` („tsc and the pre-commit gate don't run `next build`, so it stayed latent").
  ```ts
  // (Build-only failure — tsc and the pre-commit gate don't run `next build`,
  // so it stayed latent.)
  ```
- **Impact/Exploit-Pfad:** Der da0babb-Blocker passierte typecheck/lint/test und wäre erst beim Vercel-Deploy aufgeschlagen (alle Workspace-Routen 500). Die Fix-Lehre wurde notiert, aber im Repo ist weiterhin kein `next build`-Schritt im Pre-Commit-/CI-Gate verdrahtet. Die *Klasse* (use-server-Re-Export, RSC-Boundary-Brüche, ungültige Route-Configs) kann erneut unbemerkt nach `main` gelangen. Kein Laufzeit-Defekt heute → Mid, aber Launch-relevant als Regressions-Schutz.
- **Confidence:** high
- **Verifikation:** verified — (1) *Existiert irgendwo ein build-Gate?* In `apps/web/package.json` gibt es ein `build`-Script, aber kein Hook/CI-Workflow ruft es vor Merge (Memory + §3b bestätigen „nie next build"). (2) *Ist der konkrete Fall gefixt?* Ja (S4-01-Build oben grün) — die Lücke ist die fehlende Gate-Automatisierung, nicht der Einzelfall.
- **Fix-Richtung:** `next build` als Pflicht-Schritt ins CI (und/oder Pre-Push) aufnehmen, damit build-only-Brüche vor dem Deploy fallen.

### S4-05 · Keine Error-Tracking-/Alarm-Instrumentierung im Code-Pfad · Weak · go-live-blocker: no
- **Evidenz:** `apps/web/src/instrumentation.ts:8-30` — `register()` macht ausschließlich Env-Validierung; kein Sentry/OTel-Init. Repo-weiter grep nach `Sentry|sentry` = 0 Treffer in `apps/`/`packages/`.
  ```ts
  export async function register(): Promise<void> {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;
    const { validateEnv } = await import("./env");   // nur Env-Checks, kein Error-Reporter
    ...
  }
  ```
- **Impact/Exploit-Pfad:** Finanz-/sicherheitskritische Fehlerpfade (Webhook-Reject, Credit-Consume-Race, Cron-Failures, Drift-Detection in `stripe-reconcile`) werden geloggt/in die `event`-Tabelle geschrieben, aber es gibt keinen Code-seitigen Alarm-/Error-Reporter-Hook. Selbst nach Provisionierung von Sentry/Upstash (User-extern, out-of-scope) würde mangels `instrumentation`-Wiring nichts gemeldet. Heute: stille Fehler. Da das *Provisioning* explizit out-of-scope ist und die Severity vom Betriebsmodell abhängt → max. Weak/uncertain.
- **Confidence:** low
- **Verifikation:** uncertain — Offen, ob bewusst auf Vercel-Log-Drains statt SDK gesetzt wird (legitime Architektur). Markiert uncertain gemäß §7.0 (Severity-Cap Weak, Confidence low). Zur Klärung fehlt: Betriebs-/Monitoring-ADR.
- **Fix-Richtung:** Mindestens einen Error-Reporter-Hook in `instrumentation.ts.register()` vorsehen (no-op ohne Env), damit nach Provisioning Alarme ohne Code-Change scharf werden.

## Geprüft & verworfen (refuted)
| Vermutung | Warum verworfen |
|-----------|-----------------|
| `stripe-reconcile` publiziert Subscription-Drift als `type:"audit.failed"` (stripe-reconcile.ts:113) → Kunde sieht im UI fälschlich einen „fehlgeschlagenen Audit". | Kein End-to-End-Pfad zum Impact: die SSE-Route `api/events/stream` existiert + ist getestet, aber **kein** Frontend-Consumer (kein `EventSource` in `components/`/`app/` außer Fehl-Treffer in Inspector.tsx = keydown-Listener). Event wird geschrieben, aber nie gerendert → per §7.0 „kein Pfad bis Impact = keine Finding". Latente Code-Smell-Notiz, kein Report-Finding. |
| Anonyme GitHub-URL-Audits brennen unbegrenzt LLM-Tokens auf dem Firmen-Key. | Reachable, aber durch `intensity:"quick"` (begrenzte LLM-Paare/maxPairs) + Anon-Rate-Limit 30/h pro IP gedeckelt; es ist der bewusst gewählte Demo-Pfad. Cost-Exposure real, aber bounded und intendiert → kein eigenständiges Finding (Ressourcen-Aspekt in S4-02 abgedeckt). |
| Inngest-`serve`-Endpoint akzeptiert unsignierte Requests (offener Audit-Trigger). | Widerlegt: `env.ts:81-91` erzwingt `INNGEST_SIGNING_KEY` in Cloud-Mode (Event-Key gesetzt, keine Base-URL) als fataler Prod-Boot-Fehler; `inngest/next serve()` liest den Key aus Env und verifiziert Signaturen. Korrekt abgesichert (Strong). |
| Background-`consume-credits` ignoriert Auto-Overage (Payload veraltet). | Widerlegt: `audit-requested.ts:73-85` liest `autoOverageEnabled` zur Laufzeit frisch aus `subscription` und reicht es an `consumeCredits`. Korrekt (Strong, K-PAY2). |

## Completeness self-check
- **Dynamisch ausgeführt:** `pnpm --filter @vk/web build` (Exit 0, da0babb nicht reproduziert) · `vitest` audit-action.test.ts (9/9) + inngest client.test.ts (5/5) grün. **Nicht ausgeführt:** kein Live-`inngest dev`-End-to-End-Lauf eines `audit/requested`-Events (Step-Retry-Semantik nur statisch aus dem Code verifiziert, nicht durch einen echten Re-Run beobachtet); kein Last-/OOM-Test gegen ein großes Repo (S4-02 statisch hergeleitet).
- **Unbestätigte Annahmen:** (1) dass kein verstecktes globales AI-SDK-Timeout via Provider-Default greift (grep = 0, aber undici/Provider-Defaults nicht zur Laufzeit gemessen); (2) S4-05-Severity hängt am nicht eingesehenen Monitoring-Betriebsmodell (Log-Drain vs SDK) → bewusst uncertain belassen; (3) SSE-Consumer könnte außerhalb von `apps/web/src` (z.B. künftiger Client) entstehen — heutiger Stand = kein Consumer, daher Drift-Finding verworfen.
