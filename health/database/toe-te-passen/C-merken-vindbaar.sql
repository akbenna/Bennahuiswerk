-- ===========================================================================
-- C. MERKPRODUCTEN VINDBAAR MAKEN
-- ===========================================================================
--
-- Nog niet toegepast. Draai dit ná B-merkproducten.sql.
--
-- B zette de tabellen neer; niets las ze. Dit maakt ze vindbaar, en verder
-- niets: zolang er geen bron actief is met een gecontroleerde licentie is
-- `merk_actief` leeg en verandert er niets aan de app.
--
-- WAAROM ONDERAAN
--
-- De emmer `merk` komt ná nevo, gerechten en eigen producten. Een etiketwaarde
-- is een opgave van de fabrikant met een wettelijke speelruimte van rond de
-- twintig procent; wat in NEVO staat is in een laboratorium bepaald. Die twee
-- door elkaar husselen zou de app laten doen alsof het hetzelfde soort getal is.
-- Het scherm toont ze dan ook apart, met een eigen teken.
--
-- DEZE TEKST IS AFGELEID EN NIET OVERGETYPT
--
-- `kal_zoeken` hieronder is de versie uit 12-telwoorden-uit-het-zoeken.sql — dus
-- mét de telwoorden in de vulwoordenlijst — met alleen de merk-emmer erbij. Zou
-- ik hem uit schema-gegenereerd.sql halen, dan draaide ik die correctie
-- stilletjes terug.


-- ---------------------------------------------------------------------------
-- BLOK 0 — EERST B, DAN DIT
-- ---------------------------------------------------------------------------
--
-- Dit bestand leunt op `merk_actief` uit B-merkproducten.sql. Draai je het los,
-- dan krijg je `type "public.merk_actief" does not exist` — een melding die
-- klopt maar niet zegt wat je eraan moet doen. Vandaar dit slot: het staat er
-- omdat een kop geen slot is.

do $$
begin
  if to_regclass('public.merk_actief') is null then
    raise exception
      'Draai eerst B-merkproducten.sql. De tabellen merk_bronnen en merk_producten bestaan nog niet, en zonder die twee heeft dit bestand niets om in te zoeken.';
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- BLOK 1 — ZOEKEN IN DE MERKPRODUCTEN
-- ---------------------------------------------------------------------------
--
-- Simpeler dan `kal_nevo_zoek`: geen woordweging, want deze tabel bevat
-- merknamen en die zoek je letterlijk. Wie "lidl roomboter" typt bedoelt precies
-- dat, en alle woorden moeten voorkomen.

CREATE OR REPLACE FUNCTION public.kal_merk_zoek(p_q text, p_limiet integer DEFAULT 15)
 RETURNS SETOF public.merk_actief
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with woorden as (
    select w from unnest(string_to_array(
      regexp_replace(regexp_replace(lower(trim(coalesce(p_q,''))),
                                    '[^a-zà-ÿ0-9 ]', ' ', 'g'), '\s+', ' ', 'g'), ' ')) w
     where length(w) >= 2
  )
  select m.* from merk_actief m
   where (select count(*) from woorden) > 0
     and (select bool_and(
            lower(m.naam || ' ' || coalesce(m.merk,'') || ' '
                  || coalesce(array_to_string(m.synoniemen, ' '), '')) like '%' || w || '%')
          from woorden)
   order by length(m.naam)
   limit least(coalesce(p_limiet, 15), 50);
$function$
;


-- ---------------------------------------------------------------------------
-- BLOK 2 — DE EMMER IN kal_zoeken
-- ---------------------------------------------------------------------------

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
                  'er','of','en','per','voor','zonder',
                    -- telwoorden: ruis in een voedingstabel, en soms erger dan ruis
                    'twee','drie','vier','vijf','zes','zeven','acht','negen','tien',
                    'wat','beetje','stukje','paar');
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
             order by length(naam) limit 15) x), '[]'::jsonb),

    -- Merkproducten uit `merk_actief`, dus achter de licentiepoort. Staat er
    -- geen actieve bron met gecontroleerde licentie, dan is deze emmer leeg en
    -- merkt de app er niets van. Zie B-merkproducten.sql.
    --
    -- Onderaan en niet bovenaan: een etiketwaarde is een opgave van de fabrikant
    -- en geen laboratoriumbepaling. Wat gemeten is hoort eerst te staan.
    'merk', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', x.id, 'barcode', x.barcode, 'naam', x.naam, 'merk', x.merk,
               'groep', x.groep, 'kcal', x.energie_kcal_per_100g,
               'eiwit_g', x.eiwit_g, 'vet_g', x.vet_g,
               'koolhydraat_g', x.koolhydraten_g, 'vezel_g', x.vezels_g,
               'verpakking_gram', x.verpakking_gram,
               'portie_gram', x.portie_gram, 'portie_naam', x.portie_naam))
      from (select * from merk_actief m
             where (select bool_and(
                      lower(m.naam || ' ' || coalesce(m.merk,'') || ' '
                            || coalesce(array_to_string(m.synoniemen, ' '), ''))
                      like '%' || w || '%')
                    from unnest(v_w) w)
             order by length(m.naam) limit 15) x), '[]'::jsonb)
  );
end $function$
;


-- ---------------------------------------------------------------------------
-- BLOK 3 — RECHTEN
-- ---------------------------------------------------------------------------
--
-- `kal_merk_zoek` is een hulpfunctie voor `kal_zoeken` en hoeft niet van buiten
-- aanroepbaar te zijn. `kal_zoeken` had zijn recht al; hij houdt het.

revoke all on function public.kal_merk_zoek(text, integer) from public, anon, authenticated;


-- ---------------------------------------------------------------------------
-- BLOK 4 — NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- Zolang de bron niet actief is hoort dit leeg te zijn. Dat is geen storing maar
-- de poort die doet wat hij moet doen.

select count(*) as zichtbare_merkproducten from merk_actief;
select count(*) as treffers from kal_merk_zoek('lidl');

-- En dat de rest onaangeroerd is: de vulwoordenlijst hoort de telwoorden nog te
-- bevatten, anders is de correctie uit bestand 12 teruggedraaid.
select (regexp_match(prosrc, 'not in \(([^)]*)\)'))[1] ~ 'twee' as telwoorden_nog_aanwezig
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'kal_zoeken';
