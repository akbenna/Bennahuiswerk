-- ===========================================================================
-- D. DE HUISHOUDMATEN VERDIEPEN — en één die aantoonbaar fout uitpakt
-- ===========================================================================
--
-- Nog niet toegepast.
--
-- Gemeten: 26 groepen, 2.328 producten, 37 huishoudmaten. Geen groep staat leeg,
-- maar bijna elke groep heeft er één of twee. Dat was tot vandaag hooguit
-- onhandig; sinds `kal-ai` het tabelgewicht boven de schatting van het model
-- zet, is het meer dan dat. Een maat die er staat wint nu, en zegt er zelf bij
-- "niet geschat".
--
-- Daarom is dit bestand voorzichtiger dan het zou kunnen zijn. Alles wat er in
-- staat is een maat waarvan de spraakgebruikelijke betekenis vastligt — een snee,
-- een plak, een kopje — met een band die eerlijk breed is. Wat ik niet zeker weet
-- staat er niet in.
--
-- DE FOUT DIE ER AL IN ZIT
--
-- "Graanproducten en meelsoorten" heeft één maat: opscheplepel, 60 g. Dat klopt
-- voor gekookte rijst en pasta. Het klopt niet voor cornflakes, want die zijn
-- lucht: een opscheplepel cornflakes is 15 à 20 gram.
--
-- Dat is geen theorie. In de eigen loggeschiedenis staat:
--
--     Ontbijtproduct Cornflakes · 3× opscheplepel (180 g) · 672 kcal
--
-- Een normale kom cornflakes is 30 tot 45 gram. Daar staat dus ruwweg vier keer
-- te veel, zo'n vijfhonderd kilocalorieën op één regel.
--
-- Dit is de zwakke plek van maten op groepsniveau: ze breken zodra een groep
-- zowel zware als luchtige producten bevat. De tabel kan dat aan — een maat mag
-- ook aan één product hangen — maar dan moet die er wel staan.
--
-- HOE EEN PRODUCTMAAT WINT
--
-- `kal_portiematen` sorteert op `is_standaard desc, volgorde` en geeft de
-- productmaat geen voorrang. Die voorrang is dus niet af te dwingen met een
-- functiewijziging maar met de gegevens zelf: de productmaat krijgt
-- `is_standaard` én `volgorde` 0, en komt daarmee vóór de groepsmaat van
-- volgorde 1. Hieronder nagedaan.


-- ---------------------------------------------------------------------------
-- BLOK 1 — WELKE PRODUCTEN RAAKT DIT? Verandert niets.
-- ---------------------------------------------------------------------------
--
-- Kijk deze lijst na vóór blok 2. Staat er iets tussen wat géén luchtig
-- ontbijtgraan is, dan klopt het patroon niet en moet dat eerst.

select nevo_code, naam_nl, groep, energie_kcal_per_100g
from nevo_actief
where groep = 'Graanproducten en meelsoorten'
  and (naam_nl ilike '%cornflakes%' or naam_nl ilike '%muesli%'
       or naam_nl ilike '%granola%'  or naam_nl ilike '%crunchy%'
       or naam_nl ilike '%rice krispies%' or naam_nl ilike '%havervlokken%'
       or naam_nl ilike '%ontbijtgranen%' or naam_nl ilike '%ontbijtproduct%')
order by naam_nl;


-- ---------------------------------------------------------------------------
-- BLOK 2 — EEN SCHAALTJE ONTBIJTGRAAN, OP HET PRODUCT
-- ---------------------------------------------------------------------------
--
-- 40 g met band 25–60. Cornflakes zitten aan de onderkant, muesli en granola aan
-- de bovenkant; de band omvat beide eerlijk. De eetlepel erbij voor wie het over
-- zijn yoghurt strooit.

insert into voeding_portiematen
  (nevo_code, naam, meervoud, gram_schatting, gram_laag, gram_hoog,
   is_standaard, volgorde, herkomst)
select n.nevo_code, m.naam, m.meervoud, m.gram, m.laag, m.hoog, m.standaard, m.volgorde,
       'gebruikelijk'
from nevo_actief n
cross join (values
      -- volgorde 0 én standaard: zo komt hij vóór de opscheplepel van de groep
      ('schaaltje',    'schaaltjes',    40::numeric, 25::numeric, 60::numeric, true,  0),
      -- De opscheplepel moet hier óók staan, en dat was eerst niet zo. De groep
      -- heeft er een van 60 g; laat je die staan, dan krijgt wie op
      -- "opscheplepel" tikt nog steeds het gewicht van gekookte rijst. Een
      -- opscheplepel cornflakes is 15 à 20 gram.
      ('opscheplepel', 'opscheplepels', 18::numeric, 12::numeric, 25::numeric, false, 1),
      ('eetlepel',     'eetlepels',     10::numeric,  7::numeric, 15::numeric, false, 2)
   ) as m(naam, meervoud, gram, laag, hoog, standaard, volgorde)
