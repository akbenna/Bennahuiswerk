-- =============================================================================
-- EIWITRIJK UIT DE TABEL: de tweede laag onder de coach
--
-- Achterhaald sinds 18 september 2026: bestand 35 heeft `kal_eiwitrijk`
-- vervangen, zodat de functie ook leest wat er in "Wat je lust" staat. Wat hier
-- beneden staat is de versie van daarvoor, en dit bestand is vanaf nu alleen
-- nog de uitleg waarom de functie doet wat hij doet, niet meer de bron.
--
-- Draai het dus níet opnieuw: dan zet je de voorkeuren weer uit zonder dat
-- iemand het merkt. Wat er in de database hoort te staan is de md5 die in de kop
-- van bestand 35 staat.
--
-- Wat hier lang boven stond was "toestand onbekend", en dat is daarmee
-- beantwoord. Niet door het na te zoeken maar doordat het achterhaald raakte,
-- de vraag ging weg in plaats van dat hij een antwoord kreeg.
--
-- DE VRAAG
--
-- De coach op het dagscherm zegt "nog 108 g eiwit te gaan" en stelt daarbij
-- voor uit je eigen geschiedenis. Dat is met opzet: wat je vorige week at ken
-- je, je hebt het in huis, en de portie is de jouwe. Maar die geschiedenis
-- loopt leeg: wie drie weken hetzelfde eet krijgt drie weken hetzelfde
-- voorgesteld, en op de vraag "wat kán ik dan nemen" had de app geen antwoord.
--
-- Dit is dat antwoord: producten uit de voedingsmiddelentabel die het meeste
-- eiwit per calorie leveren, met hun standaardportie erbij, zodat er niet "kwark"
-- staat maar "een glas skyr, 90 kcal, 16 g eiwit". Gemeten waarden (◆), geen
-- schattingen, en gerangschikt op precies de grootheid waarin de coach zijn eis
-- uitdrukt: gram eiwit per kcal.
--
-- WAT ER GEMETEN IS, OP DE ECHTE TABEL
--
-- Bij de eis van het schermvoorbeeld (0,097 g/kcal), hoogstens 350 kcal per
-- portie en minstens 12 g eiwit per portie, één product per groep:
--
--     Vis            Kabeljauw bereid            portie 100 g    98 kcal   23,5 g   0,240
--     Vlees          Runderrollade gebakken      portie 100 g   157 kcal   33,5 g   0,213
--     Zuivel         Skyr naturel magere         glas 150 g      90 kcal   15,9 g   0,177
--     Samengesteld   Shaslick spies varkens      portie 250 g   188 kcal   32,0 g   0,171
--     Vervangers     Seitan gekruid              portie 100 g   198 kcal   28,4 g   0,143
--     Soepen         Soep heldere m vlees        kom 250 g       98 kcal   12,3 g   0,126
--     Gebak          Eiwitreep m chocola         stuk 40 g      148 kcal   14,7 g   0,099
--
-- Dat is een lijst die je aan iemand kunt geven. Zonder de eis van twaalf gram
-- per portie stond er een plak vleeswaar van 15 g bovenaan (3 g eiwit): de
-- dichtheid was hoog, de portie te klein om iets aan het tekort te doen.
--
-- DRIE KEUZES DIE VASTLIGGEN
--
-- Eén product per groep. Zonder dat zijn de eerste vijftien allemaal vis, want
-- magere vis heeft de hoogste dichtheid van de hele tabel. Eén per groep geeft
-- iets te kiezen.
--
-- Rauw telt niet. "Kipfilet rauw" staat in de tabel maar op geen enkel bord;
-- alles met rauw, onbereid, ongekookt, poeder, gedroogd of extract in de naam
-- valt eruit. De bereide variant staat er altijd naast.
--
-- De merkproducten doen mee, als ◈. Een eiwitshake van de supermarkt is een
-- etiketwaarde en geen meting, maar het is wél waar de vraag over ging. Ze
-- komen achter de licentiepoort van bestand 18 vandaan: staat die dicht, dan
-- ontbreken ze en merkt de functie er niets van.
--
-- DE PROEF OP EEN NAGEBOUWDE TABEL
--
-- Twaalf producten uit de echte tabel plus drie merkproducten, in een lokale
-- Postgres. Wat eruit kwam, en wat er met opzet níet in staat:
--
--     nevo  Kabeljauw bereid              portie 100 g    98 kcal   23,5 g   0,240
--     nevo  Runderrollade gebakken        portie 100 g   157 kcal   33,5 g   0,213
--     merk  Eiwitshake vanille (Lidl)     schep 30 g     114 kcal   22,5 g   0,197
--     nevo  Skyr naturel magere           glas 150 g      90 kcal   15,9 g   0,177
--     nevo  Eiwitreep m chocola           stuk 40 g      148 kcal   14,7 g   0,099
--
--     Kipfilet rauw          stond in de tabel, valt eruit op "rauw"
--     Kaas strooi- Zwitserse dichtheid 0,241 (de hoogste) maar een plak van
--                            20 g is 11 g eiwit, en dat is onder de twaalf
--     Paardenrookvlees       dichtheid 0,211, plak van 15 g is 3,3 g eiwit
--     Tarwebrood, Mayonaise  ook bij een eis van 0,02 niet: te weinig eiwit
--                            per portie
--
-- Een onhaalbare eis (9 g/kcal) geeft [], en bij een budget van 120 kcal
-- blijven kabeljauw, de shake en skyr over, de rollade en de reep zijn dan te
-- zwaar. Elk van de vier regels (rauw, twaalf gram, veertig kcal, één per
-- groep) heeft in deze proef aantoonbaar iets tegengehouden.
--
-- WAT DIT NIET IS
--
-- Geen aanbeveling en geen voedingsadvies. De lijst zegt: dit levert het meeste
-- eiwit per calorie binnen wat er vandaag nog past. Of je het lekker vindt, of
-- het in huis is en of het bij de rest van je dag past weet de tabel niet, en
-- de app doet niet alsof. Daarom staat hij ónder je eigen geschiedenis en niet
-- erboven.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- BLOK 1: DE FUNCTIE
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
begin
  -- Geen gebruikersgegevens in deze functie, maar wel een sessie: de tabel
  -- hoort niet zonder aanmelding leesbaar te zijn, en dat is dezelfde regel als
  -- bij kal_zoeken en kal_portiematen.
  v_id := kal_sessie(p_token);

  if p_eis is null or p_eis <= 0 or p_max_kcal is null or p_max_kcal <= 0 then
    return '[]'::jsonb;
  end if;

  return coalesce((
    with nevo as (
      select n.nevo_code, n.naam_nl as naam, n.groep,
             n.energie_kcal_per_100g as kcal100, n.eiwit_g as eiwit100,
             m.naam as portie_naam, m.gram_schatting as portie_gram,
             m.gram_laag, m.gram_hoog
        from nevo_actief n
        -- Dezelfde keuze als in kal_portiematen: een maat op het product zelf
        -- gaat vóór een maat op de groep, en daarbinnen de standaardmaat.
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
             -- Alle merkproducten in één groep, zodat er hoogstens één van
             -- tussen de gemeten producten komt en niet vijf shakes op rij.
             'merk', kcal100, eiwit100, portie_naam, portie_gram,
             -- Een fabrikantportie draagt geen band; de etiketmarge van tien
             -- procent is hier de eerlijkste die er is.
             round(portie_gram * 0.9), round(portie_gram * 1.1)
        from merk
    ),
    per_portie as (
      select *,
             round(kcal100 * portie_gram / 100) as kcal,
             round(eiwit100 * portie_gram / 100, 1) as eiwit,
             round((eiwit100 / kcal100)::numeric, 3) as dichtheid
        from alles
    ),
    past as (
      -- Eerst de portie toetsen, dan pas per groep de beste kiezen. Andersom
      -- zou een groep afvallen zodra zijn dichtste product te groot is.
      select *,
             row_number() over (partition by groep order by dichtheid desc, eiwit desc) as rn
        from per_portie
       where kcal <= p_max_kcal
         and kcal >= 40          -- een hap is geen voorstel
         and eiwit >= 12         -- en een plak vleeswaar van 3 g ook niet
    )
    select jsonb_agg(jsonb_build_object(
             'herkomst', herkomst, 'nevo_code', nevo_code, 'merk', merk,
             'naam', naam, 'groep', groep,
             'portie_naam', portie_naam, 'portie_gram', portie_gram,
             'gram_laag', gram_laag, 'gram_hoog', gram_hoog,
             'kcal', kcal, 'eiwit_g', eiwit, 'dichtheid', dichtheid)
           order by dichtheid desc, eiwit desc)
      from (select * from past where rn = 1
             order by dichtheid desc, eiwit desc
             limit greatest(1, least(coalesce(p_limiet, 4), 10))) x
  ), '[]'::jsonb);
end $function$
;

comment on function public.kal_eiwitrijk(text, numeric, numeric, integer) is
  'Producten met het meeste eiwit per kcal binnen een kcal-grens, één per groep, met standaardportie. Gemeten (nevo) en etiket (merk). Zie 23-eiwitrijk-uit-de-tabel.sql.';


-- ---------------------------------------------------------------------------
-- BLOK 2: NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- Deze vraag heeft een sessietoken nodig; plak er een geldig token in. De
-- eis 0,097 en de grens 350 zijn die van het schermvoorbeeld.

-- select jsonb_pretty(kal_eiwitrijk('<token>', 0.097, 350, 6));

-- Wat er hoort te staan: één product per groep, gerangschikt op dichtheid,
-- geen enkel product met "rauw" in de naam, elke portie minstens 12 g eiwit en
-- hoogstens 350 kcal. En bij een onmogelijke eis een lege lijst:

-- select kal_eiwitrijk('<token>', 9, 350, 6);   -- []

-- Terugdraaien: drop function public.kal_eiwitrijk(text, numeric, numeric, integer);
