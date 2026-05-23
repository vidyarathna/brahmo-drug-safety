// src/lib/safety-engine.ts
// Deterministic safety checks — ALL database lookups, ZERO LLM calls
// This is the safety-critical core. Never add LLM calls here.

import { createServerClient } from './supabase'
import { egfrFromPatientLabs } from './calculators'
import type {
  Drug, DrugInteraction, AllergyCrossReactivity,
  Patient, SafetyAlert, SafetyCheckResult, AlertLevel
} from './types'

// ── In-Memory Cache ───────────────────────────────────────────
// Pre-loaded on first request; eliminates DB round-trips for DDI checks
// 50 drugs × 30 interactions = trivially small; 1000 drugs still <1MB

interface DDICache {
  // key: sorted(drug_a_id, drug_b_id).join('|')
  byPair: Map<string, DrugInteraction>
  // key: drug_id → list of interactions involving that drug
  byDrug: Map<string, DrugInteraction[]>
  loaded: boolean
  loadedAt: number
}

interface AllergyCache {
  // key: allergy_class → list of cross-reactivity rules
  byClass: Map<string, AllergyCrossReactivity[]>
  loaded: boolean
}

interface DrugCache {
  // key: normalized name → drug
  byNormalized: Map<string, Drug>
  // key: drug_class → list of drugs
  byClass: Map<string, Drug[]>
  loaded: boolean
}

const ddiCache: DDICache     = { byPair: new Map(), byDrug: new Map(), loaded: false, loadedAt: 0 }
const allergyCache: AllergyCache = { byClass: new Map(), loaded: false }
const drugCache: DrugCache   = { byNormalized: new Map(), byClass: new Map(), loaded: false }

const CACHE_TTL_MS = 5 * 60 * 1000  // 5 minutes

async function ensureCacheLoaded() {
  const supabase = createServerClient()
  const now = Date.now()

  // Load drugs
  if (!drugCache.loaded) {
    const { data: drugs } = await supabase.from('drugs').select('*')
    if (drugs) {
      drugCache.byNormalized.clear()
      drugCache.byClass.clear()
      for (const d of drugs) {
        drugCache.byNormalized.set(d.generic_name_normalized, d as Drug)
        if (!drugCache.byClass.has(d.drug_class)) drugCache.byClass.set(d.drug_class, [])
        drugCache.byClass.get(d.drug_class)!.push(d as Drug)
      }
      drugCache.loaded = true
    }
  }

  // Load DDI cache (refresh if stale)
  if (!ddiCache.loaded || (now - ddiCache.loadedAt) > CACHE_TTL_MS) {
    const { data: interactions } = await supabase
      .from('drug_interactions')
      .select(`*, drug_a:drugs!drug_interactions_drug_a_id_fkey(generic_name), drug_b:drugs!drug_interactions_drug_b_id_fkey(generic_name)`)

    if (interactions) {
      ddiCache.byPair.clear()
      ddiCache.byDrug.clear()
      for (const i of interactions) {
        const ddi: DrugInteraction = {
          ...i,
          drug_a_name: i.drug_a?.generic_name,
          drug_b_name: i.drug_b?.generic_name,
        }
        const pairKey = [i.drug_a_id, i.drug_b_id].sort().join('|')
        ddiCache.byPair.set(pairKey, ddi)
        // Index by each drug for O(1) lookup
        if (!ddiCache.byDrug.has(i.drug_a_id)) ddiCache.byDrug.set(i.drug_a_id, [])
        if (!ddiCache.byDrug.has(i.drug_b_id)) ddiCache.byDrug.set(i.drug_b_id, [])
        ddiCache.byDrug.get(i.drug_a_id)!.push(ddi)
        ddiCache.byDrug.get(i.drug_b_id)!.push(ddi)
      }
      ddiCache.loaded = true
      ddiCache.loadedAt = now
    }
  }

  // Load allergy cross-reactivity
  if (!allergyCache.loaded) {
    const { data: acr } = await supabase.from('allergy_cross_reactivity').select('*')
    if (acr) {
      allergyCache.byClass.clear()
      for (const r of acr) {
        if (!allergyCache.byClass.has(r.allergy_class)) allergyCache.byClass.set(r.allergy_class, [])
        allergyCache.byClass.get(r.allergy_class)!.push(r as AllergyCrossReactivity)
      }
      allergyCache.loaded = true
    }
  }
}

// ── Drug Lookup ───────────────────────────────────────────────

export function normalizeDrugName(name: string): string {
  return name.toLowerCase().replace(/[\s\-_\/]/g, '')
}

export function findDrug(name: string): Drug | null {
  const normalized = normalizeDrugName(name)
  return drugCache.byNormalized.get(normalized) ?? null
}

// ── Check 1: Drug-Drug Interactions ──────────────────────────
// O(n) over current medications — all in-memory, ~0ms

