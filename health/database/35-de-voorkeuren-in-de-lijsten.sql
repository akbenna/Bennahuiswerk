-- =============================================================================
-- DE VOORKEUREN IN DE TWEE TABELLIJSTEN
--
-- Toegepast 18 september 2026.
--
-- De zeven vragen van blok 4 zijn destijds in de echte database gedraaid en hun
-- uitkomst is nooit in dit bestand beland. Daar stond een tijd een voorbehoud
-- over; dat is opgelost door niet op dat geheugen te leunen maar te meten.
--
-- Gemeten op 18 september 2026, en de uitslag staat onderaan deze kop. Dat is
-- ook het moment waarop bleek dat dit bestand de verkeerde `kal_verzadiging`
-- raakte: zie verderop. `kal_eiwitrijk` en `kal_hoeken` stonden wél goed.
--
-- De controle zelf, voor de volgende keer:
--
--   select p.proname,
--          md5(regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'),
--                             '\s+', ' ', 'g')) as in_de_database
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--    where n.nspname = 'public' and p.proname in ('kal_eiwitrijk', 'kal_verzadiging', 'kal_hoeken')
--    order by 1;
--
-- Wat dit bestand zegt dat eruit hoort te komen, commentaar en witruimte
-- gestript, zodat een andere inspringing geen vals alarm geeft:
--
--   kal_eiwitrijk      2736d7fcd1913f12b0c3bdaf33b5a237
--   kal_hoeken         bda6e4088510345b98b58d73700695af
--   kal_verzadiging    ae305ba886a359279bda7ba75bbe5e23   ← uit bestand 36
--
-- Drie keer gelijk betekent dat de database draait wat hier staat. Wijkt er een
-- af, dan is dit bestand niet wat er in de database zit en is het geen verslag
-- meer maar een voornemen.
--
-- EN WAT DIE CONTROLE METEEN VING
--
-- Hij gaf vier regels terug in plaats van drie, met twee keer `kal_verzadiging`.
-- De `kal_verzadiging` hieronder heeft drie argumenten, en dat is de versie van
-- bestand 28: bestand 29 had die al vervangen door een versie met vier, en de
-- oude weggehaald. `create or replace` kijkt naar de handtekening, dus dit
-- bestand verving niets: het zette de driearguments-versie ernaast terug. De app
-- roept de vierarguments-versie aan, dus "Wat vult het best" hield zich niet aan
-- de voorkeuren, zonder fout en zonder waarschuwing.
--
-- Bestand 36 zet dat recht: het haalt de driearguments-versie weg en zet de
-- voorkeuren in de functie die de app wél aanroept. Wat hieronder staat voor
-- `kal_verzadiging` is dus achterhaald, draai dit bestand niet opnieuw. Voor
-- `kal_eiwitrijk` en `kal_hoeken` klopt het nog wel.
--
--
-- Vervangt `kal_eiwitrijk` (bestand 23) en `kal_verzadiging` (bestand 28). Beide
-- lezen vanaf nu wat de gebruiker in "Wat je lust" heeft gezet. De rest van die
-- twee functies is letterlijk ongewijzigd; wie wil zien wát er veranderd is
-- zoekt op `v_nooit` en `v_liever`.
--
-- Functies vervangen mag: dat staat in CLAUDE.md en het is de gewone gang van
-- zaken. Dit bestand raakt geen enkele rij aan.
--
-- WAAROM DIT IN SQL MOET EN NIET IN HET SCHERM KAN
--
-- De rekenlaag `src/health/voorkeuren.ts` kan een lijst filteren, en dat is
-- precies niet genoeg. Beide functies doen eerst "één per groep" en daarna
-- `limit`. Filteren ná die limiet betekent dat een vegetariër wiens beste acht
-- allemaal vlees zijn een lege lijst overhoudt, de app lijkt dan stuk terwijl
-- er honderden geschikte producten in de tabel staan.
--
-- Dus vóór de limiet, en dus hier.
--
-- TWEE MECHANISMEN, ELK IN DE EENHEID VAN ZIJN EIGEN LIJST
--
-- `nooit` verwijdert. Een `where not (groep = any(v_nooit))` en verder niets.
--
-- `liever` verschuift, met een plafond. De bedoeling is overal dezelfde,
-- ongeveer twaalf procent, genoeg om bij gelijke geschiktheid te winnen en te
-- weinig om iets aantoonbaar beters te begraven, maar de twee lijsten
-- rangschikken op verschillende grootheden:
--
--   kal_verzadiging   score van 0 tot 100      →  score + 12
--   kal_eiwitrijk     dichtheid in g/kcal      →  dichtheid × 1,12
--                     (loopt van 0,05 tot 0,25; +12 zou alles omgooien)
--
-- Optellen bij een dichtheid van 0,09 zou geen duwtje zijn maar een sloophamer.
-- Vermenigvuldigen houdt de verhouding heel en is daarmee hetzelfde gebaar.
--
-- WAT ER NIET GEFILTERD WORDT, EN WAAROM DAT ZO BLIJFT
--
-- Merkproducten in `kal_eiwitrijk`. Die dragen geen NEVO-groep maar een
-- categorie van Open Food Facts ('plant-based-foods-and-beverages' en
-- dergelijke), en dat is een andere woordenlijst die niet betrouwbaar naar deze
-- zevenentwintig te vertalen is. Ze verzinnen te vertalen is precies de fout uit
-- bestand 34.
--
-- De schade is begrensd en dat is de reden dat het zo mag blijven: bestand 23
-- stopt álle merkproducten in één groep 'merk', en `row_number() ... = 1` laat
-- er dus hoogstens één door. Eén merkregel die een vegetariër niet wil, naast
-- drie gemeten regels die kloppen. Dat staat ook in het scherm.
--
-- `kal_verzadiging` heeft dit probleem niet: die leest alleen `nevo_actief`.
--
-- EN DE COACH DAN
--
-- "Wat er nog in past" op Vandaag stelt alleen voor uit wat je zélf gelogd hebt.
-- Daar staat geen groep bij (`kal_ophalen` geeft die niet terug) dus filteren
-- kan daar niet zonder een derde functie te veranderen.
--
-- Dat is minder erg dan het klinkt, en het is geen smoes. De coach kan alleen
-- vlees voorstellen aan wie zelf vlees heeft gelogd. Word je vegetariër, dan
-- loopt dat binnen zestig dagen vanzelf leeg. Het is een overgangsprobleem en
-- geen structureel.
--
-- HOE EEN ONTBREKENDE VOORKEUR ERUITZIET
--
-- Wie niets heeft ingesteld heeft geen `voorkeuren` in `instellingen`, en dan
-- zijn beide arrays leeg. `groep = any('{}')` is altijd onwaar, dus `not (...)`
-- is altijd waar en er valt niets weg. Een gebruiker zonder voorkeur krijgt
-- daarmee exact dezelfde lijst als vóór dit bestand, dat is nagekeken en niet
-- aangenomen, zie blok 3.
--
-- Er staat een `jsonb_typeof(...) = 'array'` omheen. Dat is geen paranoia maar
-- de enige manier waarop dit stuk kan omvallen: staat er ooit met de hand een
-- `"nooit": null` of `"nooit": "vlees"` in die kolom, dan roept
-- `jsonb_array_elements_text` "cannot extract elements from a scalar" en doet
-- de hele lijst het niet meer. Nu wordt dat een lege lijst en dus geen filter.
--
-- TERUGDRAAIEN
--
-- Draai bestand 23 en bestand 28 opnieuw. Die bevatten de vorige versie van
-- elke functie en `create or replace` zet hem gewoon terug.
--
-- HOE DIT IS NAGEKEKEN
--
-- Zie blok 4 onderaan: zeven vragen met het antwoord dat eruit hoort te komen.
-- Draai ze na het toepassen, met je eigen token.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- BLOK 1: EIWITRIJK UIT DE TABEL, MET DE VOORKEUR ERIN
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.kal_eiwitrijk(
  p_token text, p_eis numeric, p_max_kcal numeric, p_limiet integer DEFAULT 4)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_nooit text[];
  v_liever text[];
