-- ===========================================================================
-- C. TELWOORDEN UIT HET ZOEKEN
-- ===========================================================================
--
-- Nog niet toegepast. Zie de kop van bestand A.
--
-- WAT ER MIS IS
--
-- Typ "twee boterhammen met mayonaise" in het zoekveld en bovenaan verschijnt
-- een Graanreep Hero B'tween. Dat is geen toeval.
--
-- De zoekregel voor woorden van vier letters of minder is "begin van een
-- woord". Voor Postgres begint achter een apostrof een nieuw woord, dus in
-- `b'tween` begint op de t een woord, en `twee` past daarop. Het telwoord uit
-- jouw zin trekt zo een graanreep omhoog — en omdat "twee" in bijna geen
-- product voorkomt krijgt het een hoog gewicht, want zeldzame woorden wegen
-- zwaar. Het staat dus niet ergens onderaan maar vooraan.
--
-- Hier nagedaan op de echte functie, met de vier producten uit dat scherm in een
-- lege database: `kal_nevo_zoek('twee')` geeft één treffer, en dat is de
-- graanreep.
--
-- DE OPLOSSING
--
-- Telwoorden dragen geen betekenis in een voedingsmiddelentabel. "een" stond al
-- in de lijst met vulwoorden; twee tot en met tien horen daar net zo goed in,
-- net als "wat", "beetje", "stukje" en "paar". Dezelfde ingreep, alleen vergeten
-- toen die lijst gemaakt werd.
--
-- Wat er NIET in gaat: "half" en "halve". Die lijken vulwoorden maar zijn het
-- niet — halfvolle melk en halvarine zijn er anders niet meer mee te vinden.
--
-- WAT DIT NIET OPLOST
--
-- "boterhammen" vindt nog steeds niets, want NEVO kent alleen "brood". Dat is
-- een synoniemgat en geen zoekfout; daar is blok 3 van bestand A voor.
--
-- WAAR DEZE TEKST VANDAAN KOMT
--
-- Niet overgetypt. De twee functies hieronder zijn letterlijk overgenomen uit
-- `gereedschap/verhuizing/schema-gegenereerd.sql`, het verslag van wat er bij de
-- verhuizing is toegepast, met alleen de vulwoordenlijst uitgebreid. Overtypen
-- is precies hoe er stilletjes iets verandert.


-- ---------------------------------------------------------------------------
-- BLOK 1 — EERST KIJKEN OF DE LIJST ER NOG ZO UITZIET. Verandert niets.
-- ---------------------------------------------------------------------------
--
-- Staat er in de database een andere versie dan in de repo, dan zou blok 2 die
-- overschrijven zonder dat iemand het merkt. Deze vraag toont de vulwoordenlijst
-- zoals hij nu draait: hij hoort op 'zonder' te eindigen en de telwoorden nog
-- niet te bevatten.

select p.proname,
       (regexp_match(p.prosrc, 'not in \(([^)]*)\)'))[1] as vulwoorden_nu
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('kal_nevo_zoek','kal_zoeken')
order by p.proname;

-- En hoe het nu zoekt. Onthoud dit; blok 3 stelt dezelfde vraag.
select 'twee' as term, count(*) as treffers from kal_nevo_zoek('twee', 10)
union all select 'twee boterhammen met mayonaise', count(*)
            from kal_nevo_zoek('twee boterhammen met mayonaise', 10);


-- ---------------------------------------------------------------------------
-- BLOK 2 — DE TWEE FUNCTIES OPNIEUW, MET DE LANGERE LIJST
-- ---------------------------------------------------------------------------

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
                    'er','of','en','per','voor','zonder',
                    -- telwoorden: ruis in een voedingstabel, en soms erger dan ruis
                    'twee','drie','vier','vijf','zes','zeven','acht','negen','tien',
                    'wat','beetje','stukje','paar')
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
             order by length(naam) limit 15) x), '[]'::jsonb)
  );
end $function$
;


-- ---------------------------------------------------------------------------
-- BLOK 3 — NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- 'twee' hoort nu nul treffers te geven, en de hele zin alleen nog mayonaise.
-- Is dat zo, dan is de graanreep weg.

select 'twee' as term, count(*) as treffers from kal_nevo_zoek('twee', 10)
union all select 'twee boterhammen met mayonaise', count(*)
            from kal_nevo_zoek('twee boterhammen met mayonaise', 10);

select nevo_code, naam_nl, groep from kal_nevo_zoek('twee boterhammen met mayonaise', 10);

-- En wat gewoon moet blijven werken. Deze vier horen alle vier boven nul te
-- staan; 'halfvolle melk' en 'halvarine' zijn er met opzet bij, want daar zou
-- een te gretige vulwoordenlijst als eerste op stuklopen.
select 'mayonaise' as term, count(*) from kal_nevo_zoek('mayonaise', 20)
union all select 'halfvolle melk', count(*) from kal_nevo_zoek('halfvolle melk', 20)
union all select 'halvarine',      count(*) from kal_nevo_zoek('halvarine', 20)
union all select 'tonijn',         count(*) from kal_nevo_zoek('tonijn', 20);

-- Terugdraaien: draai de twee functies opnieuw uit
-- gereedschap/verhuizing/schema-gegenereerd.sql.
