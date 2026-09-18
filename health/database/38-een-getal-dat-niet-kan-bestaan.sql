-- =============================================================================
-- EEN GETAL DAT NIET KAN BESTAAN — en waarom het bovenaan stond
--
-- Toegepast 18 september 2026, en nagekeken met vraag 3 van blok 3. Die gaf
-- precies vier regels terug, en precies de vier die moesten blijven:
--
--   AH Intense mintgum suikervrij   163 kcal, macro s 272
--   Alcohol vrij bier                13 kcal, macro s  21
--   Bubble gum                      159 kcal, macro s 260
--   DROP Pastilles                  239 kcal, macro s 390
--
-- Alle vier snoep of drank met polyolen, alle vier geen fout. De zes rijen
-- hierboven zijn weg en er is niets anders geraakt — dat is een meting en geen
-- mededeling.
--
-- Wat hier nog niet onder ligt is de md5 van vraag 2. Die beantwoordt een andere
-- vraag dan deze: niet "staan de goede rijen er nog" maar "draait de database
-- wat er in dit bestand staat". Bij bestand 35 was dat juist het verschil tussen
-- groen en een functie die door niets werd aangeroepen.
--
-- WAT ER AAN DE HAND WAS
--
-- "Franse Kwark Mager (JUMBO)" stond bovenaan "Uit de tabel": 200 gram, 48
-- kcal, 18 g eiwit. Dat is 37,5 g eiwit per 100 kcal.
--
-- Dat getal kan niet bestaan. Eiwit levert 4 kcal per gram, dus meer dan 25 g
-- per 100 kcal betekent dat het eiwit alleen al meer energie levert dan het hele
-- product heeft. De energie in die rij stond op 24 kcal per 100 g waar de macro
-- s 58 zeggen — en kwark zit rond de 52.
--
-- En daar zit de gemeenheid: de lijst rangschikt op eiwit per kcal, dus een te
-- lage energie zet een product niet ergens in de lijst maar vooráán. Hoe erger
-- de fout, hoe hoger het komt.
--
-- HOE HET GEVONDEN IS
--
-- Niet door ernaar te kijken. De zeef die sinds kort in
-- `gereedschap/merkgegevens.mjs` zit — de energie moet kunnen kloppen met de
-- macro s — bestond nog niet toen bestand 18 zijn 854 producten laadde. Dezelfde
-- regel als query op de bestaande tabel gedraaid gaf tien treffers.
--
-- WAT ER WEG GAAT, EN WAT NADRUKKELIJK NIET
--
-- Zes van die tien zijn echt fout: de opgegeven energie is te laag en de macro s
-- zeggen wat het hoort te zijn.
--
--   Cassave kroepoek            100 kcal, macro s zeggen 485
--   Goudse Kaas 48+ (JUMBO)     146 kcal, macro s zeggen 364
--   Franse Kwark Mager (JUMBO)   24 kcal, macro s zeggen  58
--   Halfvolle Franse kwark (AH)  44 kcal, macro s zeggen  73
--   Maiskorrels (AH)             43 kcal, macro s zeggen  79
--   Tomaten Gezeefd Passata      23 kcal, macro s zeggen  40
--
-- Vier van de tien zijn géén fout en blijven staan: AH Intense mintgum, Bubble
-- gum, DROP Pastilles en Alcohol vrij bier. Suikervrij snoep zit vol polyolen,
-- en die leveren ongeveer 2,4 kcal per gram in plaats van 4. De macrosom rekent
-- ze als gewone koolhydraten en komt daardoor te hoog uit. Het etiket heeft
-- gelijk en de zeef niet.
--
-- Dat is meteen de grens van deze controle, en die hoort erbij te staan: hij
-- rekent met Atwater, en polyolen houden zich daar niet aan.
--
-- WAAROM CORRIGEREN GEEN OPTIE WAS
--
-- De macro s zeggen wat de energie zou moeten zijn, dus die getallen zijn in te
-- vullen. Dat is hier niet gedaan, en met opzet.
--
-- Een merkproduct draagt het teken ◈ — etiketopgave. Zou ik de energie uit de
-- macro s herrekenen, dan staat er een afgeleid getal met een etiketteken
-- erboven, en dat is precies het soort stille onwaarheid waar deze app tegen
-- gebouwd is. Wat er niet klopt gaat eruit; komt het bij Open Food Facts goed,
-- dan komt het bij de volgende import vanzelf terug.
--
-- WAT DE FUNCTIE ERBIJ KRIJGT
--
-- Weghalen lost deze zes op en niet de volgende. `kal_eiwitrijk` weigert daarom
-- vanaf nu elke merkrij waarvan de macro s meer dan veertig procent boven de
-- opgegeven energie uitkomen — dezelfde grens en hetzelfde getal als de zeef in
-- de omzetter.
--
-- Alleen in de merktak. NEVO-waarden zijn laboratoriumbepalingen en dragen dit
-- probleem niet; daar een zeef overheen leggen zou suggereren dat ze net zo
-- onzeker zijn, en dat is precies het verschil dat ◆ en ◈ maken.
--
-- En alleen in `kal_eiwitrijk`. `kal_verzadiging` put uit `nevo_actief` en
-- `kal_gerecht_dichtheid` en ziet geen merkproducten — daar valt niets te
-- weren.
--
-- TERUGDRAAIEN
--
-- De functie: blok 2 van bestand 37 opnieuw draaien.
--
-- De zes rijen: die komen terug bij een volgende import van hun merk, met
-- precies de waarden die Open Food Facts dan heeft. Ze staan hieronder bij
-- streepjescode genoteerd, zodat na te zoeken is welke het waren.
--
-- HOE DIT IS NAGEKEKEN
--
-- Lokaal op Postgres 16 tegen het echte schema:
--
--   · een rij met 18 g eiwit op 24 kcal komt niet meer uit `kal_eiwitrijk`
--   · dezelfde rij met een kloppende energie komt er wél uit
--   · een gewone merkrij verandert niet van plaats
--   · de NEVO-kant van de lijst is onaangeroerd
--   · het weghalen raakt precies zes rijen en twee keer draaien haalt niets
--     extra weg
-- =============================================================================

