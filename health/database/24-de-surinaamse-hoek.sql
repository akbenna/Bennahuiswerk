-- =============================================================================
-- DE SURINAAMSE HOEK VAN DE GERECHTENBIBLIOTHEEK
--
-- Toestand onbekend: de kop zei lang "nog niet toegepast" en dat klopte
-- vermoedelijk niet meer. Kijk het na voordat je iets doet, het antwoord staat
-- in de database en niet in dit bestand:
--
--   select count(*) from cultural_dishes where slug like 'sur-%';
--
-- Staat daar nul, dan is dit bestand nog te draaien. Staat er iets, dan is het
-- gedraaid en hoort een toevoeging in een nieuw bestand: de terugdraairegel
-- onderaan raakt alles wat aan dit patroon voldoet.
--
-- DE VRAAG
--
-- De bibliotheek telt 27 gerechten: 16 Marokkaanse, 10 Turkse en één Nederlands
-- concept. Twee van de zes keukens die het schema toestaat zijn leeg,
-- `syrisch` en `surinaams`. Wie "roti" intikt krijgt uit de bibliotheek niets;
-- uit NEVO krijgt hij een roti-vél van 307 kcal per 100 gram, wat klopt en niet
-- is wat er op het bord ligt.
--
-- WAT IK VERWACHTTE, EN WAT ER BLEEK
--
-- Ik ging ervan uit dat een Surinaamse hoek verzonnen zou moeten worden:
-- ingrediëntenlijsten die niemand heeft nagewogen. Dat bleek maar voor een
-- deel te kloppen. NEVO heeft zelf een Surinaamse afdeling, en zes gerechten
-- staan er als geheel gemeten in:
--
--     2317  Bruine bonen m rijst Surinaams              147 kcal / 100 g
--     2320  Ovenschotel m pomtajer Pom Surinaams        119
--     2321  Groente-vlees schotel Moksi-alesi Surinaams 123
--     2319  Saus m gele spilterwten Dahl Surinaams      151
--      697  Bojo cassavetaart Surinaams                 214
--     3072  Gefrituurde peulvruchtensnack Bara Surinaams 284
--
-- Dat verandert de zaak. Voor deze zes is de energie per gram een méting van
-- precies dít gerecht: sterker onderbouwd dan de Marokkaanse hoek, waar de
-- dichtheid uit een optelling van losse ingrediënten komt. Het enige dat ik er
-- bij verzin is het portiegewicht.
--
-- WAT WEL EN WAT NIET ONDERBOUWD IS
--
-- Onderbouwd:
--   - de identiteit van elk ingrediënt en zijn NEVO-code, hieronder stuk voor
--     stuk uit de tabel gehaald en niet uit het hoofd opgeschreven;
--   - daarmee alle kcal, eiwit, vet, koolhydraten en vezels, want kal_gerecht()
--     rékent ze uit de tabel: hier staat geen enkel voedingsgetal.
--
-- Niet onderbouwd:
--   - de grammen per ingrediënt bij de twee gerechten van BLOK 2;
--   - alle portiegewichten, bij alle acht.
--
-- Die tweede lijst is mijn oordeel en is uit geen enkele bron hier te
-- controleren. Daarom draagt elke laag het merkteken dat het schema daarvoor
-- heeft: het gerecht `validation_status = 'concept'`, elke koppeling
-- `mapping_status = 'ai_voorstel'`, elke portie `measurement_basis =
-- 'estimated'`. De app toont deze gerechten daarmee als graad D. Dat is geen
-- tijdelijke slordigheid maar de juiste graad: ze zijn niet nagekeken.
--
-- `validation_status` mag pas naar 'validated' als een diëtist de grammen en de
-- porties heeft nagelopen. Het schema dwingt dat ook af: validated zonder
-- beoordelaar en datum wordt geweigerd door dish_validated_needs_reviewer.
--
-- DE PROEF DIE IK WEL KON DOEN
--
-- De dichtheid van de twee opgetelde gerechten is op de echte tabel
-- nagerekend, niet in mijn hoofd:
--
--     gerecht      gram    kcal   kcal/g   eiwit   vet   ongekoppeld
--     roti         2163    3273   1,513    209 g   134 g      0
--     heri heri    1735    2229    1,285    136 g    52 g      0
--
-- Voor roti komt 2163 g op vier porties uit op 541 g per portie, en de portie
-- "een bord" hieronder staat op 550 g. Die twee zijn los van elkaar gekozen,
-- de eerste uit de pan, de tweede uit wat er op een bord past, en ze komen
-- binnen twee procent samen. Dat is geen bewijs, maar het zou een waarschuwing
-- zijn geweest als ze een factor uit elkaar lagen.
--
-- WAT HIER NIET IN ZIT
--
-- De Syrische hoek. Die is even leeg en NEVO heeft er geen samengestelde
-- gerechten voor, dus daar geldt de opzet van BLOK 2 voor álles: acht
-- gerechten met acht verzonnen grammenlijsten. Dat is een aparte afweging en
-- geen uitloop van deze.
--
-- Draaien mag meer dan eens: elke insert slaat over wat er al staat, en raakt
-- een gerecht dat de diëtist later heeft bijgewerkt dus niet aan.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- BLOK 1: DE ZES DIE NEVO ALS GEHEEL GEMETEN HEEFT
-- ---------------------------------------------------------------------------
--
-- Eén ingrediëntregel van 1000 gram met de NEVO-code van het gerecht zelf. Dat
-- oogt vreemd in een tabel die voor recepten is gemaakt, en het is precies wat
-- er aan de hand is: de dichtheid komt niet uit een optelling maar uit één
-- meting. De regel zegt dat ook met zoveel woorden, want een gebruiker die de
-- opbouw uitklapt hoort te zien waar het getal vandaan komt.
--
-- Wat deze gerechten toevoegen boven de NEVO-regel die er al stond: een naam
-- die mensen intikken, en een portie in huishoudmaten. "Een bord" is de vraag
-- waar iemand een antwoord op heeft; "hoeveel gram" niet.

