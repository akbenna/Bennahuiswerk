-- =============================================================================
-- DE LUNCHHOEK — het broodje van de praktijk, als één ding
--
-- Nog niet toegepast.
--
-- DE VRAAG
--
-- In de praktijk gaat er elke dag hetzelfde op tafel: witte broodjes met een
-- smeersalade uit het schap, kaas, paté, cherrytomaatjes erbij. Dat loggen kost
-- nu drie regels per persoon per dag — het broodje, de salade, de kaas — en
-- daarom gebeurt het niet.
--
-- WAAROM DIT GÉÉN MERKPRODUCTEN ZIJN
--
-- De vraag was of de Lidl-artikelen erbij konden. Ze staan er deels al in:
-- bestand 18 bracht 854 merkproducten van veertig merken uit Lidl, Albert Heijn
-- en Jumbo. Maar voor precies dit geval is een merkregel een stap achteruit.
--
-- Wat op een etiket staat is een opgave van de fabrikant met een wettelijke
-- speelruimte die voor de meeste voedingswaarden rond de twintig procent ligt.
-- Wat in NEVO staat is een laboratoriumbepaling. De app toont dat verschil ook
-- — ◆ tegen ◇ — en voor "een wit broodje" en "tonijnsalade" is het gemeten
-- getal gewoon het betere getal. Er is geen Lidl-tonijnsalade die wezenlijk
-- anders is dan de tonijnsalade die het RIVM gemeten heeft.
--
-- Merkregels blijven zinvol waar het etiket iets zegt wat NEVO niet weet: een
-- kant-en-klaarmaaltijd, een specifiek koekje, een eiwitshake. Daar is bestand
-- 18 voor, en dat blijft staan.
--
-- WAAROM ÉÉN BROODSOORT EN NIET ACHTTIEN GERECHTEN
--
-- Zes smeersalades maal drie broodsoorten is achttien gerechten die bijna
-- hetzelfde zijn, in een bibliotheek die met de hand is opgebouwd. Dat is het
-- soort volledigheid dat een lijst onbruikbaar maakt.
--
-- Het scheelt ook nauwelijks. Over zestig gram broodje:
--
--   wit zacht      262 kcal/100 g  →  157 kcal   3,7 g vezel/100 g  →  2,2 g
--   bruin zacht    258             →  155        5,3               →  3,2
--   volkoren zacht 247             →  148        7,3               →  4,4
--
-- Negen kilocalorieën verschil tussen de uiterste twee; dat valt binnen de
-- onzekerheid van de salade erop. De vezel verschilt wél echt — ruim twee gram
-- per broodje — en dat staat daarom in de notitie bij het broodje zelf, waar je
-- het ziet als je het gerecht openklapt. Wie volkoren eet en dat precies wil,
-- ruilt het broodje in het portievenster om.
--
-- DE VEERTIG GRAM SALADE IS GESCHAT EN ZEGT DAT
--
-- De groepsmaat voor hartig broodbeleg is een eetlepel van 15 gram, en dat is
-- wat je op een boterham smeert. Op een broodje gaat er meer op: drie lepels,
-- ruwweg veertig gram. Dat getal is geschat en niet gewogen, het draagt zijn
-- notitie, en het is de grootste onzekerheid in dit hele bestand. Eén keer een
-- schep afwegen maakt het meteen beter.
--
-- Daarom staat er ook een nieuwe groepsmaat bij: "op een broodje", 40 gram,
-- naast de eetlepel die blijft staan. Wie alleen de salade logt heeft hem ook.
--
-- TERUGDRAAIEN
--
--   delete from dish_portions    where dish_id in
--     (select id from cultural_dishes where slug like 'lun-%');
--   delete from dish_ingredients where dish_id in
--     (select id from cultural_dishes where slug like 'lun-%');
--   delete from cultural_dishes  where slug like 'lun-%';
--   delete from voeding_portiematen where nevo_groep = 'Hartig broodbeleg'
--     and naam = 'op een broodje';
--
-- Op de slugs van dít bestand en niet op `cuisine = 'nederlands'` — die tweede
-- haalt ook bestand 25 weg. Zie CLAUDE.md.
--
-- Twee keer draaien voegt niets toe en haalt niets weg: alles staat op
-- `on conflict do nothing`, en de kinderrijen komen uit `returning` van de
-- insert zelf en niet uit een opzoeking op naam.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- BLOK 1 — DE MAAT DIE ONTBRAK
-- ---------------------------------------------------------------------------
--
-- De eetlepel blijft de standaard; dit is de tweede keuze ernaast.

