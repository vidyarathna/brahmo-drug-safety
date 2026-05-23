// src/lib/types.ts

export interface Drug {
  id: string
  generic_name: string
  generic_name_normalized: string
  drug_class: string
  renal_dosing: RenalDosing
}

export interface RenalDosing {
  thresholds: RenalThreshold[]
}

export interface RenalThreshold {
  egfr_lt?: number
  egfr_between?: [number, number]
  action: 'contraindicated' | 'avoid' | 'reduce' | 'severe_reduce' | 'start_low' | 'caution' | 'increase_dose'
  note: string
}

export interface DrugInteraction {
  id: string
  drug_a_id: string
  drug_b_id: string
  severity: 'CONTRAINDICATED' | 'SEVERE' | 'MODERATE' | 'MINOR'
  mechanism: string
  clinical_effect: string
  management: string
  // joined fields
  drug_a_name?: string
  drug_b_name?: string
}

export interface AllergyCrossReactivity {
  id: string
  allergy_class: string
  cross_reacts_with: string
  cross_reactivity_pct: string
  severity_modifier: 'block' | 'avoid' | 'caution' | 'safe'
  clinical_guidance: string
}

export interface PatientAllergy {
  drug_or_class: string
  reaction: string
  severity: string
  year?: number
  note?: string
}

export interface PatientMedication {
  name: string
  dose: string
  frequency: string
}

export interface Patient {
  id: string
  display_id: number
  name: string
  age: number
  sex: 'M' | 'F'
  weight_kg?: number
  conditions: string[]
  medications: PatientMedication[]
  allergies: PatientAllergy[]
  labs: Record<string, number | string>
  vitals: Record<string, number | string>
  notes?: string
}

// ── Safety Engine Results ────────────────────────────────────

export type AlertLevel = 'HARD_BLOCK' | 'SEVERE' | 'MODERATE' | 'MINOR' | 'INFO'

export interface SafetyAlert {
  id: string
  level: AlertLevel
  type: 'DRUG_INTERACTION' | 'ALLERGY' | 'RENAL_DOSING' | 'RENAL_CALCULATED' | 'UNKNOWN_DRUG'
  title: string
  detail: string
  management: string
  drugs_involved: string[]
}

export interface SafetyCheckResult {
  new_drug_name: string
  new_drug: Drug | null
  drug_found: boolean
  alerts: SafetyAlert[]
  egfr_used: number | null
  cha2ds2_score?: CHA2DS2Result
  constraint_text: string
  checked_at: string
}

export interface CHA2DS2Result {
  score: number
  breakdown: Record<string, number>
  stroke_risk_pct: string
  recommendation: string
}

// ── API Request/Response ─────────────────────────────────────

export interface SafetyCheckRequest {
  patient_id: string
  new_drug_name: string
  doctor_question: string
  run_cha2ds2?: boolean
}

export interface LLMRequest {
  patient: Patient
  new_drug_name: string
  doctor_question: string
  mode: 'generic' | 'enhanced'
  safety_result?: SafetyCheckResult
}

export interface LLMResponse {
  mode: 'generic' | 'enhanced'
  response: string
  system_prompt_used?: string
  error?: string
}
