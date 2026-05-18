# Security Policy

## Reporting a Vulnerability

**Please do not file a public GitHub issue for security vulnerabilities.**

Send a private email to **kol.schoepe@gmail.com** with:

- A short title and severity ranking ({Kill, Weak, Mid, Strong, Exceptional} works fine).
- A reproducer or proof-of-concept (PoC).
- The affected version(s) and commit SHA(s) if you have them.
- Your preferred attribution (handle / link / "anonymous").

**Acknowledgement SLA:** within **7 calendar days** of receiving the report.

**Fix SLA:**
- Critical (auth bypass, RCE, data leak): patch within 14 days, public disclosure once a fix ships.
- High (privilege escalation, sensitive-info disclosure): 30 days.
- Mid / Low: 90 days, or the next scheduled release.

## What's in scope

- This repository's code, especially anything under `apps/web/`, `packages/`, and the published `validationkit-cli` npm package.
- The hosted production deployment at https://validationkit.vercel.app.
- Audit-logic correctness issues that would mislead a customer about their repo's state (eg. a finding that hides a real issue, or a fix-generator that produces an unsafe patch).

## What's out of scope

- Issues that require physical access to the maintainer's machine.
- Social engineering of the maintainer or contributors.
- DDoS / volumetric attacks against the hosted deployment.
- Vulnerabilities in third-party services we depend on (report those upstream — Vercel, Neon, Stripe, Anthropic, etc.).
- Findings against the marketing copy, blog posts, or sub-processor list.

## Bug-bounty status

**There is no bug-bounty program in 2026.** This project is solo-maintained pre-revenue ([PRD §9](docs/PRD.md)). I cannot pay cash rewards. I will:

- Credit you publicly in the security-advisory and the next release notes (unless you ask me not to).
- Send you a small "thank you" in the form of a free Agency-tier subscription once the hosted product reaches GA, if you want it.

## Disclosure timeline

When a fix ships, I publish a GitHub Security Advisory at https://github.com/koljaschoepe/validationkit/security/advisories with:

- Severity band + CVSS-equivalent reasoning
- Affected versions
- Patched versions
- Workarounds (if any)
- Credit (per your preference)

## Compliance reporting

If your report relates to GDPR / data-handling / sub-processor compliance, also see:

- [Trust Center](https://validationkit.vercel.app/trust)
- [DPA](https://validationkit.vercel.app/trust/dpa)
- [Sub-processor RSS feed](https://validationkit.vercel.app/trust/sub-processors.xml)

## Acknowledgements

Researchers who have responsibly disclosed will be listed here once the first
report lands.
