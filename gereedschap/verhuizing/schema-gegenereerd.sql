-- Schema van BennaHub, gegenereerd uit het gedeelde project.
-- Niet met de hand bijwerken: opnieuw genereren is de bedoeling.

set check_function_bodies = off;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema public;
create extension if not exists pg_net with schema public;

-- hulpfunctie voor de updated_at-triggers
CREATE OR REPLACE FUNCTION public.voeding_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

create table if not exists public.nevo_versies (
  versie text not null,
  is_actief boolean default false not null,
  licentie_gecontroleerd boolean default false not null,
  licentie_notitie text,
  licentie_gecontroleerd_op date,
  licentie_gecontroleerd_door text,
  bronvermelding text,
  aantal_items integer,
  geimporteerd_op timestamp with time zone,
  created_at timestamp with time zone default now(),
  constraint nevo_actief_vereist_licentiecheck CHECK (((is_actief = false) OR (licentie_gecontroleerd = true))),
  constraint nevo_licentiecheck_herleidbaar CHECK (((licentie_gecontroleerd = false) OR ((licentie_gecontroleerd_op IS NOT NULL) AND (licentie_gecontroleerd_door IS NOT NULL)))),
  constraint nevo_versies_aantal_items_check CHECK (((aantal_items IS NULL) OR (aantal_items >= 0)))
);
create table if not exists public.nevo_foods (
  id uuid default gen_random_uuid() not null,
  nevo_code text not null,
  nevo_versie text not null,
  naam_nl text not null,
  naam_en text,
  synoniem_nevo text,
  synoniemen_afgeleid text[] default '{}'::text[] not null,
  groep text,
  energie_kcal_per_100g numeric(8,2) not null,
  energie_afgeleid_uit_kj boolean default false not null,
  eiwit_g numeric(8,2),
  vet_g numeric(8,2),
  verzadigd_vet_g numeric(8,2),
  koolhydraten_g numeric(8,2),
  suikers_g numeric(8,2),
  vezels_g numeric(8,2),
  natrium_mg numeric(10,2),
  overige_nutrienten jsonb default '{}'::jsonb not null,
  bronvermelding text,
  geimporteerd_op timestamp with time zone default now(),
  constraint nevo_foods_eiwit_g_check CHECK (((eiwit_g IS NULL) OR (eiwit_g >= (0)::numeric))),
  constraint nevo_foods_energie_kcal_per_100g_check CHECK ((energie_kcal_per_100g >= (0)::numeric)),
  constraint nevo_foods_koolhydraten_g_check CHECK (((koolhydraten_g IS NULL) OR (koolhydraten_g >= (0)::numeric))),
  constraint nevo_foods_natrium_mg_check CHECK (((natrium_mg IS NULL) OR (natrium_mg >= (0)::numeric))),
  constraint nevo_foods_suikers_g_check CHECK (((suikers_g IS NULL) OR (suikers_g >= (0)::numeric))),
  constraint nevo_foods_verzadigd_vet_g_check CHECK (((verzadigd_vet_g IS NULL) OR (verzadigd_vet_g >= (0)::numeric))),
  constraint nevo_foods_vet_g_check CHECK (((vet_g IS NULL) OR (vet_g >= (0)::numeric))),
  constraint nevo_foods_vezels_g_check CHECK (((vezels_g IS NULL) OR (vezels_g >= (0)::numeric)))
);
create table if not exists public.voeding_portiematen (
  id uuid default gen_random_uuid() not null,
  nevo_code text,
  nevo_groep text,
  naam text not null,
  gram_schatting numeric not null,
  gram_laag numeric not null,
  gram_hoog numeric not null,
  is_standaard boolean default false not null,
  volgorde integer default 0 not null,
  herkomst text default 'gebruikelijk'::text not null,
  gecontroleerd_door_dietist boolean default false not null,
  created_at timestamp with time zone default now(),
  meervoud text,
  gecontroleerd_door uuid,
  gecontroleerd_op timestamp with time zone,
  constraint portiemaat_band CHECK (((gram_laag <= gram_schatting) AND (gram_schatting <= gram_hoog))),
  constraint portiemaat_controle_heeft_afzender CHECK (((gecontroleerd_door_dietist = false) OR ((gecontroleerd_door IS NOT NULL) AND (gecontroleerd_op IS NOT NULL)))),
  constraint portiemaat_reikwijdte CHECK (((nevo_code IS NOT NULL) <> (nevo_groep IS NOT NULL))),
  constraint voeding_portiematen_gram_laag_check CHECK ((gram_laag > (0)::numeric)),
  constraint voeding_portiematen_gram_schatting_check CHECK ((gram_schatting > (0)::numeric)),
  constraint voeding_portiematen_herkomst_check CHECK ((herkomst = ANY (ARRAY['gebruikelijk'::text, 'nevo_maten'::text, 'dietist'::text])))
);
create table if not exists public.cultural_dishes (
  id uuid default gen_random_uuid() not null,
  slug text,
  name_nl text not null,
  names jsonb default '{}'::jsonb not null,
  cuisine text not null,
  region text,
  region_note text,
  description_nl text,
  meal_moments text[] default '{}'::text[],
  default_servings numeric(5,2) default 4 not null,
  owner_patient_id uuid,
  derived_from_dish_id uuid,
  validation_status text default 'concept'::text not null,
  reviewed_by_clinician_id uuid,
  reviewer_name text,
  reviewer_big_number text,
  reviewed_at timestamp with time zone,
  review_note text,
  validation_reference text,
  created_by uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint cultural_dishes_cuisine_check CHECK ((cuisine = ANY (ARRAY['marokkaans'::text, 'turks'::text, 'syrisch'::text, 'surinaams'::text, 'nederlands'::text, 'overig'::text]))),
  constraint cultural_dishes_default_servings_check CHECK ((default_servings > (0)::numeric)),
  constraint cultural_dishes_validation_status_check CHECK ((validation_status = ANY (ARRAY['concept'::text, 'in_review'::text, 'validated'::text, 'rejected'::text]))),
  constraint dish_personal_not_validated CHECK (((owner_patient_id IS NULL) OR (validation_status <> 'validated'::text))),
  constraint dish_validated_needs_reviewer CHECK (((validation_status <> 'validated'::text) OR (reviewed_by_clinician_id IS NOT NULL) OR ((reviewer_name IS NOT NULL) AND (reviewed_at IS NOT NULL))))
);
create table if not exists public.dish_ingredients (
  id uuid default gen_random_uuid() not null,
  dish_id uuid not null,
  "position" integer default 0 not null,
  ingredient_name_nl text not null,
  ingredient_name_local text,
  category text not null,
  quantity numeric(10,3) not null,
  unit text not null,
  grams_equivalent numeric(10,3),
  external_source text default 'unmapped'::text not null,
  external_food_id text,
  external_serving_id text,
  role text default 'ingredient'::text not null,
  is_preparation_fat boolean default false not null,
  fat_type text,
  absorbed_fraction numeric(4,3),
  is_optional boolean default false not null,
  substitution_group text,
  uncertainty_note text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  mapping_status text default 'ai_voorstel'::text not null,
  mapping_beoordeeld_door text,
  mapping_beoordeeld_op date,
  mapping_big_nummer text,
  mapping_opmerking text,
  constraint dish_ingredients_absorbed_fraction_check CHECK (((absorbed_fraction IS NULL) OR ((absorbed_fraction >= (0)::numeric) AND (absorbed_fraction <= (1)::numeric)))),
  constraint dish_ingredients_afkeuring_met_reden CHECK (((mapping_status <> 'afgekeurd'::text) OR (mapping_opmerking IS NOT NULL))),
  constraint dish_ingredients_beoordeling_herleidbaar CHECK (((mapping_status = 'ai_voorstel'::text) OR ((mapping_beoordeeld_door IS NOT NULL) AND (mapping_beoordeeld_op IS NOT NULL)))),
  constraint dish_ingredients_category_check CHECK ((category = ANY (ARRAY['groente'::text, 'fruit'::text, 'vlees'::text, 'vis'::text, 'ei'::text, 'zuivel'::text, 'graan'::text, 'peulvrucht'::text, 'noten'::text, 'vet'::text, 'kruiden'::text, 'suiker'::text, 'saus'::text, 'overig'::text]))),
  constraint dish_ingredients_external_source_check CHECK ((external_source = ANY (ARRAY['fatsecret'::text, 'nevo'::text, 'unmapped'::text]))),
  constraint dish_ingredients_fat_type_check CHECK (((fat_type IS NULL) OR (fat_type = ANY (ARRAY['olijfolie'::text, 'zonnebloemolie'::text, 'arganolie'::text, 'roomboter'::text, 'ghee'::text, 'smen'::text, 'reuzel'::text, 'margarine'::text, 'kokosolie'::text, 'overig'::text])))),
  constraint dish_ingredients_grams_equivalent_check CHECK (((grams_equivalent IS NULL) OR (grams_equivalent >= (0)::numeric))),
  constraint dish_ingredients_mapping_status_check CHECK ((mapping_status = ANY (ARRAY['ai_voorstel'::text, 'bevestigd'::text, 'aangepast'::text, 'afgekeurd'::text]))),
  constraint dish_ingredients_quantity_check CHECK ((quantity > (0)::numeric)),
  constraint dish_ingredients_role_check CHECK ((role = ANY (ARRAY['ingredient'::text, 'preparation_fat'::text, 'garnish'::text, 'serving_side'::text]))),
  constraint dish_ingredients_unit_check CHECK ((unit = ANY (ARRAY['g'::text, 'ml'::text, 'stuk'::text, 'eetlepel'::text, 'theelepel'::text, 'kop'::text, 'snuf'::text, 'bos'::text, 'teen'::text, 'blik'::text, 'handvol'::text]))),
  constraint ingredient_fat_needs_detail CHECK (((is_preparation_fat = false) OR ((fat_type IS NOT NULL) AND (absorbed_fraction IS NOT NULL)))),
  constraint ingredient_fat_role_consistent CHECK (((role = 'preparation_fat'::text) = is_preparation_fat)),
  constraint ingredient_mapping_consistent CHECK (((external_food_id IS NULL) OR (external_source <> 'unmapped'::text)))
);
create table if not exists public.dish_portions (
  id uuid default gen_random_uuid() not null,
  dish_id uuid not null,
  label_nl text not null,
  household_measure text not null,
  icon text,
  grams_estimate numeric(10,2) not null,
  grams_low numeric(10,2) not null,
  grams_high numeric(10,2) not null,
  measurement_basis text default 'estimated'::text not null,
  is_default boolean default false not null,
  sort_order integer default 0 not null,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint dish_portions_grams_estimate_check CHECK ((grams_estimate > (0)::numeric)),
  constraint dish_portions_grams_high_check CHECK ((grams_high > (0)::numeric)),
  constraint dish_portions_grams_low_check CHECK ((grams_low > (0)::numeric)),
  constraint dish_portions_household_measure_check CHECK ((household_measure = ANY (ARRAY['schaal'::text, 'bord'::text, 'kom'::text, 'opscheplepel'::text, 'eetlepel'::text, 'stuk'::text, 'handvol'::text, 'glas'::text, 'kop'::text, 'pan'::text, 'punt'::text]))),
  constraint dish_portions_measurement_basis_check CHECK ((measurement_basis = ANY (ARRAY['weighed'::text, 'estimated'::text, 'literature'::text]))),
  constraint portion_band_ordered CHECK (((grams_low <= grams_estimate) AND (grams_estimate <= grams_high)))
);
create table if not exists public.kal_gebruikers (
  id uuid default gen_random_uuid() not null,
  account text not null,
  ww_hash text not null,
  weergavenaam text,
  created_at timestamp with time zone default now() not null
);
create table if not exists public.kal_sessies (
  token text not null,
  gebruiker_id uuid not null,
  verloopt_op timestamp with time zone not null,
  created_at timestamp with time zone default now() not null
);
create table if not exists public.kal_profiel (
  gebruiker_id uuid not null,
  lengte_cm numeric not null,
  geboortedatum date,
  leeftijd_jaar integer,
  geslacht text default 'm'::text not null,
  start_gewicht_kg numeric,
  doel_gewicht_kg numeric,
  tempo_pct_week numeric default 0.7 not null,
  eiwit_g_per_kg numeric default 1.4 not null,
  etniciteit text,
  fase text default 'afvallen'::text not null,
  onderhoud_basis_kg numeric,
  instellingen jsonb default '{}'::jsonb not null,
  updated_at timestamp with time zone default now() not null,
  constraint kal_profiel_fase_check CHECK ((fase = ANY (ARRAY['afvallen'::text, 'onderhoud'::text, 'pauze'::text]))),
  constraint kal_profiel_geslacht_check CHECK ((geslacht = ANY (ARRAY['m'::text, 'v'::text])))
);
create table if not exists public.kal_dagen (
  gebruiker_id uuid not null,
  datum date not null,
  gewicht_kg numeric,
  gewicht_bron text,
  stappen integer,
  actieve_energie_kcal integer,
  fiets_min integer default 0,
  slaap_min integer,
  slaap_kwaliteit smallint,
  bedtijd time without time zone,
  waaktijd time without time zone,
  kracht boolean default false not null,
  notitie text,
  bron text default 'app'::text not null,
  updated_at timestamp with time zone default now() not null,
  constraint kal_dagen_slaap_kwaliteit_check CHECK (((slaap_kwaliteit >= 1) AND (slaap_kwaliteit <= 5)))
);
create table if not exists public.kal_regels (
  id uuid default gen_random_uuid() not null,
  gebruiker_id uuid not null,
  datum date not null,
  moment text,
  naam text not null,
  hoeveelheid numeric,
  eenheid text,
  gram_equivalent numeric,
  kcal_punt numeric not null,
  kcal_laag numeric,
  kcal_hoog numeric,
  eiwit_g numeric,
  vet_g numeric,
  koolhydraat_g numeric,
  vezel_g numeric,
  conf text default 'D'::text not null,
  onzekerheidsbronnen text[],
  bron text default 'handmatig'::text not null,
  nevo_code text,
  dish_id uuid,
  recept_id uuid,
  foto_pad text,
  ruwe_invoer text,
  ai_model text,
  created_at timestamp with time zone default now() not null,
  constraint kal_regels_bron_check CHECK ((bron = ANY (ARRAY['handmatig'::text, 'recept'::text, 'bibliotheek'::text, 'tekst-ai'::text, 'foto-ai'::text, 'import'::text, 'nevo'::text]))),
  constraint kal_regels_conf_check CHECK ((conf = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'D'::text]))),
  constraint kal_regels_moment_check CHECK ((moment = ANY (ARRAY['ontbijt'::text, 'lunch'::text, 'diner'::text, 'tussendoor'::text, 'onbekend'::text])))
);
create table if not exists public.kal_producten (
  id uuid default gen_random_uuid() not null,
  gebruiker_id uuid not null,
  naam text not null,
  per numeric default 100 not null,
  eenheid text default 'g'::text not null,
  kcal numeric not null,
  eiwit_g numeric default 0,
  vet_g numeric default 0,
  koolhydraat_g numeric default 0,
  vezel_g numeric default 0,
  conf text default 'A'::text not null,
  tag text,
  nevo_code text,
  created_at timestamp with time zone default now() not null
);
create table if not exists public.kal_recepten (
  id uuid default gen_random_uuid() not null,
  gebruiker_id uuid not null,
  naam text not null,
  toelichting text,
  porties numeric default 1 not null,
  dish_id uuid,
  volgt_profiel boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  favoriet boolean default false not null
);
create table if not exists public.kal_recept_regels (
  id uuid default gen_random_uuid() not null,
  recept_id uuid not null,
  positie integer default 0 not null,
  naam text not null,
  hoeveelheid numeric,
  eenheid text default 'g'::text,
  conf text default 'C'::text not null,
  nevo_code text,
  gram_equivalent numeric,
  kcal_punt numeric not null,
  kcal_laag numeric,
  kcal_hoog numeric,
  eiwit_g numeric,
  vet_g numeric,
  koolhydraat_g numeric,
  vezel_g numeric,
  onzekerheidsbronnen text[],
  bron text default 'handmatig'::text not null
);
create table if not exists public.kal_metingen (
  id uuid default gen_random_uuid() not null,
  gebruiker_id uuid not null,
  datum date not null,
  soort text not null,
  waarde numeric not null,
  eenheid text,
  notitie text,
  created_at timestamp with time zone default now() not null
);
create table if not exists public.kal_labs (
  id uuid default gen_random_uuid() not null,
  gebruiker_id uuid not null,
  datum date not null,
  code text not null,
  naam text,
  waarde numeric,
  eenheid text,
  ref_laag numeric,
  ref_hoog numeric,
  notitie text,
  created_at timestamp with time zone default now() not null
);
create table if not exists public.kal_vragenlijsten (
  id uuid default gen_random_uuid() not null,
  gebruiker_id uuid not null,
  datum date not null,
  soort text not null,
  antwoorden jsonb default '{}'::jsonb not null,
  score numeric,
  klasse text,
  created_at timestamp with time zone default now() not null
);
create table if not exists public.kal_training (
  id uuid default gen_random_uuid() not null,
  gebruiker_id uuid not null,
  datum date not null,
  oefening text not null,
  spiergroep text,
  sets integer,
  reps integer,
  gewicht_kg numeric,
  rpe numeric,
  notitie text,
  created_at timestamp with time zone default now() not null
);
create table if not exists public.kal_ai_log (
  id uuid default gen_random_uuid() not null,
  gebruiker_id uuid,
  soort text not null,
  model text,
  invoer_tekens integer,
  input_tokens integer,
  output_tokens integer,
  kosten_usd numeric,
  gelukt boolean,
  fout text,
  created_at timestamp with time zone default now() not null
);
create table if not exists public.kal_config (
  sleutel text not null,
  waarde text not null,
  toelichting text,
  updated_at timestamp with time zone default now() not null
);
create table if not exists public.kal_prikkel_log (
  id uuid default gen_random_uuid() not null,
  gebruiker_id uuid,
  datum date not null,
  soort text not null,
  onderwerp text,
  verstuurd boolean default false not null,
  fout text,
  created_at timestamp with time zone default now() not null
);
create table if not exists public.kal_koppelingen (
  id uuid default extensions.gen_random_uuid() not null,
  gebruiker_id uuid not null,
  naam text not null,
  sleutel_hash text not null,
  sleutel_begin text not null,
  aangemaakt_op timestamp with time zone default now() not null,
  laatst_gebruikt_op timestamp with time zone,
  aantal_berichten integer default 0 not null,
  aantal_dagen integer default 0 not null,
  actief boolean default true not null
);
create table if not exists public.kal_beweging_peilingen (
  id uuid default gen_random_uuid() not null,
  gebruiker_id uuid not null,
  datum date not null,
  minuut integer not null,
  op timestamp with time zone default now() not null,
  stappen integer,
  actieve_energie_kcal integer,
  constraint kal_beweging_peilingen_minuut_check CHECK (((minuut >= 0) AND (minuut <= 1439)))
);
create table if not exists public.kal_modelstand (
  gebruiker_id uuid not null,
  doel_kcal numeric,
  eiwit_doel_g numeric,
  tdee_laag numeric,
  tdee_hoog numeric,
  zekerheid text,
  berekend_op timestamp with time zone default now() not null
);
create table if not exists public.bennahub_gezin (
  gezin text not null,
  wachtwoord_hash text not null,
  data jsonb default '{}'::jsonb not null,
  aangemaakt timestamp with time zone default now() not null
);
create table if not exists public.bennahub_leden (
  gezin text not null,
  naam text not null,
  rol text default 'kind'::text not null,
  code_hash text,
  emoji text default '🙂'::text not null,
  kleur text default 'huiswerk'::text not null,
  volgorde integer default 0 not null,
  apps jsonb default '[]'::jsonb not null,
  actief boolean default true not null,
  laatst_actief timestamp with time zone,
  aangemaakt timestamp with time zone default now() not null,
  foto text,
  geboren integer,
  constraint bennahub_leden_rol_check CHECK ((rol = ANY (ARRAY['ouder'::text, 'kind'::text])))
);
create table if not exists public.bennahub_state (
  app text not null,
  account text not null,
  pin_hash text not null,
  data jsonb default '{}'::jsonb not null,
  updated_at timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null
);
create table if not exists public.oefenapp_state (
  household text not null,
  pin_hash text not null,
  data jsonb default '{}'::jsonb not null,
  updated_at timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null
);
create table if not exists public.oefenapp_challenges (
  code text not null,
  data jsonb not null,
  friend jsonb,
  created_at timestamp with time zone default now() not null
);

