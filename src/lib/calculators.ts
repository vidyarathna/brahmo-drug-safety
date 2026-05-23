// src/lib/calculators.ts
// Deterministic clinical calculators — no LLM involved

import type { CHA2DS2Result } from './types'

// ── eGFR — CKD-EPI 2021 ─────────────────────────────────────
// Reference: Inker et al., NEJM 2021
// Race-free equation

export interface EGFRInput {
  creatinine_mg_dl: number   // serum creatinine in mg/dL
  age: number
  sex: 'M' | 'F'
}

export function computeEGFR(input: EGFRInput): number {
  const { creatinine_mg_dl: Scr, age, sex } = input

  // CKD-EPI 2021 constants
  const kappa  = sex === 'F' ? 0.7 : 0.9
  const alpha  = sex === 'F' ? -0.241 : -0.302
  const mult   = sex === 'F' ? 1.012 : 1.0

  const ratio = Scr / kappa
  const term1 = Math.min(ratio, 1) ** alpha
  const term2 = Math.max(ratio, 1) ** -1.200
  const term3 = 0.9938 ** age

  const egfr = 142 * term1 * term2 * term3 * mult

  // Round to 1 decimal — clinical precision matters (31.2 vs 31.0 changes decisions)
  return Math.round(egfr * 10) / 10
}

// Convenience: compute from patient labs (cr in mg/dL or μmol/L)
export function egfrFromPatientLabs(labs: Record<string, number | string>, age: number, sex: 'M' | 'F'): number | null {
  let cr: number | null = null

  if (labs.cr !== undefined) {
    cr = Number(labs.cr)
    // If value looks like μmol/L (typically >20), convert to mg/dL
    if (cr > 20) cr = cr / 88.42
  }

  if (!cr || isNaN(cr) || cr <= 0) return null

  return computeEGFR({ creatinine_mg_dl: cr, age, sex })
}

// ── CHA₂DS₂-VASc ─────────────────────────────────────────────
// Reference: Lip et al., Chest 2010; ESC AF Guidelines 2020

export interface CHA2DS2Input {
  has_chf: boolean          // C — Congestive Heart Failure / LVEF <40%
  has_hypertension: boolean // H — Hypertension
  age: number               // A2 (≥75 = +2), A (65-74 = +1)
  has_diabetes: boolean     // D — Diabetes mellitus
  has_stroke_tia: boolean   // S2 — Prior stroke/TIA/thromboembolism (+2)
  has_vascular: boolean     // V — Vascular disease (MI, peripheral arterial, aortic plaque)
  sex: 'M' | 'F'            // Sc — Female sex (+1)
}

// Annual stroke risk lookup by score (Lip 2010 / validation data)
const STROKE_RISK_BY_SCORE: Record<number, string> = {
  0: '0%', 1: '1.3%', 2: '2.2%', 3: '3.2%', 4: '4.0%',
  5: '6.7%', 6: '9.8%', 7: '9.6%', 8: '12.5%', 9: '15.2%'
}

export function computeCHA2DS2VASc(input: CHA2DS2Input): CHA2DS2Result {
  const breakdown: Record<string, number> = {}

  breakdown['CHF/LVEF<40% (C)']        = input.has_chf ? 1 : 0
  breakdown['Hypertension (H)']         = input.has_hypertension ? 1 : 0
  breakdown['Age ≥75 (A₂)']            = input.age >= 75 ? 2 : 0
  breakdown['Diabetes (D)']             = input.has_diabetes ? 1 : 0
  breakdown['Stroke/TIA/TE (S₂)']       = input.has_stroke_tia ? 2 : 0
  breakdown['Vascular disease (V)']     = input.has_vascular ? 1 : 0
  breakdown['Age 65–74 (A)']            = (input.age >= 65 && input.age < 75) ? 1 : 0
  breakdown['Female sex (Sc)']          = input.sex === 'F' ? 1 : 0

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0)
  const stroke_risk_pct = STROKE_RISK_BY_SCORE[Math.min(score, 9)] ?? '≥15%'

  // ESC 2020 thresholds
  let recommendation: string
  if (score === 0) {
    recommendation = 'No anticoagulation needed. Score 0 in males = very low risk.'
  } else if (score === 1 && input.sex === 'M') {
    recommendation = 'Consider anticoagulation. Reassess regularly. Score 1 male = low-moderate risk.'
  } else if (score === 1 && input.sex === 'F') {
    recommendation = 'No anticoagulation (score 1 in females = effectively 0 net clinical risk factors).'
  } else {
    recommendation = `ORAL ANTICOAGULATION STRONGLY RECOMMENDED. Stroke risk ${stroke_risk_pct}/year without treatment.`
  }

  return { score, breakdown, stroke_risk_pct, recommendation }
}
