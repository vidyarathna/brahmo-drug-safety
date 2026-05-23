-- ============================================================
-- BRAHMO Drug Safety Engine — Supabase Schema
-- Run this in Supabase SQL Editor first, then seed.sql
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── 1. DRUGS ────────────────────────────────────────────────
create table if not exists drugs (
  id                      uuid primary key default uuid_generate_v4(),
  generic_name            text not null unique,
  generic_name_normalized text not null,   -- lowercase, no spaces/hyphens
  drug_class              text not null,
  renal_dosing            jsonb not null default '{}',
  created_at              timestamptz default now()
);

create index if not exists idx_drugs_normalized on drugs(generic_name_normalized);
create index if not exists idx_drugs_class      on drugs(drug_class);

-- ── 2. DRUG INTERACTIONS ────────────────────────────────────
create table if not exists drug_interactions (
  id             uuid primary key default uuid_generate_v4(),
  drug_a_id      uuid not null references drugs(id),
  drug_b_id      uuid not null references drugs(id),
  severity       text not null check (severity in ('CONTRAINDICATED','SEVERE','MODERATE','MINOR')),
  mechanism      text not null,
  clinical_effect text not null,
  management     text not null,
  created_at     timestamptz default now(),
  -- always store a_id < b_id so lookups are unique
  constraint unique_pair unique (drug_a_id, drug_b_id),
  constraint no_self_interaction check (drug_a_id <> drug_b_id)
);

create index if not exists idx_ddi_a on drug_interactions(drug_a_id);
create index if not exists idx_ddi_b on drug_interactions(drug_b_id);

-- ── 3. ALLERGY CROSS-REACTIVITY ─────────────────────────────
create table if not exists allergy_cross_reactivity (
  id                   uuid primary key default uuid_generate_v4(),
  allergy_class        text not null,   -- what the patient is allergic to
  cross_reacts_with    text not null,   -- drug_class that may cross-react
  cross_reactivity_pct text not null,   -- e.g. "1-2%", "100%", "<0.5%"
  severity_modifier    text not null default 'caution',  -- block | avoid | caution
  clinical_guidance    text not null,
  created_at           timestamptz default now()
);

create index if not exists idx_acr_allergy on allergy_cross_reactivity(allergy_class);

-- ── 4. PATIENTS (seed data for demo) ────────────────────────
create table if not exists patients (
  id          uuid primary key default uuid_generate_v4(),
  display_id  int  not null unique,   -- 1-10 for easy reference
  name        text not null,
  age         int  not null,
  sex         text not null check (sex in ('M','F')),
  weight_kg   numeric,
  conditions  text[] default '{}',
  medications jsonb not null default '[]',  -- [{name, dose, frequency}]
  allergies   jsonb not null default '[]',  -- [{drug_or_class, reaction, severity}]
  labs        jsonb not null default '{}',  -- {cr, egfr, hba1c, ...}
  vitals      jsonb not null default '{}',
  notes       text,
  created_at  timestamptz default now()
);
