-- =============================================================================
-- DE TWEE MAALTIJDEN DIE ER AL WAREN
--
-- Toegepast 24 augustus 2026. Herzien dezelfde dag; zie "de dressing" onderaan.
--
-- Aanleiding is één zin: "ik vind het moeilijk invoeren van mijn favoriete
-- maaltijden zoals deze tonijnsalade en half stokbrood belegd met kaas paprika
-- tomaat vers en snuf mayonaise komijn en zout en olijfolie."
--
-- Ze staan hier omdat de functie eromheen (07) leeg beginnen niet oplost. Wie de
-- app opent en een lege lijst "eigen maaltijden" ziet, moet nog steeds eerst
-- zeven producten opzoeken voordat hij ooit één tik overhoudt.
--
-- WAAR DE GETALLEN VANDAAN KOMEN
--
-- Uit NEVO, per gram, met een join. Er staat hieronder geen enkele calorie die
-- is ingetypt: er staan grammen, en die worden vermenigvuldigd met wat de tabel
-- per honderd gram zegt. Dat is niet netter maar controleerbaarder — een getypt
-- getal is niet na te rekenen, een gram maal een tabelregel wel.
--
-- WAT ERBIJ STAAT IS DE HUISHOUDELIJKE MAAT
--
-- Drie stuks, één blik, drie eetlepels. Dat is wat je onthoudt en wat je op tafel
-- ziet; 360 gram is alleen waar tegen gerekend wordt. Beide staan er dus: de maat
-- in `hoeveelheid` en `eenheid`, de grammen in `gram_equivalent`. Wie het gerecht
-- naleest ziet zijn eigen keuken, en wie het narekent ziet de tabel.
--
-- WAAR DE BAND VANDAAN KOMT
--
-- Ook uit grammen. Elke regel heeft naast zijn hoeveelheid een ondergrens en een
-- bovengrens, en de calorieënband volgt daaruit. Dat is het eerlijke model van
-- deze onzekerheid: de tabelwaarde van tomaat is niet onzeker, het aantal
-- tomaten is dat. "Drie middelgrote tomaten" is alles tussen 280 en 440 gram, en
-- dat verschil hoort in de band te staan en niet in een percentage dat iemand
-- verzonnen heeft.
--
-- De olijfolie is de reden dat dit zo moet. Uit de analyse: "een paar grote
-- lepels olijfolie kan net zo goed 40 als 70 gram zijn — een verschil van 270
-- kcal", en: vet is de enige post die er echt toe doet en tegelijk de enige die
-- niet gewogen wordt. Zijn ondergrens staat daarom op 30 en zijn bovengrens op
-- 70 gram, en zijn graad op D. Omdat de maaltijd de slechtste graad van zijn
-- onderdelen krijgt, is de hele salade D zolang die olie niet gewogen is. Dat
-- hoort zo: één keer wegen maakt van deze maaltijd een B.
--
-- DE DRESSING — waarom dit bestand herzien is
--
-- Eerst stond er `Dressing olijfolie-azijn` (NEVO 2605, 607 kcal/100 g), en dat
-- gaf 798 kcal voor de schaal tegen de ≈750 uit de tabel van de analyse. Dat
-- verschil van 46 kcal is precies vijftien gram maal het verschil tussen 607 en
-- 299 kcal per honderd gram. De analyse rekende met 45 kcal voor 15 gram, dus
-- met 300 kcal per honderd gram, en dat is `Dressing honing/mosterd-` (2468).
--
-- Met die correctie komen drie onafhankelijke optellingen exact uit: 55,7 gram
-- vet, 26,9 gram koolhydraten en 10,0 gram vezels — dezelfde getallen als in de
-- doorrekening die van buiten kwam. Dat is de reden om het te veranderen: niet
-- omdat een ander getal mooier is, maar omdat drie sommen die los van elkaar
-- gemaakt zijn nu op de komma overeenkomen.
--
-- DRIE KEUZES DIE EEN ANDERE KANT OP KONDEN
--
--   Tonijn op water, niet op olie. De analyse rekent met 115 kcal per 100 gram
--   uitgelekt, en dat is water (109) en niet olie (206). Wie op olie koopt telt
--   er per portie ongeveer 50 kcal bij; dat staat in de toelichting, waar het te
--   lezen is op het moment dat je het logt.
--
--   Twee porties voor de salade, één voor het stokbrood. Zo staan ze op tafel.
--   Wat je ervan eet kies je bij het loggen — één portie ís de halve schaal — en
--   de app zegt er dan bij dat een deelportie niet apart gewogen is.
--
--   Komijn en zout staan er wél in, met nul calorieën. Ze doen niets voor de
--   energie en alles voor de herkenbaarheid: dit is zijn gerecht, en een lijst
--   waarin het niet voorkomt is die van iemand anders.
--
-- Alleen de salade krijgt het sterretje, want daar is om gevraagd. Het stokbrood
-- staat er wel in en is één tik van favoriet af.
-- =============================================================================