-- 1. Bruine bonen met rijst ---------------------------------------------------
with nieuw as (
  insert into public.cultural_dishes
    (slug, name_nl, names, cuisine, description_nl, meal_moments,
     default_servings, validation_status)
  values ('sur-bruine-bonen-rijst', 'Bruine bonen met rijst',
    '{"nl":["bruine bonen met rijst","bonen met rijst","surinaamse bruine bonen"]}'::jsonb,
    'surinaams',
    'Bruine bonen in kokosmelk met rijst. NEVO heeft dit gerecht als geheel gemeten; de energie per gram is dus geen optelsom.',
    array['avondeten','lunch'], 4, 'concept')
  on conflict (slug) do nothing
  returning id
), ing as (
  insert into public.dish_ingredients
    (dish_id, position, ingredient_name_nl, category, quantity, unit,
     grams_equivalent, external_source, external_food_id, uncertainty_note)
  select n.id, 10, 'Het hele gerecht, zoals NEVO het gemeten heeft', 'overig',
         1000, 'g', 1000, 'nevo', '2317',
         'NEVO 2317 is het complete gerecht en geen onderdeel ervan. Alleen het portiegewicht hieronder is geschat.'
    from nieuw n
  returning 1
)
insert into public.dish_portions
  (dish_id, label_nl, household_measure, icon, grams_estimate, grams_low,
   grams_high, measurement_basis, is_default, sort_order)
select n.id, p.label, p.maat, p.icoon, p.schat, p.laag, p.hoog, 'estimated', p.std, p.volg
  from nieuw n,
       (values ('Bord',          'bord', '🍚', 350::numeric, 280::numeric, 450::numeric, true,  10),
               ('Groot bord',    'bord', '🍚', 500,          430,          620,          false, 20),
               ('Kleine portie', 'bord', '🍚', 220,          170,          280,          false, 30))
         as p(label, maat, icoon, schat, laag, hoog, std, volg);

-- 2. Pom ----------------------------------------------------------------------
with nieuw as (
  insert into public.cultural_dishes
    (slug, name_nl, names, cuisine, description_nl, meal_moments,
     default_servings, validation_status)
  values ('sur-pom', 'Pom',
    '{"nl":["pom","pomtajerschotel","pom uit de oven"],"srn":["pom"]}'::jsonb,
    'surinaams',
    'Ovenschotel van geraspte pomtajer met kip, ui en zure oranje. Feestgerecht. NEVO heeft de schotel als geheel gemeten.',
    array['avondeten','feest','lunch'], 6, 'concept')
  on conflict (slug) do nothing
  returning id
), ing as (
  insert into public.dish_ingredients
    (dish_id, position, ingredient_name_nl, category, quantity, unit,
     grams_equivalent, external_source, external_food_id, uncertainty_note)
  select n.id, 10, 'Het hele gerecht, zoals NEVO het gemeten heeft', 'overig',
         1000, 'g', 1000, 'nevo', '2320',
         'NEVO 2320 is de complete ovenschotel. Alleen het portiegewicht hieronder is geschat.'
    from nieuw n
  returning 1
)
insert into public.dish_portions
  (dish_id, label_nl, household_measure, icon, grams_estimate, grams_low,
   grams_high, measurement_basis, is_default, sort_order)
