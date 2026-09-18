-- =============================================================================
-- DE VOORKEUREN IN DE GOEDE VERZADIGING — bestand 35 raakte de verkeerde functie
--
-- Toegepast 18 september 2026, en nagekeken met de controle uit blok 3:
--
--   kal_eiwitrijk     2736d7fcd1913f12b0c3bdaf33b5a237
--   kal_hoeken        bda6e4088510345b98b58d73700695af
--   kal_verzadiging   ae305ba886a359279bda7ba75bbe5e23
--
-- Drie regels en niet vier, en de derde is die van dit bestand. De database
-- draait dus wat hier staat, en "Wat vult het best" houdt zich aan "Wat je lust".
--
-- WAT ER MIS WAS
--
-- Bestand 35 zette de voorkeuren in `kal_verzadiging`. Het zette ze in een
-- `kal_verzadiging` — niet in degene die de app aanroept.
--
-- De keten liep zo. Bestand 28 maakte `kal_verzadiging(text, numeric, integer)`:
-- alleen producten, met een limiet. Bestand 29 gaf hem een bovenste helft met
-- gerechten erbij, en daarvoor was een vierde argument nodig — `p_gerechten` en
-- `p_producten` in plaats van één `p_limiet`. Bestand 29 haalde de oude dus weg:
--
--   drop function if exists public.kal_verzadiging(text, numeric, integer);
--
-- Bestand 35 is op bestand 28 gebaseerd en niet op 29. `create or replace` kijkt
-- naar de handtekening, en die verschilde, dus verving het niets: het zette de
-- driearguments-versie terug naast de vierarguments-versie. Twee functies met
-- dezelfde naam, en de app roept de andere aan.
--
--   src/gedeeld/db/rpc.ts:
--     kal_verzadiging: { in: { p_token, p_max_kcal, p_gerechten?, p_producten? } }
--
-- Gevolg: "Wat vult het best" hield zich niet aan "Wat je lust". De functie die
-- dat wel deed stond erin en werd door niets aangeroepen. Er kwam geen fout, geen
-- waarschuwing en geen leeg scherm — het werkte gewoon zoals eerst.
--
-- HOE HET AAN HET LICHT KWAM
--
-- Niet door te kijken en niet door na te denken, maar door de md5-controle uit
-- de kop van bestand 35. Die gaf vier regels terug waar er drie hoorden te staan:
--
--   kal_eiwitrijk     2736d7fcd1913f12b0c3bdaf33b5a237
--   kal_hoeken        bda6e4088510345b98b58d73700695af
--   kal_verzadiging   cc0dc4ccf36ff28184cf6ff9af22a078   ← bestand 35, drie argumenten
--   kal_verzadiging   d2ed0b391960919e595020f0bf738797   ← bestand 29, vier argumenten
--
-- Een regel te veel, en dat is het hele signaal. Dat is de reden dat die
-- controle op de naam staat en niet op naam plus handtekening: een tweede
-- functie erbij is precies de fout die je anders niet ziet.
--
-- WAT DIT BESTAND DOET
--
-- Eén: de driearguments-versie van bestand 35 weghalen. Die wordt door niets
-- aangeroepen en staat alleen maar in de weg.
--
-- Twee: de vierarguments-versie van bestand 29 vervangen door dezelfde functie
-- mét de voorkeuren erin. De rest van die functie is letterlijk ongewijzigd —
-- de scores, de afkappunten, de zeven uitgesloten groepen, de naamzeef en de
-- som die op één plek staat.
--
-- WAT ER ANDERS IS DAN IN BESTAND 35
--
-- Bestand 35 kende maar één soort rij: een product uit de tabel, met een
-- NEVO-groep. Hier zijn er twee, en bij een gerecht is `groep` de kéuken
-- ("surinaams", "nederlands") en geen tabelgroep. `groep = any(v_nooit)` zegt
-- daar dus niets.
--
-- DE UITSLUITING BIJ EEN GERECHT LOOPT OVER DE INGREDIËNTEN
--
-- Een gerecht valt af zodra één van zijn ingrediënten in een groep zit die je
-- hebt uitgezet. Voor een vegetariër is dat het hele punt: een tajine met lam
-- voorstellen is precies wat "Wat je lust" hoort te voorkomen, en die tajine
-- draagt de keuken "marokkaans" en niet de groep "Vlees en gevogelte".
--
-- Ook een ingrediënt dat als optioneel staat aangemerkt sluit het gerecht uit.
-- Dat is met opzet de strenge kant: een gerecht mislopen dat je vegetarisch had
-- kunnen maken kost je een suggestie, een gerecht voorgesteld krijgen met vlees
-- erin kost je het vertrouwen in de lijst. Dat is een keuze en geen vanzelf-
-- sprekendheid, dus hij heeft zijn eigen geval in de proef.
--
-- EN WAAROM `external_source = 'nevo'` DAAR LOAD DRAAGT
--
-- `external_food_id` is één veld voor drie soorten verwijzing: een NEVO-code,
-- een FatSecret-id, of niets. Allebei de eerste twee zijn cijferreeksen, dus ze
-- kunnen botsen: een FatSecret-id dat toevallig gelijk is aan de NEVO-code van
-- rundvlees zou een schaal linzen tot vleesgerecht maken en hem bij een
-- vegetariër laten verdwijnen. Zonder die ene regel gebeurt dat stil.
--
-- Een ingrediënt zonder koppeling telt helemaal niet mee: daar is geen groep van
-- te weten, en er een raden is erger dan hem laten staan. Dat is dezelfde keuze
-- als bij de merkproducten in "Wat je lust".
--
-- HET DUWTJE GELDT ALLEEN VOOR PRODUCTEN
--
-- Bij een product ís de groep het voedsel: "Vis" op liever betekent dat vis
-- omhoog mag. Bij een gerecht is de groep één van zes ingrediënten, en bijna elk
-- gerecht bevat groente. Zou "Groente" op liever elk gerecht twaalf punten geven,
-- dan verschuift er niets en heet het toch een voorkeur. Een duwtje dat alles
-- optilt is geen duwtje.
--
-- Dus: de uitsluiting geldt voor allebei, het duwtje alleen voor producten.
--
-- Eerlijk erbij: die voorwaarde `a.soort = 'product'` doet op dit moment niets.
-- Een keuken is 'marokkaans', 'turks', 'syrisch', 'surinaams', 'nederlands' of
-- 'overig' — dat staat als CHECK op `cultural_dishes` — en geen van die zes is
-- een NEVO-groep. `groep = any(v_liever)` kan bij een gerecht dus nooit waar
-- zijn, met of zonder die voorwaarde. De mutatieproef bevestigde dat: hem
-- weghalen verandert niets.
--
-- Hij staat er toch, en dat is een keuze die uitgelegd hoort te worden. Wat hier
-- werkt is een toevalligheid van twee woordenlijsten die elkaar niet raken, en
-- niet iets wat het bestand zelf regelt. Wie ooit `gerecht.groep` iets anders
-- laat dragen, krijgt zonder die voorwaarde stilzwijgend een duwtje op gerechten
-- dat niemand bedoeld heeft. Dat is precies de soort verandering die geen fout
-- geeft.
--
-- WAT ER ONVERANDERD BLIJFT
--
-- `mijn_groepen` en `mijn_gerechten` markeren nog steeds alleen en sorteren
-- nooit. Dat is wat je gezíen bent te eten; de voorkeur is wat je gezégd hebt.
-- Sorteren op het eerste is een lus — wie drie weken hetzelfde eet krijgt drie
-- weken hetzelfde voorgesteld — en op het tweede een grens. Zie de kop van
-- bestand 28 en `src/health/voorkeuren.ts`.
--
-- De drempel `score >= 45` blijft op de échte score staan en niet op de geduwde.
-- Een duwtje hoort iets te verschuiven, niet iets toe te laten wat de drempel
-- niet haalt. En getoond wordt ook de echte score: het getal op het scherm is
-- wat het gerecht werkelijk scoort, niet wat jouw voorkeur ervan maakte.
--
-- TERUGDRAAIEN
--
-- Er valt niets terug te draaien aan inhoud — dit bestand raakt geen enkele rij.
-- Wil je terug naar de toestand van vóór de voorkeuren, draai dan blok 2 van
-- bestand 29 opnieuw. Dan staat de vierarguments-versie er weer zonder
-- voorkeuren, en de driearguments-versie blijft weg waar hij hoort.
--
-- HOE DIT IS NAGEKEKEN
--
-- Lokaal op Postgres 16 tegen het echte schema, met de toestand van de database
-- eerst nagebouwd: bestand 29 geladen, daarna de functies van bestand 35, en de
-- twee md5's kwamen exact overeen met wat de echte database teruggaf. Daarna dit
-- bestand erover:
--
--   · er staat nog precies één `kal_verzadiging`, met vier argumenten
--   · een gebruiker zonder voorkeuren krijgt exact dezelfde lijst als onder
--     bestand 29, en een profiel met rommel in `voorkeuren` ook
--   · "Vlees en gevogelte" op nooit haalt het vleesproduct én het gerecht met
--     vlees eruit, en laat de rest staan
--   · een gerecht met een ingrediënt zonder koppeling blijft staan
--   · een gerecht met een FatSecret-id dat botst met de NEVO-code van vlees
--     blijft óók staan — dat is geen vlees
--   · een gerecht met optioneel vlees valt wél af
--   · "Vis" op liever zet zalm van de derde naar de tweede plaats, en de
--     getoonde score blijft 48
--   · de drempel laat niets extra's toe: een ei van score 37 komt er met het
--     duwtje erbij (49) nog steeds niet in
--   · alles op nooit geeft een lege lijst en geen fout
--
-- Daarna acht mutanten, alle acht dood: allebei de uitsluitingen weg, de drempel
-- op de geduwde waarde, de geduwde score getoond, het duwtje op nul, weer op
-- score sorteren, de `nevo`-eis bij de ingrediënten weg, en optionele
-- ingrediënten uitgezonderd.
--
-- Twee daarvan overleefden de eerste ronde, en allebei wezen ze een bewering in
-- deze kop aan die nergens op steunde: de botsende FatSecret-code en het
-- optionele ingrediënt. Die twee gevallen staan er nu in. Een kop die iets
-- belooft wat geen proef afdwingt is een kop die het over een voornemen heeft.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- BLOK 1 — DE OVERBODIGE FUNCTIE WEG
-- ---------------------------------------------------------------------------
--
-- Dit is de driearguments-versie die bestand 35 terugzette. Niets roept hem aan.
-- `if exists` staat erbij zodat dit bestand ook draait op een database waar
-- bestand 35 nooit gedraaid heeft.

