# Fake-Door Signal Validity — Benchmark- & Scoring-Framework für ValidationKit

**Purpose:** Empirische Benchmarks und Schwellwerte, mit denen ValidationKit's `feedback-synthesizer` einen verteidigbaren Demand-Signal-Score berechnen kann — und die der `fake-door-designer` als Spec-Constraints für valide Landing-Pages benutzt.

**Datenstand:** 2024–2026, primär aus Backlinko, Instantly, Smartlead, Lemlist, WordStream, Wordstream/LocaLiQ, Demand Curve, Lenny Rachitsky, GetWaitlist, CB Insights, Imperva Bot Report 2025.

---

## 1. Fake-Door / Landing-Page-Conversion-Benchmarks

Landing-Pages mit "Join Waitlist"-CTA produzieren stark unterschiedliche Conversion-Rates abhängig von (a) Traffic-Source, (b) Industrie, (c) Friction (Email-only vs. Email+Pricing vs. Email+Credit-Card). Globale Mittelwerte ohne Kontextualisierung sind irreführend.

### Sample-Size-Mindestanforderung

Bevor irgendeine Aussage gilt: **≥1.000 unique impressions** und **≥100 unique clicks/sessions**. Demand Curve und User-Intuition empfehlen 7–14 Tage oder 300+ unique sessions per Audience. Unterhalb dieses Volumens ist die Conversion-Rate statistisch nicht von Rauschen unterscheidbar (95%-Konfidenzintervall bei 5% CR und n=50 ist ±6pp).

### Benchmark-Tabelle: Landing-Page Visit→Email-Signup (Fake Door)

| Tier | Conversion-Rate (Visit→Email) | Bedeutung |
|---|---|---|
| Noise / Negative | < 1% | Idee resoniert nicht. Selbst bei perfektem Copy kein Pull. Buffer's Studie und Demand Curve sehen <1% als "rebuild or kill". |
| Low / Weak Signal | 1–3% | Globaler Durchschnitt für Cold-Paid-Traffic auf B2B-Pages (2.35% global avg, Unbounce-Report). Indiziert latentes Interesse, aber keinen Pull. |
| Mid / Solid Signal | 3–8% | "Healthy". Backlinko 2025 Median für B2B-Landing-Pages liegt bei ~4–6%. Indiziert real existierendes Problem, aber unklare Urgency. |
| High / Strong Signal | 8–15% | Top-Quartil. Reforge/Demand Curve-Schwelle für "build it". Für consumer apps mit niedrigem perceived risk normal. |
| Exceptional / Hype-Risk | > 15% | Möglicherweise valide, aber **Hype-Bias-Verdacht**. Buffer hatte ~40% Visit→Email mit explainer video — aber traffic war warm (Twitter-Follower). |

### Wichtige Kontextfaktoren

- **Friction-Level:** Email-only CRs ~2–5x höher als CRs mit "Enter Credit Card" oder "Choose Pricing Plan". Buffer's Trick: Pricing-Page anzeigen, dann erst Email kassieren — das zählt als willingness-to-pay-Signal, nicht nur Email-Curiosity.
- **Traffic Source:** Email-Lists konvertieren bei ~5.2%, Paid Search ~3.1%, Organic ~2.4%, Paid Social ~1.2% (Unbounce-Daten, 50k+ pages).
- **Industrie:** Legal Services ~6.4%, eCommerce ~1.8% — Spread Faktor 3.5x.
- **Click-vs-Convert Gap:** Dan Kim's 2025-Case dokumentierte 16.5% CTR bei nur 2.47% Conversion — die Lücke zwischen Klick (Curiosity) und Signup (Commitment) ist der eigentlich aussagekräftige Signal-Spread.

---

## 2. Paid-Ad-CTR-Signale

Ads testen das Pre-Click-Demand-Signal (resoniert die Headline überhaupt?). CTR ist channel-spezifisch — ein 1% CTR auf Reddit ist exzellent, auf Google Search jämmerlich.

### Benchmark-Tabelle: Ad-CTR by Channel (B2B/SaaS Cold Audience)

