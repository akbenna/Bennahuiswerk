-- =============================================================================
-- EEN REGEL MAG UIT EEN MERKPRODUCT KOMEN
--
-- Nog niet toegepast — draai dit vóór de app-versie die merkproducten toont.
--
-- `kal_regels.bron` staat op een vaste lijst: handmatig, recept, bibliotheek,
-- tekst-ai, foto-ai, import, nevo. Een regel die uit een merkproduct komt past
-- in geen van die zeven.
--
-- Hij als 'nevo' wegschrijven kan niet: dan zou de app beweren dat er een
-- laboratoriumbepaling achter zit, en juist dat onderscheid is de reden dat
-- merkproducten een eigen tabel kregen. Hem als 'handmatig' wegschrijven kan
-- wel, maar dan is een maand later niet meer te zien waar het getal vandaan
-- kwam — en dan staat er in het detailvenster ◇ waar ◈ hoort.
--
-- Dus een achtste waarde. Eén regel, en niets bestaands verandert eraan.
--
-- VOLGORDE
--
-- Dit eerst, dan pas de app uitrollen. Andersom levert een regel op die de
-- database weigert met "violates check constraint kal_regels_bron_check", en dat
-- is een foutmelding waar niemand iets aan heeft op het moment dat hij komt.

alter table kal_regels drop constraint if exists kal_regels_bron_check;

alter table kal_regels add constraint kal_regels_bron_check
  check (bron = any (array['handmatig','recept','bibliotheek','tekst-ai',
                          'foto-ai','import','nevo','merk']));

-- Nakijken: de achtste waarde hoort er nu bij te staan.
select pg_get_constraintdef(oid) as regel
from pg_constraint
where conname = 'kal_regels_bron_check';

-- En dat er niets kapot is: elke bestaande regel voldoet er nog aan.
select bron, count(*) from kal_regels group by bron order by count(*) desc;