select n.id, p.label, p.maat, p.icoon, p.schat, p.laag, p.hoog, 'estimated', p.std, p.volg
  from nieuw n,
       (values ('Stuk',        'stuk', '🥘', 200::numeric, 150::numeric, 270::numeric, true,  10),
               ('Groot stuk',  'stuk', '🥘', 320,          270,          400,          false, 20),
               ('Klein stuk',  'stuk', '🥘', 120,           90,          160,          false, 30))
         as p(label, maat, icoon, schat, laag, hoog, std, volg);

-- 3. Moksi alesi --------------------------------------------------------------
with nieuw as (
  insert into public.cultural_dishes
    (slug, name_nl, names, cuisine, description_nl, meal_moments,
     default_servings, validation_status)
  values ('sur-moksi-alesi', 'Moksi alesi',
    '{"nl":["moksi alesi","gemengde rijst","rijst met bonen en vlees"],"srn":["moksi alesi","moksi aleisi"]}'::jsonb,
    'surinaams',
    'Eenpansrijst met bonen, groente en gezouten vlees of kip. NEVO heeft de schotel als geheel gemeten.',
    array['avondeten','lunch'], 4, 'concept')
  on conflict (slug) do nothing
  returning id
), ing as (
  insert into public.dish_ingredients
    (dish_id, position, ingredient_name_nl, category, quantity, unit,
     grams_equivalent, external_source, external_food_id, uncertainty_note)
  select n.id, 10, 'Het hele gerecht, zoals NEVO het gemeten heeft', 'overig',
         1000, 'g', 1000, 'nevo', '2321',
         'NEVO 2321 is de complete schotel. Alleen het portiegewicht hieronder is geschat.'
    from nieuw n
  returning 1
)
insert into public.dish_portions
  (dish_id, label_nl, household_measure, icon, grams_estimate, grams_low,
   grams_high, measurement_basis, is_default, sort_order)
select n.id, p.label, p.maat, p.icoon, p.schat, p.laag, p.hoog, 'estimated', p.std, p.volg
  from nieuw n,
       (values ('Bord',          'bord', '🍚', 350::numeric, 280::numeric, 450::numeric, true,  10),
               ('Groot bord',    'bord', '🍚', 500,          430,          620,          false, 20),
               ('Kleine portie', 'bord', '🍚', 220,          170,          280,          false, 30))
         as p(label, maat, icoon, schat, laag, hoog, std, volg);

-- 4. Dahl ---------------------------------------------------------------------
--
-- Geen maaltijd maar een saus over roti of rijst, dus de standaardportie is een
-- opscheplepel en niet een bord. Wie hier een bord van 350 g van maakt telt het
-- dubbel met de roti eronder.
with nieuw as (
  insert into public.cultural_dishes
    (slug, name_nl, names, cuisine, description_nl, meal_moments,
     default_servings, validation_status)
  values ('sur-dahl', 'Dahl van gele spliterwten',
    '{"nl":["dahl","dal","gele erwtensaus","spliterwtensaus"],"sarnami_lat":["dhal","daal"]}'::jsonb,
    'surinaams',
    'Gele spliterwten gekookt tot een dikke saus, bij roti of rijst. NEVO heeft de saus als geheel gemeten.',
    array['avondeten','lunch'], 6, 'concept')
  on conflict (slug) do nothing
  returning id
), ing as (
  insert into public.dish_ingredients
    (dish_id, position, ingredient_name_nl, category, quantity, unit,
     grams_equivalent, external_source, external_food_id, uncertainty_note)
  select n.id, 10, 'De hele saus, zoals NEVO hem gemeten heeft', 'overig',
         1000, 'g', 1000, 'nevo', '2319',
         'NEVO 2319 is de complete saus. Alleen het portiegewicht hieronder is geschat.'
    from nieuw n
  returning 1
)
insert into public.dish_portions
  (dish_id, label_nl, household_measure, icon, grams_estimate, grams_low,
   grams_high, measurement_basis, is_default, sort_order, notes)
