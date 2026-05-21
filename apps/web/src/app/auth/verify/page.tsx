import { redirect } from "next/navigation";
import { Mail } from "lucide-react";
import { isAuthEnabled } from "@vk/auth";
import { getSessionUser } from "@/lib/session";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * /auth/verify — Magic-link click-target landing page.
 *
 * Flow: the magic-link email points to Better-Auth's `/api/auth/magic-link/verify`,
 * which sets the session-cookie and redirects to its `callbackURL`. We set
 * that callbackURL to `/auth/verify?next=...`, so this page is the first
 * thing the user sees after auth succeeds. Reads the now-valid session and
 * forwards to the intended destination.
 *
 * If the session isn't valid yet (race or denial), bounce back to /login.
 */

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ next?: string }>;

function safeNext(raw: string | undefined): string {
  // Restrict to absolute-path redirects on the same origin to avoid open-redirect.
  if (!raw) return "/dashboard";
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//")) return "/dashboard";
  return raw;
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (!isAuthEnabled()) redirect("/login");

  const sp = await searchParams;
  const next = safeNext(sp.next);

  const user = await getSessionUser();
  if (user) {
    // `next` is validated by `safeNext()` to be a same-origin absolute path,
    // but Next.js's typed-routes only accept compile-time-known literals —
    // dynamic redirect targets need a cast through the `Route` brand.
    redirect(next as unknown as Parameters<typeof redirect>[0]);
  }

  // Session not (yet) valid — show a skeleton landing and prompt user to
  // re-request the magic link. We do NOT auto-bounce so that a stale link
  // doesn't loop the user.
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-10 sm:px-8 sm:py-16"
    >
      <div className="flex items-center gap-3">
        <Mail
          className="size-5 text-muted-foreground motion-safe:animate-pulse"
          aria-hidden
        />
        <p className="type-mono-sm font-mono uppercase tracking-wider text-muted-foreground">
          Signing you in&hellip;
        </p>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <p className="type-body-sm text-muted-foreground">
        If this stays for more than a few seconds, the link may have expired or
        been used already. Request a{" "}
        <a
          href={`/login?next=${encodeURIComponent(next)}`}
          className="text-foreground underline-offset-4 hover:underline"
        >
          new magic link
        </a>
        .
      </p>
    </main>
  );
}
