-- =============================================================================
-- TONIJNSALADE LICHT — de twee knoppen, vastgezet
--
-- Toegepast 24 augustus 2026.
--
-- De duiding bij de tonijnsalade zet vier uitkomsten naast elkaar en zegt er
-- expres niet bij welke de beste is. Dat blijft zo. Maar de onderste rij —
-- olie halveren én tonijn verdubbelen — is gekozen, en een gekozen variant hoort
-- niet elke keer opnieuw uitgerekend te worden uit een tabel in een uitklapje.
-- Hij hoort een gerecht te zijn.
--
-- Dit bestand is dus geen nieuw recept maar een vastgelegde uitkomst. Dat is
-- ook precies wat er nagekeken wordt: `maaltijd.proef.ts` eist dat het punt, het
-- eiwit en de eiwitdichtheid die hier in de database staan exact gelijk zijn aan
-- wat `varianten()` voor de vierde rij uitrekent. Loopt dat ooit uiteen, dan is
-- er iets veranderd aan het ene zonder het andere, en dat is de fout die je
-- anders pas maanden later ziet.
--
-- Eén ding is met opzet níét gelijk: de band. `varianten()` halveert de band van
-- de olie mee, en komt daarmee op een bovengrens van 964 kcal voor de schaal.
-- Hier staat 874, omdat de olie in dit gerecht wordt afgemeten en dus een
-- smallere marge heeft dan een gehalveerde slordige gieting. Dat verschil is de
-- hele reden dat deze variant een gerecht is en geen tabelregel: de tabel rekent
-- door met de onzekerheid die je hád, dit gerecht legt vast dat je hem verkleint.
--
-- WAT ER ANDERS IS DAN HET ORIGINEEL
--
--   Tonijn van één blik naar twee: 100 → 200 gram. Dat is 109 kcal erbij en
--   24,9 gram eiwit erbij — de gunstigste ruil in dit hele gerecht.
--   Olijfolie van drie eetlepels naar anderhalve: 40 → 20 gram, 180 kcal eraf.
--
-- Samen: 681 kcal voor de schaal tegen 752, en 55,2 gram eiwit tegen 30,3. Per
-- portie 341 kcal met 27,6 gram eiwit, oftewel 8,1 gram per 100 kcal tegen 4,0.
-- Voor mínder energie het dubbele aan eiwit per calorie.
--
-- WAAROM DIT EEN C IS EN HET ORIGINEEL EEN D
--
-- Niet omdat er minder olie in gaat. Omdat de olie hier wordt áfgemeten.
--
-- Bij het origineel is "drie ruime lepels" aantoonbaar onbepaald: de analyse
-- waar dit gerecht uit komt schrijft letterlijk dat het net zo goed 40 als 70
-- gram kan zijn. Dat is een ruwe schatting, en dat is per definitie een D.
-- Anderhalve gestreken eetlepel is een huishoudmaat met een tabelwaarde, en dat
-- is een C — mits je hem strijkt. Doe je dat niet, dan is het weer een D en
-- klopt de band niet meer. Die voorwaarde staat daarom in de toelichting van het
-- gerecht zelf, waar je hem leest op het moment dat je logt.
--
-- Het gevolg is zichtbaar in de band en niet alleen in de letter: 273 tot 437
-- kcal per portie, tegen 289 tot 580 bij het origineel. Het punt zakt met 35
-- kcal en de band wordt honderdvijftig kcal smaller. Dat tweede is de grotere
-- winst, want een smallere band is wat het model nodig heeft om iets te durven
-- zeggen (zie §3 van VERANTWOORDING.md).
--
-- Het origineel blijft staan. Dit is niet de verbeterde versie die de oude
-- vervangt maar een tweede gerecht ernaast: wat er op tafel staat hangt af van
-- wie er meeeet, en een app die dat voor je invult heeft het mis.
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
   where gebruiker_id = (select id from mij) and lower(btrim(naam)) = 'tonijnsalade licht'
  returning 1
),
nieuw as (
  insert into public.kal_recepten(gebruiker_id, naam, toelichting, porties, volgt_profiel, favoriet)
  select id, 'Tonijnsalade licht',
         'Twee porties. Dezelfde salade met twee blikjes tonijn in plaats van één en de helft '
         || 'van de olie: 341 kcal per portie met 27,6 gram eiwit, tegen 376 en 15,2. Dit is '
         || 'een C en geen D omdat de olie hier wordt afgemeten — anderhalve gestreken '
         || 'eetlepel. Giet je hem vrij, dan klopt de band niet en is het weer een D.',
         2, false, true
    from mij
  returning id
),
ing(positie, naam, nevo_code, maat_aantal, maat, gram, gram_laag, gram_hoog, conf, onzeker) as (values
  (0, 'Tomaat',                     '2730', 3,   'stuk',      360, 280, 440, 'C', 'drie middelgrote, geschat op het oog'),
  (1, 'Ui',                         '63',   1,   'stuk',      110,  80, 150, 'C', 'geschat op het oog'),
  (2, 'Paprika',                    '884',  1,   'stuk',      150, 110, 190, 'C', 'geschat op het oog'),
  (3, 'Tonijn uit blik, uitgelekt', '1590', 2,   'blik',      200, 190, 220, 'B', 'twee blikjes; op water, op olie 194 kcal meer en geen gram eiwit extra'),
  (4, 'Mayonaise',                  '451',  2,   'theelepel',  12,   8,  20, 'C', 'lepelmaat, niet gewogen'),
  (5, 'Dressing honing/mosterd',    '2468', 1,   'eetlepel',   15,  10,  25, 'C', 'scheut, niet gewogen; een vinaigrette is het dubbele'),
  (6, 'Olijfolie, afgemeten',       '601',  1.5, 'eetlepel',   20,  15,  25, 'C', 'anderhalve gestreken eetlepel; vrij gieten maakt hier weer een ruwe schatting van')
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