select n.id, p.label, p.maat, p.icoon, p.schat, p.laag, p.hoog, 'estimated', p.std, p.volg, p.notitie
  from nieuw n,
       (values ('Opscheplepel',          'opscheplepel', '🥣',  80::numeric,  60::numeric, 110::numeric, true,  10, 'Wat er naast of over de roti gaat.'),
               ('Flinke laag',           'opscheplepel', '🥣', 140,          110,          180,          false, 20, null),
               ('Kom, als los gerecht',  'kom',          '🥣', 200,          160,          260,          false, 30, null))
         as p(label, maat, icoon, schat, laag, hoog, std, volg, notitie);

-- 5. Bojo ---------------------------------------------------------------------
with nieuw as (
  insert into public.cultural_dishes
    (slug, name_nl, names, cuisine, description_nl, meal_moments,
     default_servings, validation_status)
  values ('sur-bojo', 'Bojo',
    '{"nl":["bojo","bojo cake","cassavetaart","bojotaart"],"srn":["bojo"]}'::jsonb,
    'surinaams',
    'Vochtige taart van geraspte cassave en kokos. NEVO heeft de taart als geheel gemeten.',
    array['tussendoor','feest'], 12, 'concept')
  on conflict (slug) do nothing
  returning id
), ing as (
  insert into public.dish_ingredients
    (dish_id, position, ingredient_name_nl, category, quantity, unit,
     grams_equivalent, external_source, external_food_id, uncertainty_note)
  select n.id, 10, 'De hele taart, zoals NEVO hem gemeten heeft', 'overig',
         1000, 'g', 1000, 'nevo', '697',
         'NEVO 697 is de complete taart. Alleen het portiegewicht hieronder is geschat.'
    from nieuw n
  returning 1
)
insert into public.dish_portions
  (dish_id, label_nl, household_measure, icon, grams_estimate, grams_low,
   grams_high, measurement_basis, is_default, sort_order)
select n.id, p.label, p.maat, p.icoon, p.schat, p.laag, p.hoog, 'estimated', p.std, p.volg
  from nieuw n,
       (values ('Punt',        'punt', '🍰',  90::numeric,  70::numeric, 120::numeric, true,  10),
               ('Kleine punt', 'punt', '🍰',  50,           40,           70,          false, 20),
               ('Groot stuk',  'punt', '🍰', 140,          120,          180,          false, 30))
         as p(label, maat, icoon, schat, laag, hoog, std, volg);

-- 6. Bara ---------------------------------------------------------------------
with nieuw as (
  insert into public.cultural_dishes
    (slug, name_nl, names, cuisine, description_nl, meal_moments,
     default_servings, validation_status)
  values ('sur-bara', 'Bara',
    '{"nl":["bara","barra","gefrituurd erwtenbroodje"],"sarnami_lat":["bara"]}'::jsonb,
    'surinaams',
    'Gefrituurd rond broodje van gemalen gele erwten, meestal met sambal. NEVO heeft het als geheel gemeten, inclusief het frituurvet.',
    array['tussendoor','lunch'], 8, 'concept')
  on conflict (slug) do nothing
  returning id
), ing as (
  insert into public.dish_ingredients
    (dish_id, position, ingredient_name_nl, category, quantity, unit,
     grams_equivalent, external_source, external_food_id, uncertainty_note)
  select n.id, 10, 'De hele bara, zoals NEVO hem gemeten heeft', 'overig',
         1000, 'g', 1000, 'nevo', '3072',
         'NEVO 3072 is het gefrituurde broodje inclusief opgenomen vet. Alleen het portiegewicht hieronder is geschat.'
    from nieuw n
  returning 1
)
insert into public.dish_portions
  (dish_id, label_nl, household_measure, icon, grams_estimate, grams_low,
   grams_high, measurement_basis, is_default, sort_order)
select n.id, p.label, p.maat, p.icoon, p.schat, p.laag, p.hoog, 'estimated', p.std, p.volg
  from nieuw n,
       (values ('Een bara',   'stuk', '🧆',  45::numeric,  35::numeric,  60::numeric, true,  10),
               ('Twee bara',  'stuk', '🧆',  90,           70,          120,          false, 20),
               ('Drie bara',  'stuk', '🧆', 135,          105,          180,          false, 30))
         as p(label, maat, icoon, schat, laag, hoog, std, volg);