-- ---------------------------------------------------------------------------
-- BLOK 1 — DE ZES RIJEN WEG
-- ---------------------------------------------------------------------------
--
-- Op streepjescode, en niet op naam of merk: die tweede zou ook weghalen wat er
-- later door iemand anders bij is gezet. Precies deze zes en niets anders.

delete from public.merk_producten
 where bron = 'openfoodfacts'
   and barcode in (
     '8718907775779',  -- Cassave kroepoek (AH)            100 kcal, macro s 485
     '8718452695072',  -- Goudse Kaas 48+ (JUMBO)          146 kcal, macro s 364
     '8718452513673',  -- Franse Kwark Mager (JUMBO)        24 kcal, macro s  58
     '8718906392076',  -- Halfvolle Franse kwark (AH)       44 kcal, macro s  73
     '8718907502405',  -- Maiskorrels (AH)                  43 kcal, macro s  79
     '8718452504435'   -- Tomaten Gezeefd Passata (JUMBO)   23 kcal, macro s  40
   );

-- → DELETE 6. Staat er minder, dan was er al iets weg; staat er meer, dan
--   klopt er iets niet en hoor je te stoppen.


-- ---------------------------------------------------------------------------
-- BLOK 2 — EN DE VOLGENDE KOMT ER NIET IN
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
  v_nietprod text[];
  v_keukens text[];
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
    ,
    case when jsonb_typeof(pr.instellingen->'voorkeuren'->'nietProduct') = 'array'
         then array(select jsonb_array_elements_text(pr.instellingen->'voorkeuren'->'nietProduct'))
         else '{}'::text[] end,
    case when jsonb_typeof(pr.instellingen->'voorkeuren'->'keukens') = 'array'
         then array(select jsonb_array_elements_text(pr.instellingen->'voorkeuren'->'keukens'))
         else '{}'::text[] end
    into v_nooit, v_liever, v_nietprod, v_keukens
    from kal_profiel pr
   where pr.gebruiker_id = v_id;

  -- Geen profielrij: dan is er ook geen voorkeur.
  v_nooit := coalesce(v_nooit, '{}'::text[]);
  v_liever := coalesce(v_liever, '{}'::text[]);
  v_nietprod := coalesce(v_nietprod, '{}'::text[]);
  v_keukens := coalesce(v_keukens, '{}'::text[]);

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
         -- EN HET LOSSE PRODUCT, op code en nooit op naam. De zevenentwintig
         -- groepen zijn grof: wie geen spruitjes lust hoeft niet heel "Groente"
         -- uit te zetten om ervan af te zijn.
         and not (n.nevo_code = any(v_nietprod))
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
         /* DE ENERGIE MOET KUNNEN KLOPPEN MET DE MACRO'S

            Eiwit en koolhydraten leveren 4 kcal per gram, vet 9. Meer dan
            veertig procent daarboven is geen etiketspeling meer maar een fout
            in het getal — en juist die fout zet een product bovenaan, want te
            weinig energie bij hetzelfde eiwit blaast de dichtheid op.

            Dat was geen theorie: "Franse Kwark Mager" stond met 24 kcal per
            100 g en 18 g eiwit per portie bovenaan deze lijst. Dat is 37,5 g
            eiwit per 100 kcal, terwijl 25 het maximum is dat natuurkundig
            bestaat. De rij is weg (blok 1), maar dit vangt de volgende.

            Dezelfde grens en hetzelfde getal als de zeef in
            `gereedschap/merkgegevens.mjs`. Wie er aan draait, draait ze allebei. */
         and (4 * coalesce(p.eiwit_g, 0) + 9 * coalesce(p.vet_g, 0)
              + 4 * coalesce(p.koolhydraten_g, 0)) <= 1.4 * p.energie_kcal_per_100g
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


