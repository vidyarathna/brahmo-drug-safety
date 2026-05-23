# Data Sources — BRAHMO Drug Safety Engine

All clinical data used in this system is sourced from established, peer-reviewed
medical references. This document provides full provenance for the drug interactions,
allergy cross-reactivity data, and calculator formulas.

---

## Drug-Drug Interactions (30 pairs)

Primary sources:
- **British National Formulary (BNF)** — bnf.nice.org.uk — Appendix 1 (Interactions)
- **Stockley's Drug Interactions** (Pharmaceutical Press, current edition)
- **Micromedex DrugReax** — clinical decision support database
- **FDA Drug Interaction Database** — fda.gov
- **NICE Clinical Guidelines** — nice.org.uk/guidance

Specific interaction references:
- CYP3A4 interactions (Clarithromycin + statins/amlodipine): BNF + Stockley's
- Serotonin syndrome (SSRIs/SNRIs + Tramadol): FDA Drug Safety Communication 2016
- Nephrotoxic "triple whammy" (NSAID + ACEi/ARB + diuretic): Lapi et al., BMJ 2013
- Clopidogrel + Omeprazole: FDA Safety Communication 2010; Bhatt et al., NEJM 2010
- Warfarin + Clarithromycin: BNF + FDA label
- Digoxin + Amiodarone: Package insert; multiple case series

---

## Allergy Cross-Reactivity Data

Primary sources:
- **Joint Task Force on Practice Parameters (JTFPP)**: Drug Allergy Practice Parameter
  — Bernstein et al., Annals of Allergy, Asthma & Immunology, 2010
- **Penicillin-Cephalosporin cross-reactivity**: 
  Macy & Romano (2014), J Allergy Clin Immunol Pract
  Cross-reactivity rate updated from historical 10% (side-chain focused) to 1-2%
- **ACE inhibitor angioedema**: 
  Brown et al., Ann Emerg Med 1997; Kostis et al., Hypertension 2010
- **NSAID hypersensitivity**: 
  Kowalski et al., EAACI Position Paper, Allergy 2013
- **Sulfonamide allergy**: 
  Strom et al., NEJM 2003

---

## Calculator Formulas

### eGFR — CKD-EPI 2021 (Race-free equation)
- **Primary reference**: Inker LA et al., "New Creatinine- and Cystatin C–Based Equations 
  to Estimate GFR without Race." New England Journal of Medicine, 2021;385:1737-1749.
  DOI: 10.1056/NEJMoa2102953
- Implementation verified against NKF/ASN calculator: kidney.org/professionals/kdoqi/gfr_calculator

### CHA₂DS₂-VASc Score
- **Primary reference**: Lip GYH et al., "Refining Clinical Risk Stratification for Predicting 
  Stroke and Thromboembolism in Atrial Fibrillation Using a Novel Risk Factor-Based Approach."
  Chest. 2010;137(2):263-272. DOI: 10.1378/chest.09-1584
- **Stroke risk estimates**: Olesen et al., Thromb Haemost 2011 (Danish nationwide cohort)
- **Treatment thresholds**: ESC Guidelines for the Diagnosis and Management of Atrial 
  Fibrillation 2020, European Heart Journal, 42(5):373-498

---

## Renal Dosing Guidelines

Primary sources:
- **Renal Drug Handbook** (Ashley & Dunleavy, Oxford University Press, 4th ed.)
- **BNF Appendix 3** (Renal Impairment): bnf.nice.org.uk
- **Gabapentin in CKD**: 
  Mula et al., Epilepsia 2012; KDIGO CKD Guidelines 2012
- **Metformin in CKD**:
  EMA/MHRA guidance 2016 — lowered threshold from eGFR 60 to 30 for caution; <30 contraindicated
- **DOAC dosing in CKD**:
  Product Summary of Characteristics (SmPC) for Rivaroxaban (Xarelto) and Apixaban (Eliquis)
- **NSAID avoidance in CKD**:
  KDIGO CKD 2012 Guideline, Chapter 3.3 (eGFR <60: avoid)

---

## Patient Data

All 10 patients are synthetic/fictional — created for this assessment.
No real patient data has been used.
Clinical parameters (eGFR values, medication lists, conditions) are 
constructed to be clinically plausible based on the referenced guidelines above.

---

## Note on Scope

This system contains data for 50 drugs and 30 interaction pairs — a carefully
curated subset of clinically important interactions, not a comprehensive database.
In production, this would be integrated with a full commercial drug interaction
database (Micromedex, Clinical Pharmacology, First DataBank).

The architecture is designed so that the safety engine logic is completely
database-driven — adding interactions and drugs requires only SQL inserts,
not code changes.