alter table public.bennahub_gezin add constraint bennahub_gezin_pkey PRIMARY KEY (gezin);
alter table public.bennahub_leden add constraint bennahub_leden_pkey PRIMARY KEY (gezin, naam);
alter table public.bennahub_state add constraint bennahub_state_pkey PRIMARY KEY (app, account);
alter table public.cultural_dishes add constraint cultural_dishes_pkey PRIMARY KEY (id);
alter table public.cultural_dishes add constraint cultural_dishes_slug_key UNIQUE (slug);
alter table public.dish_ingredients add constraint dish_ingredients_pkey PRIMARY KEY (id);
alter table public.dish_portions add constraint dish_portions_pkey PRIMARY KEY (id);
alter table public.kal_ai_log add constraint kal_ai_log_pkey PRIMARY KEY (id);
alter table public.kal_beweging_peilingen add constraint kal_beweging_peilingen_pkey PRIMARY KEY (id);
alter table public.kal_config add constraint kal_config_pkey PRIMARY KEY (sleutel);
alter table public.kal_dagen add constraint kal_dagen_pkey PRIMARY KEY (gebruiker_id, datum);
alter table public.kal_gebruikers add constraint kal_gebruikers_pkey PRIMARY KEY (id);
alter table public.kal_gebruikers add constraint kal_gebruikers_account_key UNIQUE (account);
alter table public.kal_koppelingen add constraint kal_koppelingen_pkey PRIMARY KEY (id);
alter table public.kal_koppelingen add constraint kal_koppelingen_sleutel_hash_key UNIQUE (sleutel_hash);
alter table public.kal_labs add constraint kal_labs_pkey PRIMARY KEY (id);
alter table public.kal_metingen add constraint kal_metingen_pkey PRIMARY KEY (id);
alter table public.kal_modelstand add constraint kal_modelstand_pkey PRIMARY KEY (gebruiker_id);
alter table public.kal_prikkel_log add constraint kal_prikkel_log_pkey PRIMARY KEY (id);
alter table public.kal_producten add constraint kal_producten_pkey PRIMARY KEY (id);
alter table public.kal_profiel add constraint kal_profiel_pkey PRIMARY KEY (gebruiker_id);
alter table public.kal_recept_regels add constraint kal_recept_regels_pkey PRIMARY KEY (id);
alter table public.kal_recepten add constraint kal_recepten_pkey PRIMARY KEY (id);
alter table public.kal_regels add constraint kal_regels_pkey PRIMARY KEY (id);
alter table public.kal_sessies add constraint kal_sessies_pkey PRIMARY KEY (token);
alter table public.kal_training add constraint kal_training_pkey PRIMARY KEY (id);
alter table public.kal_vragenlijsten add constraint kal_vragenlijsten_pkey PRIMARY KEY (id);
alter table public.nevo_foods add constraint nevo_foods_pkey PRIMARY KEY (id);
alter table public.nevo_foods add constraint nevo_foods_nevo_code_nevo_versie_key UNIQUE (nevo_code, nevo_versie);
alter table public.nevo_versies add constraint nevo_versies_pkey PRIMARY KEY (versie);
alter table public.oefenapp_challenges add constraint oefenapp_challenges_pkey PRIMARY KEY (code);
alter table public.oefenapp_state add constraint oefenapp_state_pkey PRIMARY KEY (household);
alter table public.voeding_portiematen add constraint voeding_portiematen_pkey PRIMARY KEY (id);

