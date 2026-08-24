-- =============================================================================
-- MIJN STOKBROODTONIJN
--
-- Toegepast 24 augustus 2026.
--
-- Gevraagd: "zet dat stokbrood tonijn ook in, samengesteld uit 1 tomaat, 1
-- paprika, plak jonge kaas, beetje olie overheen (klein lepel) en zout."
--
-- Dit is de derde eigen maaltijd, en het is de interessantste van de drie. De
-- eerste twee waren het probleem; deze is het antwoord, en dat blijkt uit de
-- getallen zonder dat er iemand iets hoeft te vinden.
--
-- TWEE AANNAMES, EN WAAROM DEZE
--
--   Half stokbrood, 125 gram. "Dat stokbrood" verwijst naar het broodje uit
--   `08-de-twee-favorieten.sql`, en dat is een half stokbrood. Een heel brood
--   zou 338 kcal extra zijn — een verdubbeling van de grootste post — dus deze
--   aanname is niet vrijblijvend en staat daarom ook in de toelichting van het
--   gerecht, waar hij te lezen is op het moment dat je logt.
--
--   Tonijn op water. Er is niet bij gezegd welke, en de doorrekening waar deze
--   gerechten uit voortkomen rekent met water. Op olie is het 97 kcal meer per
--   blik en geen gram extra eiwit — de duurste stille keuze in het schap, en om
--   die reden staat hij als onzekerheid bij de regel en niet in een voetnoot.
--
-- WAT ER UITKOMT
--
-- 629 kcal met 43,6 gram eiwit. Dat is 6,9 gram eiwit per 100 kcal, tegen 4,0
-- voor de tonijnsalade en 3,0 voor het stokbrood met alleen kaas. In één maaltijd
-- zit hiermee ruim een kwart van het dagdoel van 161 gram (zie §9 van
-- VERANTWOORDING.md), en dat is precies wat er in het patroon ontbrak.
--
-- Het verschil zit niet in wat erbij is gekomen maar in wat er níét in zit. Er
-- gaat één theelepel olie overheen in plaats van anderhalve eetlepel, en dat
-- scheelt 135 kcal. De tonijn levert 24,9 van de 43,6 gram eiwit voor 109 kcal.
--
-- En dit gerecht is een C en geen D. De salade is D zolang de olijfolie niet
-- gewogen is, want daar loopt de schatting van 30 tot 70 gram en dat is 360 kcal.
-- Hier loopt hij van 3 tot 10 gram, en dat is 63 kcal. Dezelfde onzekerheid over
-- dezelfde handeling, maar een tiende van het gevolg — dat is wat een graad
-- hoort uit te drukken.
--
-- Het zout staat erin met nul calorieën, om dezelfde reden als de komijn in
-- bestand 08: het hoort bij het gerecht, ook als het niets aan de energie doet.
-- =============================================================================

do $$
begin
  if (select count(*) from public.kal_gebruikers) <> 1 then
    raise exception 'Dit bestand hoort bij een database met precies één account; er zijn er %.',
      (select count(*) from public.kal_gebruikers);
  end if;
end $$;

with mij as (select id from public.kal_gebruikers limit 1),
weg as (
  delete from public.kal_recepten
   where gebruiker_id = (select id from mij) and lower(btrim(naam)) = 'mijn stokbroodtonijn'
  returning 1
),
nieuw as (
  insert into public.kal_recepten(gebruiker_id, naam, toelichting, porties, volgt_profiel, favoriet)
  select id, 'Mijn stokbroodtonijn',
         'Eén portie, op een half stokbrood — een heel brood is 338 kcal meer. Tonijn op '
         || 'water; op olie komt er 97 kcal bij en geen gram eiwit. Met 6,9 gram eiwit per '
         || '100 kcal is dit je eiwitrijkste maaltijd: bijna twee keer zo dicht als de '
         || 'tonijnsalade, en het verschil zit vooral in de theelepel olie in plaats van de '
         || 'anderhalve eetlepel.',
         1, false, true
    from mij
  returning id
),
ing(positie, naam, nevo_code, maat_aantal, maat, gram, gram_laag, gram_hoog, conf, onzeker) as (values
  (0, 'Stokbrood wit',              '2793', 0.5, 'stokbrood',  125, 100, 160, 'C', 'half brood, niet gewogen'),
  (1, 'Tonijn uit blik, uitgelekt', '1590', 1,   'blik',       100,  95, 110, 'B', 'op water; op olie 97 kcal meer per blik en geen gram eiwit extra'),
  (2, 'Tomaat',                     '2730', 1,   'stuk',       120,  90, 160, 'C', 'één middelgrote, geschat op het oog'),
  (3, 'Paprika',                    '884',  1,   'stuk',       150, 110, 190, 'C', 'geschat op het oog'),
  (4, 'Kaas Goudse 48+ jong',       '2756', 1,   'plak',        20,  15,  30, 'C', 'plakdikte varieert sterk'),
  (5, 'Olijfolie erover',           '601',  1,   'theelepel',    5,   3,  10, 'C', 'kleine lepel, niet gewogen; 3 tot 10 gram scheelt 63 kcal')
)
insert into public.kal_recept_regels(
  recept_id, positie, naam, hoeveelheid, eenheid, gram_equivalent,
  kcal_punt, kcal_laag, kcal_hoog, eiwit_g, vet_g, koolhydraat_g, vezel_g,
  conf, onzekerheidsbronnen, bron, nevo_code)
select
  (select id from nieuw), i.positie, i.naam, i.maat_aantal, i.maat, i.gram,
  round(n.energie_kcal_per_100g * i.gram      / 100),
  round(n.energie_kcal_per_100g * i.gram_laag / 100),
  round(n.energie_kcal_per_100g * i.gram_hoog / 100),
  round(n.eiwit_g        * i.gram / 100, 1),
  round(n.vet_g          * i.gram / 100, 1),
  round(n.koolhydraten_g * i.gram / 100, 1),
  round(n.vezels_g       * i.gram / 100, 1),
  i.conf, array[i.onzeker], 'nevo', i.nevo_code
from ing i join public.nevo_actief n on n.nevo_code = i.nevo_code;

insert into public.kal_recept_regels(
  recept_id, positie, naam, hoeveelheid, eenheid, gram_equivalent,
  kcal_punt, kcal_laag, kcal_hoog, eiwit_g, vet_g, koolhydraat_g, vezel_g,
  conf, onzekerheidsbronnen, bron, nevo_code)
select m.id, 6, 'Zout', 1, 'snuf', 1,
       0, 0, 0, 0, 0, 0, 0,
       'A', array['zout: geen energie, wel onderdeel van het gerecht'], 'handmatig', null
  from public.kal_recepten m
 where m.gebruiker_id = (select id from public.kal_gebruikers limit 1)
   and m.naam = 'Mijn stokbroodtonijn';
