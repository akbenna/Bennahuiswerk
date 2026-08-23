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
    update kal_dagen d set
      stappen              = coalesce(nullif(v_rij->>'stappen','')::integer, d.stappen),
      actieve_energie_kcal = coalesce(nullif(v_rij->>'actieve_energie_kcal','')::integer,
                                      d.actieve_energie_kcal),
      slaap_min            = coalesce(nullif(v_rij->>'slaap_min','')::integer, d.slaap_min),
      fiets_min            = coalesce(nullif(v_rij->>'fiets_min','')::integer, d.fiets_min),
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
