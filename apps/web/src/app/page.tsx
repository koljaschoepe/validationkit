import { SiteNav } from "@/components/SiteNav";
import { LegalFooter } from "@/components/LegalFooter";
import { HeroText } from "@/components/landing/HeroText";
import {
  LandingFeatures,
  LandingSocialProof,
} from "@/components/landing/LandingNarrative";

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
        <LandingFeatures />
        <LandingSocialProof />
      </main>

      <LegalFooter />
    </>
  );
}
