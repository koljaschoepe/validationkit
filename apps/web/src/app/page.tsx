import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { HeroText } from "@/components/landing/HeroText";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingNarrative } from "@/components/landing/LandingNarrative";

// J1: the landing audit form invokes auditAction (scan + LLM) as a server
// action on this route. The foreground GitHub-URL path can exceed the 60s
// serverless default on a real repo — give it room. (The full fix is to push
// large GitHub audits to the Inngest background worker, which needs the worker
// to fetch the repo itself; tracked as K16 / Bundle B follow-up.)
export const maxDuration = 300;

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="main-content" aria-label="Main content">
        <HeroText />
        <HeroSection />
        <LandingNarrative />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row sm:px-8 font-mono type-mono-sm text-muted-foreground">
          <div>© 2026 ValidationKit</div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap items-center gap-6">
              <li>
                <Link href="/pricing" className="hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/trust" className="hover:text-foreground">
                  Trust
                </Link>
              </li>
              <li>
                <Link
                  href={"/legal/impressum" as never}
                  className="hover:text-foreground"
                >
                  Impressum
                </Link>
              </li>
              <li>
                <Link
                  href={"/legal/datenschutz" as never}
                  className="hover:text-foreground"
                >
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link href="/status" className="hover:text-foreground">
                  Status ●
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </>
  );
}
