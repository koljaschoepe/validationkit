"use server";

import { getSessionUser } from "./session";
import {
  addCustomer,
  addRepoUnderCustomer,
  updateCustomerApplyMode,
} from "./customer-dal";

export async function addCustomerAction(fd: FormData) {
  const label = String(fd.get("label") ?? "");
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  return addCustomer(user.id, label);
}

export async function updateCustomerApplyModeAction(
  customerId: string,
  mode: "pr" | "direct",
) {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  return updateCustomerApplyMode(user.id, customerId, mode);
}

export async function addRepoAction(fd: FormData) {
  const customerId = String(fd.get("customerId") ?? "");
  const label = String(fd.get("label") ?? "");
  const rootPath = String(fd.get("rootPath") ?? "");
  const githubFullName = String(fd.get("githubFullName") ?? "");
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in." };
  return addRepoUnderCustomer(user.id, {
    customerId,
    label,
    rootPath,
    ...(githubFullName ? { githubFullName } : {}),
  });
}
