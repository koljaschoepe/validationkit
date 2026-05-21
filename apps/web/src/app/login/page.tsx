import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthEnabled } from "@vk/auth";
import { LoginForm } from "@/components/LoginForm";
import { getSessionUser } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage() {
  if (!isAuthEnabled()) {
    return (
      <main id="main-content" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-8 sm:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Login disabled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Hardcore-Local-Only is still active. Bring up the local stack and
              point at it with <code className="font-mono">.env.local</code>:
            </p>
            <pre className="overflow-auto rounded-md border bg-muted/50 p-3 text-xs font-mono">
              {`pnpm stack:up
cp .env.example .env.local
# fill in AUTH_SECRET via: openssl rand -base64 32
pnpm db:generate
pnpm db:migrate`}
            </pre>
            <Link
              href="/"
              className="text-primary underline-offset-4 hover:underline text-sm"
            >
              → Try an anonymous audit instead
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-8 sm:px-8">
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-xl">Sign in</CardTitle>
          <p className="text-sm text-muted-foreground">
            Email magic link. No passwords stored. The link drops you on the
            dashboard.
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Or{" "}
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          try an anonymous audit first
        </Link>{" "}
        — no signup required.
      </p>
    </main>
  );
}