insert into public.voeding_portiematen
  (nevo_code, nevo_groep, naam, gram_schatting, gram_laag, gram_hoog,
   is_standaard, volgorde)
select null, 'Hartig broodbeleg', 'op een broodje', 40, 25, 60, false, 2
 where not exists (
   select 1 from public.voeding_portiematen
    where nevo_code is null and nevo_groep = 'Hartig broodbeleg'
      and naam = 'op een broodje');


-- ---------------------------------------------------------------------------
-- BLOK 2 — DE BROODJES
-- ---------------------------------------------------------------------------

with gerecht(slug, naam, namen, omschrijving, momenten) as (values
  ('lun-broodje-tonijnsalade','Broodje tonijnsalade',
   '{"nl":["broodje tonijnsalade","tonijnbroodje","broodje tonijn","bolletje tonijnsalade"]}',
   'Wit zacht broodje met tonijnsalade. De salade is gemeten; hoeveel er op een broodje gaat is geschat.',
   array['lunch']),
  ('lun-broodje-zalmsalade','Broodje zalmsalade',
   '{"nl":["broodje zalmsalade","zalmbroodje","broodje zalm","bolletje zalmsalade"]}',
   'Wit zacht broodje met zalmsalade. De salade is gemeten; hoeveel er op een broodje gaat is geschat.',
   array['lunch']),
  ('lun-broodje-eiersalade','Broodje eiersalade',
   '{"nl":["broodje eiersalade","eierbroodje","broodje ei","bolletje eiersalade"]}',
   'Wit zacht broodje met eiersalade. De salade is gemeten; hoeveel er op een broodje gaat is geschat.',
   array['lunch']),
  ('lun-broodje-kaassalade','Broodje kaassalade',
   '{"nl":["broodje kaassalade","bolletje kaassalade"]}',
   'Wit zacht broodje met kaassalade. Van de smeersalades de zwaarste: 422 kcal per 100 gram.',
   array['lunch']),
  ('lun-broodje-kipkerrie','Broodje kip-kerrie',
   '{"nl":["broodje kipkerrie","broodje kip kerrie","broodje kerriesalade","kipkerriebroodje"]}',
   'Wit zacht broodje met kip-kerriesalade. De salade is gemeten; hoeveel er op een broodje gaat is geschat.',
   array['lunch']),
  ('lun-broodje-vleessalade','Broodje vleessalade',
   '{"nl":["broodje vleessalade","vleesbroodje","bolletje vleessalade"]}',
   'Wit zacht broodje met vleessalade. De salade is gemeten; hoeveel er op een broodje gaat is geschat.',
   array['lunch']),
  ('lun-broodje-kaas','Broodje kaas',
   '{"nl":["broodje kaas","kaasbroodje","bolletje kaas","broodje jong belegen"]}',
   'Wit zacht broodje met halvarine en twee plakken kaas 30+ jong belegen.',
   array['lunch']),
  ('lun-broodje-pate','Broodje paté',
   '{"nl":["broodje pate","broodje paté","patebroodje","bolletje pate"]}',
   'Wit zacht broodje met roompaté.',
   array['lunch'])
),

/* Het broodje is overal hetzelfde, de rest verschilt. De notitie bij het
   broodje staat er één keer en geldt voor alle acht. */
