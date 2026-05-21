---
id: 0001
title: Customer-Schema — Echte Tabelle (Option C2)
status: accepted
date: 2026-05-19
---

# ADR-0001 — Customer-Schema: Echte Tabelle (Option C2)

> Datum: 2026-05-19
> Status: ✅ Accepted
> Entscheider: User-Decision (siehe `docs/plans/done/galaxie/master-vision-galaxie.md` §11 Q3)

---

## Kontext

Die UI hat seit längerem Routen `/customers` und `/customers/[id]` (siehe `apps/web/src/app/customers/`). Das suggeriert eine erstklassige "Customer"-Entity.

Die DB-Schema-Inspektion (`packages/db/src/schema.ts`) zeigt: **es gibt KEINE `customer`-Tabelle.** Die Hierarchie ist aktuell:

```
workspace (= Better-Auth Organization)
  └── repo (workspace_id FK)
        └── scan
              └── finding
```

Die UI gruppiert Repos vermutlich client-seitig über ein `repo.customer_label` Feld oder ähnliches (Detail in `lib/customers.ts` — Server-Action, die Repos pro Customer aggregiert).

Im **Galaxie-Refactor** ist die geplante Hierarchie:

```
Workspace → Customer (Planet) → Repo (Mond) → File (Asteroid)
```

Customer wird hier zur **1st-class hierarchischen Ebene** zwischen Workspace und Repo. Ohne saubere DB-Repräsentation würde:
- Aggregate-Queries ("alle Findings pro Customer gruppiert nach Severity") teuer + fragil,
- Customer-spezifische Settings (Default-Apply-Mode, GitHub-Org-Scope) keinen guten Ort haben,
- Cache-Invalidation (`workspace:<id>:customer:<id>:*`) keine stabile ID haben.

## Optionen

### C1: Customer = Workspace
Jeder Customer ist ein eigener Better-Auth-Workspace. Lena hat N Workspaces, einen pro Customer.

**Pro:** keine Migration. Sauberste Multi-Tenant-Boundary (Better-Auth deckt es ab).
**Contra:** Galaxie-Overview über alle Customers wird unmöglich (Workspace = Galaxie, Customer = Workspace, also nur 1 Customer pro Galaxie). Workspace-Switching muss hyper-prominent. Lena müsste 5–30 mal switchen pro Tag.

### C2: Echte Customer-Tabelle (Empfehlung, gewählt)
Neue Tabelle `customer` mit FK auf `workspace`. `repo` bekommt `customer_id` FK.

**Pro:** Galaxie-Hierarchie sauber 4-Layer. Customer-Settings haben einen Ort. Aggregate-Queries trivial. Cache-Tags stabil.
**Contra:** Migration nötig (additiv, kein Daten-Verlust). Backfill via existing `repo.customer_label`.

### C3: Customer als virtuelles Group-Key
Nur `repo.customer_label` (existiert), kein FK. Galaxie macht Grouping client-seitig.

**Pro:** keine Migration.
**Contra:** Cross-Cutting-Aggregate-Logik in der UI nachgebaut. Customer-Settings haben keinen Ort. Cache-Invalidation per-Customer unmöglich. Race-Conditions bei Label-Renames.

## Entscheidung

**C2 — Echte Customer-Tabelle.**

**Schema:**

```sql
CREATE TABLE customer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspace(id) ON DELETE CASCADE,
  slug text NOT NULL,
  label text NOT NULL,
  default_apply_mode text NOT NULL DEFAULT 'pr', -- 'pr' | 'direct'
  github_org text, -- optional, für GitHub-App-Scope
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, slug)
);

CREATE INDEX customer_workspace_idx ON customer (workspace_id);
```

`repo` bekommt eine neue Spalte:

```sql
ALTER TABLE repo ADD COLUMN customer_id uuid REFERENCES customer(id);
CREATE INDEX repo_customer_idx ON repo (customer_id);
```

**Migration-Slot:** `0008_add_customer.sql` (Sprint G2)

**Backfill-Strategie:** wenn `repo.customer_label` existiert → für jeden unique label pro workspace einen `customer`-Record mit slug=slugify(label), label=label. Dann `repo.customer_id` setzen. Falls kein `customer_label` existiert → 1 "Default"-Customer pro Workspace, alle Repos zugeordnet.

## Konsequenzen

**Positiv:**
- 4-Layer-Galaxie-Hierarchie sauber abgebildet.
- Customer-Settings (apply_mode, github_org) haben einen klaren Ort.
- Cache-Tagging `workspace:<id>:c:<customer_id>:*` stabil.
- ON DELETE CASCADE = Workspace-Delete räumt Customers + Repos automatisch.

**Negativ:**
- Migration nötig (Sprint G2 muss DB-Changes + Backfill enthalten).
- Bestehende Server-Actions in `lib/customers.ts` müssen refactored werden (vermutlich label-basierte Queries → ID-basierte Queries).
- Wenn `repo.customer_label` weiter genutzt wird parallel → potenzielle Drift. → `repo.customer_label` nach Backfill als deprecated markieren, in Sprint G3 entfernen.

## Re-Open-Trigger

Falls einer dieser Trigger eintritt → ADR-Re-Open:
- Customer-Settings stellen sich als nicht genutzt heraus (kein `apply_mode`-Override, kein `github_org` gebraucht) → könnte C3 retroaktiv attraktiver sein.
- Lena will Sub-Customers (Customer hat Sub-Projekte) → 5-Layer-Hierarchie nötig, neue ADR.
- Bessere Datenbank-Lösung wird available (z.B. native Multi-Tenant-Postgres-Feature 2027+) → Migration zu der Lösung.

## Verwandte Dokumente

- Master-Plan: `docs/plans/master-vision-galaxie.md` §7.1 (Schema-Optionen)
- Sprint-G2-Plan: `docs/plans/galaxie-sprint-2-data-binding.md` (wird in Pre-Work geschrieben)
- Vision: `docs/vision.md` (Hierarchie + Persona)
