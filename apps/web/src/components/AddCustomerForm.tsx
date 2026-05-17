"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addCustomer } from "@/lib/customers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AddCustomerForm() {
  const [label, setLabel] = useState("");
  const [rootPath, setRootPath] = useState("");
  const [github, setGithub] = useState("");
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [upgrade, setUpgrade] = useState<
    | { used: number; quota: number; reason: string }
    | null
  >(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    setUpgrade(null);
    startTransition(async () => {
      const result = await addCustomer({
        label,
        rootPath,
        githubFullName: github || undefined,
      });
      if (!result.ok) {
        if (result.upgradeRequired) {
          setUpgrade({
            used: result.used ?? 0,
            quota: result.quota ?? 0,
            reason: result.error,
          });
          return;
        }
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
    <>
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
                placeholder="Acme — frontend"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rootPath" className="text-sm">
                Root path or github:// URI
              </Label>
              <Input
                id="rootPath"
                required
                value={rootPath}
                onChange={(e) => setRootPath(e.target.value)}
                placeholder="/Users/you/code/acme-frontend or github://acme/frontend"
                spellCheck={false}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="github" className="text-sm">
                GitHub full name (optional)
              </Label>
              <Input
                id="github"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="acme/frontend"
                spellCheck={false}
                className="font-mono text-xs"
              />
            </div>
            <Button type="submit" disabled={pending} size="sm">
              {pending ? "Adding…" : "Add customer"}
            </Button>
            {err ? (
              <p className="text-sm text-destructive">{err}</p>
            ) : null}
            {ok ? (
              <p className="text-sm text-muted-foreground">
                Added. Run an audit at{" "}
                <Link href="/" className="text-primary underline-offset-4 hover:underline">
                  /
                </Link>{" "}
                against the rootPath to see findings on the detail page.
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Dialog open={!!upgrade} onOpenChange={(open) => !open && setUpgrade(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>You&apos;ve hit your repo limit</DialogTitle>
            <DialogDescription>
              {upgrade?.reason ??
                "Your current tier has no headroom for another repo."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Concession:</strong> The free tier exists because most
              indie hackers don&apos;t hit two repos.
            </p>
            <p className="text-muted-foreground">
              <strong className="text-foreground">Critique:</strong> Your second
              repo signals real business need — Solo Indie at $19/mo is less
              than a single Stripe test charge.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUpgrade(null)}>
              Not now
            </Button>
            <Button asChild>
              <Link href="/billing">See plans</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
