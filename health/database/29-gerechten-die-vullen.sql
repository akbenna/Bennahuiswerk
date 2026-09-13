-- =============================================================================
-- GERECHTEN DIE VULLEN — de verzadigingslijst krijgt er een bovenste helft bij
--
-- Nog niet toegepast.
--
-- WAT ER MISTE
--
-- Bestand 28 beantwoordt "waar heb ik genoeg aan" met producten uit de
-- voedingsmiddelentabel: champignons, heldere soep, linzen, bulgur. Bruikbaar
-- voor "wat neem ik erbij", en geen antwoord op de vraag die er onder lag —
-- iemand staat om zes uur te bedenken wat hij gaat kóken.
--
-- De gerechtenbibliotheek deed niet mee. Honderd gerechten over zes keukens, met
-- de hand aan NEVO gekoppeld, en precies het deel dat "iets wat in de smaak
-- valt" zou opleveren. Dat was geen ontwerpkeuze; het was er gewoon niet bij.
--
-- TWEE SOORTEN ANTWOORD, EN DUS TWEE LIJSTJES
--
-- Een gerecht en een opscheplepel champignons zijn niet hetzelfde soort ding. Ze
-- in één ranglijst zetten vergelijkt een maaltijd met een bijgerecht, en dan
-- verdringt de champignon het gerecht omdat hij per honderd kilocalorieën nu
-- eenmaal meer gram oplevert.
--
-- De functie geeft daarom twee soorten terug, elk met een eigen grens:
--
--     soort = 'gerecht'   wat je zou kunnen koken
--     soort = 'product'   wat je erbij kunt nemen
--
-- Dezelfde score, dezelfde eenheid, twee kolommen. Het scherm zet ze onder
-- elkaar met een kop erboven.
--
-- WAT DE METING OP DE BIBLIOTHEEK UITWEES
--
-- Dezelfde score als in bestand 28, toegepast op de zevenentwintig gerechten die
-- er bij het meten stonden:
--
--     Harira                          52 kcal/100 g   193 g per 100 kcal   61
--     Mercimek çorbası (linzensoep)   65               155                 56
--     Loubia (witte bonen)            89               112                 50
--     Kuru fasulye (witte bonen)      99               101                 48
--     Taktouka                        67               150                 43
--     Tanjia Marrakchia              156                64                 40
--     Zaalouk                         74               134                 39
--     Couscous m zeven groenten      100               100                 38
--     Kefta-tajine m ei en tomaat    131                77                 35
--     Bulgur pilavı                  131                77                 33
--
-- Dat is een uitslag die klopt met wat je zou verwachten en die ik niet gestuurd
-- heb: de soepen en de bonenschotels staan boven, de tajines met olie eronder.
-- Met dezelfde ondergrens van 45 halen alleen de eerste vier het. Dat is de
-- bedoeling — een tajine is een goed gerecht en het is geen verzadigingsadvies.
--
-- EEN FOUT DIE IK ONDERWEG MAAKTE, EN DIE HET METEN AAN HET LICHT BRACHT
--
-- Mijn eerste som gaf 10.062 gram per honderd kilocalorieën voor kuru fasulye.
-- Een factor honderd mis: ik deelde het totale aantal kilocalorieën van het
-- gerecht alsof het de energie per honderd gram was. Het gemene eraan was dat de
-- score er niet raar van werd — de dichtheidsterm kapt af op 240, dus élk
-- gerecht kreeg de volle vijfenveertig punten en de ranglijst zag er plausibel
-- uit. Alleen het gram-getal zelf was zichtbaar onmogelijk.
--
-- Dat is meteen het argument voor het ontwerp van bestand 28: het kopgetal op
-- het scherm is de deling van twee gemeten waarden, en juist daarom viel dit op.
-- Had de score voorop gestaan, dan was er niets te zien geweest.
--
-- ÉÉN PLEK VOOR DE SOM, EN EEN PROEF DIE DAT VASTHOUDT
--
-- De energie per honderd gram van een gerecht wordt al ergens uitgerekend, in
-- kal_gerecht(). Diezelfde som hier nog een keer opschrijven is precies wat er
-- in dit project niet hoort te gebeuren: twee implementaties lopen uiteen zodra
-- er een regel bij komt over bereidingsvet of optionele ingrediënten.
--
-- Daarom een view, kal_gerecht_dichtheid, met de som op één plek. En omdat
-- kal_gerecht() zijn eigen som houdt, staat er in blok 2 een controlevraag die
-- de twee voor élk gerecht naast elkaar legt. Wijken ze af, dan is er een regel
-- bijgekomen die maar op één van de twee plekken is doorgevoerd.
--
-- De view rekent met dezelfde keuzes als kal_gerecht():
--   - alleen niet-optionele ingrediënten (de "zekere" variant);
--   - bereidingsvet telt mee naar zijn opnamefractie;
--   - nevo_foods en niet nevo_actief, want dat doet kal_gerecht() ook. Wijkt dat
--     af, dan zou een ingrediënt dat naar een oudere NEVO-versie wijst bij de
--     een wél en bij de ander niet meetellen.
--
-- WAT DE MUTATIEPROEF UITWEES, EN WAT ER EERST MIS WAS AAN MIJN OPSTELLING
--
-- Op een nagebouwde bibliotheek in een lokale Postgres, met kal_gerecht() ernaast:
--
--   bereidingsvet voor 100% meetellen   → 2 gerechten wijken af      gevangen
--   optionele ingrediënten meetellen    → 1 gerecht wijkt 12 kcal af  gevangen
--
-- Die tweede kwam er de eerste keer ongemerkt doorheen, en niet doordat de
-- controlevraag zwak was maar doordat mijn opstelling dat was. Het enige
-- optionele ingrediënt in de proefbibliotheek was twintig gram koriander: te
-- weinig om het afgeronde getal te verschuiven, dus de mutant gaf nul verschil.
--
-- Dezelfde les als eerder in dit project: een proef die een toestand beschrijft
-- die zijn eigen opstelling niet kan produceren, bewijst niets. Met een optioneel
-- ingrediënt dat wél weegt, valt hij meteen om.
--
-- WAT JE AL EET, NU EXACT
--
-- Bij een product is de vlag `bekend` een benadering: heb je de laatste zestig
-- dagen iets uit die productgroep gelogd? Bij een gerecht kan het exact, want
-- een gelogde regel draagt het dish_id van het gerecht waar hij uit komt. De
-- vlag zegt daar dus: dit gerecht heb je zelf al eens gegeten.
--
-- En net als in bestand 28 wordt er niet op gesorteerd, om dezelfde reden.
--
-- EEN VIEW HEEFT GEEN ZOEKPAD
--
-- Elke kal_*-functie draagt `SET search_path TO 'public'` en mag daarom
-- `cultural_dishes` onversierd noemen. Een view kan dat niet: die heeft geen
-- zoekpadclausule en lost zijn namen op tegen het zoekpad van de sessie die
-- hem aanmaakt. Stond het zoekpad daar leeg, dan viel dit bestand om met
--
--   ERROR: 42P01: relation "cultural_dishes" does not exist
--
-- wat de eerste keer ook precies gebeurde. Vandaar `public.` voor elke tabel
-- in blok 1 — net als `merk_actief` in bestand 18, de enige andere view hier.
-- Binnen de functie in blok 2 blijven de namen onversierd: daar doet de
-- zoekpadclausule het werk.
--
-- En daarom staat er ook een `revoke`. Supabase verleent nieuwe objecten in
-- `public` standaard aan anon en authenticated; zonder die regel was de
-- gerechtenbibliotheek rechtstreeks te lezen, buiten kal_verzadiging om, en
-- dat is precies wat hier nergens mag.
--
-- PERSOONLIJKE VARIANTEN DOEN NIET MEE
--
-- `owner_patient_id is null`, dezelfde regel die kal_zoeken en kal_gerecht al
-- hanteren. Een variant die een patiënt voor zichzelf heeft vastgelegd hoort
-- niet in een lijst die aan iedereen getoond wordt.
--
-- TERUGDRAAIEN
--
--   drop function if exists public.kal_verzadiging(text, numeric, integer, integer);
--   drop view if exists public.kal_gerecht_dichtheid;
--   -- en daarna bestand 28 opnieuw draaien voor de versie met drie argumenten
--
-- Deze functie en deze view lezen alleen. Er wordt niets weggeschreven, dus twee
-- keer draaien verandert niets en terugdraaien raakt geen enkele rij.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- BLOK 1 — DE SOM OP ÉÉN PLEK
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.kal_gerecht_dichtheid AS
  select d.id as dish_id, d.name_nl as naam, d.cuisine as keuken,
         sum(g.gram)                          as gram,
         sum(g.gram / 100 * g.kcal100)        as kcal,
         sum(g.gram / 100 * g.eiwit100)       as eiwit,
         sum(g.gram / 100 * g.vezel100)       as vezel
    from public.cultural_dishes d
    join lateral (
      select coalesce(i.grams_equivalent, 0)
               * case when i.is_preparation_fat
                      then coalesce(i.absorbed_fraction, 1) else 1 end as gram,
             coalesce(n.energie_kcal_per_100g, 0) as kcal100,
             coalesce(n.eiwit_g, 0)               as eiwit100,
             coalesce(n.vezels_g, 0)              as vezel100
        from public.dish_ingredients i
        left join public.nevo_foods n
          on n.nevo_code = i.external_food_id and i.external_source = 'nevo'
       where i.dish_id = d.id and not i.is_optional
    ) g on true
   where d.owner_patient_id is null
   group by d.id, d.name_nl, d.cuisine
  having sum(g.gram) > 0 and sum(g.gram / 100 * g.kcal100) > 0;

