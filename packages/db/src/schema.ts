import { relations, sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Better-Auth tables (per Better-Auth Postgres adapter contract). Field names
// match the upstream defaults so the adapter wires up without overrides.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // Bundle C: Better-Auth reads session by user_id on every request.
  index("session_user_idx").on(t.userId),
]);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // Bundle C: Better-Auth resolves the account by user_id on the login path.
  index("account_user_idx").on(t.userId),
]);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ValidationKit-domain tables.

// Nova-3a Bundle A (Sub-4 K2): ownerId is nullable + ON DELETE SET NULL so a
// user-delete does NOT wipe the workspace. After a user delete, ownership
// transfers to the membership row with role='owner' (validated in the DAL).
// PII-scrub on user-delete is implemented: apps/web/src/lib/pii-scrub.ts runs
// before the user row is deleted (Bundle A Phase 4, account-actions.ts).
export const workspace = pgTable("workspace", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id").references(() => user.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // Bundle C: ensureDefaultWorkspace + legacy-owner fallback look up by owner_id.
  index("workspace_owner_idx").on(t.ownerId),
]);

// Sprint G2 — Customer as a first-class layer between workspace and repo.
// ADR-0001 (C2): "1 Customer = 1 Kunden-Org mit N Repos" is the chosen model.
// `default_apply_mode` carries forward to Sprint G5 PR-vs-Direct apply UX.
export const customer = pgTable(
  "customer",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    defaultApplyMode: varchar("default_apply_mode", { length: 20 })
      .notNull()
      .default("pr"),
    githubOrg: text("github_org"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("customer_workspace_slug_unique").on(t.workspaceId, t.slug),
    index("customer_workspace_idx").on(t.workspaceId),
  ],
);

