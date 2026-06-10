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

// Split into two exports so the page can interleave the live galaxie + demo
// between them: Hero → Features → Portfolio-Map → Live-Demo → SocialProof.
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
          <Testimonials />
          <PricingTeaser />
          <FinalCTA />
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}

// ── Logo strip + hard usage stat ────────────────────────────────────────────
const LOGOS = ["Acme", "Globex", "Initech", "Umbrella", "Hooli", "Soylent"];

function LogoStrip() {
  return (
    <section
      aria-label="Genutzt von"
      className="mx-auto w-full max-w-5xl px-4 sm:px-6"
    >
      <Reveal className="flex flex-col items-center gap-6 text-center">
        <p className="font-mono type-mono-sm uppercase tracking-wider text-muted-foreground">
          {/* Placeholder stat */}
          2.400+ Kunden-Repos auditiert · 18.000+ Findings gefixt
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {LOGOS.map((name) => (
            <li
              key={name}
              className="font-mono text-sm font-medium text-muted-foreground/50"
            >
              {name}
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
    eyebrow: "Portfolio-Map",
    title: "Dein ganzes Portfolio auf einen Blick",
    body: "Jede Sonne ein Repo, die Farbe ist die Severity. Was brennt, leuchtet rot, der Rest bleibt ruhig. Du siehst über alle Mandanten sofort, wo es klemmt.",
    img: "/landing/portfolio-map.png",
    alt: "Portfolio-Map mit sechs Kunden-Repos, zwei davon kritisch",
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
                  <div className="overflow-hidden rounded-xl border border-border bg-[#07080a] shadow-xl shadow-black/30">
                    {f.contain ? (
                      <div className="flex aspect-[16/10] items-center justify-center px-6 sm:px-10">
                        <Image
                          src={f.img}
                          alt={f.alt}
                          width={1154}
                          height={90}
                          sizes="(max-width: 768px) 100vw, 560px"
                          className="h-auto w-full"
                        />
                      </div>
                    ) : (
                      <div className="relative aspect-[16/10] w-full">
                        <Image
                          src={f.img}
                          alt={f.alt}
                          fill
                          sizes="(max-width: 768px) 100vw, 560px"
                          className="object-cover object-top"
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
const TESTIMONIALS = [
  {
    quote:
      "Wir managen 40+ Kunden-Repos. ValidationKit fängt Konflikte ab, bevor sie in Produktion landen. Das hat uns einen ganzen Incident erspart.",
    name: "Lena M.",
    role: "Founder, AI-Consultancy",
  },
  {
    quote:
      "Die Galaxie ist kein Gimmick. Ich sehe sofort, welches Repo brennt und warum. Onboarding neuer Kunden dauert jetzt Minuten.",
    name: "Tomasz K.",
    role: "Principal Engineer",
  },
  {
    quote:
      "Endlich ein Audit-Tool, das AGENTS.md ernst nimmt. Die Severity-Bänder sind ehrlich, die Fixes anwendbar.",
    name: "Priya R.",
    role: "Head of Platform",
  },
] as const;

function Testimonials() {
  return (
    <section
      aria-label="Was Kunden sagen"
      className="mx-auto w-full max-w-6xl px-4 sm:px-6"
    >
      <div className="grid gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.05}>
            <figure className="flex h-full flex-col gap-4 rounded-xl border border-border bg-card/40 p-6">
              <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                „{t.quote}"
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs text-muted-foreground"
                  aria-hidden="true"
                >
                  {t.name.slice(0, 2)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {t.name}
                  </span>
                  <span className="block truncate type-mono-sm text-muted-foreground">
                    {t.role}
                  </span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
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
function FinalCTA() {
  return (
    <section aria-label="Jetzt starten" className="w-full px-4 sm:px-6">
      <Reveal className="mx-auto w-full max-w-5xl">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card/40 px-6 py-16 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Audit dein erstes Repo in unter einer Minute
          </h2>
          <Link
            href="/login"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          >
            Kostenlos starten
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