comment on function public.kal_eiwitrijk(text, numeric, numeric, integer) is
  'De eiwitrijkste producten per kcal binnen wat er nog past, binnen wat de gebruiker in "Wat je lust" heeft aangegeven, en zonder merkrijen waarvan de energie niet met de macro s kan kloppen. Zie 23, 35, 37 en 38.';

grant execute on function public.kal_eiwitrijk(text, numeric, numeric, integer) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- BLOK 3 — NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- 1. STAAT ER NOG PRECIES ÉÉN `kal_eiwitrijk`?
--
--    select proname, pg_get_function_identity_arguments(oid) as argumenten
--      from pg_proc where proname = 'kal_eiwitrijk';
--
--    → één regel, met vier argumenten.
--
-- 2. DRAAIT DE DATABASE WAT HIER STAAT?
--
--    select p.proname,
--           md5(regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'),
--                              '\s+', ' ', 'g')) as in_de_database
--      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--     where n.nspname = 'public'
--       and p.proname in ('kal_eiwitrijk', 'kal_verzadiging', 'kal_hoeken')
--     order by 1;
--
--    → drie regels, en deze drie:
--
--      kal_eiwitrijk     da67ff29517e540dd2c2e20abf789bfa
--      kal_hoeken        bda6e4088510345b98b58d73700695af
--      kal_verzadiging   06d1cccc04c19755174d281a789020e8
--
-- 3. IS ER NOG IETS DAT NIET KAN BESTAAN? Dit is dezelfde vraag als waarmee dit
--    bestand begon. Hij hoort nu vier regels te geven, en alle vier snoep:
--
--    select barcode, naam, merk, energie_kcal_per_100g as opgegeven,
--           round(4*coalesce(eiwit_g,0) + 9*coalesce(vet_g,0) + 4*coalesce(koolhydraten_g,0)) as uit_de_macro_s
--      from merk_producten
--     where bron = 'openfoodfacts' and energie_kcal_per_100g > 0
--       and (4*coalesce(eiwit_g,0) + 9*coalesce(vet_g,0) + 4*coalesce(koolhydraten_g,0))
--           / energie_kcal_per_100g > 1.4
--     order by naam;
--
-- 4. EN DE NAMEN DIE GEEN NAAM ZIJN. Deze zijn niet weggehaald: een rommelige
--    naam bij een geldig product is geen reden om het getal weg te gooien.
--    Wat eruit moet, klik je in de app weg met het kruisje.
--
--    select barcode, naam, merk from merk_producten
--     where bron = 'openfoodfacts'
--       and naam ~ '\d{1,2}:\d{2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{6,}'
--     order by merk, naam;