export const repo = pgTable(
  "repo",
  {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  // Sprint G2 — repo now belongs to a customer (nullable during backfill window).
  customerId: uuid("customer_id").references(() => customer.id, {
    onDelete: "set null",
  }),
  // Sprint G2 — per-repo apply mode override (falls back to customer.defaultApplyMode).
  applyMode: varchar("apply_mode", { length: 20 }).notNull().default("pr"),
  label: varchar("label", { length: 200 }).notNull(),
  rootPath: text("root_path").notNull(),
  writeAccessGranted: boolean("write_access_granted").notNull().default(false),
  writeApprovedBy: text("write_approved_by").references(() => user.id, {
    onDelete: "set null",
  }),
  writeApprovedAt: timestamp("write_approved_at", { withTimezone: true }),
  githubInstallationId: integer("github_installation_id"),
  githubFullName: varchar("github_full_name", { length: 300 }),
  // Auto-tracking (Sprint 0.12). SHA of the last commit observed by the
  // poller; re-audits skip when SHA is unchanged.
  lastCommitSha: varchar("last_commit_sha", { length: 64 }),
  lastPolledAt: timestamp("last_polled_at", { withTimezone: true }),
  // Opt-in HMAC secret for /api/notify-update. Per-repo, rotated by re-issuing.
  notifySecret: varchar("notify_secret", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("repo_customer_idx").on(t.customerId),
    // Bundle C: repo listings + galaxie load filter by workspace_id.
    index("repo_workspace_idx").on(t.workspaceId),
  ],
);

export const installRequest = pgTable("install_request", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  // Nova-3a Bundle A (Sub-4 K3): append-only compliance audit-trail. SET NULL
  // preserves the request row when the requesting user is deleted (GDPR-safe).
  requesterId: text("requester_id").references(() => user.id, {
    onDelete: "set null",
  }),
  targetRepoLabel: varchar("target_repo_label", { length: 200 }).notNull(),
  targetRootPath: text("target_root_path").notNull(),
  requestedScope: varchar("requested_scope", { length: 10 }).notNull(), // 'read' | 'write'
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | approved | rejected | revoked
  approverId: text("approver_id").references(() => user.id, {
    onDelete: "set null",
  }),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decisionNote: text("decision_note"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // Bundle C: pending-request lists are workspace-scoped, newest-first.
  index("install_request_workspace_idx").on(t.workspaceId, t.requestedAt.desc()),
]);

// Sprint 1.2 — membership + RBAC. The Requester→Approver-Bridge depends on
// {owner, admin, member} role distinction. workspace.ownerId stays as the
// legacy founder pointer; the membership row with role='owner' is the
// source of truth for RBAC checks.
export const membership = pgTable(
  "membership",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    /** Stable invite token; resolves to userId when invitee signs in. */
    invitedEmail: varchar("invited_email", { length: 320 }),
    role: varchar("role", { length: 20 }).notNull().default("member"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    invitedById: text("invited_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    invitedAt: timestamp("invited_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("membership_workspace_user_unique").on(
      t.workspaceId,
      t.userId,
    ),
    index("membership_workspace_email_idx").on(
      t.workspaceId,
      t.invitedEmail,
    ),
  ],
);

export const membershipRelations = relations(membership, ({ one }) => ({
  workspace: one(workspace, {
    fields: [membership.workspaceId],
    references: [workspace.id],
  }),
  user: one(user, { fields: [membership.userId], references: [user.id] }),
  invitedBy: one(user, {
    fields: [membership.invitedById],
    references: [user.id],
    relationName: "membership_invited_by",
  }),
}));

// Sprint 1.2 — install-request decision audit-log. Captures actor + IP + UA
// per decision (approve / reject / revoke). Append-only, never updated.
export const installDecision = pgTable("install_decision", {
  id: uuid("id").primaryKey().defaultRandom(),
  installRequestId: uuid("install_request_id")
    .notNull()
    .references(() => installRequest.id, { onDelete: "cascade" }),
  // Nova-3a Bundle A (Sub-4 K3): compliance audit-trail. SET NULL preserves
  // the decision row when the deciding user is deleted (GDPR-safe).
  deciderId: text("decider_id").references(() => user.id, {
    onDelete: "set null",
  }),
  decision: varchar("decision", { length: 20 }).notNull(), // approve | reject | revoke
  reason: text("reason"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  decidedAt: timestamp("decided_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const installDecisionRelations = relations(installDecision, ({ one }) => ({
  installRequest: one(installRequest, {
    fields: [installDecision.installRequestId],
    references: [installRequest.id],
  }),
  decider: one(user, {
    fields: [installDecision.deciderId],
    references: [user.id],
  }),
}));

export const webhookEvent = pgTable("webhook_event", {
  // GitHub's x-github-delivery is a UUID-shaped string and serves as the
  // idempotency key. Replays land on the same row and skip processing.
  deliveryId: text("delivery_id").primaryKey(),
  eventName: varchar("event_name", { length: 60 }).notNull(),
  action: varchar("action", { length: 60 }),
  payload: jsonb("payload").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("processed"),
  failureReason: text("failure_reason"),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

export const scan = pgTable("scan", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  repoId: uuid("repo_id").references(() => repo.id, { onDelete: "set null" }),
  rootPath: text("root_path").notNull(),
  // queued (Inngest about to pick up) | running | complete | failed
  // Synchronous audits land directly as 'complete'.
  status: varchar("status", { length: 20 }).notNull().default("complete"),
  failureReason: text("failure_reason"),
  fileCount: integer("file_count").notNull().default(0),
  overallSeverity: varchar("overall_severity", { length: 20 }).notNull().default("Exceptional"),
  findingsCount: integer("findings_count").notNull().default(0),
  warningsCount: integer("warnings_count").notNull().default(0),
  rawScan: jsonb("raw_scan"),
  rawReport: jsonb("raw_report"),
  // Sub-Plan-A — per-audit intensity ('quick' | 'deep') + cost rollup.
  // Detailed line-items live in audit_run_cost (1:1) and ai_usage_event (1:N).
  intensity: varchar("intensity", { length: 10 }).notNull().default("quick"),
  creditsConsumed: integer("credits_consumed").notNull().default(0),
  totalCostMicrocents: bigint("total_cost_microcents", { mode: "number" })
    .notNull()
    .default(0),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // Bundle C: scan lists are workspace-scoped newest-first; detail loads by repo.
  index("scan_workspace_created_idx").on(t.workspaceId, t.createdAt.desc()),
  index("scan_repo_idx").on(t.repoId),
]);

export const finding = pgTable(
  "finding",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scanId: uuid("scan_id")
      .notNull()
      .references(() => scan.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 40 }).notNull(),
    severity: varchar("severity", { length: 20 }).notNull(),
    title: text("title").notNull(),
    detail: text("detail").notNull(),
    deterministic: boolean("deterministic").notNull(),
    confidence: varchar("confidence", { length: 10 }),
    citations: jsonb("citations").notNull().default(sql`'[]'::jsonb`),
    // Sprint G5 — dismiss + snooze.
    // dismissStatus ∈ 'active' | 'dismissed' | 'snoozed' (auto-expires when snoozed_until < now()).
    // dismissReason ∈ 'false-positive' | 'acceptable-risk' | 'wont-fix' (nullable).
    dismissStatus: varchar("dismiss_status", { length: 20 })
      .notNull()
      .default("active"),
    dismissReason: varchar("dismiss_reason", { length: 40 }),
    snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
  },
  (t) => [
    index("finding_scan_severity_idx").on(t.scanId, t.severity),
    index("finding_scan_dismiss_idx").on(t.scanId, t.dismissStatus),
  ],
);

// Sprint G5 — append-only audit-trail for apply/dismiss/snooze decisions.
// One row per action. PR-status updates happen via in-place column updates
// on the most recent apply row (target_status); the row itself is immutable.
export const applyAction = pgTable("apply_action", {
  id: uuid("id").primaryKey().defaultRandom(),
  solutionId: uuid("solution_id").references(() => solution.id, {
    onDelete: "set null",
  }),
  findingId: uuid("finding_id")
    .notNull()
    .references(() => finding.id, { onDelete: "cascade" }),
  repoId: uuid("repo_id").references(() => repo.id, { onDelete: "set null" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  // 'pr' | 'direct' | 'local' for decision='apply'; 'n/a' for dismiss/snooze/undo.
  mode: varchar("mode", { length: 20 }).notNull(),
  // 'apply' | 'dismiss' | 'snooze' | 'undo-dismiss' | 'undo-snooze'.
  decision: varchar("decision", { length: 20 }).notNull(),
  reason: text("reason"),
  // For mode='pr' or 'direct': PR url / commit url.
  targetUrl: text("target_url"),
  // For mode='pr': PR number; for mode='direct': commit sha; for mode='local': patch file path.
  targetRef: varchar("target_ref", { length: 200 }),
  targetSha: varchar("target_sha", { length: 80 }),
  // 'open' | 'merged' | 'closed' | 'draft' | 'unknown' (for mode='pr'; mutates in place).
  targetStatus: varchar("target_status", { length: 20 }),
  snoozeUntil: timestamp("snooze_until", { withTimezone: true }),
  // Nova-3a Bundle A (Sub-4 K3): compliance audit-trail for apply-actions.
  // SET NULL preserves the apply history when the deciding user is deleted.
  decidedBy: text("decided_by").references(() => user.id, {
    onDelete: "set null",
  }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  decidedAt: timestamp("decided_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const applyActionRelations = relations(applyAction, ({ one }) => ({
  solution: one(solution, {
    fields: [applyAction.solutionId],
    references: [solution.id],
  }),
  finding: one(finding, {
    fields: [applyAction.findingId],
    references: [finding.id],
  }),
  repo: one(repo, {
    fields: [applyAction.repoId],
    references: [repo.id],
  }),
  workspace: one(workspace, {
    fields: [applyAction.workspaceId],
    references: [workspace.id],
  }),
  decider: one(user, {
    fields: [applyAction.decidedBy],
    references: [user.id],
  }),
}));

export const workspaceRelations = relations(workspace, ({ many, one }) => ({
  owner: one(user, { fields: [workspace.ownerId], references: [user.id] }),
  customers: many(customer),
  repos: many(repo),
  scans: many(scan),
  subscription: one(subscription, {
    fields: [workspace.id],
    references: [subscription.workspaceId],
  }),
}));

export const customerRelations = relations(customer, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [customer.workspaceId],
    references: [workspace.id],
  }),
  repos: many(repo),
}));

export const repoRelations = relations(repo, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [repo.workspaceId],
    references: [workspace.id],
  }),
  customer: one(customer, {
    fields: [repo.customerId],
    references: [customer.id],
  }),
  scans: many(scan),
}));

