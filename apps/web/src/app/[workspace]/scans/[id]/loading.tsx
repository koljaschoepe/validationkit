import { PageSkeleton } from "@/components/ui-vk";

// Bundle D: the scan-detail page does a blocking DB read; without this the user
// saw a hard blank between navigation and data. Matches the loaded layout.
export default function ScanDetailLoading() {
  return <PageSkeleton variant="detail" />;
}
