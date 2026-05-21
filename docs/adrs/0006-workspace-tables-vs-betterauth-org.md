---
id: 0006
title: Workspaces in eigener Drizzle-Tabelle, nicht via Better-Auth Organization-Plugin
status: accepted
date: 2026-05-21
---

# ADR-0006 — Workspaces in eigener Drizzle-Tabelle, nicht via Better-Auth Organization-Plugin

> Datum: 2026-05-21 (post-hoc Doku des Patterns aus Sprint 0.4 / Sprint G2)
> Status: ✅ Accepted
> Entscheider: post-hoc Doku-Pflicht aus Repo-Health-Audit (siehe `docs/audits/2026-05/settings-backend.md` + `context-files.md`)

---

## Kontext

Vor dieser ADR-Schreib-Phase behaupteten `docs/vision.md` (Z. 105, 119) und sinngemäß auch `.claude/CLAUDE.md`, dass Multi-Workspace via Better-Auth Organization-Plugin gelöst sei (`setActive(workspaceSlug)` server-side im Layout, "Multi-Org out of box"). Tatsächlich ist das Plugin **nicht in Verwendung**:

- `packages/auth/src/server.ts:81–93` initialisiert Better-Auth nur mit dem `magicLink`-Plugin.
- Workspaces leben in der eigenen Drizzle-Tabelle `workspace` (`packages/db/src/schema.ts:72`), mit Join-Table `membership` für User↔Workspace-Bindung.
- Das Membership-Gate sitzt in `apps/web/src/app/[workspace]/layout.tsx` und validiert per `listUserWorkspaces(userId)` aus `lib/dal/galaxie.ts`.
- Slug-Resolution macht `getTenantContext(workspaceSlug)` (React.cache memoized) — kein Better-Auth-Org-Helper.

Das Repo-Health-Audit 2026-05-21 hat den Doku ↔ Code Drift aufgedeckt. Diese ADR dokumentiert die Build-vs-Buy-Entscheidung **post-hoc**.

## Entscheidung

Multi-Tenant über **eigene Drizzle-`workspace` + `membership` Tabellen**, **nicht** über Better-Auth Organization-Plugin.

Konkret:

- `workspace` Tabelle: `id (uuid)`, `slug (varchar unique)`, `name`, `ownerId → user.id`, `createdAt`.
- `membership` Tabelle: `userId → user.id`, `workspaceId → workspace.id`, `role (admin/member)`, composite PK.
- Membership-Gate via Direct-Drizzle-Query in `getTenantContext(workspaceSlug)` (memoized via React.cache pro Request).
- Cache-Tagging: `workspace:<id>:<resource>` + `workspace:<id>` (siehe DAL-Pattern `lib/dal/galaxie.ts:264–295`).

## Optionen, die wir verworfen haben

- **Better-Auth Organization-Plugin:** Verworfen — bringt Schema-Tables, die wir bereits anders modelliert haben (Multi-Tenant über workspace_id-Column-Discriminator + URL-Slug, nicht über `activeOrganizationId` im Session-Token). Migration vom eigenen Modell zum Plugin-Modell würde Daten umkopieren und das `setActive`-Pattern erzwingen, das in einer App-Router-RSC-Welt friction stiftet (Client-Component müsste `setActive` triggern, dann Server-Refresh).
- **Multi-Schema-Postgres** (eigenes Schema pro Workspace): Verworfen — Operations-Komplexität (Migrations pro Schema), zu klein für Single-Workspace-pro-User-Anfangsphase.
- **Row-Level Security ohne workspace-Column:** Verworfen — Drizzle hat keine native RLS-Helper, manuell-konfigurierte RLS bei jedem Schema-Change ist Solo-Dev-Friction.

## Consequences

**Positiv:**

- **Direct-Drizzle-Queries** für Membership — testbar, type-safe, kein Plugin-Abstraction-Layer dazwischen.
- **URL-Slug-Pattern** `/[workspace]/...` ist Routing- statt Session-State — Slug-Hijacking-Schutz via Layout-Membership-Check ist explizit und review-bar.
- **Eigenes role-Modell** (`admin`/`member` aktuell, erweiterbar) — keine Better-Auth-Plugin-API als Constraint.
- **Migration-Path zum Plugin offen** falls jemals nötig: workspace + membership könnten beim Plugin als zusätzliche User-Tabellen leben.

**Negativ:**

- **`setActive(workspaceSlug)`-Pattern verfügbar nicht** — Workspace-Switch erfordert URL-Change, nicht Server-Action mit Cookie-Update. Akzeptabel für Multi-Workspace-Lena-User (3–10 Workspaces), suboptimal für 100+-Workspaces (kein "Recent Workspaces"-Dropdown ohne extra State).
- **Audit-Trail der Membership-Changes** muss selbst gebaut werden (Better-Auth Org-Plugin hätte das bekommen via `organization_invite`-Table).
- **Org-Invite-Flow** muss selbst gebaut werden (siehe `nova-2-settings-backend.md` /[ws]/settings/members, bisher read-only).

## Re-Open-Trigger

- ≥3 Org-Hierarchie-Levels nötig (z.B. Mega-Agency → Sub-Agency → Customer-Workspace) — würde eigenes Schema-Modell überfordern.
- Better-Auth ändert Org-Plugin auf ein Pattern, das URL-Slug-first natürlich unterstützt.
- Konkurrenz-Pattern in der DACH-Solo-Agency-Tooling-Landschaft wechselt zu Plugin-basierten Org-Modellen mit Vorteilen, die wir nicht selbst nachbauen wollen.
