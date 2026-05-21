/**
 * Loading-Boundary-Helper für App-Router. Drei Varianten passend zum
 * jeweiligen Page-Shape:
 *
 * - "list":     Skeleton-Rows in einer Page-Shell (Customers, Scans, Requests)
 * - "detail":   Header + Content-Block (Customer-Detail, Scan-Detail)
 * - "settings": SettingsLayout-Sidebar + Content-Block
 *
 * Verwendung in loading.tsx:
 *
 *   import { PageSkeleton } from "@/components/ui-vk/PageSkeleton";
 *   export default function Loading() {
 *     return <PageSkeleton variant="list" />;
 *   }
 */

type Variant = "list" | "detail" | "settings";

export function PageSkeleton({ variant = "list" }: { variant?: Variant }) {
  if (variant === "settings") {
    return (
      <div className="mx-auto flex w-full max-w-6xl gap-8 px-6 py-10">
        <aside className="w-60 space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-8 w-full animate-pulse rounded bg-muted/70" />
          <div className="h-8 w-full animate-pulse rounded bg-muted/50" />
          <div className="h-8 w-full animate-pulse rounded bg-muted/50" />
          <div className="h-8 w-full animate-pulse rounded bg-muted/50" />
        </aside>
        <main className="flex-1 space-y-6">
          <div className="h-7 w-64 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-muted/60" />
          <div className="h-32 w-full animate-pulse rounded bg-muted/40" />
        </main>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 px-6 py-10">
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted/60" />
          <div className="h-8 w-96 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-48 w-full animate-pulse rounded bg-muted/40" />
        <div className="h-32 w-full animate-pulse rounded bg-muted/30" />
      </div>
    );
  }

  // list (default)
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10">
      <div className="space-y-2">
        <div className="h-7 w-64 animate-pulse rounded bg-muted" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted/60" />
      </div>
      <div className="space-y-2">
        <div className="h-14 w-full animate-pulse rounded bg-muted/40" />
        <div className="h-14 w-full animate-pulse rounded bg-muted/30" />
        <div className="h-14 w-full animate-pulse rounded bg-muted/30" />
      </div>
    </div>
  );
}
