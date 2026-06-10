"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
} from "motion/react";
import { ArrowRightIcon, CheckIcon } from "lucide-react";
import { RepoUrlPill } from "./RepoUrlPill";

// Landing-Redesign Phase J — narrative sections below the demo. Screenshots are
// real captures of the running app (public demo screens). Section gaps ~96px,
// no decorative dividers, whileInView-once entrances (reduced-motion gated).

const EASE = [0.22, 1, 0.36, 1] as const;

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      className={className}
    >
      {children}
    </m.div>
  );
}

// Split into two exports around the page's other sections:
// Hero (live console surface) → Features → SocialProof.
export function LandingFeatures() {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="flex flex-col gap-24 pt-20 sm:gap-28 sm:pt-24">
          <LogoStrip />
          <FeatureBlocks />
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}

export function LandingSocialProof() {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="flex flex-col gap-24 py-24 sm:gap-28">
          <Principles />
          <PricingTeaser />
          <FinalCTA />
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}

// ── Honest proof strip ───────────────────────────────────────────────────────
// Pre-launch with zero customers: no fabricated logos or usage stats (legal +
// credibility risk). We lead with what's actually verifiable about the product.
const PROOF_POINTS = [
  "5 von 6 Audit-Regeln deterministisch",
  "Jedes Finding mit file:line-Beleg",
  "Severity-Bänder statt Fake-Scores",
  "Anonymes Audit ohne Account",
];

