import { PageSkeleton } from "@/components/ui-vk";

// Bundle D: use the shared PageSkeleton (list variant) instead of an ad-hoc
// skeleton, matching [workspace]/loading.tsx.
export default function ScansLoading() {
  return <PageSkeleton variant="list" />;
}
