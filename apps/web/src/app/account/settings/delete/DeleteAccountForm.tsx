"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteAccount } from "@/lib/account-actions";

export function DeleteAccountForm({ email }: { email: string }) {
  const [confirmValue, setConfirmValue] = useState("");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const armed = confirmValue.trim().toLowerCase() === email.toLowerCase();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!armed) return;
    startTransition(async () => {
      const r = await deleteAccount(confirmValue);
      if (!r.ok) {
        toast.error(r.error ?? "Delete failed");
        return;
      }
      toast.success("Account deleted");
      router.push("/");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <label
          htmlFor="confirm-email"
          className="type-mono-sm uppercase tracking-wider text-muted-foreground font-medium"
        >
          Type <span className="text-foreground">{email}</span> to confirm
        </label>
        <Input
          id="confirm-email"
          value={confirmValue}
          onChange={(e) => setConfirmValue(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
          placeholder={email}
        />
      </div>
      <Button type="submit" variant="destructive" disabled={!armed || pending}>
        {pending ? "Deleting…" : "Delete my account permanently"}
      </Button>
    </form>
  );
}