comment on view public.kal_gerecht_dichtheid is
  'De zekere som van een gerecht: gram, kcal, eiwit en vezel uit de niet-optionele ingredienten, bereidingsvet naar opnamefractie. Dezelfde som als kal_gerecht() maakt; blok 2 van 29-gerechten-die-vullen.sql toetst dat ze gelijk blijven.';

-- Dichtzetten, net als `merk_actief` in bestand 18. Supabase verleent nieuwe
-- objecten in `public` standaard aan anon en authenticated; zonder deze regel
-- was de gerechtenbibliotheek buiten kal_verzadiging om te lezen.
revoke all on public.kal_gerecht_dichtheid from anon, authenticated;


-- ---------------------------------------------------------------------------
-- BLOK 2 — DE FUNCTIE, NU MET TWEE SOORTEN
-- ---------------------------------------------------------------------------

drop function if exists public.kal_verzadiging(text, numeric, integer);

CREATE OR REPLACE FUNCTION public.kal_verzadiging(
  p_token text, p_max_kcal numeric,
  p_gerechten integer DEFAULT 3, p_producten integer DEFAULT 4)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_vandaag date;
  v_g integer := greatest(0, least(coalesce(p_gerechten, 3), 8));
  v_p integer := greatest(0, least(coalesce(p_producten, 4), 8));
