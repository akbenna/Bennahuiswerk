-- =============================================================================
-- EIGEN MAALTIJDEN — een samengesteld gerecht één keer invoeren
--
-- Toegepast 24 augustus 2026.
--
-- Het probleem in één zin: een tonijnsalade is één gerecht en zeven producten.
-- Wie hem logt zoekt zeven keer in NEVO, kiest zeven keer een portie, en doet
-- dat elke keer opnieuw — met elke keer een net iets ander antwoord. Dat is
-- geen luiheid maar een meetfout: dezelfde salade hoort niet de ene dag 690 en
-- de andere dag 810 kcal te zijn omdat je een andere tomaat aanklikte.
--
-- De oplossing is de gewone: sla op wat je al eens hebt uitgezocht, en log het
-- daarna als één regel. Niet als zeven regels, en dat is een keuze:
--
--   * In het dagoverzicht is één salade één regel. Zeven regels zijn zeven
--     keer scrollen voor iets wat je als één ding gegeten hebt.
--   * De coach stelt voor uit wat je eerder at. Met losse onderdelen stelt hij
--     "olijfolie, 40 gram" voor als tussendoortje. Dat is geen tussendoortje.
--   * De onderdelen zijn niet weg: ze staan in het recept, en de gelogde regel
--     wijst er met `recept_id` naar terug.
--
-- WAT DEZE TABELLEN AL WAREN
--
-- `kal_recepten` en `kal_recept_regels` stonden er al, leeg, sinds de eerste
-- opzet. Ze waren bedoeld voor een model dat er nooit gekomen is: een recept
-- waarin het bereidingsvet mee zou schalen met de profielinstelling
-- (`is_bereidingsvet`, `opgenomen_deel`, `profiel_sleutel`, en de voedingswaarde
-- per 100 gram). Nul rijen, nul functies, nul aanroepen.
--
-- Wat hier gebeurt is dus geen tweede concept naast het eerste maar het invullen
-- van het eerste. `kal_recepten` blijft precies zoals hij was. `kal_recept_regels`
-- krijgt de vorm die hij nodig heeft: een momentopname van een gelogde regel,
-- inclusief de band. Dat laatste is de reden dat de oude kolommen niet voldeden
-- — per 100 gram is geen band, en een getal zonder band is in deze app een fout.
--
-- Rijen gaan hierbij niet verloren; de tabel was leeg. Dat is nagekeken vóór
-- het uitvoeren, niet aangenomen.
--
-- WAT ER EXPRES NIET GEBEURT
--
-- `kal_regels.recept_id` heeft geen refererende sleutel naar `kal_recepten`, en
-- dat blijft zo. Een maaltijd weggooien mag nooit de geschiedenis raken waarin
-- je hem gegeten hebt: wat je op 12 augustus at is gebeurd, ook als je het
-- recept in september weggooit. De verwijzing is een spoor, geen band.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- De regels van een maaltijd: een momentopname van wat je gelogd had.
-- -----------------------------------------------------------------------------
alter table public.kal_recept_regels
  drop column if exists profiel_sleutel,
  drop column if exists kcal_per_100,
  drop column if exists eiwit_per_100,
  drop column if exists vet_per_100,
  drop column if exists koolh_per_100,
  drop column if exists is_bereidingsvet,
  drop column if exists opgenomen_deel,
  drop column if exists onzekerheid;

alter table public.kal_recept_regels
  add column if not exists gram_equivalent     numeric,
  add column if not exists kcal_punt           numeric not null default 0,
  add column if not exists kcal_laag           numeric,
  add column if not exists kcal_hoog           numeric,
  add column if not exists eiwit_g             numeric,
  add column if not exists vet_g               numeric,
  add column if not exists koolhydraat_g       numeric,
  add column if not exists vezel_g             numeric,
  add column if not exists onzekerheidsbronnen text[],
  add column if not exists bron                text not null default 'handmatig';

alter table public.kal_recept_regels alter column kcal_punt drop default;