export const scanRelations = relations(scan, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [scan.workspaceId],
    references: [workspace.id],
  }),
  repo: one(repo, { fields: [scan.repoId], references: [repo.id] }),
  findings: many(finding),
}));

export const findingRelations = relations(finding, ({ one }) => ({
  scan: one(scan, { fields: [finding.scanId], references: [scan.id] }),
  solution: one(solution, { fields: [finding.id], references: [solution.findingId] }),
}));

// Sprint G4 — cached AI solutions, 1:1 with finding. Generation is lazy
// (on-demand when the user opens the inspector). Status transitions are:
//   pending → ready | failed | unsupported.
// `unsupported` means @vk/fixes has no generator for the category yet
// (e.g. conflicting-rules).
export const solution = pgTable("solution", {
  id: uuid("id").primaryKey().defaultRandom(),
  findingId: uuid("finding_id")
    .notNull()
    .unique()
    .references(() => finding.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  patch: text("patch"),
  rationale: text("rationale"),
  confidence: varchar("confidence", { length: 10 }),
  deterministic: boolean("deterministic"),
  filesTouched: jsonb("files_touched").notNull().default(sql`'[]'::jsonb`),
  generatorVersion: varchar("generator_version", { length: 40 }),
  failureReason: text("failure_reason"),
  generatedAt: timestamp("generated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const solutionRelations = relations(solution, ({ one }) => ({
  finding: one(finding, {
    fields: [solution.findingId],
    references: [finding.id],
  }),
}));

export const installRequestRelations = relations(installRequest, ({ one }) => ({
  workspace: one(workspace, {
    fields: [installRequest.workspaceId],
    references: [workspace.id],
  }),
  requester: one(user, {
    fields: [installRequest.requesterId],
    references: [user.id],
    relationName: "requester",
  }),
  approver: one(user, {
    fields: [installRequest.approverId],
    references: [user.id],
    relationName: "approver",
  }),
}));

// Sprint 0.12: lightweight workspace-scoped event log. Producers (Inngest
// audit completions) INSERT; the SSE endpoint SELECTs since last_id.
// Auto-rolled by retention; 7d default.
export const event = pgTable(
  "event",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 60 }).notNull(),
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("event_workspace_id_idx").on(t.workspaceId, t.id)],
);

