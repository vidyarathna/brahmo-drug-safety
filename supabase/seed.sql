-- ============================================================
-- BRAHMO Drug Safety Engine — Seed Data
-- Run AFTER schema.sql
-- ============================================================

-- ── DRUGS (50) ───────────────────────────────────────────────
insert into drugs (generic_name, generic_name_normalized, drug_class, renal_dosing) values
-- Diabetes
('Metformin',        'metformin',       'biguanide',        '{"thresholds":[{"egfr_lt":30,"action":"contraindicated","note":"Risk of lactic acidosis"}]}'),
('Glimepiride',      'glimepiride',     'sulfonylurea',      '{"thresholds":[{"egfr_lt":30,"action":"avoid","note":"Hypoglycaemia risk"}]}'),
('Empagliflozin',    'empagliflozin',   'sglt2i',            '{"thresholds":[{"egfr_lt":20,"action":"avoid","note":"Ineffective and risk of DKA"}]}'),
('Insulin Glargine', 'insulinglargine', 'insulin',           '{"thresholds":[{"egfr_lt":30,"action":"reduce","note":"Reduce dose; hypoglycaemia risk increases"}]}'),
-- Statins
('Atorvastatin',     'atorvastatin',    'statin',            '{"thresholds":[]}'),
('Rosuvastatin',     'rosuvastatin',    'statin',            '{"thresholds":[{"egfr_lt":30,"action":"start_low","note":"Start at 5mg; avoid >10mg"}]}'),
-- Antihypertensives
('Amlodipine',       'amlodipine',      'ccb',               '{"thresholds":[]}'),
('Telmisartan',      'telmisartan',     'arb',               '{"thresholds":[{"egfr_lt":30,"action":"caution","note":"Monitor K+ and creatinine"}]}'),
('Ramipril',         'ramipril',        'ace_inhibitor',     '{"thresholds":[{"egfr_lt":30,"action":"reduce","note":"Reduce dose; monitor K+"}]}'),
('Lisinopril',       'lisinopril',      'ace_inhibitor',     '{"thresholds":[{"egfr_lt":30,"action":"reduce","note":"Reduce dose; monitor K+"}]}'),
-- Diuretics
('Furosemide',       'furosemide',      'loop_diuretic',     '{"thresholds":[{"egfr_lt":30,"action":"increase_dose","note":"Higher doses needed for efficacy in CKD"}]}'),
('Spironolactone',   'spironolactone',  'k_sparing_diuretic','{"thresholds":[{"egfr_lt":30,"action":"avoid","note":"Severe hyperkalemia risk"}]}'),
-- Beta-blockers
('Bisoprolol',       'bisoprolol',      'beta_blocker',      '{"thresholds":[]}'),
('Carvedilol',       'carvedilol',      'beta_blocker',      '{"thresholds":[]}'),
-- Antiplatelets
('Aspirin',          'aspirin',         'antiplatelet',      '{"thresholds":[]}'),
('Clopidogrel',      'clopidogrel',     'antiplatelet',      '{"thresholds":[]}'),
('Ticagrelor',       'ticagrelor',      'antiplatelet',      '{"thresholds":[]}'),
-- Anticoagulants
('Warfarin',         'warfarin',        'vka',               '{"thresholds":[]}'),
('Rivaroxaban',      'rivaroxaban',     'doac',              '{"thresholds":[{"egfr_lt":15,"action":"avoid","note":"Avoid; insufficient data"},{"egfr_between":[15,49],"action":"reduce","note":"15mg OD instead of 20mg"}]}'),
('Apixaban',         'apixaban',        'doac',              '{"thresholds":[{"egfr_lt":25,"action":"reduce","note":"Reduce to 2.5mg BD if 2 of: age≥80, weight≤60kg, Cr≥133"}]}'),
('Enoxaparin',       'enoxaparin',      'lmwh',              '{"thresholds":[{"egfr_lt":30,"action":"reduce","note":"Once daily dosing; monitor anti-Xa levels"}]}'),
-- Antibiotics — Penicillins
('Amoxicillin',              'amoxicillin',             'penicillin',       '{"thresholds":[{"egfr_lt":30,"action":"reduce","note":"Reduce frequency to BD or OD"}]}'),
('Amoxicillin-Clavulanate',  'amoxicillinclavulanate',  'penicillin',       '{"thresholds":[{"egfr_lt":30,"action":"reduce","note":"Reduce frequency"}]}'),
('Ampicillin',               'ampicillin',              'penicillin',       '{"thresholds":[{"egfr_lt":30,"action":"reduce","note":"Reduce frequency"}]}'),
-- Macrolides
('Clarithromycin',   'clarithromycin',  'macrolide',         '{"thresholds":[{"egfr_lt":30,"action":"reduce","note":"Reduce dose by 50%"}]}'),
('Azithromycin',     'azithromycin',    'macrolide',         '{"thresholds":[]}'),
-- Fluoroquinolones
('Levofloxacin',     'levofloxacin',    'fluoroquinolone',   '{"thresholds":[{"egfr_lt":50,"action":"reduce","note":"Adjust dose and/or interval"}]}'),
('Ciprofloxacin',    'ciprofloxacin',   'fluoroquinolone',   '{"thresholds":[{"egfr_lt":30,"action":"reduce","note":"Reduce dose by 50%"}]}'),
-- Other antibiotics
('Meropenem',        'meropenem',       'carbapenem',        '{"thresholds":[{"egfr_lt":26,"action":"reduce","note":"Reduce dose and extend interval"}]}'),
('Ceftriaxone',      'ceftriaxone',     'cephalosporin_3rd', '{"thresholds":[]}'),
('Cefazolin',        'cefazolin',       'cephalosporin_1st', '{"thresholds":[{"egfr_lt":35,"action":"reduce","note":"Reduce dose"}]}'),
('Nitrofurantoin',   'nitrofurantoin',  'nitrofuran',        '{"thresholds":[{"egfr_lt":30,"action":"avoid","note":"Ineffective and accumulates — toxic"}]}'),
('Co-trimoxazole',   'cotrimoxazole',   'sulfonamide',       '{"thresholds":[{"egfr_lt":15,"action":"avoid","note":"Avoid; accumulation risk"}]}'),
-- Gabapentinoids
('Gabapentin',       'gabapentin',      'gabapentinoid',     '{"thresholds":[{"egfr_lt":15,"action":"severe_reduce","note":"100mg ONCE DAILY only; half-life 5h→52h"},{"egfr_between":[15,30],"action":"severe_reduce","note":"100mg ONCE DAILY"},{"egfr_between":[30,60],"action":"reduce","note":"Reduce by 50%"}]}'),
('Pregabalin',       'pregabalin',      'gabapentinoid',     '{"thresholds":[{"egfr_lt":15,"action":"severe_reduce","note":"75% dose reduction"},{"egfr_between":[15,30],"action":"reduce","note":"75% dose reduction"},{"egfr_between":[30,60],"action":"reduce","note":"Reduce dose"}]}'),
-- Antidepressants
('Escitalopram',     'escitalopram',    'ssri',              '{"thresholds":[]}'),
('Fluoxetine',       'fluoxetine',      'ssri',              '{"thresholds":[]}'),
('Duloxetine',       'duloxetine',      'snri',              '{"thresholds":[{"egfr_lt":30,"action":"avoid","note":"Avoid — accumulation of active metabolites"}]}'),
-- Opioids
('Tramadol',         'tramadol',        'opioid',            '{"thresholds":[{"egfr_lt":30,"action":"reduce","note":"Reduce dose and frequency; active metabolite accumulates"}]}'),
('Morphine',         'morphine',        'opioid',            '{"thresholds":[{"egfr_lt":30,"action":"reduce","note":"Active metabolite M6G accumulates → respiratory depression"}]}'),
('Fentanyl',         'fentanyl',        'opioid',            '{"thresholds":[]}'),
-- Analgesics
('Paracetamol',      'paracetamol',     'analgesic',         '{"thresholds":[]}'),
('Diclofenac',       'diclofenac',      'nsaid',             '{"thresholds":[{"egfr_lt":60,"action":"avoid","note":"Avoid in CKD — worsens renal function, fluid retention"}]}'),
('Ibuprofen',        'ibuprofen',       'nsaid',             '{"thresholds":[{"egfr_lt":60,"action":"avoid","note":"Avoid in CKD — nephrotoxic"}]}'),
-- PPIs
('Pantoprazole',     'pantoprazole',    'ppi',               '{"thresholds":[]}'),
('Omeprazole',       'omeprazole',      'ppi',               '{"thresholds":[]}'),
-- Other
('Tamsulosin',       'tamsulosin',      'alpha_blocker',     '{"thresholds":[]}'),
('Digoxin',          'digoxin',         'cardiac_glycoside', '{"thresholds":[{"egfr_lt":30,"action":"reduce","note":"Reduce dose; monitor serum digoxin levels"}]}'),
('Phenytoin',        'phenytoin',       'anticonvulsant',    '{"thresholds":[{"egfr_lt":30,"action":"caution","note":"Complex — protein binding changes; monitor free levels"}]}'),
('Sodium Valproate', 'sodiumvalproate', 'anticonvulsant',    '{"thresholds":[]}')
on conflict (generic_name) do nothing;