| Channel | Noise (<) | Low | Mid | Strong (>) | CPC-Range typisch |
|---|---|---|---|---|---|
| **Google Search** | < 1.5% | 1.5–3% | 3–5% | > 5% (B2B), > 7% (consumer) | $2–$15 B2B SaaS |
| **Meta (Facebook/IG)** | < 0.7% | 0.7–1.2% | 1.2–2.2% | > 2.5% | $1–$5 |
| **Reddit** | < 0.2% | 0.2–0.5% | 0.5–1.0% | > 1.0% | $0.50–$2 |
| **LinkedIn** | < 0.3% | 0.3–0.5% | 0.5–0.8% | > 1.0% | $5–$15 |

### Aussagekraft pro Channel

- **Google Search:** Best für Demand-Validation, weil bereits-suchendes Intent. Hohe CTR + niedriger CPC = Demand existiert UND ist nicht überteuert. WordStream 2025: B2B avg CTR Search 2.41%.
- **Meta:** Misst Interrupt-Demand. Median CTR 2.19% (Triple Whale 2025). Schwächeres Signal als Search, weil keine pull-intent.
- **Reddit:** Niedrige CTR ist normal. Stärkstes Signal sind **upvotes auf Sponsored Posts und Kommentar-Sentiment**, nicht CTR. AdBacklog 2025: 0.5–1% gilt als stark.
- **CPC als Counter-Signal:** Hohe CTR + hoher CPC = Hype-Markt mit viel Wettbewerb. Niedrige CTR + niedriger CPC = niemand bietet weil niemand sucht. **Idealer Signal: CTR > Channel-Mid UND CPC < Channel-Mid.**

### Sample-Size für Paid Ads

Mindestens **1.000 Impressions per Variant** und **30+ Klicks** bevor CTR interpretierbar ist. Für CPC/CR-Joint-Signal: $200–$500 spend minimum.

---

## 3. Cold-Email Reply-Rate-Benchmarks (2025–2026)

Cold-Email ist das **stärkste qualitative Demand-Signal** verfügbar, weil Reply-Inhalt analysierbar ist. Aber: Reply-Rate ohne Sentiment-Filter ist nutzlos.

### Benchmark-Tabelle: Cold Email Reply Rates (B2B, 2026)

| Tier | Total Reply Rate | Positive Reply Rate | Bedeutung |
|---|---|---|---|
| Broken / Spam | < 1% | < 0.2% | Deliverability- oder ICP-Problem. Kein Signal extrahierbar. |
| Low / Baseline | 1–3% | 0.2–0.5% | Platform-Average laut Instantly 2026 (3.43% total avg). |
| Mid / Healthy | 3–8% | 0.5–2% | Backlinko-Mean 8.5%, Lemlist "good" ≥5%. ICP-Fit existiert, Pain könnte real sein. |
| High / Strong Signal | 8–15% | 2–5% | Top-Quartil. Klare Pain-Resonance. Salesmotion 2026 nennt 10%+ "elite". |
| Exceptional | > 15% | > 5% | Best-in-class. Hyper-personalisierte Listen mit echtem Pain-Match. |

### False-Positive-Caveats Cold Email

- **58% aller Replies kommen aus Step 1** (Instantly 2026) — Single-Send-Reply-Rate ist daher der echte Signal-Kern. Follow-ups bias Replies upward.
- **Negative-Reply-Rate-Threshold:** Wenn Negative > 7%, ist ICP oder Pitch falsch — total reply rate ist dann irreführend hoch.
- **"Sounds interesting, send me more info"-Trap:** Politeness-Floor in B2B ~1–2%. Echte Demand-Signale haben (a) konkrete Pain-Beschreibung, (b) Frage nach Pricing, (c) Calendar-Link-Request.

### Pain-Signal-Extraction Keywords

Der `feedback-synthesizer` sollte Replies nach Pain-Indicators klassifizieren:
- **Strong:** "we currently use X and it sucks because…", "how much?", "can I see a demo this week?", "we tried building this internally"
- **Weak:** "interesting", "send me info", "maybe later", "we already have something"
- **Negative:** "not interested", "unsubscribe", "wrong person"

---

## 4. Waitlist-Signup → Customer-Conversion

Waitlist-Signup ist **viel schwächeres Signal** als allgemein angenommen, weil Friction nahe Null ist.

### Benchmark-Tabelle: Waitlist→Paid-Customer Conversion