drop function if exists public.kal_verzadiging(text, numeric, integer);


-- ---------------------------------------------------------------------------
-- BLOK 2 — DE FUNCTIE DIE DE APP WÉL AANROEPT
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.kal_verzadiging(
  p_token text, p_max_kcal numeric,
  p_gerechten integer DEFAULT 3, p_producten integer DEFAULT 4)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_vandaag date;
  v_g integer := greatest(0, least(coalesce(p_gerechten, 3), 8));
  v_p integer := greatest(0, least(coalesce(p_producten, 4), 8));
  v_nooit text[];
  v_liever text[];
begin
  v_id := kal_sessie(p_token);
  v_vandaag := (now() at time zone 'Europe/Amsterdam')::date;

  if p_max_kcal is null or p_max_kcal <= 0 then
    return '[]'::jsonb;
  end if;

  /* De voorkeuren uit "Wat je lust". Ontbreken ze, of staat er iets anders dan
     een lijst, dan blijven het lege lijsten en verandert er niets — een profiel
     zonder voorkeuren hoort exact te krijgen wat het onder bestand 29 kreeg. */
  select
    case when jsonb_typeof(pr.instellingen->'voorkeuren'->'nooit') = 'array'
         then array(select jsonb_array_elements_text(pr.instellingen->'voorkeuren'->'nooit'))
         else '{}'::text[] end,
    case when jsonb_typeof(pr.instellingen->'voorkeuren'->'liever') = 'array'
         then array(select jsonb_array_elements_text(pr.instellingen->'voorkeuren'->'liever'))
         else '{}'::text[] end
    into v_nooit, v_liever
    from kal_profiel pr
   where pr.gebruiker_id = v_id;

  v_nooit := coalesce(v_nooit, '{}'::text[]);
  v_liever := coalesce(v_liever, '{}'::text[]);

  return coalesce((
    with mijn_groepen as (
      -- Ongewijzigd, en nog steeds alleen om te markeren. Dit is wat je gezien
      -- bent te eten; de voorkeur hierboven is wat je gezegd hebt. Sorteren op
      -- het eerste is een lus, op het tweede een grens.
      select distinct n.groep
        from kal_regels r
        join nevo_actief n on n.nevo_code = r.nevo_code
       where r.gebruiker_id = v_id
         and r.datum between v_vandaag - 60 and v_vandaag
         and r.bron <> 'import'
    ),
    mijn_gerechten as (
      -- Bij een gerecht kan het exact: een gelogde regel draagt het dish_id.
      select distinct r.dish_id
        from kal_regels r
       where r.gebruiker_id = v_id
         and r.dish_id is not null
         and r.datum between v_vandaag - 60 and v_vandaag
         and r.bron <> 'import'
    ),

    /* ---------------------------------------------------------------- */
    gerecht as (
      select 'gerecht'::text as soort,
             g.dish_id::text as sleutel, null::text as nevo_code, g.dish_id,
             g.naam, g.keuken as groep,
             100.0 * g.kcal / g.gram          as kcal100,
             -- 100 en niet 10000. `g.kcal` is de energie van het héle gerecht,
             -- niet die per honderd gram: gram per 100 kcal is dus gram/(kcal/100).
             100.0 * g.gram / g.kcal          as gram100,
             100.0 * g.eiwit / g.kcal         as eiwit100,
             100.0 * g.vezel / g.kcal         as vezel100,
             coalesce(p.label_nl, 'portie')   as portie_naam,
             p.grams_estimate as portie_gram, p.grams_low as gram_laag,
             p.grams_high as gram_hoog,
             (g.dish_id in (select dish_id from mijn_gerechten)) as bekend
        from kal_gerecht_dichtheid g
        join lateral (
          select pp.label_nl, pp.grams_estimate, pp.grams_low, pp.grams_high
            from dish_portions pp
           where pp.dish_id = g.dish_id and pp.grams_estimate > 0
           order by pp.is_default desc, pp.sort_order
           limit 1
        ) p on true
       /* DE UITSLUITING BIJ EEN GERECHT, over de ingrediënten en niet over de
          groep: `g.keuken` is "surinaams" en geen tabelgroep. Eén ingrediënt uit
          een uitgezette groep is genoeg. Een ingrediënt zonder NEVO-koppeling
          telt niet mee — daar is geen groep van te weten. */
       where not exists (
         select 1
           from dish_ingredients di
           join nevo_actief dn on dn.nevo_code = di.external_food_id
          where di.dish_id = g.dish_id
            and di.external_source = 'nevo'
            and dn.groep = any(v_nooit))
    ),
    product as (
      select 'product'::text as soort,
             n.nevo_code as sleutel, n.nevo_code, null::uuid as dish_id,
             n.naam_nl as naam, n.groep,
             n.energie_kcal_per_100g                             as kcal100,
             10000.0 / n.energie_kcal_per_100g                   as gram100,
             n.eiwit_g * 100.0 / n.energie_kcal_per_100g         as eiwit100,
             coalesce(n.vezels_g, 0) * 100.0 / n.energie_kcal_per_100g as vezel100,
             m.naam as portie_naam, m.gram_schatting as portie_gram,
             m.gram_laag, m.gram_hoog,
             (n.groep in (select groep from mijn_groepen)) as bekend
        from nevo_actief n
        join lateral (
          select pm.naam, pm.gram_schatting, pm.gram_laag, pm.gram_hoog
            from voeding_portiematen pm
           where pm.nevo_code = n.nevo_code
              or (pm.nevo_code is null and pm.nevo_groep = n.groep)
           order by (pm.nevo_code is not null) desc, pm.is_standaard desc, pm.volgorde
           limit 1
        ) m on true
       where n.energie_kcal_per_100g >= 10
         and n.eiwit_g is not null
         and n.naam_nl !~* '\mrauw\M|onbereid|ongekookt|poeder|gedroogd|extract'
                        '|gist|gelatine|bouillon|kruiden|kiemen'
                        '|drank|drink|\msap\M|limonade|smoothie|shake|siroop'
         and n.groep not in (
               'Kruiden en specerijen', 'Hartige sauzen', 'Zoete sauzen',
               'Niet-alcoholische dranken', 'Alcoholische dranken',
               'Flesvoeding en preparaten', 'Diversen',
               'Suiker, snoep, zoet beleg', 'Vetten, oliën en hartige sauzen')
         -- DE UITSLUITING, vóór "één per groep" en vóór de limiet. Erna filteren
         -- laat een vegetariër met een lege lijst achter.
         and not (n.groep = any(v_nooit))
    ),
    alles as (select * from gerecht union all select * from product),
    gescoord as (
      select a.*,
             round(a.kcal100 * a.portie_gram / 100) as portie_kcal,
             round((45 * least(1, a.gram100 / 240.0)
                  + 35 * least(1, a.eiwit100 / 12.5)
                  + 20 * least(1, a.vezel100 / 5.0))::numeric) as score,
             /* HET DUWTJE, en alleen bij een product. Bij een gerecht is `groep`
                de keuken en zegt `liever` er niets over; over de ingrediënten
                gaan zou bijna elk gerecht optillen, en wat alles optilt
                verschuift niets. Twaalf punten op honderd is de bedoelde
                verschuiving — een paar plaatsen, niet bovenaan. */
             round((45 * least(1, a.gram100 / 240.0)
                  + 35 * least(1, a.eiwit100 / 12.5)
                  + 20 * least(1, a.vezel100 / 5.0)
                  + case when a.soort = 'product' and a.groep = any(v_liever)
                         then 12 else 0 end)::numeric) as orde
        from alles a
    ),
    past as (
      select *,
             row_number() over (partition by soort, groep
                                order by orde desc, gram100 desc) as per_groep,
             row_number() over (partition by soort
                                order by orde desc, gram100 desc) as per_soort
        from gescoord
       -- De drempel blijft op de échte score staan. Een duwtje hoort iets te
       -- verschuiven en niet iets toe te laten wat de drempel niet haalt.
       where score >= 45
         and portie_kcal <= p_max_kcal
    ),
    /* Eén per groep, en daarbinnen de beste N per soort. Bij een gerecht is de
       groep de keuken, dus je krijgt niet drie tajines op rij. */
    gekozen as (
      select * from (
        select *, row_number() over (partition by soort
                                     order by orde desc, gram100 desc) as rn
          from past where per_groep = 1
      ) x
       where (soort = 'gerecht' and rn <= v_g)
          or (soort = 'product' and rn <= v_p)
    )
    select jsonb_agg(jsonb_build_object(
             'soort', soort, 'sleutel', sleutel,
             'nevo_code', nevo_code, 'dish_id', dish_id,
             'naam', naam, 'groep', groep,
             'portie_naam', portie_naam, 'portie_gram', round(portie_gram),
             'gram_laag', round(gram_laag), 'gram_hoog', round(gram_hoog),
             'kcal', portie_kcal,
             'gram_per_100kcal', round(gram100),
             'eiwit_per_100kcal', round(eiwit100, 1),
             'vezel_per_100kcal', round(vezel100, 1),
             -- Getoond wordt de echte score en niet de geduwde: het getal op het
             -- scherm is wat het werkelijk scoort.
             'score', score, 'bekend', bekend)
           order by (soort = 'product'), orde desc, gram100 desc)
      from gekozen
  ), '[]'::jsonb);
