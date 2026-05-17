# A4 — Multi-LLM Cost & Quality for Audit Use-Case

**Date:** 2026-05-17 · **Scope:** ValidationKit conflict-detection ("Are these 2 markdown files in conflict? YES/NO + confidence + 1-line reason"). Input ~4k tokens, output ~80 tokens. Quality bar: FPR ≤ 15%.

## Cost-Math-Annahme

Pro Audit: 4 000 input + 80 output Tokens. Pro 100 Audits: 400k input + 8k output. Bei 100/Tag = 12M in + 240k out/Monat. Bei 5 000/Tag = 600M in + 12M out/Monat.

## Provider-Table (Mai 2026)

| Provider / Modell | $/1M in | $/1M out | $ / 100 Audits | Quality (Reasoning + Struct-Out) | Free-Tier | AI-SDK |
|---|---|---|---|---|---|---|
| **Claude Sonnet 4.6** | $3.00 | $15.00 | **$1.32** | Strong (II 52) | nein | `@ai-sdk/anthropic` first-class |
| **Claude Haiku 4.5** | $1.00 | $5.00 | **$0.44** | Mid-Strong (II 37) | nein | `@ai-sdk/anthropic` |
| **GPT-5 Mini** | $0.25 | $2.00 | **$0.116** | Strong (II 49) | nein, aber $5 Trial-Credit | `@ai-sdk/openai` first-class |
| **GPT-5 Nano** | $0.05 | $0.40 | **$0.023** | Mid (II 44) | nein | `@ai-sdk/openai` |
| **Gemini 2.5 Flash** | $0.30 | $2.50 | **$0.14** | Mid (II 35, Gemini 3 Flash) | **JA** — unlimited Free-Tier-Tokens (RPD-cap) | `@ai-sdk/google` first-class |
| **Groq Llama 4 Scout** | $0.11 | $0.34 | **$0.047** | Weak-Mid | **JA** — 1 000 RPD / 6k TPM | `@ai-sdk/groq` first-class |
| **Groq Llama 3.3 70B** | $0.59 | $0.79 | **$0.24** | Weak (II 14) | 1 000 RPD | `@ai-sdk/groq` |
| **OpenRouter Auto** | passthrough | passthrough | varies | varies (routes to best) | 5 % BYOK-Markup, erste 1M Req gratis | community-Provider, ok |

