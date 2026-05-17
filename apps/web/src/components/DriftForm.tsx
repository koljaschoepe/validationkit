"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { driftAction, type DriftFormState } from "@/lib/drift-action";
import { DriftView } from "./DriftView";

const INITIAL: DriftFormState = { ok: false };

export function DriftForm({
  defaultA,
  defaultB,
}: {
  defaultA: string;
  defaultB: string;
}) {
  const [state, action] = useActionState(driftAction, INITIAL);
  return (
    <>
      <form className="form" action={action}>
        <label htmlFor="pathA">Repository A (the canonical one)</label>
        <input
          id="pathA"
          name="pathA"
          defaultValue={defaultA}
          autoComplete="off"
          spellCheck={false}
        />
        <label htmlFor="pathB">Repository B (the candidate)</label>
        <input
          id="pathB"
          name="pathB"
          defaultValue={defaultB}
          autoComplete="off"
          spellCheck={false}
        />
        <SubmitButton />
        <div className="examples">
          Drift detects: file presence, frontmatter, body similarity, token-count.
          Deterministic, no LLM.
        </div>
      </form>
      {state.error ? <div className="error">{state.error}</div> : null}
      {state.ok && state.drift ? <DriftView drift={state.drift} /> : null}
    </>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Comparing…" : "Compare repos"}
    </button>
  );
}
