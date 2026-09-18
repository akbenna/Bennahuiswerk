-- =============================================================================
-- WAT VULT HET BEST — de derde laag onder de coach
--
-- Toegepast op 13 september 2026. De vijf controlevragen uit blok 2 zijn erna
-- gedraaid en gaven het antwoord dat eronder staat; de uitslag op de echte
-- tabel is beoordeeld en goed bevonden.
--
-- Sinds 18 september 2026 achterhaald, en in twee stappen. Bestand 29 gaf
-- `kal_verzadiging` een vierde argument en haalde de versie hieronder weg;
-- bestand 36 zette daar de voorkeuren uit "Wat je lust" in. Draai dit dus niet
-- opnieuw — dan staat de oude driearguments-versie er weer naast, en dat is
-- precies de fout die bestand 35 maakte. Wat er in de database hoort te staan is
-- de md5 in de kop van bestand 36.
--
-- DE VRAAG
--
-- De coach beantwoordt "wat past er nog in" op twee manieren: uit je eigen
-- geschiedenis (bestand 06) en, als het eiwit knelt, uit de tabel (bestand 23).
-- Allebei rangschikken op gram eiwit per kcal.
--
-- Er is een tweede vraag die minstens zo vaak gesteld wordt en waar de app geen
-- antwoord op had: ik ga zo koken, wat kan ik nemen waar ik genoeg van heb? Dat
-- is geen eiwitvraag maar een verzadigingsvraag, en die twee lopen uit elkaar.
-- Paardenrookvlees heeft een uitstekende eiwitdichtheid en vult niets: een plak
-- van vijftien gram is op in twee happen.
--
-- WAT DE LITERATUUR ZEGT, EN IN WELKE VOLGORDE
--
-- Drie kenmerken van voedsel hangen samen met verzadiging, en ze zijn niet even
-- sterk onderbouwd. In afnemende volgorde van bewijskracht:
--
-- 1. ENERGIEDICHTHEID. Het best onderbouwde en meest herhaalde gegeven in dit
--    veld. Bij gelijk gewicht aan voedsel leidt een lagere energiedichtheid tot
--    een lagere energie-inname (Ello-Martin JA, Ledikwe JH, Rolls BJ,
--    Am J Clin Nutr 2005;82(1 Suppl):236S-241S). Mensen eten grofweg een
--    constant gewicht, niet een constant aantal calorieën.
--
-- 2. EIWIT. De meest verzadigende macronutriënt per kilocalorie. Bij dertig
--    procent van de energie uit eiwit daalde de spontane inname met ruim
--    vierhonderd kcal per dag (Weigle DS et al., Am J Clin Nutr 2005;82:41-8);
--    zie ook het overzicht van Halton TL en Hu FB, J Am Coll Nutr
--    2004;23:373-85.
--
-- 3. VEZEL. Bescheiden en sterk afhankelijk van het soort vezel; vooral
--    viskeuze, gelvormende vezels doen iets. De meta-analyse van Wanders AJ et
--    al. (Obes Rev 2011;12:724-39) vond een klein en inconsistent effect.
--
-- De klassieke meting is de verzadigingsindex van Holt SH, Miller JC, Petocz P,
-- Farmakalidis E (Eur J Clin Nutr 1995;49:675-90): achtendertig voedingsmiddelen,
-- isocalorische porties, wit brood op honderd, gekookte aardappel als hoogste op
-- 323 procent. Dat is een méting en het zou de beste bron zijn — maar hij dekt
-- achtendertig producten en deze tabel heeft er 2328. Er is geen koppeling te
-- maken die niet grotendeels verzinnen is.
--
-- WAT DIT DUS WEL EN NIET IS
--
-- Dit is een VOORSPELLING UIT DE SAMENSTELLING, geen gemeten verzadigingsindex.
-- De drie termen komen uit de literatuur, de weging tussen de termen is mijn
-- keuze. Daarom draagt hij in het scherm het teken voor "geschat" en staat er
-- bij wat de drie onderdelen zijn, zodat je het getal kunt narekenen in plaats
-- van te moeten geloven.
--
-- De score:
--
--     45 × min(1, gram per 100 kcal / 240)
--   + 35 × min(1, gram eiwit per 100 kcal / 12,5)
--   + 20 × min(1, gram vezel per 100 kcal / 5)
--
-- De verhouding 45/35/20 volgt de bewijskracht hierboven. De drie afkappunten
-- zijn niet verzonnen maar gemeten: het zijn de negentigste percentielen van de
-- tabel zelf, over de 2224 producten met energie en eiwit.
--
--     gram per 100 kcal     p50   47    p75  118    p90  238  → afkappunt 240
--     eiwit per 100 kcal    p50  2,96   p75 6,44    p90 12,5  → afkappunt 12,5
--     vezel per 100 kcal              p75 1,82      p90 5,09  → afkappunt 5
--
-- Het afkappen is er om te voorkomen dat één uitschieter de score draagt. Zonder
-- afkapping wint altijd het natste product, ongeacht de rest.
--
-- WAT DE METING OP DE ECHTE TABEL UITWEES
--
-- Eerst gerangschikt zonder enige zeef. Wat er bovenaan kwam:
--
--     Champignon gekookt          100   476 g per 100 kcal
--     Peterselie vers              95   270 g per 100 kcal
--     Yoghurtdrank Fristi          86   417 g per 100 kcal
--     Saus soja-                   81   250 g per 100 kcal
--     Sap tomatengroenten-         66   476 g per 100 kcal
--     Bier alcoholarm              54   455 g per 100 kcal
--     Azijn                        50   455 g per 100 kcal
--
-- Champignons kloppen. De rest niet, en om twee verschillende redenen.
--
-- Peterselie, sojasaus en azijn zijn geen voedsel maar smaakmaker: niemand eet
-- er tweehonderdvijftig gram van. Ze scoren hoog omdat de score per honderd
-- kilocalorieën rekent en je die hoeveelheid nooit haalt.
--
-- Fristi, groentesap en alcoholarm bier zijn dránken, en dat is geen
-- smaakkwestie maar een bevinding: vloeibare calorieën verzadigen minder dan
-- vaste bij gelijke energie. Een verzadigingsscore die drinken aanraadt heeft
-- precies het omgekeerde effect van wat hij belooft.
--
-- Daarom twee zeven, en ze zijn allebei te toetsen. Een lijst met groepen die
-- eruit gaan, en een regexp op de naam voor de drankwoorden die binnen een
-- andere groep zitten — "Yoghurtdrank" staat bij Melk en melkproducten en komt
-- er dus niet via de groep uit.
--
-- EEN ZEEF DIE IK EERST FOUT HAD
--
-- Mijn eerste zeef eiste tachtig kilocalorieën per portie, naar het voorbeeld
-- van bestand 23. Daarmee viel de hele groep Groente eruit: een opscheplepel
-- gekookte groente is vijftig gram en tien tot twintig kilocalorieën. Dat is de
-- categorie die in een verzadigingslijst het meest thuishoort, en mijn zeef
-- gooide hem er als eerste uit.
--
-- De les: de ondergrens van bestand 23 hoort bij een eiwitvraag, waar een
-- portie iets aan een tekort moet bijdragen. Bij een verzadigingsvraag is een
-- lage portie-energie juist de bedoeling. De zeef op smaakmakers moet dus op de
-- groep zitten en niet op de calorieën.
--
-- WAT ER UIT KWAM NA DE ZEVEN
--
--     Champignon gekookt           Groente               100   opscheplepel 50 g
--     Soep heldere m vlees         Soepen                 82   kom 250 g
--     Jackfruit in water blik      Fruit                  81   stuk 120 g
--     Linzen gekookt               Peulvruchten           64   opscheplepel 60 g
--     Shaslick spies m groente     Samengestelde ger.     64   portie 250 g
--     Oesters                      Vis                    62   portie 100 g
--     Aardappel zoete gekookt      Aardappelen            54   stuk 65 g
--     Bulgur gekookt               Graanproducten         54   opscheplepel 60 g
--     Kalfsfricandeau bereid       Vlees en gevogelte     50   portie 100 g
--
-- Dat is een lijst die je aan iemand kunt geven die staat na te denken over het
-- avondeten.
--
-- HET KOPGETAL IS EEN METING, DE SCORE EEN SCHATTING
--
-- Op het scherm staat niet de score voorop maar het aantal gram dat je voor
-- honderd kilocalorieën krijgt. Dat is een deling van twee gemeten waarden uit
-- de tabel en verder niets — geen weging, geen aanname. De score bepaalt de
-- volgorde; het gram-getal is wat je kunt narekenen en wat de keuze maakt.
--
-- WAT JE AL EET WORDT GEMARKEERD, NIET VOORAAN GEZET
--
-- Elke regel draagt een vlag `bekend`: komt dit product uit een groep waar je de
-- afgelopen zestig dagen iets uit gelogd hebt? Dat beantwoordt de vraag "iets
-- wat in de smaak valt" zonder de lijst te vernauwen.
--
-- Sorteren op die vlag zou een fout zijn en wel een bekende. De reden dat
-- bestand 23 bestaat is dat de eigen geschiedenis leegloopt: wie drie weken
-- hetzelfde eet krijgt drie weken hetzelfde voorgesteld. Een lijst uit de tabel
-- die alsnog op je eigen gewoonten sorteert loopt tegen precies dezelfde muur.
-- De vlag is er om te herkennen, niet om te rangschikken.
--
-- ÉÉN PER GROEP
--
-- Zelfde reden als in bestand 23. Zonder die regel zijn de eerste vijftien
-- allemaal groente, want groente heeft de laagste energiedichtheid van de hele
-- tabel. Eén per groep geeft iets te kiezen.
--
-- TERUGDRAAIEN
--
--   drop function if exists public.kal_verzadiging(text, numeric, integer);
--
-- Deze functie leest alleen. Er wordt niets weggeschreven, dus twee keer draaien
-- verandert niets en terugdraaien raakt geen enkele rij.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- BLOK 1 — DE FUNCTIE
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
begin
  -- Dezelfde regel als bij kal_zoeken, kal_portiematen en kal_eiwitrijk: de
  -- tabel is niet zonder aanmelding leesbaar.
  v_id := kal_sessie(p_token);
  v_vandaag := (now() at time zone 'Europe/Amsterdam')::date;

  if p_max_kcal is null or p_max_kcal <= 0 then
    return '[]'::jsonb;
  end if;

  return coalesce((
    with mijn_groepen as (
      -- De hoeken waar deze gebruiker werkelijk uit eet. Alleen om te
      -- markeren, nooit om op te sorteren — zie de toelichting bovenaan.
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
         -- Niet op het bord, of geen voedsel maar smaakmaker. `drank` staat er
         -- zonder woordgrenzen omdat "Yoghurtdrank" één woord is.
         and n.naam_nl !~* '\mrauw\M|onbereid|ongekookt|poeder|gedroogd|extract'
                        '|gist|gelatine|bouillon|kruiden|kiemen'
                        '|drank|drink|\msap\M|limonade|smoothie|shake|siroop'
         -- Groepen waarvan de portie een lepel is, plus de dranken. Vloeibare
         -- calorieën verzadigen minder dan vaste bij gelijke energie, dus een
         -- drank hoort niet in een verzadigingslijst.
         and n.groep not in (
               'Kruiden en specerijen', 'Hartige sauzen', 'Zoete sauzen',
               'Niet-alcoholische dranken', 'Alcoholische dranken',
               'Flesvoeding en preparaten', 'Diversen',
               'Suiker, snoep, zoet beleg', 'Vetten, oliën en hartige sauzen')
    ),
    gescoord as (
      select b.*,
             round(b.kcal100 * b.portie_gram / 100) as portie_kcal,
             -- De afkappunten zijn de p90 van deze tabel, niet een keuze.
             round((45 * least(1, b.gram100 / 240.0)
                  + 35 * least(1, b.eiwit100 / 12.5)
                  + 20 * least(1, b.vezel100 / 5.0))::numeric) as score,
             (b.groep in (select groep from mijn_groepen)) as bekend
        from basis b
    ),
    past as (
      select *,
             row_number() over (partition by groep order by score desc, gram100 desc) as rn
        from gescoord
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
             'score', score, 'bekend', bekend)
           order by score desc, gram100 desc)
      from (select * from past where rn = 1
             order by score desc, gram100 desc
             limit greatest(1, least(coalesce(p_limiet, 5), 10))) x
  ), '[]'::jsonb);
