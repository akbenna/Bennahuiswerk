-- ===========================================================================
-- F. LICHT, ZWAAR, EN GEKOOKT
-- ===========================================================================
--
-- Nog niet toegepast. Draai dit ná bestand D.
--
-- Bestand D gaf alle ontbijtproducten dezelfde maten: schaaltje 40 g,
-- opscheplepel 18 g, eetlepel 10 g. Die zijn op cornflakes gekalibreerd, en dat
-- is voor een deel van die groep te licht.
--
--   * Muesli, granola en cruesli zijn geen vlokken maar noten, zaden en
--     gedroogd fruit. Een opscheplepel daarvan is eerder 25 à 30 gram dan 18, en
--     een schaaltje 50 in plaats van 40.
--
--   * En als het patroon uit D ook gekóókte producten heeft geraakt — pap,
--     bereide havermout — dan staat daar nu een schaaltje van 40 gram terwijl
--     een kom pap er tweehonderdvijftig weegt. Dat is precies dezelfde fout als
--     de cornflakes, alleen zes keer de andere kant op.
--
-- Dat tweede is de reden dat dit bestand er nu is en niet later. Een maat die te
-- laag staat is net zo onwaar als een die te hoog staat, en sinds `kal-ai` het
-- tabelgewicht boven de schatting van het model zet, wordt hij ook nog geloofd.
--
-- WAT ER MET GEKOOKTE PRODUCTEN GEBEURT
--
-- Die krijgen hun productmaten niet bijgesteld maar weggehaald. Dan valt de app
-- terug op de groepsmaat — opscheplepel 60 g — en die klopt voor pap ongeveer
-- wel. Een maat weghalen is hier beter dan hem verzinnen: pap is de ene keer dun
-- en de andere keer dik, en dat verschil ken ik niet.


-- ---------------------------------------------------------------------------
-- BLOK 1 — WAT ER NU STAAT. Verandert niets.
-- ---------------------------------------------------------------------------
--
-- Alle producten die uit bestand D een eigen maat kregen, met de indeling die
-- dit bestand erop wil toepassen. Kijk de derde kolom na: staat er iets in
-- "zwaar" dat vlokken zijn, of iets in "licht" dat gekookt is, dan klopt het
-- patroon niet en moet dat eerst.

select n.naam_nl, n.energie_kcal_per_100g,
       case
         when n.naam_nl ilike '%pap%' or n.naam_nl ilike '%bereid%'
           or n.naam_nl ilike '%gekookt%' or n.naam_nl ilike '%met melk%' then 'GEKOOKT → maten eraf'
         when n.naam_nl ilike '%muesli%' or n.naam_nl ilike '%granola%'
           or n.naam_nl ilike '%cruesli%' or n.naam_nl ilike '%crunchy%'  then 'zwaar → 28 g'
         else 'licht → blijft 18 g'
       end as indeling
from nevo_actief n
where exists (select 1 from voeding_portiematen m where m.nevo_code = n.nevo_code)
  and n.groep = 'Graanproducten en meelsoorten'
order by indeling, n.naam_nl;


-- ---------------------------------------------------------------------------
-- BLOK 2 — GEKOOKTE PRODUCTEN: MATEN ERAF
-- ---------------------------------------------------------------------------
--
-- Eerst dit, want het is de fout die het meeste scheelt. Alleen de maten die uit
-- bestand D komen worden weggehaald; een maat die iemand met de hand heeft
-- neergezet blijft staan, want die is bewust.

delete from voeding_portiematen m
 where m.herkomst = 'gebruikelijk'
   and m.naam in ('schaaltje','opscheplepel','eetlepel')
   and m.nevo_code in (
        select n.nevo_code from nevo_actief n
         where n.groep = 'Graanproducten en meelsoorten'
           and (n.naam_nl ilike '%pap%' or n.naam_nl ilike '%bereid%'
                or n.naam_nl ilike '%gekookt%' or n.naam_nl ilike '%met melk%'));


-- ---------------------------------------------------------------------------
-- BLOK 3 — ZWAAR: MUESLI, GRANOLA, CRUESLI
-- ---------------------------------------------------------------------------
--
-- Bijstellen en niet toevoegen: de rijen bestaan al uit bestand D. De voorwaarde
-- op de oude waarde maakt het herhaalbaar en zorgt dat een rij die iemand zelf
-- heeft aangepast met rust gelaten wordt.

update voeding_portiematen m
   set gram_schatting = nieuw.gram, gram_laag = nieuw.laag, gram_hoog = nieuw.hoog
  from (values
      ('schaaltje',    50::numeric, 35::numeric, 70::numeric, 40::numeric),
      ('opscheplepel', 28::numeric, 20::numeric, 40::numeric, 18::numeric),
      ('eetlepel',     15::numeric, 10::numeric, 22::numeric, 10::numeric)
     ) as nieuw(naam, gram, laag, hoog, oud)
 where m.naam = nieuw.naam
   and m.gram_schatting = nieuw.oud
   and m.herkomst = 'gebruikelijk'
   and m.nevo_code in (
        select n.nevo_code from nevo_actief n
         where n.groep = 'Graanproducten en meelsoorten'
           and (n.naam_nl ilike '%muesli%' or n.naam_nl ilike '%granola%'
                or n.naam_nl ilike '%cruesli%' or n.naam_nl ilike '%crunchy%'));


-- ---------------------------------------------------------------------------
-- BLOK 4 — NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- Verwacht: de vlokken houden 40/18/10, de mueslisoorten staan op 50/28/15, en
-- de gekookte producten hebben geen eigen maat meer — daar zie je alleen nog de
-- groepsmaat opscheplepel 60 g.

select n.naam_nl, m.naam, m.gram_schatting, m.gram_laag, m.gram_hoog,
       m.nevo_code is not null as op_het_product
from nevo_actief n
join voeding_portiematen m
  on m.nevo_code = n.nevo_code or (m.nevo_code is null and m.nevo_groep = n.groep)
where n.groep = 'Graanproducten en meelsoorten'
  and (n.naam_nl ilike '%cornflakes%' or n.naam_nl ilike '%muesli%'
       or n.naam_nl ilike '%pap%')
order by n.naam_nl, m.nevo_code is not null desc, m.is_standaard desc, m.volgorde;

-- En het aantal maten per soort, als samenvatting:
select case
         when n.naam_nl ilike '%pap%' or n.naam_nl ilike '%bereid%'
           or n.naam_nl ilike '%gekookt%' or n.naam_nl ilike '%met melk%' then 'gekookt'
         when n.naam_nl ilike '%muesli%' or n.naam_nl ilike '%granola%'
           or n.naam_nl ilike '%cruesli%' or n.naam_nl ilike '%crunchy%'  then 'zwaar'
         else 'licht'
       end as soort,
       count(distinct n.nevo_code) as producten,
       count(m.id)                 as eigen_maten
from nevo_actief n
left join voeding_portiematen m on m.nevo_code = n.nevo_code
where n.groep = 'Graanproducten en meelsoorten'
group by 1 order by 1;
