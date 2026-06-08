import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const here = path.dirname(fileURLToPath(import.meta.url));

// K8 — Content-Security-Policy. Shipped Report-Only first (24h observation,
// then flip to enforce per plan §9). The policy is sized for our actual
// runtime surface:
//   - script/style 'unsafe-inline': Next.js inline bootstrap + motion/GSAP +
//     Tailwind inject inline; nonce-based CSP is a later hardening pass.
//   - js.stripe.com + frame-src stripe: Stripe Elements/Checkout iframes.
//   - blob: worker-src + blob:/data: img: PixiJS v8 WebGL (workers, textures).
//   - connect-src https: stays permissive in Report-Only; tighten to the exact
//     hosts (Stripe API, Inngest, Neon) before flipping to enforce.
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

// Enforced security headers (CSP is Report-Only above). Applied to every route.
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy-Report-Only", value: CSP_DIRECTIVES },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const config: NextConfig = {
  transpilePackages: [
    "@vk/core",
    "@vk/parser",
    "@vk/audit",
    "@vk/billing",
    "@vk/auth",
    "@vk/db",
    "@vk/fixes",
    "@vk/pr-workflow",
    "@vk/github-app",
    "@vk/inngest",
  ],
  serverExternalPackages: [
    "fast-glob",
    "gray-matter",
    "postgres",
    "better-auth",
    "nodemailer",
    "inngest",
  ],
  turbopack: {
    root: path.resolve(here, "..", ".."),
  },
  typedRoutes: true,
  // Phase Nova-2 P7: tree-shake-friendly imports for the libraries we use most.
  // lucide-react is the dominant offender — without this, every imported icon
  // drags the full barrel-file into the build.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "d3-hierarchy",
      "d3-zoom",
      "d3-selection",
    ],
  },
  // Bundle markdown + JSON read at runtime by route handlers.
  // Sprint 1.0: legal markdown for /trust/dpa + sub-processors.
  // Sprint 1.5: eval-results JSON for /trust/eval + per-customer onboarding md.
  outputFileTracingIncludes: {
    "/trust/dpa": ["../../docs/legal/dpa-template.md"],
    "/trust/sub-processors.json": ["../../docs/legal/sub-processors.md"],
    "/trust/sub-processors.xml": ["../../docs/legal/sub-processors.md"],
    "/trust/eval": ["../../eval/conflicts/results/*.json"],
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  async redirects() {
    return [
      // Phase Nova-2 P5: user-scope settings moved out of the workspace tree.
      // Hard-redirect old bookmarks at the edge so the in-app page doesn't
      // need to render at all.
      {
        source: "/:workspace/settings/user",
        destination: "/account/settings/profile",
        permanent: true,
      },
      {
        source: "/:workspace/settings/user/:path*",
        destination: "/account/settings/profile",
        permanent: true,
      },
    ];
  },
};

export default config;
