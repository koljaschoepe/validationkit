import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="main-content" aria-label="Main content">
        <HeroSection />
        <HowItWorks />
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
