"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { auditAction, type AuditFormState } from "@/lib/audit-action";
import { ReportView } from "./ReportView";

const INITIAL: AuditFormState = { ok: false };

export function AuditForm({ defaultPath }: { defaultPath: string }) {
  const [state, action] = useActionState(auditAction, INITIAL);

  return (
    <>
      <form className="form" action={action}>
        <label htmlFor="path">Public GitHub repo URL — or a local absolute path</label>
        <input
          id="path"
          name="path"
          defaultValue=""
          placeholder="https://github.com/anthropics/anthropic-cookbook"
          autoComplete="off"
          spellCheck={false}
        />
        <SubmitButton />
        <div className="examples">
          GitHub:&nbsp;
          <code>https://github.com/anthropics/anthropic-cookbook</code> ·{" "}
          <code>github.com/owner/repo</code>
          <br />
          Local (dev only): <code>{defaultPath}</code> ·{" "}
          <code>{defaultPath}/examples/sample-bad</code>
        </div>
      </form>

      {state.error ? <div className="error">{state.error}</div> : null}
      {state.ok && state.background && state.savedScanId ? (
        <div className="callout">
          <strong>Queued.</strong> This repo is large enough that the audit
          runs in the background via Inngest. Track progress at{" "}
          <a href={`/scans/${state.savedScanId}`}>
            /scans/{state.savedScanId.slice(0, 8)}…
          </a>
          .
        </div>
      ) : null}
      {state.ok && state.scan && state.report ? (
        <>
          {state.displayPath ? (
            <p style={{ color: "var(--fg-dim)", fontSize: "0.9rem" }}>
              Audited: <code>{state.displayPath}</code>
            </p>
          ) : null}
          <ReportView scan={state.scan} report={state.report} />
        </>
      ) : null}
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Fetching + scanning…" : "Run audit"}
    </button>
  );
}
