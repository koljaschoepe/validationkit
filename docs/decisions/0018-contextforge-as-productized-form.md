# ADR-0018 — ContextForge wird Productized-Form von ValidationKit (Pfad C / Hybrid)

- **Status:** Accepted
- **Datum:** 2026-05-16
- **Autoren:** Kolja Schöpe (Founder), Claude Opus 4.7 (Skeptic-Mentor)
- **Supersedes:** Erweitert ADR-0017 (Hybrid Layered Pivot E), kein Replacement
- **Reicht aus, bis:** ADR-0019 (Re-Open-Trigger erfüllt) oder Phase-2-Pricing-Validation-Failure

---

## Kontext

Am 2026-05-16 hat der Founder ein neues PRD ("ContextForge", v0.1) als **Voller-Replacement-Pivot** vorgeschlagen — Multi-Tenant-SaaS für AI-Consultancies (8–25 MA), die 5–30 Customer-Repos mit Claude-Code / Codex / Gemini-Setups managen. Pain: Agent-File-Drift, kein Review, kein Inventory. Pricing $19/$99/$299/$799.

Der Founder hat in der Interview-Phase angegeben:
- VK-Beziehung: **Voller Replacement** (PRD v3, ADR-0017 archiviert)
- Persona: Agency-Lena
- ADR-0017-Awareness: **Nicht bewusst** (bat um Re-Read)
- Fallback bei Kill: Pivot F suchen

Daraufhin wurden 8 parallele Recherche-Agents dispatcht (docs/research/v4/01-…-08-*.md). Nach Rückmeldung aller Tracks zeigte die Synthesis (`docs/research/v4/00-synthesis-verdict.md`):

**Die Daten widersprechen Voller-Replacement auf 3 von 5 Achsen.** Engineering-Substanz und Wedge sind real (TAM MID, Standards STRONG, Anthropic-Threat MID-STRONG, GitHub-App-Approval MID-konditional), aber **die im PRD beschriebene Form ist empirisch gebrochen** (GTM KILL, AI-Review-Headline RISK-INDUCING, Pricing-Sandwich WEAK-MID).

Entscheidend: **Track C1 (Drift-Pain & WTP) hat unabhängig eine "Productized-Service-Trojan"-Empfehlung formuliert ($4.500 Engagement → $199 Hosted, OSS-Core Day 1) — wörtlich Pivot E aus ADR-0017.** Heißt: ContextForge ist nicht das Replacement, ContextForge ist **die Productized-Form**, die ValidationKit ohnehin werden sollte — mit erweitertem Wedge (Cross-Vendor Agent-File-Compliance ergänzt Validation-Loop).

Drei Pfade wurden vorgelegt; der Founder hat **Pfad C — Hybrid (Recommended-Ambitious)** gewählt.

## Entscheidung

**ContextForge wird Productized-Form von ValidationKit, NICHT Replacement.**

Konkret:

1. **ValidationKit bleibt Framework + Brand.** PRD v3 (Hybrid Layered) bleibt Source-of-Truth, wird zu v3.1 erweitert.
2. **ContextForge wird die in Phase 2 vorgesehene Productized-Service-Form**, mit erweitertem Wedge:
   - Bisheriger Wedge (PRD v3): "Founder Validation Sprint" $4.500 (Pre-Build-Validation)
   - **Neuer Wedge (v3.1):** "Agency Operations Sprint" $4.500 (Post-Build-Multi-Customer-Operations)
   - Beide Wedges teilen die OSS-Core (`validationkit-cli` + `contextforge-cli`) und die Hosted-Web-App (`{brand}.app/validate` + `{brand}.app/operations`)
3. **Wedge-Reformulierung:** "Cross-Vendor Agent-File-Compliance for Multi-Customer-Agencies" wird zur neuen Differenzierungs-These (statt nur "Validation für Solopreneurs").
4. **Sunk-Cost:** Null. v3-Roadmap bleibt intakt, wird erweitert.

## Begründung

### Pro Pfad C (gewählt)

1. **C1 Pain & WTP empfiehlt explizit dieselbe Struktur:** "$4.500 Engagement → $199 Hosted, OSS-Core Day 1" = wörtlich PRD v3 §11.2 Phase-2-Plan. Zwei unabhängige Analysen konvergieren auf dieselbe Form.

2. **C2 Anthropic-Threat zeigt: Nur 2/8 ContextForge-Features sind permanent-defensibel** (OAuth-Multi-Vendor + Cross-Framework). Cross-Vendor allein reicht nicht für 5-Jahres-Defense — Agency-Workflow-Vertical + Brand muss dazu. ValidationKit-Brand-Karma + Pre-Build-Validation-Vertical liefern genau das.

3. **D1 Solo-Sales-Reality:** $4.500 Sprint-Engagements als Cash-Engine sind solo-machbar (PRD v3 §11.1-Roadmap belegt 8–12 Engagements/Jahr realistisch). PLG-only mit $99/$299-SaaS ist gegen GTM-Konsens-2026 für Solo-Founder. **Service-First + PLG-Second ist die historisch belegte Solo-Pattern.**

