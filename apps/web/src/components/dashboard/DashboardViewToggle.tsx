"use client";

import { useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, Network } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "vk.dashboard.view";

export function DashboardViewToggle() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const isGraph = params.get("display") === "graph";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (params.get("display")) return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "graph") {
      const next = new URLSearchParams(params);
      next.set("display", "graph");
      router.replace(`/dashboard?${next.toString()}`);
    }
  }, [params, router]);

  const setMode = (mode: "table" | "graph") => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }
    const next = new URLSearchParams(params);
    if (mode === "graph") {
      next.set("display", "graph");
    } else {
      next.delete("display");
    }
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `/dashboard?${qs}` : "/dashboard");
    });
  };

  return (
    <div className="inline-flex items-center rounded-md border bg-background p-0.5">
      <button
        type="button"
        onClick={() => setMode("table")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs",
          !isGraph
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutGrid className="size-3.5" />
        Table
      </button>
      <button
        type="button"
        onClick={() => setMode("graph")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs",
          isGraph
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Network className="size-3.5" />
        Graph
      </button>
    </div>
  );
}