export const eventRelations = relations(event, ({ one }) => ({
  workspace: one(workspace, {
    fields: [event.workspaceId],
    references: [workspace.id],
  }),
}));

// Sub-Plan-A (saas-pricing-sub-a-db-metering) — workspace-level billing.
// Replaces the user-level subscription stub. Quota lives in credits now
// (creditsQuotaPerCycle + creditsUsedThisPeriod), gated per intensity.
// BYOK fields hold AES-256-GCM-encrypted provider keys; see
// @vk/billing/byok-crypto. The migration drops legacy run-quota fields.
export const subscription = pgTable("subscription", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .unique()
    .references(() => workspace.id, { onDelete: "cascade" }),
  tier: varchar("tier", { length: 20 }).notNull().default("free"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 80 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 80 }),
  // Credit-System (replaces legacy runs/paidRepos quotas).
  creditsQuotaPerCycle: integer("credits_quota_per_cycle").notNull().default(3),
  creditsUsedThisPeriod: integer("credits_used_this_period")
    .notNull()
    .default(0),
  // BYOK (per ADR-0007). Encrypted via AES-256-GCM, key from BYOK_ENCRYPTION_KEY.
  byokEnabled: boolean("byok_enabled").notNull().default(false),
  byokProvider: varchar("byok_provider", { length: 20 }),
  byokKeyCiphertext: text("byok_key_ciphertext"),
  byokKeyIv: text("byok_key_iv"),
  byokKeyAuthTag: text("byok_key_auth_tag"),
  // Spend-control surfaces. autoOverageEnabled gates Stripe-metered overage.
  // spendCapMicrocents=null means unlimited.
  autoOverageEnabled: boolean("auto_overage_enabled").notNull().default(false),
  spendCapMicrocents: bigint("spend_cap_microcents", { mode: "number" }),
  defaultIntensity: varchar("default_intensity", { length: 10 }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  workspace: one(workspace, {
    fields: [subscription.workspaceId],
    references: [workspace.id],
  }),
}));