4. **A1 TAM:** SAM 600–1.500 buyer-qualified AI-Consultancies + bestehender Indie-Hacker-Markt (PRD v3 ICP) = größerer kombinierter Markt als jeder allein. DACH-First mit 120–175 AI-Boutiquen plus Validation-Indie-Customer-Base.

5. **A2 Competitor-Refresh:** "Niemand hat dediziertes Multi-Tenant-Tool für AI-Consultancies" gilt noch (6–9 Mo clear-air), aber **Validation-vor-Build + Operations-nach-Build kombiniert hat NIEMAND.** Niche ist breiter und kohärent.

6. **B2 Standards:** Konvergenz auf AGENTS.md (60k+ Repos, AAIF Linux Foundation) macht den Cross-Vendor-Wedge tragbarer. Anthropic-Outlier (Issue #6235) ist die unique Lücke, die ContextForge ausnutzt — aber auch für die VK-Validation-Outputs nützlich (Validation-Recommendations können in AGENTS.md-Format ausgegeben werden).

### Contra (Ehrlich gelistet)

1. **Komplexität steigt.** Zwei Wedges (Pre-Build-Validation + Post-Build-Operations), zwei Personas (Indie-Founder + Agency-Lena), zwei Sprint-Formate. Risk: nichts wird richtig gut.
   - **Mitigation:** Phase 0–1 strikt sequenced (VK-Mom-Tests M0–M3, dann Agency-Discovery M2–M4, Overlap erlaubt). Beide Wedges teilen die OSS-Core und das Brand.

2. **Brand-Identity-Risk.** Ist es ValidationKit (Pre-Build) ODER ContextForge (Operations)? Im Re-Brand-Window M9–M12 muss eine Single-Brand-Decision fallen (vermutlich Sondr / Pondera als Dach mit `/validate` und `/operations` als Sub-Brands).
   - **Mitigation:** Re-Brand-Decision in M9 muss beide Wedges abdecken (das wurde bereits in PRD v3 Naming-Status angelegt).

3. **Solo-Constraint.** Zwei Personas = doppelter Discovery-Aufwand. 20 Mom-Tests Indie + 10 Agency-Interviews in 3 Monaten ist ambitioniert.
   - **Mitigation:** Agency-Discovery wird sequenced (10 Interviews ab M2, 5 davon als Phase-0-Gate-Letters-of-Intent). Wenn 5 LOIs nicht erreichbar, Agency-Operations-Sprint wird auf Phase 2 zurückgestellt.

4. **ContextForge-Eigene-Marke-Verlust.** Der Founder hat Naming-Spaß mit "ContextForge" — durch Pfad C wird ContextForge ein Sub-Brand oder Feature-Name, kein eigenständiges Produkt.
   - **Mitigation:** "ContextForge" kann als Sub-Brand für die Agency-Operations-Linie überleben (analog zu Linear/Linear-Insights). Final-Decision in M9.

### Was die Daten KO-killen (Pfad A & D ausgeschlossen)

- **Pfad A (Voller Replacement bestätigt) ist data-incompatible.** Die GTM-Motion (LinkedIn Cold-Outreach Primary) ist von D1 KILL-bewertet — null Solo-Founder im Comp-Set ist so gewachsen. Y3-ARR-Ziel ($2–3M EUR) ist 5–10× zu optimistisch.
- **Pfad D (Kill ContextForge, zurück zu PRD v3 wie ist) verschenkt validen Wedge.** A2 + B2 zeigen Cross-Vendor-Lücke + AAIF-Konvergenz + Anthropic-Outlier — das ist eine echte Marktlücke, die Pfad D ignorieren würde.

## Konsequenzen

### Positive

1. **PRD v3.1 wird Source-of-Truth.** Erweitert v3 um §32 (ContextForge-Productized-Form), keine Archivierung.
2. **Phase 0 (M0–M3) wird zweigleisig:**
   - 20 Mom-Tests mit Indie-Hackers (VK-Pre-Build-Validation)
   - 10 Discovery-Interviews mit AI-Consultancies (CF-Post-Build-Operations)
   - Phase-0-Gate: 5 Agency-LOIs ODER Agency-Sprint wird auf Phase 2 zurückgestellt
3. **Phase 1 (M3–M9) bekommt zweiten Cash-Engine:**
   - Bisher: 8–12 Validation-Sprint-Engagements ($30k–96k)
   - Neu: 4–6 Validation + 4–6 Operations-Sprint-Engagements ($45k–108k bei 9–12 Engagements)
4. **Phase 2 (M9–M18) hat erweiterten Wedge:**
   - Hosted Web-App mit `/validate` (Indie-Tier) + `/operations` (Agency-Tier)
   - Indie: $19/$79 wie bisher
   - Agency: $299/$799 (kein $99-Sandwich-Layer)
5. **Cross-Vendor wird load-bearing.** Phase-1-OSS-Tools müssen 12 Formate parsen (AGENTS.md + CLAUDE.md + GEMINI.md + SKILL.md + .claude/* + .cursor/* + .windsurf/* + .codex/* + Cline + JetBrains-Junie + Aider + Zed).

### Negative

1. **Brand-Identity bleibt offen bis M9.** "ValidationKit" + "ContextForge" als Doppel-Marke ist marketing-suboptimal. Re-Brand-Window M9–M12 muss eine umbrella-Brand wählen.
2. **Phase-0-Lieferliste wächst.** Zusätzlich zu den 6 bestehenden Items (Mom-Tests, GitHub-Org, dogfood, Handbook, Build-in-Public, Anwalts-Vorbereitung): 4 ContextForge-spezifische Day-1-Mitigations (DPA-Template, Trust-Center-Page, Requester→Approver-Bridge, Read-Only-Default).
3. **AI-Review-Feature im PRD muss rebrandet werden** zu "Audit Report" mit deterministic-first-Approach (D2-Empfehlung). Multi-Model-Review nur als adversarial-critique mit Confidence-Banding.
4. **AAIF-Silver-Membership ($5k/yr)** als Phase-1-Budget-Item (B2-Empfehlung). Validierung der Spec-Beteiligung ist wichtig für Cross-Vendor-Defensibility.

### Required PRD-Edits (verbindlich aus den 8 Tracks)

1. **TAM-Claim reformulieren** (A1): SAM 600–1.500 buyer-qualified heute, Year-3 ARR-Ziel **$500k–$1M USD** (statt $2–3M EUR). Year-2 Customers 150 (statt 300). Year-1 40–50 mit Channel-Multiplier.
2. **GTM-Motion umbauen** (D1): Content/Build-in-Public/PLG-Primary für $19–$299-Tiers. LinkedIn-Outreach NUR für $799+-Tier und für Discovery-Interviews. Skeptic-Mentor-Voice + DACH-First.
3. **AI-Review → Audit Report** (D2): Deterministic-first für 5/6 Finding-Kategorien (Unused agents, Duplicate guidance, Context bloat, Stale references, Token-Budget). Nur Conflicting-Rules nutzt LLM. 30-File-Golden-Set in Woche 1–2 bevor Audit-Code.
4. **Phase-1 Parser** (B2): 12 Formate (5 MUST + 5 SHOULD + 2 MAY) statt 4 wie im ContextForge-v0.1-PRD.
5. **4 Day-1-Mitigations** (B1): DPA-Template (2 PD) + Trust-Center-Pseudo-MVP (1 PD) + Requester→Approver-Bridge (3–5 PD) + Read-Only-Default (1 PD). Total 9–12 PD in Phase 0 budgetieren.
6. **Pricing-Sandwich auflösen** (C1): $19 (Solo) / $299 (Agency-Pro) / $799 (Agency-Scale) / $4.500 (Sprint-Engagement) / Custom (Konzern). Kein $99-Layer. Hybrid-Pricing-Optional: Base + per-Repo.

## Re-Open-Trigger

ADR-0018 wird neu evaluiert, wenn:

1. **Pfad-C-Phase-0-Gate gerissen wird:** Wenn nach M3 weniger als 5 Agency-LOIs vorliegen, Agency-Operations-Sprint wird auf Phase 2 zurückgestellt und nur als SaaS-Tier behalten.
2. **Anthropic-Acquisition-Move:** "Claude for Agencies"-SKU launcht ODER Anthropic akquiriert Multi-Vendor-Tool (Langfuse, grekt.com) ODER "DevRel-Agencies"-Hiring-Posting erscheint. → Cross-Vendor-Wedge wird neu bewertet.
3. **grekt.com / MindStudio shippt das ContextForge-Pattern:** Wenn ein OSS-Tool oder Closed-Source-SaaS dieselbe Multi-Tenant-Agency-Wedge besetzt, wird Sprint-Strategie überarbeitet (Niche-Vertical-Pivot oder Acquisition-Sourcing).
4. **PRD v3.1-Roadmap kollabiert auf >40 %:** Wenn 2 oder mehr Phase-0-Items nicht in M3 abgeschlossen sind, ADR-0018 wird neu verhandelt.
5. **Founder-Tier-Mix-Failure:** Wenn nach 6 Agency-Operations-Sprints (M6–M9) weniger als 50 % als Hosted-App-Convert (Operations-$299/$799) folgen, Sprint-Modell wird neu kalibriert.

## Verwandte Dokumente

- `docs/research/v4/00-synthesis-verdict.md` — Synthese der 8 Recherche-Tracks
- `docs/research/v4/01-08-*.md` — Einzeltracks
- `PRD ContextForge.pdf` — User-PRD v0.1 (2026-05-16), archiviert als "Ausgangs-Input"
- `docs/decisions/0017-hybrid-pivot-e.md` — Vorgänger-ADR (Hybrid Layered)
- `docs/archive/PRD-ValidationKit-v3.md` — wird zu v3.1 erweitert
- `.claude/CLAUDE.md` — wird aktualisiert mit ContextForge-Productized-Form-Constraints

---

*Skeptic-Mentor-Konzession+Critique-Pattern. Datums-Stempel 2026-05-16. Verdict basiert auf 8-Agent-Recherche-Run (~32k Wörter, ~150 Quellen, alle inline-cited).*