-- ── DRUG INTERACTIONS (30) ───────────────────────────────────
-- Helper: insert by drug name (handles UUID lookup)
create or replace function insert_ddi(
  name_a text, name_b text,
  p_severity text, p_mechanism text, p_effect text, p_management text
) returns void language plpgsql as $$
declare
  id_a uuid; id_b uuid; final_a uuid; final_b uuid;
begin
  select id into id_a from drugs where generic_name = name_a;
  select id into id_b from drugs where generic_name = name_b;
  if id_a is null then raise exception 'Drug not found: %', name_a; end if;
  if id_b is null then raise exception 'Drug not found: %', name_b; end if;
  -- enforce a < b ordering
  if id_a < id_b then final_a := id_a; final_b := id_b;
  else final_a := id_b; final_b := id_a; end if;
  insert into drug_interactions (drug_a_id, drug_b_id, severity, mechanism, clinical_effect, management)
  values (final_a, final_b, p_severity, p_mechanism, p_effect, p_management)
  on conflict (drug_a_id, drug_b_id) do nothing;
end;
$$;

select insert_ddi('Clarithromycin','Atorvastatin','SEVERE',
  'CYP3A4 inhibition by clarithromycin',
  '4-5x increase in statin plasma levels → rhabdomyolysis, acute renal failure',
  'AVOID combination. Use Azithromycin instead (minimal CYP3A4 effect). If clarithromycin essential, hold statin during course.');

