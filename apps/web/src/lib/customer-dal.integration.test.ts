// Integration tests for customer-dal — real Postgres, no mocks.
// Validates workspace-scoping (the multi-tenant invariant from Sub-5).

import { describe, expect, it, beforeAll } from "vitest";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { isDbEnabled, getDb, schema } from "@vk/db";
import { listCustomers, getCustomerById } from "./customer-dal";

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

async function seedWorkspace(ownerId: string): Promise<string> {
  const db = getDb();
  const slug = `ws-${randomUUID().slice(0, 8)}`;
  const rows = await db
    .insert(schema.workspace)
    .values({ name: "WS", slug, ownerId })
    .returning({ id: schema.workspace.id });
  return rows[0]!.id;
}

async function seedCustomer(
  workspaceId: string,
  slug = `cust-${randomUUID().slice(0, 8)}`,
): Promise<string> {
  const db = getDb();
  const rows = await db
    .insert(schema.customer)
    .values({ workspaceId, slug, label: "Test Customer" })
    .returning({ id: schema.customer.id });
  return rows[0]!.id;
}

describe.skipIf(!isDbEnabled())("customer-dal (integration)", () => {
  beforeAll(() => {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set for integration tests.");
    }
  });

  it("listCustomers returns empty for a fresh workspace", async () => {
    const userId = await seedUser();
    const wsId = await seedWorkspace(userId);
    const list = await listCustomers(wsId);
    expect(list).toEqual([]);
  });

  it("listCustomers returns only customers belonging to the given workspace (multi-tenant isolation)", async () => {
    const userId = await seedUser();
    const wsA = await seedWorkspace(userId);
    const wsB = await seedWorkspace(userId);
    const custA = await seedCustomer(wsA, "alpha");
    const custB = await seedCustomer(wsB, "beta");

    const listA = await listCustomers(wsA);
    const listB = await listCustomers(wsB);

    expect(listA.map((c) => c.id).sort()).toEqual([custA].sort());
    expect(listB.map((c) => c.id).sort()).toEqual([custB].sort());
    // Cross-workspace leak check
    expect(listA.find((c) => c.id === custB)).toBeUndefined();
    expect(listB.find((c) => c.id === custA)).toBeUndefined();
  });

  it("getCustomerById returns the customer detail when in workspace", async () => {
    const userId = await seedUser();
    const wsId = await seedWorkspace(userId);
    const custId = await seedCustomer(wsId, "gamma");
    const detail = await getCustomerById(wsId, custId);
    expect(detail).not.toBeNull();
    expect(detail?.customer.id).toBe(custId);
    expect(detail?.customer.slug).toBe("gamma");
  });

  it("getCustomerById returns null when customer belongs to a different workspace (tenancy gate)", async () => {
    const userId = await seedUser();
    const wsOwn = await seedWorkspace(userId);
    const wsOther = await seedWorkspace(userId);
    const otherCustId = await seedCustomer(wsOther, "intruder");

    const detail = await getCustomerById(wsOwn, otherCustId);
    expect(detail).toBeNull();
  });

  it("getCustomerById returns null for unknown UUID", async () => {
    const userId = await seedUser();
    const wsId = await seedWorkspace(userId);
    const detail = await getCustomerById(wsId, randomUUID());
    expect(detail).toBeNull();
  });

  it("customer.notes is still gettable until DROP-COLUMN migration (Sub-4 Strong dead column tracker)", async () => {
    const userId = await seedUser();
    const wsId = await seedWorkspace(userId);
    const db = getDb();
    const rows = await db
      .insert(schema.customer)
      .values({
        workspaceId: wsId,
        slug: "notes-probe",
        label: "Notes Probe",
        notes: "explicit",
      })
      .returning({ id: schema.customer.id, notes: schema.customer.notes });
    expect(rows[0]?.notes).toBe("explicit");
    // Cleanup
    await db.delete(schema.customer).where(eq(schema.customer.id, rows[0]!.id));
  });
});
