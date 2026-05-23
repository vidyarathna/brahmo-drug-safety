# BRAHMO Drug Safety Engine

**Assessment submission by Vidyarathna B for Doctor BRAHMO / Astroum AI**

A deterministic drug safety layer that runs before AI responds to doctors — catching dangerous drug interactions, allergy conflicts, and dosing errors from a database, then injecting hard safety constraints into the AI's system prompt.

---

## Quick Start (5 minutes)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd brahmo-drug-safety
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → Create project `brahmo-drug-safety`
2. Settings → API → Copy your **Project URL** and **anon key**
3. SQL Editor → Run `supabase/schema.sql` (creates tables)
4. SQL Editor → Run `supabase/seed.sql` (loads 50 drugs, 30 interactions, 10 patients)

### 3. Configure environment

```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL, anon key, and Anthropic API key
```

Get a free Anthropic API key: [console.anthropic.com](https://console.anthropic.com)

### 4. Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Architecture

```
Doctor Question
    ↓
Safety Engine (deterministic, ~5-30ms)
  ├── Drug-Drug Interaction check    (in-memory hash map lookup)
  ├── Allergy conflict check         (direct + cross-reactivity)
  ├── Renal dosing check             (eGFR threshold comparison)
  └── Clinical calculators           (CKD-EPI 2021, CHA₂DS₂-VASc)
    ↓
Constraint Text (severity-tagged)
    ├── Generic AI (no constraints)  → Response A
    └── Enhanced AI (constrained)   → Response B  ← AI cannot contradict
```

See `docs/architecture.md` for detailed design decisions.

## Key Design Principles

- **Safety engine never calls the LLM** — 100% database lookups
- **In-memory DDI cache** — sub-millisecond interaction checks
- **Extensible by INSERT** — add drugs/interactions with no code changes
- **Alert prioritisation** — HARD_BLOCK → SEVERE → MODERATE → INFO

## Demo Scenarios

| # | Patient | Drug Added | What It Catches |
|---|---------|-----------|-----------------|
| 1 | 78M, 12 meds | Clarithromycin | ⛔ SEVERE: CYP3A4 → rhabdomyolysis risk + bonus triple whammy |
| 2 | 65M, Pen ANAPHYLAXIS | Amoxicillin-Clavulanate | ⛔ HARD BLOCK: direct class match |
| 3 | 35F ICU, eGFR 18 | Gabapentin | ⚠ SEVERE: 100% renal clearance → toxic accumulation |
| 4 | 68M, AF/CHF/TIA | Any | CHA₂DS₂-VASc = 6 → stroke risk 9.8%/yr deterministic |

## Surprise Test Ready

All 50 drugs and 30 interactions are loaded. The system works for any
patient/drug combination in the database — not just the 4 demo scenarios.

Test it: `GET /api/safety-check?patient=9&drug=Tramadol`
(Patient 9 has Duloxetine → serotonin syndrome SEVERE alert fires)

## Project Structure

```
src/
  app/
    page.tsx                  ← Main demo UI
    api/
      safety-check/route.ts   ← Safety engine API
      claude/route.ts         ← Generic vs enhanced LLM comparison
  lib/
    safety-engine.ts          ← Core safety checks (DDI, allergy, renal)
    calculators.ts            ← eGFR CKD-EPI 2021, CHA₂DS₂-VASc
    types.ts                  ← TypeScript types
    supabase.ts               ← DB client
supabase/
  schema.sql                  ← Table definitions
  seed.sql                    ← 50 drugs, 30 DDIs, 10 patients
docs/
  architecture.md             ← Design decisions
data_sources.md               ← Clinical data provenance
```

## Innovation Features

1. **Pre-existing medication audit** — scans all current med pairs for severe interactions already on the patient's chart (catches the Diclofenac triple whammy unprompted)
2. **In-memory DDI cache** — O(1) per pair lookup, refreshes every 5 minutes, eliminates DB round-trips
3. **eGFR auto-computation** — computes CKD-EPI 2021 from creatinine if eGFR not stored; tagged as auto-computed for clinical awareness
4. **Alert fatigue management** — hard blocks/severe expanded by default; minor/info collapsed
5. **Unknown drug flagging** — explicit warning when drug is not in database (fail loudly, not silently)