| Tier | Conversion-Rate | Bedeutung | Quelle |
|---|---|---|---|
| Curiosity-only | < 5% | Hype-driven signups, kein echtes Commitment. | GetWaitlist B2C avg |
| Weak | 5–10% | Wenn Time-to-Access >90 Tage. | Lenny Rachitsky 2024 |
| Mid | 10–20% | Solider B2B-Range, warm traffic. | Lenny |
| Strong | 20–30% | "PMF-Indicator". Lenny: 20% avg wenn <30 Tage Access. | Lenny + ScaleMath |
| Exceptional | > 30% | Pre-qualified waitlist, kurze TTA. | Top-Decile |

### Critical Modifier: Time-to-Access

Lenny Rachitsky's Hauptbefund: Waitlist-Conversion fällt **>50% wenn TTA > 90 Tage**. Konkret:
- TTA < 30 Tage: ~50% Conversion
- TTA 30–90 Tage: ~20% Conversion
- TTA > 90 Tage: < 10% Conversion

**Implication:** Eine Waitlist ohne credible Launch-Date erzeugt zerfallenden Signal-Value. ValidationKit muss TTA als Score-Decay-Faktor modellieren.

### Waitlist-Quality-Signals (höher gewichtet als reine Count)

- **Source-Mix:** Cold-Paid-Signups < Warm-Referral-Signups < Inbound-Search-Signups
- **Email-Domain-Quality:** Generic (gmail/yahoo) vs. Company-Email — Company-Domains korrelieren stärker mit B2B-Conversion
- **Survey-Completion:** Wenn nach Signup optional Survey angeboten und ≥30% completed, Quality-Multiplier x1.5

---

## 5. False-Positive-Risiken

Die zentrale Failure-Mode von Fake-Door-Tests: **3.000 Signups → 18-Monate Build → kein Revenue**. CB Insights 2024 zeigt: 43% der gefailten Startups failten an "poor PMF" — viele hatten initiale Signals, die false-positive waren.

### Failure-Mode-Tabelle

| Risiko | Symptome | Mitigation |
|---|---|---|
| **Bot-Traffic** | Bounce <5s, 0 mouse movement, gmail-only emails, geo-anomalies. Imperva 2025: 51% aller Web-Requests sind Bots. | reCAPTCHA v3 score, server-side GTM, IP-Reputation, engagement-time-filter (>10s). |
| **Curiosity-Click** | Hohe CTR, niedrige CR. Dan Kim's 16.5%→2.47%-Case. | Friction hinzufügen: Pricing zeigen vor Email-Capture, oder 2-step (Email → Phone/Survey). |
| **Hype-Driven Signups** | Viral burst, Twitter/Reddit-Spike, hohe CR aber 0% Engagement nach 7 Tagen. | Cohort-Behavior tracken: Welche Signup-Kohorten öffnen Confirmation-Emails? <30% Open ≙ Hype. |
| **Politeness-Bias (Cold Email)** | Hohe Reply-Rate ohne konkrete Pain-Mention. | NLP-Sentiment + Pain-Keyword-Filter. Positive Replies ohne Pain-Spezifika = Politeness. |
| **TAM-Illusion** | Audience too broad → CR scheint hoch, weil nicht-target-segment ebenfalls signed up. | Per-Segment-Breakdown. Wenn Power-User-Segment unter Mid liegt, Idee schwach trotz Aggregate. |
| **Friend-Bias** | First 100 Signups aus founder's Netzwerk. | Source-Attribution Pflicht. Founder-Network < 20% des Sample. |
| **Pricing-Anchor missing** | Ohne Preis-Anker overstaten Probanden willingness-to-pay um 2–4x (Demand Curve, User Intuition). | Pricing immer vor Signup zeigen. Optional: "Reserve at $X early-bird" für Pre-commitment. |

### Hard-Floor-Rules für Validity

Eine Fake-Door gilt nur dann als validating, wenn alle folgenden true sind:
1. **n ≥ 1.000 unique sessions** mit Bot-Filter angewandt
2. **Pricing wurde gezeigt** vor Signup-CTA
3. **Source-Mix dokumentiert** (kein Single-Source > 70%)
4. **Cohort-Engagement-Check** nach 7 Tagen (Confirmation-Open-Rate ≥ 40%)
5. **Segment-Breakdown** verfügbar (Power-User-Segment-CR ≥ Aggregate-CR)

---

## 6. Demand-Signal-Score-Algorithmus (Vorschlag für feedback-synthesizer)

