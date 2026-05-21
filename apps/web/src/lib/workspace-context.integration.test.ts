// Integration tests for workspace-context.ts — real Postgres.
// Validates the membership-gate covered in Sub-5 Mid finding (membership
// role='owner' vs legacy workspace.ownerId match).

import { describe, expect, it, beforeAll } from "vitest";
import { randomUUID } from "node:crypto";
import { isDbEnabled, getDb, schema } from "@vk/db";
import { resolveWorkspaceFromSlug } from "./workspace-context";

async function seedUser(): Promise<string> {
  const db = getDb();
  const id = `user_${randomUUID()}`;
  await db.insert(schema.user).values({
    id,
    email: `${id}@test.local`,
    name: "Test",
    emailVerified: true,
  });
  return id;
}

async function seedWorkspace(ownerId: string | null): Promise<{
  id: string;
  slug: string;
}> {
  const db = getDb();
  const slug = `ws-${randomUUID().slice(0, 8)}`;
  const rows = await db
    .insert(schema.workspace)
    .values({ name: "Test Workspace", slug, ownerId })
    .returning({ id: schema.workspace.id, slug: schema.workspace.slug });
  return rows[0]!;
}

async function seedMembership(
  workspaceId: string,
  userId: string,
  role: "owner" | "admin" | "member" = "member",
  status: "active" | "pending" = "active",
): Promise<void> {
  const db = getDb();
  await db.insert(schema.membership).values({
    workspaceId,
    userId,
    role,
    status,
  });
}

describe.skipIf(!isDbEnabled())("resolveWorkspaceFromSlug (integration)", () => {
  beforeAll(() => {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set for integration tests.");
    }
  });

  it("resolves when user is the legacy workspace.ownerId (founder path)", async () => {
    const userId = await seedUser();
    const ws = await seedWorkspace(userId);
    const resolved = await resolveWorkspaceFromSlug(ws.slug, userId);
    expect(resolved.id).toBe(ws.id);
    expect(resolved.slug).toBe(ws.slug);
    expect(resolved.ownerId).toBe(userId);
  });

  it("resolves when user has an active membership row (post-invite path)", async () => {
    const founderId = await seedUser();
    const inviteeId = await seedUser();
    const ws = await seedWorkspace(founderId);
    await seedMembership(ws.id, inviteeId, "member", "active");
    const resolved = await resolveWorkspaceFromSlug(ws.slug, inviteeId);
    expect(resolved.id).toBe(ws.id);
  });

  it("throws notFound when slug is unknown", async () => {
    const userId = await seedUser();
    await expect(
      resolveWorkspaceFromSlug(`nonexistent-${randomUUID()}`, userId),
    ).rejects.toThrow();
  });

  it("throws notFound when user has no membership and is not the owner", async () => {
    const founderId = await seedUser();
    const outsiderId = await seedUser();
    const ws = await seedWorkspace(founderId);
    await expect(
      resolveWorkspaceFromSlug(ws.slug, outsiderId),
    ).rejects.toThrow();
  });

  it("does NOT resolve when the membership row is pending (not active)", async () => {
    const founderId = await seedUser();
    const inviteeId = await seedUser();
    const ws = await seedWorkspace(founderId);
    await seedMembership(ws.id, inviteeId, "member", "pending");
    await expect(
      resolveWorkspaceFromSlug(ws.slug, inviteeId),
    ).rejects.toThrow();
  });

  it("returns ownerId=null for workspaces whose founder has been deleted (Nova-3a Bundle A)", async () => {
    // Seed via the founder, then null the ownerId directly to simulate a
    // post-Bundle-A SET-NULL event.
    const founderId = await seedUser();
    const memberId = await seedUser();
    const ws = await seedWorkspace(founderId);
    await seedMembership(ws.id, memberId, "owner", "active");

    const db = getDb();
    await db
      .update(schema.workspace)
      .set({ ownerId: null })
      .where((await import("drizzle-orm")).eq(schema.workspace.id, ws.id));

    const resolved = await resolveWorkspaceFromSlug(ws.slug, memberId);
    expect(resolved.ownerId).toBeNull();
    expect(resolved.id).toBe(ws.id);
  });
});
