// src/app/api/safety-check/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { runSafetyCheck } from '@/lib/safety-engine'
import { computeCHA2DS2VASc, computeEGFR } from '@/lib/calculators'
import type { Patient, SafetyCheckRequest } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body: SafetyCheckRequest = await req.json()
    const { patient_id, new_drug_name, run_cha2ds2 } = body

    if (!patient_id || !new_drug_name) {
      return NextResponse.json({ error: 'patient_id and new_drug_name required' }, { status: 400 })
    }

    // Fetch patient
    const supabase = createServerClient()
    const { data: patientData, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patient_id)
      .single()

    if (error || !patientData) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const patient = patientData as Patient

    // Run deterministic safety checks
    const startMs = Date.now()
    const result  = await runSafetyCheck(patient, new_drug_name)
    const durationMs = Date.now() - startMs

    // Optionally compute CHA₂DS₂-VASc if patient has AF
    if (run_cha2ds2 || patient.conditions?.some(c => c.toLowerCase().includes('af') || c.toLowerCase().includes('atrial'))) {
      const conditions = patient.conditions?.map(c => c.toLowerCase()) ?? []
      const cha2ds2 = computeCHA2DS2VASc({
        has_chf:          conditions.some(c => c.includes('heart failure') || c.includes('hf') || c.includes('chf')),
        has_hypertension: conditions.some(c => c.includes('hypertension') || c.includes('htn')),
        age:              patient.age,
        has_diabetes:     conditions.some(c => c.includes('diabetes') || c.includes('dm') || c.includes('t2d')),
        has_stroke_tia:   conditions.some(c => c.includes('tia') || c.includes('stroke') || c.includes('te ')),
        has_vascular:     conditions.some(c => c.includes('mi') || c.includes('pad') || c.includes('vascular')),
        sex:              patient.sex,
      })
      result.cha2ds2_score = cha2ds2
    }

    return NextResponse.json({ ...result, duration_ms: durationMs })
  } catch (err) {
    console.error('Safety check error:', err)
    return NextResponse.json({ error: 'Internal server error', detail: String(err) }, { status: 500 })
  }
}

// Also support GET for testing with query params
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const display_id   = searchParams.get('patient')
  const new_drug_name = searchParams.get('drug')

  if (!display_id || !new_drug_name) {
    return NextResponse.json({ error: 'Pass ?patient=1&drug=Clarithromycin' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: patientData } = await supabase
    .from('patients')
    .select('*')
    .eq('display_id', display_id)
    .single()

  if (!patientData) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

  const result = await runSafetyCheck(patientData as Patient, new_drug_name)
  return NextResponse.json(result)
}
