-- =============================================================================
-- DE CHERRYTOMAATJES — de belofte die in bestand 31 bleef staan
--
-- Nog niet toegepast.
--
-- WAAROM DIT EEN EIGEN BESTAND IS EN GEEN REGEL ERBIJ IN 31
--
-- De kop van bestand 31 noemt ze: "witte broodjes met een smeersalade uit het
-- schap, kaas, paté, cherrytomaatjes erbij". Er kwamen acht broodjes uit dat
-- bestand en geen tomaatje. Dat is niet erg zolang je het merkt, en dat is
-- precies wat er mis aan was: de kop beloofde iets wat de inhoud niet deed.
--
-- Bestand 31 is intussen gedraaid. Een regel erbij zetten in een bestand dat al
-- toegepast is, is het soort verandering waar CLAUDE.md over gaat: de volgende
-- die het bestand leest denkt dat hij het geheel voor zich heeft, draait het
-- opnieuw, en komt bij de terugdraairegel uit die op `slug like 'lun-%'` staat.
-- Een nieuw bestand is eerlijker over wat wanneer gebeurd is.
--
-- EN WAAROM ZE GEEN INGREDIËNT VAN DE ACHT BROODJES ZIJN
--
-- Dat was de andere mogelijkheid, en die is fout om twee redenen. De eerste
-- staat in CLAUDE.md: kinderrijen aanmaken bij gerechten die er al staan, op
-- naam opgezocht, is precies wat er niet mag — dan krijgt een gerecht dat de
-- diëtist heeft bijgewerkt er stilletjes iets bij.
--
-- De tweede is inhoudelijk: ze horen er niet altijd bij. Soms liggen ze erbij en
-- soms niet, en een ingrediënt dat vastzit aan het gerecht kun je niet weglaten
-- zonder de portie te verbouwen. Los zijn ze wat ze in de praktijk ook zijn:
-- iets wat je erbij pakt.
--
-- DE CODE WORDT OPGEZOCHT EN NIET INGETIKT
--
-- Elk ander bestand in deze reeks heeft zijn NEVO-codes hard staan — '230' voor
-- het broodje, '3231' voor de tonijnsalade. Die kwamen uit de tabel, opgezocht
-- toen er een database bij de hand was. Die is er nu niet, en een code intikken
-- die ik niet heb nagekeken is het ergste wat je in dit bestand kunt doen: een
-- verkeerde code valt niet om, hij geeft gewoon de voedingswaarde van iets
-- anders. Een tomaat van 18 kcal die stiekem een tomatenpuree van 82 is.
--
-- Dus zoekt blok 1 hem zelf op, en `raise exception` als het er niet precies
-- één is. Dat is strenger dan een hardgecodeerd getal en niet losser: bij een
-- ingetikte code weet je pas iets als je nakijkquery 2 draait, en hier weet je
-- het voordat er een rij staat.
--
-- Opzoeken op naam alleen bleek niet genoeg, en dat is niet bedacht maar
-- gemeten: met een tweede tomaat in de tabel koos het bestand "Cherrytomaat
-- gedroogd" van 258 kcal, en de wacht ging niet af want het was één treffer.
-- Daarom moet de energie er ook bij kloppen — tussen de twaalf en vijfendertig
-- kilocalorieen per honderd gram, wat een rauwe tomaat nu eenmaal is. Dat
-- sluit gedroogd, puree en ketchup in één keer uit zonder dat ik elke bewerking
-- bij naam hoef te kennen.
--
-- Vindt hij er meer dan één, dan zegt de fout welke. Kies er zelf een en zet
-- hem in `p_code` van blok 2 — daar is de handmatige weg, zichtbaar, en niet
-- als stilzwijgende eerste treffer.
--
-- WAT ER UITKOMT
--
-- Rauwe tomaat is rond de 18 kcal per 100 gram en cherrytomaat ligt daar dicht
-- bij. Een handje van tachtig gram is dus een kilocalorie of vijftien. Dat is
-- bijna niets, en dat is geen reden om het niet te loggen: wat je wel eet en
-- niet invult maakt de dag niet lichter, alleen minder waar. En vezel telt het
-- wel mee.
--
-- DE PORTIES
--
-- Een cherrytomaatje weegt rond de tien gram, met een echte spreiding: de
-- kleine soorten zitten op acht, de grotere op vijftien. Die spreiding zit in
-- de banden.
--
--   Een handje   80 g  (60–110)   standaard
--   Vijf stuks   50 g  (40–75)
--   Een bakje   250 g  (200–300)  het bakje uit het schap
--
-- Alle drie geschat en niet gewogen, dus `measurement_basis = 'estimated'` en
-- een notitie die dat zegt.
--
-- TERUGDRAAIEN
--
--   delete from dish_portions    where dish_id in
--     (select id from cultural_dishes where slug = 'lun-cherrytomaatjes');
--   delete from dish_ingredients where dish_id in
--     (select id from cultural_dishes where slug = 'lun-cherrytomaatjes');
--   delete from cultural_dishes  where slug = 'lun-cherrytomaatjes';
--
-- Op de slug van dít bestand. Niet op `slug like 'lun-%'` — die haalt de acht
-- broodjes van bestand 31 mee.
--
-- Twee keer draaien voegt niets toe en haalt niets weg: `on conflict do
-- nothing` op de slug, en de kinderrijen komen uit `returning` van de insert
-- zelf. Draait het een tweede keer, dan levert `returning` niets op en blijven
-- de twee kinderinserts leeg.
--
-- HOE DIT IS NAGEKEKEN
--
-- Lokaal op Postgres 16, tegen het schema uit
-- `gereedschap/verhuizing/schema-gegenereerd.sql` — de echte tabellen met hun
-- checks en unieke indexen, niet een eigen opstelling die lakser is. Zie de kop
-- van bestand 31 voor waarom dat verschil er een keer toe deed.
--
--   · het bestand loopt door: een gerecht, een ingredient, drie porties, en
--     zestien kilocalorieen voor een handje van tachtig gram
--   · drie keer draaien geeft exact dezelfde tellingen (1, 1, 3)
--   · de terugdraairegel haalt het tomaatje weg, laat een lun-broodje van
--     bestand 31 staan, en laat geen wees-ingredienten of wees-porties achter
--   · zonder tomaat in nevo_foods valt het om en staat er nul in plaats van
--     een ingredient zonder voedingswaarde
--   · met twee rauwe kandidaten valt het om en noemt het ze allebei
--
-- En de vondst die het bestand veranderd heeft: met "Cherrytomaat gedroogd"
-- (258 kcal) naast de rauwe koos de eerste versie de gedroogde. Eén treffer,
-- dus de wacht ging niet af, en er kwam een handje van 206 kilocalorieen uit.
-- Daar is de energiegrens voor gekomen. Met beide in de tabel kiest het nu de
-- rauwe, en dat is nagekeken en niet aangenomen.
--
-- Wat het lokaal draaien verder aan het licht bracht: `nevo_versie` is geen los
-- veld maar een verwijzing naar `nevo_versies`, en de kolom heet `meal_moments`
-- en niet `typical_meal_moments`. Allebei viel om op de echte tabel en allebei
-- zou het op een eigen opstelling zijn doorgeglipt.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- BLOK 1 — DE CODE OPZOEKEN, EN STOPPEN ALS HIJ ER NIET IS
-- ---------------------------------------------------------------------------

