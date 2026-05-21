"use server";

import { and, desc, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { getDb, isDbEnabled, schema } from "@vk/db";
import type { Severity } from "@/lib/galaxie/types";
import { aggregateSeverities, normalizeSeverity } from "./dal/galaxie";
import { galaxieWorkspaceTag } from "./cache-tags";

export interface CustomerListItem {
  id: string;
  slug: string;
  label: string;
  defaultApplyMode: string;
  githubOrg: string | null;
  repoCount: number;
  aggregateSeverity: Severity;
  createdAt: Date;
}

export interface CustomerDetail {
  customer: CustomerListItem;
  repos: Array<{
    id: string;
    label: string;
    rootPath: string;
    applyMode: string;
    aggregateSeverity: Severity;
    latestScanAt: Date | null;
  }>;
}

/**
 * List the customers in a workspace. Caller MUST have already validated
 * workspace-membership (e.g. via resolveWorkspaceFromSlug).
 */
export async function listCustomers(
  workspaceId: string,
): Promise<CustomerListItem[]> {
  if (!isDbEnabled()) return [];
  const db = getDb();

  const customers = await db
    .select()
    .from(schema.customer)
    .where(eq(schema.customer.workspaceId, workspaceId))
    .orderBy(desc(schema.customer.createdAt));

  if (customers.length === 0) return [];

  // Fetch repos + latest-scan-per-repo for aggregate-severity computation.
  const repos = await db
    .select()
    .from(schema.repo)
    .where(eq(schema.repo.workspaceId, workspaceId));

  const scans = await db
    .select()
    .from(schema.scan)
    .where(eq(schema.scan.workspaceId, workspaceId))
    .orderBy(desc(schema.scan.createdAt));

  const latestScanByRoot = new Map<string, (typeof scans)[number]>();
  for (const s of scans) {
    if (!latestScanByRoot.has(s.rootPath)) latestScanByRoot.set(s.rootPath, s);
  }

  const reposByCustomerId = new Map<string, typeof repos>();
  for (const r of repos) {
    if (!r.customerId) continue;
    const arr = reposByCustomerId.get(r.customerId) ?? [];
    arr.push(r);
    reposByCustomerId.set(r.customerId, arr);
  }

  return customers.map((c) => {
    const repoList = reposByCustomerId.get(c.id) ?? [];
    const repoSevs: Severity[] = repoList.map((r) => {
      const scan = latestScanByRoot.get(r.rootPath);
      return scan ? normalizeSeverity(scan.overallSeverity) : "Exceptional";
    });
    return {
      id: c.id,
      slug: c.slug,
      label: c.label,
      defaultApplyMode: c.defaultApplyMode,
      githubOrg: c.githubOrg,
      repoCount: repoList.length,
      aggregateSeverity: aggregateSeverities(repoSevs),
      createdAt: c.createdAt,
    };
  });
}

/**
 * Fetch a single customer-detail. Workspace-gating is enforced via the
 * (workspaceId, customerId) compound match — caller MUST have validated
 * workspace membership upstream.
 */
export async function getCustomerById(
  workspaceId: string,
  customerId: string,
): Promise<CustomerDetail | null> {
  if (!isDbEnabled()) return null;
  const db = getDb();

  const customerRows = await db
    .select()
    .from(schema.customer)
    .where(
      and(
        eq(schema.customer.id, customerId),
        eq(schema.customer.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  const c = customerRows[0];
  if (!c) return null;

  const repos = await db
    .select()
    .from(schema.repo)
    .where(eq(schema.repo.customerId, customerId))
    .orderBy(desc(schema.repo.createdAt));

  const scans = await db
    .select()
    .from(schema.scan)
    .where(eq(schema.scan.workspaceId, workspaceId))
    .orderBy(desc(schema.scan.createdAt));
  const latestScanByRoot = new Map<string, (typeof scans)[number]>();
  for (const s of scans) {
    if (!latestScanByRoot.has(s.rootPath)) latestScanByRoot.set(s.rootPath, s);
  }

  const repoList = repos.map((r) => {
    const scan = latestScanByRoot.get(r.rootPath);
    return {
      id: r.id,
      label: r.label,
      rootPath: r.rootPath,
      applyMode: r.applyMode,
      aggregateSeverity: scan
        ? normalizeSeverity(scan.overallSeverity)
        : ("Exceptional" as Severity),
      latestScanAt: scan?.createdAt ?? null,
    };
  });

  return {
    customer: {
      id: c.id,
      slug: c.slug,
      label: c.label,
      defaultApplyMode: c.defaultApplyMode,
      githubOrg: c.githubOrg,
      repoCount: repoList.length,
      aggregateSeverity: aggregateSeverities(
        repoList.map((r) => r.aggregateSeverity),
      ),
      createdAt: c.createdAt,
    },
    repos: repoList,
  };
}

export interface AddCustomerResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function addCustomer(
  workspaceId: string,
  label: string,
): Promise<AddCustomerResult> {
  if (!isDbEnabled()) return { ok: false, error: "DB not configured." };
  const trimmed = label.trim();
  if (!trimmed) return { ok: false, error: "Label is required." };

  const db = getDb();

  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) return { ok: false, error: "Label must contain letters or digits." };

  try {
    const inserted = await db
      .insert(schema.customer)
      .values({ workspaceId, label: trimmed, slug })
      .returning({ id: schema.customer.id });
    const row = inserted[0];
    if (!row) return { ok: false, error: "Insert failed." };
    updateTag(galaxieWorkspaceTag(workspaceId));
    return { ok: true, id: row.id };
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("customer_workspace_slug_unique")) {
      return { ok: false, error: `Slug "${slug}" is already taken in this workspace.` };
    }
    return { ok: false, error: msg };
  }
}

export interface AddRepoUnderCustomerInput {
  customerId: string;
  label: string;
  rootPath: string;
  githubFullName?: string;
}

/**
 * Update the default apply-mode on a customer. Workspace is derived from
 * the customer row; caller MUST have validated workspace-membership.
 */
export async function updateCustomerApplyMode(
  workspaceId: string,
  customerId: string,
  mode: "pr" | "direct",
): Promise<AddCustomerResult> {
  if (!isDbEnabled()) return { ok: false, error: "DB not configured." };
  if (mode !== "pr" && mode !== "direct") {
    return { ok: false, error: `Invalid apply mode: ${mode}` };
  }
  const db = getDb();
  const customerRows = await db
    .select({ id: schema.customer.id })
    .from(schema.customer)
    .where(
      and(
        eq(schema.customer.id, customerId),
        eq(schema.customer.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  if (!customerRows[0]) return { ok: false, error: "Customer not found in workspace." };

  await db
    .update(schema.customer)
    .set({ defaultApplyMode: mode, updatedAt: new Date() })
    .where(eq(schema.customer.id, customerId));

  updateTag(galaxieWorkspaceTag(workspaceId));
  return { ok: true };
}

export async function addRepoUnderCustomer(
  workspaceId: string,
  userId: string,
  input: AddRepoUnderCustomerInput,
): Promise<AddCustomerResult> {
  if (!isDbEnabled()) return { ok: false, error: "DB not configured." };
  const label = input.label.trim();
  const rootPath = input.rootPath.trim();
  if (!label || !rootPath) {
    return { ok: false, error: "Label and rootPath are required." };
  }

  const db = getDb();
  const customerRows = await db
    .select({ id: schema.customer.id })
    .from(schema.customer)
    .where(
      and(
        eq(schema.customer.id, input.customerId),
        eq(schema.customer.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  if (!customerRows[0]) return { ok: false, error: "Customer not found in workspace." };

  const { canAddRepo } = await import("@vk/billing");
  const quota = await canAddRepo(userId);
  if (!quota.allowed) {
    return {
      ok: false,
      error: (quota.reason ?? "Repo quota exceeded.") + " Upgrade your plan.",
    };
  }

  const inserted = await db
    .insert(schema.repo)
    .values({
      workspaceId,
      customerId: input.customerId,
      label,
      rootPath,
      ...(input.githubFullName ? { githubFullName: input.githubFullName } : {}),
    })
    .returning({ id: schema.repo.id });
  const row = inserted[0];
  if (!row) return { ok: false, error: "Repo insert failed." };

  updateTag(galaxieWorkspaceTag(workspaceId));
  return { ok: true, id: row.id };
}