select insert_ddi('Clarithromycin','Rosuvastatin','MODERATE',
  'Weak CYP3A4 interaction + possible transporter inhibition',
  'Increased rosuvastatin levels → myopathy risk',
  'Use with caution. Monitor for muscle pain. Consider dose reduction.');

select insert_ddi('Clarithromycin','Amlodipine','MODERATE',
  'CYP3A4 inhibition increases amlodipine levels',
  'Significant hypotension, reflex tachycardia',
  'Monitor BP closely. Consider dose reduction of amlodipine. Azithromycin preferred.');

select insert_ddi('Clarithromycin','Warfarin','SEVERE',
  'CYP enzyme inhibition reduces warfarin metabolism',
  'INR increases significantly → major bleeding risk',
  'Avoid if possible. If essential, reduce warfarin dose, monitor INR every 2-3 days.');

select insert_ddi('Ciprofloxacin','Warfarin','MODERATE',
  'CYP1A2 inhibition increases warfarin levels',
  'Elevated INR → bleeding risk',
  'Monitor INR closely when starting/stopping ciprofloxacin. Adjust warfarin dose.');

select insert_ddi('Fluoxetine','Tramadol','SEVERE',
  'Combined serotonin reuptake inhibition + tramadol serotonergic activity',
  'Serotonin syndrome — agitation, hyperthermia, clonus, death risk',
  'CONTRAINDICATED. Use alternative opioid (fentanyl preferred). If unavoidable, extreme monitoring in ICU.');

select insert_ddi('Escitalopram','Tramadol','MODERATE',
  'Serotonergic effects — lower risk than fluoxetine but real',
  'Serotonin syndrome risk, seizure threshold lowering',
  'Avoid if possible. If necessary, use lowest effective tramadol dose, monitor closely.');

select insert_ddi('Diclofenac','Telmisartan','SEVERE',
  'NSAIDs reduce renal prostaglandins → vasoconstriction; ARBs reduce efferent tone',
  'Nephrotoxic triple whammy (NSAID + ARB + any diuretic). Acute kidney injury.',
  'AVOID combination. Use Paracetamol for pain. If NSAID essential, stop ARB and monitor renal function daily.');

