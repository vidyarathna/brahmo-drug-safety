'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Patient, SafetyCheckResult, LLMResponse, SafetyAlert, AlertLevel } from '@/lib/types'

// ── Alert styling helpers ─────────────────────────────────────
const ALERT_STYLES: Record<AlertLevel, { bg: string; border: string; icon: string; label: string }> = {
  HARD_BLOCK: { bg: 'bg-red-50',     border: 'border-red-500',   icon: '⛔', label: 'HARD BLOCK' },
  SEVERE:     { bg: 'bg-orange-50',  border: 'border-orange-500',icon: '⚠️', label: 'SEVERE' },
  MODERATE:   { bg: 'bg-yellow-50',  border: 'border-yellow-500',icon: '⚠️', label: 'MODERATE' },
  MINOR:      { bg: 'bg-blue-50',    border: 'border-blue-400',  icon: 'ℹ️', label: 'MINOR' },
  INFO:       { bg: 'bg-gray-50',    border: 'border-gray-300',  icon: 'ℹ️', label: 'INFO' },
}

function AlertCard({ alert }: { alert: SafetyAlert }) {
  const [expanded, setExpanded] = useState(alert.level === 'HARD_BLOCK' || alert.level === 'SEVERE')
  const s = ALERT_STYLES[alert.level]

  return (
    <div className={`rounded-lg border-l-4 p-3 mb-2 ${s.bg} ${s.border} cursor-pointer`}
         onClick={() => setExpanded(e => !e)}>
      <div className="flex items-start gap-2">
        <span className="text-lg leading-none mt-0.5">{s.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${{
              HARD_BLOCK: 'bg-red-600 text-white',
              SEVERE:     'bg-orange-500 text-white',
              MODERATE:   'bg-yellow-500 text-white',
              MINOR:      'bg-blue-500 text-white',
              INFO:       'bg-gray-500 text-white',
            }[alert.level]}`}>{s.label}</span>
            <span className="text-sm font-semibold text-gray-800 break-words">{alert.title}</span>
          </div>
          {expanded && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-700 whitespace-pre-line">{alert.detail}</p>
              <div className="mt-2 p-2 bg-white/70 rounded border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Management</p>
                <p className="text-sm text-gray-800">{alert.management}</p>
              </div>
            </div>
          )}
        </div>
        <span className="text-gray-400 text-xs shrink-0">{expanded ? '▲' : '▼'}</span>
      </div>
    </div>
  )
}

function ResponsePanel({ title, response, loading, isGeneric }: {
  title: string; response: string; loading: boolean; isGeneric: boolean
}) {
  return (
    <div className={`flex flex-col rounded-xl border-2 overflow-hidden ${
      isGeneric ? 'border-gray-300' : 'border-green-500'
    }`}>
      <div className={`px-4 py-3 font-bold text-sm flex items-center gap-2 ${
        isGeneric
          ? 'bg-gray-100 text-gray-700'
          : 'bg-green-600 text-white'
      }`}>
        <span>{isGeneric ? '🤖' : '🛡️'}</span>
        <span>{title}</span>
        {!isGeneric && <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Safety Enhanced</span>}
      </div>
      <div className="flex-1 p-4 bg-white min-h-48">
        {loading ? (
          <div className="flex items-center gap-3 text-gray-500">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span className="text-sm">Generating response…</span>
          </div>
        ) : response ? (
          <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap prose prose-sm max-w-none">
            {response}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Response will appear here…</p>
        )}
      </div>
    </div>
  )
}

function PatientCard({ patient }: { patient: Patient }) {
  const meds = patient.medications.slice(0, 6)
  const moreCount = patient.medications.length - 6
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
          {patient.age}{patient.sex}
        </div>
        <div>
          <h3 className="font-bold text-gray-900">{patient.name}</h3>
          <p className="text-xs text-gray-500">{patient.conditions.join(' · ')}</p>
        </div>
        {Object.keys(patient.labs).length > 0 && (
          <div className="ml-auto text-right">
            {patient.labs.egfr && (
              <div className={`text-sm font-bold ${Number(patient.labs.egfr) < 30 ? 'text-red-600' : Number(patient.labs.egfr) < 60 ? 'text-orange-600' : 'text-green-600'}`}>
                eGFR {patient.labs.egfr}
              </div>
            )}
            {patient.labs.cr && <div className="text-xs text-gray-500">Cr {patient.labs.cr}</div>}
          </div>
        )}
      </div>

      {patient.allergies.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {patient.allergies.map((a, i) => (
            <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              a.severity?.toLowerCase().includes('anaphylaxis') ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
            }`}>
              ⚠ {a.drug_or_class} ({a.reaction})
            </span>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs text-gray-500 font-medium mb-1">Current medications ({patient.medications.length})</p>
        <div className="flex flex-wrap gap-1">
          {meds.map((m, i) => (
            <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
              {m.name} {m.dose}
            </span>
          ))}
          {moreCount > 0 && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">+{moreCount} more</span>}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function HomePage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [newDrug, setNewDrug] = useState('')
  const [question, setQuestion] = useState('')
  const [safetyResult, setSafetyResult] = useState<SafetyCheckResult | null>(null)
  const [genericResponse, setGenericResponse] = useState<LLMResponse | null>(null)
  const [enhancedResponse, setEnhancedResponse] = useState<LLMResponse | null>(null)
  const [loadingSafety, setLoadingSafety] = useState(false)
  const [loadingGeneric, setLoadingGeneric] = useState(false)
  const [loadingEnhanced, setLoadingEnhanced] = useState(false)
  const [error, setError] = useState('')
  const resultsRef = useRef<HTMLDivElement>(null)

  // Quick-select demo scenarios
  const DEMO_SCENARIOS = [
    { label: 'Scenario 1: Missed Interaction', patient_id: 3, drug: 'Clarithromycin', q: 'Can I add Clarithromycin 500mg for pneumonia?' },
    { label: 'Scenario 2: Allergy That Kills', patient_id: 1, drug: 'Amoxicillin-Clavulanate', q: 'UTI treatment — can I use Amoxicillin-Clavulanate?' },
    { label: 'Scenario 3: Renal Dosing', patient_id: 7, drug: 'Gabapentin', q: 'Adding Gabapentin 300mg TDS for neuropathic pain — is this safe?' },
    { label: 'Scenario 4: Score Drives Decision', patient_id: 8, drug: 'Rivaroxaban', q: 'Does this patient still need anticoagulation? Consider switching from Warfarin to Rivaroxaban.' },
  ]

  useEffect(() => {
    supabase.from('patients').select('*').order('display_id').then(({ data }) => {
      if (data) setPatients(data as Patient[])
    })
  }, [])

  function loadScenario(scenario: typeof DEMO_SCENARIOS[0]) {
    const patient = patients.find(p => p.display_id === scenario.patient_id)
    if (patient) {
      setSelectedPatient(patient)
      setNewDrug(scenario.drug)
      setQuestion(scenario.q)
      setSafetyResult(null)
      setGenericResponse(null)
      setEnhancedResponse(null)
      setError('')
    }
  }

  async function runCheck() {
    if (!selectedPatient || !newDrug || !question) {
      setError('Select a patient, drug, and enter a question.')
      return
    }
    setError('')
    setSafetyResult(null)
    setGenericResponse(null)
    setEnhancedResponse(null)
    setLoadingSafety(true)

    try {
      // Step 1: Safety check (deterministic, fast)
      const safetyRes = await fetch('/api/safety-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          new_drug_name: newDrug,
          doctor_question: question,
        }),
      })
      const safety: SafetyCheckResult = await safetyRes.json()
      setSafetyResult(safety)
      setLoadingSafety(false)

      // Scroll to results
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)

      // Step 2: Both LLM calls in parallel
      setLoadingGeneric(true)
      setLoadingEnhanced(true)

      const [genericRes, enhancedRes] = await Promise.all([
        fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient: selectedPatient, new_drug_name: newDrug, doctor_question: question, mode: 'generic' }),
        }),
        fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient: selectedPatient, new_drug_name: newDrug, doctor_question: question, mode: 'enhanced', safety_result: safety }),
        }),
      ])

      const [generic, enhanced] = await Promise.all([genericRes.json(), enhancedRes.json()])
      setGenericResponse(generic)
      setEnhancedResponse(enhanced)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoadingSafety(false)
      setLoadingGeneric(false)
      setLoadingEnhanced(false)
    }
  }

  const hardBlockCount = safetyResult?.alerts.filter(a => a.level === 'HARD_BLOCK').length ?? 0
  const severeCount    = safetyResult?.alerts.filter(a => a.level === 'SEVERE').length ?? 0

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🏥 BRAHMO Drug Safety Engine</h1>
            <p className="text-blue-200 text-sm">Deterministic safety checks before AI responds</p>
          </div>
          <div className="text-right text-sm text-blue-200">
            <div>Vidyarathna B</div>
            <div className="text-xs">Doctor BRAHMO Assessment</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Demo Scenario Quick-Select */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-3">⚡ Quick Demo Scenarios</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {DEMO_SCENARIOS.map((s, i) => (
              <button key={i}
                onClick={() => loadScenario(s)}
                className="text-left text-xs p-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors">
                <div className="font-semibold text-blue-800">{s.label.split(':')[0]}</div>
                <div className="text-blue-600 mt-0.5">{s.label.split(':')[1]?.trim()}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Patient selector + Input */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-gray-700">1. Select Patient</h2>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedPatient?.id ?? ''}
              onChange={e => {
                const p = patients.find(x => x.id === e.target.value)
                setSelectedPatient(p ?? null)
                setSafetyResult(null)
                setGenericResponse(null)
                setEnhancedResponse(null)
              }}
            >
              <option value="">— Choose a patient —</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  Patient {p.display_id}: {p.name} ({p.age}{p.sex})
                </option>
              ))}
            </select>
            {selectedPatient && <PatientCard patient={selectedPatient} />}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-gray-700">2. Drug & Question</h2>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Drug to prescribe</label>
              <input
                type="text"
                placeholder="e.g. Clarithromycin"
                value={newDrug}
                onChange={e => setNewDrug(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Doctor's question</label>
              <textarea
                rows={4}
                placeholder="e.g. Can I add Clarithromycin 500mg for pneumonia?"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              onClick={runCheck}
              disabled={loadingSafety || loadingGeneric}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loadingSafety ? (
                <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Running Safety Engine…</>
              ) : (
                <>🔍 Run Safety Check + Compare AI Responses</>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <div ref={resultsRef}>
          {safetyResult && (
            <div className="space-y-4">
              {/* Safety Engine Results */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className={`px-4 py-3 flex items-center gap-3 ${
                  hardBlockCount > 0 ? 'bg-red-600' : severeCount > 0 ? 'bg-orange-500' : 'bg-green-600'
                } text-white`}>
                  <span className="text-lg">{hardBlockCount > 0 ? '⛔' : severeCount > 0 ? '⚠️' : '✅'}</span>
                  <div>
                    <h2 className="font-bold">Safety Engine Results</h2>
                    <p className="text-xs opacity-80">
                      {safetyResult.alerts.length} alert{safetyResult.alerts.length !== 1 ? 's' : ''} detected
                      {safetyResult.egfr_used ? ` · eGFR ${safetyResult.egfr_used}` : ''}
                      {safetyResult.duration_ms !== undefined ? ` · ${safetyResult.duration_ms}ms` : ''}
                    </p>
                  </div>
                  {safetyResult.cha2ds2_score && (
                    <div className="ml-auto text-right">
                      <div className="text-xl font-bold">CHA₂DS₂-VASc: {safetyResult.cha2ds2_score.score}</div>
                      <div className="text-xs opacity-80">Stroke risk: {safetyResult.cha2ds2_score.stroke_risk_pct}/yr</div>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  {safetyResult.alerts.length === 0 ? (
                    <p className="text-green-700 font-medium">✅ No safety concerns detected for {safetyResult.new_drug_name}</p>
                  ) : (
                    <div className="space-y-1">
                      {safetyResult.alerts.map(alert => (
                        <AlertCard key={alert.id} alert={alert} />
                      ))}
                    </div>
                  )}

                  {safetyResult.cha2ds2_score && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-bold text-blue-800 mb-2">CHA₂DS₂-VASc Breakdown</h3>
                      <div className="grid grid-cols-2 gap-1">
                        {Object.entries(safetyResult.cha2ds2_score.breakdown).map(([k, v]) => (
                          <div key={k} className={`flex justify-between text-sm px-2 py-1 rounded ${v > 0 ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-500'}`}>
                            <span>{k}</span><span>+{v}</span>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-sm font-bold text-blue-900">{safetyResult.cha2ds2_score.recommendation}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Side-by-side LLM comparison */}
              {(loadingGeneric || genericResponse || loadingEnhanced || enhancedResponse) && (
                <div>
                  <h2 className="text-sm font-bold text-gray-700 mb-3">
                    AI Response Comparison — Generic vs Safety-Enhanced
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <ResponsePanel
                      title="Generic AI (no safety constraints)"
                      response={genericResponse?.response ?? ''}
                      loading={loadingGeneric}
                      isGeneric={true}
                    />
                    <ResponsePanel
                      title="Safety-Enhanced AI (constrained)"
                      response={enhancedResponse?.response ?? ''}
                      loading={loadingEnhanced}
                      isGeneric={false}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