create temporary table _tomaat (nevo_code text, naam text, kcal numeric) on commit drop;

do $$
declare
  v_aantal int;
  v_namen  text;
begin
  /* DE NAAM ALLEEN IS NIET GENOEG, EN DAT IS GEMETEN

     Hier stond eerst alleen een naamvergelijking. Op de proefdatabase stonden
     twee tomaten — "Tomaat cherry rauw" van 20 kcal en "Cherrytomaat gedroogd"
     van 258 — en het bestand koos zonder morren de gedroogde. Eén treffer, dus
     de wacht op "meer dan een" ging niet af, en er kwam een handje tomaatjes
     van 206 kilocalorieen uit. Dat is de fout die dit bestand juist niet mocht
     maken.

     Daarom een tweede eis die niets met woorden te maken heeft: de energie moet
     kloppen met wat een rauwe tomaat ís. Tussen de twaalf en vijfendertig
     kilocalorieen per honderd gram. Dat sluit in één keer alles uit wat
     bewerkt is — gedroogd, zongedroogd, in olie, puree, ketchup — en het doet
     dat zonder dat ik elke bewerking bij naam hoef te kennen.

     Een grens op de uitkomst in plaats van op de naam. De naam zegt wat iemand
     het noemde; de energie zegt wat het is. */
  insert into _tomaat (nevo_code, naam, kcal)
  select n.nevo_code, n.naam_nl, n.energie_kcal_per_100g
    from public.nevo_foods n
   where lower(n.naam_nl) like '%tomaat%'
     and (lower(n.naam_nl) like '%cherry%' or lower(n.naam_nl) like '%kerstomaat%')
     and n.energie_kcal_per_100g between 12 and 35;

  select count(*), string_agg(nevo_code || ' = ' || naam || ' (' || kcal || ' kcal)',
                              '; ' order by nevo_code)
    into v_aantal, v_namen from _tomaat;

  /* Geen treffer: dan staat cherrytomaat niet apart in de tabel. Rauwe tomaat
     is dan het eerlijke alternatief — het verschil tussen de twee is kleiner
     dan de spreiding tussen twee handjes. Dezelfde energiegrens, om dezelfde
     reden. */
  if v_aantal = 0 then
    insert into _tomaat (nevo_code, naam, kcal)
    select n.nevo_code, n.naam_nl, n.energie_kcal_per_100g
      from public.nevo_foods n
     where lower(n.naam_nl) like 'tomaat%'
       and lower(n.naam_nl) like '%rauw%'
       and n.energie_kcal_per_100g between 12 and 35;
    select count(*), string_agg(nevo_code || ' = ' || naam || ' (' || kcal || ' kcal)',
                                '; ' order by nevo_code)
      into v_aantal, v_namen from _tomaat;
  end if;

  if v_aantal = 0 then
    raise exception
      'Geen rauwe cherrytomaat of tomaat gevonden tussen 12 en 35 kcal per 100 g. '
      'Zoek zelf: select nevo_code, naam_nl, energie_kcal_per_100g from nevo_foods '
      'where lower(naam_nl) like ''%%tomaat%%'' order by 3;';
  end if;

  if v_aantal > 1 then
    raise exception
      'Meer dan een treffer, dus geen keuze om stilzwijgend te maken: %. '
      'Zet de gekozen code in blok 2 en haal blok 1 weg.', v_namen;
  end if;

  raise notice 'Cherrytomaat: %', v_namen;
