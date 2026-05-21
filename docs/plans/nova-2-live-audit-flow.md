# Plan — Nova-2 Live-Audit-Flow (Landing-Anonymous-Audit)

> Erstellt: 2026-05-20
> Status: 🟡 In Review · Sub-Plan zu `nova-2-full-product.md` Phase 4
> Slug: `nova-2-live-audit-flow`
> Voraussetzung: Phase 4 Auth-Polish ist gemerged (Better-Auth-Config, MagicLinkEmail, /auth/verify, LoginForm-Polish, ActivationChecklist).

## 1. Ziel

Auf der Landing-Page (`/`) kann ein anonymer Visitor seine eigene GitHub-Repo-URL eingeben und sieht innerhalb von ≤30 s eine **echte progressive Audit-Galaxie** mit seinen eigenen Findings. Nach 3 Findings stoppt eine Soft-Wall und fordert zum Sign-in auf. Nach Login wird derselbe Scan ohne Re-Run wiederhergestellt.

---

## 2. Endzustand

| Aspekt | Konkret |
|---|---|
| Eingabe | URL-Input auf `/`, `https://github.com/<owner>/<repo>` |
| Anonyme Pipeline | GitHub-Tarball-Download (kein git clone), tmp-Dir, scanRepository, runAudit, persist als anonymous-scan |
| Progressive UI | SSE-Stream: Loading-Skeleton → erste Finding-Sphäre erscheint → weitere streamen rein |
| Soft-Wall | Nach 3 Findings: 4. Sphäre erscheint blurred, Magic-Link-Form inline drunter ("Sign in to unlock") |
| Auto-Resume | Anonymous-Scan-Id im URL/Cookie; nach Login wird Scan an User-ID re-attached und Galaxie zeigt dieselben Findings |
| Anti-Abuse | Rate-Limit per-IP (3 Scans / Stunde), Cache-Hit auf gleiche Repo-URL (12h), max-Repo-Size (50 MB pre-tar.gz) |
| Sichtbar in App | Nach Sign-in steht der anonyme Scan in `/[workspace]/scans/` mit Apply-Buttons aktiviert |

---

## 3. Schritte

### 3.1 Backend — Anonymous-Scan-Pipeline

- [ ] Schema-Migration: `scan` table → erlaube `userId = null` für anonymous-scans + neue Spalte `anonymous_token` (uuid, indexed) + `claimed_at` (timestamp nullable)
- [ ] `lib/anonymous-audit.ts`: GitHub-Tarball-Download via `https://codeload.github.com/<owner>/<repo>/tar.gz/<branch>` (kein git, kein clone — pure tarball). Extract in tmp-Dir mit `tar -xz`. Strip top-level dir.
- [ ] Rate-Limit-Middleware: `lib/anonymous-rate-limit.ts` — Redis (oder DB-table `anonymous_request_log`) mit per-IP-Bucket. 3 Scans / IP / Stunde.
- [ ] Cache-Lookup: SHA-256(repo-url + branch) → existing scanId. 12 h TTL. Cache-Hit returnt sofort den vorhandenen Scan.
- [ ] Inngest-Job `anonymous-audit/requested` (neu): {tarballPath, anonymousToken, scanId} → scanRepository + runAudit + persist + emit SSE-events via Inngest-`step.sendEvent` zu `audit/progress`
- [ ] Cleanup-Job: anonymous-scans älter als 7 Tage ohne `claimed_at` → DELETE

### 3.2 Frontend — Landing-Flow

- [ ] `apps/web/src/components/landing/LiveAuditFlow.tsx`: Komponentenbaum
  - State: `idle` | `submitting` | `cloning` | `auditing` | `streaming-findings` | `soft-walled` | `signed-in-resuming`
  - URL-Input (Lucide GitMerge icon) + "Free Audit"-Button
  - Skeleton-Galaxie während `cloning` + `auditing` (28-32 grey spheres, slowly fade in)
- [ ] SSE-Endpoint `/api/anonymous-audit/[scanId]/stream` (existing `events/stream` Pattern)
  - Streamt Findings progressiv: 1, 2, 3 voll sichtbar → 4 mit `blurred: true` flag
  - Heartbeat alle 15 s gegen Edge-timeout
- [ ] Soft-Wall-Komponente: blurred 4. Sphäre + Magic-Link inline-Form
  - LoginForm-Variante mit `callbackURL: /auth/verify?next=/?resume=<anonymousToken>`
  - "X more findings hidden, sign in to unlock"
- [ ] Auto-Resume-Logik in `/page.tsx`:
  - Wenn `?resume=<token>` UND signed-in → POST `/api/anonymous-audit/claim` mit token
  - Backend re-attached scan an user.workspaceId, setzt `claimed_at`
  - Redirect zu `/[workspace]/scans/<scanId>` (echte App)

### 3.3 Hardening