begin
  v_id := kal_sessie(p_token);

  if p_eis is null or p_eis <= 0 or p_max_kcal is null or p_max_kcal <= 0 then
    return '[]'::jsonb;
  end if;

  -- Wat "Wat je lust" heeft opgeleverd. Zie de kop voor waarom de typecontrole
  -- eromheen staat en wat een lege lijst betekent.
  select
    case when jsonb_typeof(pr.instellingen->'voorkeuren'->'nooit') = 'array'
         then array(select jsonb_array_elements_text(pr.instellingen->'voorkeuren'->'nooit'))
         else '{}'::text[] end,
    case when jsonb_typeof(pr.instellingen->'voorkeuren'->'liever') = 'array'
         then array(select jsonb_array_elements_text(pr.instellingen->'voorkeuren'->'liever'))
         else '{}'::text[] end
    into v_nooit, v_liever
    from kal_profiel pr
   where pr.gebruiker_id = v_id;

  -- Geen profielrij: dan is er ook geen voorkeur.
  v_nooit := coalesce(v_nooit, '{}'::text[]);
  v_liever := coalesce(v_liever, '{}'::text[]);

  return coalesce((
    with nevo as (
      select n.nevo_code, n.naam_nl as naam, n.groep,
             n.energie_kcal_per_100g as kcal100, n.eiwit_g as eiwit100,
             m.naam as portie_naam, m.gram_schatting as portie_gram,
             m.gram_laag, m.gram_hoog
        from nevo_actief n
        join lateral (
          select pm.naam, pm.gram_schatting, pm.gram_laag, pm.gram_hoog
            from voeding_portiematen pm
           where pm.nevo_code = n.nevo_code
              or (pm.nevo_code is null and pm.nevo_groep = n.groep)
           order by (pm.nevo_code is not null) desc, pm.is_standaard desc, pm.volgorde
           limit 1
        ) m on true
       where n.energie_kcal_per_100g > 0
         and n.eiwit_g is not null
         and n.eiwit_g / n.energie_kcal_per_100g >= p_eis
         and n.naam_nl !~* '\mrauw\M|onbereid|ongekookt|poeder|gedroogd|extract|gist|gelatine|bouillon|kruiden'
         -- DE UITSLUITING. Hier, vóór "één per groep" en vóór de limiet.
         and not (n.groep = any(v_nooit))
    ),
    merk as (
      select p.id, p.barcode, p.naam, p.merk, p.groep,
             p.energie_kcal_per_100g as kcal100, p.eiwit_g as eiwit100,
             p.vet_g, p.koolhydraten_g, p.vezels_g, p.verpakking_gram,
             coalesce(p.portie_naam, 'portie') as portie_naam, p.portie_gram
        from merk_actief p
       where p.energie_kcal_per_100g > 0
         and p.eiwit_g is not null
         and p.portie_gram is not null and p.portie_gram > 0
         and p.eiwit_g / p.energie_kcal_per_100g >= p_eis
    ),
    alles as (
      select 'nevo'::text as herkomst, nevo_code, null::jsonb as merk,
             naam, groep, kcal100, eiwit100, portie_naam, portie_gram, gram_laag, gram_hoog
        from nevo
      union all
      select 'merk', null,
             jsonb_build_object(
               'id', id, 'barcode', barcode, 'naam', naam, 'merk', merk, 'groep', groep,
               'kcal', kcal100, 'eiwit_g', eiwit100, 'vet_g', vet_g,
               'koolhydraat_g', koolhydraten_g, 'vezel_g', vezels_g,
               'verpakking_gram', verpakking_gram,
               'portie_gram', portie_gram, 'portie_naam', portie_naam),
             naam || coalesce(' (' || merk || ')', ''),
             'merk', kcal100, eiwit100, portie_naam, portie_gram,
             round(portie_gram * 0.9), round(portie_gram * 1.1)
        from merk
    ),
    per_portie as (
      select *,
             round(kcal100 * portie_gram / 100) as kcal,
             round(eiwit100 * portie_gram / 100, 1) as eiwit,
             round((eiwit100 / kcal100)::numeric, 3) as dichtheid,
             -- HET DUWTJE, hier als factor en niet als optelling: de dichtheid
             -- loopt van 0,05 tot 0,25 en +12 zou de lijst omgooien in plaats
             -- van hem te verschuiven. Zie de kop.
             round((eiwit100 / kcal100
                    * case when groep = any(v_liever) then 1.12 else 1 end)::numeric, 4) as orde
        from alles
    ),
    past as (
      select *,
             row_number() over (partition by groep order by orde desc, eiwit desc) as rn
        from per_portie
       where kcal <= p_max_kcal
         and kcal >= 40
         and eiwit >= 12
    )
    select jsonb_agg(jsonb_build_object(
             'herkomst', herkomst, 'nevo_code', nevo_code, 'merk', merk,
             'naam', naam, 'groep', groep,
             'portie_naam', portie_naam, 'portie_gram', portie_gram,
             'gram_laag', gram_laag, 'gram_hoog', gram_hoog,
             'kcal', kcal, 'eiwit_g', eiwit, 'dichtheid', dichtheid)
           -- De getoonde dichtheid blijft de échte; alleen de volgorde ziet
           -- het duwtje. Anders zou er een getal op het scherm staan dat
           -- nergens uit de tabel te herleiden is.
           order by orde desc, eiwit desc)
      from (select * from past where rn = 1
             order by orde desc, eiwit desc
             limit greatest(1, least(coalesce(p_limiet, 4), 10))) x
  ), '[]'::jsonb);
