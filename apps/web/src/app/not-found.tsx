import Link from "next/link";
import { Compass } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Compass className="size-5 text-primary" />
              <CardTitle className="text-base">Route not found.</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              No page matches this URL. The most useful entry points:
            </p>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  / — anonymous audit
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  /pricing — tiers + FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  /dashboard — signed-in workspace
                </Link>
              </li>
              <li>
                <Link
                  href="/trust"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  /trust — DPA + sub-processor feed
                </Link>
              </li>
            </ul>
            <div className="pt-1">
              <Button asChild size="sm">
                <Link href="/">Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
