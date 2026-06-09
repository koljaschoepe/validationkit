import Link from "next/link";
import { isAuthEnabled } from "@vk/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getSessionUser } from "@/lib/session";
import { signOutAction } from "@/lib/session-actions";
import { SiteNavLinks } from "./SiteNavLinks";

/**
 * Top-bar nav for non-dashboard surfaces (/, /trust, /login).
 * Signed-in users get a "Dashboard" CTA back to the workspace surface.
 */
export async function SiteNav() {
  const authOn = isAuthEnabled();
  const user = authOn ? await getSessionUser() : null;

  return (
    <header
      id="site-nav"
      className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur"
    >
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-6 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight"
        >
          <span className="text-primary">▸</span>
          <span>ValidationKit</span>
        </Link>

        <Separator orientation="vertical" className="h-5" />

        <SiteNavLinks />

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="default" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {user.email}
              </span>
              {/* J2: the app had no reachable sign-out anywhere. */}
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          ) : authOn ? (
            <Button asChild variant="default" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              anonymous mode
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