Ziel: Einzelner 0–100 Score, der Signal-Stärke über alle eingehenden Kanäle aggregiert, mit Quality-Multipliers und False-Positive-Penalties.

### Architektur: Channel-Score × Quality-Multiplier × Volume-Gate

```
DemandSignalScore = Σ (ChannelScore_i × Weight_i × QualityMultiplier_i) × VolumeGate × FalsePositivePenalty
```

### Channel-Subscores (jeweils 0–100, sigmoid-normalisiert gegen Benchmark)

```
FakeDoorScore = clamp(
  normalize(visit_to_email_CR, low=0.01, mid=0.05, high=0.10, ceil=0.15),
  0, 100
)

PaidAdScore = clamp(
  normalize(ctr / channel_mid_ctr,  low=0.5, mid=1.0, high=2.0)
  × min(1.0, channel_mid_cpc / actual_cpc),
  0, 100
)

ColdEmailScore = clamp(
  0.4 × normalize(positive_reply_rate, low=0.005, mid=0.02, high=0.05)
  + 0.6 × normalize(pain_keyword_density, low=0.1, mid=0.4, high=0.7),
  0, 100
)

WaitlistScore = clamp(
  normalize(projected_conversion_rate, low=0.05, mid=0.15, high=0.25)
  × time_to_access_decay(days),  // 1.0 if <30d, 0.6 if 30-90d, 0.3 if >90d
  0, 100
)

RedditSentimentScore = clamp(
  normalize(positive_sentiment_ratio × comment_depth, low=0.2, mid=0.5, high=0.8),
  0, 100
)
```

### Channel-Weights (default; tunable per industry)

| Channel | Weight | Rationale |
|---|---|---|
| Cold Email Reply (mit Pain-Keywords) | 0.30 | Stärkstes Pain-Signal, höchstes Commitment. |
| Paid Ad CTR + CPC | 0.20 | Pull-intent (Search) oder interrupt-resonance (Meta). |
| Fake Door Conversion | 0.20 | Standard-Signal, aber inflation-prone. |
| Waitlist Quality | 0.15 | Friction-low, daher discount. |
| Reddit/Community Sentiment | 0.15 | Qualitatives Signal, hard to fake. |

### Quality-Multipliers

```
QualityMultiplier =
    (pricing_shown ? 1.2 : 0.7)                  // Pricing-Anchor critical
  × (source_diversity_index)                     // 0.6–1.2; penalty if single source >70%
  × (bot_filter_applied ? 1.0 : 0.5)             // Hard penalty without filter
  × (cohort_engagement_7d > 0.4 ? 1.1 : 0.8)     // Confirmation-open behavior
  × (segment_breakdown_passes ? 1.1 : 0.9)       // Power-user segment ≥ aggregate
```

### Volume-Gate (Hard Confidence Floor)

```
VolumeGate =
    0    if total_signals < 100
    0.5  if 100 ≤ total_signals < 1000
    1.0  if total_signals ≥ 1000
```

Below 100 events: Score = 0 ("Insufficient data"). Below 1.000: confidence-flagged at 50%.

### False-Positive-Penalty

```
FalsePositivePenalty =
    1.0
  × (1 - hype_burst_indicator)         // 0.3 penalty if 80% signups within 24h spike
  × (1 - bot_traffic_share)            // proportional to flagged bot traffic
  × (1 - founder_network_share if >0.2 else 1)  // penalty if founders own network dominates
```

### Final-Score-Tiers

| Score | Tier | Recommendation |
|---|---|---|
| 0–25 | No Signal | Kill or pivot. Probably no pain. |
| 25–50 | Weak | Iterate framing/ICP. Re-test. |
| 50–70 | Mid | Build MVP, but stay narrow. Real risk of mid-pull. |
| 70–85 | Strong | Build conviction. Pain real, willingness probable. |
| 85–100 | Exceptional | Move fast — but verify against false-positive checklist. |

---

## 7. Implications für `fake-door-designer` Wireframe-Spec

Damit Output-Signals des Designers downstream valide scored werden können, muss die Wireframe-Spec folgende Constraints zwingend produzieren:

### Mandatory Elements

