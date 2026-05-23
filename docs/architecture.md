# Architecture Notes — BRAHMO Drug Safety Engine

## Overview

The system intercepts every doctor query and runs deterministic safety checks
before any LLM responds. Safety results are injected as hard constraints into
the AI's system prompt — constraints the AI cannot override.

```
Doctor Question
    │
    ▼
┌─────────────────────────────────────────┐
│         SAFETY ENGINE (deterministic)   │  ~5-30ms
│  1. Drug-Drug Interaction check         │  ← Database lookup, NOT AI
│  2. Allergy conflict check              │  ← Direct + cross-reactivity
│  3. Renal dosing check                  │  ← eGFR threshold comparison
│  4. Clinical calculators               │  ← CKD-EPI 2021, CHA₂DS₂-VASc
└─────────────────────────────────────────┘
    │
    ▼
Constraint Text (structured, severity-tagged)
    │
    ├──► Generic AI call (no constraints) ──► Response A
    │
    └──► Enhanced AI call (constraints as system prompt) ──► Response B
                                                    ↑
                                      AI cannot contradict these
```

## Key Design Decisions

### 1. Safety engine never calls the LLM

All 4 safety checks are database lookups or mathematical functions.
This guarantees 100% detection rate for interactions in the database,
regardless of the LLM's knowledge or hallucination tendencies.

### 2. In-memory DDI cache

Drug interactions (30 pairs, extensible to thousands) are pre-loaded into
a hash map on first request. Keyed by `sorted(drug_a_id, drug_b_id).join('|')`.

- N meds = N*(N-1)/2 lookups, all in-memory, O(1) per pair
- 12 meds = 66 lookups in <1ms
- 100 meds = 4,950 lookups, still <5ms
- Cache refreshes every 5 minutes; manually invalidated on writes

This was a deliberate tradeoff: slightly stale cache acceptable given
interaction data changes rarely; eliminates DB round-trips entirely for
the hot path.

### 3. Constraint text injection

Safety results are serialised into a structured text block:

```
=== SAFETY ENGINE CONSTRAINTS (DETERMINISTIC) ===
⛔ HARD BLOCKS — DO NOT PRESCRIBE:
  • HARD BLOCK: Amoxicillin-Clavulanate — DIRECT ALLERGY MATCH
    Patient has documented ANAPHYLAXIS to Penicillin (2023)
⚠ SEVERE WARNINGS:
  • ...
=== END SAFETY CONSTRAINTS ===
```

This text is prepended to the LLM's system prompt. The AI sees it as
authoritative instructions, not suggestions.

### 4. Extensibility

**Add a drug:** INSERT one row into `drugs` table. Engine picks it up on
next cache refresh (within 5 minutes, or immediately on restart).

**Add an interaction:** INSERT one row into `drug_interactions`. Same.

**Add a calculator:** Add one function to `src/lib/calculators.ts`.
Register it in the API route. No other changes needed.

**Add a patient:** INSERT into `patients` table.

### 5. eGFR auto-computation

If patient has a stored `labs.egfr`, it's used directly.
If only `labs.cr` is stored, CKD-EPI 2021 is computed at query time.
Result is tagged as "auto-computed" in the alert output so clinicians
know to verify against lab-reported value in AKI cases.

Precision: rounded to 1 decimal place (31.2 ≠ 31.0 — can change decisions
for drugs with eGFR <30 thresholds).

### 6. Alert prioritisation (anti-fatigue)

Alerts are sorted: HARD_BLOCK → SEVERE → MODERATE → MINOR → INFO.

Hard blocks and severe alerts are expanded by default.
Minor and info alerts are collapsed — click to expand.

This ensures a doctor seeing 10+ alerts sees the lethal ones first and
can ignore the minor ones if time-pressured. Alert fatigue is a real
patient safety risk.

### 7. Existing medication audit (bonus)

Beyond checking the new drug against current meds, the engine also scans
all current medication pairs for pre-existing severe interactions.
This surfaces the "triple whammy" (Diclofenac OTC + Telmisartan + loop diuretic)
that the doctor may not have noticed before.

## Database Schema

Three core tables + one patient table:

```
drugs                      → 50 medications with renal_dosing JSONB
drug_interactions          → 30 pairs, severity, mechanism, management
allergy_cross_reactivity   → class-level cross-reactivity rules
patients                   → 10 demo patients with meds/allergies/labs
```

Interaction pairs enforce `drug_a_id < drug_b_id` ordering (UNIQUE constraint)
to prevent duplicate entries regardless of insertion order.

## Performance

Measured on local dev:
- Safety engine (all 4 checks): 5-30ms for typical patients
- LLM calls (generic + enhanced in parallel): 1-3s
- Total end-to-end: ~3-4s

The safety check completes and renders before LLM responses arrive,
so doctors can see alerts immediately without waiting for AI.

## What I Would Add With More Time

1. **Bidirectional interaction audit** — when a doctor removes a drug,
   re-check if that changes safety profile for remaining meds

2. **Drug class fallback matching** — Erythromycin + Atorvastatin not
   in the explicit pairs table, but same CYP3A4 mechanism as
   Clarithromycin + Atorvastatin. Class-level matching would catch these.

3. **Override workflow** — Senior doctor can acknowledge an alert and
   proceed with a mandatory free-text reason, logged to audit table.
   This is important for clinical workflow — hard blocks without override
   capability cause doctors to route around the system entirely.

4. **Real-time DB sync** — WebSocket subscription to Supabase so cache
   invalidates instantly when a new interaction is added, rather than
   waiting for TTL.

5. **Paediatric weight-based dosing** — Patient 4 (6yo, 20kg) and
   Patient 10 (10yo, 35kg) need mg/kg calculations, not adult thresholds.

## Data Sources

See `data_sources.md` for full provenance of all clinical data.