onderdeel(slug, pos, naam, cat, gram, nevo, notitie) as (values
  ('lun-broodje-tonijnsalade',10,'Tarwebroodje wit zacht','graan',60::numeric,'230',
   'Een zacht wit broodje van zestig gram. Bruin of volkoren scheelt hooguit negen kilocalorieen, maar volkoren geeft ruim twee gram vezel meer per broodje. Ruil het broodje in het portievenster om als dat ertoe doet.'::text),
  ('lun-broodje-tonijnsalade',20,'Tonijnsalade','beleg',40,'3231',
   'Veertig gram is geschat: drie eetlepels. De groepsmaat voor smeersalade is een eetlepel van vijftien gram, en dat is een boterham en geen broodje. Dit is de grootste onzekerheid in dit gerecht.'),

  ('lun-broodje-zalmsalade',10,'Tarwebroodje wit zacht','graan',60,'230',
   'Een zacht wit broodje van zestig gram. Bruin of volkoren scheelt hooguit negen kilocalorieen, maar volkoren geeft ruim twee gram vezel meer per broodje.'),
  ('lun-broodje-zalmsalade',20,'Zalmsalade','beleg',40,'3230',
   'Veertig gram is geschat: drie eetlepels.'),

  ('lun-broodje-eiersalade',10,'Tarwebroodje wit zacht','graan',60,'230',
   'Een zacht wit broodje van zestig gram. Bruin of volkoren scheelt hooguit negen kilocalorieen, maar volkoren geeft ruim twee gram vezel meer per broodje.'),
  ('lun-broodje-eiersalade',20,'Eiersalade','beleg',40,'1499',
   'Veertig gram is geschat: drie eetlepels.'),

  ('lun-broodje-kaassalade',10,'Tarwebroodje wit zacht','graan',60,'230',
   'Een zacht wit broodje van zestig gram. Bruin of volkoren scheelt hooguit negen kilocalorieen, maar volkoren geeft ruim twee gram vezel meer per broodje.'),
  ('lun-broodje-kaassalade',20,'Kaassalade','beleg',40,'5074',
   'Veertig gram is geschat: drie eetlepels.'),

  ('lun-broodje-kipkerrie',10,'Tarwebroodje wit zacht','graan',60,'230',
   'Een zacht wit broodje van zestig gram. Bruin of volkoren scheelt hooguit negen kilocalorieen, maar volkoren geeft ruim twee gram vezel meer per broodje.'),
  ('lun-broodje-kipkerrie',20,'Kip-kerriesalade','beleg',40,'1498',
   'Veertig gram is geschat: drie eetlepels.'),

  ('lun-broodje-vleessalade',10,'Tarwebroodje wit zacht','graan',60,'230',
   'Een zacht wit broodje van zestig gram. Bruin of volkoren scheelt hooguit negen kilocalorieen, maar volkoren geeft ruim twee gram vezel meer per broodje.'),
  ('lun-broodje-vleessalade',20,'Vleessalade','beleg',40,'1877',
   'Veertig gram is geschat: drie eetlepels.'),

  ('lun-broodje-kaas',10,'Tarwebroodje wit zacht','graan',60,'230',
   'Een zacht wit broodje van zestig gram. Bruin of volkoren scheelt hooguit negen kilocalorieen, maar volkoren geeft ruim twee gram vezel meer per broodje.'),
  ('lun-broodje-kaas',20,'Halvarine','vet',5,'2059',
   'Vijf gram, een dun mesje. Wie droog eet haalt er 18 kcal af.'),
  ('lun-broodje-kaas',30,'Kaas 30+ jong belegen','zuivel',40,'3163',
   'Twee plakken van twintig gram, de groepsmaat voor kaas.'),

  ('lun-broodje-pate',10,'Tarwebroodje wit zacht','graan',60,'230',
   'Een zacht wit broodje van zestig gram. Bruin of volkoren scheelt hooguit negen kilocalorieen, maar volkoren geeft ruim twee gram vezel meer per broodje.'),
  ('lun-broodje-pate',20,'Roompate','vlees',25,'642',
   'Vijfentwintig gram roompate. Smeerpate mager (NEVO 2381) halveert de energie.')
),

