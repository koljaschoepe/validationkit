import { redirect } from "next/navigation";
import { isAuthEnabled } from "@vk/auth";
import { getSessionUser } from "@/lib/session";
import { listUserWorkspaces } from "@/lib/dal/galaxie";
import { ensureDefaultWorkspace } from "@/lib/workspaces";
import { auditAction } from "@/lib/audit-action";
import { claimPendingMemberships } from "@/lib/membership";

// J1: the audit-intent path runs auditAction (scan + LLM) inline, which can
// exceed the 60s serverless default on a real repo. Give it room.
export const maxDuration = 300;

/**
 * Post-Homepage-Relaunch (May 2026): /dashboard collapsed into a redirect stub.
 * The signed-in hub is now `/[workspace]` — see ADR-0003 and the Homepage-Relaunch plan.
 *
 * Sprint 2 (May 2026): now also handles the audit-intent re-run-after-login path.
 * Magic-link sent by the public landing's BlurOverlayCTA lands here with
 * `?intent=audit&repo=…`. We auth-check, run the audit server-side via
 * `auditAction` (blocking, ~30s for a typical repo), and redirect to the new
 * scan-detail page. If the audit goes background (Inngest queue), the redirect
 * still points at the scan-detail page where a loading state takes over.
 */
export default async function DashboardRedirect({
  searchParams,
}: {
  searchParams?: Promise<{ intent?: string; repo?: string }>;
}) {
  if (!isAuthEnabled()) redirect("/login");
  const user = await getSessionUser();

  const params = (await searchParams) ?? {};
  const intentAuditRepo =
    params.intent === "audit" && typeof params.repo === "string" && params.repo
      ? params.repo
      : null;

  if (!user) {
    if (intentAuditRepo) {
      redirect(
        `/login?intent=audit&repo=${encodeURIComponent(intentAuditRepo)}`,
      );
    }
    redirect("/login");
  }

  // Nova-3a Bundle H (Sub-1 S2): back-fill any membership rows the user was
  // invited to before they signed up. Idempotent — no-ops when there's
  // nothing pending. This was the only sane entry point and was missing,
  // leaving the invite flow effectively broken.
  if (user.email) {
    await claimPendingMemberships(user.id, user.email);
  }

  // Audit-intent path: visitor came from a magic-link that wants to re-run
  // an audit they kicked off anonymously on the landing.
  if (intentAuditRepo) {
    const fd = new FormData();
    fd.append("path", intentAuditRepo);
    const result = await auditAction({ ok: false }, fd);

    if (result.ok && result.savedScanId && result.workspaceSlug) {
      redirect(`/${result.workspaceSlug}/scans/${result.savedScanId}`);
    }
    // Audit failed (or DB disabled). Fall through to the default workspace
    // redirect so the user still lands somewhere coherent; the next sprint can
    // surface the error via a toast/query param. For now we lose the error.
  }

  const workspaces = await listUserWorkspaces(user.id);
  const first = workspaces[0];
  if (!first) {
    // J3: the user has no workspace (e.g. they just deleted their last one).
    // Do NOT redirect to /login — they're authenticated, so the login page
    // bounces them straight back here (infinite loop). Materialise a fresh
    // default workspace and land them on it.
    const { slug } = await ensureDefaultWorkspace(user.id);
    redirect(`/${slug}`);
  }

  redirect(`/${first.slug}`);
}
