---
id: 0008
title: BYOK-Key-Encryption mit AES-256-GCM (column-level, kein KMS)
status: accepted
date: 2026-05-21
---

# ADR-0008 — BYOK-Key-Encryption mit AES-256-GCM

> Datum: 2026-05-21
> Status: ✅ Accepted
> Entscheider: User-Decision Pre-Execute Q-A1 (Sub-Plan-A Discovery)

---

## Kontext

ADR-0007 + Master-Plan-Decision Q1.3 führen **BYOK** (Bring Your Own Key) ein:
Pro/Agency-Workspaces dürfen einen eigenen `ANTHROPIC_API_KEY` oder
`OPENAI_API_KEY` hinterlegen, statt unsere managed-Provider-Keys zu nutzen.

Provider-API-Keys sind **Customer-Secrets mit hohem Schaden bei Leak**
(Cloud-Account-Hijack, Botnetz-Spend-Abuse). Plain-text in der DB ist
inakzeptabel. Bei Sub-Plan-A war zu klären: Wie verschlüsseln, ohne ein
KMS-Setup (AWS KMS, GCP KMS, HashiCorp Vault) als Voraussetzung mitzuschleppen?

Optionen evaluiert:
1. **`@vk/crypto`-Package** — neuer Package. Aufwand: Build-Setup +
   Test-Setup für genau 1 Use-Case. Verworfen — zu schwer für jetzt.
2. **AWS-KMS-Integration** — production-grade aber Vendor-Lock-in +
   Setup-Cost. Verworfen — Solo-Dev-Phase, Single-Region, kein KMS-Need.
3. **Inline Node-`crypto` mit env-var-key** — Recommended. Single-Region
   ausreichend, kein Vendor-Lock-in, +40 LOC.

## Entscheidung

`packages/billing/src/byok-crypto.ts` exportiert `encryptApiKey`/`decryptApiKey`
mit **AES-256-GCM** über Node's eingebautes `node:crypto` Modul.

Konfiguration:

```bash
# In .env / Vercel-Env:
BYOK_ENCRYPTION_KEY=<32 bytes base64-encoded>

# Generieren mit:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

DB-Schema (Sub-Plan-A Migration 0013):

```sql
ALTER TABLE subscription
  ADD COLUMN byok_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN byok_provider varchar(20),
  ADD COLUMN byok_key_ciphertext text,
  ADD COLUMN byok_key_iv text,
  ADD COLUMN byok_key_auth_tag text;
```

Alle drei Crypto-Felder werden gleichzeitig geschrieben/gelesen (siehe
`encryptApiKey` Rückgabe-Shape).

## Begründung

- **AES-256-GCM** ist NIST-empfohlen für authenticated encryption.
  Auth-Tag schützt vor Bit-Flip-Angriffen + Ciphertext-Tampering.
- **96-bit IV** ist GCM-Standard (max 2^32 distinct messages per key — far
  beyond unseren Use-Case mit ~10k Workspaces max).
- **Random IV pro Encrypt-Call** — zwei Verschlüsselungen desselben
  Plaintexts produzieren verschiedene Ciphertexts (no info leak).
- **base64-Encoding** für DB-Persistenz statt hex — kompakter, JSON-safe.
- **Key-via-Env-Var** — Vercel-Env-Variables sind verschlüsselt at-rest,
  Access ist auf Project-Members beschränkt, Rotation ist 1-Click.

## Konsequenzen

### Positiv
- Customer-Keys sind at-rest verschlüsselt.
- Kein KMS-Vendor-Lock-in. Migration zu KMS später möglich (re-encrypt
  via env-var-key → KMS-key in 1 Migration).
- Tamper-detection durch GCM-AuthTag — UI kann "key corrupted, please
  re-enter" zeigen statt silent fail.
- Plaintext verlässt nie den Server (Server-Action-Pattern in Sub-Plan-C).

### Negativ / Risiken
- **Single-Point-of-Failure:** `BYOK_ENCRYPTION_KEY` ist ein einzelner
  Master-Key. Rotation erfordert Bulk-Re-Encrypt aller bestehenden Keys.
- **Vercel-Env-Leak:** Wenn Vercel-Account kompromittiert, alle BYOK-Keys
  entschlüsselbar. Mitigation = 2FA + RBAC auf Vercel.
- **Backup-Strategie:** Wenn `BYOK_ENCRYPTION_KEY` verloren geht, alle
  BYOK-Records sind unrecoverable. Mitigation = 1-Passwort-Backup +
  Disaster-Recovery-Doc in `docs/operations/`.

## Implementation-Notes

- Tests in `packages/billing/src/byok-crypto.test.ts` covern:
  - Roundtrip mit typischem Anthropic-Key-Format
  - IV-Freshness (gleicher Plaintext → unterschiedliche Ciphertexts)
  - Empty-plaintext-Rejection
  - Tamper-Detection auf Ciphertext + AuthTag
  - Missing-Env-Var-Rejection
  - Wrong-Key-Length-Rejection
- Pre-Production-Check: `BYOK_ENCRYPTION_KEY` muss in Vercel-Env vor
  Sub-Plan-C-Ship gesetzt sein (siehe `docs/operations/stripe-go-live.md`,
  Sub-Plan-B-Output).
- Key-Rotation-Procedure: TBD, gehört in `docs/operations/byok-key-rotation.md`
  (Sub-Plan-C-Output).

## Out-of-Scope

- **Key-Rotation-Automation** — manuell für jetzt, Procedure dokumentiert.
- **Multi-Region-Key-Replication** — Single-Region-Deployment, irrelevant.
- **HSM-Backed-Master-Key** — V2 wenn Customer-Compliance es fordert.

## Referenzen

- `packages/billing/src/byok-crypto.ts`
- `docs/plans/saas-pricing-sub-a-db-metering.md` §9 Q-A1
- ADR-0007 (Credit-System + Intensity — BYOK-Mechanik)
- NIST SP 800-38D (GCM Spec)