portie(slug, label, maat, schat, laag, hoog, std, volg, notitie) as (values
  ('lun-broodje-tonijnsalade','Een broodje','broodje',100::numeric,85::numeric,130::numeric,true,10,null::text),
  ('lun-broodje-tonijnsalade','Half broodje','half broodje',50,43,65,false,20,null),
  ('lun-broodje-zalmsalade','Een broodje','broodje',100,85,130,true,10,null),
  ('lun-broodje-zalmsalade','Half broodje','half broodje',50,43,65,false,20,null),
  ('lun-broodje-eiersalade','Een broodje','broodje',100,85,130,true,10,null),
  ('lun-broodje-eiersalade','Half broodje','half broodje',50,43,65,false,20,null),
  ('lun-broodje-kaassalade','Een broodje','broodje',100,85,130,true,10,null),
  ('lun-broodje-kaassalade','Half broodje','half broodje',50,43,65,false,20,null),
  ('lun-broodje-kipkerrie','Een broodje','broodje',100,85,130,true,10,null),
  ('lun-broodje-kipkerrie','Half broodje','half broodje',50,43,65,false,20,null),
  ('lun-broodje-vleessalade','Een broodje','broodje',100,85,130,true,10,null),
  ('lun-broodje-vleessalade','Half broodje','half broodje',50,43,65,false,20,null),
  ('lun-broodje-kaas','Een broodje','broodje',105,90,135,true,10,null),
  ('lun-broodje-kaas','Half broodje','half broodje',53,45,68,false,20,null),
  ('lun-broodje-pate','Een broodje','broodje',85,72,110,true,10,null),
  ('lun-broodje-pate','Half broodje','half broodje',43,36,55,false,20,null)
),
nieuw as (
  insert into public.cultural_dishes
    (slug, name_nl, names, cuisine, description_nl, meal_moments,
     default_servings, validation_status)
  select g.slug, g.naam, g.namen::jsonb, 'nederlands', g.omschrijving, g.momenten,
         greatest(1, round((select sum(o.gram) from onderdeel o where o.slug = g.slug)
                           / (select p.schat from portie p where p.slug = g.slug and p.std))),
         'concept'
    from gerecht g
  on conflict (slug) do nothing
  returning id, slug
), ing as (
  insert into public.dish_ingredients
    (dish_id, position, ingredient_name_nl, category, quantity, unit,
     grams_equivalent, external_source, external_food_id, role,
     is_preparation_fat, uncertainty_note)
  select n.id, o.pos, o.naam, o.cat, o.gram, 'g', o.gram,
         'nevo', o.nevo, 'ingredient', false, o.notitie
    from nieuw n join onderdeel o on o.slug = n.slug
  returning 1
)
insert into public.dish_portions
  (dish_id, label_nl, household_measure, grams_estimate, grams_low,
   grams_high, measurement_basis, is_default, sort_order, notes)
select n.id, p.label, p.maat, p.schat, p.laag, p.hoog,
       'estimated', p.std, p.volg, p.notitie
  from nieuw n join portie p on p.slug = n.slug;

COMMIT;


-- ---------------------------------------------------------------------------
-- BLOK 3 — NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- 1. Wijst elke code naar een bestaande tabelregel? Nul rijen is goed.
--
--    select d.slug, i.ingredient_name_nl, i.external_food_id
--      from dish_ingredients i join cultural_dishes d on d.id = i.dish_id
--     where d.slug like 'lun-%'
--       and not exists (select 1 from nevo_foods n where n.nevo_code = i.external_food_id);
--
-- 2. Wat komt eruit? Acht regels, tussen ongeveer 230 en 360 kcal per broodje.
--
--    select d.name_nl,
--           round(sum(i.grams_equivalent)) as gram,
--           round(sum(i.grams_equivalent / 100 * n.energie_kcal_per_100g)) as kcal,
--           round(sum(i.grams_equivalent / 100 * n.eiwit_g), 1) as eiwit
--      from cultural_dishes d
--      join dish_ingredients i on i.dish_id = d.id
--      join nevo_foods n on n.nevo_code = i.external_food_id
--     where d.slug like 'lun-%'
--     group by d.name_nl order by kcal;
--
-- 3. Twee keer draaien verandert niets. Draai blok 1 en 2 nog een keer en dan:
--
--    select count(*) as hoort_acht_te_zijn from cultural_dishes where slug like 'lun-%';
--    select count(*) as hoort_zestien_te_zijn from dish_portions p
--      join cultural_dishes d on d.id = p.dish_id where d.slug like 'lun-%';
--    select count(*) as hoort_een_te_zijn from voeding_portiematen
--     where nevo_groep = 'Hartig broodbeleg' and naam = 'op een broodje';
--
-- 4. Zijn ze te vinden met de woorden die in de praktijk vallen?
--
--    select w, (select count(*) from cultural_dishes d
--                where d.slug like 'lun-%'
--                  and (lower(d.name_nl) like '%' || w || '%'
--                       or exists (select 1 from jsonb_array_elements_text(d.names->'nl') t
--                                   where lower(t) like '%' || w || '%'))) as treffers
--      from unnest(array['tonijn','zalm','eier','kaas','kerrie','pate','bolletje']) w;
