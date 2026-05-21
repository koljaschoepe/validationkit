"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "./session";
import { resolveWorkspaceFromSlug } from "./workspace-context";
import {
  addCustomer,
  addRepoUnderCustomer,
  updateCustomerApplyMode,
} from "./customer-dal";

interface ActionResult {
  ok: boolean;
  id?: string;
  error?: string;
}

function missingWorkspace(): ActionResult {
  return { ok: false, error: "Missing workspace context." };
}

export async function addCustomerAction(fd: FormData): Promise<ActionResult> {
  const label = String(fd.get("label") ?? "");
  const workspaceSlug = String(fd.get("workspace") ?? "");
  if (!workspaceSlug) return missingWorkspace();

  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const ws = await resolveWorkspaceFromSlug(workspaceSlug, user.id);
  const result = await addCustomer(ws.id, label);
  if (result.ok) {
    revalidatePath(`/${ws.slug}/customers`);
  }
  return result;
}

export async function updateCustomerApplyModeAction(
  workspaceSlug: string,
  customerId: string,
  mode: "pr" | "direct",
): Promise<ActionResult> {
  if (!workspaceSlug) return missingWorkspace();
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const ws = await resolveWorkspaceFromSlug(workspaceSlug, user.id);
  return updateCustomerApplyMode(ws.id, customerId, mode);
}

export async function addRepoAction(fd: FormData): Promise<ActionResult> {
  const workspaceSlug = String(fd.get("workspace") ?? "");
  if (!workspaceSlug) return missingWorkspace();

  const customerId = String(fd.get("customerId") ?? "");
  const label = String(fd.get("label") ?? "");
  const rootPath = String(fd.get("rootPath") ?? "");
  const githubFullName = String(fd.get("githubFullName") ?? "");

  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const ws = await resolveWorkspaceFromSlug(workspaceSlug, user.id);
  const result = await addRepoUnderCustomer(ws.id, user.id, {
    customerId,
    label,
    rootPath,
    ...(githubFullName ? { githubFullName } : {}),
  });
  if (result.ok) {
    revalidatePath(`/${ws.slug}/customers/${customerId}`);
  }
  return result;
}
