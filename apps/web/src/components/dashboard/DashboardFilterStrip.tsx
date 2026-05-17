"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Plus, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const SAVED_VIEWS = [
  { id: "all", label: "All scans" },
  { id: "critical", label: "Critical only", severity: "Kill,Weak" },
  { id: "drift7d", label: "Drift >7d" },
  { id: "unused-agents", label: "Unused agents" },
  { id: "recent", label: "Recently audited" },
];

const SEVERITY_OPTIONS = ["All", "Kill", "Weak", "Mid", "Strong", "Exceptional"];
const ACTIVITY_OPTIONS = ["Any time", "Last 24h", "Last 7d", "Last 30d"];

export function DashboardFilterStrip() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const currentView = params.get("view") ?? "all";
  const currentSev = params.get("severity") ?? "All";
  const currentActivity = params.get("activity") ?? "Any time";

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === "" || value === "All" || value === "Any time" || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `/dashboard?${qs}` : "/dashboard");
    });
  };

  const activeView =
    SAVED_VIEWS.find((v) => v.id === currentView) ?? SAVED_VIEWS[0]!;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background/50 px-4 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <Bookmark className="size-3.5" />
            <span>{activeView.label}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Saved views</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SAVED_VIEWS.map((v) => (
            <DropdownMenuItem
              key={v.id}
              onSelect={() => setParam("view", v.id)}
            >
              {v.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <Plus className="size-3.5" />
            New view (Sprint 0.12)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            Severity: <Badge variant="secondary" className="ml-1">{currentSev}</Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {SEVERITY_OPTIONS.map((s) => (
            <DropdownMenuItem key={s} onSelect={() => setParam("severity", s)}>
              {s}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            Activity: <Badge variant="secondary" className="ml-1">{currentActivity}</Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {ACTIVITY_OPTIONS.map((a) => (
            <DropdownMenuItem key={a} onSelect={() => setParam("activity", a)}>
              {a}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          Graph view: Sprint 0.12
        </span>
      </div>
    </div>
  );
}
