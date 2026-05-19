"use server";

import { and, desc, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { getDb, isDbEnabled, schema } from "@vk/db";
import type { Severity } from "@/lib/galaxie/types";
import { aggregateSeverities, normalizeSeverity } from "./dal/galaxie";
import { galaxieWorkspaceTag } from "./cache-tags";
import { ensureDefaultWorkspace } from "./workspaces";

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

async function userIsWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const db = getDb();
  const memberRows = await db
    .select({ id: schema.membership.id })
    .from(schema.membership)
    .where(
      and(
        eq(schema.membership.workspaceId, workspaceId),
        eq(schema.membership.userId, userId),
        eq(schema.membership.status, "active"),
      ),
    )
    .limit(1);
  if (memberRows.length > 0) return true;
  const ownerRows = await db
    .select({ id: schema.workspace.id })
    .from(schema.workspace)
    .where(
      and(
        eq(schema.workspace.id, workspaceId),
        eq(schema.workspace.ownerId, userId),
      ),
    )
    .limit(1);
  return ownerRows.length > 0;
}

/**
 * List the customers visible to a user across their accessible workspaces.
 * For Sprint G3 this collapses to the user's owned workspace (matching
 * ensureDefaultWorkspace semantics); G6 multi-workspace polish refines this.
 */
export async function listCustomers(
  userId: string,
): Promise<CustomerListItem[]> {
  if (!isDbEnabled()) return [];
  const db = getDb();

  const workspaceId = await ensureDefaultWorkspace(userId);

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

export async function getCustomerById(
  userId: string,
  customerId: string,
): Promise<CustomerDetail | null> {
  if (!isDbEnabled()) return null;
  const db = getDb();

  const customerRows = await db
    .select()
    .from(schema.customer)
    .where(eq(schema.customer.id, customerId))
    .limit(1);
  const c = customerRows[0];
  if (!c) return null;

  if (!(await userIsWorkspaceMember(c.workspaceId, userId))) return null;

  const repos = await db
    .select()
    .from(schema.repo)
    .where(eq(schema.repo.customerId, customerId))
    .orderBy(desc(schema.repo.createdAt));

  const scans = await db
    .select()
    .from(schema.scan)
    .where(eq(schema.scan.workspaceId, c.workspaceId))
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
  userId: string,
  label: string,
): Promise<AddCustomerResult> {
  if (!isDbEnabled()) return { ok: false, error: "DB not configured." };
  const trimmed = label.trim();
  if (!trimmed) return { ok: false, error: "Label is required." };

  const db = getDb();
  const workspaceId = await ensureDefaultWorkspace(userId);

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

export async function addRepoUnderCustomer(
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
    .select({ workspaceId: schema.customer.workspaceId })
    .from(schema.customer)
    .where(eq(schema.customer.id, input.customerId))
    .limit(1);
  const customer = customerRows[0];
  if (!customer) return { ok: false, error: "Customer not found." };

  if (!(await userIsWorkspaceMember(customer.workspaceId, userId))) {
    return { ok: false, error: "Not authorized for this workspace." };
  }

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
      workspaceId: customer.workspaceId,
      customerId: input.customerId,
      label,
      rootPath,
      ...(input.githubFullName ? { githubFullName: input.githubFullName } : {}),
    })
    .returning({ id: schema.repo.id });
  const row = inserted[0];
  if (!row) return { ok: false, error: "Repo insert failed." };

  updateTag(galaxieWorkspaceTag(customer.workspaceId));
  return { ok: true, id: row.id };
}
