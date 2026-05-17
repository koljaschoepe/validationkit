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
        <label htmlFor="path">Absolute path to repository</label>
        <input
          id="path"
          name="path"
          defaultValue={defaultPath}
          placeholder="/Users/you/code/your-repo"
          autoComplete="off"
          spellCheck={false}
        />
        <SubmitButton />
        <div className="examples">
          Examples: <code>{defaultPath}</code> ·{" "}
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
          </a>{" "}
          or watch the dev queue at{" "}
          <a href="http://localhost:8288" target="_blank" rel="noreferrer">
            localhost:8288
          </a>
          .
        </div>
      ) : null}
      {state.ok && state.scan && state.report ? (
        <ReportView scan={state.scan} report={state.report} />
      ) : null}
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Scanning…" : "Run audit"}
    </button>
  );
}