select insert_ddi('Diclofenac','Ramipril','SEVERE',
  'NSAIDs antagonise ACE inhibitor effects and reduce renal blood flow',
  'Nephrotoxic triple whammy. AKI, hyperkalemia, fluid retention.',
  'AVOID. Paracetamol is the safe alternative. Monitor renal function if unavoidable.');

select insert_ddi('Ibuprofen','Aspirin','MODERATE',
  'Ibuprofen competes for COX-1 binding site, blocking aspirin antiplatelet effect',
  'Reduced cardioprotective antiplatelet effect of aspirin',
  'Take aspirin 30 minutes before ibuprofen, or use Paracetamol instead.');

select insert_ddi('Warfarin','Aspirin','SEVERE',
  'Additive bleeding risk: anticoagulant + antiplatelet',
  'Major haemorrhage risk (GI, intracranial). INR does not capture full risk.',
  'Only combine when clinically indicated (e.g. AF + ACS). Use lowest aspirin dose (75mg). Monitor closely.');

select insert_ddi('Spironolactone','Ramipril','MODERATE',
  'Both raise serum potassium — K-sparing diuretic + ACE inhibitor',
  'Severe hyperkalemia → life-threatening cardiac arrhythmia',
  'Monitor K+ closely (baseline, 1 week, 1 month, then 3-monthly). Restrict dietary K+. Avoid if K+ >5.5 mmol/L.');

select insert_ddi('Spironolactone','Telmisartan','MODERATE',
  'Both raise serum potassium — K-sparing diuretic + ARB',
  'Hyperkalemia risk — same mechanism as with ACE inhibitors',
  'Monitor K+ closely. Avoid if eGFR <30. Consider alternatives.');

select insert_ddi('Digoxin','Amiodarone','SEVERE',
  'Amiodarone inhibits P-gp and reduces renal digoxin clearance',
  'Digoxin toxicity — nausea, bradycardia, heart block, arrhythmia',
  'Reduce digoxin dose by 50% when starting amiodarone. Monitor digoxin levels and ECG closely.');

select insert_ddi('Metformin','Contrast dye','MODERATE',
  'Iodinated contrast reduces renal function, impairing metformin clearance',
  'Lactic acidosis risk, particularly in pre-existing CKD',
  'Hold metformin 48h before contrast procedure. Restart only after confirming renal function stable.');

select insert_ddi('Phenytoin','Sodium Valproate','MODERATE',
  'Complex bidirectional interaction: valproate displaces phenytoin from protein binding',
  'Unpredictable phenytoin levels — toxicity or loss of seizure control',
  'Monitor free (unbound) phenytoin levels, not total. Adjust doses carefully with neurology input.');

select insert_ddi('Duloxetine','Tramadol','SEVERE',
  'Combined serotonergic activity — SNRI + tramadol',
  'Serotonin syndrome — potentially fatal',
  'AVOID. Use alternative analgesic. If opioid needed, fentanyl has no serotonergic activity.');

select insert_ddi('Clopidogrel','Omeprazole','MODERATE',
  'Omeprazole inhibits CYP2C19, reducing clopidogrel activation to active metabolite',
  'Reduced antiplatelet effect → increased cardiovascular event risk',
  'Switch to Pantoprazole (weaker CYP2C19 inhibitor). Evidence for clinical harm is strongest with omeprazole.');

select insert_ddi('Clopidogrel','Pantoprazole','MINOR',
  'Weaker CYP2C19 inhibition than omeprazole',
  'Minimal reduction in clopidogrel antiplatelet effect',
  'Pantoprazole is preferred PPI with clopidogrel. No dose change needed.');

select insert_ddi('Rivaroxaban','Clarithromycin','SEVERE',
  'Clarithromycin inhibits both P-gp and CYP3A4 — dual pathway inhibition',
  'Significant increase in rivaroxaban levels → major bleeding risk',
  'AVOID combination. Consider LMWH as bridge anticoagulation during antibiotic course.');

select insert_ddi('Apixaban','Clarithromycin','MODERATE',
  'P-gp and CYP3A4 inhibition increases apixaban levels',
  'Increased bleeding risk',
  'Use with caution. Consider dose reduction or alternative antibiotic. Monitor for bleeding signs.');

select insert_ddi('Simvastatin','Amlodipine','MODERATE',
  'Amlodipine inhibits CYP3A4, increasing simvastatin levels',
  'Increased myopathy/rhabdomyolysis risk',
  'Limit simvastatin to 20mg/day when combined with amlodipine. Consider switching to Atorvastatin or Rosuvastatin.');

