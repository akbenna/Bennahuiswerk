-- =============================================================================
-- HUISHOUDMATEN VOOR HARTIGE SAUZEN
--
-- Toegepast 29 augustus 2026.
--
-- Er stond al een eetlepel voor deze groep: 15 g, band 10 tot 20, als standaard.
-- Wat ontbrak was de maat eronder en de maat erboven — een theelepel mayonaise
-- op een cracker, en een schaaltje saus bij het eten. Zonder die twee is elke
-- portie een eetlepel of zelf afwegen.
--
-- Op de groep en niet op het product. Een lepel ketchup, een lepel dressing en
-- een lepel mayonaise zijn alle drie een lepel; aan één nevo_code hangen zou
-- betekenen dat het bij de volgende saus weer niet werkt. De groepsnaam wordt
-- afgeleid uit de tabel zelf en niet ingetypt.
--
-- DE BANDEN ZIJN BREED, EN DAT IS HET PUNT
--
-- Een afgestreken eetlepel is ongeveer 15 g, een volle zo 22. Dat verschil is
-- echt en hoort in de band te staan in plaats van weggemiddeld te worden. Deze
-- app zet geen getal neer zonder zijn onzekerheid, en een lepel is nu eenmaal
-- een onzekere maat. Wie het preciezer wil weegt af; dan blijft alleen de
-- tabelonzekerheid over.
--
-- WAT DIT NIET WAS
--
-- Dit is geen oplossing voor "hij pakt de hele pot in plaats van een lepel". Dat
-- lag ergens anders: `kal-ai` haalde het portiegewicht van het model en keek
-- niet in deze tabel. De maten stonden er al; de weg liep eraan voorbij. Zie de
-- kop van `health/edge/kal-ai.ts`.
--
-- De `where not exists` maakt dit herhaalbaar en beschermt wat er al stond: de
-- bestaande eetlepel hield zijn eigen band 10-20 en werd niet overschreven met
-- de 10-22 uit de lijst hieronder. Twee keer draaien voegt nul rijen toe.
-- =============================================================================

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

-- ---------------------------------------------------------------------------
-- WAT ER NA AFLOOP STOND
-- ---------------------------------------------------------------------------
--
-- INSERT 0 2 — de eetlepel bestond al en werd overgeslagen.
--
-- Vier producten in de groep "Hartige sauzen" (Mayonaise en de drie
-- mayonaiseproducten met yoghurt, 35% olie en olijfolie), elk met drie maten:
--
--   eetlepel   15 g  (10-20)  standaard   <- de bestaande, ongewijzigd
--   theelepel   5 g  ( 4- 7)
--   schaaltje  50 g  (35-70)

select n.naam_nl, m.naam, m.gram_schatting, m.gram_laag, m.gram_hoog, m.is_standaard
from nevo_actief n
join voeding_portiematen m
  on m.nevo_code = n.nevo_code
  or (m.nevo_code is null and m.nevo_groep = n.groep)
where n.naam_nl ilike '%mayonaise%'
order by n.naam_nl, m.is_standaard desc, m.volgorde;

-- Terugdraaien — alleen wat hier is toegevoegd, niet de bestaande eetlepel:
-- delete from voeding_portiematen
--  where nevo_groep = 'Hartige sauzen' and naam in ('theelepel','schaaltje');
