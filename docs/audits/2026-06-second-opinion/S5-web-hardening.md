# S5 — Web-Platform-Hardening, Secrets & Config · Second-Opinion Audit · 2026-06-10
Modell: Fable 5 · Methode: static + targeted dynamic (build-grep + curl gegen `next start` :3105) · read-only

## Threat-Model & In-Scope-Annahmen
- **Angreifer:** (a) anonymer Web-User, der die öffentliche Anon-Audit-Form bzw.
  Repo-URL-Eingabe missbraucht; (b) authentifizierter Tenant-User, der über
  user-gelieferte URLs interne Infrastruktur erreichen will (SSRF); (c) passiver
  Angreifer, der das ausgelieferte Client-Bundle nach Secrets durchsucht;
  (d) XSS-Payload-Autor, der gegen die CSP testet; (e) Email-Bomber gegen den
  Magic-Link-Versand.
- **Kronjuwelen:** Server-Secrets (AUTH_SECRET, STRIPE_SECRET_KEY, RESEND/SMTP,
  DATABASE_URL, GITHUB_TOKEN, BYOK-Key) · interne Netz-Adressen
  (169.254.169.254, localhost, file://) · Auth-/CSRF-Integrität · DSGVO-PII.
- **In-Scope (S5):** Security-Header/CSP, CORS, Rate-Limiting auf Auth+teuren
  Pfaden, Env-Validierung + Secrets-Hygiene (Bundle-Leak), jede Stelle die eine
  USER-URL fetcht (SSRF).
- **Explizit out-of-scope:** Auth-IDOR `customers.ts` (Bundle A), Stripe-Geldpfad
  (Bundle B), Migration-Advisory-Lock (Bundle C), Inngest/GitHub-Webhook-
  Signatur-Logik selbst (S4-Domäne), pgvector, B2C-Cookie-Banner, User-externe
  Provisioning-Tasks (Sentry/Upstash/KV, Domain-Kauf, Stripe-Live-KYC).
- **Filter-Notiz:** Threat-Model-Fehlausrichtung = #1-FP-Quelle. Eine Finding
  zählt nur, wenn der Pfad bis zum Impact gezogen werden konnte.

## Findings (Übersicht)
| ID | Severity | go-live-blocker | Titel | file:line | verification |
|----|----------|-----------------|-------|-----------|--------------|
| S5-01 | Weak | no | CSP nur Report-Only + ohne Report-Sink (Beobachtung verpufft) + permissive script/connect-Directives | apps/web/next.config.ts:34 | verified |
| S5-02 | Mid | no | CSP `blob:`/`worker-src blob:`/`img blob:` nur durch retired PixiJS begründet — toter Grant erweitert Angriffsfläche | apps/web/next.config.ts:24,28 | verified |
| S5-03 | Weak | no | In-Memory-Rate-Limits über Fluid-Compute-Instanzen multiplizierbar — Magic-Link-Email-Bomb-Limiter (3/10min/IP) nur per-instance | packages/auth/src/server.ts:106 | verified |

## Findings (Detail)

### S5-01 · CSP nur Report-Only + ohne Report-Sink + permissive Directives · Weak · go-live-blocker: no
- **Evidenz:** `apps/web/next.config.ts:34` (statisch) + Laufzeit-Curl:
  ```ts
  const SECURITY_HEADERS = [
    { key: "Content-Security-Policy-Report-Only", value: CSP_DIRECTIVES },
    // … HSTS / X-Frame-Options / nosniff / Referrer / Permissions enforced
  ];
  ```
  `curl -sI http://localhost:3105/` (prod `next start`) bestätigt: nur
  `Content-Security-Policy-Report-Only:` wird gesendet, **kein** enforced
  `Content-Security-Policy:`-Header. Die Policy enthält zudem **keine**
  `report-uri` / `report-to` / `reporting-endpoints`-Direktive — Browser
  erzeugen Violation-Reports, die ins Leere laufen.
- **Impact/Exploit-Pfad:** (1) Report-Only ist nicht durchgesetzt → bei einer
  reflektierten/DOM-XSS-Lücke greift CSP nicht als Mitigation; die im Code
  geplante „24h-Beobachtung dann enforce" produziert **null verwertbare Daten**,
  weil kein Report-Sink verdrahtet ist — der Flip-Entscheid ist blind. (2) Selbst
  enforced bleibt `script-src 'unsafe-inline' 'unsafe-eval'` + `connect-src 'self'
  https:` (jeder HTTPS-Host als Exfil-Ziel) eine schwache XSS-Containment.
- **Confidence:** high
- **Verifikation:** verified — Widerlegungs-Fragen: (Q1) Wird vielleicht woanders
  ein enforced CSP gesetzt (middleware/proxy/route)? → `grep` über next.config +
  `src` findet keine zweite CSP-Quelle; `proxy.ts` setzt nur Redirects, keine
  Header. (Q2) Gibt es einen Report-Endpoint, den ich übersehe? → `grep -rn
  "report-uri|report-to|reporting-endpoints|sentry"` über next.config + src = 0
  Treffer; Sentry ist laut Repo-Stand noch nicht provisioniert. (Q3) Ist der
  Header in prod überhaupt aktiv? → Curl gegen `next start` zeigt ihn live. →
  Bestätigt. Severity bleibt **Weak**, nicht Kill: die launch-kritischen
  Clickjacking-/Transport-/MIME-Schutzschichten (X-Frame-Options SAMEORIGIN,
  HSTS preload, X-Content-Type-Options nosniff) sind **enforced** und per Curl
  verifiziert — CSP ist hier Defense-in-Depth, kein einziges Schloss.
- **Fix-Richtung (1 Satz):** Vor dem Enforce-Flip einen Report-Sink verdrahten
  (`report-to` + Reporting-Endpoint, sobald Sentry/Upstash steht) und beim Flip
  `connect-src` auf die echten Hosts (Stripe-API, Inngest, Neon) verengen.

### S5-02 · CSP-`blob:`-Grants nur durch retired PixiJS begründet · Mid · go-live-blocker: no
- **Evidenz:** `apps/web/next.config.ts:13,24,28`
  ```ts
  //   - blob: worker-src + blob:/data: img: PixiJS v8 WebGL (workers, textures).
  "img-src 'self' data: blob: https:",
  "worker-src 'self' blob:",
  ```
- **Impact/Exploit-Pfad:** Galaxie/PixiJS ist seit 2026-06-10 vollständig retired
  (Stack-Note: „PixiJS … komplett entfernt"). Die einzige dokumentierte
  Begründung für `worker-src blob:` (und `img blob:`) war PixiJS-WebGL. Der Grant
  erlaubt jetzt ungenutzt das Laden von Web-Workern/Bildern aus `blob:`-URLs —
  ein klassischer XSS-Bootstrap-Vektor (Payload baut `blob:`-Worker), der mit
  dem retired Feature wegfallen sollte. Reines Hardening, kein aktiver Exploit.
- **Confidence:** mid (kann nicht 100% beweisen, dass kein verbliebener Pfad —
  z.B. ein PDF-/Canvas-Export — `blob:`-Worker nutzt; daher Mid, nicht Strong-Fix).
- **Verifikation:** verified (als Dead-Grant) — Widerlegungs-Fragen: (Q1) Nutzt
  `motion/react` (der Pixi-Ersatz) `blob:`-Worker? → motion läuft auf
  Main-Thread-rAF, kein Worker-Bedarf. (Q2) Gibt es noch Pixi-Imports? → laut
  CLAUDE.md + Stack-Tabelle Pixi-Code+Deps entfernt. → Grant ist verwaist.
- **Fix-Richtung (1 Satz):** `blob:` aus `worker-src`/`img-src` entfernen (und den
  Pixi-Kommentar), sofern ein kurzer Grep nach `new Worker(`/`createObjectURL`
  im Client-Code leer bleibt.

### S5-03 · In-Memory-Rate-Limits über Instanzen multiplizierbar (Magic-Link-Email-Bomb) · Weak · go-live-blocker: no
- **Evidenz:** `packages/auth/src/server.ts:106` + `apps/web/src/lib/rate-limit.ts:39`
  ```ts
  rateLimit: {                                  // better-auth, in-memory/instance
    window: 60, max: 100,
    customRules: { "/sign-in/magic-link": { window: 600, max: 3 } },
  },
  // rate-limit.ts: const buckets = new Map<string, number[]>();  // per-region
  ```
- **Impact/Exploit-Pfad:** Beide Limiter (better-auth Auth-Endpoints **und** die
  App-eigene `checkRateLimit` für Anon-Audits) halten ihren Zähler in einer
  prozess-lokalen `Map`. Auf Vercel Fluid Compute (multi-region/multi-instance)
  landet ein Angreifer durch Verteilung über Cold-Start-Instanzen in
  verschiedenen Buckets → das effektive Limit ist `max × Instanzenzahl`. Konkret
  am sensibelsten: der Magic-Link-Versand (3/10min/IP) ist der Email-Bomb-Schutz;
  per-instance umgangen kann ein Angreifer ein Opfer-Postfach (bzw. das
  Resend-Sendekontingent/Kosten) deutlich stärker fluten als die 3/10min nahelegen.
- **Confidence:** mid
- **Verifikation:** verified (Mechanik), Impact bewusst als Weak eingestuft —
  Widerlegungs-Fragen: (Q1) Gibt es schon eine geteilte Storage (KV/Redis)? →
  Code-Kommentare sagen explizit „in-memory … swaps to KV … once provisioned";
  `REDIS_URL` existiert nur für Local-Dev (kein Client-Wiring laut Tech-Stack-
  Note). (Q2) Ist das nicht ein bereits bekanntes Issue? → Es steht **nicht** auf
  der KNOWN-ISSUES-Liste dieses Audits; im Code als Phase-2-Defer dokumentiert,
  aber der konkrete Email-Bomb-Amplifikations-Impact ist der neue Aspekt. →
  Behalten, Severity Weak (kein Geldverlust/Cross-Tenant-Leak; Resend hat eigene
  Provider-Limits als Backstop).
- **Fix-Richtung (1 Satz):** Den Magic-Link-/Anon-Audit-Limiter auf geteilten
  Storage (Vercel KV/Upstash, better-auth `secondaryStorage`) heben, bevor die
  Domain live an zahlende Kunden geht — bis dahin als bewusstes Restrisiko führen.

## Geprüft & verworfen (refuted)
| Vermutung | Warum verworfen |
|-----------|-----------------|
| **SSRF über user-gelieferte GitHub-Repo-URL** (`apps/web/src/lib/github-fetch.ts:53-68`, `audit-action.ts:222`) | Host ist hart auf `codeload.github.com` / `api.github.com` betoniert; der user-Input liefert nur `owner`/`repo`/`ref`, die `parseGithubUrl` per Regex auf slash-freie Tokens (`[^/\s]+`) gegen `github.com` beschränkt — kein `@host`-, `file://`-, `169.254.*`- oder `localhost`-Pivot möglich. `redirect:"follow"` folgt nur GitHub-eigenen Redirects. **Verdict: kein SSRF — host-locked, gut designt (Strong).** |
| **Secrets im Client-Bundle** | Grep der gebauten `.next/static`-Chunks nach `AUTH_SECRET\|STRIPE_*\|RESEND_*\|DATABASE_URL\|GITHUB_TOKEN\|BYOK\|whsec_\|sk_live_\|re_\|postgres://` → keine **Werte**. Die einzigen Treffer: (a) better-auth Telemetrie-Shim mit Getter-**Namen** (`get AUTH_SECRET(){return a(...)}`) — Wert auf Client `undefined`; Gegenprobe mit dem echten `AUTH_SECRET`-Wert aus `.env.local` → **nicht** im Bundle; (b) `"sk-ant-...redacted"`/`"ghp_redacted"` = absichtlich redigierte Demo-Fixtures. **Verdict: sauber (Strong).** |
| **Fehlende/abschaltbare Security-Header** | Curl gegen prod `next start` bestätigt enforced: HSTS (`max-age=63072000; includeSubDomains; preload`), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo/browsing-topics off). Gelten auch auf API-Routen (`source: "/:path*"`). **Verdict: solide.** |
| **Permissive CORS (`*` mit credentials)** | `curl -H "Origin: https://evil.example"` gegen `/api/auth/*` reflektiert **kein** `Access-Control-Allow-Origin`; CSRF/CORS via better-auth `trustedOrigins` allow-list (`resolveTrustedOrigins`, default = `AUTH_BASE_URL`). **Verdict: kein CORS-Loch.** |
| **Fehlende Env-Validierung / Silent-Misconfig** | `apps/web/src/env.ts` + `instrumentation.ts` `register()` failen in prod **fatal** bei fehlenden Vars (bei meinem `next start`-Lauf live verifiziert: Boot brach mit „NEXT_PUBLIC_APP_URL required" ab, statt einen kaputten Server zu serven). Conditional-Deps („feature on ⇒ dep required") für Stripe-Webhook-Secret, Inngest-Signing-Key, BYOK-Key-Bytelänge. **Verdict: vorbildlich (Exceptional-nahe).** |

## Completeness self-check
- **Nicht erreicht/gelesen:** Kein Dev-Server auf :3105 möglich (Next-16
  Single-Instance-Lock — Port 3000 gehört einer Parallel-Session); Header-/CORS-
  Evidenz daher gegen `next start` (prod-build) statt dev — für Header/CSP
  äquivalent, aber keine Live-CSP-Violation-Provokation im Browser (Playwright
  env tot). Better-Auth interne Rate-Limit-Storage-Semantik nur aus Config +
  Kommentaren abgeleitet, nicht im Lib-Quellcode verifiziert. Habe nicht jeden
  der ~25 `process.env`-Reads einzeln getraced, sondern client-Komponenten
  gezielt auf Non-`NEXT_PUBLIC`-Lecks gegrept (0 Treffer).
- **Unbestätigte Annahme:** Dass auf prod tatsächlich kein KV/Redis für
  Rate-Limiting verdrahtet ist (aus Code-Kommentaren + Tech-Stack-Note
  geschlossen, nicht gegen die Live-Vercel-Env geprüft — S5 ist read-only/lokal).
  Dass kein verbleibender Client-Pfad `blob:`-Worker braucht (motion-only
  angenommen; nicht erschöpfend gegen `createObjectURL`/`new Worker` gegrept).
