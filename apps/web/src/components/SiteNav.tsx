import Link from "next/link";
import { isAuthEnabled } from "@vk/auth";
import { getSessionUser } from "@/lib/session";

export async function SiteNav() {
  const authOn = isAuthEnabled();
  const user = authOn ? await getSessionUser() : null;

  return (
    <nav
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "center",
        fontSize: "0.85rem",
        marginBottom: "1.5rem",
        color: "var(--fg-dim)",
      }}
    >
      <Link href="/">Audit</Link>
      <Link href="/drift">Drift</Link>
      <Link href="/trust">Trust</Link>
      {user ? (
        <>
          <Link href="/scans">Scans</Link>
          <Link href="/drifts">Drifts</Link>
          <Link href="/customers">Customers</Link>
          <Link href="/requests">Requests</Link>
          <Link href="/bip">BiP</Link>
          <span style={{ marginLeft: "auto", color: "var(--fg-muted)" }}>
            {user.email}
          </span>
        </>
      ) : (
        <span style={{ marginLeft: "auto" }}>
          {authOn ? (
            <Link href="/login">Sign in</Link>
          ) : (
            <span style={{ color: "var(--fg-muted)" }}>anonymous mode</span>
          )}
        </span>
      )}
    </nav>
  );
}
