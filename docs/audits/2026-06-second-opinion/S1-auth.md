# S1 — Auth, Session & Multi-Tenant Access-Control · Second-Opinion Audit · 2026-06-10
Modell: Fable 5 (claude-fable-5) · Methode: static + targeted dynamic · read-only

## Threat-Model & In-Scope-Annahmen

**Angreifer (in Scope):**
- **A1 — Anonymer Web-User**: kein Cookie, kann beliebige HTTP-Requests/POSTs (inkl. Next.js Server-Action-Dispatch via `Next-Action`-Header) feuern.
- **A2 — Authentifizierter Tenant-User**: gültige Session, legitimes Mitglied *seines* Workspace, will an Daten/Schreibrechte *fremder* Workspaces (IDOR — die #1-B2B-SaaS-Bug-Klasse).
- **A3 — Böswilliges/niedrig-privilegiertes Mitglied** (`role=member`): legitimer Member eines Workspace, will Owner/Admin-Aktionen ausführen (Privilege-Escalation, billing-sensitive Settings).
- **A4 — Angreifer mit Source-/Pfad-Wissen** (Insider, geleakter Build, Ex-Mitarbeiter): kann deterministische Next.js-Action-IDs ableiten.

**Kronjuwelen:** Cross-Tenant-Daten (Customer-Listen, Findings/Solutions, Member-Emails, Install-Requests), Auth-Tokens/Sessions, Workspace-Integrität (fremde Workspaces beschreiben).

**Explizit out-of-scope (nicht erneut gemeldet):** Auth-IDOR in `customers.ts` (bekannt, Bundle A — ist inzwischen via `server-only` gefixt, verifiziert), GitHub-URL-Audit-Timeout (Bundle J), Stripe-Geldpfad (S2), SSRF der Repo-URL (S5).

**Load-bearing Annahme (für Severity):** Eine `"use server"`-Datei exportiert *jede* async-Funktion als öffentlich aufrufbaren Server-Action-Endpoint (Next.js-Sicherheitsmodell: „treat Server Actions as public HTTP endpoints"). Autorisierung MUSS *in* der Funktion passieren — Gating auf Seitenebene (Page-Component) wird beim direkten Action-Dispatch umgangen. Diese Annahme deckt sich mit der team-eigenen Remediation in `customers.ts` (K14: Wechsel `"use server"`→`server-only` „removes the RPC surface entirely").

---

## Findings (Übersicht)

| ID | Severity | go-live-blocker | Titel | file:line | verification |
|----|----------|-----------------|-------|-----------|--------------|
| S1-01 | Kill | yes | `customer-dal.ts` exportiert 5 ungescopte `"use server"`-Funktionen (Cross-Tenant Read **+ Write**) | apps/web/src/lib/customer-dal.ts:37,100,173,218,249 | verified |
| S1-02 | Weak | no | Gleiche Klasse, read-only: `install-requests`, `solution-dal`, `membership.listMembers` ungescopt | apps/web/src/lib/install-requests.ts:178; solution-dal.ts:90; membership.ts:29 | verified |
| S1-03 | Weak | no | Billing-sensitive Workspace-Settings nur auf Membership, nicht auf Rolle gegated | apps/web/src/lib/workspace-ai-actions.ts:99,116,30 | verified |
| S1-04 | Weak | no | Session-Revoke/Logout/Account-Delete: bis zu 300 s Stale-Session durch `cookieCache` | packages/auth/src/server.ts:117 | uncertain |

---

## Findings (Detail)

### S1-01 · `customer-dal.ts` — ungescopte Server-Actions mit Cross-Tenant Read+Write · Kill · go-live-blocker: yes

- **Evidenz:** `apps/web/src/lib/customer-dal.ts:1` + `:100` (Beispiel `getCustomerById`, identisch bei `listCustomers:37`, `addCustomer:173`, `updateCustomerApplyMode:218`, `addRepoUnderCustomer:249`):
  ```ts
  "use server";
  // ...
  export async function getCustomerById(
    workspaceId: string,      // ← client-supplied, NICHT serverseitig gegen die Session geprüft
    customerId: string,
  ): Promise<CustomerDetail | null> {
    // KEIN getSessionUser(), KEIN userIsMember(), KEIN requireWorkspaceAccess()
    const customerRows = await db.select().from(schema.customer)
      .where(and(eq(schema.customer.id, customerId),
                 eq(schema.customer.workspaceId, workspaceId)));
  ```
- **Impact/Exploit-Pfad:** Die Datei trägt `"use server"` (Zeile 1) → alle 5 Exporte sind registrierte, per HTTP aufrufbare Server-Actions. Bestätigt im Build-Manifest: `apps/web/.next/server/server-reference-manifest.json` listet 5 Action-IDs, deren `workers` auf `app/[workspace]/customers/page` + `.../[customerId]/page` zeigen, mit `customer-dal` im Modulpfad. Die Funktionen verlassen sich laut Kommentar darauf, dass „caller MUST have validated workspace-membership" — diese Prüfung lebt aber NUR in der Page (`app/[workspace]/customers/[customerId]/page.tsx:39` ruft `resolveWorkspaceFromSlug` vor `getCustomerById`). Beim direkten Action-Dispatch wird die Page nie ausgeführt. Ein Angreifer, der die Action-ID kennt, kann `getCustomerById(<fremde-workspaceId>, <fremde-customerId>)` / `listCustomers(<fremde-workspaceId>)` fahren (Cross-Tenant-**Read** von Customer-Detail, Repos, Scan-Severities) **und** `addCustomer` / `addRepoUnderCustomer` / `updateCustomerApplyMode` gegen einen **beliebigen fremden** Workspace (Cross-Tenant-**Write**/Integritätsbruch). Es ist exakt dieselbe Klasse, die das Team in `customers.ts` (K14) bereits als „cross-tenant IDOR" eingestuft und per `server-only` geschlossen hat — hier blieb sie offen.
- **Confidence:** mid
- **Verifikation:** verified — Widerlegungs-Fragen:
  1. *Gibt es ein Guard im Action-Dispatch?* Nein — Next.js hat keine per-Action-Auth; die Funktionen enthalten nachweislich keinen Session-/Membership-Check (volle Datei gelesen).
  2. *Ist der `(workspaceId, customerId)`-Compound-Match nicht schon der Schutz?* Nein — der Compound beweist nur, dass die Row *zur übergebenen workspaceId* gehört, nicht dass der *Aufrufer* zu diesem Workspace gehört. Der Integrationstest (`customer-dal.integration.test.ts`) prüft genau diesen Compound-Match und übergibt `workspaceId` direkt — er bestätigt damit, dass die Funktion der Aufrufer-Angabe vertraut.
  3. *Ist der Pfad erreichbar?* Manifest-bestätigt registriert. **Residual-Unsicherheit (Grund für Confidence=mid, nicht high):** Da keine *Client*-Komponente diese 5 Funktionen referenziert (alle Importeure server-seitig: 2 Pages + `customer-actions.ts` + `dal/galaxie.ts`), wird ihre Action-ID nicht ins Client-Bundle ausgeliefert. Ein rein anonymer Außentäter (A1) müsste die ID daher erraten/ableiten. Die IDs sind aber deterministische Build-Hashes (nicht secret-gekeyt) → für A4 (Source-/Pfad-Wissen) trivial, und die Lücke kippt sofort zu trivial-exploitable (A2), sobald irgendeine dieser Funktionen aus einer Client-Komponente referenziert wird.
- **Warum Kill / Launch-Block:** Ein registrierter, autorisierungsfreier Endpoint mit Cross-Tenant-**Schreib**fähigkeit ist ein Integritäts-/Leak-Vektor. „Security through ID-obscurity" ist laut Next.js-Sicherheitsmodell ausdrücklich KEIN anerkanntes Control, und der team-eigene Remediation-Standard (`customers.ts`) behandelt exakt diese Klasse als launch-blockierend. Auf eigener Domain für zahlende DACH-B2B-Kunden auszuliefern, während ein Schwester-File denselben Bug ungefixt trägt, ist ein GA-Blocker.
- **Fix-Richtung (1 Satz):** `customer-dal.ts` auf `import "server-only"` umstellen (RPC-Surface entfernen, wie `customers.ts`) ODER in jeder Funktion `requireWorkspaceAccess(workspaceId, sessionUser.id)` als erste Anweisung erzwingen.

---

### S1-02 · Gleiche Klasse, read-only: `install-requests` · `solution-dal` · `membership.listMembers` · Weak · go-live-blocker: no

- **Evidenz:**
  - `apps/web/src/lib/install-requests.ts:178` (`listRequestsForWorkspace`), `:206` (`listPendingRequestsForWorkspace`), `:244` (`listDecisionsForWorkspace`) — `"use server"`, nehmen `workspaceId`, kein Session-/Membership-Check; `listPendingRequestsForWorkspace` joint `schema.user.email`:
    ```ts
    export async function listPendingRequestsForWorkspace(workspaceId: string) {
      const rows = await db.select({ /* ... */ requesterEmail: schema.user.email })
        .from(schema.installRequest)
        .where(eq(schema.installRequest.workspaceId, workspaceId)); // caller ungeprüft
    ```
  - `apps/web/src/lib/solution-dal.ts:90` (`getSolution(findingId)`), `:109` (`getFindingWorkspaceId`), `:130` (`listSolutionStatusByFinding`) — `getSolution` liest die Solution-Row zu *beliebiger* `findingId` ohne jede Membership-Prüfung.
  - `apps/web/src/lib/membership.ts:29` (`listMembers(workspaceId)`) — `"use server"`, liefert Member-Liste inkl. `schema.user.email`, kein Aufrufer-Check.
- **Impact/Exploit-Pfad:** Identische Mechanik wie S1-01 (registrierte Server-Actions, Gating nur auf Page-Ebene), aber read-only und niedrigere Sensitivität. Bei Kenntnis der Action-ID: Cross-Tenant-Read von Install-Request-Historie + Requester-Emails, Solution-Inhalten und Member-Emails fremder Workspaces. Same Residual (ID nicht ins Client-Bundle ausgeliefert, da keine Client-Referenz) → deshalb Weak statt Kill, aber zusammen mit S1-01 ein systemisches Muster (siehe Cross-Cutting).
- **Confidence:** mid
- **Verifikation:** verified — die Funktionen sind vollständig gelesen, enthalten keinen Auth-Check; `apply-dal.ts`, `scan-status.ts`, `solution-dal.getOrGenerateSolution` (Gegenbeispiele) prüfen dagegen sauber `userIsMember(...)` in-function, was zeigt, dass die ungescopten oben echte Auslassungen sind, kein bewusster anonymer Endpoint.
- **Fix-Richtung (1 Satz):** Dieselbe Sammel-Maßnahme wie S1-01 — diese DAL-Module entweder auf `server-only` ziehen oder in-function `requireWorkspaceAccess` erzwingen.

---

### S1-03 · Billing-sensitive Settings nur auf Membership, nicht auf Rolle gegated · Weak · go-live-blocker: no

- **Evidenz:** `apps/web/src/lib/workspace-ai-actions.ts:22` (`loadWorkspace`) + `:99` (`toggleAutoOverage`):
  ```ts
  async function loadWorkspace(slug: string): Promise<WorkspaceCtx> {
    const user = await getSessionUser();
    if (!user) return { ok: false, error: "Sign in first." };
    const ws = await resolveWorkspaceFromSlug(slug, user.id); // nur Membership, KEINE Rolle
    return { ok: true, workspaceId: ws.id, slug: ws.slug };
  }
  // toggleAutoOverage / setSpendCap / updateByokSettings / setDefaultIntensity nutzen nur loadWorkspace
  ```
- **Impact/Exploit-Pfad:** `resolveWorkspaceFromSlug` lässt *jedes aktive Mitglied* durch (auch `role=member`). Damit kann ein niedrig-privilegierter Member (A3) `toggleAutoOverage` einschalten (→ Overage-Kosten auf der Rechnung des Owners), das `spendCap` setzen/entfernen, den BYOK-API-Key rotieren/löschen und die Default-Intensity ändern — alles billing-/sicherheits-relevante Owner-Entscheidungen. Intra-Tenant-Privilege-Gap, kein Cross-Tenant-Leak, daher Weak.
- **Confidence:** high
- **Verifikation:** verified — Widerlegung: *Werden diese Settings woanders zusätzlich rollen-gegated?* Nein, `loadWorkspace` ist der einzige Gate, und es ruft bewusst NICHT `requireRole`. Vergleich: `deleteWorkspace`/`revokeMember`/`inviteAdmin` gaten korrekt auf `owner`/`admin` — die Inkonsistenz bestätigt die Auslassung.
- **Fix-Richtung (1 Satz):** In `loadWorkspace` (bzw. den finanz-relevanten Aktionen) `requireRole(ws.id, user.id, ["owner","admin"])` ergänzen.

---

### S1-04 · Session-Revoke/Logout/Account-Delete: bis zu 300 s Stale-Session durch `cookieCache` · Weak · go-live-blocker: no

- **Evidenz:** `packages/auth/src/server.ts:117`:
  ```ts
  session: {
    cookieCache: { enabled: true, maxAge: 300 },
  },
  ```
- **Impact/Exploit-Pfad:** Better-Auth vertraut innerhalb des `maxAge`-Fensters dem signierten Cookie-Cache ohne DB-Lookup. Wird eine Session per `revokeSession` (session-actions.ts) von einem anderen Gerät widerrufen, oder das Konto via `deleteAccount` gelöscht (account-actions.ts löscht die Session-Rows), bleibt der bereits ausgelieferte Cookie-Cache des Ziel-Geräts bis zu 300 s gültig, weil der Server in diesem Fenster nicht gegen die (nun fehlende) DB-Row prüft. Für ein B2B-„Aktive-Sessions/Gerät-widerrufen"-Sicherheitsfeature ist ein 5-Minuten-Weiterleben eines widerrufenen Geräts ein realer, aber begrenzter Gap (kein Cross-Tenant, nur Self-Session). Der `revokeSession`-Kommentar behauptet, der Umweg über Better-Auths Revoke vermeide Stale-Devices — das gilt jedoch nur fürs *aktuelle* Gerät, nicht für den bereits ausgegebenen Cache eines *Remote*-Geräts.
- **Confidence:** mid
- **Verifikation:** uncertain — die exakte Better-Auth-`cookieCache`-Invalidierungssemantik bei Remote-Revoke ist aus dem Code allein nicht 100 % beweisbar (es ist Library-internes Verhalten); zur Klärung fehlt ein dynamischer Test (revoke auf Gerät A, Request auf Gerät B innerhalb 300 s). Daher max. Weak + Confidence mid, wie vom Protokoll verlangt.
- **Fix-Richtung (1 Satz):** `cookieCache.maxAge` für sicherheitskritische Flows senken oder bei Revoke/Delete eine serverseitige Invalidierungsliste (Token-Denylist) führen — andernfalls als akzeptiertes 5-min-Fenster dokumentieren.

---

## Geprüft & verworfen (refuted)

| Vermutung | Warum verworfen |
|-----------|-----------------|
| `proxy.ts` ist permissiv (Cookie-basierte Slug-Redirects ohne Membership-Check) → Auth-Bypass | Verworfen — Pages re-checken Membership immer via DAL (`resolveWorkspaceFromSlug`); verifiziert an `customers/[customerId]/page.tsx:39`. Der Proxy macht nur 308-Redirects, gewährt keinen Datenzugriff. |
| `customers.ts` `getRepo`/`listRepos`/`addRepo` IDOR | Verworfen als „neu" — bereits gefixt (`import "server-only"`, K14, Datei-Header) + in Known-Issues. Nicht erneut gemeldet. |
| Magic-Link-Token leakt in Logs/Referrer / ist replay-bar | Verworfen — `storeToken: "hashed"`, `expiresIn: 600`, Better-Auth-Default single-use; kein Logging der URL gefunden; Rate-Limit 3/10min/IP auf `/sign-in/magic-link`. Solide. |
| GitHub-Webhook ohne Signatur-/Replay-Schutz | Verworfen — `verifyWebhookSignature` nutzt HMAC-SHA256 + `timingSafeEqual` + Längen-Check (nur `x-hub-signature-256`); `install-webhook/route.ts` erzwingt `x-github-delivery` + Idempotenz-Row in `webhookEvent`. Korrekt. |
| `revokeMember`/`decideInstall`/`deleteWorkspace` Cross-Workspace-IDOR via fremde IDs | Verworfen — alle scopen Target-Lookup UND Mutation per `(id, workspaceId)`-Compound + Rollen-Check (K5-Fix in `membership.ts:231` sichtbar). |

---

## Was verifiziert „gut" ist (kein Finding, zur Einordnung)
- `authz.ts`-Helfer (`userIsMember`/`requireWorkspaceAccess`/`requireRole`/`requireMembership`) sind die saubere SSOT und durch 53 grüne Integration-Unit-Tests gedeckt (`pnpm exec vitest run`: 7 Files, 53 Tests pass).
- `resolveWorkspaceFromSlug` (workspace-context.ts) gated korrekt (active membership ODER legacy-owner), `cache()`-memoized.
- `account-actions.deleteAccount` blockt Sole-Owner, scrubbt PII vor FK-SET-NULL, cascade-löscht Sessions.

---

## Completeness self-check
- **Nicht erreicht/dynamisch unbewiesen:** Die *externe* Erreichbarkeit der ungescopten Server-Actions (S1-01/02) wurde NICHT live per HTTP-Replay bewiesen (hätte einen laufenden Dev-Server + Konstruktion eines `Next-Action`-Requests mit gültiger Action-ID erfordert); Beleg stützt sich auf das statische Build-Manifest (`server-reference-manifest.json`, 5 registrierte customer-dal-Actions) + Next.js-Sicherheitsmodell. S1-04 (cookieCache-Fenster) ist nicht dynamisch reproduziert (uncertain). `pnpm typecheck` wurde bewusst nicht laufen gelassen (parallele Sessions S3/S4, Build-Kollisions-Vermeidung); statt dessen targeted vitest (grün).
- **Unbestätigte Annahme:** Dass Next.js 16 ungenutzte (nur server-seitig referenzierte) `"use server"`-Exporte NICHT vollständig wegtree-shaked — für `customer-dal` widerlegt (Manifest zeigt 5 Actions), für `install-requests`/`solution-dal`/`membership` per Analogie angenommen, nicht je einzeln im Manifest verifiziert. Falls Tree-Shaking sie doch entfernt, sinkt S1-02 auf reines Defense-in-Depth.
- **Offene Folge-Frage für S8:** Das „use server"-DAL-ohne-in-function-Auth-Muster ist cross-cutting (mind. 4 Module, 12 Funktionen) — gehört als systemisches Muster konsolidiert, nicht pro Datei.
