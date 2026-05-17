"use client";

import dynamic from "next/dynamic";
import type { RepoGraphInput } from "./RepoGraph";

const RepoGraph = dynamic(() => import("./RepoGraph").then((m) => m.RepoGraph), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full animate-pulse rounded-lg border bg-card/30" />
  ),
});

export function RepoGraphClient({ data }: { data: RepoGraphInput }) {
  return <RepoGraph data={data} />;
}
