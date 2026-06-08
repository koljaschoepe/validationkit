"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteWorkspace } from "@/lib/workspace-actions";

export function DeleteWorkspaceForm({
  workspaceId,
  slug,
}: {
  workspaceId: string;
  slug: string;
}) {
  const [confirmValue, setConfirmValue] = useState("");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const armed = confirmValue.trim() === slug;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!armed) return;
    startTransition(async () => {
      const r = await deleteWorkspace(workspaceId, confirmValue);
      if (!r.ok) {
        toast.error(r.error ?? "Delete failed");
        return;
      }
      toast.success("Workspace deleted");
      router.push("/");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label
          htmlFor="confirm-slug"
          className="type-mono-sm uppercase tracking-wider text-muted-foreground font-medium"
        >
          Type <span className="text-foreground">{slug}</span> to confirm
        </label>
        <Input
          id="confirm-slug"
          value={confirmValue}
          onChange={(e) => setConfirmValue(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
          placeholder={slug}
        />
      </div>
      <Button type="submit" variant="destructive" disabled={!armed || pending}>
        {pending ? "Deleting…" : "Delete this workspace permanently"}
      </Button>
    </form>
  );
}