function checkDrugInteractions(newDrug: Drug, currentMeds: Drug[]): SafetyAlert[] {
  const alerts: SafetyAlert[] = []

  for (const med of currentMeds) {
    if (med.id === newDrug.id) continue
    const pairKey = [newDrug.id, med.id].sort().join('|')
    const interaction = ddiCache.byPair.get(pairKey)
    if (!interaction) continue

    const level: AlertLevel =
      interaction.severity === 'CONTRAINDICATED' || interaction.severity === 'SEVERE' ? 'SEVERE'
      : interaction.severity === 'MODERATE' ? 'MODERATE'
      : 'MINOR'

    alerts.push({
      id: `ddi-${interaction.id}`,
      level,
      type: 'DRUG_INTERACTION',
      title: `${interaction.severity}: ${newDrug.generic_name} + ${med.generic_name}`,
      detail: `Mechanism: ${interaction.mechanism}\nEffect: ${interaction.clinical_effect}`,
      management: interaction.management,
      drugs_involved: [newDrug.generic_name, med.generic_name],
    })
  }

  return alerts
}

// ── Check 1b: Existing medication interactions (for bonus catch) ──
// Checks all pairs in current meds against each other

function checkExistingMedInteractions(currentMeds: Drug[]): SafetyAlert[] {
  const alerts: SafetyAlert[] = []
  const seen = new Set<string>()

  for (let i = 0; i < currentMeds.length; i++) {
    for (let j = i + 1; j < currentMeds.length; j++) {
      const a = currentMeds[i], b = currentMeds[j]
      const pairKey = [a.id, b.id].sort().join('|')
      if (seen.has(pairKey)) continue
      seen.add(pairKey)

      const interaction = ddiCache.byPair.get(pairKey)
      if (!interaction) continue
      if (interaction.severity !== 'SEVERE' && interaction.severity !== 'CONTRAINDICATED') continue

      alerts.push({
        id: `existing-ddi-${interaction.id}`,
        level: 'INFO',
        type: 'DRUG_INTERACTION',
        title: `⚠ EXISTING: ${a.generic_name} + ${b.generic_name} (${interaction.severity})`,
        detail: `Pre-existing interaction on patient's chart. ${interaction.clinical_effect}`,
        management: interaction.management,
        drugs_involved: [a.generic_name, b.generic_name],
      })
    }
  }

  return alerts
}

// ── Check 2: Allergy Conflicts ────────────────────────────────

function checkAllergyConflicts(newDrug: Drug, allergies: Patient['allergies']): SafetyAlert[] {
  const alerts: SafetyAlert[] = []

  for (const allergy of allergies) {
    const allergyKey = allergy.drug_or_class.toLowerCase().replace(/[\s_]/g, '_')
    const isAnaphylaxis = allergy.severity?.toLowerCase().includes('anaphylaxis')

    // 1. Direct name match
    if (normalizeDrugName(allergy.drug_or_class) === newDrug.generic_name_normalized) {
      alerts.push({
        id: `allergy-direct-${allergy.drug_or_class}`,
        level: isAnaphylaxis ? 'HARD_BLOCK' : 'SEVERE',
        type: 'ALLERGY',
        title: `${isAnaphylaxis ? '⛔ HARD BLOCK' : 'SEVERE'}: ${newDrug.generic_name} — DIRECT ALLERGY MATCH`,
        detail: `Patient has documented ${allergy.reaction?.toUpperCase() ?? 'reaction'} to ${allergy.drug_or_class} (${allergy.year ?? 'date unknown'}).`,
        management: `DO NOT prescribe. Document allergy avoidance. Use structurally unrelated alternative.`,
        drugs_involved: [newDrug.generic_name],
      })
      continue
    }

    // 2. Direct class match (drug IS in the allergic class)
    if (allergy.drug_or_class.toLowerCase() === newDrug.drug_class.replace(/_/g, ' ') ||
        allergy.drug_or_class.toLowerCase() === newDrug.drug_class) {
      alerts.push({
        id: `allergy-class-direct-${allergy.drug_or_class}`,
        level: isAnaphylaxis ? 'HARD_BLOCK' : 'SEVERE',
        type: 'ALLERGY',
        title: `${isAnaphylaxis ? '⛔ HARD BLOCK' : 'SEVERE'}: ${newDrug.generic_name} is a ${newDrug.drug_class} — patient allergic to this class`,
        detail: `Documented ${allergy.reaction} to ${allergy.drug_or_class}.`,
        management: `Do not prescribe. Use alternative drug class.`,
        drugs_involved: [newDrug.generic_name],
      })
      continue
    }

    // 3. Cross-reactivity lookup
    const crossRules = allergyCache.byClass.get(allergy.drug_or_class.toLowerCase()) ??
                       allergyCache.byClass.get(allergyKey) ?? []

    for (const rule of crossRules) {
      if (rule.cross_reacts_with !== newDrug.drug_class) continue
      if (rule.severity_modifier === 'safe') {
        // Explicitly safe — still inform
        alerts.push({
          id: `allergy-safe-${rule.id}`,
          level: 'INFO',
          type: 'ALLERGY',
          title: `ℹ ${newDrug.generic_name} — SAFE despite ${allergy.drug_or_class} allergy`,
          detail: `Cross-reactivity rate: ${rule.cross_reactivity_pct}. ${rule.clinical_guidance}`,
          management: rule.clinical_guidance,
          drugs_involved: [newDrug.generic_name],
        })
        continue
      }

      const level: AlertLevel =
        rule.severity_modifier === 'block' ? 'HARD_BLOCK'
        : rule.severity_modifier === 'avoid' && isAnaphylaxis ? 'SEVERE'
        : rule.severity_modifier === 'avoid' ? 'MODERATE'
        : 'MINOR'

      alerts.push({
        id: `allergy-cross-${rule.id}`,
        level,
        type: 'ALLERGY',
        title: `CROSS-REACTIVITY: ${newDrug.generic_name} (${newDrug.drug_class}) — ${rule.cross_reactivity_pct} cross-reaction with ${allergy.drug_or_class} allergy`,
        detail: `${isAnaphylaxis ? 'Patient had ANAPHYLAXIS — ' : ''}${rule.clinical_guidance}`,
        management: rule.clinical_guidance,
        drugs_involved: [newDrug.generic_name],
      })
    }
  }

  return alerts
}