-- ---------------------------------------------------------------------------
-- BLOK 2: DE TWEE DIE UIT GEMETEN ONDERDELEN ZIJN OPGETELD
-- ---------------------------------------------------------------------------
--
-- Hier kent NEVO de onderdelen wel en het gerecht niet. Elk ingrediënt is een
-- echte tabelregel (de identiteit en de code zijn nagekeken) maar hoevéél
-- ervan in de pan gaat is mijn schatting. Dat staat per regel in
-- uncertainty_note, want de app toont die notities in het uitklapje.

-- 7. Roti met kip -------------------------------------------------------------
--
-- Het gerecht waar de vraag mee begon. NEVO 2318 is het roti-vel van bloem en
-- aardappel; de masalakip erbij bestaat in NEVO niet en is hier opgebouwd uit
-- kip zonder vel, aardappel, kousenband, ei en kerrie.
with nieuw as (
  insert into public.cultural_dishes
    (slug, name_nl, names, cuisine, description_nl, meal_moments,
     default_servings, validation_status)
  values ('sur-roti-kip', 'Roti met kip, kousenband en aardappel',
    '{"nl":["roti","roti kip","roti met kip","kip roti","rotischotel"],"sarnami_lat":["roti","dhalpuri"]}'::jsonb,
    'surinaams',
    'Roti-vel met masalakip, aardappel, kousenband en ei. NEVO kent het vel wel en de kip niet; de grammen hieronder zijn een schatting.',
    array['avondeten','lunch'], 4, 'concept')
  on conflict (slug) do nothing
  returning id
), ing as (
  insert into public.dish_ingredients
    (dish_id, position, ingredient_name_nl, ingredient_name_local, category,
     quantity, unit, grams_equivalent, external_source, external_food_id,
     role, is_preparation_fat, fat_type, absorbed_fraction, uncertainty_note)
  select n.id, v.pos, v.naam, v.lokaal, v.cat, v.gram, v.eenheid, v.gram,
         'nevo', v.nevo, v.rol, v.vetregel, v.vetsoort, v.opname, v.notitie
    from nieuw n,
         (values
   (10,  'Roti-vel',      'roti',       'graan',   520::numeric, 'g', '2318', 'ingredient',      false, null::text, null::numeric,
         'Vier vellen van circa 130 g. NEVO 2318 is het vel van bloem en aardappel; een dun vel weegt 100 g, een dik vel 160 g.'),
   (20,  'Kip zonder vel','djaj',       'vlees',   500,          'g', '1635', 'ingredient',      false, null,       null,
         'Bereid gewicht, zonder bot. Met bot en vel erbij loopt de energie van dit gerecht op; dat is de grootste post in deze schatting.'),
   (30,  'Aardappel',     'aloo',       'groente', 400,          'g',  '982', 'ingredient',      false, null,       null,
         'Gekookt gewicht, zonder schil.'),
   (40,  'Kousenband',    'bonchi',     'groente', 300,          'g', '1811', 'ingredient',      false, null,       null,
         'Gekookt gewicht.'),
   (50,  'Ei',            null,         'ei',      200,          'g',   '84', 'ingredient',      false, null,       null,
         'Vier gekookte eieren zonder schil.'),
   (60,  'Ui',            null,         'groente', 150,          'g',   '63', 'ingredient',      false, null,       null, null),
   (70,  'Knoflook',      null,         'groente',  15,          'g',  '830', 'ingredient',      false, null,       null, null),
   (80,  'Masala',        'masala',     'kruiden',  30,          'g', '1223', 'ingredient',      false, null,       null,
         'Masala staat niet in NEVO. Kerrie djawa (1223) is de dichtstbijzijnde gedroogde kruidenmix; de samenstelling verschilt, de energie nauwelijks.'),
   (90,  'Zout',          null,         'kruiden',   8,          'g',  '841', 'ingredient',      false, null,       null, null),
   (200, 'Zonnebloemolie', null,        'vet',      40,          'ml', '317', 'preparation_fat', true,  'zonnebloemolie', 1.000,
         'Alles wat in de pan gaat blijft in het gerecht, er wordt gestoofd, niet gefrituurd. Wie royaler bakt zit hoger.')
         ) as v(pos, naam, lokaal, cat, gram, eenheid, nevo, rol, vetregel, vetsoort, opname, notitie)
  returning 1
)
insert into public.dish_portions
  (dish_id, label_nl, household_measure, icon, grams_estimate, grams_low,
   grams_high, measurement_basis, is_default, sort_order, notes)
