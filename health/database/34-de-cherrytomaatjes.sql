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
-- Dus zocht blok 1 hem eerst zelf op, met `raise exception` als het er niet
-- precies één was. Dat bleek de goede volgorde: in de echte database gaf dat
-- vijf treffers, en het bestand viel om in plaats van er stilzwijgend een te
-- kiezen.
--
--   2730 = Tomaat tros- rauw    22 kcal
--   2731 = Tomaat kers- rauw    30 kcal      ← deze
--   2732 = Tomaat vlees- rauw   19 kcal
--   2734 = Tomaat rauw gem      25 kcal
--     60 = Tomaat gewoon rauw   20 kcal
--
-- NEVO schrijft het als "Tomaat kers-" en niet als "kerstomaat"; daarom vond
-- het eerste patroon er nul en viel het terug op alle rauwe tomaten. Het
-- verschil tussen 19 en 30 kilocalorieen is anderhalf keer, dus dat was precies
-- een keuze die niemand namens jou hoort te maken.
--
-- Nu de code bekend is staat hij er, net als in alle andere bestanden in deze
-- reeks. Maar hij wordt nagekeken en niet geloofd: klopt de naam niet meer, of
-- ligt de energie buiten wat een rauwe tomaat is, dan valt het bestand om. Dat
-- vangt een nieuwe NEVO-versie af waarin 2731 iets anders geworden is.
--
-- WAT ER UITKOMT
--
-- Dertig kilocalorieen per honderd gram, dus een handje van tachtig gram is er
-- vierentwintig. Dat is bijna niets, en dat is geen reden om het niet te loggen:
-- wat je wel eet en niet invult maakt de dag niet lichter, alleen minder waar.
-- En vezel telt het wel mee.
--
-- De kerstomaat is zwaarder dan je zou denken — een vleestomaat zit op 19 en
-- een gewone op 20. Hij is zoeter en bevat minder water. Anderhalf keer het
-- verschil, op een handje vijf kilocalorieen: het maakt niets uit voor je dag
-- en het is wel de reden dat de code nagekeken wordt.
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
--     vierentwintig kilocalorieen voor een handje van tachtig gram
--   · drie keer draaien geeft exact dezelfde tellingen (1, 1, 3)
--   · de terugdraairegel haalt het tomaatje weg, laat een lun-broodje van
--     bestand 31 staan, en laat geen wees-ingredienten of wees-porties achter
--   · met alle vijf de rauwe tomaten in de tabel kiest het 2731 en niet de
--     vleestomaat ernaast
--   · alle drie de wachten vallen om en laten nul rijen achter: code weg,
--     code heet iets anders ("Aubergine rauw"), code is gedroogd geworden
--
-- Twee vondsten die het bestand veranderd hebben, allebei uit een proef en niet
-- uit nadenken. Op de proefdatabase koos de eerste versie "Cherrytomaat
-- gedroogd" van 258 kcal boven de rauwe: één treffer, dus de wacht ging niet
-- af, en er kwam een handje van 206 kilocalorieen uit. Daar kwam de
-- energiegrens vandaan. En op de échte database gaf het opzoeken vijf rauwe
-- tomaten, waarvan de lichtste 19 en de zwaarste 30 kcal. Dat was het moment
-- waarop de code bekend werd en de opzoeking kon verdwijnen.
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
  v_naam text;
  v_kcal numeric;
begin
  /* DE CODE STAAT ER NU, EN WORDT NOG STEEDS NAGEKEKEN

     Eerst zocht dit blok de tomaat op naam, omdat ik de code niet had. Dat
     leverde in de echte database vijf treffers op — en precies daarom viel het
     bestand om in plaats van er een te kiezen:

       2730 = Tomaat tros- rauw    22 kcal
       2731 = Tomaat kers- rauw    30 kcal
       2732 = Tomaat vlees- rauw   19 kcal
       2734 = Tomaat rauw gem      25 kcal
         60 = Tomaat gewoon rauw   20 kcal

     NEVO schrijft het als "Tomaat kers-" en niet als "kerstomaat", dus mijn
     eerste patroon vond er nul en viel terug op alle rauwe tomaten. De wacht
     deed daar wat hij moest doen: vijf kandidaten is geen keuze om stilzwijgend
     te maken, en het verschil tussen 19 en 30 kcal is anderhalf keer.

     Nu de code bekend is, staat hij er — net als in alle andere bestanden in
     deze reeks. Maar hij wordt nagekeken en niet geloofd: klopt de naam niet
     meer met wat hier verwacht wordt, of ligt de energie buiten wat een rauwe
     tomaat is, dan valt het bestand om. Dat is het vangnet voor een nieuwe
     NEVO-versie waarin 2731 iets anders geworden is. */
  select n.naam_nl, n.energie_kcal_per_100g into v_naam, v_kcal
    from public.nevo_foods n where n.nevo_code = '2731';

  if v_naam is null then
    raise exception 'NEVO-code 2731 staat niet in nevo_foods.';
  end if;

  if lower(v_naam) not like '%tomaat%' or lower(v_naam) not like '%kers%' then
    raise exception
      'NEVO-code 2731 heet nu "%" en dat is geen kerstomaat meer. Zoek opnieuw: '
      'select nevo_code, naam_nl, energie_kcal_per_100g from nevo_foods '
      'where lower(naam_nl) like ''%%tomaat%%'' order by 1;', v_naam;
  end if;

  /* Een rauwe tomaat ligt tussen de twintig en veertig kilocalorieen per honderd
     gram; de kerstomaat zit met dertig aan de hoge kant, want hij is zoeter en
     bevat minder water dan een vleestomaat. Valt het erbuiten, dan is het iets
     bewerkts — gedroogd, puree, ketchup — en dan klopt de portie niet meer. */
  if v_kcal not between 20 and 40 then
    raise exception
      'NEVO-code 2731 geeft % kcal per 100 g en dat is geen rauwe tomaat.', v_kcal;
  end if;

  insert into _tomaat (nevo_code, naam, kcal) values ('2731', v_naam, v_kcal);
  raise notice 'Cherrytomaat: 2731 = % (% kcal/100 g)', v_naam, v_kcal;
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
