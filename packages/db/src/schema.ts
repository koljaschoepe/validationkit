import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
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
});

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
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ValidationKit-domain tables.

export const workspace = pgTable("workspace", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

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
  // Canonical reference for drift detection. When set, an audit completion
  // auto-enqueues a drift run against this repo.
  canonicalRepoId: uuid("canonical_repo_id").references(
    (): AnyPgColumn => repo.id,
    { onDelete: "set null" },
  ),
  // Opt-in HMAC secret for /api/notify-update. Per-repo, rotated by re-issuing.
  notifySecret: varchar("notify_secret", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("repo_customer_idx").on(t.customerId)],
);

export const installRequest = pgTable("install_request", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  requesterId: text("requester_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
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
});

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
  deciderId: text("decider_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
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

export const driftRun = pgTable("drift_run", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  rootPathA: text("root_path_a").notNull(),
  rootPathB: text("root_path_b").notNull(),
  itemsCount: integer("items_count").notNull(),
  overallSeverity: varchar("overall_severity", { length: 20 }).notNull(),
  rawDrift: jsonb("raw_drift").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

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
  },
  // Sprint G2 — composite index for `WHERE scan_id = ? AND severity = ?` aggregates.
  (t) => [index("finding_scan_severity_idx").on(t.scanId, t.severity)],
);

export const workspaceRelations = relations(workspace, ({ many, one }) => ({
  owner: one(user, { fields: [workspace.ownerId], references: [user.id] }),
  customers: many(customer),
  repos: many(repo),
  scans: many(scan),
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

export const driftRunRelations = relations(driftRun, ({ one }) => ({
  workspace: one(workspace, {
    fields: [driftRun.workspaceId],
    references: [workspace.id],
  }),
}));

// Sprint 0.12: lightweight workspace-scoped event log. Producers (Inngest
// audit/drift completions) INSERT; the SSE endpoint SELECTs since last_id.
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

// Sprint 0.13 — billing. One subscription row per user; auto-inserted as
// 'free' on first dashboard hit, mutated by the Stripe webhook on plan changes.
// Quota fields are mirrored from tier-config in @vk/billing so app-side gates
// don't have to round-trip Stripe.
export const subscription = pgTable("subscription", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  tier: varchar("tier", { length: 20 }).notNull().default("free"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 80 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 80 }),
  paidReposQuota: integer("paid_repos_quota").notNull().default(1),
  runsQuota: integer("runs_quota").notNull().default(20),
  runsUsedThisPeriod: integer("runs_used_this_period").notNull().default(0),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(user, { fields: [subscription.userId], references: [user.id] }),
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
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
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
