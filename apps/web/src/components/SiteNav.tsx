import Link from "next/link";
import { isAuthEnabled } from "@vk/auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getSessionUser } from "@/lib/session";

/**
 * Top-bar nav for non-dashboard surfaces (/, /drift, /trust, /login).
 * Signed-in users get a "Dashboard" CTA back to the workspace surface.
 */
export async function SiteNav() {
  const authOn = isAuthEnabled();
  const user = authOn ? await getSessionUser() : null;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight"
        >
          <span className="text-primary">▸</span>
          <span>ValidationKit</span>
        </Link>

        <Separator orientation="vertical" className="h-5" />

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Audit
          </Link>
          <Link
            href="/drift"
            className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Drift
          </Link>
          <Link
            href="/trust"
            className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Trust
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="default" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {user.email}
              </span>
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