-- Deze database heeft één BennaHealth-account. Dat is hier geen aanname maar een
-- voorwaarde: zonder deze controle zou een tweede account de maaltijden van de
-- eerste krijgen.
do $$
begin
  if (select count(*) from public.kal_gebruikers) <> 1 then
    raise exception 'Dit bestand hoort bij een database met precies één account; er zijn er %.',
      (select count(*) from public.kal_gebruikers);
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 1. De tonijnsalade — twee porties, favoriet
-- -----------------------------------------------------------------------------
with mij as (select id from public.kal_gebruikers limit 1),
weg as (
  delete from public.kal_recepten
   where gebruiker_id = (select id from mij) and lower(btrim(naam)) = 'tonijnsalade'
  returning 1
),
nieuw as (
  insert into public.kal_recepten(gebruiker_id, naam, toelichting, porties, volgt_profiel, favoriet)
  select id, 'Tonijnsalade',
         'Staat voor twee porties; één portie is de halve schaal. Tonijn op water — op olie '
         || 'komt er ongeveer 50 kcal per portie bij. De olie is de enige post die er echt toe '
         || 'doet en de enige die niet gewogen is: weeg hem één week en deze maaltijd gaat van '
         || 'D naar B.',
         2, false, true
    from mij
  returning id
),
ing(positie, naam, nevo_code, maat_aantal, maat, gram, gram_laag, gram_hoog, conf, onzeker) as (values
  (0, 'Tomaat',                     '2730', 3,   'stuk',      360, 280, 440, 'C', 'drie middelgrote, geschat op het oog'),
  (1, 'Ui',                         '63',   1,   'stuk',      110,  80, 150, 'C', 'geschat op het oog'),
  (2, 'Paprika',                    '884',  1,   'stuk',      150, 110, 190, 'C', 'geschat op het oog'),
  (3, 'Tonijn uit blik, uitgelekt', '1590', 1,   'blik',      100,  95, 110, 'B', 'op water; op olie ruim 90 kcal meer per blik'),
  (4, 'Mayonaise',                  '451',  2,   'theelepel',  12,   8,  20, 'C', 'lepelmaat, niet gewogen'),
  (5, 'Dressing honing/mosterd',    '2468', 1,   'eetlepel',   15,  10,  25, 'C', 'scheut, niet gewogen; een vinaigrette is het dubbele'),
  (6, 'Olijfolie',                  '601',  3,   'eetlepel',   40,  30,  70, 'D', 'niet gewogen; 30 tot 70 gram scheelt 360 kcal in de schaal')
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

-- -----------------------------------------------------------------------------
-- 2. Half stokbrood belegd — één portie
-- -----------------------------------------------------------------------------
with mij as (select id from public.kal_gebruikers limit 1),
weg as (
  delete from public.kal_recepten
   where gebruiker_id = (select id from mij) and lower(btrim(naam)) = 'half stokbrood belegd'
  returning 1
),
nieuw as (
  insert into public.kal_recepten(gebruiker_id, naam, toelichting, porties, volgt_profiel, favoriet)
  select id, 'Half stokbrood belegd',
         'Eén portie. De olie van het bordje is geschat op twintig gram; dat is de post waar '
         || 'dit ontbijt van 650 naar 800 kcal schuift zonder dat je er iets aan proeft.',
         1, false, false
    from mij
  returning id
),
ing(positie, naam, nevo_code, maat_aantal, maat, gram, gram_laag, gram_hoog, conf, onzeker) as (values
  (0, 'Stokbrood wit',                '2793', 0.5, 'stokbrood', 125, 100, 160, 'C', 'half brood, niet gewogen'),
  (1, 'Kaas Goudse 48+ jong belegen', '2757', 2,   'plak',       40,  30,  60, 'C', 'plakdikte varieert sterk'),
  (2, 'Paprika, vers',                '884',  1,   'handje',     60,  40,  90, 'C', 'geschat op het oog'),
  (3, 'Tomaat, vers',                 '2730', 1,   'stuk',       80,  50, 120, 'C', 'geschat op het oog'),
  (4, 'Mayonaise',                    '451',  1,   'snuf',        8,   4,  15, 'C', 'snuf, niet gewogen'),
  (5, 'Olijfolie van het bordje',     '601',  1.5, 'eetlepel',   20,  10,  40, 'D', 'niet gewogen; 10 tot 40 gram scheelt 270 kcal')
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

-- De kruiden staan los, want ze staan niet in de tabel en hoeven er niet in:
-- een snuf komijn en zout is nul calorieën en hoort er toch bij.
insert into public.kal_recept_regels(
  recept_id, positie, naam, hoeveelheid, eenheid, gram_equivalent,
  kcal_punt, kcal_laag, kcal_hoog, eiwit_g, vet_g, koolhydraat_g, vezel_g,
  conf, onzekerheidsbronnen, bron, nevo_code)
select m.id, 6, 'Komijn en zout', 1, 'snuf', 1,
       0, 0, 0, 0, 0, 0, 0,
       'A', array['kruiden: verwaarloosbaar in energie'], 'handmatig', null
  from public.kal_recepten m
 where m.gebruiker_id = (select id from public.kal_gebruikers limit 1)
   and m.naam = 'Half stokbrood belegd';