end $function$;


-- ---------------------------------------------------------------------------
-- BLOK 2: WAT VULT HET BEST, MET DE VOORKEUR ERIN
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.kal_verzadiging(
  p_token text, p_max_kcal numeric, p_limiet integer DEFAULT 5)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_vandaag date;
  v_nooit text[];
  v_liever text[];
begin
  v_id := kal_sessie(p_token);
  v_vandaag := (now() at time zone 'Europe/Amsterdam')::date;

  if p_max_kcal is null or p_max_kcal <= 0 then
    return '[]'::jsonb;
  end if;

  select
    case when jsonb_typeof(pr.instellingen->'voorkeuren'->'nooit') = 'array'
         then array(select jsonb_array_elements_text(pr.instellingen->'voorkeuren'->'nooit'))
         else '{}'::text[] end,
    case when jsonb_typeof(pr.instellingen->'voorkeuren'->'liever') = 'array'
         then array(select jsonb_array_elements_text(pr.instellingen->'voorkeuren'->'liever'))
         else '{}'::text[] end
    into v_nooit, v_liever
    from kal_profiel pr
   where pr.gebruiker_id = v_id;

  v_nooit := coalesce(v_nooit, '{}'::text[]);
  v_liever := coalesce(v_liever, '{}'::text[]);

  return coalesce((
    with mijn_groepen as (
      -- Ongewijzigd, en nog steeds alleen om te markeren. Dit is wat je gezien
      -- bent te eten; de voorkeur hieronder is wat je gezegd hebt. Sorteren op
      -- het eerste is een lus, op het tweede een grens, zie de kop van dit
      -- bestand en `src/health/voorkeuren.ts`.
      select distinct n.groep
        from kal_regels r
        join nevo_actief n on n.nevo_code = r.nevo_code
       where r.gebruiker_id = v_id
         and r.datum between v_vandaag - 60 and v_vandaag
         and r.bron <> 'import'
    ),
    basis as (
      select n.nevo_code, n.naam_nl as naam, n.groep,
             n.energie_kcal_per_100g as kcal100,
             10000.0 / n.energie_kcal_per_100g as gram100,
             n.eiwit_g * 100.0 / n.energie_kcal_per_100g as eiwit100,
             coalesce(n.vezels_g, 0) * 100.0 / n.energie_kcal_per_100g as vezel100,
             m.naam as portie_naam, m.gram_schatting as portie_gram,
             m.gram_laag, m.gram_hoog
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
         -- DE UITSLUITING, vóór "één per groep" en vóór de limiet.
         and not (n.groep = any(v_nooit))
    ),
    gescoord as (
      select b.*,
             round(b.kcal100 * b.portie_gram / 100) as portie_kcal,
             round((45 * least(1, b.gram100 / 240.0)
                  + 35 * least(1, b.eiwit100 / 12.5)
                  + 20 * least(1, b.vezel100 / 5.0))::numeric) as score,
             -- HET DUWTJE. Hier telt het gewoon op: de score loopt van 0 tot
             -- 100 en twaalf punten is precies de bedoelde verschuiving.
             round((45 * least(1, b.gram100 / 240.0)
                  + 35 * least(1, b.eiwit100 / 12.5)
                  + 20 * least(1, b.vezel100 / 5.0)
                  + case when b.groep = any(v_liever) then 12 else 0 end)::numeric) as orde,
             (b.groep in (select groep from mijn_groepen)) as bekend
        from basis b
    ),
    past as (
      select *,
             row_number() over (partition by groep order by orde desc, gram100 desc) as rn
        from gescoord
       -- De drempel blijft op de échte score staan. Een duwtje hoort iets te
       -- verschuiven en niet iets toe te laten wat de drempel niet haalt.
       where score >= 45
         and portie_kcal <= p_max_kcal
    )
    select jsonb_agg(jsonb_build_object(
             'nevo_code', nevo_code, 'naam', naam, 'groep', groep,
             'portie_naam', portie_naam, 'portie_gram', portie_gram,
             'gram_laag', gram_laag, 'gram_hoog', gram_hoog,
             'kcal', portie_kcal,
             'gram_per_100kcal', round(gram100),
             'eiwit_per_100kcal', round(eiwit100, 1),
             'vezel_per_100kcal', round(vezel100, 1),
             -- Getoond wordt de echte score, niet de geduwde. Zie blok 1.
             'score', score, 'bekend', bekend)
           order by orde desc, gram100 desc)
      from (select * from past where rn = 1
             order by orde desc, gram100 desc
             limit greatest(1, least(coalesce(p_limiet, 5), 10))) x
  ), '[]'::jsonb);