select insert_ddi('Methotrexate','Co-trimoxazole','SEVERE',
  'Both are antifolates — additive folate antagonism',
  'Pancytopenia, mucositis, hepatotoxicity',
  'AVOID combination. Use alternative antibiotic. If essential, monitor FBC closely and give folinic acid.');

select insert_ddi('Carbamazepine','Clarithromycin','SEVERE',
  'CYP3A4 inhibition dramatically increases carbamazepine levels',
  'Carbamazepine toxicity — ataxia, diplopia, drowsiness, cardiac conduction abnormalities',
  'AVOID. Use alternative antibiotic. If unavoidable, reduce carbamazepine dose by 50% and monitor levels.');

select insert_ddi('Theophylline','Ciprofloxacin','SEVERE',
  'CYP1A2 inhibition by ciprofloxacin markedly increases theophylline levels',
  'Theophylline toxicity — seizures, arrhythmia, death',
  'AVOID. Use alternative antibiotic (azithromycin). If unavoidable, reduce theophylline by 50% and monitor levels.');

select insert_ddi('Escitalopram','Ondansetron','MODERATE',
  'Additive QT interval prolongation',
  'Torsades de Pointes, potentially fatal ventricular arrhythmia',
  'Avoid combination if possible. If essential, ECG monitoring, correct electrolytes, use lowest effective doses.');

select insert_ddi('Metformin','Furosemide','MINOR',
  'Furosemide can increase metformin levels; combined effect on renal perfusion in CKD',
  'Lactic acidosis risk, particularly if dehydration occurs',
  'Monitor renal function. Ensure adequate hydration. Hold metformin if acute illness causes dehydration.');

select insert_ddi('Morphine','Escitalopram','MINOR',
  'Additive CNS depression',
  'Increased sedation, respiratory depression risk',
  'Use with caution. Monitor sedation level. Use lowest effective doses of both.');

select insert_ddi('Pregabalin','Morphine','MODERATE',
  'Additive CNS and respiratory depression — gabapentinoid + opioid',
  'Respiratory depression, excessive sedation, death (particularly in elderly/CKD)',
  'Avoid routine combination. If needed, use lowest doses. Monitor respiratory rate and sedation.');

select insert_ddi('Lithium','Diclofenac','SEVERE',
  'NSAIDs reduce renal lithium clearance',
  'Lithium toxicity — tremor, confusion, renal failure, cardiac arrhythmia',
  'AVOID NSAIDs in lithium patients. Use Paracetamol. Monitor lithium levels urgently if NSAID was taken.');

-- ── ALLERGY CROSS-REACTIVITY ─────────────────────────────────
insert into allergy_cross_reactivity (allergy_class, cross_reacts_with, cross_reactivity_pct, severity_modifier, clinical_guidance) values
('penicillin', 'penicillin',        '100%',   'block',   'DIRECT MATCH — amoxicillin, ampicillin, amoxicillin-clavulanate ARE penicillins. Absolute contraindication.'),
('penicillin', 'cephalosporin_1st', '1-2%',   'avoid',   'Avoid if penicillin reaction was anaphylaxis/urticaria. Shared R1 side chains.'),
('penicillin', 'cephalosporin_3rd', '<0.5%',  'caution', 'Very low cross-reactivity. Use with caution if reaction was anaphylaxis; generally safe otherwise.'),
('penicillin', 'carbapenem',        '<1%',    'caution', 'Very low cross-reactivity. Generally considered safe. Use if benefit outweighs risk.'),
('sulfonamide', 'sulfonamide',      '100%',   'block',   'Co-trimoxazole contains a sulfonamide. Same class — absolute contraindication.'),
('ace_inhibitor', 'ace_inhibitor',  '100%',   'block',   'All ACE inhibitors cross-react for angioedema. Absolute class contraindication.'),
('ace_inhibitor', 'arb',            '0%',     'safe',    'ARBs are SAFE in ACE inhibitor intolerance. Mechanism is different — no bradykinin effect.'),
('nsaid', 'nsaid',                  'variable','avoid',  'Avoid ALL NSAIDs in aspirin-exacerbated respiratory disease or NSAID hypersensitivity. Paracetamol is safe alternative.'),
('aspirin', 'nsaid',                'variable','avoid',  'Cross-reactivity for aspirin-sensitive patients — all NSAIDs inhibit COX-1.')
on conflict do nothing;

