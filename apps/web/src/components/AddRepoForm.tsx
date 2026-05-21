"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AddRepoForm({
  workspaceSlug,
  customerId,
}: {
  workspaceSlug: string;
  customerId: string;
}) {
  const [label, setLabel] = useState("");
  const [rootPath, setRootPath] = useState("");
  const [github, setGithub] = useState("");
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("workspace", workspaceSlug);
      fd.set("customerId", customerId);
      fd.set("label", label);
      fd.set("rootPath", rootPath);
      if (github) fd.set("githubFullName", github);
      const { addRepoAction } = await import("@/lib/customer-actions");
      const result = await addRepoAction(fd);
      if (!result.ok) {
        setErr(result.error ?? "Failed to add repo.");
        return;
      }
      setLabel("");
      setRootPath("");
      setGithub("");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="repo-label" className="text-sm">
              Repo label
            </Label>
            <Input
              id="repo-label"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="acme-frontend"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="repo-rootPath" className="text-sm">
              Root path or github:// URI
            </Label>
            <Input
              id="repo-rootPath"
              required
              value={rootPath}
              onChange={(e) => setRootPath(e.target.value)}
              placeholder="/Users/you/code/acme-frontend or github://acme/frontend"
              spellCheck={false}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="repo-github" className="text-sm">
              GitHub full name (optional)
            </Label>
            <Input
              id="repo-github"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="acme/frontend"
              spellCheck={false}
              className="font-mono text-xs"
            />
          </div>
          <Button type="submit" disabled={pending} size="sm">
            {pending ? "Adding…" : "Add repo"}
          </Button>
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