end $function$;

-- ---------------------------------------------------------------------------
-- BLOK 3: UIT WELKE HOEKEN JE WERKELIJK GEGETEN HEBT
-- ---------------------------------------------------------------------------
--
-- Nieuw, en het staat los van de twee hierboven. Het suppletie-advies
-- (`src/health/suppletie.ts`) heeft twee bronnen: wat je gezegd hebt, en wat je
-- gelogd hebt. Het tweede is de sterkere van de twee, "je logde de laatste 28
-- dagen niets uit Vis" is te controleren, "je eet weinig vis" is een oordeel,
-- en de app kan het niet zelf zien: `kal_ophalen` geeft bij een regel wel een
-- NEVO-code terug maar geen groep.
--
-- DE TWEEDE WAARDE IS DE BELANGRIJKSTE
--
-- `dagen` telt op hoeveel dágen er iets gelogd is, en niet hoeveel regels. Zonder
-- dat getal is een lege groepenlijst niet te lezen: wie vier dagen logde heeft
-- vier dagen geen vis gelogd, en dat is een waarneming over zijn invoergedrag en
-- niet over zijn voeding. Een advies daarop is het soort uitspraak dat klinkt
-- als een meting en er geen is.
--
-- `suppletie.ts` legt de grens op veertien dagen en zwijgt daaronder.
--
-- Import telt niet mee, net als in `kal_verzadiging`: een overgezette dag uit
-- een andere app heeft geen NEVO-codes en zou als een lege dag meetellen.