alter table public.cultural_dishes add constraint cultural_dishes_derived_from_dish_id_fkey FOREIGN KEY (derived_from_dish_id) REFERENCES cultural_dishes(id) ON DELETE SET NULL;
alter table public.dish_ingredients add constraint dish_ingredients_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES cultural_dishes(id) ON DELETE CASCADE;
alter table public.dish_portions add constraint dish_portions_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES cultural_dishes(id) ON DELETE CASCADE;
alter table public.kal_ai_log add constraint kal_ai_log_gebruiker_id_fkey FOREIGN KEY (gebruiker_id) REFERENCES kal_gebruikers(id) ON DELETE SET NULL;
alter table public.kal_beweging_peilingen add constraint kal_beweging_peilingen_gebruiker_id_fkey FOREIGN KEY (gebruiker_id) REFERENCES kal_gebruikers(id) ON DELETE CASCADE;
alter table public.kal_dagen add constraint kal_dagen_gebruiker_id_fkey FOREIGN KEY (gebruiker_id) REFERENCES kal_gebruikers(id) ON DELETE CASCADE;
alter table public.kal_koppelingen add constraint kal_koppelingen_gebruiker_id_fkey FOREIGN KEY (gebruiker_id) REFERENCES kal_gebruikers(id) ON DELETE CASCADE;
alter table public.kal_labs add constraint kal_labs_gebruiker_id_fkey FOREIGN KEY (gebruiker_id) REFERENCES kal_gebruikers(id) ON DELETE CASCADE;
alter table public.kal_metingen add constraint kal_metingen_gebruiker_id_fkey FOREIGN KEY (gebruiker_id) REFERENCES kal_gebruikers(id) ON DELETE CASCADE;
alter table public.kal_modelstand add constraint kal_modelstand_gebruiker_id_fkey FOREIGN KEY (gebruiker_id) REFERENCES kal_gebruikers(id) ON DELETE CASCADE;
alter table public.kal_prikkel_log add constraint kal_prikkel_log_gebruiker_id_fkey FOREIGN KEY (gebruiker_id) REFERENCES kal_gebruikers(id) ON DELETE CASCADE;
alter table public.kal_producten add constraint kal_producten_gebruiker_id_fkey FOREIGN KEY (gebruiker_id) REFERENCES kal_gebruikers(id) ON DELETE CASCADE;
alter table public.kal_profiel add constraint kal_profiel_gebruiker_id_fkey FOREIGN KEY (gebruiker_id) REFERENCES kal_gebruikers(id) ON DELETE CASCADE;
alter table public.kal_recept_regels add constraint kal_recept_regels_recept_id_fkey FOREIGN KEY (recept_id) REFERENCES kal_recepten(id) ON DELETE CASCADE;
alter table public.kal_recepten add constraint kal_recepten_gebruiker_id_fkey FOREIGN KEY (gebruiker_id) REFERENCES kal_gebruikers(id) ON DELETE CASCADE;
alter table public.kal_regels add constraint kal_regels_gebruiker_id_fkey FOREIGN KEY (gebruiker_id) REFERENCES kal_gebruikers(id) ON DELETE CASCADE;
alter table public.kal_sessies add constraint kal_sessies_gebruiker_id_fkey FOREIGN KEY (gebruiker_id) REFERENCES kal_gebruikers(id) ON DELETE CASCADE;
alter table public.kal_training add constraint kal_training_gebruiker_id_fkey FOREIGN KEY (gebruiker_id) REFERENCES kal_gebruikers(id) ON DELETE CASCADE;
alter table public.kal_vragenlijsten add constraint kal_vragenlijsten_gebruiker_id_fkey FOREIGN KEY (gebruiker_id) REFERENCES kal_gebruikers(id) ON DELETE CASCADE;
alter table public.nevo_foods add constraint nevo_foods_nevo_versie_fkey FOREIGN KEY (nevo_versie) REFERENCES nevo_versies(versie) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_dishes_cuisine ON public.cultural_dishes USING btree (cuisine);
CREATE INDEX IF NOT EXISTS idx_dishes_derived ON public.cultural_dishes USING btree (derived_from_dish_id);
CREATE INDEX IF NOT EXISTS idx_dishes_names_gin ON public.cultural_dishes USING gin (names jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_dishes_owner ON public.cultural_dishes USING btree (owner_patient_id);
CREATE INDEX IF NOT EXISTS idx_dishes_status ON public.cultural_dishes USING btree (validation_status);
CREATE INDEX IF NOT EXISTS idx_dish_ingredients_dish ON public.dish_ingredients USING btree (dish_id, "position");
CREATE INDEX IF NOT EXISTS idx_dish_ingredients_external ON public.dish_ingredients USING btree (external_source, external_food_id);
CREATE INDEX IF NOT EXISTS idx_dish_ingredients_fat ON public.dish_ingredients USING btree (dish_id) WHERE is_preparation_fat;
CREATE INDEX IF NOT EXISTS idx_dish_portions_dish ON public.dish_portions USING btree (dish_id, sort_order);
CREATE UNIQUE INDEX idx_dish_portions_one_default ON public.dish_portions USING btree (dish_id) WHERE is_default;
CREATE INDEX IF NOT EXISTS kal_peilingen_zoek ON public.kal_beweging_peilingen USING btree (gebruiker_id, datum, minuut);
CREATE INDEX IF NOT EXISTS kal_koppelingen_gebruiker ON public.kal_koppelingen USING btree (gebruiker_id);
CREATE INDEX IF NOT EXISTS kal_labs_code ON public.kal_labs USING btree (gebruiker_id, code, datum);
CREATE INDEX IF NOT EXISTS kal_metingen_soort ON public.kal_metingen USING btree (gebruiker_id, soort, datum);
CREATE UNIQUE INDEX kal_prikkel_uniek ON public.kal_prikkel_log USING btree (gebruiker_id, datum, soort);
CREATE INDEX IF NOT EXISTS kal_regels_dag ON public.kal_regels USING btree (gebruiker_id, datum);
CREATE INDEX IF NOT EXISTS kal_sessies_gebruiker ON public.kal_sessies USING btree (gebruiker_id);
CREATE INDEX IF NOT EXISTS kal_training_dag ON public.kal_training USING btree (gebruiker_id, datum);
CREATE INDEX IF NOT EXISTS idx_nevo_foods_groep ON public.nevo_foods USING btree (groep);
CREATE INDEX IF NOT EXISTS idx_nevo_foods_naam_trgm ON public.nevo_foods USING gin (naam_nl gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_nevo_foods_synoniemen ON public.nevo_foods USING gin (synoniemen_afgeleid);
CREATE INDEX IF NOT EXISTS idx_nevo_foods_versie ON public.nevo_foods USING btree (nevo_versie);
CREATE UNIQUE INDEX idx_nevo_een_actieve_versie ON public.nevo_versies USING btree (is_actief) WHERE is_actief;
CREATE UNIQUE INDEX voeding_portiematen_code_uniek ON public.voeding_portiematen USING btree (nevo_code, naam) WHERE (nevo_groep IS NULL);
CREATE UNIQUE INDEX voeding_portiematen_groep_uniek ON public.voeding_portiematen USING btree (nevo_groep, naam) WHERE (nevo_code IS NULL);

create or replace view public.nevo_actief as  SELECT f.nevo_code,
    f.nevo_versie,
    f.naam_nl,
    f.synoniem_nevo,
    f.synoniemen_afgeleid,
    f.groep,
    f.energie_kcal_per_100g,
    f.energie_afgeleid_uit_kj,
    f.eiwit_g,
    f.vet_g,
    f.verzadigd_vet_g,
    f.koolhydraten_g,
    f.suikers_g,
    f.vezels_g,
    f.natrium_mg,
    f.bronvermelding,
    v.bronvermelding AS versie_bronvermelding,
    f.naam_en
   FROM nevo_foods f
     JOIN nevo_versies v ON v.versie = f.nevo_versie
  WHERE v.is_actief AND v.licentie_gecontroleerd;

CREATE TRIGGER trg_dishes_updated_at BEFORE UPDATE ON public.cultural_dishes FOR EACH ROW EXECUTE FUNCTION voeding_set_updated_at();
CREATE TRIGGER trg_dish_ingredients_updated_at BEFORE UPDATE ON public.dish_ingredients FOR EACH ROW EXECUTE FUNCTION voeding_set_updated_at();
CREATE TRIGGER trg_dish_portions_updated_at BEFORE UPDATE ON public.dish_portions FOR EACH ROW EXECUTE FUNCTION voeding_set_updated_at();

CREATE OR REPLACE FUNCTION public.bennahub_accounts(p_app text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare a text := lower(trim(p_app));
begin
  return coalesce((select json_agg(json_build_object('account',account,'updated_at',updated_at) order by account)
                   from public.bennahub_state where app=a), '[]'::json);
end $function$
;

CREATE OR REPLACE FUNCTION public.bennahub_fotos(p_gezin text, p_naam text, p_code text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare g text := lower(trim(p_gezin)); n text := lower(trim(p_naam)); r public.bennahub_leden;
begin
  select * into r from public.bennahub_leden where gezin = g and naam = n;
  if not found or r.code_hash is null or r.code_hash <> extensions.crypt(p_code, r.code_hash) then
    if not public.bh_ouder_ok(g, p_code) then
      return json_build_object('error','Niet aangemeld.');
    end if;
  end if;
  return json_build_object('ok', true, 'fotos', coalesce((
    select json_object_agg(naam, foto) from public.bennahub_leden
     where gezin = g and foto is not null), '{}'::json));
end $function$
;

CREATE OR REPLACE FUNCTION public.bennahub_gezin_start(p_gezin text, p_wachtwoord text, p_leden jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare g text := lower(trim(p_gezin)); h text; lid jsonb; i int := 0;
begin
  if length(g) < 2 then return json_build_object('error','Gezinsnaam is te kort.'); end if;
  if length(p_wachtwoord) < 6 then return json_build_object('error','Het ouderwachtwoord moet minstens 6 tekens zijn.'); end if;
  if exists(select 1 from public.bennahub_gezin where gezin = g) then
    return json_build_object('error','Dit gezin bestaat al. Meld je aan met het ouderwachtwoord.');
  end if;
  h := extensions.crypt(p_wachtwoord, extensions.gen_salt('bf'));
  insert into public.bennahub_gezin(gezin, wachtwoord_hash) values (g, h);
  for lid in select * from jsonb_array_elements(coalesce(p_leden,'[]'::jsonb)) loop
    i := i + 1;
    insert into public.bennahub_leden(gezin, naam, rol, code_hash, emoji, kleur, volgorde, apps)
    values (g,
            lower(trim(lid->>'naam')),
            coalesce(lid->>'rol','kind'),
            case when coalesce(lid->>'rol','kind') = 'ouder' then h else null end,
            coalesce(lid->>'emoji','🙂'),
            coalesce(lid->>'kleur','huiswerk'),
            i,
            coalesce(lid->'apps','[]'::jsonb))
    on conflict do nothing;
  end loop;
  return json_build_object('ok', true, 'gezin', g);
end $function$
;

CREATE OR REPLACE FUNCTION public.bennahub_gezin_wachtwoord(p_gezin text, p_oud text, p_nieuw text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare g text := lower(trim(p_gezin));
begin
  if not public.bh_ouder_ok(g, p_oud) then return json_build_object('error','Het huidige wachtwoord klopt niet.'); end if;
  if length(coalesce(p_nieuw,'')) < 6 then return json_build_object('error','Het nieuwe wachtwoord moet minstens 6 tekens zijn.'); end if;
  update public.bennahub_gezin set wachtwoord_hash = extensions.crypt(p_nieuw, extensions.gen_salt('bf')) where gezin = g;
  return json_build_object('ok',true);
end $function$
;

CREATE OR REPLACE FUNCTION public.bennahub_leden_lijst(p_gezin text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  return coalesce((
    select json_agg(json_build_object(
             'naam', naam, 'rol', rol, 'emoji', emoji, 'kleur', kleur,
             'apps', apps, 'actief', actief, 'geboren', geboren,
             'heeftCode', code_hash is not null,
             'heeftFoto', foto is not null,
             'laatstActief', laatst_actief) order by volgorde, naam)
    from public.bennahub_leden where gezin = lower(trim(p_gezin)) and actief), '[]'::json);
end $function$
;

CREATE OR REPLACE FUNCTION public.bennahub_lid_aanmelden(p_gezin text, p_naam text, p_code text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare g text := lower(trim(p_gezin)); n text := lower(trim(p_naam)); r public.bennahub_leden;
begin
  select * into r from public.bennahub_leden where gezin = g and naam = n;
  if not found then return json_build_object('error','Die naam staat niet in dit gezin.'); end if;
  if not r.actief then return json_build_object('error','Dit account staat uit. Vraag het aan papa of mama.'); end if;

  if r.code_hash is null then
    if length(coalesce(p_code,'')) < 4 then
      return json_build_object('error','Kies een wachtwoord van minstens 4 tekens.','nieuw',true);
    end if;
    update public.bennahub_leden
       set code_hash = extensions.crypt(p_code, extensions.gen_salt('bf')), laatst_actief = now()
     where gezin = g and naam = n;
    return json_build_object('ok',true,'naam',r.naam,'rol',r.rol,'emoji',r.emoji,
                             'kleur',r.kleur,'apps',r.apps,'geboren',r.geboren,'gekozen',true);
  end if;

  if r.code_hash <> extensions.crypt(p_code, r.code_hash) then
    return json_build_object('error','Dat wachtwoord klopt niet.');
  end if;
  update public.bennahub_leden set laatst_actief = now() where gezin = g and naam = n;
  return json_build_object('ok',true,'naam',r.naam,'rol',r.rol,'emoji',r.emoji,
                           'kleur',r.kleur,'apps',r.apps,'geboren',r.geboren);
end $function$
;

CREATE OR REPLACE FUNCTION public.bennahub_lid_code(p_gezin text, p_naam text, p_oud text, p_nieuw text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare g text := lower(trim(p_gezin)); n text := lower(trim(p_naam)); r public.bennahub_leden;
begin
  if length(coalesce(p_nieuw,'')) < 4 then return json_build_object('error','Het nieuwe wachtwoord moet minstens 4 tekens zijn.'); end if;
  select * into r from public.bennahub_leden where gezin = g and naam = n;
  if not found then return json_build_object('error','Die naam staat niet in dit gezin.'); end if;
  if r.code_hash is not null and r.code_hash <> extensions.crypt(p_oud, r.code_hash) then
    return json_build_object('error','Je huidige wachtwoord klopt niet.');
  end if;
  update public.bennahub_leden set code_hash = extensions.crypt(p_nieuw, extensions.gen_salt('bf'))
   where gezin = g and naam = n;
  return json_build_object('ok',true);
end $function$
;

CREATE OR REPLACE FUNCTION public.bennahub_lid_foto(p_gezin text, p_naam text, p_code text, p_foto text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare g text := lower(trim(p_gezin)); n text := lower(trim(p_naam)); r public.bennahub_leden; mag boolean := false;
begin
  select * into r from public.bennahub_leden where gezin = g and naam = n;
  if not found then return json_build_object('error','Die naam staat niet in dit gezin.'); end if;
  if r.code_hash is not null and r.code_hash = extensions.crypt(p_code, r.code_hash) then mag := true; end if;
  if not mag and public.bh_ouder_ok(g, p_code) then mag := true; end if;
  if not mag then return json_build_object('error','Wachtwoord klopt niet.'); end if;

  -- Een ruime maar echte grens. De startpagina verkleint al naar 256 pixels;
  -- dit vangt af dat er ooit langs een andere weg een hele cameraopname in gaat
  -- en elke aanmelding daarna traag wordt.
  if p_foto is not null and length(p_foto) > 400000 then
    return json_build_object('error','Die foto is te groot.');
  end if;
  if p_foto is not null and p_foto <> '' and p_foto not like 'data:image/%' then
    return json_build_object('error','Dat is geen afbeelding.');
  end if;

  update public.bennahub_leden
     set foto = nullif(p_foto, '')
   where gezin = g and naam = n;
  return json_build_object('ok', true, 'foto', nullif(p_foto,''));
end $function$
;

CREATE OR REPLACE FUNCTION public.bennahub_lid_geboren(p_gezin text, p_ouder_ww text, p_naam text, p_jaar integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare g text := lower(trim(p_gezin));
begin
  if not public.bh_ouder_ok(g, p_ouder_ww) then return json_build_object('error','Ouderwachtwoord klopt niet.'); end if;
  if p_jaar is not null and (p_jaar < 1900 or p_jaar > extract(year from now())::int) then
    return json_build_object('error','Dat jaartal kan niet kloppen.');
  end if;
  update public.bennahub_leden set geboren = p_jaar where gezin = g and naam = lower(trim(p_naam));
  if not found then return json_build_object('error','Die naam staat niet in dit gezin.'); end if;
  return json_build_object('ok',true);
end $function$
;

CREATE OR REPLACE FUNCTION public.bennahub_lid_reset(p_gezin text, p_ouder_ww text, p_naam text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare g text := lower(trim(p_gezin));
begin
  if not public.bh_ouder_ok(g, p_ouder_ww) then return json_build_object('error','Ouderwachtwoord klopt niet.'); end if;
  update public.bennahub_leden set code_hash = null where gezin = g and naam = lower(trim(p_naam));
  if not found then return json_build_object('error','Die naam staat niet in dit gezin.'); end if;
  return json_build_object('ok',true);
end $function$
;

CREATE OR REPLACE FUNCTION public.bennahub_lid_zet(p_gezin text, p_ouder_ww text, p_naam text, p_rol text, p_emoji text, p_kleur text, p_apps jsonb, p_actief boolean, p_volgorde integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare g text := lower(trim(p_gezin)); n text := lower(trim(p_naam));
begin
  if not public.bh_ouder_ok(g, p_ouder_ww) then return json_build_object('error','Ouderwachtwoord klopt niet.'); end if;
  if length(n) < 2 then return json_build_object('error','Naam is te kort.'); end if;
  insert into public.bennahub_leden(gezin, naam, rol, emoji, kleur, apps, actief, volgorde)
  values (g, n, coalesce(p_rol,'kind'), coalesce(p_emoji,'🙂'), coalesce(p_kleur,'huiswerk'),
          coalesce(p_apps,'[]'::jsonb), coalesce(p_actief,true), coalesce(p_volgorde,0))
  on conflict (gezin, naam) do update
    set rol = excluded.rol, emoji = excluded.emoji, kleur = excluded.kleur,
        apps = excluded.apps, actief = excluded.actief, volgorde = excluded.volgorde;
  return json_build_object('ok',true);
end $function$
;

CREATE OR REPLACE FUNCTION public.bennahub_load(p_app text, p_account text, p_pin text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare r public.bennahub_state; a text := lower(trim(p_app)); c text := lower(trim(p_account));
begin
  select * into r from public.bennahub_state where app=a and account=c;
  if not found then return json_build_object('error','Account niet gevonden.'); end if;
  if r.pin_hash <> extensions.crypt(p_pin, r.pin_hash) then return json_build_object('error','Onjuist wachtwoord.'); end if;
  return json_build_object('ok',true,'data',r.data,'updated_at',r.updated_at);
end $function$
;

CREATE OR REPLACE FUNCTION public.bennahub_overzicht(p_gezin text, p_ouder_ww text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare g text := lower(trim(p_gezin));
begin
  if not public.bh_ouder_ok(g, p_ouder_ww) then return json_build_object('error','Ouderwachtwoord klopt niet.'); end if;
  return json_build_object(
    'ok', true,
    'leden', public.bennahub_leden_lijst(g),
    'apps', coalesce((select json_agg(json_build_object(
                        'app', app, 'account', account, 'data', data, 'updatedAt', updated_at)
                      order by app)
                      from public.bennahub_state), '[]'::json));
end $function$
;

CREATE OR REPLACE FUNCTION public.bennahub_register(p_app text, p_account text, p_pin text, p_data jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare a text := lower(trim(p_app)); c text := lower(trim(p_account));
begin
  if a not in ('sanad','lisan','bidaya','rasikh','bunyan','raha') then
    return json_build_object('error','Onbekende app.');
  end if;
  if length(c) < 2 then return json_build_object('error','Naam is te kort.'); end if;
  if length(p_pin) < 4 then return json_build_object('error','Wachtwoord moet minstens 4 tekens zijn.'); end if;
  if exists(select 1 from public.bennahub_state where app=a and account=c) then
    return json_build_object('error','Dit account bestaat al. Log in met je wachtwoord.');
  end if;
  insert into public.bennahub_state(app, account, pin_hash, data)
    values (a, c, extensions.crypt(p_pin, extensions.gen_salt('bf')), coalesce(p_data,'{}'::jsonb));
  return json_build_object('ok',true,'created',true);
end $function$
;

CREATE OR REPLACE FUNCTION public.bennahub_save(p_app text, p_account text, p_pin text, p_data jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare r public.bennahub_state; a text := lower(trim(p_app)); c text := lower(trim(p_account)); u timestamptz;
begin
  select * into r from public.bennahub_state where app=a and account=c;
  if not found then return json_build_object('error','Account niet gevonden.'); end if;
  if r.pin_hash <> extensions.crypt(p_pin, r.pin_hash) then return json_build_object('error','Onjuist wachtwoord.'); end if;
  update public.bennahub_state set data=coalesce(p_data,'{}'::jsonb), updated_at=now()
    where app=a and account=c returning updated_at into u;
  return json_build_object('ok',true,'updated_at',u);
end $function$
;

CREATE OR REPLACE FUNCTION public.bennahub_wachtwoord(p_app text, p_account text, p_oud text, p_nieuw text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare r public.bennahub_state; a text := lower(trim(p_app)); c text := lower(trim(p_account));
begin
  if length(coalesce(p_nieuw,'')) < 4 then return json_build_object('error','Het nieuwe wachtwoord moet minstens 4 tekens zijn.'); end if;
  select * into r from public.bennahub_state where app=a and account=c;
  if not found then return json_build_object('error','Account niet gevonden.'); end if;
  if r.pin_hash <> extensions.crypt(p_oud, r.pin_hash) then return json_build_object('error','Het huidige wachtwoord klopt niet.'); end if;
  update public.bennahub_state set pin_hash = extensions.crypt(p_nieuw, extensions.gen_salt('bf')) where app=a and account=c;
  return json_build_object('ok',true);
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_aanmelden(p_account text, p_ww text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_id uuid; v_token text;
begin
  select id into v_id from kal_gebruikers
   where account = lower(trim(p_account)) and ww_hash = crypt(p_ww, ww_hash);
  if v_id is null then raise exception 'Onbekend account of verkeerd wachtwoord'; end if;
  delete from kal_sessies where verloopt_op < now();
  v_token := encode(gen_random_bytes(32), 'hex');
  insert into kal_sessies(token, gebruiker_id, verloopt_op)
  values (v_token, v_id, now() + interval '30 days');
  return jsonb_build_object('token', v_token, 'account', lower(trim(p_account)));
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_afmelden(p_token text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin delete from kal_sessies where token = p_token; end $function$
;

CREATE OR REPLACE FUNCTION public.kal_beweging_dag(p_sleutel text, p_datum text DEFAULT NULL::text, p_stappen text DEFAULT NULL::text, p_slaap_min text DEFAULT NULL::text, p_slaap_uur text DEFAULT NULL::text, p_slaap_sec text DEFAULT NULL::text, p_actieve_energie_kcal text DEFAULT NULL::text, p_fiets_min text DEFAULT NULL::text, p_gewicht_kg text DEFAULT NULL::text, p_gewicht_bron text DEFAULT NULL::text, p_dagen_terug text DEFAULT NULL::text, p_hartslag_rust text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_datum     date;
  v_vandaag   date := (now() at time zone 'Europe/Amsterdam')::date;
  v_terug     numeric := kal_getal(p_dagen_terug);
  v_stappen   numeric := kal_getal(p_stappen);
  v_energie   numeric := kal_getal(p_actieve_energie_kcal);
  v_fiets     numeric := kal_getal(p_fiets_min);
  v_gewicht   numeric := kal_getal(p_gewicht_kg);
  v_pols      numeric := kal_getal(p_hartslag_rust);
  v_slaap     numeric;
  v_genegeerd boolean := false;
  v_leeg      text[]  := '{}';
  v_nul       text[]  := '{}';
  v_peiling   boolean := false;
  v_polsuit   text    := 'niet meegestuurd';
  v_id        uuid;
  v_dag       jsonb;
  v_uit       jsonb;
begin
  v_datum := coalesce(
    nullif(trim(coalesce(p_datum, '')), '')::date,
    v_vandaag - v_terug::integer,
    v_vandaag - 1);

  v_slaap := coalesce(kal_getal(p_slaap_min),
                      kal_getal(p_slaap_uur) * 60,
                      kal_getal(p_slaap_sec) / 60);
  if v_slaap is not null and (v_slaap < 0 or v_slaap > 1440) then
    v_slaap := null;
    v_genegeerd := true;
  end if;

  if nullif(trim(coalesce(p_stappen,'')),'')              is not null and v_stappen is null then v_leeg := array_append(v_leeg, 'stappen'); end if;
  if nullif(trim(coalesce(p_actieve_energie_kcal,'')),'') is not null and v_energie is null then v_leeg := array_append(v_leeg, 'actieve_energie_kcal'); end if;
  if nullif(trim(coalesce(p_fiets_min,'')),'')            is not null and v_fiets   is null then v_leeg := array_append(v_leeg, 'fiets_min'); end if;
  if nullif(trim(coalesce(p_gewicht_kg,'')),'')           is not null and v_gewicht is null then v_leeg := array_append(v_leeg, 'gewicht_kg'); end if;
  if nullif(trim(coalesce(p_hartslag_rust,'')),'')        is not null and v_pols    is null then v_leeg := array_append(v_leeg, 'hartslag_rust'); end if;

  if v_stappen = 0 then v_stappen := null; v_nul := array_append(v_nul, 'stappen'); end if;
  if v_energie = 0 then v_energie := null; v_nul := array_append(v_nul, 'actieve_energie_kcal'); end if;
  if v_fiets   = 0 then v_fiets   := null; v_nul := array_append(v_nul, 'fiets_min'); end if;
  if v_slaap   = 0 then v_slaap   := null; v_nul := array_append(v_nul, 'slaap'); end if;
  if v_gewicht = 0 then v_gewicht := null; v_nul := array_append(v_nul, 'gewicht_kg'); end if;

  v_dag := jsonb_build_object('datum', v_datum);
  if v_stappen is not null then v_dag := v_dag || jsonb_build_object('stappen', v_stappen); end if;
  if v_slaap   is not null then v_dag := v_dag || jsonb_build_object('slaap_min', v_slaap); end if;
  if v_energie is not null then v_dag := v_dag || jsonb_build_object('actieve_energie_kcal', v_energie); end if;
  if v_fiets   is not null then v_dag := v_dag || jsonb_build_object('fiets_min', v_fiets); end if;
  if v_gewicht is not null then v_dag := v_dag || jsonb_build_object('gewicht_kg', v_gewicht); end if;
  if nullif(trim(coalesce(p_gewicht_bron,'')),'') is not null then
    v_dag := v_dag || jsonb_build_object('gewicht_bron', trim(p_gewicht_bron));
  end if;

  v_uit := kal_beweging_ontvangen(p_sleutel, jsonb_build_array(v_dag));

  select k.gebruiker_id into v_id from kal_koppelingen k
   where k.sleutel_hash = encode(digest(p_sleutel, 'sha256'), 'hex') and k.actief;

  v_peiling := kal_peiling_vastleggen(v_id, v_datum, v_stappen, v_energie);

  if v_pols is not null then
    if v_pols < 25 or v_pols > 150 then
      v_polsuit := 'onmogelijk, genegeerd';
    else
      if exists (select 1 from kal_metingen m
                  where m.gebruiker_id = v_id and m.datum = v_datum
                    and m.soort = 'hartslag_rust'
                    and m.notitie is distinct from 'koppeling') then
        v_polsuit := 'die van jou blijft staan';
      else
        update kal_metingen set waarde = v_pols, eenheid = '/min'
         where gebruiker_id = v_id and datum = v_datum
           and soort = 'hartslag_rust' and notitie = 'koppeling';
        if not found then
          insert into kal_metingen(gebruiker_id, datum, soort, waarde, eenheid, notitie)
          values (v_id, v_datum, 'hartslag_rust', v_pols, '/min', 'koppeling');
        end if;
        v_polsuit := 'opgeslagen';
      end if;
    end if;
  end if;

  return v_uit
      || jsonb_build_object('datum', v_datum)
      || jsonb_build_object('slaap_genegeerd', v_genegeerd)
      || jsonb_build_object('hartslag_rust', v_polsuit)
      || jsonb_build_object('niet_gelezen', to_jsonb(v_leeg))
      || jsonb_build_object('nul_overgeslagen', to_jsonb(v_nul))
      || jsonb_build_object('peiling', v_peiling);
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_beweging_gewoonte(p_gebruiker uuid, p_minuut integer, p_dagen integer DEFAULT 60)
 RETURNS TABLE(mediaan integer, n integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  with eerder as (
    select datum, max(stappen) as stand
      from kal_beweging_peilingen
     where gebruiker_id = p_gebruiker
       and datum < (now() at time zone 'Europe/Amsterdam')::date
       and datum >= (now() at time zone 'Europe/Amsterdam')::date - p_dagen
       and minuut between p_minuut - 40 and p_minuut + 40
       and stappen is not null
     group by datum
  )
  select percentile_cont(0.5) within group (order by stand)::integer, count(*)::integer
    from eerder;
$function$
;

CREATE OR REPLACE FUNCTION public.kal_beweging_ontvangen(p_sleutel text, p_dagen jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_id       uuid;
  v_kop      uuid;
  v_rij      jsonb;
  v_datum    date;
  v_vandaag  date := (now() at time zone 'Europe/Amsterdam')::date;
  v_n        integer := 0;
  v_over     integer := 0;   -- wegingen die bleven staan
  v_buiten   integer := 0;   -- dagen buiten het toegestane bereik
  v_oud_kg   numeric;
begin
  if p_sleutel is null or p_sleutel = '' then
    raise exception 'Geen sleutel meegegeven';
  end if;

  select k.gebruiker_id, k.id into v_id, v_kop
    from kal_koppelingen k
   where k.sleutel_hash = encode(digest(p_sleutel, 'sha256'), 'hex')
     and k.actief;
  if v_id is null then
    raise exception 'Onbekende of ingetrokken koppelsleutel';
  end if;

  if jsonb_typeof(p_dagen) <> 'array' then
    raise exception 'p_dagen moet een lijst zijn';
  end if;
  if jsonb_array_length(p_dagen) > 400 then
    raise exception 'Hooguit 400 dagen per bericht';
  end if;

  for v_rij in select * from jsonb_array_elements(p_dagen) loop
    v_datum := nullif(v_rij->>'datum', '')::date;

    /* Een dag in de toekomst of van vóór 2015 is geen meting maar een fout in
       de opdracht op de telefoon. Overslaan en tellen, niet stilzwijgend
       wegschrijven. */
    if v_datum is null or v_datum > v_vandaag or v_datum < date '2015-01-01' then
      v_buiten := v_buiten + 1;
      continue;
    end if;

    v_oud_kg := null;
    select d.gewicht_kg into v_oud_kg from kal_dagen d
     where d.gebruiker_id = v_id and d.datum = v_datum;

    insert into kal_dagen(gebruiker_id, datum, bron)
    values (v_id, v_datum, 'koppeling')
    on conflict (gebruiker_id, datum) do nothing;

    /* Het toestel wint voor de metingen. `coalesce(nieuw, oud)` en niet
       andersom: een veld dat niet meegestuurd wordt laat de bestaande waarde
       met rust, een veld dat wél meekomt vervangt hem. */
    update kal_dagen d set
      stappen              = coalesce(round(nullif(v_rij->>'stappen','')::numeric)::integer,
                                      d.stappen),
      actieve_energie_kcal = coalesce(
                               round(nullif(v_rij->>'actieve_energie_kcal','')::numeric)::integer,
                               d.actieve_energie_kcal),
      slaap_min            = coalesce(round(nullif(v_rij->>'slaap_min','')::numeric)::integer,
                                      d.slaap_min),
      fiets_min            = coalesce(round(nullif(v_rij->>'fiets_min','')::numeric)::integer,
                                      d.fiets_min),
      bedtijd              = coalesce(nullif(v_rij->>'bedtijd','')::time, d.bedtijd),
      waaktijd             = coalesce(nullif(v_rij->>'waaktijd','')::time, d.waaktijd),
      /* Het gewicht andersom: alleen invullen als er nog niets staat. */
      gewicht_kg           = coalesce(d.gewicht_kg, nullif(v_rij->>'gewicht_kg','')::numeric),
      gewicht_bron         = case
                               when d.gewicht_kg is null
                                and nullif(v_rij->>'gewicht_kg','') is not null
                               then coalesce(nullif(v_rij->>'gewicht_bron',''), 'koppeling')
                               else d.gewicht_bron
                             end,
      updated_at           = now()
     where d.gebruiker_id = v_id and d.datum = v_datum;

    /* Er stond al een gewicht en er kwam er een mee: die van jou blijft staan.
       Dat hoort in het antwoord, anders lijkt het alsof er niets gebeurde. */
    if v_oud_kg is not null and nullif(v_rij->>'gewicht_kg','') is not null then
      v_over := v_over + 1;
    end if;

    v_n := v_n + 1;
  end loop;

  update kal_koppelingen
     set laatst_gebruikt_op = now(),
         aantal_berichten   = aantal_berichten + 1,
         aantal_dagen       = aantal_dagen + v_n
   where id = v_kop;

  return jsonb_build_object(
    'dagen', v_n,
    'gewicht_behouden', v_over,
    'overgeslagen', v_buiten);
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_coach_bouwen(p_soort text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_aan text; v_mail text; v_url text;
  v_g record; v_s jsonb; v_v jsonb;
  v_vandaag date := (now() at time zone 'Europe/Amsterdam')::date;
  v_uur integer := extract(hour from now() at time zone 'Europe/Amsterdam')::integer;
  v_ond text; v_tekst text; v_lijst text; v_uit jsonb := '[]'::jsonb;
  v_melden boolean; v_reden text;
begin
  select waarde into v_aan  from kal_config where sleutel = 'prikkel_aan';
  select waarde into v_mail from kal_config where sleutel = 'prikkel_email';
  select waarde into v_url  from kal_config where sleutel = 'app_url';
  if coalesce(v_aan, 'ja') <> 'ja' or v_mail is null then return v_uit; end if;

  for v_g in select g.id from kal_gebruikers g join kal_profiel p on p.gebruiker_id = g.id loop

    if exists (select 1 from kal_prikkel_log
                where gebruiker_id = v_g.id and datum = v_vandaag and soort = p_soort) then
      continue;
    end if;

    v_s := kal_coach_stand(v_g.id);
    if not (v_s->>'bruikbaar')::boolean then continue; end if;

    v_melden := false;
    if (v_s->>'erover')::boolean then
      v_melden := false;
    elsif v_uur < 17 and (v_s->>'kcal_over')::numeric between 1 and 349 then
      v_melden := true; v_reden := 'bijna-op';
    elsif (v_s->>'eiwit_over')::numeric >= 15 and (v_s->>'kcal_over')::numeric >= 150 then
      v_melden := true; v_reden := 'eiwit-achter';
    elsif v_uur >= 17 and (v_s->>'kcal_over')::numeric > 700 then
      v_melden := true; v_reden := 'ruimte-over';
    end if;
    if not v_melden then continue; end if;

    v_lijst := '';
    for v_v in select * from jsonb_array_elements(v_s->'voorstellen') loop
      v_lijst := v_lijst || '<li style="margin:0 0 6px">' || (v_v->>'naam')
        || ' — ' || (v_v->>'kcal') || ' kcal, ' || (v_v->>'eiwit') || ' g eiwit ('
        || replace(round((v_v->>'dichtheid')::numeric * 100, 1)::text, '.', ',')
        || ' g per 100 kcal)</li>';
    end loop;

    if v_reden = 'bijna-op' then
      v_ond := 'BennaHealth — je ruimte is bijna op';
      v_tekst := 'Er is nog ' || (v_s->>'kcal_over') || ' kcal over en het is pas ' || v_uur
        || ' uur. Niet dramatisch, wel het weten waard: de rest van de dag moet daarin passen.';
    elsif v_reden = 'ruimte-over' then
      v_ond := 'BennaHealth — er is nog veel ruimte';
      v_tekst := 'Er staat nog ' || (v_s->>'kcal_over') || ' kcal open. Structureel onder je doel '
        || 'eten ondermijnt het model net zo goed als eroverheen gaan: de weegreeks gaat dan dalen '
        || 'om een reden die niet in de logboeken staat.';
    else
      v_ond := 'BennaHealth — je eiwit loopt achter';
      v_tekst := 'Nog ' || (v_s->>'eiwit_over') || ' g eiwit te gaan in ' || (v_s->>'kcal_over')
        || ' kcal. Dat vraagt ' || replace((v_s->>'eis_per_100'), '.', ',')
        || ' g eiwit per 100 kcal in alles wat er nog bij komt.';
    end if;

    v_uit := v_uit || jsonb_build_object(
      'gebruiker_id', v_g.id, 'soort', p_soort, 'to', v_mail, 'subject', v_ond,
      'reden', v_reden,
      'vraag_model', jsonb_array_length(v_s->'voorstellen') = 0,
      'stand', v_s,
      'tekst', v_tekst,
      'html', '<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:15px;'
        || 'line-height:1.6;color:#28352F;max-width:520px">'
        || '<p style="font-size:20px;font-weight:600;margin:0 0 12px;color:#07785C">BennaHealth</p>'
        || '<p style="margin:0 0 14px">' || v_tekst || '</p>'
        || case when v_lijst = '' then ''
                else '<p style="margin:0 0 6px;font-size:13px;color:#5B6862">Dit at je eerder en '
                     || 'het past nog:</p><ul style="margin:0 0 14px;padding-left:18px;font-size:14px">'
                     || v_lijst || '</ul>' end
        || case when coalesce(trim(v_url), '') = '' then ''
                else '<p style="margin:0"><a href="' || v_url
                     || '" style="color:#07785C">Openen</a></p>' end
        || '</div>');
  end loop;
  return v_uit;
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_coach_stand(p_gebruiker uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_vandaag   date := (now() at time zone 'Europe/Amsterdam')::date;
  v_m         record;
  v_d         record;
  v_over      numeric;
  v_eiwit_over numeric;
  v_eis       numeric;
  v_voorstellen jsonb;
begin
  select * into v_m from kal_modelstand where gebruiker_id = p_gebruiker;

  if v_m.gebruiker_id is null or v_m.doel_kcal is null
     or v_m.berekend_op < now() - interval '48 hours' then
    return jsonb_build_object('bruikbaar', false, 'reden', 'geen verse modelstand');
  end if;

  select coalesce(sum(kcal_punt), 0) as kcal,
         coalesce(sum(kcal_laag), 0)  as laag,
         coalesce(sum(kcal_hoog), 0)  as hoog,
         coalesce(sum(eiwit_g), 0)    as eiwit
    into v_d
    from kal_regels where gebruiker_id = p_gebruiker and datum = v_vandaag;

  v_over       := v_m.doel_kcal - v_d.kcal;
  v_eiwit_over := greatest(0, coalesce(v_m.eiwit_doel_g, 0) - v_d.eiwit);
  v_eis        := case when v_eiwit_over > 0 and v_over > 0 then v_eiwit_over / v_over end;

  with laatste as (
    select distinct on (lower(btrim(regexp_replace(naam, '\s+', ' ', 'g'))))
           lower(btrim(regexp_replace(naam, '\s+', ' ', 'g'))) as sleutel,
           naam, kcal_punt, eiwit_g, datum
      from kal_regels
     where gebruiker_id = p_gebruiker
       and datum between v_vandaag - 60 and v_vandaag - 1
       and kcal_punt > 0
       and bron <> 'import'
     order by 1, datum desc
  ), geteld as (
    select l.*, (select count(*) from kal_regels r
                  where r.gebruiker_id = p_gebruiker
                    and lower(btrim(regexp_replace(r.naam, '\s+', ' ', 'g'))) = l.sleutel
                    and r.datum between v_vandaag - 60 and v_vandaag - 1
                    and r.bron <> 'import') as aantal
      from laatste l
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'naam', naam, 'kcal', round(kcal_punt), 'eiwit', round(eiwit_g),
           'dichtheid', round(eiwit_g / kcal_punt, 4), 'aantal', aantal,
           'haalt_eis', v_eis is not null and eiwit_g / kcal_punt >= v_eis
         ) order by (v_eis is not null and eiwit_g / kcal_punt >= v_eis) desc,
                    eiwit_g / kcal_punt desc), '[]'::jsonb)
    into v_voorstellen
    from (select * from geteld
           where v_over > 0 and kcal_punt <= v_over and aantal >= 2
           order by (v_eis is not null and eiwit_g / kcal_punt >= v_eis) desc,
                    eiwit_g / kcal_punt desc
           limit 3) t;

  return jsonb_build_object(
    'bruikbaar', true,
    'datum', v_vandaag,
    'gelogd', round(v_d.kcal),
    'doel', round(v_m.doel_kcal),
    'kcal_over', round(v_over),
    'kcal_over_laag', round(v_m.doel_kcal - v_d.hoog),
    'kcal_over_hoog', round(v_m.doel_kcal - v_d.laag),
    'eiwit_gelogd', round(v_d.eiwit),
    'eiwit_doel', round(coalesce(v_m.eiwit_doel_g, 0)),
    'eiwit_over', round(v_eiwit_over),
    'eis_per_100', case when v_eis is not null then round(v_eis * 100, 1) end,
    'erover', v_over < 0,
    'voorstellen', v_voorstellen);
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_dag_zetten(p_token text, p_datum date, p_patch jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
  v_id := kal_sessie(p_token);
  insert into kal_dagen(gebruiker_id, datum) values (v_id, p_datum)
  on conflict (gebruiker_id, datum) do nothing;
  update kal_dagen set
    gewicht_kg           = case when p_patch ? 'gewicht_kg' then nullif(p_patch->>'gewicht_kg','')::numeric else gewicht_kg end,
    gewicht_bron         = coalesce(p_patch->>'gewicht_bron', gewicht_bron),
    stappen              = case when p_patch ? 'stappen' then nullif(p_patch->>'stappen','')::integer else stappen end,
    actieve_energie_kcal = case when p_patch ? 'actieve_energie_kcal' then nullif(p_patch->>'actieve_energie_kcal','')::integer else actieve_energie_kcal end,
    fiets_min            = case when p_patch ? 'fiets_min' then coalesce(nullif(p_patch->>'fiets_min','')::integer,0) else fiets_min end,
    slaap_min            = case when p_patch ? 'slaap_min' then nullif(p_patch->>'slaap_min','')::integer else slaap_min end,
    slaap_kwaliteit      = case when p_patch ? 'slaap_kwaliteit' then nullif(p_patch->>'slaap_kwaliteit','')::smallint else slaap_kwaliteit end,
    bedtijd              = case when p_patch ? 'bedtijd' then nullif(p_patch->>'bedtijd','')::time else bedtijd end,
    waaktijd             = case when p_patch ? 'waaktijd' then nullif(p_patch->>'waaktijd','')::time else waaktijd end,
    kracht               = case when p_patch ? 'kracht' then (p_patch->>'kracht')::boolean else kracht end,
    notitie              = case when p_patch ? 'notitie' then p_patch->>'notitie' else notitie end,
    bron                 = coalesce(p_patch->>'bron', bron),
    updated_at           = now()
  where gebruiker_id = v_id and datum = p_datum;
  return (select to_jsonb(d) from kal_dagen d where d.gebruiker_id = v_id and d.datum = p_datum);
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_dagen_importeren(p_token text, p_dagen jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid; v_rij jsonb; v_n integer := 0;
begin
  v_id := kal_sessie(p_token);
  for v_rij in select * from jsonb_array_elements(p_dagen) loop
    insert into kal_dagen(gebruiker_id, datum, gewicht_kg, stappen, actieve_energie_kcal, bron)
    values (v_id, (v_rij->>'datum')::date,
            nullif(v_rij->>'gewicht_kg','')::numeric,
            nullif(v_rij->>'stappen','')::integer,
            nullif(v_rij->>'actieve_energie_kcal','')::integer,
            coalesce(v_rij->>'bron','import'))
    on conflict (gebruiker_id, datum) do update set
      gewicht_kg           = coalesce(excluded.gewicht_kg, kal_dagen.gewicht_kg),
      stappen              = coalesce(excluded.stappen, kal_dagen.stappen),
      actieve_energie_kcal = coalesce(excluded.actieve_energie_kcal, kal_dagen.actieve_energie_kcal),
      updated_at           = now();
    v_n := v_n + 1;
  end loop;
  return v_n;
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_dagstand(p_gebruiker uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_vandaag date := (now() at time zone 'Europe/Amsterdam')::date;
  v_start   date := v_vandaag - 27;
  v_gewogen boolean;
  v_wegingen integer;
  v_bruikbaar integer;
  v_laatste date;
  v_gaten integer;
  v_gewicht numeric;
begin
  select exists(select 1 from kal_dagen
                 where gebruiker_id = p_gebruiker and datum = v_vandaag and gewicht_kg is not null)
    into v_gewogen;

  select count(*) into v_wegingen from kal_dagen
   where gebruiker_id = p_gebruiker and datum between v_start and v_vandaag and gewicht_kg is not null;

  select max(datum), max(gewicht_kg) filter (where datum = (select max(datum) from kal_dagen d2
        where d2.gebruiker_id = p_gebruiker and d2.gewicht_kg is not null))
    into v_laatste, v_gewicht
    from kal_dagen where gebruiker_id = p_gebruiker and gewicht_kg is not null;

  -- Bruikbare registratiedagen: boven 1.200 kcal en niet de lopende dag.
  select count(*) into v_bruikbaar from (
    select datum, sum(kcal_punt) as kcal from kal_regels
     where gebruiker_id = p_gebruiker and datum between v_start and v_vandaag - 1
     group by datum having sum(kcal_punt) >= 1200) t;

  -- Gaten in de afgelopen zeven dagen, de lopende dag niet meegeteld.
  select count(*) into v_gaten from generate_series(v_vandaag - 7, v_vandaag - 1, '1 day') g(d)
   where not exists (select 1 from kal_regels r
                      where r.gebruiker_id = p_gebruiker and r.datum = g.d);

  return jsonb_build_object(
    'datum', v_vandaag,
    'gewogen_vandaag', v_gewogen,
    'wegingen_28', v_wegingen,
    'bruikbare_dagen_28', v_bruikbaar,
    'laatste_weging', v_laatste,
    'laatste_gewicht', v_gewicht,
    'dagen_zonder_weging', case when v_laatste is null then null else v_vandaag - v_laatste end,
    'gaten_7', v_gaten,
    'model_klaar', (v_wegingen >= 7 and v_bruikbaar >= 7),
    'wegingen_te_gaan', greatest(0, 7 - v_wegingen),
    'dagen_te_gaan', greatest(0, 7 - v_bruikbaar)
  );
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_gerecht(p_token text, p_dish_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_gebruiker uuid;
  v_naam      text;
  v_uit       jsonb;
begin
  v_gebruiker := kal_sessie(p_token);

  -- Persoonlijke varianten van een patiënt horen hier niet; die filtert
  -- kal_zoeken al weg en dat mag deze ingang niet omzeilen.
  select name_nl into v_naam
    from cultural_dishes
   where id = p_dish_id and owner_patient_id is null;
  if v_naam is null then
    raise exception 'Dit gerecht staat niet in de bibliotheek';
  end if;

  with regel as (
    select i.position, i.ingredient_name_nl, i.category,
           i.is_optional, i.is_preparation_fat, i.fat_type, i.absorbed_fraction,
           i.mapping_status, i.uncertainty_note,
           (i.external_source = 'nevo' and n.nevo_code is not null) as gekoppeld,
           n.naam_nl as nevo_naam,
           -- Het gewicht dat werkelijk in het gerecht belandt.
           coalesce(i.grams_equivalent, 0)
             * case when i.is_preparation_fat
                    then coalesce(i.absorbed_fraction, 1) else 1 end as gram,
           coalesce(n.energie_kcal_per_100g, 0) as kcal100,
           coalesce(n.eiwit_g, 0)               as eiwit100,
           coalesce(n.vet_g, 0)                 as vet100,
           coalesce(n.koolhydraten_g, 0)        as koolh100,
           coalesce(n.vezels_g, 0)              as vezel100
      from dish_ingredients i
      -- nevo_actief en niet nevo_foods: de licentiepoort. Het blijft een LEFT
      -- JOIN, dus valt de licentie weg dan verdwijnt niet het gerecht maar de
      -- voedingswaarde erachter: nul kcal en 'ongekoppeld' in beeld. Zichtbaar
      -- kapot is beter dan stilletjes verkeerd.
      left join nevo_actief n
        on n.nevo_code = i.external_food_id and i.external_source = 'nevo'
     where i.dish_id = p_dish_id
  ),
  som as (
    select
      -- het gerecht zoals het minimaal is
      coalesce(sum(gram)              filter (where not is_optional), 0) as gram_z,
      coalesce(sum(gram/100*kcal100)  filter (where not is_optional), 0) as kcal_z,
      coalesce(sum(gram/100*eiwit100) filter (where not is_optional), 0) as eiwit_z,
      coalesce(sum(gram/100*vet100)   filter (where not is_optional), 0) as vet_z,
      coalesce(sum(gram/100*koolh100) filter (where not is_optional), 0) as koolh_z,
      coalesce(sum(gram/100*vezel100) filter (where not is_optional), 0) as vezel_z,
      -- en met alles wat erin kán
      nullif(coalesce(sum(gram), 0), 0)   as gram_m,
      coalesce(sum(gram/100*kcal100), 0)  as kcal_m,
      coalesce(sum(gram/100*eiwit100), 0) as eiwit_m,
      coalesce(sum(gram/100*vet100), 0)   as vet_m,
      coalesce(sum(gram/100*koolh100), 0) as koolh_m,
      coalesce(sum(gram/100*vezel100), 0) as vezel_m,
      -- wat er over de kwaliteit van dít gerecht te zeggen valt
      count(*)                                            as n_ingredienten,
      count(*) filter (where mapping_status = 'bevestigd') as n_bevestigd,
      count(*) filter (where not gekoppeld)               as n_ongekoppeld,
      count(*) filter (where is_optional)                 as n_optioneel,
      coalesce(sum(gram) filter (where is_preparation_fat), 0) as vet_gram,
      (select string_agg(distinct fat_type, ', ')
         from regel where is_preparation_fat and fat_type is not null) as vet_soort,
      (select string_agg(ingredient_name_nl, ', ' order by position)
         from regel where not gekoppeld) as ongekoppeld_namen,
      (select string_agg(lower(ingredient_name_nl), ', ' order by position)
         from regel where is_optional) as optioneel_namen
    from regel
  )
  select jsonb_build_object(
    'id',           d.id,
    'naam',         d.name_nl,
    'keuken',       d.cuisine,
    'omschrijving', d.description_nl,
    'recept_porties', d.default_servings,
    'status',       d.validation_status,
    'beoordelaar',  d.reviewer_name,
    'beoordeeld_op', d.reviewed_at,
    'ingredienten', s.n_ingredienten,
    'bevestigd',    s.n_bevestigd,
    'ongekoppeld',  s.n_ongekoppeld,
    'ongekoppeld_namen', s.ongekoppeld_namen,
    'optioneel',    s.n_optioneel,
    'optioneel_namen', s.optioneel_namen,
    'vet_gram',     round(s.vet_gram),
    'vet_soort',    s.vet_soort,
    'totaal_gram',  round(s.gram_z),
    'kcal_per_100', case when s.gram_z > 0 then round(s.kcal_z / s.gram_z * 100) end,

    'porties', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id',        p.id,
               'label',     p.label_nl,
               'maat',      p.household_measure,
               'icoon',     p.icon,
               'standaard', p.is_default,
               'notitie',   p.notes,
               'gram',      round(p.grams_estimate),
               'gram_laag', round(p.grams_low),
               'gram_hoog', round(p.grams_high),
               -- De band gaat uitsluitend over de portie.
               'kcal_punt', round(s.kcal_z  / s.gram_z * p.grams_estimate),
               'kcal_laag', round(s.kcal_z  / s.gram_z * p.grams_low),
               'kcal_hoog', round(s.kcal_z  / s.gram_z * p.grams_high),
               'eiwit_g',   round(s.eiwit_z / s.gram_z * p.grams_estimate, 1),
               'vet_g',     round(s.vet_z   / s.gram_z * p.grams_estimate, 1),
               'koolhydraat_g', round(s.koolh_z / s.gram_z * p.grams_estimate, 1),
               'vezel_g',   round(s.vezel_z / s.gram_z * p.grams_estimate, 1),
               -- Dezelfde portie, mét de optionele ingrediënten erin.
               'met', case when s.n_optioneel > 0 and s.gram_m is not null then jsonb_build_object(
                 'kcal_punt', round(s.kcal_m  / s.gram_m * p.grams_estimate),
                 'kcal_laag', round(s.kcal_m  / s.gram_m * p.grams_low),
                 'kcal_hoog', round(s.kcal_m  / s.gram_m * p.grams_high),
                 'eiwit_g',   round(s.eiwit_m / s.gram_m * p.grams_estimate, 1),
                 'vet_g',     round(s.vet_m   / s.gram_m * p.grams_estimate, 1),
                 'koolhydraat_g', round(s.koolh_m / s.gram_m * p.grams_estimate, 1),
                 'vezel_g',   round(s.vezel_m / s.gram_m * p.grams_estimate, 1)) end)
             order by p.sort_order)
        from dish_portions p
       where p.dish_id = p_dish_id and s.gram_z > 0), '[]'::jsonb),

    -- De opbouw hoort zichtbaar te zijn. Een getal dat je niet kunt uitklappen
    -- is een getal dat je moet geloven.
    'regels', coalesce((
      select jsonb_agg(jsonb_build_object(
               'naam',      r.ingredient_name_nl,
               'categorie', r.category,
               'gram',      round(r.gram),
               'kcal',      round(r.gram/100*r.kcal100),
               'vet_regel', r.is_preparation_fat,
               'optioneel', r.is_optional,
               'bevestigd', r.mapping_status = 'bevestigd',
               'gekoppeld', r.gekoppeld,
               'notitie',   r.uncertainty_note,
               'nevo_naam', r.nevo_naam)
             order by r.position)
        from regel r), '[]'::jsonb)
  )
    into v_uit
    from cultural_dishes d, som s
   where d.id = p_dish_id;

  return v_uit;
end
$function$
;

CREATE OR REPLACE FUNCTION public.kal_getal(p_tekst text)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
declare v text;
begin
  /* De telefoon staat op Nederlands en schrijft 7,45 waar Postgres 7.45 wil. */
  v := replace(trim(coalesce(p_tekst, '')), ',', '.');
  if v = '' then return null; end if;
  begin
    return v::numeric;
  exception when others then
    return null;
  end;
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_koppeling_maken(p_token text, p_naam text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_id      uuid;
  v_sleutel text;
  v_rij     kal_koppelingen%rowtype;
begin
  v_id := kal_sessie(p_token);

  -- 24 willekeurige bytes: 192 bits. Hex, want die is per telefoon over te
  -- typen zonder verwarring tussen hoofdletters, nullen en O's.
  v_sleutel := 'kal_' || encode(gen_random_bytes(24), 'hex');

  insert into kal_koppelingen(gebruiker_id, naam, sleutel_hash, sleutel_begin)
  values (v_id,
          coalesce(nullif(trim(p_naam), ''), 'Telefoon'),
          encode(digest(v_sleutel, 'sha256'), 'hex'),
          left(v_sleutel, 12))
  returning * into v_rij;

  return jsonb_build_object(
    'sleutel', v_sleutel,
    'koppeling', to_jsonb(v_rij) - 'sleutel_hash' - 'gebruiker_id');
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_koppeling_wissen(p_token text, p_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid; v_n integer;
begin
  v_id := kal_sessie(p_token);
  delete from kal_koppelingen where id = p_id and gebruiker_id = v_id;
  get diagnostics v_n = row_count;
  return v_n;
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_koppelingen_lijst(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
  v_id := kal_sessie(p_token);
  return coalesce((
    select jsonb_agg(to_jsonb(k) - 'sleutel_hash' - 'gebruiker_id' order by k.aangemaakt_op)
      from kal_koppelingen k where k.gebruiker_id = v_id), '[]'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_maaltijd_bewaren(p_token text, p_naam text, p_toelichting text, p_porties numeric, p_regels jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_id       uuid;
  v_recept   uuid;
  v_naam     text := btrim(coalesce(p_naam, ''));
  v_porties  numeric := coalesce(p_porties, 1);
  v_favoriet boolean := false;
begin
  v_id := kal_sessie(p_token);

  if v_naam = '' then
    raise exception 'Een maaltijd zonder naam is niet terug te vinden.';
  end if;
  if v_porties <= 0 then
    raise exception 'Een maaltijd heeft minstens één portie.';
  end if;
  if p_regels is null or jsonb_typeof(p_regels) <> 'array' or jsonb_array_length(p_regels) = 0 then
    raise exception 'Een maaltijd zonder onderdelen zegt niets.';
  end if;

  select bool_or(favoriet) into v_favoriet
    from kal_recepten
   where gebruiker_id = v_id and lower(btrim(naam)) = lower(v_naam);

  delete from kal_recepten
   where gebruiker_id = v_id
     and lower(btrim(naam)) = lower(v_naam);

  insert into kal_recepten(gebruiker_id, naam, toelichting, porties, volgt_profiel, favoriet)
  values (v_id, v_naam, nullif(btrim(coalesce(p_toelichting, '')), ''), v_porties, false,
          coalesce(v_favoriet, false))
  returning id into v_recept;

  insert into kal_recept_regels(
    recept_id, positie, naam, hoeveelheid, eenheid, gram_equivalent,
    kcal_punt, kcal_laag, kcal_hoog, eiwit_g, vet_g, koolhydraat_g, vezel_g,
    conf, onzekerheidsbronnen, bron, nevo_code)
  select
    v_recept,
    (r.nr - 1)::integer,
    coalesce(nullif(btrim(r.v->>'naam'), ''), 'onderdeel'),
    nullif(r.v->>'hoeveelheid', '')::numeric,
    nullif(r.v->>'eenheid', ''),
    nullif(r.v->>'gram_equivalent', '')::numeric,
    coalesce(nullif(r.v->>'kcal_punt', '')::numeric, 0),
    nullif(r.v->>'kcal_laag', '')::numeric,
    nullif(r.v->>'kcal_hoog', '')::numeric,
    nullif(r.v->>'eiwit_g', '')::numeric,
    nullif(r.v->>'vet_g', '')::numeric,
    nullif(r.v->>'koolhydraat_g', '')::numeric,
    nullif(r.v->>'vezel_g', '')::numeric,
    coalesce(nullif(r.v->>'conf', ''), 'C'),
    case when jsonb_typeof(r.v->'onzekerheidsbronnen') = 'array'
         then array(select jsonb_array_elements_text(r.v->'onzekerheidsbronnen'))
    end,
    coalesce(nullif(r.v->>'bron', ''), 'handmatig'),
    nullif(r.v->>'nevo_code', '')
  from jsonb_array_elements(p_regels) with ordinality as r(v, nr);

  return kal_maaltijd_een(v_recept);
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_maaltijd_een(p_recept uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  select jsonb_build_object(
    'id', m.id,
    'naam', m.naam,
    'toelichting', m.toelichting,
    'porties', m.porties,
    'favoriet', m.favoriet,
    'regels', coalesce((
      select jsonb_agg(jsonb_build_object(
        'naam', g.naam,
        'hoeveelheid', g.hoeveelheid,
        'eenheid', g.eenheid,
        'gram_equivalent', g.gram_equivalent,
        'kcal_punt', g.kcal_punt,
        'kcal_laag', g.kcal_laag,
        'kcal_hoog', g.kcal_hoog,
        'eiwit_g', g.eiwit_g,
        'vet_g', g.vet_g,
        'koolhydraat_g', g.koolhydraat_g,
        'vezel_g', g.vezel_g,
        'conf', g.conf,
        'onzekerheidsbronnen', g.onzekerheidsbronnen,
        'bron', g.bron,
        'nevo_code', g.nevo_code
      ) order by g.positie)
      from kal_recept_regels g where g.recept_id = m.id), '[]'::jsonb))
  from kal_recepten m where m.id = p_recept;
$function$
;

CREATE OR REPLACE FUNCTION public.kal_maaltijd_favoriet(p_token text, p_id uuid, p_aan boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_id uuid; v_uit boolean;
begin
  v_id := kal_sessie(p_token);
  update kal_recepten set favoriet = coalesce(p_aan, false)
   where id = p_id and gebruiker_id = v_id
  returning favoriet into v_uit;
  return coalesce(v_uit, false);
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_maaltijd_wissen(p_token text, p_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_id uuid; v_weg integer;
begin
  v_id := kal_sessie(p_token);
  delete from kal_recepten where id = p_id and gebruiker_id = v_id;
  get diagnostics v_weg = row_count;
  return v_weg;
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_maaltijden(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_id uuid;
begin
  v_id := kal_sessie(p_token);
  return coalesce((
    select jsonb_agg(kal_maaltijd_een(m.id) order by m.favoriet desc, m.naam)
      from kal_recepten m
     where m.gebruiker_id = v_id), '[]'::jsonb);
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_modelstand_zetten(p_token text, p_doel_kcal numeric DEFAULT NULL::numeric, p_eiwit_doel_g numeric DEFAULT NULL::numeric, p_tdee_laag numeric DEFAULT NULL::numeric, p_tdee_hoog numeric DEFAULT NULL::numeric, p_zekerheid text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_id uuid;
begin
  v_id := kal_sessie(p_token);

  insert into kal_modelstand(gebruiker_id, doel_kcal, eiwit_doel_g,
                             tdee_laag, tdee_hoog, zekerheid, berekend_op)
  values (v_id, p_doel_kcal, p_eiwit_doel_g, p_tdee_laag, p_tdee_hoog, p_zekerheid, now())
  on conflict (gebruiker_id) do update
    set doel_kcal = excluded.doel_kcal,
        eiwit_doel_g = excluded.eiwit_doel_g,
        tdee_laag = excluded.tdee_laag,
        tdee_hoog = excluded.tdee_hoog,
        zekerheid = excluded.zekerheid,
        berekend_op = now();
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_nevo_zoek(p_q text, p_limiet integer DEFAULT 8)
 RETURNS TABLE(nevo_code text, naam_nl text, groep text, energie_kcal_per_100g numeric, eiwit_g numeric, vet_g numeric, koolhydraten_g numeric, vezels_g numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with vraag as (
    select regexp_replace(
             lower(regexp_replace(trim(coalesce(p_q,'')), '[^a-zà-ÿ0-9 ]', ' ', 'g')),
             '\s+', ' ', 'g') as q
  ),
  ruw as (
    select distinct w
    from vraag, unnest(string_to_array((select q from vraag), ' ')) as w
    where length(w) >= 2
      and w not in ('met','van','de','het','een','in','uit','op','aan','bij',
                    'er','of','en','per','voor','zonder')
  ),
  woorden as (
    -- sluitende -e eraf bij woorden van vijf letters of meer: gekookte -> gekookt
    select distinct
      case when length(w) >= 5 and right(w,1) = 'e' then left(w, length(w)-1) else w end as w
    from ruw
  ),
  bron as (
    -- nevo_actief en niet nevo_foods: dit is de licentiepoort. Staat de licentie
    -- van de actieve versie niet op gecontroleerd, dan is deze bron leeg en
    -- vindt het zoeken niets — precies wat de schakelaar hoort te doen.
    select n.nevo_code, n.naam_nl, n.groep, n.energie_kcal_per_100g,
           n.eiwit_g, n.vet_g, n.koolhydraten_g, n.vezels_g,
           lower(n.naam_nl) as nm,
           lower(n.naam_nl || ' ' || coalesce(n.naam_en,'') || ' '
                 || coalesce(n.synoniem_nevo,'') || ' '
                 || coalesce(array_to_string(n.synoniemen_afgeleid, ' '), '')) as tekst,
           (select array_agg(lower(s))
              from unnest(array[n.naam_en, n.synoniem_nevo]
                          || coalesce(n.synoniemen_afgeleid, '{}')) s
             where s is not null) as syn
    from nevo_actief n
  ),
  -- treffers per woord, in één keer; hieruit volgt zowel de document frequency
  -- als welke producten welk woord bevatten
  raak as (
    select w.w, b.nevo_code
    from woorden w
    join bron b on
      case when length(w.w) <= 2 then b.tekst ~ ('\m' || w.w || '\M')
           when length(w.w) <= 4 then b.tekst ~ ('\m' || w.w)
           else position(w.w in b.tekst) > 0 end
  ),
  gewicht as (
    select w.w,
           -- greatest(..., 1): bij een lege bron zou dit ln(0) zijn en afbreken.
           -- Vanaf één product verandert er niets aan de uitkomst.
           ln(greatest((select count(*) from bron), 1)::numeric
              / (1 + (select count(*) from raak r where r.w = w.w)))
             as idf
    from woorden w
  ),
  totaal as (
    select coalesce(sum(greatest(idf, 0.01)), 0) as punten, count(*)::int as n from gewicht
  ),
  geteld as (
    select b.*,
           coalesce((select sum(greatest(g.idf, 0.01))
                       from raak r join gewicht g on g.w = r.w
                      where r.nevo_code = b.nevo_code), 0) as score,
           (select count(*) from raak r where r.nevo_code = b.nevo_code) as woorden_raak
    from bron b
  )
  select g.nevo_code, g.naam_nl, g.groep, g.energie_kcal_per_100g,
         g.eiwit_g, g.vet_g, g.koolhydraten_g, g.vezels_g
  from geteld g, totaal t, vraag v
  where t.n > 0 and g.woorden_raak > 0
  order by
    case
      when g.nm = v.q               then 0   -- precies deze naam
      when v.q = any(g.syn)         then 1   -- precies dit hele synoniem
      when g.nm like v.q || '%'     then 2   -- de naam begint met de vraag
      when g.woorden_raak = t.n     then 3   -- alle woorden komen voor
      else 4                                 -- een deel van de woorden
    end,
    t.punten - g.score,        -- binnen trede 4: het zeldzaamste woord weegt zwaarst
    length(g.naam_nl),         -- NEVO geeft het kernproduct de kortste naam
    g.naam_nl
  limit greatest(1, least(coalesce(p_limiet, 8), 50));
$function$
;

CREATE OR REPLACE FUNCTION public.kal_ophalen(p_token text, p_vanaf date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid; v_vanaf date;
begin
  v_id := kal_sessie(p_token);
  v_vanaf := coalesce(p_vanaf, current_date - 400);
  return jsonb_build_object(
    'profiel', (select to_jsonb(p) from kal_profiel p where p.gebruiker_id = v_id),
    'dagen', coalesce((select jsonb_agg(to_jsonb(d) order by d.datum)
                       from kal_dagen d where d.gebruiker_id = v_id and d.datum >= v_vanaf), '[]'::jsonb),
    'regels', coalesce((select jsonb_agg(to_jsonb(r) order by r.datum, r.created_at)
                       from kal_regels r where r.gebruiker_id = v_id and r.datum >= v_vanaf), '[]'::jsonb),
    'producten', coalesce((select jsonb_agg(to_jsonb(x) order by x.naam)
                       from kal_producten x where x.gebruiker_id = v_id), '[]'::jsonb),
    'recepten', coalesce((select jsonb_agg(jsonb_build_object(
                            'recept', to_jsonb(rc),
                            'regels', coalesce((select jsonb_agg(to_jsonb(rr) order by rr.positie)
                                                from kal_recept_regels rr where rr.recept_id = rc.id), '[]'::jsonb))
                          order by rc.naam)
                       from kal_recepten rc where rc.gebruiker_id = v_id), '[]'::jsonb),
    'metingen', coalesce((select jsonb_agg(to_jsonb(m) order by m.datum)
                       from kal_metingen m where m.gebruiker_id = v_id), '[]'::jsonb),
    'labs', coalesce((select jsonb_agg(to_jsonb(l) order by l.datum)
                       from kal_labs l where l.gebruiker_id = v_id), '[]'::jsonb),
    'vragenlijsten', coalesce((select jsonb_agg(to_jsonb(v) order by v.datum)
                       from kal_vragenlijsten v where v.gebruiker_id = v_id), '[]'::jsonb),
    'training', coalesce((select jsonb_agg(to_jsonb(t) order by t.datum)
                       from kal_training t where t.gebruiker_id = v_id and t.datum >= v_vanaf), '[]'::jsonb)
  );
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_peiling_vastleggen(p_gebruiker uuid, p_datum date, p_stappen numeric, p_energie numeric)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_nu    timestamp := now() at time zone 'Europe/Amsterdam';
  v_min   integer;
begin
  if p_gebruiker is null then return false; end if;
  if p_datum is distinct from v_nu::date then return false; end if;
  if p_stappen is null and p_energie is null then return false; end if;

  v_min := extract(hour from v_nu)::integer * 60 + extract(minute from v_nu)::integer;

  insert into kal_beweging_peilingen(gebruiker_id, datum, minuut, stappen, actieve_energie_kcal)
  values (p_gebruiker, p_datum, v_min,
          round(p_stappen)::integer, round(p_energie)::integer);
  return true;
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_portiematen(p_token text, p_nevo_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_gebruiker uuid;
  v_uit       jsonb;
begin
  v_gebruiker := kal_sessie(p_token);

  select jsonb_build_object(
    'nevo_code', n.nevo_code,
    'naam',      n.naam_nl,
    'groep',     n.groep,
    'kcal',      n.energie_kcal_per_100g,
    'eiwit_g',   n.eiwit_g,
    'vet_g',     n.vet_g,
    'koolhydraat_g', n.koolhydraten_g,
    'vezel_g',   n.vezels_g,
    'maten', coalesce((
      select jsonb_agg(jsonb_build_object(
               'naam',      m.naam,
               'meervoud',  coalesce(m.meervoud, m.naam),
               'gram',      m.gram_schatting,
               'gram_laag', m.gram_laag,
               'gram_hoog', m.gram_hoog,
               'standaard', m.is_standaard,
               'herkomst',  m.herkomst,
               'dietist',   m.gecontroleerd_door_dietist)
             order by m.is_standaard desc, m.volgorde)
        from voeding_portiematen m
       where m.nevo_code = n.nevo_code
          or (m.nevo_code is null and m.nevo_groep = n.groep)), '[]'::jsonb))
    into v_uit
    -- nevo_actief: de licentiepoort. Staat de licentie niet op gecontroleerd,
    -- dan is dit product onvindbaar en volgt de melding hieronder.
    from nevo_actief n
   where n.nevo_code = p_nevo_code
   limit 1;

  if v_uit is null then
    raise exception 'Dit product staat niet in het voedingsstoffenbestand';
  end if;
  return v_uit;
end
$function$
;

CREATE OR REPLACE FUNCTION public.kal_prikkel_bouwen(p_soort text DEFAULT 'dagelijks'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_aan text; v_mail text; v_url text; v_g record; v_st jsonb;
  v_vandaag date := (now() at time zone 'Europe/Amsterdam')::date;
  v_ond text; v_tekst text; v_knop text; v_uit jsonb := '[]'::jsonb;
begin
  select waarde into v_aan  from kal_config where sleutel = 'prikkel_aan';
  select waarde into v_mail from kal_config where sleutel = 'prikkel_email';
  select waarde into v_url  from kal_config where sleutel = 'app_url';
  if coalesce(v_aan,'ja') <> 'ja' or v_mail is null then return v_uit; end if;

  v_knop := case when coalesce(trim(v_url), '') = '' then ''
                 else '<p style="margin:0"><a href="' || v_url
                      || '" style="color:#3D5A57">Openen</a></p>' end;

  for v_g in select g.id, coalesce(g.weergavenaam, g.account) as naam
               from kal_gebruikers g join kal_profiel p on p.gebruiker_id = g.id loop

    if exists (select 1 from kal_prikkel_log
                where gebruiker_id = v_g.id and datum = v_vandaag and soort = p_soort) then
      continue;
    end if;

    v_st := kal_dagstand(v_g.id);

    /* Zwijgen wanneer er niets aan de hand is. Een bericht dat elke dag komt
       ongeacht de inhoud wordt binnen twee weken weggeklikt, en dan is het
       kanaal weg op het moment dat er wél iets te melden valt. */
    if (v_st->>'gewogen_vandaag')::boolean and (v_st->>'gaten_7')::integer <= 1 then
      continue;
    end if;

    if not (v_st->>'gewogen_vandaag')::boolean then
      if coalesce((v_st->>'dagen_zonder_weging')::integer, 999) >= 7 then
        v_ond := 'Kalibratie — de weegreeks staat stil';
        v_tekst := 'Er is ' || coalesce((v_st->>'dagen_zonder_weging')::text, 'lang') ||
          ' dagen niet gewogen. Zonder die reeks rekent het model niets uit: het is de enige invoer ' ||
          'die niet te schatten valt, en het enige onbevooroordeelde signaal in het systeem. ' ||
          'Eén weging vanochtend zet hem weer in beweging.';
      else
        v_ond := 'Kalibratie — nog niet gewogen vanochtend';
        v_tekst := case when (v_st->>'model_klaar')::boolean
          then 'Nuchter, na het toilet, vóór het eten. De reeks loopt; één ontbrekende dag verbreedt het interval meer dan een onnauwkeurige schatting dat doet.'
          else 'Nuchter, na het toilet, vóór het eten. Nog ' || (v_st->>'wegingen_te_gaan') ||
               ' weging(en) en ' || (v_st->>'dagen_te_gaan') || ' registratiedag(en) voordat het model een verbruik met interval kan tonen.'
          end;
      end if;
    else
      v_ond := 'Kalibratie — gaten in de registratie';
      v_tekst := (v_st->>'gaten_7') || ' van de afgelopen zeven dagen heeft geen registratie. ' ||
        'Een ruwe schatting is beter dan niets: een ontbrekende dag verbreedt het interval sneller ' ||
        'dan een onnauwkeurige waarde dat doet.';
    end if;

    v_uit := v_uit || jsonb_build_object(
      'gebruiker_id', v_g.id, 'soort', p_soort, 'to', v_mail, 'subject', v_ond, 'tekst', v_tekst,
      'html', '<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.6;color:#2A2E28;max-width:520px">'
        || '<p style="font-family:Georgia,serif;font-size:20px;margin:0 0 12px">Kalibratie</p>'
        || '<p style="margin:0 0 14px">' || v_tekst || '</p>'
        || '<p style="margin:0 0 14px;font-size:13px;color:#5E6159">'
        || (v_st->>'wegingen_28') || ' wegingen en ' || (v_st->>'bruikbare_dagen_28')
        || ' bruikbare registratiedagen in het venster van 28 dagen.'
        || case when (v_st->>'laatste_gewicht') is not null
                then ' Laatste weging: ' || replace((v_st->>'laatste_gewicht'), '.', ',') || ' kg op '
                     || to_char((v_st->>'laatste_weging')::date, 'DD-MM') || '.' else '' end
        || '</p>' || v_knop || '</div>');
  end loop;
  return v_uit;
end
$function$
;

CREATE OR REPLACE FUNCTION public.kal_prikkel_gelogd(p_gebruiker uuid, p_soort text, p_onderwerp text, p_gelukt boolean, p_fout text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into kal_prikkel_log(gebruiker_id, datum, soort, onderwerp, verstuurd, fout)
  values (p_gebruiker, (now() at time zone 'Europe/Amsterdam')::date, p_soort, p_onderwerp, p_gelukt, p_fout)
  on conflict (gebruiker_id, datum, soort) do update
    set verstuurd = excluded.verstuurd, fout = excluded.fout;
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_proef_koppeling()
 RETURNS TABLE(geval text, goed boolean, gezien text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_uit      jsonb := '[]'::jsonb;
  v_a        uuid;
  v_b        uuid;
  v_sa       text;
  v_dood     text;
  v_ant      jsonb;
  v_d        record;
  v_vandaag  date := (now() at time zone 'Europe/Amsterdam')::date;
  v_gist     date;
  v_dag      date;
  v_n        integer;
  v_n2       integer;
begin
  v_gist := v_vandaag - 1;
  v_dag  := v_vandaag - 5;

  begin
    insert into kal_gebruikers(account, ww_hash) values ('proef-a-'||gen_random_uuid(), 'x')
      returning id into v_a;
    insert into kal_gebruikers(account, ww_hash) values ('proef-b-'||gen_random_uuid(), 'x')
      returning id into v_b;

    v_sa   := 'kal_' || encode(gen_random_bytes(24), 'hex');
    v_dood := 'kal_' || encode(gen_random_bytes(24), 'hex');
    insert into kal_koppelingen(gebruiker_id, naam, sleutel_hash, sleutel_begin)
      values (v_a, 'proef', encode(digest(v_sa,'sha256'),'hex'), left(v_sa,12));
    insert into kal_koppelingen(gebruiker_id, naam, sleutel_hash, sleutel_begin, actief)
      values (v_a, 'ingetrokken', encode(digest(v_dood,'sha256'),'hex'), left(v_dood,12), false);

    /* ================================ de sleutel ======================== */
    begin
      perform kal_beweging_ontvangen('kal_bestaatniet', '[]'::jsonb);
      v_uit := v_uit || jsonb_build_object('geval','onbekende sleutel wordt geweigerd','goed',false,'gezien','geaccepteerd');
    exception when others then
      v_uit := v_uit || jsonb_build_object('geval','onbekende sleutel wordt geweigerd','goed',sqlerrm like '%koppelsleutel%','gezien',sqlerrm);
    end;

    begin
      perform kal_beweging_ontvangen('', '[]'::jsonb);
      v_uit := v_uit || jsonb_build_object('geval','lege sleutel wordt geweigerd','goed',false,'gezien','geaccepteerd');
    exception when others then
      v_uit := v_uit || jsonb_build_object('geval','lege sleutel wordt geweigerd','goed',true,'gezien',sqlerrm);
    end;

    begin
      perform kal_beweging_ontvangen(v_dood, '[]'::jsonb);
      v_uit := v_uit || jsonb_build_object('geval','ingetrokken sleutel wordt geweigerd','goed',false,'gezien','geaccepteerd');
    exception when others then
      v_uit := v_uit || jsonb_build_object('geval','ingetrokken sleutel wordt geweigerd','goed',true,'gezien',sqlerrm);
    end;

    /* ============================ de botsingsregels ===================== */
    insert into kal_dagen(gebruiker_id, datum, gewicht_kg, stappen, kracht, notitie, bron)
      values (v_a, v_dag, 111.1, 3000, true, 'met de hand', 'app');

    v_ant := kal_beweging_ontvangen(v_sa, jsonb_build_array(jsonb_build_object(
      'datum', v_dag, 'gewicht_kg', 999, 'stappen', 8421.0,
      'slaap_min', 447.6, 'actieve_energie_kcal', 612.4)));
    select * into v_d from kal_dagen where gebruiker_id=v_a and datum=v_dag;

    v_uit := v_uit || jsonb_build_object('geval','stappen: het toestel wint',
      'goed', v_d.stappen = 8421, 'gezien', format('%s (was 3000, kwam 8421.0)', v_d.stappen));
    v_uit := v_uit || jsonb_build_object('geval','GEWICHT WORDT NOOIT OVERSCHREVEN',
      'goed', v_d.gewicht_kg = 111.1, 'gezien', format('%s (was 111,1, kwam 999)', v_d.gewicht_kg));
    v_uit := v_uit || jsonb_build_object('geval','kommagetallen worden afgerond',
      'goed', v_d.slaap_min = 448 and v_d.actieve_energie_kcal = 612,
      'gezien', format('slaap %s uit 447.6, energie %s uit 612.4', v_d.slaap_min, v_d.actieve_energie_kcal));
    v_uit := v_uit || jsonb_build_object('geval','kracht en notitie blijven onaangeraakt',
      'goed', v_d.kracht and v_d.notitie = 'met de hand',
      'gezien', format('kracht=%s notitie=%s', v_d.kracht, v_d.notitie));
    v_uit := v_uit || jsonb_build_object('geval','behouden weging wordt gemeld',
      'goed', (v_ant->>'gewicht_behouden')::int = 1, 'gezien', v_ant::text);

    v_ant := kal_beweging_ontvangen(v_sa, jsonb_build_array(
      jsonb_build_object('datum', v_dag, 'fiets_min', 30)));
    select * into v_d from kal_dagen where gebruiker_id=v_a and datum=v_dag;
    v_uit := v_uit || jsonb_build_object('geval','weggelaten velden blijven staan',
      'goed', v_d.stappen = 8421 and v_d.slaap_min = 448 and v_d.fiets_min = 30,
      'gezien', format('stappen=%s slaap=%s fiets=%s', v_d.stappen, v_d.slaap_min, v_d.fiets_min));

    v_ant := kal_beweging_ontvangen(v_sa, jsonb_build_array(jsonb_build_object(
      'datum', v_dag - 1, 'gewicht_kg', 116.4, 'gewicht_bron', 'garmin')));
    select * into v_d from kal_dagen where gebruiker_id=v_a and datum=v_dag-1;
    v_uit := v_uit || jsonb_build_object('geval','lege dag krijgt het gewicht wel',
      'goed', v_d.gewicht_kg = 116.4 and v_d.gewicht_bron = 'garmin',
      'gezien', format('%s kg, bron %s', v_d.gewicht_kg, v_d.gewicht_bron));

    /* ============================== de grenzen ========================== */
    v_ant := kal_beweging_ontvangen(v_sa, jsonb_build_array(
      jsonb_build_object('datum', v_vandaag + 5, 'stappen', 1),
      jsonb_build_object('datum', '2014-12-31',  'stappen', 1),
      jsonb_build_object('datum', null,          'stappen', 1)));
    v_uit := v_uit || jsonb_build_object('geval','toekomst, te oud en zonder datum: overgeslagen',
      'goed', (v_ant->>'overgeslagen')::int = 3 and (v_ant->>'dagen')::int = 0, 'gezien', v_ant::text);
    select count(*) into v_n from kal_dagen where gebruiker_id=v_a and datum > v_vandaag;
    v_uit := v_uit || jsonb_build_object('geval','er staat geen dag in de toekomst',
      'goed', v_n = 0, 'gezien', format('%s dagen', v_n));

    begin
      perform kal_beweging_ontvangen(v_sa, (
        select jsonb_agg(jsonb_build_object('datum', v_vandaag - i, 'stappen', 1))
          from generate_series(1, 401) i));
      v_uit := v_uit || jsonb_build_object('geval','meer dan 400 dagen wordt geweigerd','goed',false,'gezien','geaccepteerd');
    exception when others then
      v_uit := v_uit || jsonb_build_object('geval','meer dan 400 dagen wordt geweigerd','goed',true,'gezien',sqlerrm);
    end;

    begin
      perform kal_beweging_ontvangen(v_sa, '{"geen":"lijst"}'::jsonb);
      v_uit := v_uit || jsonb_build_object('geval','iets dat geen lijst is wordt geweigerd','goed',false,'gezien','geaccepteerd');
    exception when others then
      v_uit := v_uit || jsonb_build_object('geval','iets dat geen lijst is wordt geweigerd','goed',true,'gezien',sqlerrm);
    end;

    /* ======================= scheiding tussen gebruikers ================ */
    select count(*) into v_n from kal_dagen where gebruiker_id = v_b;
    v_uit := v_uit || jsonb_build_object('geval','SLEUTEL VAN A RAAKT DE DAGEN VAN B NIET',
      'goed', v_n = 0, 'gezien', format('%s dagen bij B', v_n));

    /* ============================== de tellers ========================== */
    select aantal_berichten, aantal_dagen, laatst_gebruikt_op is not null as gezien
      into v_d from kal_koppelingen where sleutel_hash = encode(digest(v_sa,'sha256'),'hex');
    v_uit := v_uit || jsonb_build_object('geval','de koppeling houdt bij dat er iets binnenkwam',
      'goed', v_d.aantal_berichten >= 4 and v_d.aantal_dagen >= 3 and v_d.gezien,
      'gezien', format('%s berichten, %s dagen, gezien=%s', v_d.aantal_berichten, v_d.aantal_dagen, v_d.gezien));

    /* ========================= de platte ingang ========================= */
    /* Alle waarden als tekst: zo stuurt de Opdrachten-app ze ook. */
    v_ant := kal_beweging_dag(v_sa, p_stappen := '7000');
    v_uit := v_uit || jsonb_build_object('geval','zonder datum wordt het gisteren',
      'goed', (v_ant->>'datum')::date = v_gist, 'gezien', v_ant->>'datum');

    v_ant := kal_beweging_dag(v_sa, p_datum := '', p_stappen := '7001');
    v_uit := v_uit || jsonb_build_object('geval','lege datumtekst wordt ook gisteren',
      'goed', (v_ant->>'datum')::date = v_gist, 'gezien', v_ant->>'datum');

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_stappen := '7002');
    v_uit := v_uit || jsonb_build_object('geval','dagen_terug 0 is vandaag',
      'goed', (v_ant->>'datum')::date = v_vandaag, 'gezien', v_ant->>'datum');

    v_ant := kal_beweging_dag(v_sa, p_datum := (v_vandaag - 6)::text, p_dagen_terug := '0', p_stappen := '100');
    v_uit := v_uit || jsonb_build_object('geval','een eigen datum overrulet de standaard',
      'goed', (v_ant->>'datum')::date = v_vandaag - 6, 'gezien', v_ant->>'datum');

    perform kal_beweging_dag(v_sa, p_slaap_uur := '7.45');
    select slaap_min into v_d from kal_dagen where gebruiker_id=v_a and datum=v_gist;
    v_uit := v_uit || jsonb_build_object('geval','slaap in uren wordt minuten',
      'goed', v_d.slaap_min = 447, 'gezien', format('7.45 uur -> %s min', v_d.slaap_min));

    perform kal_beweging_dag(v_sa, p_slaap_sec := '28800');
    select slaap_min into v_d from kal_dagen where gebruiker_id=v_a and datum=v_gist;
    v_uit := v_uit || jsonb_build_object('geval','slaap in seconden wordt minuten',
      'goed', v_d.slaap_min = 480, 'gezien', format('28800 sec -> %s min', v_d.slaap_min));

    v_ant := kal_beweging_dag(v_sa, p_slaap_min := '28800');
    select slaap_min into v_d from kal_dagen where gebruiker_id=v_a and datum=v_gist;
    v_uit := v_uit || jsonb_build_object('geval','onmogelijke slaap wordt geweigerd en gemeld',
      'goed', (v_ant->>'slaap_genegeerd')::boolean and v_d.slaap_min = 480,
      'gezien', format('genegeerd=%s, blijft %s min', v_ant->>'slaap_genegeerd', v_d.slaap_min));

    /* ---- wat een echte telefoon stuurt: soms niets, en komma's ---------- */
    /* Een nacht zonder slaapmeting gaf 22P02 en sloopte het hele bericht,
       inclusief de stappen die wél gemeten waren. */
    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0',
                              p_stappen := '8421', p_actieve_energie_kcal := '612',
                              p_slaap_sec := '');
    select stappen, actieve_energie_kcal into v_d
      from kal_dagen where gebruiker_id=v_a and datum=v_vandaag;
    v_uit := v_uit || jsonb_build_object('geval','EEN LEEG GETAL SLOOPT HET BERICHT NIET',
      'goed', (v_ant->>'dagen')::int = 1 and v_d.stappen = 8421 and v_d.actieve_energie_kcal = 612,
      'gezien', format('stappen=%s energie=%s', v_d.stappen, v_d.actieve_energie_kcal));

    perform kal_beweging_dag(v_sa, p_dagen_terug := '0', p_slaap_uur := '7,45');
    select slaap_min into v_d from kal_dagen where gebruiker_id=v_a and datum=v_vandaag;
    v_uit := v_uit || jsonb_build_object('geval','een komma is een decimaalteken',
      'goed', v_d.slaap_min = 447, 'gezien', format('7,45 uur -> %s min', v_d.slaap_min));

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_stappen := 'zeven');
    select stappen into v_d from kal_dagen where gebruiker_id=v_a and datum=v_vandaag;
    v_uit := v_uit || jsonb_build_object('geval','onleesbaar wordt gemeld, niet weggeschreven',
      'goed', v_ant->'niet_gelezen' ? 'stappen' and v_d.stappen = 8421,
      'gezien', format('niet_gelezen=%s, stappen blijft %s', v_ant->>'niet_gelezen', v_d.stappen));


    /* ---------------------------- de rustpols --------------------------- */
    /* Hij woont in kal_metingen en niet in kal_dagen, dus hij heeft zijn eigen
       botsingsregels — en die zijn net anders: een meting die de koppeling zelf
       neerzette mag hij bijwerken, want de rustpols van vanochtend is voorlopig. */
    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_hartslag_rust := '58');
    select waarde into v_d from kal_metingen
     where gebruiker_id=v_a and datum=v_vandaag and soort='hartslag_rust';
    v_uit := v_uit || jsonb_build_object('geval','rustpols komt binnen',
      'goed', v_ant->>'hartslag_rust' = 'opgeslagen' and v_d.waarde = 58,
      'gezien', format('%s -> %s', v_ant->>'hartslag_rust', v_d.waarde));

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_hartslag_rust := '55');
    select count(*) into v_n from kal_metingen
     where gebruiker_id=v_a and datum=v_vandaag and soort='hartslag_rust';
    select waarde into v_d from kal_metingen
     where gebruiker_id=v_a and datum=v_vandaag and soort='hartslag_rust';
    v_uit := v_uit || jsonb_build_object('geval','tweede keer werkt bij, zonder dubbele rij',
      'goed', v_n = 1 and v_d.waarde = 55, 'gezien', format('%s rij(en), waarde %s', v_n, v_d.waarde));

    update kal_metingen set notitie = null, waarde = 62
     where gebruiker_id=v_a and datum=v_vandaag and soort='hartslag_rust';
    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_hartslag_rust := '55');
    select waarde into v_d from kal_metingen
     where gebruiker_id=v_a and datum=v_vandaag and soort='hartslag_rust';
    v_uit := v_uit || jsonb_build_object('geval','EEN POLS DIE JIJ INVULDE BLIJFT STAAN',
      'goed', v_d.waarde = 62 and v_ant->>'hartslag_rust' = 'die van jou blijft staan',
      'gezien', format('%s -> %s', v_ant->>'hartslag_rust', v_d.waarde));

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '2', p_hartslag_rust := '600');
    select count(*) into v_n from kal_metingen
     where gebruiker_id=v_a and datum=v_vandaag-2 and soort='hartslag_rust';
    v_uit := v_uit || jsonb_build_object('geval','onmogelijke pols wordt geweigerd',
      'goed', v_n = 0 and v_ant->>'hartslag_rust' = 'onmogelijk, genegeerd',
      'gezien', format('%s, %s rijen', v_ant->>'hartslag_rust', v_n));

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_stappen := '100');
    v_uit := v_uit || jsonb_build_object('geval','zonder pols verandert er niets aan de pols',
      'goed', v_ant->>'hartslag_rust' = 'niet meegestuurd', 'gezien', v_ant->>'hartslag_rust');


    /* ------------------- een 0 uit een lege zoekactie -------------------- */
    /* Bereken statistiek geeft over nul monsters een 0 en niet leeg. Die 0 is
       niet te onderscheiden van "niets gevonden" en hoort dus niet in de
       tabellen; hij hoort wel in het antwoord. */
    perform kal_beweging_dag(v_sa, p_datum := (v_vandaag - 8)::text,
                             p_stappen := '5000', p_actieve_energie_kcal := '300');
    v_ant := kal_beweging_dag(v_sa, p_datum := (v_vandaag - 8)::text,
                              p_stappen := '6000', p_actieve_energie_kcal := '0');
    select stappen, actieve_energie_kcal into v_d
      from kal_dagen where gebruiker_id = v_a and datum = v_vandaag - 8;
    v_uit := v_uit || jsonb_build_object('geval','EEN 0 WORDT NIET WEGGESCHREVEN',
      'goed', v_d.stappen = 6000 and v_d.actieve_energie_kcal = 300
              and v_ant->'nul_overgeslagen' ? 'actieve_energie_kcal',
      'gezien', format('stappen=%s energie=%s nul=%s',
                       v_d.stappen, v_d.actieve_energie_kcal, v_ant->>'nul_overgeslagen'));

    v_uit := v_uit || jsonb_build_object('geval','een 0 is leesbaar, dus niet niet_gelezen',
      'goed', not (v_ant->'niet_gelezen' ? 'actieve_energie_kcal'),
      'gezien', v_ant->>'niet_gelezen');

    v_ant := kal_beweging_dag(v_sa, p_datum := (v_vandaag - 8)::text, p_slaap_sec := '0');
    select slaap_min into v_d from kal_dagen where gebruiker_id = v_a and datum = v_vandaag - 8;
    v_uit := v_uit || jsonb_build_object('geval','nul minuten slaap bestaat niet',
      'goed', v_d.slaap_min is null and v_ant->'nul_overgeslagen' ? 'slaap'
              and not (v_ant->>'slaap_genegeerd')::boolean,
      'gezien', format('slaap=%s nul=%s', v_d.slaap_min, v_ant->>'nul_overgeslagen'));

    v_ant := kal_beweging_dag(v_sa, p_datum := (v_vandaag - 8)::text, p_stappen := '0');
    select stappen into v_d from kal_dagen where gebruiker_id = v_a and datum = v_vandaag - 8;
    v_uit := v_uit || jsonb_build_object('geval','0 stappen laat de gemeten stappen staan',
      'goed', v_d.stappen = 6000, 'gezien', format('%s', v_d.stappen));

    v_ant := kal_beweging_dag(v_sa, p_datum := (v_vandaag - 8)::text, p_stappen := '7000');
    v_uit := v_uit || jsonb_build_object('geval','zonder nullen blijft de lijst leeg',
      'goed', jsonb_array_length(v_ant->'nul_overgeslagen') = 0,
      'gezien', v_ant->>'nul_overgeslagen');


    /* ---------------------- de peilingen van de dag ---------------------- */
    /* Een tussenstand van vandaag hoort te blijven staan met zijn tijdstip;
       een bijgewerkte oude dag is geen peiling maar een inhaalslag. */
    select count(*) into v_n from kal_beweging_peilingen
     where gebruiker_id = v_a and datum = v_vandaag;
    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_stappen := '4321');
    select count(*) into v_n2 from kal_beweging_peilingen
     where gebruiker_id = v_a and datum = v_vandaag;
    v_uit := v_uit || jsonb_build_object('geval','een stand van vandaag wordt een peiling',
      'goed', (v_ant->>'peiling')::boolean and v_n2 > v_n,
      'gezien', format('peiling=%s, %s rijen (was %s)', v_ant->>'peiling', v_n2, v_n));

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_stappen := '4400');
    select count(*) into v_n from kal_beweging_peilingen
     where gebruiker_id = v_a and datum = v_vandaag;
    v_uit := v_uit || jsonb_build_object('geval','peilingen stapelen, ze overschrijven elkaar niet',
      'goed', v_n > v_n2, 'gezien', format('%s rijen (was %s)', v_n, v_n2));

    v_ant := kal_beweging_dag(v_sa, p_datum := (v_vandaag - 3)::text, p_stappen := '9000');
    select count(*) into v_n2 from kal_beweging_peilingen
     where gebruiker_id = v_a and datum = v_vandaag - 3;
    v_uit := v_uit || jsonb_build_object('geval','EEN OUDE DAG WORDT GEEN PEILING',
      'goed', not (v_ant->>'peiling')::boolean and v_n2 = 0,
      'gezien', format('peiling=%s, %s rijen', v_ant->>'peiling', v_n2));

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_hartslag_rust := '60');
    v_uit := v_uit || jsonb_build_object('geval','zonder stappen of energie geen peiling',
      'goed', not (v_ant->>'peiling')::boolean, 'gezien', v_ant->>'peiling');

    /* De gewoonte kijkt alleen naar eerdere dagen. Alles wat deze proef vandaag
       schreef mag daar dus niet in meetellen, anders vergelijkt de app je met
       jezelf van vijf seconden geleden. */
    select n into v_n from kal_beweging_gewoonte(v_a, 720);
    v_uit := v_uit || jsonb_build_object('geval','de gewoonte telt vandaag niet mee',
      'goed', v_n = 0, 'gezien', format('%s eerdere dagen', v_n));

    raise exception 'PROEF-TERUGDRAAIEN';

  exception when others then
    if sqlerrm <> 'PROEF-TERUGDRAAIEN' then
      v_uit := v_uit || jsonb_build_object('geval','de proef zelf liep vast','goed', false, 'gezien', sqlerrm);
    end if;
  end;

  return query
    select x->>'geval', (x->>'goed')::boolean, x->>'gezien'
      from jsonb_array_elements(v_uit) x;
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_profiel_zetten(p_token text, p_patch jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
  v_id := kal_sessie(p_token);
  insert into kal_profiel(gebruiker_id, lengte_cm) values (v_id, coalesce((p_patch->>'lengte_cm')::numeric, 170))
  on conflict (gebruiker_id) do nothing;
  update kal_profiel set
    lengte_cm         = coalesce((p_patch->>'lengte_cm')::numeric, lengte_cm),
    geboortedatum     = coalesce((p_patch->>'geboortedatum')::date, geboortedatum),
    leeftijd_jaar     = coalesce((p_patch->>'leeftijd_jaar')::integer, leeftijd_jaar),
    geslacht          = coalesce(p_patch->>'geslacht', geslacht),
    start_gewicht_kg  = coalesce((p_patch->>'start_gewicht_kg')::numeric, start_gewicht_kg),
    doel_gewicht_kg   = coalesce((p_patch->>'doel_gewicht_kg')::numeric, doel_gewicht_kg),
    tempo_pct_week    = coalesce((p_patch->>'tempo_pct_week')::numeric, tempo_pct_week),
    eiwit_g_per_kg    = coalesce((p_patch->>'eiwit_g_per_kg')::numeric, eiwit_g_per_kg),
    etniciteit        = coalesce(p_patch->>'etniciteit', etniciteit),
    fase              = coalesce(p_patch->>'fase', fase),
    onderhoud_basis_kg= coalesce((p_patch->>'onderhoud_basis_kg')::numeric, onderhoud_basis_kg),
    instellingen      = coalesce(p_patch->'instellingen', instellingen),
    updated_at        = now()
  where gebruiker_id = v_id;
  return (select to_jsonb(p) from kal_profiel p where p.gebruiker_id = v_id);
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_regel_wissen(p_token text, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
  v_id := kal_sessie(p_token);
  delete from kal_regels where id = p_id and gebruiker_id = v_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_regels_toevoegen(p_token text, p_regels jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid; v_r jsonb; v_uit jsonb := '[]'::jsonb; v_new kal_regels;
begin
  v_id := kal_sessie(p_token);
  for v_r in select * from jsonb_array_elements(p_regels) loop
    insert into kal_regels(gebruiker_id, datum, moment, naam, hoeveelheid, eenheid, gram_equivalent,
      kcal_punt, kcal_laag, kcal_hoog, eiwit_g, vet_g, koolhydraat_g, vezel_g,
      conf, onzekerheidsbronnen, bron, nevo_code, dish_id, recept_id, foto_pad, ruwe_invoer, ai_model)
    values (v_id, (v_r->>'datum')::date, coalesce(v_r->>'moment','onbekend'), v_r->>'naam',
      nullif(v_r->>'hoeveelheid','')::numeric, v_r->>'eenheid', nullif(v_r->>'gram_equivalent','')::numeric,
      (v_r->>'kcal_punt')::numeric, nullif(v_r->>'kcal_laag','')::numeric, nullif(v_r->>'kcal_hoog','')::numeric,
      nullif(v_r->>'eiwit_g','')::numeric, nullif(v_r->>'vet_g','')::numeric,
      nullif(v_r->>'koolhydraat_g','')::numeric, nullif(v_r->>'vezel_g','')::numeric,
      coalesce(v_r->>'conf','D'),
      case when v_r ? 'onzekerheidsbronnen'
           then array(select jsonb_array_elements_text(v_r->'onzekerheidsbronnen')) else null end,
      coalesce(v_r->>'bron','handmatig'), v_r->>'nevo_code', nullif(v_r->>'dish_id','')::uuid,
      nullif(v_r->>'recept_id','')::uuid, v_r->>'foto_pad', v_r->>'ruwe_invoer', v_r->>'ai_model')
    returning * into v_new;
    v_uit := v_uit || to_jsonb(v_new);
  end loop;
  return v_uit;
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_registreren(p_account text, p_ww text, p_naam text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_id uuid; v_token text;
begin
  if length(coalesce(p_ww,'')) < 8 then
    raise exception 'Kies een wachtwoord van minstens acht tekens';
  end if;
  insert into kal_gebruikers(account, ww_hash, weergavenaam)
  values (lower(trim(p_account)), crypt(p_ww, gen_salt('bf', 10)), p_naam)
  returning id into v_id;
  v_token := encode(gen_random_bytes(32), 'hex');
  insert into kal_sessies(token, gebruiker_id, verloopt_op)
  values (v_token, v_id, now() + interval '30 days');
  return jsonb_build_object('token', v_token, 'account', lower(trim(p_account)));
exception when unique_violation then
  raise exception 'Dat account bestaat al';
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_rij_toevoegen(p_token text, p_tabel text, p_rij jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid; v_uit jsonb;
begin
  v_id := kal_sessie(p_token);
  if p_tabel = 'product' then
    insert into kal_producten(gebruiker_id, naam, per, eenheid, kcal, eiwit_g, vet_g, koolhydraat_g, vezel_g, conf, tag, nevo_code)
    values (v_id, p_rij->>'naam', coalesce((p_rij->>'per')::numeric,100), coalesce(p_rij->>'eenheid','g'),
            (p_rij->>'kcal')::numeric, nullif(p_rij->>'eiwit_g','')::numeric, nullif(p_rij->>'vet_g','')::numeric,
            nullif(p_rij->>'koolhydraat_g','')::numeric, nullif(p_rij->>'vezel_g','')::numeric,
            coalesce(p_rij->>'conf','A'), p_rij->>'tag', p_rij->>'nevo_code')
    returning to_jsonb(kal_producten.*) into v_uit;
  elsif p_tabel = 'meting' then
    insert into kal_metingen(gebruiker_id, datum, soort, waarde, eenheid, notitie)
    values (v_id, (p_rij->>'datum')::date, p_rij->>'soort', (p_rij->>'waarde')::numeric, p_rij->>'eenheid', p_rij->>'notitie')
    returning to_jsonb(kal_metingen.*) into v_uit;
  elsif p_tabel = 'lab' then
    insert into kal_labs(gebruiker_id, datum, code, naam, waarde, eenheid, ref_laag, ref_hoog, notitie)
    values (v_id, (p_rij->>'datum')::date, p_rij->>'code', p_rij->>'naam', nullif(p_rij->>'waarde','')::numeric,
            p_rij->>'eenheid', nullif(p_rij->>'ref_laag','')::numeric, nullif(p_rij->>'ref_hoog','')::numeric, p_rij->>'notitie')
    returning to_jsonb(kal_labs.*) into v_uit;
  elsif p_tabel = 'vragenlijst' then
    insert into kal_vragenlijsten(gebruiker_id, datum, soort, antwoorden, score, klasse)
    values (v_id, (p_rij->>'datum')::date, p_rij->>'soort', coalesce(p_rij->'antwoorden','{}'::jsonb),
            nullif(p_rij->>'score','')::numeric, p_rij->>'klasse')
    returning to_jsonb(kal_vragenlijsten.*) into v_uit;
  elsif p_tabel = 'training' then
    insert into kal_training(gebruiker_id, datum, oefening, spiergroep, sets, reps, gewicht_kg, rpe, notitie)
    values (v_id, (p_rij->>'datum')::date, p_rij->>'oefening', p_rij->>'spiergroep',
            nullif(p_rij->>'sets','')::integer, nullif(p_rij->>'reps','')::integer,
            nullif(p_rij->>'gewicht_kg','')::numeric, nullif(p_rij->>'rpe','')::numeric, p_rij->>'notitie')
    returning to_jsonb(kal_training.*) into v_uit;
  else
    raise exception 'Onbekende tabel %', p_tabel;
  end if;
  return v_uit;
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_rij_wissen(p_token text, p_tabel text, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
  v_id := kal_sessie(p_token);
  if    p_tabel = 'product'     then delete from kal_producten     where id = p_id and gebruiker_id = v_id;
  elsif p_tabel = 'meting'      then delete from kal_metingen      where id = p_id and gebruiker_id = v_id;
  elsif p_tabel = 'lab'         then delete from kal_labs          where id = p_id and gebruiker_id = v_id;
  elsif p_tabel = 'vragenlijst' then delete from kal_vragenlijsten where id = p_id and gebruiker_id = v_id;
  elsif p_tabel = 'training'    then delete from kal_training      where id = p_id and gebruiker_id = v_id;
  else raise exception 'Onbekende tabel %', p_tabel;
  end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_sessie(p_token text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_id uuid;
begin
  select gebruiker_id into v_id from kal_sessies
   where token = p_token and verloopt_op > now();
  if v_id is null then raise exception 'Sessie verlopen of onbekend'; end if;
  return v_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_weekcijfers(p_gebruiker uuid, p_venster integer DEFAULT 28)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_eind date := (now() at time zone 'Europe/Amsterdam')::date;
  v_start date := v_eind - (p_venster - 1);
  n integer; helling numeric; sxx numeric; syy numeric; se numeric;
  gem_inname numeric; sd_inname numeric; n_inname integer;
  gewicht numeric; lengte numeric; leeftijd integer; geslacht text;
  tempo numeric; eiwit_kg numeric; doelgew numeric;
  rust integer; pal_l numeric := 1.35; pal_h numeric;
  gem_stappen numeric; tdee numeric; half numeric; doel integer;
  eiwit_ref numeric; gem_eiwit numeric; gemarkeerd integer; gaten integer;
begin
  select count(*), regr_slope(gewicht_kg, extract(epoch from datum)/86400),
         regr_sxx(gewicht_kg, extract(epoch from datum)/86400),
         regr_syy(gewicht_kg, extract(epoch from datum)/86400)
    into n, helling, sxx, syy
    from kal_dagen where gebruiker_id = p_gebruiker
      and datum between v_start and v_eind and gewicht_kg is not null;

  if n >= 3 and sxx > 0 then
    se := sqrt(greatest(0, (syy - helling*helling*sxx)) / (greatest(1, n-2) * sxx));
  end if;

  select p.lengte_cm, p.leeftijd_jaar, p.geslacht, p.tempo_pct_week, p.eiwit_g_per_kg, p.doel_gewicht_kg
    into lengte, leeftijd, geslacht, tempo, eiwit_kg, doelgew
    from kal_profiel p where p.gebruiker_id = p_gebruiker;

  select d.gewicht_kg into gewicht from kal_dagen d
   where d.gebruiker_id = p_gebruiker and d.gewicht_kg is not null
   order by d.datum desc limit 1;

  with dag as (
    select datum, sum(kcal_punt) as kcal, sum(eiwit_g) as eiwit
      from kal_regels where gebruiker_id = p_gebruiker
       and datum between v_start and v_eind - 1
     group by datum)
  select avg(kcal) filter (where kcal >= 1200), stddev_samp(kcal) filter (where kcal >= 1200),
         count(*) filter (where kcal >= 1200), count(*) filter (where kcal < 1200),
         avg(eiwit)
    into gem_inname, sd_inname, n_inname, gemarkeerd, gem_eiwit from dag;

  select avg(stappen) into gem_stappen from kal_dagen
   where gebruiker_id = p_gebruiker and datum between v_start and v_eind and stappen is not null;

  select count(*) into gaten from generate_series(v_eind - 7, v_eind - 1, '1 day') g(d)
   where not exists (select 1 from kal_regels r where r.gebruiker_id = p_gebruiker and r.datum = g.d);

  gewicht := coalesce(gewicht, 0);
  if lengte is null or gewicht = 0 then return jsonb_build_object('bruikbaar', false, 'reden', 'profiel of gewicht ontbreekt'); end if;

  rust := round(10*gewicht + 6.25*lengte - 5*leeftijd + case when geslacht='m' then 5 else -161 end);
  pal_h := case when gem_stappen is null then 1.60 else least(1.70, 1.40 + gem_stappen/22000) end;
  eiwit_ref := least(gewicht, 30*(lengte/100)*(lengte/100));

  if n >= 7 and n_inname >= 7 and helling is not null then
    tdee := gem_inname - helling*7700;
    half := greatest(100, 1.96*sqrt(power(coalesce(se,0.05)*7700,2)
            + power(coalesce(sd_inname,150)/sqrt(n_inname),2)));
    doel := greatest(rust, round((tdee - (tempo/100)*gewicht*7700/7)/10)*10);
  end if;

  return jsonb_build_object(
    'bruikbaar', true, 'venster', p_venster, 'tot', v_eind,
    'gewicht', gewicht, 'doel_gewicht', doelgew, 'bmi', round(gewicht/((lengte/100)*(lengte/100)), 1),
    'wegingen', n, 'helling_kg_week', round(coalesce(helling,0)*7, 3),
    'helling_pct_week', case when gewicht>0 then round(coalesce(helling,0)*7/gewicht*100, 3) end,
    'se_helling', round(coalesce(se,0), 4),
    'gem_inname', round(coalesce(gem_inname,0)), 'sd_inname', round(coalesce(sd_inname,0)),
    'bruikbare_dagen', coalesce(n_inname,0), 'dagen_onder_1200', coalesce(gemarkeerd,0),
    'gaten_laatste_7', gaten,
    'gem_eiwit', round(coalesce(gem_eiwit,0)), 'eiwit_doel', round(eiwit_kg*eiwit_ref),
    'eiwit_referentiegewicht', round(eiwit_ref,1),
    'gem_stappen', round(coalesce(gem_stappen,0)),
    'rust_bmr', rust, 'prior_laag', round(rust*pal_l), 'prior_hoog', round(rust*pal_h),
    'tdee', case when tdee is not null then round(tdee) end,
    'tdee_laag', case when tdee is not null then round(tdee-half) end,
    'tdee_hoog', case when tdee is not null then round(tdee+half) end,
    'doel_kcal', doel,
    'te_snel', (helling is not null and gewicht>0 and helling*7/gewicht*100 < -1.0)
  );
end $function$
;

CREATE OR REPLACE FUNCTION public.kal_zoeken(p_token text, p_q text, p_limiet integer DEFAULT 25)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_id uuid;
  v_q  text;
  v_w  text[];
begin
  v_id := kal_sessie(p_token);
  v_q := lower(trim(coalesce(p_q, '')));
  if length(v_q) < 2 then
    return '{"nevo":[],"gerechten":[],"eigen":[],"maaltijden":[]}'::jsonb;
  end if;

  -- woorden van twee letters of meer, zonder de gebruikelijke vulwoorden
  select coalesce(array_agg(w), '{}') into v_w
  from unnest(string_to_array(
         regexp_replace(regexp_replace(v_q, '[^a-zà-ÿ0-9 ]', ' ', 'g'), '\s+', ' ', 'g'),
         ' ')) as w
  where length(w) >= 2
    and w not in ('met','van','de','het','een','in','uit','op','aan','bij',
                  'er','of','en','per','voor','zonder');
  if array_length(v_w, 1) is null then v_w := array[v_q]; end if;

  return jsonb_build_object(
    -- Eigen maaltijden eerst opgezocht, want ze staan in het scherm ook bovenaan:
    -- wie "tonijn" typt bedoelt zijn eigen salade en niet de tabel. Er wordt in de
    -- naam én in de onderdelen gezocht, zodat "paprika" hem ook vindt.
    'maaltijden', coalesce((
      select jsonb_agg(kal_maaltijd_een(m.id) order by m.favoriet desc, length(m.naam))
      from kal_recepten m
     where m.gebruiker_id = v_id
       and (select bool_and(
              lower(m.naam || ' ' || coalesce(
                (select string_agg(g.naam, ' ') from kal_recept_regels g where g.recept_id = m.id),
                '')) like '%' || w || '%')
            from unnest(v_w) w)), '[]'::jsonb),

    'nevo', coalesce((
      select jsonb_agg(jsonb_build_object(
               'nevo_code', z.nevo_code, 'naam', z.naam_nl, 'groep', z.groep,
               'kcal', z.energie_kcal_per_100g, 'eiwit_g', z.eiwit_g, 'vet_g', z.vet_g,
               'koolhydraat_g', z.koolhydraten_g, 'vezel_g', z.vezels_g))
      from kal_nevo_zoek(p_q, least(coalesce(p_limiet, 25), 50)) z), '[]'::jsonb),

    'gerechten', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', d.id, 'naam', d.name_nl, 'keuken', d.cuisine,
               'omschrijving', d.description_nl, 'porties', d.default_servings,
               'status', d.validation_status))
      from (select * from cultural_dishes
             where owner_patient_id is null
               and (select bool_and(lower(coalesce(name_nl,'') || ' ' ||
                                          coalesce(description_nl,'') || ' ' ||
                                          coalesce(cuisine,'')) like '%' || w || '%')
                      from unnest(v_w) w)
             order by length(coalesce(name_nl,'')) limit 15) d), '[]'::jsonb),

    'eigen', coalesce((
      select jsonb_agg(to_jsonb(x))
      from (select * from kal_producten
             where gebruiker_id = v_id
               and (select bool_and(lower(naam) like '%' || w || '%') from unnest(v_w) w)
             order by length(naam) limit 15) x), '[]'::jsonb)
  );
end $function$
;

CREATE OR REPLACE FUNCTION public.oefenapp_ch_create(p_code text, p_data jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare c text := lower(trim(p_code));
begin
  if length(c) < 4 then return json_build_object('error','code te kort'); end if;
  if exists(select 1 from public.oefenapp_challenges where code=c) then return json_build_object('error','bestaat al'); end if;
  -- lichte opruiming: verwijder uitdagingen ouder dan 30 dagen
  delete from public.oefenapp_challenges where created_at < now() - interval '30 days';
  insert into public.oefenapp_challenges(code, data) values (c, coalesce(p_data,'{}'::jsonb));
  return json_build_object('ok',true,'code',c);
end $function$
;

CREATE OR REPLACE FUNCTION public.oefenapp_ch_get(p_code text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r public.oefenapp_challenges; c text := lower(trim(p_code));
begin
  select * into r from public.oefenapp_challenges where code=c;
  if not found then return json_build_object('error','Uitdaging niet gevonden.'); end if;
  return json_build_object('ok',true,'data',r.data,'friend',r.friend);
end $function$
;

CREATE OR REPLACE FUNCTION public.oefenapp_ch_submit(p_code text, p_friend jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare r public.oefenapp_challenges; c text := lower(trim(p_code));
begin
  select * into r from public.oefenapp_challenges where code=c;
  if not found then return json_build_object('error','Uitdaging niet gevonden.'); end if;
  if r.friend is not null then return json_build_object('ok',true,'data',r.data,'friend',r.friend,'already',true); end if;
  update public.oefenapp_challenges set friend=p_friend where code=c;
  return json_build_object('ok',true,'data',r.data,'friend',p_friend);
end $function$
;

CREATE OR REPLACE FUNCTION public.oefenapp_load(p_household text, p_pin text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare r public.oefenapp_state; h text := lower(trim(p_household));
begin
  select * into r from public.oefenapp_state where household=h;
  if not found then return json_build_object('error','Familiecode niet gevonden.'); end if;
  if r.pin_hash <> extensions.crypt(p_pin, r.pin_hash) then return json_build_object('error','Onjuiste pincode.'); end if;
  return json_build_object('ok',true,'data',r.data,'updated_at',r.updated_at);
end $function$
;

CREATE OR REPLACE FUNCTION public.oefenapp_register(p_household text, p_pin text, p_data jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare h text := lower(trim(p_household));
begin
  if length(h) < 3 then return json_build_object('error','Naam/code is te kort (minstens 3 tekens).'); end if;
  if length(p_pin) < 4 then return json_build_object('error','Wachtwoord moet minstens 4 tekens zijn.'); end if;
  if exists(select 1 from public.oefenapp_state where household=h) then
    return json_build_object('error','Deze naam/code bestaat al. Kies een andere of log in.'); end if;
  insert into public.oefenapp_state(household, pin_hash, data)
    values (h, extensions.crypt(p_pin, extensions.gen_salt('bf')), coalesce(p_data,'{}'::jsonb));
  return json_build_object('ok',true,'created',true);
end $function$
;

CREATE OR REPLACE FUNCTION public.oefenapp_save(p_household text, p_pin text, p_data jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare r public.oefenapp_state; h text := lower(trim(p_household)); u timestamptz;
begin
  select * into r from public.oefenapp_state where household=h;
  if not found then return json_build_object('error','Familiecode niet gevonden.'); end if;
  if r.pin_hash <> extensions.crypt(p_pin, r.pin_hash) then return json_build_object('error','Onjuiste pincode.'); end if;
  update public.oefenapp_state set data=coalesce(p_data,'{}'::jsonb), updated_at=now()
    where household=h returning updated_at into u;
  return json_build_object('ok',true,'updated_at',u);
end $function$
;

comment on table public.cultural_dishes is 'Gerechtenbibliotheek. owner_patient_id NULL = gevalideerd basisrecept, gevuld = persoonlijke variant.';
comment on table public.kal_koppelingen is 'Sleutels waarmee een telefoon of dienst bewegingsgegevens mag insturen. De sleutel zelf staat er niet in, alleen de sha256 ervan.';
comment on table public.kal_modelstand is 'Wat de rekenkern in de app het laatst uitrekende. Een postbus, geen tweede model.';
comment on table public.kal_recept_regels is 'De onderdelen van een eigen maaltijd, als momentopname van gelogde regels — met band.';
comment on table public.nevo_foods is 'Permanente spiegel van het Nederlands Voedingsstoffenbestand. Geen cache: NEVO is een download, geen API-respons, en kent daarom geen TTL.';
comment on table public.nevo_versies is 'Versiebeheer NEVO. Een versie kan pas actief worden nadat de licentievoorwaarden zijn gecontroleerd en vastgelegd.';
comment on table public.oefenapp_state is 'Bennahuiswerk oefenapp: cross-device opslag per huishouden (familiecode + pincode). Toegang uitsluitend via edge function oefenapp met service role. Geïsoleerd van de rest van het project.';
comment on table public.voeding_portiematen is 'Huishoudmaten per NEVO-groep. Iedereen die is ingelogd leest ze; alleen een zorgverlener past ze aan of vinkt ze af. De check portiemaat_controle_heeft_afzender eist bij dat vinkje wie en wanneer.';
comment on column public.cultural_dishes.names is 'Alternatieve namen per taal als jsonb. Sleutels: nl, darija_lat, darija_ar, tarifit_lat, ar, tr, srn.';
comment on column public.dish_ingredients.external_food_id is 'ID bij de externe leverancier. Bij FatSecret is food_id storable indefinitely; de voedingswaarden zelf niet.';
comment on column public.dish_ingredients.absorbed_fraction is 'Deel van het bereidingsvet dat in de gegeten portie belandt. 1.00 bij stoven, circa 0.08-0.15 bij frituren.';
comment on column public.dish_ingredients.mapping_status is 'ai_voorstel = door het model voorgesteld, nog niet gezien. bevestigd = een mens vond de koppeling goed. aangepast = een mens heeft hem gewijzigd. afgekeurd = deugt niet, zie mapping_opmerking.';
comment on column public.dish_ingredients.mapping_big_nummer is 'BIG-registratie van de beoordelaar. Optioneel: een dietist zonder account kan ook beoordelen, maar dan is dit het enige spoor naar wie het was.';
comment on column public.dish_portions.measurement_basis is 'Herkomst van de gramschatting: weighed (gewogen), estimated (dietist), literature (bron).';
comment on column public.kal_recepten.favoriet is 'Handmatig gezet: deze maaltijd staat bovenaan in de lijst en in het zoekveld.';
comment on column public.nevo_foods.synoniem_nevo is 'Letterlijk het Synoniem-veld uit het NEVO-bestand. Niet wijzigen: de licentie staat alleen ongewijzigd gebruik toe.';
comment on column public.nevo_foods.synoniemen_afgeleid is 'Door ons gegenereerde zoekvarianten. Aanvulling op NEVO, bewust apart gehouden zodat herkenbaar blijft wat van het RIVM komt.';
comment on column public.nevo_foods.overige_nutrienten is 'De circa 130 micronutrienten die de applicatie niet in een query gebruikt. De zeven die dat wel doen staan als kolom.';
comment on column public.voeding_portiematen.meervoud is 'Meervoudsvorm voor de weergave. Nederlands kent geen regel die dit afleidt.';
comment on column public.voeding_portiematen.gecontroleerd_door is 'Wie deze maat heeft nagekeken. Verplicht zodra gecontroleerd_door_dietist aan staat.';
comment on column public.voeding_portiematen.gecontroleerd_op is 'Wanneer die controle was. Een maat die vijf jaar geleden is nagekeken is iets anders dan een van vorige maand.';

alter table public.bennahub_gezin enable row level security;
revoke all on table public.bennahub_gezin from anon, authenticated;
alter table public.bennahub_leden enable row level security;
revoke all on table public.bennahub_leden from anon, authenticated;
alter table public.bennahub_state enable row level security;
revoke all on table public.bennahub_state from anon, authenticated;
alter table public.cultural_dishes enable row level security;
revoke all on table public.cultural_dishes from anon, authenticated;
alter table public.dish_ingredients enable row level security;
revoke all on table public.dish_ingredients from anon, authenticated;
alter table public.dish_portions enable row level security;
revoke all on table public.dish_portions from anon, authenticated;
alter table public.kal_ai_log enable row level security;
revoke all on table public.kal_ai_log from anon, authenticated;
alter table public.kal_beweging_peilingen enable row level security;
revoke all on table public.kal_beweging_peilingen from anon, authenticated;
alter table public.kal_config enable row level security;
revoke all on table public.kal_config from anon, authenticated;
alter table public.kal_dagen enable row level security;
revoke all on table public.kal_dagen from anon, authenticated;
alter table public.kal_gebruikers enable row level security;
revoke all on table public.kal_gebruikers from anon, authenticated;
alter table public.kal_koppelingen enable row level security;
revoke all on table public.kal_koppelingen from anon, authenticated;
alter table public.kal_labs enable row level security;
revoke all on table public.kal_labs from anon, authenticated;
alter table public.kal_metingen enable row level security;
revoke all on table public.kal_metingen from anon, authenticated;
alter table public.kal_modelstand enable row level security;
revoke all on table public.kal_modelstand from anon, authenticated;
alter table public.kal_prikkel_log enable row level security;
revoke all on table public.kal_prikkel_log from anon, authenticated;
alter table public.kal_producten enable row level security;
revoke all on table public.kal_producten from anon, authenticated;
alter table public.kal_profiel enable row level security;
revoke all on table public.kal_profiel from anon, authenticated;
alter table public.kal_recept_regels enable row level security;
revoke all on table public.kal_recept_regels from anon, authenticated;
alter table public.kal_recepten enable row level security;
revoke all on table public.kal_recepten from anon, authenticated;
alter table public.kal_regels enable row level security;
revoke all on table public.kal_regels from anon, authenticated;
alter table public.kal_sessies enable row level security;
revoke all on table public.kal_sessies from anon, authenticated;
alter table public.kal_training enable row level security;
revoke all on table public.kal_training from anon, authenticated;
alter table public.kal_vragenlijsten enable row level security;
revoke all on table public.kal_vragenlijsten from anon, authenticated;
alter table public.nevo_foods enable row level security;
revoke all on table public.nevo_foods from anon, authenticated;
alter table public.nevo_versies enable row level security;
revoke all on table public.nevo_versies from anon, authenticated;
alter table public.oefenapp_challenges enable row level security;
revoke all on table public.oefenapp_challenges from anon, authenticated;
alter table public.oefenapp_state enable row level security;
revoke all on table public.oefenapp_state from anon, authenticated;
alter table public.voeding_portiematen enable row level security;
revoke all on table public.voeding_portiematen from anon, authenticated;

revoke all on public.nevo_actief from anon, authenticated;

grant execute on function public.bennahub_accounts(p_app text) to anon, authenticated;
grant execute on function public.bennahub_fotos(p_gezin text, p_naam text, p_code text) to anon, authenticated;
grant execute on function public.bennahub_gezin_start(p_gezin text, p_wachtwoord text, p_leden jsonb) to anon, authenticated;
grant execute on function public.bennahub_gezin_wachtwoord(p_gezin text, p_oud text, p_nieuw text) to anon, authenticated;
grant execute on function public.bennahub_leden_lijst(p_gezin text) to anon, authenticated;
grant execute on function public.bennahub_lid_aanmelden(p_gezin text, p_naam text, p_code text) to anon, authenticated;
grant execute on function public.bennahub_lid_code(p_gezin text, p_naam text, p_oud text, p_nieuw text) to anon, authenticated;
grant execute on function public.bennahub_lid_foto(p_gezin text, p_naam text, p_code text, p_foto text) to anon, authenticated;
grant execute on function public.bennahub_lid_geboren(p_gezin text, p_ouder_ww text, p_naam text, p_jaar integer) to anon, authenticated;
grant execute on function public.bennahub_lid_reset(p_gezin text, p_ouder_ww text, p_naam text) to anon, authenticated;
grant execute on function public.bennahub_lid_zet(p_gezin text, p_ouder_ww text, p_naam text, p_rol text, p_emoji text, p_kleur text, p_apps jsonb, p_actief boolean, p_volgorde integer) to anon, authenticated;
grant execute on function public.bennahub_load(p_app text, p_account text, p_pin text) to anon, authenticated;
grant execute on function public.bennahub_overzicht(p_gezin text, p_ouder_ww text) to anon, authenticated;
grant execute on function public.bennahub_register(p_app text, p_account text, p_pin text, p_data jsonb) to anon, authenticated;
grant execute on function public.bennahub_save(p_app text, p_account text, p_pin text, p_data jsonb) to anon, authenticated;
grant execute on function public.bennahub_wachtwoord(p_app text, p_account text, p_oud text, p_nieuw text) to anon, authenticated;
grant execute on function public.kal_aanmelden(p_account text, p_ww text) to anon, authenticated;
grant execute on function public.kal_afmelden(p_token text) to anon, authenticated;
grant execute on function public.kal_beweging_dag(p_sleutel text, p_datum text, p_stappen text, p_slaap_min text, p_slaap_uur text, p_slaap_sec text, p_actieve_energie_kcal text, p_fiets_min text, p_gewicht_kg text, p_gewicht_bron text, p_dagen_terug text, p_hartslag_rust text) to anon, authenticated;
grant execute on function public.kal_beweging_ontvangen(p_sleutel text, p_dagen jsonb) to anon, authenticated;
grant execute on function public.kal_dag_zetten(p_token text, p_datum date, p_patch jsonb) to anon, authenticated;
grant execute on function public.kal_dagen_importeren(p_token text, p_dagen jsonb) to anon, authenticated;
grant execute on function public.kal_dagstand(p_gebruiker uuid) to anon, authenticated;
grant execute on function public.kal_gerecht(p_token text, p_dish_id uuid) to anon, authenticated;
grant execute on function public.kal_getal(p_tekst text) to anon, authenticated;
grant execute on function public.kal_koppeling_maken(p_token text, p_naam text) to anon, authenticated;
grant execute on function public.kal_koppeling_wissen(p_token text, p_id uuid) to anon, authenticated;
grant execute on function public.kal_koppelingen_lijst(p_token text) to anon, authenticated;
grant execute on function public.kal_maaltijd_bewaren(p_token text, p_naam text, p_toelichting text, p_porties numeric, p_regels jsonb) to anon, authenticated;
grant execute on function public.kal_maaltijd_favoriet(p_token text, p_id uuid, p_aan boolean) to anon, authenticated;
grant execute on function public.kal_maaltijd_wissen(p_token text, p_id uuid) to anon, authenticated;
grant execute on function public.kal_maaltijden(p_token text) to anon, authenticated;
grant execute on function public.kal_modelstand_zetten(p_token text, p_doel_kcal numeric, p_eiwit_doel_g numeric, p_tdee_laag numeric, p_tdee_hoog numeric, p_zekerheid text) to anon, authenticated;
grant execute on function public.kal_ophalen(p_token text, p_vanaf date) to anon, authenticated;
grant execute on function public.kal_portiematen(p_token text, p_nevo_code text) to anon, authenticated;
grant execute on function public.kal_prikkel_bouwen(p_soort text) to anon, authenticated;
grant execute on function public.kal_prikkel_gelogd(p_gebruiker uuid, p_soort text, p_onderwerp text, p_gelukt boolean, p_fout text) to anon, authenticated;
grant execute on function public.kal_profiel_zetten(p_token text, p_patch jsonb) to anon, authenticated;
grant execute on function public.kal_regel_wissen(p_token text, p_id uuid) to anon, authenticated;
grant execute on function public.kal_regels_toevoegen(p_token text, p_regels jsonb) to anon, authenticated;
grant execute on function public.kal_registreren(p_account text, p_ww text, p_naam text) to anon, authenticated;
grant execute on function public.kal_rij_toevoegen(p_token text, p_tabel text, p_rij jsonb) to anon, authenticated;
grant execute on function public.kal_rij_wissen(p_token text, p_tabel text, p_id uuid) to anon, authenticated;
grant execute on function public.kal_sessie(p_token text) to anon, authenticated;
grant execute on function public.kal_weekcijfers(p_gebruiker uuid, p_venster integer) to anon, authenticated;
grant execute on function public.kal_zoeken(p_token text, p_q text, p_limiet integer) to anon, authenticated;
grant execute on function public.oefenapp_ch_create(p_code text, p_data jsonb) to anon, authenticated;
grant execute on function public.oefenapp_ch_get(p_code text) to anon, authenticated;
grant execute on function public.oefenapp_ch_submit(p_code text, p_friend jsonb) to anon, authenticated;
grant execute on function public.oefenapp_load(p_household text, p_pin text) to anon, authenticated;
grant execute on function public.oefenapp_register(p_household text, p_pin text, p_data jsonb) to anon, authenticated;
grant execute on function public.oefenapp_save(p_household text, p_pin text, p_data jsonb) to anon, authenticated;

revoke all on function public.kal_prikkel_bouwen(text) from anon, authenticated;
revoke all on function public.kal_prikkel_gelogd(uuid, text, text, boolean, text) from anon, authenticated;