end $$;


-- ---------------------------------------------------------------------------
-- BLOK 2 — HET GERECHT
-- ---------------------------------------------------------------------------

with nieuw as (
  insert into public.cultural_dishes
    (slug, name_nl, names, cuisine, description_nl, meal_moments,
     default_servings, validation_status)
  values
    ('lun-cherrytomaatjes', 'Cherrytomaatjes',
     '{"nl":["cherrytomaatjes","cherrytomaat","kerstomaatjes","tomaatjes",
             "snoeptomaatjes","cherry tomaatjes"]}'::jsonb,
     'nederlands',
     'Cherrytomaatjes erbij. Rond de tien gram per stuk, met een echte spreiding: '
     'de kleine soorten zitten op acht gram, de grotere op vijftien.',
     array['lunch','tussendoor'],
     1, 'concept')
  on conflict (slug) do nothing
  returning id
), ing as (
  insert into public.dish_ingredients
    (dish_id, position, ingredient_name_nl, category, quantity, unit,
     grams_equivalent, external_source, external_food_id, role,
     is_preparation_fat, uncertainty_note)
  select n.id, 10, 'Cherrytomaat', 'groente', 80, 'g', 80,
         'nevo', t.nevo_code, 'ingredient', false,
         'Tachtig gram is een handje, geschat en niet gewogen. Een tomaatje weegt '
         'rond de tien gram, tussen acht en vijftien.'
    from nieuw n cross join _tomaat t
  returning 1
)
insert into public.dish_portions
  (dish_id, label_nl, household_measure, grams_estimate, grams_low,
   grams_high, measurement_basis, is_default, sort_order, notes)
