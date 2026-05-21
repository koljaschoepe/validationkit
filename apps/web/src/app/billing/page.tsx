import { redirect } from "next/navigation";
import { isAuthEnabled } from "@vk/auth";
import { getSessionUser } from "@/lib/session";
import { ensureDefaultWorkspace } from "@/lib/workspaces";

/**
 * Sub-Plan-C: the workspace-scoped billing dashboard lives at
 * /[workspace]/settings/billing. This top-level route redirects there so
 * existing bookmarks + Stripe success/cancel URLs still resolve.
 */
export const dynamic = "force-dynamic";

interface SearchParams {
  status?: string;
  reason?: string;
  session_id?: string;
  tier?: string;
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { slug } = await ensureDefaultWorkspace(user.id);
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.reason) qs.set("reason", params.reason);
  const tail = qs.toString();
  redirect(
    (`/${slug}/settings/billing${tail ? `?${tail}` : ""}`) as never,
  );
}