CREATE OR REPLACE FUNCTION public.kal_hoeken(
  p_token text, p_dagen integer DEFAULT 28)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_vandaag date;
  v_vanaf date;
begin
  v_id := kal_sessie(p_token);
  v_vandaag := (now() at time zone 'Europe/Amsterdam')::date;
  v_vanaf := v_vandaag - greatest(1, least(coalesce(p_dagen, 28), 365));

  return jsonb_build_object(
    'groepen', coalesce((
      select jsonb_agg(distinct n.groep)
        from kal_regels r
        join nevo_actief n on n.nevo_code = r.nevo_code
       where r.gebruiker_id = v_id
         and r.datum between v_vanaf and v_vandaag
         and r.bron <> 'import'
    ), '[]'::jsonb),
    'dagen', (
      select count(distinct r.datum)
        from kal_regels r
       where r.gebruiker_id = v_id
         and r.datum between v_vanaf and v_vandaag
         and r.bron <> 'import'
    ));
end $function$;

comment on function public.kal_hoeken(text, integer) is
  'Uit welke NEVO-groepen er in het venster gelogd is, en op hoeveel dagen. Voor het '
  'suppletie-advies. Zie health/database/35-de-voorkeuren-in-de-lijsten.sql.';


comment on function public.kal_eiwitrijk(text, numeric, numeric, integer) is
  'Eiwitrijke producten uit NEVO en de merktabel, gefilterd op instellingen->voorkeuren->nooit '
  'en licht herschikt op ->liever. Zie health/database/35-de-voorkeuren-in-de-lijsten.sql.';

comment on function public.kal_verzadiging(text, numeric, integer) is
  'Verzadigende producten uit NEVO, gefilterd op instellingen->voorkeuren->nooit en licht '
  'herschikt op ->liever. Zie health/database/35-de-voorkeuren-in-de-lijsten.sql.';