select n.id, p.label, p.maat, p.icoon, p.schat, p.laag, p.hoog, 'estimated', p.std, p.volg, p.notitie
  from nieuw n,
       (values ('Bord, één roti met kip', 'bord', '🍛', 550::numeric, 450::numeric, 700::numeric, true,  10,
                'De pan komt op 541 g per portie uit; die twee schattingen zijn los van elkaar gemaakt.'),
               ('Half bord',               'bord', '🍛', 280,          230,          350,          false, 20, null),
               ('Groot bord',              'bord', '🍛', 750,          680,          880,          false, 30, null))
         as p(label, maat, icoon, schat, laag, hoog, std, volg, notitie);

-- 8. Heri heri ----------------------------------------------------------------
with nieuw as (
  insert into public.cultural_dishes
    (slug, name_nl, names, cuisine, description_nl, meal_moments,
     default_servings, validation_status)
  values ('sur-heri-heri', 'Heri heri met bakkeljauw',
    '{"nl":["heri heri","herri herri","heri-heri","knollen met bakkeljauw"],"srn":["heri heri"]}'::jsonb,
    'surinaams',
    'Cassave, zoete aardappel en bakbanaan met bakkeljauw en ei. NEVO kent de onderdelen, niet het gerecht; de grammen hieronder zijn een schatting.',
    array['avondeten','lunch'], 4, 'concept')
  on conflict (slug) do nothing
  returning id
), ing as (
  insert into public.dish_ingredients
    (dish_id, position, ingredient_name_nl, ingredient_name_local, category,
     quantity, unit, grams_equivalent, external_source, external_food_id,
     role, is_preparation_fat, fat_type, absorbed_fraction, uncertainty_note)
  select n.id, v.pos, v.naam, v.lokaal, v.cat, v.gram, v.eenheid, v.gram,
         'nevo', v.nevo, v.rol, v.vetregel, v.vetsoort, v.opname, v.notitie
    from nieuw n,
         (values
   (10,  'Cassave',         'kasaba',   'groente', 400::numeric, 'g', '2109', 'ingredient',      false, null::text, null::numeric,
         'Gekookt gewicht.'),
   (20,  'Zoete aardappel', 'napi',     'groente', 300,          'g', '2112', 'ingredient',      false, null,       null,
         'Gekookt gewicht.'),
   (30,  'Bakbanaan',       'bakbana',  'fruit',   400,          'g',  '665', 'ingredient',      false, null,       null,
         'NEVO heeft alleen de rauwe rijpe bakbanaan (665). Gekookt neemt hij water op, dus per gram valt de uitkomst hier aan de hoge kant.'),
   (40,  'Bakkeljauw',      'batyaw',   'vis',     300,          'g', '3137', 'ingredient',      false, null,       null,
         'Geweekt en gekookt gewicht, het zout is er dan grotendeels uit. Droog gewogen zou een factor 2,5 te hoog zijn.'),
   (50,  'Ei',              null,       'ei',      200,          'g',   '84', 'ingredient',      false, null,       null,
         'Vier gekookte eieren zonder schil.'),
   (60,  'Ui',              null,       'groente', 100,          'g',   '63', 'ingredient',      false, null,       null, null),
   (70,  'Zout',            null,       'kruiden',   5,          'g',  '841', 'ingredient',      false, null,       null, null),
   (200, 'Zonnebloemolie',  null,       'vet',      30,          'ml', '317', 'preparation_fat', true,  'zonnebloemolie', 1.000,
         'Voor het aanbakken van de ui en de bakkeljauw; blijft in het gerecht.')
         ) as v(pos, naam, lokaal, cat, gram, eenheid, nevo, rol, vetregel, vetsoort, opname, notitie)
  returning 1
)
insert into public.dish_portions
  (dish_id, label_nl, household_measure, icon, grams_estimate, grams_low,
   grams_high, measurement_basis, is_default, sort_order)