comment on table public.kal_recept_regels is
  'De onderdelen van een eigen maaltijd, als momentopname van gelogde regels — met band.';

alter table public.kal_recept_regels enable row level security;
alter table public.kal_recepten      enable row level security;

-- -----------------------------------------------------------------------------
-- Eén maaltijd als jsonb. Intern; de app komt hier via de twee functies eronder.
-- -----------------------------------------------------------------------------
create or replace function public.kal_maaltijd_een(p_recept uuid)
returns jsonb
language sql
stable
security definer
set search_path to 'public', 'extensions'
as $$
  select jsonb_build_object(
    'id', m.id,
    'naam', m.naam,
    'toelichting', m.toelichting,
    'porties', m.porties,
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
$$;

-- -----------------------------------------------------------------------------
-- Een maaltijd bewaren.
--
-- Dezelfde naam nog een keer bewaren vervangt de vorige. Dat is wat je bedoelt
-- als je je salade opnieuw opslaat nadat je de olie een keer gewogen hebt; twee
-- maaltijden met dezelfde naam in één lijst is geen keuze maar een raadsel.
-- De vergelijking gaat op de genormaliseerde naam, want "Tonijnsalade" en
-- "tonijnsalade " zijn hetzelfde gerecht.
-- -----------------------------------------------------------------------------
create or replace function public.kal_maaltijd_bewaren(
  p_token       text,
  p_naam        text,
  p_toelichting text,
  p_porties     numeric,
  p_regels      jsonb
) returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_id      uuid;
  v_recept  uuid;
  v_naam    text := btrim(coalesce(p_naam, ''));
  v_porties numeric := coalesce(p_porties, 1);
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

  delete from kal_recepten
   where gebruiker_id = v_id
     and lower(btrim(naam)) = lower(v_naam);

  insert into kal_recepten(gebruiker_id, naam, toelichting, porties, volgt_profiel)
  values (v_id, v_naam, nullif(btrim(coalesce(p_toelichting, '')), ''), v_porties, false)
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
end $$;

-- -----------------------------------------------------------------------------
-- Alle maaltijden van deze gebruiker, met hun onderdelen.
-- -----------------------------------------------------------------------------
create or replace function public.kal_maaltijden(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public', 'extensions'
as $$
declare v_id uuid;
begin
  v_id := kal_sessie(p_token);
  return coalesce((
    select jsonb_agg(kal_maaltijd_een(m.id) order by m.naam)
      from kal_recepten m
     where m.gebruiker_id = v_id), '[]'::jsonb);
end $$;

-- -----------------------------------------------------------------------------
-- Een maaltijd weggooien. De regels gaan mee (cascade); de geschiedenis niet.
-- -----------------------------------------------------------------------------
create or replace function public.kal_maaltijd_wissen(p_token text, p_id uuid)
returns integer
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare v_id uuid; v_weg integer;
begin
  v_id := kal_sessie(p_token);
  delete from kal_recepten where id = p_id and gebruiker_id = v_id;
  get diagnostics v_weg = row_count;
  return v_weg;
end $$;

comment on function public.kal_maaltijd_bewaren(text, text, text, numeric, jsonb) is
  'Bewaart een samengestelde maaltijd; dezelfde naam vervangt de vorige.';
comment on function public.kal_maaltijden(text) is
  'Alle eigen maaltijden met hun onderdelen, op naam gesorteerd.';
comment on function public.kal_maaltijd_wissen(text, uuid) is
  'Gooit een eigen maaltijd weg. Raakt de gelogde geschiedenis niet.';

revoke all on function public.kal_maaltijd_een(uuid) from public, anon, authenticated;
grant execute on function public.kal_maaltijd_bewaren(text, text, text, numeric, jsonb) to anon, authenticated;
grant execute on function public.kal_maaltijden(text) to anon, authenticated;
grant execute on function public.kal_maaltijd_wissen(text, uuid) to anon, authenticated;