-- ---------------------------------------------------------------------------
-- BLOK 4: NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- Zet JOUW_TOKEN erin. Vraag 1 en 2 wijzen de fout aan die er het meest toe
-- doet: een uitsluiting die niet uitsluit.
--
-- 1. ZONDER VOORKEUR VERANDERT ER NIETS. Zet de voorkeur even leeg en vergelijk
--    met wat je gewend bent: evenveel regels, dezelfde volgorde.
--
--    update kal_profiel set instellingen = instellingen - 'voorkeuren'
--     where gebruiker_id = (select kal_sessie('JOUW_TOKEN'));
--    select jsonb_array_length(kal_verzadiging('JOUW_TOKEN', 600, 8)) as hoort_8_te_zijn;
--
-- 2. EEN UITSLUITING SLUIT UIT. Nul rijen is goed.
--
--    update kal_profiel set instellingen = jsonb_set(instellingen, '{voorkeuren}',
--      '{"patroon":"vegetarisch","nooit":["Vlees en gevogelte","Vleeswaren",
--        "Vis, schaal- en schelpdieren"],"liever":[],"minder":[]}'::jsonb)
--     where gebruiker_id = (select kal_sessie('JOUW_TOKEN'));
--
--    select e->>'naam', e->>'groep'
--      from jsonb_array_elements(kal_verzadiging('JOUW_TOKEN', 600, 10)) e
--     where e->>'groep' in ('Vlees en gevogelte','Vleeswaren','Vis, schaal- en schelpdieren');
--
-- 3. EN DE LIJST LOOPT NIET LEEG. Er horen er nog steeds acht tot tien te staan;
--    dát is de reden dat dit in SQL zit en niet in het scherm.
--
--    select jsonb_array_length(kal_verzadiging('JOUW_TOKEN', 600, 10)) as hoort_10_te_zijn;
--
-- 4. HETZELFDE VOOR DE EIWITLIJST, inclusief de merkregel die erdoorheen mag.
--
--    select e->>'herkomst' as herkomst, e->>'naam' as naam, e->>'groep' as groep
--      from jsonb_array_elements(kal_eiwitrijk('JOUW_TOKEN', 0.097, 350, 8)) e;
--
--    Hoogstens één regel met herkomst 'merk'; geen enkele met een uitgesloten
--    NEVO-groep.
--
-- 5. HET DUWTJE VERSCHUIFT EN VERVANGT NIET. Zet Peulvruchten op liever en kijk
--    of de lijst opschuift zonder dat de bovenste helft eruit valt.
--
--    update kal_profiel set instellingen = jsonb_set(instellingen,
--      '{voorkeuren,liever}', '["Peulvruchten"]'::jsonb)
--     where gebruiker_id = (select kal_sessie('JOUW_TOKEN'));
--    select e->>'naam', e->>'groep', e->>'score'
--      from jsonb_array_elements(kal_verzadiging('JOUW_TOKEN', 600, 10)) e;
--
--    De getoonde score hoort onveranderd te zijn, alleen de volgorde schuift.
--
-- 6. EEN KAPOTTE VOORKEUR BREEKT DE LIJST NIET. Dit is het geval waarvoor de
--    typecontrole er staat.
--
--    update kal_profiel set instellingen = jsonb_set(instellingen,
--      '{voorkeuren,nooit}', 'null'::jsonb)
--     where gebruiker_id = (select kal_sessie('JOUW_TOKEN'));
--    select jsonb_array_length(kal_verzadiging('JOUW_TOKEN', 600, 8)) as hoort_8_te_zijn;
--
-- Zet daarna je eigen voorkeur terug via het scherm, of:
--    update kal_profiel set instellingen = instellingen - 'voorkeuren'
--     where gebruiker_id = (select kal_sessie('JOUW_TOKEN'));
--
-- 7. DE HOEKEN. Twee waarden, en de tweede is de belangrijkste.
--
--    select kal_hoeken('JOUW_TOKEN', 28);
--
--    `dagen` hoort te kloppen met hoeveel dagen je werkelijk iets invulde, en
--    `groepen` met wat je at. Staat er een groep in die je niet herkent, dan
--    zit er een regel in je log met een NEVO-code die je niet verwacht.
