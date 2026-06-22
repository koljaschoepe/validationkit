"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Sprint G3 — legt nur einen Customer-Record an. Repo-Add ist ein
// eigener Flow auf der Customer-Detail-Seite (AddRepoForm).
export function AddCustomerForm({ workspaceSlug }: { workspaceSlug: string }) {
  const [label, setLabel] = useState("");
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("workspace", workspaceSlug);
      fd.set("label", label);
      const result = await submitAddCustomer(fd);
      if (!result.ok) {
        const msg = result.error ?? "Kunde konnte nicht angelegt werden.";
        setErr(msg);
        toast.error(msg);
        return;
      }
      setLabel("");
      toast.success("Kunde angelegt.");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="label" className="text-sm">
              Customer label
            </Label>
            <Input
              id="label"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Acme Robotics"
            />
            <p className="text-xs text-muted-foreground">
              Slug is auto-generated from the label.
            </p>
          </div>
          <Button type="submit" disabled={pending} size="sm">
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Adding…
              </>
            ) : (
              "Add customer"
            )}
          </Button>
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

// Thin server-action wrapper so the client-component can call the DAL
// without bundling the Drizzle imports.
async function submitAddCustomer(
  fd: FormData,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { addCustomerAction } = await import("@/lib/customer-actions");
  return addCustomerAction(fd);
}
