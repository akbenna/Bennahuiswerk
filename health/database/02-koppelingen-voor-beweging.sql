-- =============================================================================
-- KOPPELSLEUTELS — bewegingsgegevens van buiten binnenlaten
--
-- Toegepast op 23 augustus 2026. Deze drie migraties staan hier zodat het
-- schema in de repo staat en niet alleen in Supabase; ze zijn daar al gedraaid.
--
-- Waarom een aparte sleutel en niet het sessietoken: het sessietoken verloopt,
-- en een koppeling die elke ochtend om zeven uur vuurt mag niet stilvallen
-- omdat je een week niet ingelogd bent. Deze sleutel verloopt niet en is per
-- koppeling in te trekken zonder dat je uitgelogd wordt.
--
-- Er staat een hash in de tabel en niet de sleutel zelf. Wie de database leest
-- kan er dus niets mee versturen. De sleutel is één keer te zien, bij het maken.
-- =============================================================================

create table if not exists kal_koppelingen (
  id                 uuid primary key default extensions.gen_random_uuid(),
  gebruiker_id       uuid not null references kal_gebruikers(id) on delete cascade,
  naam               text not null,
  sleutel_hash       text not null unique,
  -- De eerste tekens van de sleutel, zodat je in de lijst ziet wélke sleutel
  -- dit is zonder dat de sleutel zelf terug te lezen valt.
  sleutel_begin      text not null,
  aangemaakt_op      timestamptz not null default now(),
  laatst_gebruikt_op timestamptz,
  aantal_berichten   integer not null default 0,
  aantal_dagen       integer not null default 0,
  actief             boolean not null default true
);

create index if not exists kal_koppelingen_gebruiker on kal_koppelingen(gebruiker_id);

alter table kal_koppelingen enable row level security;
-- Geen enkele policy: alleen de security-definer-functies hieronder komen erbij.
-- Dat is dezelfde opzet als de rest van kal_*.

comment on table kal_koppelingen is
  'Sleutels waarmee een telefoon of dienst bewegingsgegevens mag insturen. '
  'De sleutel zelf staat er niet in, alleen de sha256 ervan.';

-- -----------------------------------------------------------------------------
-- Beheer: maken, opsommen, intrekken. Alle drie via het sessietoken van de app.
-- -----------------------------------------------------------------------------