select n.id, p.label, p.maat, p.schat, p.laag, p.hoog, 'estimated', p.std, p.volg, p.notitie
  from nieuw n
  join (values
    ('Een handje', 'handvol', 80::numeric,  60::numeric, 110::numeric, true,  10,
     'Acht tomaatjes, ongeveer.'::text),
    ('Vijf stuks', 'stuk',    50,           40,          75,           false, 20,
     'Vijf van tien gram. Tel ze als het erop aankomt; het scheelt weinig.'),
    ('Een bakje',  'schaal',  250,          200,         300,          false, 30,
     'Het bakje uit het schap. Meestal 250 gram, soms 200 of 300.')
  ) as p(label, maat, schat, laag, hoog, std, volg, notitie) on true;

COMMIT;


-- ---------------------------------------------------------------------------
-- BLOK 3 — NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- 1. Wijst de code naar een bestaande tabelregel? Nul rijen is goed.
--
--    select d.slug, i.ingredient_name_nl, i.external_food_id
--      from dish_ingredients i join cultural_dishes d on d.id = i.dish_id
--     where d.slug = 'lun-cherrytomaatjes'
--       and not exists (select 1 from nevo_foods n where n.nevo_code = i.external_food_id);
--
-- 2. Wat komt eruit? Eén regel, rond de 15 kcal voor tachtig gram.
--
--    select d.name_nl, i.external_food_id, n.naam_nl,
--           round(sum(i.grams_equivalent)) as gram,
--           round(sum(i.grams_equivalent / 100 * n.energie_kcal_per_100g)) as kcal,
--           round(sum(i.grams_equivalent / 100 * n.vezels_g), 1) as vezel
--      from cultural_dishes d
--      join dish_ingredients i on i.dish_id = d.id
--      join nevo_foods n on n.nevo_code = i.external_food_id
--     where d.slug = 'lun-cherrytomaatjes'
--     group by d.name_nl, i.external_food_id, n.naam_nl;
--
-- 3. Twee keer draaien verandert niets. Draai het hele bestand nog een keer:
--
--    select count(*) as hoort_een_te_zijn from cultural_dishes where slug = 'lun-cherrytomaatjes';
--    select count(*) as hoort_een_te_zijn from dish_ingredients i
--      join cultural_dishes d on d.id = i.dish_id where d.slug = 'lun-cherrytomaatjes';
--    select count(*) as hoort_drie_te_zijn from dish_portions p
--      join cultural_dishes d on d.id = p.dish_id where d.slug = 'lun-cherrytomaatjes';
--
-- 4. Te vinden met de woorden die vallen?
--
--    select w, (select count(*) from cultural_dishes d
--                where lower(d.name_nl) like '%' || w || '%'
--                   or exists (select 1 from jsonb_array_elements_text(d.names->'nl') t
--                               where lower(t) like '%' || w || '%')) as treffers
--      from unnest(array['cherry','kerstomaat','tomaatjes','snoeptomaat']) w;