function LogoStrip() {
  return (
    <section
      aria-label="Was ValidationKit ausmacht"
      className="mx-auto w-full max-w-5xl px-4 sm:px-6"
    >
      <Reveal className="flex flex-col items-center gap-6 text-center">
        <p className="font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
          Early Access · für DACH-B2B-Consultancies
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {PROOF_POINTS.map((p) => (
            <li
              key={p}
              className="flex items-center gap-2 font-mono type-mono-sm text-muted-foreground"
            >
              <CheckIcon
                className="size-3.5 text-[var(--color-sev-strong)]"
                aria-hidden="true"
              />
              {p}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

// ── Chess / alternating feature blocks ──────────────────────────────────────
const FEATURES = [
  {
    n: "1.0",
    eyebrow: "Intake",
    title: "Ein Repo-Link, kein Setup",
    body: "Wirf eine GitHub-URL rein und ValidationKit klont, parst und auditiert AGENTS.md, CLAUDE.md, Cursor-Rules und Co. in Sekunden. Kein CI-Gefummel, keine Agent-Installation.",
    img: "/landing/intake-pill.png",
    alt: "Eingabefeld der Live-Demo mit einer GitHub-Repo-URL",
    contain: true,
  },
  {
    n: "2.0",
    eyebrow: "Audit",
    title: "Konflikte, bevor sie Drift werden",
    body: "Fünf deterministische Regeln plus LLM-Konflikt-Erkennung finden widersprüchliche Direktiven, Token-Budget-Overshoot, tote Verweise und Duplikate. Severity-Bänder statt Fake-Scores.",
    img: "/landing/audit-finding.png",
    alt: "Inspector mit einem Finding und der Severity Weak",
    contain: false,
  },
  {
    n: "3.0",
    eyebrow: "Konsole",
    title: "Dein ganzes Portfolio auf einen Blick",
    body: "Jedes Kunden-Repo eine Zeile, nach Severity sortiert. Was brennt, steht oben, der Rest bleibt ruhig. Du siehst über alle Mandanten sofort, wo es klemmt.",
    img: "/landing/konsole.png",
    alt: "Triage-Konsole mit Kunden-Repos nach Severity sortiert, kritische zuerst",
    contain: false,
  },
  {
    n: "4.0",
    eyebrow: "Fix",
    title: "AI-Fix, ein Klick, ein PR",
    body: "Für jedes Finding ein deterministischer oder AI-generierter Fix, als Patch oder direkter Pull-Request. Apply, dismiss oder snooze, alles auditierbar.",
    img: "/landing/fix-pr.png",
    alt: "Inspector mit Diff und dem Button Fix via PR",
    contain: false,
  },
] as const;

function FeatureBlocks() {
  return (
    <section
      aria-label="So funktioniert ValidationKit"
      className="mx-auto w-full max-w-6xl px-4 sm:px-6"
    >
      <Reveal className="mb-16 text-center">
        <p className="font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
          Vom Repo-Link zum gefixten PR
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Vier Schritte, eine Plattform
        </h2>
      </Reveal>

      <div className="flex flex-col gap-20">
        {FEATURES.map((f, i) => {
          const imageLeft = i % 2 === 1;
          return (
            <Reveal key={f.n}>
              <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
                <div className={imageLeft ? "md:order-2" : undefined}>
                  <p className="font-mono type-mono-sm uppercase tracking-wider text-primary">
                    {f.n} · {f.eyebrow}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </div>
                {/* Real app capture, framed like an app window. */}
                <div className={imageLeft ? "md:order-1" : undefined}>
                  {/* Hover-zoom: the frame clips, the capture scales in slightly.
                      Neutralised under prefers-reduced-motion. */}
                  <div className="group overflow-hidden rounded-xl border border-border bg-background shadow-xl shadow-black/30 transition-shadow duration-300 hover:shadow-2xl hover:shadow-black/40">
                    {f.contain ? (
                      <div className="flex aspect-[16/10] items-center justify-center px-6 sm:px-10">
                        <Image
                          src={f.img}
                          alt={f.alt}
                          width={1154}
                          height={90}
                          sizes="(max-width: 768px) 100vw, 560px"
                          className="h-auto w-full transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
                        />
                      </div>
                    ) : (
                      <div className="relative aspect-[16/10] w-full">
                        <Image
                          src={f.img}
                          alt={f.alt}
                          fill
                          sizes="(max-width: 768px) 100vw, 560px"
                          className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

// ── Testimonials ────────────────────────────────────────────────────────────
// Pre-launch: principles we can stand behind, not fabricated customer quotes.
const PRINCIPLES = [
  {
    title: "Belegbar statt Bauchgefühl",
    body: "Fünf der sechs Regeln sind deterministisch. Jedes Finding zeigt Datei und Zeile — keine erfundenen Scores, keine Blackbox.",
  },
  {
    title: "Nur Kill schreit",
    body: "Severity-Bänder statt Prozentzahlen. Was wirklich brennt, steht oben und ist rot. Der Rest bleibt ruhig, damit du den Wald siehst.",
  },
  {
    title: "Read-only by default",
    body: "ValidationKit liest, bevor es schreibt. PRs und Fixes nur auf deinen Klick — über alle Kunden-Repos hinweg, alles auditierbar.",
  },
] as const;

function Principles() {
  return (
    <section
      aria-label="Prinzipien"
      className="mx-auto w-full max-w-6xl px-4 sm:px-6"
    >
      <Reveal className="mb-10 text-center">
        <p className="font-mono type-mono-sm uppercase tracking-wider text-primary">
          Warum ValidationKit
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Ehrliche Audits, keine Vibe-Scores
        </h2>
      </Reveal>
      <div className="grid gap-6 md:grid-cols-3">
        {PRINCIPLES.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.05}>
            <div className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card/40 p-6">
              <h3 className="text-base font-semibold text-foreground">
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {p.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal className="mx-auto mt-10 max-w-2xl text-center">
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          ValidationKit ist im Early Access — gebaut von einem Solo-Founder für
          AI-Consultancies, die mehrere Kunden-Repos sauber halten müssen. Kein
          Fake-Social-Proof: starte das anonyme Audit und urteil selbst.
        </p>
      </Reveal>
    </section>
  );
}

// ── Pricing teaser ──────────────────────────────────────────────────────────
const TIERS = [
  {
    name: "Free",
    tagline: "Ein Repo, manuelle Audits",
    points: ["1 Customer", "Deterministische Regeln", "Community-Support"],
    cta: "Kostenlos starten",
    featured: false,
  },
  {
    name: "Pro",
    tagline: "Mehr Repos, AI-Fixes, Credits",
    points: ["Bis 10 Customers", "AI-Konflikt-Erkennung + Fixes", "PR-Dispatch"],
    cta: "Pro testen",
    featured: true,
  },
  {
    name: "Team",
    tagline: "Workspaces, Rollen, BYOK",
    points: ["Unbegrenzte Customers", "RBAC + Member-Invites", "BYOK / eigene Keys"],
    cta: "Team anfragen",
    featured: false,
  },
] as const;

function PricingTeaser() {
  return (
    <section
      aria-labelledby="pricing-teaser-heading"
      className="mx-auto w-full max-w-6xl px-4 sm:px-6"
    >
      <Reveal className="mb-12 text-center">
        <p className="font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
          Preise
        </p>
        <h2
          id="pricing-teaser-heading"
          className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          Skaliert mit deinem Portfolio
        </h2>
      </Reveal>

      <div className="grid gap-6 md:grid-cols-3">
        {TIERS.map((tier, i) => (
          <Reveal key={tier.name} delay={i * 0.05}>
            <div
              className={
                "flex h-full flex-col gap-5 rounded-xl border p-6 " +
                (tier.featured
                  ? "border-primary/50 bg-primary/[0.04]"
                  : "border-border bg-card/40")
              }
            >
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {tier.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tier.tagline}
                </p>
              </div>
              <ul className="flex flex-1 flex-col gap-2">
                {tier.points.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2 text-sm text-foreground/85"
                  >
                    <CheckIcon
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className={
                  "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 " +
                  (tier.featured
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border border-border bg-card/40 text-foreground hover:bg-muted/40")
                }
              >
                {tier.cta}
              </Link>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-8 text-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 font-mono type-mono-sm text-muted-foreground hover:text-foreground"
        >
          Alle Pläne und Credit-Details ansehen
          <ArrowRightIcon className="size-3.5" aria-hidden="true" />
        </Link>
      </Reveal>
    </section>
  );
}

// ── Final CTA ───────────────────────────────────────────────────────────────
// The repo-URL pill IS the CTA: paste a link → the hero console runs a real
// anonymous audit (decoupled via the `vk:audit-repo` event ConsoleSurface
// listens for, then scroll up to the live result).
function FinalCTA() {
  function startAudit(path: string) {
    window.dispatchEvent(new CustomEvent("vk:audit-repo", { detail: path }));
    document
      .getElementById("demo")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <section aria-label="Jetzt starten" className="w-full px-4 sm:px-6">
      <Reveal className="mx-auto w-full max-w-3xl">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card/40 px-6 py-16 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Audit dein erstes Repo in unter einer Minute
          </h2>
          <p className="-mt-1 max-w-md text-pretty text-base text-muted-foreground">
            Repo-Link einfügen — wir scannen AGENTS.md &amp; Co. live, nach
            Severity sortiert. Keine Kreditkarte, kein Setup.
          </p>
          <div className="w-full max-w-md">
            <RepoUrlPill pending={false} onSubmit={startAudit} size="hero" />
          </div>
          <Link
            href="/login"
            className="font-mono type-mono-sm text-muted-foreground transition hover:text-foreground"
          >
            oder kostenlos einen Account anlegen →
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