1. **Pricing-Anchor sichtbar** vor Email-Capture-CTA. Ohne Pricing wird der QualityMultiplier auf 0.7 gedrückt — Score-Cap effectively 70.
2. **Two-Step Capture** (CTA → Pricing/Plan-Choice → Email) statt Single-Step. Reduziert Curiosity-Clicks um ~40% (Demand Curve).
3. **Source-Attribution-Tracking** via UTM-mandatory. Wireframe muss UTM-Parameter-Capture und Per-Source-Conversion-Reporting vorsehen.
4. **Bot-Filter-Stack:** reCAPTCHA v3 + engagement-time-tracking (mind. 10s on page) + IP-Reputation (Imperva oder Cloudflare-Bot-Score).
5. **Cohort-Confirmation-Email** mit trackable Open + Click — feeds back into cohort_engagement_7d-Signal.
6. **Optional Survey** post-signup mit ≥1 Pain-Question und ≥1 Willingness-to-Pay-Question. Completion-Rate feeds Quality-Multiplier.
7. **Time-to-Access-Statement** sichtbar ("Early access in 3 weeks") — sonst Waitlist-Decay-Faktor 0.3 angesetzt.

### Forbidden Patterns (würden Score automatisch flaggen)

- "Coming Soon" ohne Preis-Anker
- Single-Field Email-Capture ohne Friction
- Hype-Copy ohne Outcome-Spezifika ("Revolutionary!", "Disrupting X!")
- Credit-Card-Capture ohne explicit Pre-Order-Disclosure (legal risk laut Validatr-Protocol)
- Founder-Network-Promotion ohne Channel-Diversification (führt zu source-concentration-Penalty)

### Recommended Page-Structure für maximum Signal-Validity

```
[ Hero: Outcome-Headline + Specific-Pain-Statement ]
[ Social Proof: Quote/Logo (real or "join 142 others") ]
[ Pricing-Grid: 2-3 Tiers mit konkreten Preisen ]
[ CTA: "Reserve Your Spot" → Plan-Choice-Modal → Email + Optional 2-Question Survey ]
[ Time-to-Access: "Beta launches [konkretes Datum]" ]
[ FAQ: Anti-Hype-Filter ("Is this for me?" mit Disqualifier-Beispielen) ]
```

---

## 8. Zusammenfassung / Operating Principles

1. **Volume floor non-negotiable:** Unter 1.000 Sessions / 100 Replies kein Score.
2. **Pricing always:** Ohne Pricing-Anchor inflationen alle Conversion-Numbers um 2–4x.
3. **Multi-channel triangulation:** Single-Channel-Strong-Signal ist weniger valide als Multi-Channel-Mid. Aggregierter Score belohnt diversity.
4. **Sentiment > Volume bei Cold Email:** 50 Replies mit konkreter Pain-Description schlagen 500 "interesting"-Replies.
5. **Time-decay für Waitlist:** Score muss decay'en, wenn Launch-Date sich nicht materializiert.
6. **False-positive-checklist als Pre-Score-Filter:** Bot-Share, Hype-Burst, Source-Concentration sind Hard-Penalties, nicht Soft-Adjustments.

---

## Sources

- Backlinko Cold Email Study 2024–2025
- Instantly.ai Cold Email Benchmark Report 2026 (3.43% avg reply rate)
- Smartlead Cold Email Stats 2025
- Lemlist `lemcoach` Benchmarks (5% good / 8% excellent positive reply)
- Demand Curve Above-the-Fold Playbook
- Lenny Rachitsky — "What is good waitlist conversion" (5–25% range, 20% avg <30d TTA)
- GetWaitlist Conversion Benchmarks
- WordStream Google Ads Benchmarks 2025 (B2B search CTR 2.41%)
- Triple Whale Facebook/Meta Benchmarks 2025 (median CTR 2.19%)
- AdBacklog Reddit Ads Benchmarks 2025 (0.5–1% strong)
- Unbounce Conversion Benchmark Report (50k pages, 27 industries, 2.35% global avg)
- Buffer Fake-Door Case Study (70k email signups pre-build)
- CB Insights "Why Startups Fail" 2024 (43% poor PMF)
- Imperva Bad Bot Report 2025 (51% web traffic = bots, 37% malicious)
- Validatr Fake-Door-Protocol (legal pre-order disclosure)
- Dan Kim Bootcamp Medium 2025 (16.5% CTR → 2.47% CR case)
- User Intuition Landing Page Testing Reference
- Future Foundry / Learning Loop — Fake-Door False-Positive Modes