begin
  v_id := kal_sessie(p_token);
  v_vandaag := (now() at time zone 'Europe/Amsterdam')::date;

  if p_max_kcal is null or p_max_kcal <= 0 then
    return '[]'::jsonb;
  end if;

  return coalesce((
    with mijn_groepen as (
      select distinct n.groep
        from kal_regels r
        join nevo_actief n on n.nevo_code = r.nevo_code
       where r.gebruiker_id = v_id
         and r.datum between v_vandaag - 60 and v_vandaag
         and r.bron <> 'import'
    ),
    mijn_gerechten as (
      -- Bij een gerecht kan het exact: een gelogde regel draagt het dish_id.
      select distinct r.dish_id
        from kal_regels r
       where r.gebruiker_id = v_id
         and r.dish_id is not null
         and r.datum between v_vandaag - 60 and v_vandaag
         and r.bron <> 'import'
    ),

    /* ---------------------------------------------------------------- */
    gerecht as (
      select 'gerecht'::text as soort,
             g.dish_id::text as sleutel, null::text as nevo_code, g.dish_id,
             g.naam, g.keuken as groep,
             100.0 * g.kcal / g.gram          as kcal100,
             -- 100 en niet 10000. `g.kcal` is de energie van het héle gerecht,
             -- niet die per honderd gram: gram per 100 kcal is dus gram/(kcal/100).
             -- Deze fout maakte ik twee keer, en allebei de keren viel hij op aan
             -- het gram-getal en niet aan de score — die kapt af op 240 en merkt
             -- er niets van. Zie de toelichting bovenaan.
             100.0 * g.gram / g.kcal          as gram100,
             100.0 * g.eiwit / g.kcal         as eiwit100,
             100.0 * g.vezel / g.kcal         as vezel100,
             coalesce(p.label_nl, 'portie')   as portie_naam,
             p.grams_estimate as portie_gram, p.grams_low as gram_laag,
             p.grams_high as gram_hoog,
             (g.dish_id in (select dish_id from mijn_gerechten)) as bekend
        from kal_gerecht_dichtheid g
        join lateral (
          select pp.label_nl, pp.grams_estimate, pp.grams_low, pp.grams_high
            from dish_portions pp
           where pp.dish_id = g.dish_id and pp.grams_estimate > 0
           order by pp.is_default desc, pp.sort_order
           limit 1
        ) p on true
    ),
    product as (
      select 'product'::text as soort,
             n.nevo_code as sleutel, n.nevo_code, null::uuid as dish_id,
             n.naam_nl as naam, n.groep,
             n.energie_kcal_per_100g                             as kcal100,
             10000.0 / n.energie_kcal_per_100g                   as gram100,
             n.eiwit_g * 100.0 / n.energie_kcal_per_100g         as eiwit100,
             coalesce(n.vezels_g, 0) * 100.0 / n.energie_kcal_per_100g as vezel100,
             m.naam as portie_naam, m.gram_schatting as portie_gram,
             m.gram_laag, m.gram_hoog,
             (n.groep in (select groep from mijn_groepen)) as bekend
        from nevo_actief n
        join lateral (
          select pm.naam, pm.gram_schatting, pm.gram_laag, pm.gram_hoog
            from voeding_portiematen pm
           where pm.nevo_code = n.nevo_code
              or (pm.nevo_code is null and pm.nevo_groep = n.groep)
           order by (pm.nevo_code is not null) desc, pm.is_standaard desc, pm.volgorde
           limit 1
        ) m on true
       where n.energie_kcal_per_100g >= 10
         and n.eiwit_g is not null
         and n.naam_nl !~* '\mrauw\M|onbereid|ongekookt|poeder|gedroogd|extract'
                        '|gist|gelatine|bouillon|kruiden|kiemen'
                        '|drank|drink|\msap\M|limonade|smoothie|shake|siroop'
         and n.groep not in (
               'Kruiden en specerijen', 'Hartige sauzen', 'Zoete sauzen',
               'Niet-alcoholische dranken', 'Alcoholische dranken',
               'Flesvoeding en preparaten', 'Diversen',
               'Suiker, snoep, zoet beleg', 'Vetten, oliën en hartige sauzen')
    ),
    alles as (select * from gerecht union all select * from product),
    gescoord as (
      select a.*,
             round(a.kcal100 * a.portie_gram / 100) as portie_kcal,
             round((45 * least(1, a.gram100 / 240.0)
                  + 35 * least(1, a.eiwit100 / 12.5)
                  + 20 * least(1, a.vezel100 / 5.0))::numeric) as score
        from alles a
    ),
    past as (
      select *,
             row_number() over (partition by soort, groep
                                order by score desc, gram100 desc) as per_groep,
             row_number() over (partition by soort
                                order by score desc, gram100 desc) as per_soort
        from gescoord
       where score >= 45
         and portie_kcal <= p_max_kcal
    ),
    /* Eén per groep, en daarbinnen de beste N per soort. Bij een gerecht is de
       groep de keuken, dus je krijgt niet drie tajines op rij. */
    gekozen as (
      select * from (
        select *, row_number() over (partition by soort
                                     order by score desc, gram100 desc) as rn
          from past where per_groep = 1
      ) x
       where (soort = 'gerecht' and rn <= v_g)
          or (soort = 'product' and rn <= v_p)
    )
    select jsonb_agg(jsonb_build_object(
             'soort', soort, 'sleutel', sleutel,
             'nevo_code', nevo_code, 'dish_id', dish_id,
             'naam', naam, 'groep', groep,
             'portie_naam', portie_naam, 'portie_gram', round(portie_gram),
             'gram_laag', round(gram_laag), 'gram_hoog', round(gram_hoog),
             'kcal', portie_kcal,
             'gram_per_100kcal', round(gram100),
             'eiwit_per_100kcal', round(eiwit100, 1),
             'vezel_per_100kcal', round(vezel100, 1),
             'score', score, 'bekend', bekend)
           order by (soort = 'product'), score desc, gram100 desc)
      from gekozen
  ), '[]'::jsonb);
