"use client";

import { useState, useTransition } from "react";
import { addCustomer } from "@/lib/customers";

export function AddCustomerForm() {
  const [label, setLabel] = useState("");
  const [rootPath, setRootPath] = useState("");
  const [github, setGithub] = useState("");
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    startTransition(async () => {
      const result = await addCustomer({
        label,
        rootPath,
        githubFullName: github || undefined,
      });
      if (!result.ok) {
        setErr(result.error);
        return;
      }
      setOk(true);
      setLabel("");
      setRootPath("");
      setGithub("");
    });
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label htmlFor="label">Customer label</label>
      <input
        id="label"
        required
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Acme — frontend"
      />
      <label htmlFor="rootPath">Root path or github:// URI</label>
      <input
        id="rootPath"
        required
        value={rootPath}
        onChange={(e) => setRootPath(e.target.value)}
        placeholder="/Users/you/code/acme-frontend or github://acme/frontend"
        spellCheck={false}
      />
      <label htmlFor="github">GitHub full name (optional)</label>
      <input
        id="github"
        value={github}
        onChange={(e) => setGithub(e.target.value)}
        placeholder="acme/frontend"
        spellCheck={false}
      />
      <button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add customer"}
      </button>
      {err ? <div className="error">{err}</div> : null}
      {ok ? (
        <div className="callout">
          Added. Run an audit at <a href="/">/</a> against the rootPath to see
          findings land on this customer&apos;s detail page.
        </div>
      ) : null}
    </form>
  );
}
