// src/app/api/claude/route.ts
import { NextRequest, NextResponse } from 'next/server'
import type { LLMRequest, LLMResponse, Patient } from '@/lib/types'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

function buildPatientContext(patient: Patient): string {
  const meds  = patient.medications.map(m => `${m.name} ${m.dose} ${m.frequency}`).join(', ')
  const allergyList = patient.allergies.length > 0
    ? patient.allergies.map(a => `${a.drug_or_class} (${a.reaction})`).join(', ')
    : 'NKDA'
  const labStr = Object.entries(patient.labs).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(', ')
  const conditions = patient.conditions.join(', ')

  return `
PATIENT: ${patient.name} | ${patient.age}${patient.sex}${patient.weight_kg ? ` | ${patient.weight_kg}kg` : ''}
CONDITIONS: ${conditions}
CURRENT MEDICATIONS: ${meds || 'None'}
ALLERGIES: ${allergyList}
LABS: ${labStr || 'Not available'}
VITALS: ${Object.entries(patient.vitals).map(([k, v]) => `${k}: ${v}`).join(', ') || 'Not recorded'}
${patient.notes ? `NOTES: ${patient.notes}` : ''}
`.trim()
}

async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('LLM_API_KEY not set in environment')

  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text ?? 'No response'
}

export async function POST(req: NextRequest) {
  try {
    const body: LLMRequest = await req.json()
    const { patient, new_drug_name, doctor_question, mode, safety_result } = body

    const patientContext = buildPatientContext(patient)

    if (mode === 'generic') {
      // Generic AI: no safety constraints, just patient data
      const systemPrompt = `You are a clinical AI assistant. Answer the doctor's question based on the patient information provided. Be helpful and informative.`
      const userMessage  = `${patientContext}\n\nDOCTOR'S QUESTION: ${doctor_question}`

      const responseText = await callClaude(systemPrompt, userMessage)

      const result: LLMResponse = {
        mode: 'generic',
        response: responseText,
        system_prompt_used: systemPrompt,
      }
      return NextResponse.json(result)
    }

    if (mode === 'enhanced') {
      if (!safety_result?.constraint_text) {
        return NextResponse.json({ error: 'safety_result.constraint_text required for enhanced mode' }, { status: 400 })
      }

      // Enhanced: safety constraints prepended as system prompt
      const systemPrompt = `You are a clinical AI assistant operating within a drug safety system.

${safety_result.constraint_text}

IMPORTANT: The constraints above are DETERMINISTIC — computed from a verified medical database. They are NOT suggestions. You must incorporate all warnings in your response and must not contradict them.`

      const userMessage = `${patientContext}\n\nDOCTOR'S QUESTION: ${doctor_question}`

      const responseText = await callClaude(systemPrompt, userMessage)

      // Inject CHA₂DS₂-VASc score into response prefix if computed
      let finalResponse = responseText
      if (safety_result.cha2ds2_score) {
        const score = safety_result.cha2ds2_score
        const prefix = `**CHA₂DS₂-VASc Score: ${score.score}/9** (computed deterministically)\n` +
          `Stroke risk: ${score.stroke_risk_pct}/year without anticoagulation\n` +
          `${score.recommendation}\n\n---\n\n`
        finalResponse = prefix + responseText
      }

      const result: LLMResponse = {
        mode: 'enhanced',
        response: finalResponse,
        system_prompt_used: systemPrompt,
      }
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'mode must be "generic" or "enhanced"' }, { status: 400 })
  } catch (err) {
    console.error('LLM route error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