Quellen: [Anthropic 2026-Preise](https://benchlm.ai/blog/posts/claude-api-pricing) (2026-04), [GPT-5 Mini/Nano](https://pricepertoken.com/pricing-page/model/openai-gpt-5-mini) (2026), [Gemini 2.5 Flash](https://ai.google.dev/gemini-api/docs/pricing) (2026-05), [Groq Preise](https://groq.com/pricing) (2026-05), [Groq Free-Tier](https://tokenmix.ai/blog/groq-free-tier-limits-2026) (2026), [OpenRouter Auto](https://openrouter.ai/openrouter/auto), [Artificial Analysis Intelligence Index](https://artificialanalysis.ai/leaderboards/models) (2026-05).

## Monthly-Cost-Szenarien

| Volumen | Sonnet 4.6 | Haiku 4.5 | GPT-5 Mini | GPT-5 Nano | Gemini Flash | Groq Llama 4 |
|---|---|---|---|---|---|---|
| Phase 0 (100/Tag = 3k/mo) | $40 | $13 | $3.50 | $0.69 | $4.20 | $1.41 |
| Phase 1 low (500/Tag = 15k/mo) | $198 | $66 | $17 | $3.45 | $21 | $7.05 |
| Phase 1 high (5k/Tag = 150k/mo) | $1 980 | $660 | $174 | $34.50 | $210 | $70.50 |

**Annahme:** prompt-caching ungenutzt. Mit Anthropic-Caching: −90 % auf cached input → Sonnet-4.6-Kosten halbieren sich realistisch bei wiederholten Templates.

## Quality-Severity-Bänder (für 2-File-Conflict-YES/NO)

- **Strong (FPR ≤ 10 %, defensibel für Paid-Tier):** Sonnet 4.6, GPT-5 Mini, Opus 4.7.
- **Mid (FPR 10–20 %, defensibel für Free-Tier mit Disclaimer):** Haiku 4.5, GPT-5 Nano, Gemini 2.5 Flash.
- **Weak (FPR > 20 %, nicht defensibel für Audit-Headline):** Llama 3.3 70B, Llama 4 Scout — Intelligence-Index 14–20, in 2026-Benchmarks für strukturierte-Reasoning-Tasks unterhalb der PRD §5.13-Bar.
- **Caveat:** ohne 30-File-Golden-Set-Eval (PRD §5.13) sind alle Mid/Weak-Banden vorläufig. Eval-Build ist Phase-0-W2-Pflicht bevor irgendein Modell als Default produktiv geht.

## Empfehlungen

### 1) Default für Free-Tier-Users → **GPT-5 Nano** als Primary, **Gemini 2.5 Flash** als Free-Tier-Fallback

- **Warum Nano:** $0.023/100 Audits ist 57× billiger als Sonnet, II 44 ist Mid (nicht Weak), `@ai-sdk/openai` Tier-1.
- **Warum Gemini als Fallback:** echtes Free-Tier mit unbegrenztem Token-Volumen (nur RPD-cap), zero-cost Phase-0-Bridge. Risiko: Google ändert Free-Tier regelmäßig.
- **NICHT Groq als Default:** 1 000 RPD-Cap killt Phase-1-Skalierung; Llama-Quality unter PRD §5.13-Bar.

### 2) Upgrade für Paid-Tier ($19/$79 Indie, $299/$799 Agency) → **Claude Sonnet 4.6**

- Aktuelle Implementation behalten. Strong-Banded II 52, beste Audit-Defensibilität für Agency-Reports.
- **Add prompt-caching** (−90 % cached input) bevor Phase 1 — halbiert Marginal-Kost auf ~$330/Monat bei 5k/Tag.

### 3) Multi-LLM-Abstraction → **AI-SDK direkt, kein Gateway**

- **Vercel AI Gateway:** zero-markup, aber PRD §5.2-Lock-in-Concern bleibt valid (Custom-Middleware non-portable, 15s/300s-Exec-Constraint). [Quelle](https://vercel.com/docs/ai-gateway/pricing).
- **OpenRouter:** 5 % BYOK-Markup, Auto-Router lädt aber `passthrough`-Pricing — Aggregator-Risk (Latenz, Single-Point-of-Failure, neuer Dependency). [Quelle](https://coplay.dev/blog/openrouter-drops-fees-in-response-to-vercels-ai-gateway).
- **LiteLLM-Proxy:** self-hosted, kein Markup, voll-portable — aber +1 Service in Hardcore-Local-Only-Mode.
- **Empfehlung:** AI-SDK Provider-Switching nativ (`@ai-sdk/anthropic|openai|google|groq` parallel, Selektion via env-Flag pro User-Tier). Kein zusätzlicher Gateway-Layer in Phase 0. Re-evaluate Gateway/Proxy in Phase 1 wenn >3 Provider produktiv. SDK-Pattern: `model: tier === 'free' ? openai('gpt-5-nano') : anthropic('claude-sonnet-4-5')`.

## Risiken / Open Questions

- **GPT-5-Nano-FPR auf VK-Conflict-Task** unbestätigt — Eval-Pflicht W2.
- **Anthropic-Acquisition-Risk** (PRD Constraint #1): wenn Sonnet Paid-Default, Cross-Vendor-Wedge zumindest auf SDK-Ebene gewahrt — gut.
- **Gemini-Free-Tier-Sunset:** Google hat 2024/2025 Quotas mehrfach reduziert. Nicht load-bearing planen.

---
*Author: Research Agent A4 · Severity-Bänder per PRD §5.5 · 2026-05-17*