end $function$
;

comment on function public.kal_verzadiging(text, numeric, integer, integer) is
  'Gerechten om te koken en producten om erbij te nemen, met de hoogste voorspelde verzadiging binnen een kcal-grens, en binnen wat de gebruiker in "Wat je lust" heeft aangegeven. Voorspelling uit de samenstelling, geen gemeten verzadigingsindex. Zie 28, 29 en 36.';

grant execute on function public.kal_verzadiging(text, numeric, integer, integer) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- BLOK 3 — NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- 1. STAAT ER NOG PRECIES ÉÉN? Dit is de belangrijkste van de vier — het is de
--    vraag die bestand 35 verkeerd beantwoordde.
--
--    select proname, pg_get_function_identity_arguments(oid) as argumenten
--      from pg_proc where proname = 'kal_verzadiging';
--
--    → één regel, met vier argumenten.
--
-- 2. DRAAIT DE DATABASE WAT HIER STAAT?
--
--    select p.proname,
--           md5(regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'),
--                              '\s+', ' ', 'g')) as in_de_database
--      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--     where n.nspname = 'public'
--       and p.proname in ('kal_eiwitrijk', 'kal_verzadiging', 'kal_hoeken')
--     order by 1;
--
--    → drie regels, en deze drie:
--
--      kal_eiwitrijk     2736d7fcd1913f12b0c3bdaf33b5a237
--      kal_hoeken        bda6e4088510345b98b58d73700695af
--      kal_verzadiging   ae305ba886a359279bda7ba75bbe5e23
--
--    Vier regels betekent dat er weer een tweede functie naast staat.
--
-- 3. HOUDT HIJ ZICH AAN JE VOORKEUREN? Zet in "Wat je lust" een groep op nooit
--    waar je nu wél iets uit ziet, en kijk of het weggaat:
--
--    select e->>'soort' as soort, e->>'naam' as naam, e->>'groep' as groep
--      from jsonb_array_elements(kal_verzadiging('JOUW_TOKEN', 600, 3, 4)) e;
--
-- 4. EN LAAT HIJ DE REST STAAN? Een profiel zonder voorkeuren hoort exact te
--    krijgen wat het onder bestand 29 kreeg — zelfde volgorde, zelfde scores.
--
--    select jsonb_array_length(kal_verzadiging('JOUW_TOKEN', 600, 3, 4)) as aantal;