create or replace function public.kal_koppeling_maken(p_token text, p_naam text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
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
end $$;

create or replace function public.kal_koppelingen_lijst(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_id uuid;
begin
  v_id := kal_sessie(p_token);
  return coalesce((
    select jsonb_agg(to_jsonb(k) - 'sleutel_hash' - 'gebruiker_id' order by k.aangemaakt_op)
      from kal_koppelingen k where k.gebruiker_id = v_id), '[]'::jsonb);
end $$;

-- Wissen en niet op non-actief zetten: een ingetrokken sleutel die blijft staan
-- nodigt uit om hem weer aan te zetten, en dan weet je niet meer waarom hij
-- eraf ging.
create or replace function public.kal_koppeling_wissen(p_token text, p_id uuid)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_id uuid; v_n integer;
begin
  v_id := kal_sessie(p_token);
  delete from kal_koppelingen where id = p_id and gebruiker_id = v_id;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

-- =============================================================================
-- BEWEGING ONTVANGEN
--
-- Eén ingang voor alles wat van buiten komt: Apple Gezondheid via een opdracht
-- op de telefoon, Garmin via Apple Gezondheid, of wat dan ook dat json kan
-- versturen.
--
-- De botsingsregels zijn de kern van deze functie en ze zijn niet symmetrisch:
--
--   stappen, actieve energie, slaap, fietsminuten  -> het toestel wint
--        Dit zijn metingen. Wat jij intikt is een herinnering, en een meting is
--        beter dan een herinnering.
--
--   gewicht                                        -> wat er staat wint
--        Precies andersom, en dat is geen slordigheid. Het model rekent op de
--        ochtendweging volgens protocol: nuchter, na het toilet, vóór het eten.
--        Een weegschaal die 's avonds met kleren aan een getal doorgeeft meet
--        iets anders. Die vult dus alleen lege dagen op en overschrijft nooit.
--
--   kracht, notitie                                -> nooit aangeraakt
--        Dat is een oordeel van jou en geen meting.
-- =============================================================================

create or replace function public.kal_beweging_ontvangen(p_sleutel text, p_dagen jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
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
    /* De omweg via numeric is er omdat Apple Gezondheid in kommagetallen rekent:
       "Bereken statistiek → Som" over de stappen van een dag levert 8421.0 op
       en niet 8421, en `'8421.0'::integer` weigert Postgres. Ronden en niet
       afkappen: 8421,6 stappen zijn er 8422. */
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
end $$;

revoke all on function public.kal_koppeling_maken(text, text)     from public;
revoke all on function public.kal_koppelingen_lijst(text)         from public;
revoke all on function public.kal_koppeling_wissen(text, uuid)    from public;
revoke all on function public.kal_beweging_ontvangen(text, jsonb) from public;
grant execute on function public.kal_koppeling_maken(text, text)     to anon, authenticated;
grant execute on function public.kal_koppelingen_lijst(text)         to anon, authenticated;
grant execute on function public.kal_koppeling_wissen(text, uuid)    to anon, authenticated;
grant execute on function public.kal_beweging_ontvangen(text, jsonb) to anon, authenticated;

-- =============================================================================
-- ÉÉN DAG INSTUREN, PLAT
--
-- Toegevoegd 23 augustus 2026, ook al toegepast.
--
-- `kal_beweging_ontvangen` neemt een lijst dagen. Dat is de juiste vorm voor een
-- inhaalslag, maar de verkeerde vorm voor een opdracht op een telefoon: de
-- Opdrachten-app kan een plat json-formulier invullen zonder één regel tekst,
-- maar een lijst van objecten moet je met de hand in een tekstveld bouwen en
-- daar variabelen in slepen. Dat is precies waar het misgaat.
--
-- Deze functie is die platte ingang. Hij rekent zelf niets uit: hij bouwt de
-- lijst en geeft hem door, zodat de botsingsregels op één plek blijven staan.
--
-- Drie dingen die hij extra doet, elk omdat ze anders stil misgaan:
--
--   1. Geen datum meegestuurd -> gisteren in Amsterdam. Een opdracht die
--      's ochtends vuurt gaat over de dag die net af is; vandaag is dan nog
--      bijna leeg. De gebruikte datum komt terug in het antwoord, zodat die
--      aanname zichtbaar is en niet geraden hoeft te worden.
--
--   2. Slaap mag in minuten, uren of seconden. Welke eenheid de Opdrachten-app
--      teruggeeft verschilt per manier van uitlezen, en wie seconden in het
--      minutenveld stopt logt 26.820 minuten slaap zonder het te merken.
--
--   3. Slaap buiten nul tot vierentwintig uur wordt niet weggeschreven maar
--      gemeld. Dat is altijd een verkeerde eenheid en nooit een nacht.
-- =============================================================================

create or replace function public.kal_beweging_dag(
  p_sleutel              text,
  p_datum                text    default null,
  p_stappen              numeric default null,
  p_slaap_min            numeric default null,
  p_slaap_uur            numeric default null,
  p_slaap_sec            numeric default null,
  p_actieve_energie_kcal numeric default null,
  p_fiets_min            numeric default null,
  p_gewicht_kg           numeric default null,
  p_gewicht_bron         text    default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_datum     date;
  v_slaap     numeric;
  v_genegeerd boolean := false;
  v_dag       jsonb;
  v_uit       jsonb;
begin
  v_datum := coalesce(
    nullif(trim(coalesce(p_datum, '')), '')::date,
    (now() at time zone 'Europe/Amsterdam')::date - 1);

  v_slaap := coalesce(p_slaap_min, p_slaap_uur * 60, p_slaap_sec / 60);
  if v_slaap is not null and (v_slaap < 0 or v_slaap > 1440) then
    v_slaap := null;
    v_genegeerd := true;
  end if;

  /* Alleen wat er werkelijk meekwam in de dag zetten. */
  v_dag := jsonb_build_object('datum', v_datum);
  if p_stappen              is not null then v_dag := v_dag || jsonb_build_object('stappen', p_stappen); end if;
  if v_slaap                is not null then v_dag := v_dag || jsonb_build_object('slaap_min', v_slaap); end if;
  if p_actieve_energie_kcal is not null then v_dag := v_dag || jsonb_build_object('actieve_energie_kcal', p_actieve_energie_kcal); end if;
  if p_fiets_min            is not null then v_dag := v_dag || jsonb_build_object('fiets_min', p_fiets_min); end if;
  if p_gewicht_kg           is not null then v_dag := v_dag || jsonb_build_object('gewicht_kg', p_gewicht_kg); end if;
  if p_gewicht_bron         is not null then v_dag := v_dag || jsonb_build_object('gewicht_bron', p_gewicht_bron); end if;

  v_uit := kal_beweging_ontvangen(p_sleutel, jsonb_build_array(v_dag));

  return v_uit
      || jsonb_build_object('datum', v_datum)
      || jsonb_build_object('slaap_genegeerd', v_genegeerd);
end $$;

revoke all on function public.kal_beweging_dag(
  text, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text) from public;
grant execute on function public.kal_beweging_dag(
  text, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text) to anon, authenticated;