// Stripe webhook idempotency. Stripe retries the same event id; we upsert on
// PRIMARY KEY and let the second-onwards write fall through with no-op.
export const stripeEvent = pgTable("stripe_event", {
  id: varchar("id", { length: 80 }).primaryKey(),
  type: varchar("type", { length: 80 }).notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  payload: jsonb("payload"),
});

// Sprint 1.0 — DPA acceptance audit-log. Per ADR-0020 + A1 reference impls
// (Vercel pattern): hosted click-to-accept HTML with timestamped audit row.
// Unique constraint on (userId, dpaVersion) makes accept-action idempotent.
export const dpaAcceptance = pgTable(
  "dpa_acceptance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Nova-3a Bundle A (Sub-4 K3): compliance audit-trail. DPA-acceptance is
    // append-only; SET NULL preserves the row when the accepting user is
    // deleted (GDPR Art. 28 record-keeping).
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    dpaVersion: varchar("dpa_version", { length: 20 }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (t) => [
    uniqueIndex("dpa_acceptance_user_version_unique").on(
      t.userId,
      t.dpaVersion,
    ),
  ],
);

export const dpaAcceptanceRelations = relations(dpaAcceptance, ({ one }) => ({
  user: one(user, { fields: [dpaAcceptance.userId], references: [user.id] }),
}));

// Sub-Plan-A (saas-pricing-sub-a-db-metering) — append-only AI usage log.
// One row per generateText call. Drives audit_run_cost rollups and Stripe
// AI-cost-markup meter events (Sub-Plan-B).
export const aiUsageEvent = pgTable(
  "ai_usage_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    scanId: uuid("scan_id").references(() => scan.id, { onDelete: "set null" }),
    callSiteId: varchar("call_site_id", { length: 40 }).notNull(),
    provider: varchar("provider", { length: 20 }).notNull(),
    model: varchar("model", { length: 60 }).notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
    cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
    costMicrocents: bigint("cost_microcents", { mode: "number" })
      .notNull()
      .default(0),
    byokFlag: boolean("byok_flag").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ai_usage_event_workspace_created_idx").on(
      t.workspaceId,
      t.createdAt,
    ),
    index("ai_usage_event_scan_idx").on(t.scanId),
  ],
);

export const aiUsageEventRelations = relations(aiUsageEvent, ({ one }) => ({
  workspace: one(workspace, {
    fields: [aiUsageEvent.workspaceId],
    references: [workspace.id],
  }),
  scan: one(scan, { fields: [aiUsageEvent.scanId], references: [scan.id] }),
}));

// Sub-Plan-A — 1:1 rollup of AI cost per scan. credits_consumed is the
// app-side enforcement number; total_cost_microcents reflects actual provider
// spend; markup_microcents is the customer-billable add-on (Sub-Plan-B).
export const auditRunCost = pgTable(
  "audit_run_cost",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scanId: uuid("scan_id")
      .notNull()
      .unique()
      .references(() => scan.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    intensity: varchar("intensity", { length: 10 }).notNull(),
    creditsConsumed: integer("credits_consumed").notNull(),
    totalCostMicrocents: bigint("total_cost_microcents", { mode: "number" })
      .notNull()
      .default(0),
    markupMicrocents: bigint("markup_microcents", { mode: "number" })
      .notNull()
      .default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_run_cost_workspace_created_idx").on(
      t.workspaceId,
      t.createdAt,
    ),
  ],
);

