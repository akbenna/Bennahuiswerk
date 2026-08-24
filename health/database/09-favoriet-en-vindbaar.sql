-- =============================================================================
-- EEN MAALTIJD DIE JE TERUGVINDT
--
-- Toegepast 24 augustus 2026.
--
-- Bestand 07 maakte eigen maaltijden mogelijk. Er ontbraken twee dingen die je
-- pas merkt als je ze gebruikt.
--
-- HET STERRETJE
--
-- Een lijst op alfabet is een lijst waarin je zoekt. Wie twee of drie gerechten
-- bewaart merkt dat niet; wie er vijftien heeft wel. Het sterretje is de
-- goedkoopste sortering die er is: jij zegt wat er bovenaan hoort, in plaats
-- van dat de app het afleidt uit hoe vaak je iets gegeten hebt — want dat laatste
-- straft precies het gerecht af dat je nét bewaard hebt.
--
-- Bij het opnieuw bewaren onder dezelfde naam blijft het sterretje staan. Anders
-- verlies je het elke keer dat je de olie eindelijk gewogen hebt, en dat is nu
-- juist het moment waarop je het gerecht het meest gebruikt.
--
-- HET ZOEKVELD
--
-- Dit is de belangrijkste van de twee. Wie "tonijn" typt zoekt niet naar de
-- vierentwintig tonijnregels van NEVO maar naar zíjn tonijnsalade — en die stond
-- er niet tussen, want kal_zoeken keek in NEVO, in de gerechtenbibliotheek en in
-- de eigen producten, en niet in de eigen maaltijden. Het gevolg was een app die
-- het antwoord al had en het niet liet zien.
--
-- Er wordt gezocht in de naam én in de namen van de onderdelen. Dat is meer dan
-- het lijkt: "paprika" vindt zo de tonijnsalade waar paprika in zit, ook al
-- staat dat woord nergens in de titel. Dat is precies waar een samengesteld
-- gerecht zich anders gedraagt dan een product.
--
-- kal_zoeken stond nog niet in dit verslag. De volledige functie staat daarom
-- hieronder en niet alleen de wijziging: een half opgeschreven functie is geen
-- verslag maar een aantekening. Het enige dat eraan veranderd is, is de vierde
-- sleutel `maaltijden`; de rest is overgenomen uit prosrc van 24 augustus 2026.
-- =============================================================================

alter table public.kal_recepten
  add column if not exists favoriet boolean not null default false;

comment on column public.kal_recepten.favoriet is
  'Handmatig gezet: deze maaltijd staat bovenaan in de lijst en in het zoekveld.';

-- -----------------------------------------------------------------------------
-- Eén maaltijd als jsonb. Nu met het sterretje erbij.
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
$$;

-- -----------------------------------------------------------------------------
-- Alle maaltijden: favorieten eerst, daarbinnen op naam.
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
    select jsonb_agg(kal_maaltijd_een(m.id) order by m.favoriet desc, m.naam)
      from kal_recepten m
     where m.gebruiker_id = v_id), '[]'::jsonb);
end $$;

-- -----------------------------------------------------------------------------
-- Het sterretje omzetten.
-- -----------------------------------------------------------------------------
create or replace function public.kal_maaltijd_favoriet(
  p_token text, p_id uuid, p_aan boolean
) returns boolean
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare v_id uuid; v_uit boolean;
begin
  v_id := kal_sessie(p_token);
  update kal_recepten set favoriet = coalesce(p_aan, false)
   where id = p_id and gebruiker_id = v_id
  returning favoriet into v_uit;
  return coalesce(v_uit, false);
end $$;

-- -----------------------------------------------------------------------------
-- Bewaren, nu met behoud van het sterretje bij vervangen.
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
end $$;

-- -----------------------------------------------------------------------------
-- Zoeken, nu ook in je eigen maaltijden.
--
-- Volledig overgenomen uit prosrc van 24 augustus 2026, met één toevoeging: de
-- sleutel `maaltijden`. Alles daarboven en daaronder is ongewijzigd.
-- -----------------------------------------------------------------------------
create or replace function public.kal_zoeken(p_token text, p_q text, p_limiet integer default 25)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public', 'extensions'
as $$
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
end $$;

comment on function public.kal_maaltijd_favoriet(text, uuid, boolean) is
  'Zet het sterretje van een eigen maaltijd aan of uit.';

grant execute on function public.kal_maaltijd_favoriet(text, uuid, boolean) to anon, authenticated;
