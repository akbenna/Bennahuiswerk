-- ===========================================================================
-- E. ÉÉN LOGREGEL RECHTZETTEN
-- ===========================================================================
--
-- Nog niet toegepast. Draai dit ná bestand D.
--
-- Op 26 augustus staat in het log:
--
--     Ontbijtproduct Cornflakes · 3× opscheplepel (180 g) · 672 kcal
--
-- Die 180 gram komt uit de groepsmaat "opscheplepel 60 g", die klopt voor
-- gekookte rijst en niet voor cornflakes. Bestand D zet die maat recht op
-- 18 gram; dit bestand zet de regel recht die er al mee gemaakt is.
--
-- WAAROM DIT ÜBERHAUPT UITMAAKT
--
-- Het is geen boekhouding. Het model leest de weegreeks én wat er gelogd is, en
-- schat daaruit het verbruik. Een dag met vijfhonderd kilocalorieën te veel erin
-- duwt die schatting omhoog: het model denkt dat je meer verbrandt dan je doet.
-- Eén regel is niet dramatisch, maar hij is er, hij is aanwijsbaar fout, en hij
-- is te repareren.
--
-- WAT ER NIET GEBEURT
--
-- Er wordt niet geschaald. De oude getallen worden weggegooid en opnieuw
-- uitgerekend uit de tabelwaarde bij het nieuwe gewicht — dezelfde weg die de
-- server neemt bij een nieuwe regel. Een oud getal maal een factor zou de fout
-- meenemen die er misschien nog meer in zat.
--
-- En de hoeveelheid blijft 3 opscheplepels. Dat is wat er ingevoerd is en dat is
-- waarschijnlijk ook wat er gebeurd is: drie scheppen in een kom. Alleen wat een
-- schep weegt was fout. Er staat dus straks 3 × 18 = 54 gram, met een band van
-- 3 × 12 tot 3 × 25.


-- ---------------------------------------------------------------------------
-- BLOK 1 — DE REGEL, VOLLEDIG. Verandert niets.
-- ---------------------------------------------------------------------------
--
-- BEWAAR DEZE UITKOMST. Het is de enige weg terug: een update laat geen kopie
-- achter. Kopieer de JSON uit de tweede kolom ergens heen voordat je verder gaat.

select id, datum, naam, hoeveelheid, eenheid, gram_equivalent, kcal_punt,
       to_jsonb(r) as volledige_regel_bewaar_dit
from kal_regels r
where naam ilike '%cornflakes%'
order by created_at desc;


-- ---------------------------------------------------------------------------
-- BLOK 2 — RECHTZETTEN
-- ---------------------------------------------------------------------------
--
-- Alleen regels die aan alle drie voldoen: cornflakes in de naam, een koppeling
-- aan de tabel (zonder tabelwaarde valt er niets te herrekenen), en een gewicht
-- dat op de oude groepsmaat wijst. Die laatste voorwaarde maakt het bovendien
-- herhaalbaar: na afloop is het gewicht 54 en grijpt hij niet nog een keer.
--
-- De naam draagt het oude gewicht ook: "· 3× opscheplepel (180 g)". Dat stukje
-- wordt meegeschreven, anders staat er straks een regel die zichzelf tegenspreekt.

/* Geen `lateral` om het nieuwe gewicht één keer uit te rekenen: Postgres staat
   niet toe dat een FROM-onderdeel terugwijst naar de tabel die je bijwerkt, en
   dat is precies wat zo'n hulpregel zou doen. Dus staat `r.hoeveelheid * 18` er
   gewoon een paar keer. Dat kwam er niet uit door beter nadenken maar door het
   te draaien: "invalid reference to FROM-clause entry for table r". */
update kal_regels r
   set gram_equivalent = r.hoeveelheid * 18,
       naam            = regexp_replace(r.naam, '\(\s*[\d.]+\s*g\s*\)',
                                        '(' || round(r.hoeveelheid * 18) || ' g)'),
       kcal_punt       = round(n.energie_kcal_per_100g * r.hoeveelheid * 18 / 100),
       kcal_laag       = round(n.energie_kcal_per_100g * r.hoeveelheid * 12 / 100),
       kcal_hoog       = round(n.energie_kcal_per_100g * r.hoeveelheid * 25 / 100),
       eiwit_g         = round(n.eiwit_g        * r.hoeveelheid * 18 / 100, 1),
       vet_g           = round(n.vet_g          * r.hoeveelheid * 18 / 100, 1),
       koolhydraat_g   = round(n.koolhydraten_g * r.hoeveelheid * 18 / 100, 1),
       vezel_g         = round(n.vezels_g       * r.hoeveelheid * 18 / 100, 1),
       onzekerheidsbronnen =
         coalesce(r.onzekerheidsbronnen, '{}')
         || array['portiegewicht rechtgezet op ' || round(r.hoeveelheid * 18) || ' g: de'
                  || ' groepsmaat van 60 g per opscheplepel geldt voor gekookte'
                  || ' granen, niet voor cornflakes']
  from nevo_actief n
 where n.nevo_code = r.nevo_code
   and r.naam ilike '%cornflakes%'
   and r.hoeveelheid is not null
   and r.gram_equivalent = r.hoeveelheid * 60;


-- ---------------------------------------------------------------------------
-- BLOK 3 — NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- Verwacht: 54 g, ongeveer 200 kcal in plaats van 672, en een band die dat
-- omsluit. En de naam die het nieuwe gewicht noemt.

select datum, naam, hoeveelheid, eenheid, gram_equivalent,
       kcal_punt, kcal_laag, kcal_hoog, eiwit_g, koolhydraat_g,
       onzekerheidsbronnen
from kal_regels
where naam ilike '%cornflakes%'
order by created_at desc;

-- En wat het voor die dag scheelt:
select datum, sum(kcal_punt) as kcal_nu
from kal_regels
where datum in (select datum from kal_regels where naam ilike '%cornflakes%')
group by datum;

-- Terugdraaien: alleen met de JSON uit blok 1. Er is geen andere weg terug.