// ── Check 3: Renal Dosing ─────────────────────────────────────

function checkRenalDosing(newDrug: Drug, egfr: number): SafetyAlert[] {
  const alerts: SafetyAlert[] = []
  const thresholds = newDrug.renal_dosing?.thresholds ?? []

  for (const threshold of thresholds) {
    let matches = false

    if (threshold.egfr_lt !== undefined && egfr < threshold.egfr_lt) {
      matches = true
    } else if (threshold.egfr_between) {
      const [low, high] = threshold.egfr_between
      if (egfr >= low && egfr < high) matches = true
    }

    if (!matches) continue

    const level: AlertLevel =
      threshold.action === 'contraindicated' ? 'HARD_BLOCK'
      : threshold.action === 'avoid' ? 'SEVERE'
      : threshold.action === 'severe_reduce' ? 'SEVERE'
      : threshold.action === 'reduce' ? 'MODERATE'
      : 'INFO'

    const actionLabel: Record<string, string> = {
      contraindicated: '⛔ CONTRAINDICATED',
      avoid: '⚠ AVOID',
      severe_reduce: '⚠ SIGNIFICANT DOSE REDUCTION REQUIRED',
      reduce: '⚠ DOSE REDUCTION REQUIRED',
      start_low: 'ℹ Start at lower dose',
      caution: 'ℹ Use with caution',
      increase_dose: 'ℹ Higher dose may be needed',
    }

    alerts.push({
      id: `renal-${newDrug.id}-${threshold.egfr_lt ?? threshold.egfr_between?.join('-')}`,
      level,
      type: 'RENAL_DOSING',
      title: `${actionLabel[threshold.action] ?? threshold.action}: ${newDrug.generic_name} at eGFR ${egfr}`,
      detail: threshold.note,
      management: threshold.note,
      drugs_involved: [newDrug.generic_name],
    })
  }

  return alerts
}

// ── Main Safety Check ─────────────────────────────────────────

