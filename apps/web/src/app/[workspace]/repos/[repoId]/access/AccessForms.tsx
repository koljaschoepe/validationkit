"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteAdmin, revokeMember } from "@/lib/membership";
import { decideInstall } from "@/lib/install-requests";

function InviteForm({ workspaceId }: { workspaceId: string }) {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = email.trim();
    if (!cleaned) return;
    startTransition(async () => {
      const r = await inviteAdmin(workspaceId, cleaned);
      if (!r.ok) {
        toast.error(r.error ?? "Invite failed");
        return;
      }
      if (r.alreadyMember) {
        toast.message("Already a member.");
      } else {
        toast.success(`Invited ${cleaned}`, {
          description:
            "We emailed them an invite. New users are added automatically on their first sign-in.",
        });
      }
      setEmail("");
      // Re-fetch the server-rendered member/invite list so the new pending
      // invite shows up without a manual reload.
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-1.5">
        <label
          htmlFor="invite-email"
          className="type-mono-sm uppercase tracking-wider text-muted-foreground font-medium"
        >
          Invite Customer-Admin
        </label>
        <Input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="customer-admin@example.com"
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending || !email}>
        {pending ? "Inviting…" : "Invite as admin"}
      </Button>
    </form>
  );
}

function RevokeButton({
  workspaceId,
  membershipId,
}: {
  workspaceId: string;
  membershipId: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7"
      disabled={pending}
      onClick={() => {
        if (!confirm("Revoke this member's access?")) return;
        startTransition(async () => {
          const r = await revokeMember(workspaceId, membershipId);
          if (!r.ok) {
            toast.error(r.error ?? "Revoke failed");
          } else {
            toast.success("Member revoked");
            router.refresh();
          }
        });
      }}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}

function DecideButtons({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const router = useRouter();

  function decide(decision: "approved" | "rejected") {
    startTransition(async () => {
      const r = await decideInstall(requestId, decision, note || null);
      if (!r.ok) {
        toast.error(r.error ?? "Decision failed");
      } else {
        toast.success(
          decision === "approved"
            ? "Approved — write-token mintable now."
            : "Rejected.",
        );
        setNote("");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Decision reason (optional, lands in DPA audit-log)"
        className="text-xs"
      />
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => decide("rejected")}
        >
          <X className="size-3.5" />
          Reject
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => decide("approved")}
        >
          <Check className="size-3.5" />
          Approve
        </Button>
      </div>
    </div>
  );
}

export const AccessForms = {
  InviteForm,
  RevokeButton,
  DecideButtons,
};