select n.id, p.label, p.maat, p.icoon, p.schat, p.laag, p.hoog, 'estimated', p.std, p.volg
  from nieuw n,
       (values ('Bord',          'bord', '🍠', 450::numeric, 360::numeric, 570::numeric, true,  10),
               ('Kleine portie', 'bord', '🍠', 280,          220,          350,          false, 20),
               ('Groot bord',    'bord', '🍠', 600,          520,          720,          false, 30))
         as p(label, maat, icoon, schat, laag, hoog, std, volg);

COMMIT;


-- ---------------------------------------------------------------------------
-- BLOK 3: NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- 1. Staat de hoek er, met de juiste merktekens? Acht rijen, alle acht
--    'concept', geen enkele koppeling zonder NEVO-code, geen enkele portie
--    buiten 'estimated'.

-- select d.slug, d.validation_status,
--        count(distinct i.id)                                          as ingredienten,
--        count(distinct i.id) filter (where i.external_food_id is null) as ongekoppeld,
--        count(distinct p.id)                                          as porties,
--        count(distinct p.id) filter (where p.measurement_basis <> 'estimated') as niet_geschat
--   from cultural_dishes d
--   left join dish_ingredients i on i.dish_id = d.id
--   left join dish_portions    p on p.dish_id = d.id
--  where d.cuisine = 'surinaams'
--  group by d.slug, d.validation_status
--  order by d.slug;

-- 2. Wijst elke code naar een bestaande tabelregel? Nul rijen is goed.

-- select i.ingredient_name_nl, i.external_food_id
--   from dish_ingredients i
--   join cultural_dishes d on d.id = i.dish_id
--  where d.cuisine = 'surinaams'
--    and not exists (select 1 from nevo_foods n where n.nevo_code = i.external_food_id);

-- 3. Wat een standaardportie oplevert. Dit hoort te staan (afronding daargelaten):
--
--     sur-bara                 Een bara                  45 g    128 kcal
--     sur-bojo                 Punt                      90 g    193
--     sur-bruine-bonen-rijst   Bord                     350 g    515
--     sur-dahl                 Opscheplepel              80 g    121
--     sur-heri-heri            Bord                     450 g    578
--     sur-moksi-alesi          Bord                     350 g    431
--     sur-pom                  Stuk                     200 g    238
--     sur-roti-kip             Bord: één roti met kip  550 g    832
--
-- Wijkt een van deze af, dan is er een code verschoven of een gram verkeerd
-- overgenomen, niet een afronding.

-- select d.slug, p.label_nl, p.grams_estimate,
--        round(sum(i.grams_equivalent
--                  * case when i.is_preparation_fat
--                         then coalesce(i.absorbed_fraction, 1) else 1 end
--                  / 100 * n.energie_kcal_per_100g)
--              / sum(i.grams_equivalent
--                    * case when i.is_preparation_fat
--                           then coalesce(i.absorbed_fraction, 1) else 1 end)
--              * p.grams_estimate) as kcal
--   from cultural_dishes d
--   join dish_ingredients i on i.dish_id = d.id
--   join nevo_foods       n on n.nevo_code = i.external_food_id
--   join dish_portions    p on p.dish_id = d.id and p.is_default
--  where d.cuisine = 'surinaams'
--  group by d.slug, p.label_nl, p.grams_estimate
--  order by d.slug;

-- 4. En de vraag waar dit mee begon: vindt het zoeken ze nu?
--    Elk van deze woorden hoort minstens één gerecht te geven.

-- select w, (select count(*) from cultural_dishes d
--             where d.owner_patient_id is null
--               and lower(d.name_nl || ' ' || coalesce(d.description_nl,'') || ' ' ||
--                         d.cuisine || ' ' ||
--                         coalesce((select string_agg(t.value,' ')
--                                     from jsonb_each_text(d.names) t),'')) like '%'||w||'%')
--   from unnest(array['roti','pom','bara','bojo','dahl','moksi','heri heri',
--                     'bruine bonen','surinaams']) w;

-- Terugdraaien: op de slugs van dit bestand en niet op de keuken:
--
--   delete from cultural_dishes where slug like 'sur-%';
--
-- Dat verschil is niet cosmetisch. `where cuisine = 'surinaams'` haalt ook weg
-- wat er later door iemand anders bij is gezet, en dat is precies het werk dat
-- niet te herhalen is. Een terugdraairegel hoort alleen te raken wat dít
-- bestand heeft neergezet.
-- (dish_ingredients en dish_portions gaan mee via on delete cascade)