export async function runSafetyCheck(
  patient: Patient,
  newDrugName: string
): Promise<SafetyCheckResult> {
  await ensureCacheLoaded()

  const alerts: SafetyAlert[] = []

  // Lookup new drug
  const newDrug = findDrug(newDrugName)
  const drugFound = !!newDrug

  if (!newDrug) {
    alerts.push({
      id: 'unknown-drug',
      level: 'INFO',
      type: 'UNKNOWN_DRUG',
      title: `⚠ Drug not in database: "${newDrugName}"`,
      detail: `Cannot perform safety checks for unrecognised drugs. Safety engine cannot guarantee this medication is safe.`,
      management: 'Verify drug name spelling. Check formulary manually. Safety checks INCOMPLETE.',
      drugs_involved: [newDrugName],
    })
  }

  // Resolve current medications to Drug objects
  const currentDrugs: Drug[] = []
  for (const med of patient.medications) {
    const drug = findDrug(med.name)
    if (drug) currentDrugs.push(drug)
  }

  // Compute or use stored eGFR
  let egfr: number | null = patient.labs.egfr ? Number(patient.labs.egfr) : null
  if (!egfr && patient.labs.cr) {
    egfr = egfrFromPatientLabs(patient.labs, patient.age, patient.sex)
    if (egfr) {
      alerts.push({
        id: 'egfr-computed',
        level: 'INFO',
        type: 'RENAL_CALCULATED',
        title: `ℹ eGFR auto-computed: ${egfr} mL/min/1.73m²`,
        detail: `Calculated using CKD-EPI 2021 from Cr ${patient.labs.cr} mg/dL, age ${patient.age}, ${patient.sex === 'F' ? 'Female' : 'Male'}.`,
        management: 'Verify creatinine is in mg/dL. Acute AKI may not be reflected — use clinical judgment.',
        drugs_involved: [],
      })
    }
  }

  if (newDrug) {
    // Check 1: Drug-Drug Interactions with new drug
    alerts.push(...checkDrugInteractions(newDrug, currentDrugs))

    // Check 1b: Flag pre-existing severe interactions on chart (bonus catch)
    const existingAlerts = checkExistingMedInteractions(currentDrugs)
    alerts.push(...existingAlerts)

    // Check 2: Allergy conflicts
    alerts.push(...checkAllergyConflicts(newDrug, patient.allergies))

    // Check 3: Renal dosing
    if (egfr !== null) {
      alerts.push(...checkRenalDosing(newDrug, egfr))
    }
  }

  // Sort: HARD_BLOCK → SEVERE → MODERATE → MINOR → INFO
  const levelOrder: Record<AlertLevel, number> = {
    HARD_BLOCK: 0, SEVERE: 1, MODERATE: 2, MINOR: 3, INFO: 4
  }
  alerts.sort((a, b) => levelOrder[a.level] - levelOrder[b.level])

  const constraintText = generateConstraintText(alerts, newDrugName, egfr, patient)

  return {
    new_drug_name: newDrugName,
    new_drug: newDrug,
    drug_found: drugFound,
    alerts,
    egfr_used: egfr,
    constraint_text: constraintText,
    checked_at: new Date().toISOString(),
  }
}

// ── Constraint Text Generator ─────────────────────────────────
// This becomes the system prompt injected before the LLM responds

function generateConstraintText(
  alerts: SafetyAlert[],
  newDrugName: string,
  egfr: number | null,
  patient: Patient
): string {
  if (alerts.length === 0) {
    return `SAFETY ENGINE CLEARED: No safety concerns detected for ${newDrugName} in this patient (eGFR: ${egfr ?? 'not calculated'}). Respond as clinically appropriate.`
  }

  const hardBlocks   = alerts.filter(a => a.level === 'HARD_BLOCK')
  const severeAlerts = alerts.filter(a => a.level === 'SEVERE')
  const moderates    = alerts.filter(a => a.level === 'MODERATE')
  const minors       = alerts.filter(a => a.level === 'MINOR')

  const lines: string[] = [
    '=== SAFETY ENGINE CONSTRAINTS (DETERMINISTIC — MUST NOT BE OVERRIDDEN) ===',
    `Patient: ${patient.name}, ${patient.age}${patient.sex}, eGFR: ${egfr ?? 'unknown'} mL/min/1.73m²`,
    `Drug under consideration: ${newDrugName}`,
    '',
  ]

  if (hardBlocks.length > 0) {
    lines.push('⛔ HARD BLOCKS — DO NOT PRESCRIBE:')
    for (const a of hardBlocks) {
      lines.push(`  • ${a.title}`)
      lines.push(`    ${a.detail.replace(/\n/g, ' ')}`)
      lines.push(`    Action: ${a.management}`)
    }
    lines.push('')
  }

  if (severeAlerts.length > 0) {
    lines.push('⚠ SEVERE WARNINGS — Address explicitly in response:')
    for (const a of severeAlerts) {
      lines.push(`  • ${a.title}`)
      lines.push(`    ${a.detail.replace(/\n/g, ' ')}`)
      lines.push(`    Management: ${a.management}`)
    }
    lines.push('')
  }

  if (moderates.length > 0) {
    lines.push('⚠ MODERATE WARNINGS — Mention and advise:')
    for (const a of moderates) {
      lines.push(`  • ${a.title}: ${a.management}`)
    }
    lines.push('')
  }

  if (minors.length > 0) {
    lines.push('ℹ MINOR/INFO:')
    for (const a of minors) {
      lines.push(`  • ${a.title}`)
    }
    lines.push('')
  }

  lines.push('INSTRUCTIONS TO AI: You MUST reflect ALL of the above safety constraints in your response.')
  lines.push('Do NOT suggest any hard-blocked drugs. Do NOT ignore allergy information.')
  lines.push('Suggest safe alternatives where appropriate. Be specific about doses for renally impaired patients.')
  lines.push('=== END SAFETY CONSTRAINTS ===')

  return lines.join('\n')
}