end $function$
;

comment on function public.kal_verzadiging(text, numeric, integer) is
  'Producten met de hoogste voorspelde verzadiging binnen een kcal-grens, een per groep, met standaardportie. Voorspelling uit de samenstelling, geen gemeten verzadigingsindex. Zie 28-wat-vult-het-best.sql.';

grant execute on function public.kal_verzadiging(text, numeric, integer) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- BLOK 2 — NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- Draai deze vier na het toepassen. Ze horen alle vier het antwoord onder de
-- regel te geven.
--
-- 1. De zeven doen werkelijk iets. Zonder de groeps- en naamzeef stonden
--    peterselie, sojasaus, azijn, Fristi en alcoholarm bier in de uitslag.
--
--    select count(*) as smaakmakers_of_dranken
--      from jsonb_array_elements(kal_verzadiging('JOUW_TOKEN', 600, 10)) e
--     where e->>'naam' ~* 'peterselie|soja-|azijn|fristi|bier|sap';
--
--    → 0
--
-- 2. Groente zit er wél in. Dat is de zeef die ik eerst fout had.
--
--    select bool_or(e->>'groep' = 'Groente') as groente_aanwezig
--      from jsonb_array_elements(kal_verzadiging('JOUW_TOKEN', 600, 10)) e;
--
--    → t
--
-- 3. Elke groep hoogstens een keer.
--
--    select count(*) = count(distinct e->>'groep') as een_per_groep
--      from jsonb_array_elements(kal_verzadiging('JOUW_TOKEN', 600, 10)) e;
--
--    → t
--
-- 4. Het kopgetal klopt met de tabel: gram per 100 kcal is 10000 gedeeld door
--    de energie per 100 gram, en verder niets.
--
--    select bool_and(abs((e->>'gram_per_100kcal')::numeric
--                        - round(10000.0 / n.energie_kcal_per_100g)) < 1) as klopt
--      from jsonb_array_elements(kal_verzadiging('JOUW_TOKEN', 600, 10)) e
--      join nevo_actief n on n.nevo_code = e->>'nevo_code';
--
--    → t
--
-- DE TWEE ZEVEN ZIJN ALLEBEI DRAGEND, EN DAT IS GEMETEN
--
-- Op een nagebouwde tabel in een lokale Postgres — twaalf producten met hun
-- echte waarden plus de vijf die er met opzet niet in horen — geeft de functie
-- tien voorstellen, met groente erin, een per groep, en geen smaakmaker of
-- drank. Daarna twee mutanten:
--
--   groepszeef uit   → peterselie, sojasaus en roomboter komen terug (3 stuks)
--   naamzeef uit     → Yoghurtdrank Fristi komt terug
--
-- Die tweede is het bewijs dat de naamzeef níet overbodig is naast de groepen:
-- Fristi staat bij Melk en melkproducten en glipt dus door elke groepszeef heen.
-- Zonder die meting had ik hem eruit kunnen laten in de veronderstelling dat de
-- groepen het wel afvangen.
--
-- En een blik op de uitslag zelf, want een getal dat klopt kan nog steeds een
-- rare lijst zijn:
--
--    select e->>'naam' as naam, e->>'groep' as groep, e->>'score' as score,
--           e->>'gram_per_100kcal' as gram_per_100kcal,
--           e->>'portie_naam' as portie, e->>'kcal' as kcal, e->>'bekend' as bekend
--      from jsonb_array_elements(kal_verzadiging('JOUW_TOKEN', 600, 8)) e;
