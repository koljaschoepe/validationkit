# 08 — Realtime-Updates fürs Dashboard

> Research-Agent A8 · 2026-05-17 · Skeptic-Mentor-Voice
> Frage: "Wenn sich was ändert und aufgenommen wird, soll das auch erkennbar sein." Cheapest Pfad bei $0-new-spend-Constraint?

## TL;DR

**Bleib beim Polling für Scan-Status. Add SSE für Toasts (Webhook-Re-Audit + Drift-Detected). Null neue SaaS-Accounts, ~2 PD Gesamtaufwand.**

Pusher/Ably/Supabase-Realtime/PartyKit/Inngest-Realtime sind alle gut — aber bringen einen weiteren Vendor in den Stack, dessen Free-Tier-Cliff (200 Connections, 200k msg/day) bei 30 Agency-Customers mit je 3–5 Browser-Tabs in ~M9 reißt. Vor M3-Gate nicht kaufen.

## Optionen-Vergleich

| Option | Vercel-Fit | Free-Tier-Cliff | Effort | UX |
|---|---|---|---|---|
| **1) Polling 2–5s** | Native, Function-Invoke pro Poll | Vercel Hobby: 100k invokes/Tag — 30 Tabs × 12 polls/min × 8h = 173k → **Cliff bei M6** | 0 PD (existiert) | "Near-real-time", spürbar 2–5s Lag |
| **2) SSE (`Response` mit ReadableStream)** | Native auf Node-Runtime, Fluid Compute streamt durch. Timeout: Hobby 60s / Pro 300s → Client muss reconnecten | Kein eigener Cliff — zählt als 1 Function-Invoke für die Dauer. Bei 300s × Reconnect = 288 invokes/Tab/Tag → **safer als Polling** | 1–2 PD | Echtes Real-Time, <100ms |
| **3) WebSocket nativ** | **Funktioniert nicht** auf Vercel-Functions (auch nicht Edge ohne Workaround). Braucht externen Vendor. | n/a | 3–5 PD + Vendor-Setup | Echtes Real-Time |
| **4) Pusher / Ably** | Client-SDK + Server-Trigger via REST. | Pusher: 200 connections, 200k msg/day. Ably: 200 connections, 6M msg/Monat. **Cliff bei ~30 zahlenden Agencies × 3 Tabs = 90 Connections — knapp**. Paid ab $49/mo. | 2–3 PD | Echtes Real-Time |
| **5) Supabase Realtime** | Client direkt zur Supabase-Edge. Wir haben Neon, kein Supabase → bringt neuen DB-Mirror oder zweiten Vendor. | 200 concurrent, 2M msg/Monat free. | 3–4 PD (inkl. neuer Vendor) | Echtes Real-Time |
| **6) PartyKit (Cloudflare)** | Externer Vendor. | Free: 100 connections concurrent. **Cliff früher als Pusher.** | 3–4 PD | Echtes Real-Time |
| **7) Inngest Realtime (Beta)** | Wir haben Inngest schon. Stream-Subscribe an Function-Output. | Beta, an Inngest-Step-Quota gekoppelt (50k/Monat). **Doppel-Belastung**, weil Polling-Auto-Tracking aus A3 dieselbe Quota frisst (22% bei 30 Repos). | 1–2 PD | Echtes Real-Time, aber Beta-Risk |

## Konzession & Kritik

**Konzession:** Real-Time fühlt sich "richtig" an. Pusher/Ably haben 3-Klick-Onboarding, und Inngest-Realtime würde sich technisch hübsch in unser bestehendes `@vk/inngest`-Setup fügen.

**Kritik:** Aber jeder externe Vendor reißt drei Constraints aus PRD §14 + Hardcore-Local-Only-Mode (v5-Refactor):
1. **Zero-new-spend**: Free-Tier-Cliffs (200 Connections) treffen uns zwischen M6–M9 — also genau dann, wenn wir gerade zahlende Agency-Customers gewonnen haben und nicht migrieren wollen.
2. **Local-First-Stack-Audit (v5)**: Pusher/Ably/Supabase brauchen Internet + Account → bricht Docker-Compose-Lokal-Setup.
3. **Vendor-Lock-Karma**: ContextForge-Wedge verspricht "Cross-Vendor-Trust" — sich selbst an Pusher zu binden wäre Off-Brand.

**SSE ist die ehrliche Antwort.** Node-Runtime auf Vercel streamt seit Fluid-Compute zuverlässig. 300s Pro-Timeout = Client reconnectet alle 5 min, das ist ein 4-Zeilen-`EventSource`-Wrapper. Kein neuer Vendor, kein neuer Cliff, kein Lock-in. Die Founder-These "wenn sich was ändert, soll's erkennbar sein" wird mit <100ms-Latency erfüllt.

## Empfehlung pro Use-Case

| Use-Case | Lösung | Begründung |
|---|---|---|
| **a) Scan-Status queued/running/done auf `/scans/[id]`** | **Polling bleibt** (2s) | Nutzer ist aktiv auf 1 Tab, Scan dauert 30–120s. Polling reicht, kein Refactor-ROI. |
| **b) "Repo wurde re-auditet wegen Webhook" → Toast** | **SSE auf `/api/events/stream`** | Dashboard-Tab offen, soll wissen ohne dass User F5 drückt. Eine Connection pro offenem Dashboard. |
| **c) "Drift detected" → Notification** | **Selbe SSE-Connection, anderer Event-Type** | Inngest-Funktion published in Postgres `events`-Table, SSE-Endpoint LISTEN/NOTIFY-pollt 1s, pusht raus. |

## Implementation-Skizze (2 PD)

1. Postgres `events`-Table (`id`, `customer_id`, `type`, `payload`, `created_at`). Inngest-Audit-Funktion + Drift-Detector schreiben rein.
2. `/api/events/stream` Route-Handler (Node-Runtime): `ReadableStream`, jede 1s SELECT seit `last_id` für `customer_id` aus Clerk-Session, format als SSE `data: {json}\n\n`.
3. Client-Hook `useDashboardEvents()` mit `EventSource`, dispatched in Zustand-Store → Toast-Component lauscht.
4. Reconnect bei `error`-Event nach 1s Backoff. Done.

**Total: 1–2 PD. Null neue SaaS-Accounts. Migration auf Pusher/Ably bleibt eine Konfig-Änderung, falls wir nach M9 mit 100+ Concurrent-Dashboards die SSE-Limits reißen.**

---

*Files referenced:*
- `/Users/koljaschope/Documents/rohan/docs/research/dashboard-pivot/03-auto-tracking-strategy.md` (Inngest-Polling-Quota-Berechnung, ge-erbt)
- `/Users/koljaschope/Documents/rohan/packages/inngest/` (Event-Source für Drift + Re-Audit)
- PRD §16 (Next.js 16 + Fluid Compute streamt SSE nativ)
- PRD §14 (Zero-new-spend bis M3-Gate)
