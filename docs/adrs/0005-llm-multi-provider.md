---
id: 0005
title: LLM Multi-Provider — Anthropic primär, OpenAI opt-in Fallback
status: accepted
date: 2026-05-21
---

# ADR-0005 — LLM Multi-Provider: Anthropic primär, OpenAI opt-in Fallback

> Datum: 2026-05-21
> Status: ✅ Accepted
> Entscheider: User-Decision Q10 (siehe `docs/plans/repo-health-and-workflow-overhaul.md` §2)

---

## Kontext

Vor diesem ADR war die LLM-Provider-Situation widersprüchlich:

- **CLAUDE.md** (Z.82) sagte: *"AI-Calls: nur Anthropic direkt, kein Vercel AI Gateway (Vendor-Lock-in-Vermeidung)"*.
- **`packages/llm/src/select.ts`** (Z.6, 45–53) deklarierte aber `LLMProvider = "anthropic" | "openai"` und routete bei gesetztem `OPENAI_API_KEY` auf `gpt-5-nano`.
- **`packages/llm/package.json`** listete nur `@ai-sdk/anthropic` — `@ai-sdk/openai` war nicht installiert.
- **Call-Sites** (`rules/conflicting-rules.ts`, `rules/context-bloat-llm.ts`) waren hardcoded auf `anthropic(...)` und ignorierten den `selection.provider`-Branch — bei OpenAI-Selection lieferten sie silent `null` zurück (siehe `context-bloat-llm.ts:63-68` alter Stand).

Resultat: ein User, der nur `OPENAI_API_KEY` setzte, sah `isLlmEnabled() === true` (selectModel returnt eine OpenAI-Selection), bekam aber bei den LLM-Audit-Rules keine Findings. **Silent failure ≠ honest no-vapor.**

Phase-Nova-2 Repo-Health-Audit (2026-05-21) hat das aufgedeckt. User-Entscheidung Q10: **OpenAI nicht entfernen, sondern echt machen.**

## Entscheidung

Wir wählen den **Direct-Provider-Multi-Modell-Pfad**:

1. **`@ai-sdk/openai` wird als Dependency in `packages/llm/` installiert** (zusätzlich zu `@ai-sdk/anthropic`).
2. **`selectModel()`** bleibt env-driven: Anthropic primär (wenn `ANTHROPIC_API_KEY` gesetzt), OpenAI als opt-in Fallback (wenn nur `OPENAI_API_KEY` gesetzt).
3. **Neue Helper-Funktion `providerModel(selection)`** in `select.ts` resolved die SDK-Provider-Instance basierend auf `selection.provider`.
4. **Call-Sites werden provider-agnostisch:** `rules/conflicting-rules.ts` und `rules/context-bloat-llm.ts` nutzen `providerModel(selection)` statt hardcoded `anthropic(...)`. Der "OpenAI-returns-null"-Dead-Branch in `context-bloat-llm.ts` ist entfernt.
5. **CLAUDE.md-Constraint** wird angepasst: *"AI-Calls: Anthropic primär, OpenAI als opt-in Fallback erlaubt. Kein Vercel AI Gateway (Vendor-Lock-in-Vermeidung bleibt für Gateway, nicht für Direct-Provider)."*

## Optionen, die wir verworfen haben

- **Branch komplett löschen** (sauberster Constraint-Hold, nur Anthropic): verworfen — User will Option für OpenAI als Cost-Floor in der Hand behalten.
- **Mit `throw` + FUTURE-Kommentar markieren** (Platzhalter ohne SDK-Install): verworfen — generiert beim ersten OpenAI-Set ein Runtime-Crash statt Funktionalität.
- **Vercel AI Gateway als Multi-Provider-Layer:** verworfen — Vendor-Lock-in, ADR-Verweis bleibt explizit. Auto-Validator-Hooks im Repo werden diesen Code regelmäßig flaggen; die bewusste Ablehnung ist in `select.ts:1-4` als Code-Kommentar dokumentiert.
- **LiteLLM/OpenRouter als Multi-Provider-Proxy:** verworfen für jetzt — fügt Operational-Komplexität (eigener Proxy-Service) für einen Solo-Dev hinzu. Re-Open-Trigger: wenn ≥3 Provider gleichzeitig nötig werden.

## Consequences

**Positiv:**
- `OPENAI_API_KEY`-only-Setup funktioniert jetzt echt — Cost-Floor-Pfad ist verfügbar (`gpt-5-nano`, ~$0.05/1M tokens).
- Provider-Swap ohne Code-Änderung an Call-Sites (`providerModel(selection)`-Pattern).
- Kein Vendor-Lock-in — beide Provider direkt via offizielle SDKs.
- Test-Pfad mit OpenAI ist nutzbar, ohne Anthropic-Credits zu verbrauchen.

**Negativ:**
- Bundle-Size +~50KB für `@ai-sdk/openai` (nur in `@vk/llm`, nicht in `apps/web`-Direct-Bundle).
- Zwei Provider zu pflegen: Model-IDs, Cost-Updates, SDK-Breaking-Changes.
- Test-Coverage-Lücke: `selectModel` + `providerModel` haben keine Tests, die beide Branches abdecken (bestehend ist nur 32 LOC in `conflicting-rules.test.ts`).

**Operational:**
- Default-Empfehlung bleibt: `ANTHROPIC_API_KEY` setzen für beste Audit-Quality (`claude-sonnet-4-6`).
- OpenAI ist explizit als "Cost-Floor / Free-Tier"-Pfad gedacht — kein Quality-Guarantee.

## Re-Open-Trigger

- LLM-Solution accept-rate <70% mit beiden Providern → Multi-Pass-Upgrade-Sprint (würde wahrscheinlich Provider-Logik mit anfassen).
- ≥3 Provider gleichzeitig nötig (z.B. Gemini, OpenRouter) → Proxy/Gateway-Re-Evaluation.
- Provider-SDK-Breaking-Change → Migration via separatem Plan.

## Folge-Items (außerhalb dieses ADRs)

- `packages/llm/select.ts`-Tests ergänzen (Branch-Coverage für anthropic + openai + null) — Phase 2.5 Test-Härten oder eigener Mini-Plan.
- Eval-Pipeline (`eval/conflicts/run.ts`) sollte beide Provider testen können — separater Plan wenn nötig.