export const auditRunCostRelations = relations(auditRunCost, ({ one }) => ({
  scan: one(scan, { fields: [auditRunCost.scanId], references: [scan.id] }),
  workspace: one(workspace, {
    fields: [auditRunCost.workspaceId],
    references: [workspace.id],
  }),
}));

// Sub-Plan-A — append-only credit ledger. Source-of-truth for the workspace
// credit balance. balance_after is denormalized for fast reads — the row
// after a transaction reflects the post-mutation balance.
// Reasons (enum-like): monthly_grant | audit_consume | overage | prepaid_grant
// | expiration | refund | manual_adjust.
export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    reason: varchar("reason", { length: 30 }).notNull(),
    referenceId: text("reference_id"),
    balanceAfter: integer("balance_after").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("credit_ledger_workspace_created_idx").on(
      t.workspaceId,
      t.createdAt,
    ),
    // Bundle B: idempotency for the monthly grant (reference_id = invoice.id).
    // Partial — scoped to monthly_grant so audit_consume / overage rows that
    // share a scan-id reference_id are not deduped. Matches migration 0016.
    uniqueIndex("credit_ledger_monthly_grant_idem_idx")
      .on(t.workspaceId, t.reason, t.referenceId)
      .where(sql`${t.reason} = 'monthly_grant'`),
  ],
);

export const creditLedgerRelations = relations(creditLedger, ({ one }) => ({
  workspace: one(workspace, {
    fields: [creditLedger.workspaceId],
    references: [workspace.id],
  }),
}));

// Sub-Plan-A — Stripe Pre-Paid-Pack tracking. One row per pack purchase.
// 12-month expiry per pack. Backed by Stripe Billing Credit-Grants
// (Sub-Plan-B) for the customer-facing pool.
export const prepaidCreditGrant = pgTable(
  "prepaid_credit_grant",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    stripeInvoiceId: varchar("stripe_invoice_id", { length: 80 })
      .notNull()
      .unique(),
    creditsGranted: integer("credits_granted").notNull(),
    creditsRemaining: integer("credits_remaining").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("prepaid_credit_grant_workspace_expires_idx").on(
      t.workspaceId,
      t.expiresAt,
    ),
  ],
);

export const prepaidCreditGrantRelations = relations(
  prepaidCreditGrant,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [prepaidCreditGrant.workspaceId],
      references: [workspace.id],
    }),
  }),
);

// Sub-Plan-B — idempotency log for Stripe Meter-Event submissions. Identifier
// is the dedupe key sent to Stripe (Stripe also dedupes server-side on the
// same key, so this is the second layer). credit_ledger_id traces back to
// the ledger row that triggered the submission (overage / ai_markup events).
export const stripeMeterEventLog = pgTable(
  "stripe_meter_event_log",
  {
    identifier: varchar("identifier", { length: 80 }).primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    eventName: varchar("event_name", { length: 60 }).notNull(),
    value: bigint("value", { mode: "number" }).notNull(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 80 }).notNull(),
    creditLedgerId: uuid("credit_ledger_id").references(() => creditLedger.id, {
      onDelete: "set null",
    }),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("stripe_meter_event_log_workspace_idx").on(
      t.workspaceId,
      t.submittedAt,
    ),
  ],
);

export const stripeMeterEventLogRelations = relations(
  stripeMeterEventLog,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [stripeMeterEventLog.workspaceId],
      references: [workspace.id],
    }),
    creditLedger: one(creditLedger, {
      fields: [stripeMeterEventLog.creditLedgerId],
      references: [creditLedger.id],
    }),
  }),
);