-- ── PATIENTS (10) ────────────────────────────────────────────
insert into patients (display_id, name, age, sex, weight_kg, conditions, medications, allergies, labs, vitals, notes) values

(1, 'Patient 1 — Raj M.', 65, 'M', 70,
 ARRAY['T2DM','Hypertension','Dyslipidaemia','CKD stage 3b'],
 '[{"name":"Metformin","dose":"1g","frequency":"BD"},{"name":"Glimepiride","dose":"2mg","frequency":"OD"},{"name":"Telmisartan","dose":"40mg","frequency":"OD"},{"name":"Atorvastatin","dose":"20mg","frequency":"HS"}]',
 '[{"drug_or_class":"Penicillin","reaction":"Anaphylaxis","severity":"ANAPHYLAXIS","year":2023}]',
 '{"cr":2.1,"egfr":31.2,"hba1c":8.4,"k":5.1,"troponin":4.8}',
 '{"hr":110,"bp":"90/60","spo2":94}',
 'DEMO PATIENT — Scenario 2 (Allergy Block). eGFR 31.2 — borderline for Nitrofurantoin and Metformin.'),

(2, 'Patient 2 — Priya S.', 58, 'F', 62,
 ARRAY['Post-surgical','Anaemia'],
 '[{"name":"Enoxaparin","dose":"40mg","frequency":"SC OD"},{"name":"Paracetamol","dose":"1g","frequency":"QDS"},{"name":"Tramadol","dose":"50mg","frequency":"TDS"},{"name":"Pantoprazole","dose":"40mg","frequency":"OD"}]',
 '[]',
 '{"cr":0.9,"egfr":82,"hb":10.2}',
 '{}',
 'NKDA. Note: Tramadol prescribed — watch for serotonergic drug additions.'),

(3, 'Patient 3 — Govind A.', 78, 'M', 75,
 ARRAY['T2DM','Hypertension','Dyslipidaemia','CKD stage 3a','Depression'],
 '[{"name":"Amlodipine","dose":"10mg","frequency":"OD"},{"name":"Telmisartan","dose":"80mg","frequency":"OD"},{"name":"Metformin","dose":"500mg","frequency":"BD"},{"name":"Glimepiride","dose":"1mg","frequency":"OD"},{"name":"Atorvastatin","dose":"40mg","frequency":"HS"},{"name":"Aspirin","dose":"75mg","frequency":"OD"},{"name":"Pantoprazole","dose":"20mg","frequency":"OD"},{"name":"Escitalopram","dose":"10mg","frequency":"OD"},{"name":"Tamsulosin","dose":"0.4mg","frequency":"OD"},{"name":"Paracetamol","dose":"500mg","frequency":"PRN"},{"name":"Diclofenac","dose":"50mg","frequency":"PRN OTC"},{"name":"Calcium+D3","dose":"500mg","frequency":"OD"}]',
 '[{"drug_or_class":"Sulfonamide","reaction":"Rash","severity":"rash"}]',
 '{"cr":1.4,"egfr":48,"k":4.8}',
 '{}',
 'DEMO PATIENT — Scenario 1 (Missed Drug Interaction). 12 medications. OTC Diclofenac = BONUS catch (triple whammy with Telmisartan).'),

(4, 'Patient 4 — Arjun K.', 6, 'M', 20,
 ARRAY['Epilepsy'],
 '[{"name":"Sodium Valproate","dose":"200mg","frequency":"BD"},{"name":"Levetiracetam","dose":"250mg","frequency":"BD"}]',
 '[]',
 '{"valproate_level":85}',
 '{}',
 'Paediatric patient. Weight-based dosing critical.'),

(5, 'Patient 5 — Venkat R.', 62, 'M', 68,
 ARRAY['CKD stage 5','Heart Failure','Anaemia of CKD'],
 '[{"name":"Furosemide","dose":"80mg","frequency":"BD"},{"name":"Carvedilol","dose":"12.5mg","frequency":"BD"},{"name":"Amlodipine","dose":"5mg","frequency":"OD"},{"name":"Calcium","dose":"500mg","frequency":"TDS"}]',
 '[{"drug_or_class":"ace_inhibitor","reaction":"Angioedema","severity":"angioedema"}]',
 '{"cr":4.8,"egfr":12,"k":5.6}',
 '{}',
 'eGFR 12 — severe CKD. ACE inhibitor allergy — ARBs are SAFE (0% cross-reactivity).'),

