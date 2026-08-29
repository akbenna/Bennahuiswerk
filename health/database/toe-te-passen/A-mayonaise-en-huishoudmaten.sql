-- ===========================================================================
-- A. MAYONAISE, EN WAAROM HET NIET AAN HET ZOEKEN LAG
-- ===========================================================================
--
-- Dit bestand staat in `toe-te-passen/` en niet in `health/database/` zelf. Die
-- genummerde bestanden zijn een verslag van wat er in de database stáát; dit is
-- een voorstel dat er nog niet in zit. Zodra het toegepast is hoort het te
-- verhuizen naar het volgende nummer en hoort deze kop weg.
--
-- WAT ER GEMETEN IS, EN WAAR
--
-- Ik kan niet bij de database van de app. Wat ik wél kon: een echte Postgres 16
-- opzetten, daar `nevo_versies`, `nevo_foods`, `voeding_portiematen`, de
-- weergave `nevo_actief` en de functie `kal_nevo_zoek` letterlijk uit
-- `gereedschap/verhuizing/schema-gegenereerd.sql` in laden, en de vraag echt
-- stellen. Dat maakt het volgende geen vermoeden meer:
--
--   * "mayo" wérkt. De zoekregel voor woorden van vier letters is "begin van een
--     woord", en `mayonaise` begint met `mayo`. Twee treffers, meteen. Het lag
--     dus niet aan het zoeken, en een synoniem "mayo" toevoegen zou niets
--     opgelost hebben — dat stond hier eerst wel, en is eruit.
--
--   * Wat er wél ontbreekt zijn de huishoudmaten. Zonder een rij in
--     `voeding_portiematen` is de lijst `maten` leeg, en dan heeft het
--     portievenster niets om aan te bieden: je kunt alleen nog zelf een gewicht
--     typen. Dat is precies "hij geeft de hele pot in plaats van een lepel".
--
--   * "pasta" vindt `Macaroni, ongekookt` niet. Geen gedeeld woordbegin, dus
--     geen treffer. Dát is het echte synoniemgat, en daar gaat blok 3 over.
--
-- Wat ik níet kan weten is hoe het er in júllie 2.328 rijen voorstaat: onder
-- welke naam mayonaise erin zit, of de licentiepoort openstaat, en welke groepen
-- nu al maten hebben. Daar is blok 1 voor. Het leest alleen.
--
-- HOE TE DRAAIEN
--
-- Blok voor blok, in de SQL-editor van Supabase. Selecteer één blok, draai het,
-- kijk naar de uitkomst, ga dan pas verder. De editor draait een selectie als
-- één transactie: gaat er iets mis, dan blijft er niets van achter.
--
-- Elk blok is herhaalbaar. Twee keer draaien geeft niet twee lepels; dat is hier
-- nagedaan en de tweede keer voegde nul rijen toe.


-- ---------------------------------------------------------------------------
-- BLOK 1 — METEN. Verandert niets.
-- ---------------------------------------------------------------------------

-- 1a. Staat de licentiepoort open? `nevo_actief` toont alleen rijen van een
--     versie die actief én licentie-gecontroleerd is. Staat hier 0, dan vindt
--     zoeken helemaal niets en is de rest van dit bestand niet aan de orde.
select 'licentiepoort' as wat,
       (select count(*) from nevo_versies where is_actief and licentie_gecontroleerd) as actieve_versies,
       (select count(*) from nevo_actief) as producten_zichtbaar;

-- 1b. Onder welke naam staat mayonaise erin? Alles hierna hangt hieraan: komt
--     hier niets uit, dan is het product er niet en helpt geen enkel blok.
select nevo_code, naam_nl, naam_en, synoniem_nevo, synoniemen_afgeleid, groep,
       energie_kcal_per_100g
from nevo_actief
where naam_nl ilike '%mayonaise%'
   or naam_nl ilike '%mayonnaise%'
   or naam_en ilike '%mayonnaise%'
   or coalesce(synoniem_nevo,'') ilike '%mayo%'
order by naam_nl;

-- 1c. En wat doet de zoekfunctie ermee? Hier hoort een getal boven nul te staan.
--     Staat er wél 0 terwijl 1b rijen gaf, dan klopt mijn meting niet voor jullie
--     gegevens en moeten we daar eerst naar kijken in plaats van blok 2 te doen.
select 'mayo' as term, count(*) as treffers from kal_nevo_zoek('mayo', 20)
union all select 'mayonaise', count(*) from kal_nevo_zoek('mayonaise', 20)
union all select 'slasaus',   count(*) from kal_nevo_zoek('slasaus', 20);

-- 1d. De kern. Heeft mayonaise een huishoudmaat? Verwachting: nul.
select n.groep,
       count(distinct n.nevo_code) as producten,
       count(distinct m.id)        as maten_voor_die_groep
from nevo_actief n
left join voeding_portiematen m
       on m.nevo_code = n.nevo_code
       or (m.nevo_code is null and m.nevo_groep = n.groep)
where n.naam_nl ilike '%mayonaise%'
group by n.groep;

-- 1e. Hoe scheef staat het in het algemeen: welke groepen hebben helemaal geen
--     huishoudmaat, en om hoeveel producten gaat dat? Dit is de lijst waarmee we
--     verder kunnen. Ik verzin geen gewichten voor groepen die ik niet zie —
--     stuur deze uitkomst terug, dan schrijf ik het volgende blok erop.
select n.groep, count(*) as producten
from nevo_actief n
where not exists (
        select 1 from voeding_portiematen m
         where m.nevo_code = n.nevo_code
            or (m.nevo_code is null and m.nevo_groep = n.groep))
group by n.groep
order by count(*) desc
limit 30;