where n.groep = 'Graanproducten en meelsoorten'
  and (n.naam_nl ilike '%cornflakes%' or n.naam_nl ilike '%muesli%'
       or n.naam_nl ilike '%granola%'  or n.naam_nl ilike '%crunchy%'
       or n.naam_nl ilike '%rice krispies%' or n.naam_nl ilike '%havervlokken%'
       or n.naam_nl ilike '%ontbijtgranen%' or n.naam_nl ilike '%ontbijtproduct%')
  and not exists (
        select 1 from voeding_portiematen v
         where v.nevo_code = n.nevo_code and v.naam = m.naam);


-- ---------------------------------------------------------------------------
-- BLOK 3 — DE MATEN DIE ONTBRAKEN
-- ---------------------------------------------------------------------------
--
-- Elk van deze is een woord waarvan iedereen hetzelfde verstaat. De banden zijn
-- ruim: een "stuk" groente kan een tomaat of een courgette zijn, en dan is 50 tot
-- 200 gram de waarheid en niet de gemakzucht.
--
-- Wat er met opzet NIET in staat: maten voor groepen waar het woord te veel
-- kanten op kan. "Diversen" krijgt niets, en "Samengestelde gerechten" ook niet —
-- daar is een portie al de enige zinvolle eenheid.

insert into voeding_portiematen
  (nevo_groep, naam, meervoud, gram_schatting, gram_laag, gram_hoog,
   is_standaard, volgorde, herkomst)
select v.groep, v.naam, v.meervoud, v.gram, v.laag, v.hoog, false, v.volgorde, 'gebruikelijk'
from (values
   -- groep                                  naam          meervoud       g   laag  hoog vlgd
   ('Groente',                              'stuk',       'stuks',       100,  50,  200, 3),
   ('Vlees en gevogelte',                   'stuk',       'stuks',       125,  90,  180, 2),
   ('Vis, schaal- en schelpdieren',         'stuk',       'stuks',       125,  90,  180, 2),
   ('Gebak en koek',                        'punt',       'punten',       90,  60,  130, 2),
   ('Graanproducten en meelsoorten',        'eetlepel',   'eetlepels',    15,  10,   25, 2),
   ('Kaas',                                 'blokje',     'blokjes',      10,   7,   15, 2),
   ('Noten en zaden',                       'eetlepel',   'eetlepels',    10,   7,   15, 2),
   ('Fruit',                                'schaaltje',  'schaaltjes',  150, 100,  220, 3),
   ('Hartige snacks en zoutjes',            'schaaltje',  'schaaltjes',   50,  30,   80, 2),
   ('Melk en melkproducten',                'kopje',      'kopjes',      125, 100,  150, 3),
   ('Niet-alcoholische dranken',            'kopje',      'kopjes',      125, 100,  175, 3),
   ('Soepen',                               'kopje',      'kopjes',      150, 125,  200, 2)
 ) as v(groep, naam, meervoud, gram, laag, hoog, volgorde)
where exists (select 1 from nevo_actief n where n.groep = v.groep)
  and not exists (
        select 1 from voeding_portiematen m
         where m.nevo_groep = v.groep and m.naam = v.naam);


-- ---------------------------------------------------------------------------
-- BLOK 4 — EEN SLORDIGHEID VAN MEZELF
-- ---------------------------------------------------------------------------
--
-- Bij de hartige sauzen kreeg de theelepel volgorde 1, net als de eetlepel. Dat
-- valt niet op omdat de eetlepel standaard is en dus toch vooraan komt, maar
-- twee rijen met hetzelfde volgnummer zijn een gok in plaats van een volgorde.

update voeding_portiematen
   set volgorde = 2
 where nevo_groep = 'Hartige sauzen' and naam = 'theelepel' and volgorde = 1;


