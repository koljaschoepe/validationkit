"use client";

import { useMemo, useState, useTransition } from "react";
import { Download, Eye, Wrench } from "lucide-react";
import { toast } from "sonner";
import { isSupported } from "@vk/fixes";
import type { AuditFinding, SeverityBand } from "@vk/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ui/severity-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateFixesForScan } from "@/lib/fix-actions";

const SEV_RANK: Record<SeverityBand, number> = {
  Kill: 0,
  Weak: 1,
  Mid: 2,
  Strong: 3,
  Exceptional: 4,
};

interface PreviewState {
  title: string;
  patch: string;
  filesTouched: string[];
  rationale: string[];
}

export function FindingsList({
  scanId,
  findings,
}: {
  scanId: string | null;
  findings: AuditFinding[];
}) {
  const sorted = useMemo(
    () => [...findings].sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]),
    [findings],
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const supportedSelected = useMemo(
    () =>
      sorted.filter((f) => selected.has(f.id) && isSupported(f.category)),
    [sorted, selected],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllSupported() {
    setSelected(
      new Set(sorted.filter((f) => isSupported(f.category)).map((f) => f.id)),
    );
  }
  function clearSelection() {
    setSelected(new Set());
  }

  function runFixes(
    findingIds: string[],
    mode: "preview" | "download",
    title = "Combined patch",
  ) {
    if (!scanId) {
      toast.error("Sign in and run a saved audit to enable fix-generation.");
      return;
    }
    startTransition(async () => {
      const result = await generateFixesForScan(scanId, findingIds);
      if (!result.ok || !result.patch) {
        toast.error(result.error ?? "Fix generation failed.");
        return;
      }
      if (result.failures && result.failures.length > 0) {
        toast.warning(
          `${result.failures.length} fix${result.failures.length === 1 ? "" : "es"} skipped`,
          {
            description: result.failures
              .map((f) => f.reason)
              .slice(0, 2)
              .join(" · "),
          },
        );
      }
      if (
        result.skippedLlmDisabled &&
        result.skippedLlmDisabled.length > 0
      ) {
        toast.info(
          `${result.skippedLlmDisabled.length} LLM-augmented fix${result.skippedLlmDisabled.length === 1 ? "" : "es"} skipped`,
          {
            description:
              "Set ANTHROPIC_API_KEY (or OPENAI_API_KEY) to enable.",
          },
        );
      }
      if (mode === "preview") {
        setPreview({
          title,
          patch: result.patch,
          filesTouched: result.filesTouched ?? [],
          rationale: result.rationale ?? [],
        });
      } else {
        downloadPatch(result.patch, slugify(title));
        toast.success("Patch downloaded", {
          description: `Apply with: git apply ${slugify(title)}.patch`,
        });
      }
    });
  }

  if (sorted.length === 0) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-4 text-sm space-y-2">
          <p>
            <strong className="text-foreground">Concession:</strong> Audit
            passed cleanly. None of the 6 finding rules fired.
          </p>
          <p className="text-muted-foreground">
            <strong className="text-foreground">Critique:</strong> the
            deterministic-set is intentionally narrow. A green report means none
            of the load-bearing red flags showed up — not that the repo is
            perfect.
          </p>
        </CardContent>
      </Card>
    );
  }

  const supportedCount = sorted.filter((f) => isSupported(f.category)).length;

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-3 text-xs">
          <span className="font-medium">
            {selected.size} of {sorted.length} selected
          </span>
          <span className="text-muted-foreground">
            · {supportedSelected.length} have a deterministic fix
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={selectAllSupported}
              disabled={supportedCount === 0}
            >
              Select all fixable ({supportedCount})
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={clearSelection}
              disabled={selected.size === 0}
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7"
              disabled={
                pending || supportedSelected.length === 0 || !scanId
              }
              onClick={() =>
                runFixes(
                  supportedSelected.map((f) => f.id),
                  "preview",
                  `Fix ${supportedSelected.length} selected`,
                )
              }
            >
              <Eye className="size-3.5" />
              Preview diff
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7"
              disabled={
                pending || supportedSelected.length === 0 || !scanId
              }
              onClick={() =>
                runFixes(
                  supportedSelected.map((f) => f.id),
                  "download",
                  `validationkit-fix-${supportedSelected.length}-of-${sorted.length}`,
                )
              }
            >
              <Wrench className="size-3.5" />
              Fix {supportedSelected.length} selected
            </Button>
          </div>
        </CardContent>
      </Card>

      {sorted.map((f) => {
        const checked = selected.has(f.id);
        const fixable = isSupported(f.category);
        return (
          <Card key={f.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1.5 accent-primary"
                  checked={checked}
                  disabled={!fixable}
                  onChange={() => toggle(f.id)}
                  aria-label={`Select ${f.title}`}
                />
                <SeverityBadge severity={f.severity} />
                <CardTitle className="text-base flex-1">{f.title}</CardTitle>
                <Badge variant={f.deterministic ? "secondary" : "outline"} className="font-mono text-[0.65rem]">
                  {f.category}
                  {f.deterministic ? "" : " · LLM"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-sm text-muted-foreground">{f.detail}</p>
              {f.citations.length > 0 ? (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-1.5">
                    {f.citations.map((c, i) => (
                      <code
                        key={`${c.path}-${i}`}
                        className="rounded bg-muted px-1.5 py-0.5 text-[0.7rem] font-mono"
                      >
                        {c.path}
                        {c.line ? `:${c.line}` : ""}
                      </code>
                    ))}
                  </div>
                </>
              ) : null}
              {fixable && scanId ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => runFixes([f.id], "preview", f.title)}
                  >
                    <Eye className="size-3.5" />
                    Preview diff
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      runFixes([f.id], "download", `validationkit-fix-${f.id}`)
                    }
                  >
                    <Download className="size-3.5" />
                    Download patch
                  </Button>
                </div>
              ) : null}
              {!fixable ? (
                <p className="text-xs text-muted-foreground">
                  No fix-generator covers this category yet (e.g.{" "}
                  <code className="font-mono text-[0.7rem]">conflicting-rules</code>{" "}
                  remains LLM-eval-only in v0.0.17).
                </p>
              ) : null}
              {fixable && !f.deterministic ? (
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">LLM-augmented:</strong>{" "}
                  requires <code className="font-mono">ANTHROPIC_API_KEY</code>{" "}
                  (or <code className="font-mono">OPENAI_API_KEY</code>). Without
                  a key the action returns the disabled-state. Confidence band
                  shown above the diff.
                </p>
              ) : null}
              {fixable && !scanId ? (
                <p className="text-xs text-muted-foreground">
                  Sign in + run a saved audit to generate patches.
                </p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}

      <Dialog
        open={!!preview}
        onOpenChange={(open) => !open && setPreview(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{preview?.title}</DialogTitle>
            <DialogDescription>
              {preview?.filesTouched.length} file
              {preview?.filesTouched.length === 1 ? "" : "s"} touched. Apply
              with{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                git apply
              </code>
              .
            </DialogDescription>
          </DialogHeader>
          {preview?.rationale && preview.rationale.length > 0 ? (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {preview.rationale.map((r, i) => (
                <li key={i}>· {r}</li>
              ))}
            </ul>
          ) : null}
          <pre className="max-h-[50vh] overflow-auto rounded-md border bg-muted/50 p-3 text-[0.7rem] font-mono whitespace-pre-wrap break-words">
            {preview?.patch}
          </pre>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPreview(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (!preview) return;
                downloadPatch(preview.patch, slugify(preview.title));
                toast.success("Patch downloaded");
              }}
            >
              <Download className="size-3.5" />
              Download patch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function downloadPatch(patch: string, baseName: string): void {
  const blob = new Blob([patch], { type: "text/x-patch;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${baseName}.patch`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