end $function$
;

comment on function public.kal_verzadiging(text, numeric, integer, integer) is
  'Gerechten om te koken en producten om erbij te nemen, met de hoogste voorspelde verzadiging binnen een kcal-grens. Voorspelling uit de samenstelling, geen gemeten verzadigingsindex. Zie 28-wat-vult-het-best.sql en 29-gerechten-die-vullen.sql.';

grant execute on function public.kal_verzadiging(text, numeric, integer, integer) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- BLOK 3 — NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- 1. DE SOM STAAT OP ÉÉN PLEK EN BLIJFT DAAR.
--
--    Dit is de belangrijkste van de vijf. De view rekent de energie per honderd
--    gram van een gerecht uit, en kal_gerecht() doet dat ook. Zodra die twee
--    uiteenlopen is er een regel bijgekomen die maar op één plek is doorgevoerd.
--
--    select count(*) filter (where verschil > 0) as gerechten_die_afwijken,
--           max(verschil) as grootste_afwijking
--      from (
--        select abs(round(100.0 * v.kcal / v.gram)
--                   - (kal_gerecht('JOUW_TOKEN', v.dish_id)->>'kcal_per_100')::numeric) as verschil
--          from kal_gerecht_dichtheid v
--      ) x;
--
--    → 0 en 0
--
-- 2. Er komen werkelijk twee soorten uit.
--
--    select e->>'soort' as soort, count(*)
--      from jsonb_array_elements(kal_verzadiging('JOUW_TOKEN', 800, 3, 4)) e
--     group by 1;
--
--    → gerecht en product, allebei aanwezig
--
-- 3. De gerechten staan bovenaan, ongeacht hun score. Een gerecht met score 61
--    hoort vóór een product met score 100 te staan: het zijn twee antwoorden op
--    twee vragen en niet één ranglijst.
--
--    select bool_and(gerecht_eerst) from (
--      select (e->>'soort' = 'gerecht') >= (lead(e->>'soort') over () = 'gerecht')
--             as gerecht_eerst
--        from jsonb_array_elements(kal_verzadiging('JOUW_TOKEN', 800, 3, 4)) e) x;
--
--    → t
--
-- 4. Geen twee gerechten uit dezelfde keuken.
--
--    select count(*) = count(distinct e->>'groep') as een_per_keuken
--      from jsonb_array_elements(kal_verzadiging('JOUW_TOKEN', 800, 3, 4)) e
--     where e->>'soort' = 'gerecht';
--
--    → t
--
-- 5. Het kopgetal klopt met de view: gram per 100 kcal is 10000 gedeeld door de
--    energie per 100 gram, en verder niets.
--
--    select bool_and(abs((e->>'gram_per_100kcal')::numeric
--                        - round(10000.0 * v.gram / v.kcal)) < 1) as klopt
--      from jsonb_array_elements(kal_verzadiging('JOUW_TOKEN', 800, 3, 4)) e
--      join kal_gerecht_dichtheid v on v.dish_id::text = e->>'dish_id'
--     where e->>'soort' = 'gerecht';
--
--    → t
--
-- En een blik op de uitslag zelf:
--
--    select e->>'soort' as soort, e->>'naam' as naam, e->>'groep' as groep,
--           e->>'score' as score, e->>'gram_per_100kcal' as gram_per_100kcal,
--           e->>'portie_naam' as portie, e->>'kcal' as kcal, e->>'bekend' as bekend
--      from jsonb_array_elements(kal_verzadiging('JOUW_TOKEN', 800, 3, 4)) e;