-- ---------------------------------------------------------------------------
-- BLOK 2 — EEN LEPEL, GEEN POT
-- ---------------------------------------------------------------------------
--
-- Dit is de eigenlijke klacht. Wie mayonaise op zijn brood doet eet geen 100
-- gram; hij eet een lepel. Zonder huishoudmaat is 100 g wat er overblijft, en
-- dat scheelt vijfhonderd calorieën.
--
-- Op de groep en niet op het product. Een lepel ketchup, een lepel dressing en
-- een lepel mayonaise zijn alle drie een lepel; ze aan één nevo_code hangen zou
-- betekenen dat het bij de volgende saus weer niet werkt. De groepsnaam wordt
-- hier afgeleid uit de tabel zelf en niet ingetypt — heet hij bij jullie anders
-- dan "Sauzen en dressings", dan klopt dit nog steeds.
--
-- DE BANDEN ZIJN BREED, EN DAT IS HET PUNT
--
-- Een afgestreken eetlepel mayonaise is ongeveer 15 g; een volle is er zo 22.
-- Dat verschil is echt en het hoort in de band te staan, niet weggemiddeld te
-- worden. Deze app zet geen getal neer zonder zijn onzekerheid, en een lepel is
-- nu eenmaal een onzekere maat. Wie het preciezer wil weegt af — die keuze staat
-- er ook, en dan blijft alleen de tabelonzekerheid over.
--
-- `is_standaard` staat op de eetlepel. Dat is wat het portievenster als eerste
-- aanbiedt, en dus wat je krijgt als je niets kiest.

insert into voeding_portiematen
  (nevo_groep, naam, meervoud, gram_schatting, gram_laag, gram_hoog,
   is_standaard, volgorde, herkomst)
select g.groep, m.naam, m.meervoud, m.gram, m.laag, m.hoog, m.standaard, m.volgorde,
       'gebruikelijk'
from (
        select distinct groep
          from nevo_actief
         where groep is not null
           and (naam_nl ilike '%mayonaise%' or naam_nl ilike '%mayonnaise%')
     ) g
cross join (values
      ('theelepel', 'theelepels',  5::numeric,  4::numeric,  7::numeric, false, 1),
      ('eetlepel',  'eetlepels',  15::numeric, 10::numeric, 22::numeric, true,  2),
      ('schaaltje', 'schaaltjes', 50::numeric, 35::numeric, 70::numeric, false, 3)
   ) as m(naam, meervoud, gram, laag, hoog, standaard, volgorde)
where not exists (
        select 1 from voeding_portiematen v
         where v.nevo_groep = g.groep and v.naam = m.naam);

-- Nakijken: dit is letterlijk wat het portievenster te zien krijgt.
select n.naam_nl, m.naam, m.gram_schatting, m.gram_laag, m.gram_hoog, m.is_standaard
from nevo_actief n
join voeding_portiematen m
  on m.nevo_code = n.nevo_code
  or (m.nevo_code is null and m.nevo_groep = n.groep)
where n.naam_nl ilike '%mayonaise%'
order by n.naam_nl, m.is_standaard desc, m.volgorde;

-- Terugdraaien:
-- delete from voeding_portiematen
--  where herkomst = 'gebruikelijk'
--    and naam in ('theelepel','eetlepel','schaaltje')
--    and nevo_groep in (select distinct groep from nevo_actief
--                        where naam_nl ilike '%mayonaise%');


-- ---------------------------------------------------------------------------
-- BLOK 3 — WOORDEN DIE JE THUIS GEBRUIKT
-- ---------------------------------------------------------------------------
--
-- Niet "mayo": dat werkt al. Wel het geval waar de zoekregel niets aan kan doen
-- omdat het woord niets met de tabelnaam gemeen heeft. "pasta" vindt `Macaroni`
-- niet, en zal dat nooit doen — er is geen gedeeld woordbegin. Daar is
-- `synoniemen_afgeleid` voor: het is geen NEVO-gegeven maar iets van ons, dus
-- het aanvullen tast de bron niet aan en de zoekfunctie kijkt er wel in mee.
--
-- 3a eerst: welke van deze woorden vindt nu al iets? Vul de lijst gerust aan met
--     wat de kinderen en jij werkelijk intypen. Alles wat op 0 staat is een gat.

select w.woord, (select count(*) from kal_nevo_zoek(w.woord, 20)) as treffers
from (values ('pasta'),('mayo'),('pindakaas'),('hagelslag'),('frisdrank'),
             ('patat'),('sla'),('kipfilet'),('yoghurt'),('kaas'),
             ('chips'),('koek'),('cola'),('brood'),('rijst')) as w(woord)
order by treffers, w.woord;

-- 3b. En dan de koppeling: woord → producten waar het bij hoort. Alleen de paren
--     invullen waarvan 3a liet zien dat ze nu niets vinden, en alleen waar je
--     zeker van bent. Een synoniem dat te ruim staat maakt het zoeken slechter,
--     niet beter — dan komt bij "pasta" ook de pastasaus omhoog.
--
--     Herhaalbaar: het woord wordt alleen toegevoegd als het er nog niet staat.

update nevo_foods f
   set synoniemen_afgeleid = f.synoniemen_afgeleid || array[p.woord]
from (values
        ('pasta', '%macaroni%'),
        ('pasta', '%spaghetti%'),
        ('pasta', '%penne%')
     ) as p(woord, patroon)
 where f.naam_nl ilike p.patroon
   and not (p.woord = any(f.synoniemen_afgeleid));

-- Nakijken:
select 'pasta' as term, count(*) as treffers from kal_nevo_zoek('pasta', 20);

-- Terugdraaien:
-- update nevo_foods set synoniemen_afgeleid = array_remove(synoniemen_afgeleid, 'pasta')
--  where 'pasta' = any(synoniemen_afgeleid);