(6, 'Patient 6 — Meera D.', 28, 'F', 65,
 ARRAY['Pregnancy 32 weeks','Gestational hypertension'],
 '[{"name":"Methyldopa","dose":"250mg","frequency":"TDS"},{"name":"Folic acid","dose":"5mg","frequency":"OD"},{"name":"Iron","dose":"200mg","frequency":"OD"}]',
 '[{"drug_or_class":"Codeine","reaction":"Nausea","severity":"intolerance"}]',
 '{"hb":10.8,"cr":0.6}',
 '{}',
 'Pregnant 32 weeks. Many drugs contraindicated. Use extreme caution.'),

(7, 'Patient 7 — Kavitha L.', 35, 'F', 58,
 ARRAY['Sepsis','AKI','ICU'],
 '[{"name":"Meropenem","dose":"1g","frequency":"IV TDS"},{"name":"Noradrenaline","dose":"variable","frequency":"infusion"},{"name":"Insulin","dose":"variable","frequency":"infusion"},{"name":"Enoxaparin","dose":"40mg","frequency":"SC OD"},{"name":"Pantoprazole","dose":"40mg","frequency":"IV OD"}]',
 '[{"drug_or_class":"Penicillin","reaction":"Rash","severity":"rash","note":"NOT anaphylaxis"}]',
 '{"cr":3.2,"egfr":18,"wbc":22,"lactate":4.8}',
 '{"hr":118,"bp":"85/50","spo2":92,"rr":28,"temp":39.2}',
 'DEMO PATIENT — Scenario 3 (Renal Dosing). eGFR 18 — severe AKI. Penicillin allergy is RASH not anaphylaxis — carbapenems generally safe.'),

(8, 'Patient 8 — Krishnaswamy B.', 68, 'M', 80,
 ARRAY['Atrial Fibrillation','Heart Failure EF 35%','Hypertension','T2DM','Previous TIA 2022'],
 '[{"name":"Warfarin","dose":"5mg","frequency":"OD"},{"name":"Bisoprolol","dose":"5mg","frequency":"OD"},{"name":"Ramipril","dose":"5mg","frequency":"OD"},{"name":"Atorvastatin","dose":"80mg","frequency":"HS"},{"name":"Furosemide","dose":"40mg","frequency":"OD"},{"name":"Spironolactone","dose":"25mg","frequency":"OD"}]',
 '[]',
 '{"inr":2.8,"egfr":62,"k":4.9,"bnp":450}',
 '{}',
 'DEMO PATIENT — Scenario 4 (CHA2DS2-VASc). Score = 6. Also: Spironolactone+Ramipril = hyperkalemia risk watch.'),

(9, 'Patient 9 — Suresh P.', 55, 'M', 72,
 ARRAY['T2DM','Neuropathy','Depression'],
 '[{"name":"Metformin","dose":"1g","frequency":"BD"},{"name":"Empagliflozin","dose":"10mg","frequency":"OD"},{"name":"Insulin Glargine","dose":"24U","frequency":"OD"},{"name":"Pregabalin","dose":"150mg","frequency":"BD"},{"name":"Duloxetine","dose":"60mg","frequency":"OD"},{"name":"Aspirin","dose":"75mg","frequency":"OD"}]',
 '[{"drug_or_class":"Metoclopramide","reaction":"Dystonia","severity":"dystonia"}]',
 '{"cr":1.0,"egfr":72,"hba1c":7.8}',
 '{}',
 'Note: Duloxetine prescribed — Tramadol addition would cause serotonin syndrome.'),

(10, 'Patient 10 — Riya T.', 10, 'F', 35,
 ARRAY['Asthma'],
 '[{"name":"Salbutamol","dose":"2 puffs","frequency":"PRN"},{"name":"Fluticasone","dose":"125mcg","frequency":"BD"},{"name":"Montelukast","dose":"5mg","frequency":"OD"}]',
 '[{"drug_or_class":"Aspirin","reaction":"Bronchospasm","severity":"bronchospasm"}]',
 '{"fev1_pct":78}',
 '{}',
 'Paediatric. Aspirin allergy — ALL NSAIDs risk bronchospasm in aspirin-exacerbated respiratory disease.')

on conflict (display_id) do nothing;

-- Clean up helper function
drop function if exists insert_ddi(text,text,text,text,text,text);
