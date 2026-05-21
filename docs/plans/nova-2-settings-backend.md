# Plan — Nova-2 Settings Backend (Schemas + APIs)

> Erstellt: 2026-05-20
> Status: 🟡 In Review · Sub-Plan zu `nova-2-full-product.md` Phase 5
> Slug: `nova-2-settings-backend`
> Voraussetzung: Phase 5 Structural-Shell (SettingsLayout, /account/* + 10 Workspace-Sections, 3 UI-Komponenten) ist gemerged.

> **Priorisierungs-Update 2026-05-21 (aus `docs/audits/2026-05/settings-backend.md`):** 13 von 16 Settings-Sections sind reine Shells. Beta-Block-Priorität nach Mis-Selling-Risk:
>
> 1. **Danger-Zone** (transfer/delete) — höchster Mis-Selling-Risk; Placeholder bereits in repo-health Phase 1.18 durch EmptyState ersetzt. Hier echte Implementation.
> 2. **Notifications-Matrix** (`/account/settings/notifications` + `/[ws]/settings/notifications`) — voll gerenderte Toggle-Matrix ohne Backend, suggeriert Funktion.
> 3. **API-Keys + Webhooks** — disabled Buttons mit Generate/Add-Text.
> 4. **Account Sessions** — Better-Auth hat die Daten, 30-LoC-Query reicht.
> 5. **Account Delete** + **Account Connections** — V2-fähig.
> 6. **General / Audit-Apply / Galaxie** — niedrigste Beta-Priorität (kein Mis-Selling, nur "Coming soon").
>
> Audit-Report sieht `getGalaxieDataForWorkspace()` als EXCEPTIONAL Vorbild für DAL-Cache + Membership-Gate. Diesem Pattern folgen.

## 1. Ziel

Die 6 NEW Settings-Sections (General, API-Keys, Audit & Apply, Galaxie, Notifications, Webhooks, Danger) bekommen funktionale Backends. Plus die 5 /account-Sections (Profile editierbar, Sessions revokeable, Personal-Notifications persistiert, Connections-Plumbing, Delete-Account-Flow).

---

## 2. DB-Schemas (5 neue Tables + 2 Workspace-Columns)

### 2.1 `api_key`
```ts
export const apiKey = pgTable("api_key", {
  id: varchar("id", { length: 32 }).primaryKey(),
  workspaceId: varchar("workspace_id", { length: 32 }).notNull().references(() => workspace.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  scope: text("scope").notNull(), // 'read' | 'apply' | 'admin'
  tokenHash: text("token_hash").notNull(),          // SHA-256(plain)
  tokenPrefix: varchar("token_prefix", { length: 12 }).notNull(),  // visible identifier
  createdBy: varchar("created_by", { length: 32 }).notNull().references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
  revokedAt: timestamp("revoked_at"),
}, (t) => uniqueIndex("api_key_token_hash_unique").on(t.tokenHash));
```

### 2.2 `webhook`
```ts
export const webhook = pgTable("webhook", {
  id: varchar("id", { length: 32 }).primaryKey(),
  workspaceId: varchar("workspace_id", { length: 32 }).notNull().references(() => workspace.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  secret: text("secret").notNull(),  // HMAC signing key
  events: text("events").array().notNull(),  // ['scan.complete', 'finding.applied', …]
  active: boolean("active").notNull().default(true),
  lastDeliveryAt: timestamp("last_delivery_at"),
  lastDeliveryStatus: integer("last_delivery_status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

### 2.3 `notification_preference`
```ts
export const notificationPreference = pgTable("notification_preference", {
  id: varchar("id", { length: 32 }).primaryKey(),
  workspaceId: varchar("workspace_id", { length: 32 }).notNull().references(() => workspace.id, { onDelete: "cascade" }),
  // userId NULL means "workspace-default for any member"; non-null overrides for that user.
  userId: varchar("user_id", { length: 32 }).references(() => user.id, { onDelete: "cascade" }),
  eventId: text("event_id").notNull(),         // 'scan.complete' | 'finding.kill' | …
  channels: text("channels").array().notNull(), // ['email', 'slack', 'webhook', 'in-app']
  quietHoursStart: text("quiet_hours_start"),   // 'HH:MM' or null
  quietHoursEnd: text("quiet_hours_end"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => uniqueIndex("notification_pref_uniq").on(t.workspaceId, t.userId, t.eventId));
```

### 2.4 Workspace JSONB columns
```ts
// workspace.applySettings — Audit & Apply page
applySettings: jsonb("apply_settings").$type<{
  defaultMode?: 'read-only' | 'pr' | 'auto-merge';
  autoApplyThreshold?: 'kill' | 'weak' | 'mid' | 'strong';
  severityFilter?: SeverityBand[];
  llmRuleEnabled?: boolean;
}>(),

// workspace.galaxieDefaults — Galaxie settings page
galaxieDefaults: jsonb("galaxie_defaults").$type<{
  pulseOn?: boolean;
  zoomSpeed?: 'slow' | 'standard' | 'fast';
  reducedMotionMode?: 'auto' | 'on' | 'off';
  labelMode?: 'all' | 'folders' | 'hover';
}>(),
```

### 2.5 Migration
- [ ] Drizzle-Migration generieren mit `pnpm db:generate`
- [ ] Migration review (idempotent? backwards-compat?)
- [ ] `pnpm db:migrate` lokal
- [ ] Migration in `packages/db/drizzle/NNNN_settings_backend.sql`

---

## 3. API-Endpoints

### 3.1 API-Keys
- [ ] `POST /api/[workspace]/api-keys` — create (returns plaintext token exactly once)
- [ ] `GET /api/[workspace]/api-keys` — list (prefix + name + lastUsed only)
- [ ] `POST /api/[workspace]/api-keys/[id]/revoke` — set revokedAt
- [ ] Middleware: API-key-auth on protected routes (header `Authorization: Bearer vk_...`)

### 3.2 Webhooks
- [ ] `POST /api/[workspace]/webhooks` — create
- [ ] `GET /api/[workspace]/webhooks` — list
- [ ] `PATCH /api/[workspace]/webhooks/[id]` — toggle active / edit events
- [ ] `POST /api/[workspace]/webhooks/[id]/test` — synthetic ping
- [ ] Inngest job `webhook-deliver`: HMAC-sign body, POST, persist lastDelivery*

### 3.3 Notification-Prefs
- [ ] `PUT /api/[workspace]/notifications` — upsert matrix
- [ ] `GET /api/[workspace]/notifications` — fetch + defaults-merge

### 3.4 General + Audit&Apply + Galaxie (workspace JSONB)
- [ ] `PATCH /api/[workspace]/settings/general` — name/slug/logo/timezone
- [ ] `PATCH /api/[workspace]/settings/apply` — applySettings JSONB
- [ ] `PATCH /api/[workspace]/settings/galaxie` — galaxieDefaults JSONB

### 3.5 Danger
- [ ] `POST /api/[workspace]/transfer` — typed-confirm + new-owner-id
- [ ] `DELETE /api/[workspace]` — typed-confirm + 7-day-retention soft-delete

### 3.6 Account
- [ ] `PATCH /api/account/profile` — name / avatar / locale
- [ ] `GET /api/account/sessions` — list
- [ ] `POST /api/account/sessions/[id]/revoke` — revoke
- [ ] `PUT /api/account/notifications` — personal prefs
- [ ] `DELETE /api/account` — typed-confirm

---

## 4. UI-Wiring

- [ ] `ApiKeyModal` → wire `onCreate` callback to POST endpoint
- [ ] `NotificationMatrix` → load on mount, save-debounced on toggle (no manual Save-button — auto-save pattern)
- [ ] `DangerConfirm` → wire `onConfirm` to POST/DELETE
- [ ] General-Page → Form with auto-save for primitives, Save-button for slug-rename (needs validation + redirect-warning)
- [ ] Audit&Apply-Page → 4 toggles with auto-save
- [ ] Galaxie-Page → 4 toggles + slider, auto-save, "Use current popover-settings as default" CTA
- [ ] Webhooks-Page → list + add-modal (similar to ApiKeyModal but no reveal-once)

---

## 5. Test-Plan

- Unit:
  - api-key SHA-256 hash + prefix
  - webhook HMAC-signature
  - notification-pref merge-with-defaults logic
- Integration (vitest + msw):
  - Create API-key → list → revoke → use → 401
  - Save notifications → reload → state preserved
  - Webhook create → trigger event → delivery row created
- Manual:
  - All 5 /account pages save correctly
  - All 6 workspace-NEW pages save correctly
  - Slug-rename triggers redirect-banner
  - Delete-workspace 7-day-window works
- E2E: Playwright `settings-flows.spec.ts`

---

## 6. Risiken + Mitigation

| Risiko | Severity | Mitigation |
|---|---|---|
| API-Key-Token im Log | **Kill** | Logger redacted: substring `vk_` → `vk_***`. Token NIE persistiert plain |
| Webhook-Endpoint von User missbraucht (SSRF) | Strong | Outbound-IP-allowlist nicht möglich → strict URL-Schema-Check (https-only, no localhost / 169.254 / RFC1918) |
| Notification-Volumen-Spam (e.g. 1000 Findings → 1000 Mails) | Strong | Debounce + Quiet-Hours + Per-User-Rate-Limit (max 20 / Stunde) |
| Migration bricht workspace.applySettings für bestehende Rows | Mid | JSONB default `{}`, fields all optional in TypeScript |
| Slug-Rename bricht /[workspace]/*-Routen | Mid | Add temp redirect-row to `redirect` table für 90 Tage |
| Delete-Workspace-Cascade löscht Audit-Trail | **Strong** | Audit-Trail bleibt 12 Monate (compliance), nur workspace-Pointer wird nullable |

---

## 7. Open Questions

- **Q-SB-1**: API-Key-Token-Prefix-Schema — `vk_live_<base64url>` vs `vk_<base64url>` vs `vk_<env>_<base64url>` (Stripe-Pattern)?
- **Q-SB-2**: Webhook-Signing — HMAC-SHA256(secret, timestamp + body) header `X-VK-Signature`? Stripe-Pattern oder Linear-Pattern?
- **Q-SB-3**: Notification-Default — opt-in alle Events (lautly) vs opt-out (Kill/Weak/Strong nur)?
- **Q-SB-4**: Delete-Workspace-Window — 7 Tage Soft-Delete oder direkt-hart-Delete?

---

## 8. Status + Nächste Schritte

**Status:** 🟡 In Review by User.

**Reihenfolge:**
1. User reviewt Sub-Plan, klärt Open Questions.
2. `/execute nova-2-settings-backend` — geschätzt 2-3 Sessions (Schema-Migrationen + APIs + Wiring).

**Empfehlung:** **Nach** Phase 7 (Quality + Beta-Readiness) anstoßen. Settings sind nicht beta-blocking — die existing Settings funktionieren, die NEW Sections zeigen Coming-Soon-Stubs.

---

## 9. Anhang — Was bleibt in apps/web

Die UI-Stubs sind bereits gemerged. Diese Files warten nur auf die Backend-APIs:

- `apps/web/src/app/[workspace]/settings/{general,api-keys,audit-apply,galaxie,notifications,webhooks,danger}/page.tsx`
- `apps/web/src/app/account/settings/{profile,sessions,notifications,connections,delete}/page.tsx`
- `apps/web/src/components/settings/ApiKeyModal.tsx`
- `apps/web/src/components/settings/NotificationMatrix.tsx`
- `apps/web/src/components/settings/DangerConfirm.tsx`
- `apps/web/src/components/ui-vk/SettingsLayout.tsx`