-- ---------------------------------------------------------------------------
-- BLOK 5 — DE PRODUCTMAAT LATEN WINNEN
-- ---------------------------------------------------------------------------
--
-- Dit blok kwam er pas na het draaien van blok 2, en dat is precies waarom het
-- gedraaid moest worden.
--
-- Het idee was dat een maat op het product zou winnen door hem `is_standaard` en
-- volgorde 0 te geven. Voor het schaaltje werkt dat. Voor de opscheplepel niet:
-- die van de groep draagt zelf `is_standaard`, en `is_standaard desc` weegt
-- zwaarder dan het volgnummer. Bij cornflakes stond de opscheplepel van 60 g dus
-- nog steeds boven die van 18 g.
--
-- Met alleen gegevens is dat niet op te lossen. Om een standaard-groepsmaat te
-- verslaan zou de productmaat óók standaard moeten zijn, en dan staan er twee
-- standaarden en beslist het volgnummer alsnog willekeurig. De voorrang hoort
-- dus in de functie, en daar is het één regel: eerst wat aan het product hangt,
-- dan pas wat aan de groep hangt.
--
-- `kal-ai` deed dit al zo. Nu doet het portievenster het ook.

CREATE OR REPLACE FUNCTION public.kal_portiematen(p_token text, p_nevo_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_gebruiker uuid;
  v_uit       jsonb;
begin
  v_gebruiker := kal_sessie(p_token);

  select jsonb_build_object(
    'nevo_code', n.nevo_code,
    'naam',      n.naam_nl,
    'groep',     n.groep,
    'kcal',      n.energie_kcal_per_100g,
    'eiwit_g',   n.eiwit_g,
    'vet_g',     n.vet_g,
    'koolhydraat_g', n.koolhydraten_g,
    'vezel_g',   n.vezels_g,
    'maten', coalesce((
      select jsonb_agg(jsonb_build_object(
               'naam',      m.naam,
               'meervoud',  coalesce(m.meervoud, m.naam),
               'gram',      m.gram_schatting,
               'gram_laag', m.gram_laag,
               'gram_hoog', m.gram_hoog,
               'standaard', m.is_standaard,
               'herkomst',  m.herkomst,
               'dietist',   m.gecontroleerd_door_dietist)
             -- Een maat op het product zelf gaat vóór een maat op de groep.
             -- Zonder deze regel wint de groepsmaat zodra die `is_standaard`
             -- draagt, en dan staat bij cornflakes de opscheplepel van 60 g
             -- (gekookte granen) boven die van 18 g (cornflakes). Met alleen
             -- gegevens is dat niet te winnen: om een standaard-groepsmaat te
             -- verslaan zou de productmaat óók standaard moeten zijn, en dan
             -- zijn er twee standaarden. Het hoort dus hier.
             order by (m.nevo_code is not null) desc, m.is_standaard desc, m.volgorde)
        from voeding_portiematen m
       where m.nevo_code = n.nevo_code
          or (m.nevo_code is null and m.nevo_groep = n.groep)), '[]'::jsonb))
    into v_uit
    -- nevo_actief: de licentiepoort. Staat de licentie niet op gecontroleerd,
    -- dan is dit product onvindbaar en volgt de melding hieronder.
    from nevo_actief n
   where n.nevo_code = p_nevo_code
   limit 1;

  if v_uit is null then
    raise exception 'Dit product staat niet in het voedingsstoffenbestand';
  end if;
  return v_uit;
end
$function$
;


-- ---------------------------------------------------------------------------
-- BLOK 6 — NAKIJKEN
-- ---------------------------------------------------------------------------

-- Cornflakes: het schaaltje van 40 g hoort nu bovenaan te staan, vóór de
-- opscheplepel van de groep. Staat de opscheplepel nog eerst, dan wint de
-- groepsmaat en is er niets veranderd aan de fout.
select n.naam_nl, m.naam, m.gram_schatting, m.gram_laag, m.gram_hoog,
       m.is_standaard, m.volgorde, m.nevo_code is not null as op_het_product
from nevo_actief n
join voeding_portiematen m
  on m.nevo_code = n.nevo_code or (m.nevo_code is null and m.nevo_groep = n.groep)
where n.naam_nl ilike '%cornflakes%'
order by m.is_standaard desc, m.volgorde;

-- En het nieuwe totaalbeeld: hoeveel maten heeft elke groep nu?
select n.groep,
       count(distinct n.nevo_code) as producten,
       count(distinct m.id)        as maten
from nevo_actief n
left join voeding_portiematen m
       on m.nevo_code = n.nevo_code
       or (m.nevo_code is null and m.nevo_groep = n.groep)
group by n.groep
order by count(distinct m.id), count(distinct n.nevo_code) desc;

-- Terugdraaien:
-- delete from voeding_portiematen where herkomst = 'gebruikelijk' and nevo_code in (
--   select nevo_code from nevo_actief where groep = 'Graanproducten en meelsoorten');
-- (en voor blok 3: verwijder op nevo_groep + naam uit de lijst hierboven)