- [ ] Repo-Size-Pre-Check: HEAD `codeload.github.com/<owner>/<repo>/tar.gz` → check `Content-Length` (best-effort, GitHub liefert oft nicht). Fallback: stream + abort wenn > 50 MB.
- [ ] Audit-Trail-Eintrag pro anonymous-Scan (IP, UA, repo-url) — auch wenn nie geclaimt — für Abuse-Analyse
- [ ] CSP: `connect-src` whitelist nur eigene Origin + `codeload.github.com`

---

## 4. Files-to-Change

| Datei | Status | Was passiert |
|---|---|---|
| `packages/db/src/schema.ts` | UPDATE | `scan.userId nullable` + `scan.anonymousToken` + `scan.claimedAt` + neue Table `anonymous_request_log` |
| `packages/db/drizzle/NNNN_anonymous_scan.sql` | NEU | Migration |
| `apps/web/src/lib/anonymous-audit.ts` | NEU | Tarball-Download + Extract |
| `apps/web/src/lib/anonymous-rate-limit.ts` | NEU | Per-IP-Bucket |
| `packages/inngest/src/functions/anonymous-audit.ts` | NEU | Job |
| `apps/web/src/app/api/anonymous-audit/[scanId]/stream/route.ts` | NEU | SSE-Endpoint |
| `apps/web/src/app/api/anonymous-audit/claim/route.ts` | NEU | Claim-Endpoint |
| `apps/web/src/components/landing/LiveAuditFlow.tsx` | NEU | UI-Wrapper |
| `apps/web/src/app/page.tsx` | UPDATE | Resume-Logik + LiveAuditFlow rendern unterhalb der existierenden Demo-Galaxie |

---

## 5. Test-Plan

- Unit: `anonymous-audit.ts` mit fake Tarball-Stream — Extract, Cleanup, Size-Abort
- Unit: `anonymous-rate-limit.ts` — 3 erlaubt, 4. wirft 429
- Manuell: Public-Repo (z.B. `vercel/next-learn`) → Audit läuft durch → 3 Findings → Magic-Link → nach Login Galaxie zeigt selben Scan
- Manuell: Rate-Limit-Hit (4. Scan / IP / Stunde) → 429 mit "try again in X minutes"
- Manuell: Repo > 50 MB (e.g. `microsoft/vscode`) → Pre-Check oder Stream-Abort → Friendly-Error
- E2E: Playwright Smoke `landing-anonymous-audit.spec.ts`

---

## 6. Risiken + Mitigation

| Risiko | Severity | Mitigation |
|---|---|---|
| GitHub-Rate-Limit (60 req/h ohne Auth) | **Kill** | Tarball-Endpoint hat eigenes higher Limit; eigener IP-Bucket schützt zusätzlich |
| LLM-Token-Spam (jeder Visitor zahlt €) | Strong | Deterministic-Audit-Rules first; LLM-Augmentation nur wenn signed-in. Anonymous = nur 5 Rules ohne LLM |
| Riesige Repos blocken Tmp-Disk | Strong | Size-Pre-Check + Stream-Abort bei 50 MB |
| User klaut anonymous-Scan eines anderen via Token-Guess | Mid | UUIDv4 mit 128 Bits Entropie — nicht ratbar |
| Anonymous-Scans bleiben für immer in DB | Weak | Cleanup-Cron 7 Tage |
| Soft-Wall fühlt sich "dark-patterny" an | Mid | Klare Copy: "3 findings shown, X more available with sign-in". Plus: kein blocking-modal, Magic-Link inline mit no-friction |

---

## 7. Open Questions

- **Q-LAF-1**: Branch-Selector? Default `main` ODER auto-detect (`master` vs `main`) ODER User wählt? Vermutlich Auto-detect via GitHub-API `GET /repos/:owner/:repo`.
- **Q-LAF-2**: Was zeigt die Landing, wenn der User schon signed-in ist und auf `/` landet? Soll Demo-Galaxie weiterhin gezeigt oder direkt auf `/[workspace]` redirected werden?
- **Q-LAF-3**: Private Repos — komplett-Skip oder "Sign in with GitHub OAuth"-Pfad? V2 oder MVP?
- **Q-LAF-4**: Anonymous-Token im URL (sharable, leak-risk) oder httpOnly-Cookie (nicht sharable)? Default empfehle Cookie.

Diese werden vor `/execute nova-2-live-audit-flow` geklärt.

---

## 8. Status + Nächste Schritte

**Status:** 🟡 In Review by User.

**Reihenfolge:**
1. User reviewt diesen Sub-Plan, klärt Open Questions.
2. `/execute nova-2-live-audit-flow` → Multi-Session-Implementation.
3. Vorher: Phase 5 (Settings-Restructure) + Phase 6 (Mobile) + Phase 7 (Quality) im Master-Plan abarbeiten, da diese unabhängig sind und schneller fertig werden.

**Empfehlung:** Live-Audit-Flow als LAST work-item vor Beta-Launch, weil es Conversion-kritisch ist aber Hardening braucht (Anti-Abuse) — kein "ship it früh"-Kandidat.
