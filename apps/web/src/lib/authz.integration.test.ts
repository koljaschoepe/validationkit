// Integration tests for authz.ts — real Postgres.
// Bundle A: validates the single-source workspace-authorization helpers that
// replaced the three duplicated userIsMember copies + membership.ts's
// getUserRole/requireRole pair. Covers member / non-member / legacy-owner /
// pending-membership / role-allow-list paths.

import { describe, expect, it, beforeAll } from "vitest";
import { randomUUID } from "node:crypto";
import { isDbEnabled, getDb, schema } from "@vk/db";
import {
  userIsMember,
  getUserRole,
  requireWorkspaceAccess,
  requireMembership,
  requireRole,
} from "./authz";

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

async function seedWorkspace(ownerId: string | null): Promise<string> {
  const db = getDb();
  const slug = `ws-${randomUUID().slice(0, 8)}`;
  const rows = await db
    .insert(schema.workspace)
    .values({ name: "Test Workspace", slug, ownerId })
    .returning({ id: schema.workspace.id });
  return rows[0]!.id;
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

describe.skipIf(!isDbEnabled())("authz (integration)", () => {
  beforeAll(() => {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set for integration tests.");
    }
  });

  describe("userIsMember", () => {
    it("true for an active membership row", async () => {
      const founderId = await seedUser();
      const memberId = await seedUser();
      const wsId = await seedWorkspace(founderId);
      await seedMembership(wsId, memberId, "member", "active");
      expect(await userIsMember(wsId, memberId)).toBe(true);
    });

    it("true for a legacy owner without a membership row", async () => {
      const founderId = await seedUser();
      const wsId = await seedWorkspace(founderId);
      expect(await userIsMember(wsId, founderId)).toBe(true);
    });

    it("false for an outsider", async () => {
      const founderId = await seedUser();
      const outsiderId = await seedUser();
      const wsId = await seedWorkspace(founderId);
      expect(await userIsMember(wsId, outsiderId)).toBe(false);
    });

    it("false for a pending (not active) membership", async () => {
      const founderId = await seedUser();
      const inviteeId = await seedUser();
      const wsId = await seedWorkspace(founderId);
      await seedMembership(wsId, inviteeId, "member", "pending");
      expect(await userIsMember(wsId, inviteeId)).toBe(false);
    });
  });

  describe("getUserRole", () => {
    it("returns the active membership role", async () => {
      const founderId = await seedUser();
      const adminId = await seedUser();
      const wsId = await seedWorkspace(founderId);
      await seedMembership(wsId, adminId, "admin", "active");
      expect(await getUserRole(wsId, adminId)).toBe("admin");
    });

    it("returns null for a legacy owner WITHOUT a membership row (membership-only)", async () => {
      const founderId = await seedUser();
      const wsId = await seedWorkspace(founderId);
      expect(await getUserRole(wsId, founderId)).toBeNull();
    });

    it("returns null for an outsider", async () => {
      const founderId = await seedUser();
      const outsiderId = await seedUser();
      const wsId = await seedWorkspace(founderId);
      expect(await getUserRole(wsId, outsiderId)).toBeNull();
    });
  });

  describe("requireWorkspaceAccess", () => {
    it("resolves for a member", async () => {
      const founderId = await seedUser();
      const memberId = await seedUser();
      const wsId = await seedWorkspace(founderId);
      await seedMembership(wsId, memberId, "member", "active");
      await expect(
        requireWorkspaceAccess(wsId, memberId),
      ).resolves.toBeUndefined();
    });

    it("throws Forbidden for an outsider", async () => {
      const founderId = await seedUser();
      const outsiderId = await seedUser();
      const wsId = await seedWorkspace(founderId);
      await expect(requireWorkspaceAccess(wsId, outsiderId)).rejects.toThrow(
        /Forbidden/,
      );
    });
  });

  describe("requireMembership", () => {
    it("returns the membership role", async () => {
      const founderId = await seedUser();
      const adminId = await seedUser();
      const wsId = await seedWorkspace(founderId);
      await seedMembership(wsId, adminId, "admin", "active");
      expect(await requireMembership(wsId, adminId)).toBe("admin");
    });

    it("returns 'owner' for a legacy owner without a membership row", async () => {
      const founderId = await seedUser();
      const wsId = await seedWorkspace(founderId);
      expect(await requireMembership(wsId, founderId)).toBe("owner");
    });

    it("enforces the allow-list", async () => {
      const founderId = await seedUser();
      const memberId = await seedUser();
      const wsId = await seedWorkspace(founderId);
      await seedMembership(wsId, memberId, "member", "active");
      await expect(
        requireMembership(wsId, memberId, ["owner", "admin"]),
      ).rejects.toThrow(/Forbidden/);
    });

    it("throws Forbidden for an outsider", async () => {
      const founderId = await seedUser();
      const outsiderId = await seedUser();
      const wsId = await seedWorkspace(founderId);
      await expect(requireMembership(wsId, outsiderId)).rejects.toThrow(
        /Forbidden/,
      );
    });
  });

  describe("requireRole", () => {
    it("returns the role when in the allow-list", async () => {
      const founderId = await seedUser();
      const ownerId = await seedUser();
      const wsId = await seedWorkspace(founderId);
      await seedMembership(wsId, ownerId, "owner", "active");
      expect(await requireRole(wsId, ownerId, ["owner"])).toBe("owner");
    });

    it("throws when the role is not in the allow-list", async () => {
      const founderId = await seedUser();
      const memberId = await seedUser();
      const wsId = await seedWorkspace(founderId);
      await seedMembership(wsId, memberId, "member", "active");
      await expect(requireRole(wsId, memberId, ["owner"])).rejects.toThrow(
        /Forbidden/,
      );
    });

    it("throws for a legacy owner without a membership row (role-only gate)", async () => {
      const founderId = await seedUser();
      const wsId = await seedWorkspace(founderId);
      await expect(requireRole(wsId, founderId, ["owner"])).rejects.toThrow(
        /Forbidden/,
      );
    });
  });
});
