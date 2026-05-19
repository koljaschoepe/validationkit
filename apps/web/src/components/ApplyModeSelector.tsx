"use client";

import { useState, useTransition } from "react";
import { GitPullRequestIcon, GitCommitIcon } from "lucide-react";

export function ApplyModeSelector({
  customerId,
  current,
}: {
  customerId: string;
  current: "pr" | "direct";
}) {
  const [value, setValue] = useState<"pr" | "direct">(current);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function pick(next: "pr" | "direct") {
    if (next === value) return;
    if (next === "direct") {
      const ok = window.confirm(
        "Direct commit skips PR review. Only enable if you trust auto-fixes for this customer's repos. Continue?",
      );
      if (!ok) return;
    }
    setErr(null);
    setValue(next);
    startTransition(async () => {
      const { updateCustomerApplyModeAction } = await import(
        "@/lib/customer-actions"
      );
      const r = await updateCustomerApplyModeAction(customerId, next);
      if (!r.ok) {
        setErr(r.error ?? "Update failed.");
        setValue(current);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="inline-flex rounded border border-border bg-card p-1 text-xs">
        <Choice
          icon={<GitPullRequestIcon className="size-3.5" />}
          label="PR"
          active={value === "pr"}
          disabled={pending}
          onClick={() => pick("pr")}
        />
        <Choice
          icon={<GitCommitIcon className="size-3.5" />}
          label="Direct commit"
          active={value === "direct"}
          disabled={pending}
          onClick={() => pick("direct")}
        />
      </div>
      {err ? <p className="text-xs text-destructive">{err}</p> : null}
    </div>
  );
}

function Choice({
  icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-secondary"
      } disabled:opacity-50`}
    >
      {icon}
      {label}
    </button>
  );
}
