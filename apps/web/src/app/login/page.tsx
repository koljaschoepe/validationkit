import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthEnabled } from "@vk/auth";
import { LoginForm } from "@/components/LoginForm";
import { getSessionUser } from "@/lib/session";

export default async function LoginPage() {
  if (!isAuthEnabled()) {
    return (
      <main>
        <header>
          <h1>Login disabled</h1>
          <p>
            Hardcore-Local-Only is still active. Bring up the local stack and
            point at it with <code>.env.local</code>:
          </p>
        </header>
        <pre className="callout mono">
          {`pnpm stack:up
cp .env.example .env.local
# fill in AUTH_SECRET via: openssl rand -base64 32
pnpm db:generate
pnpm db:migrate`}
        </pre>
        <footer>
          ValidationKit · <Link href="/">Audit (anonymous)</Link>
        </footer>
      </main>
    );
  }

  const user = await getSessionUser();
  if (user) redirect("/scans");

  return (
    <main>
      <header>
        <h1>Sign in</h1>
        <p>
          Email magic link via{" "}
          <a href="http://localhost:8025" target="_blank" rel="noreferrer">
            Mailpit
          </a>
          . No passwords stored.
        </p>
      </header>
      <LoginForm />
      <footer>
        ValidationKit · <Link href="/">Audit (anonymous)</Link>
      </footer>
    </main>
  );
}
