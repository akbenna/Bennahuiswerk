-- =============================================================================
-- FIJNER DAN EEN GROEP: één product weigeren, en een keuken uitzetten
--
-- Toegepast, en gemeten op 18 september 2026. De md5-controle van blok 3 gaf
-- `kal_verzadiging` terug op 06d1cccc04c19755174d281a789020e8, de versie uit
-- dit bestand, en `kal_hoeken` op bda6e4088510345b98b58d73700695af.
--
-- `kal_eiwitrijk` staat niet meer op de fab85bab uit dit bestand maar op de
-- da67ff29 van bestand 38: die voegde er een grens aan toe voor merkrijen
-- waarvan de energie niet met de macro s kan kloppen. De rest van deze functie
-- is daar ongewijzigd in overgenomen.
--
-- WAT ER ONTBRAK
--
-- "Wat je lust" kende één woordenschat: de zevenentwintig groepen van de
-- voedingsmiddelentabel. Die is grof. Wie geen spruitjes lust moest heel
-- "Groente" uitzetten om van één product af te komen, en daarmee ook de
-- broccoli, de wortels en de sperziebonen.
--
-- En gerechten vielen er half buiten. Bestand 36 filtert een gerecht via zijn
-- ingrediënten, en dat is precies goed voor "ik eet geen vlees" en precies
-- niets voor "ik kook nooit Syrisch". Een keuken is geen ingrediënt.
--
-- TWEE KNOPPEN, EN ALLEBEI OP IETS DAT ER AL LIGT
--
-- `nietProduct` is een lijst NEVO-codes. Op code en nooit op naam: dat laatste
-- is de fout waardoor bestand 34 bijna een gedroogde tomaat van 258 kcal voor
-- een verse aanzag. Een code is een code.
--
-- `keukens` is een lijst uit `cultural_dishes.cuisine`, en dat veld heeft een
-- CHECK met precies zes waarden: marokkaans, turks, syrisch, surinaams,
-- nederlands, overig. Er wordt hier dus niets verzonnen, het veld ligt er en
-- de functie leest het.
--
-- WAAR ZE STAAN, EN WAAROM DAAR
--
-- Allebei vóór "één per groep" en vóór de limiet, net als de uitsluiting van
-- bestand 35. Erna filteren laat een vegetariër met een lege lijst achter: de
-- vleesregels hebben dan hun plek al ingenomen en weer verloren.
--
-- WAT ER NIET IS, EN WAAROM NIET
--
-- Geen boom onder fruit en groente. NEVO heeft geen subgroep: `nevo_foods`
-- draagt `groep` en verder niets, dus "geen citrus" zou een indeling zijn die
-- ik zelf verzin en op productnamen toepas. Dat is dezelfde naamzeef die
-- hierboven al een keer misging. Een vinkje dat de helft van de citrus laat
-- staan is erger dan geen vinkje, en `nietProduct` doet hetzelfde werk zonder
-- iets te verzinnen: je klikt weg wat je niet wilt, één product tegelijk.
--
-- Geen bereidingswijze. "Gefrituurd" staat alleen in de naam, zelfde bezwaar.
--
-- WAT ER ONVERANDERD BLIJFT
--
-- Alles behalve de vier regels die hieronder als commentaar zijn aangewezen.
-- De scores, de afkappunten, de zeven uitgesloten groepen, de naamzeef, het
-- duwtje van twaalf punten, en dat `mijn_groepen` alleen markeert en nooit
-- sorteert: dat is allemaal letterlijk hetzelfde als in 35 en 36.
--
-- TERUGDRAAIEN
--
-- Dit raakt geen enkele rij. Terug naar de toestand ervoor is blok 2 van
-- bestand 35 (`kal_eiwitrijk`) en blok 2 van bestand 36 (`kal_verzadiging`)
-- opnieuw draaien.
--
-- HOE DIT IS NAGEKEKEN
--
-- Lokaal op Postgres 16 tegen het echte schema, met dezelfde opstelling waarmee
-- bestand 36 is nagekeken:
--
--   · een profiel zonder deze twee velden krijgt exact dezelfde lijst als onder
--     35 en 36: wie de app al gebruikte merkt niets
--   · een geweigerd product verdwijnt uit allebei de lijsten, en het product
--     ernaast in dezelfde groep blijft staan
--   · een uitgezette keuken haalt het gerecht weg en laat de producten staan
--   · een uitgezette keuken raakt een gerecht uit een andere keuken niet
--   · rommel in het profiel (een tekst waar een lijst hoort) gedraagt zich als
--     leeg en geeft geen fout
--
-- Daarna mutanten op elk van de vier regels.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- BLOK 1: UIT DE TABEL
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.kal_eiwitrijk(
  p_token text, p_eis numeric, p_max_kcal numeric, p_limiet integer DEFAULT 4)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
  v_nooit text[];
  v_liever text[];
  v_nietprod text[];
  v_keukens text[];
begin
  v_id := kal_sessie(p_token);

  if p_eis is null or p_eis <= 0 or p_max_kcal is null or p_max_kcal <= 0 then
    return '[]'::jsonb;
  end if;

  -- Wat "Wat je lust" heeft opgeleverd. Zie de kop voor waarom de typecontrole
  -- eromheen staat en wat een lege lijst betekent.
  select
    case when jsonb_typeof(pr.instellingen->'voorkeuren'->'nooit') = 'array'
         then array(select jsonb_array_elements_text(pr.instellingen->'voorkeuren'->'nooit'))
         else '{}'::text[] end,
    case when jsonb_typeof(pr.instellingen->'voorkeuren'->'liever') = 'array'
         then array(select jsonb_array_elements_text(pr.instellingen->'voorkeuren'->'liever'))
         else '{}'::text[] end
    ,
    case when jsonb_typeof(pr.instellingen->'voorkeuren'->'nietProduct') = 'array'
         then array(select jsonb_array_elements_text(pr.instellingen->'voorkeuren'->'nietProduct'))
         else '{}'::text[] end,
    case when jsonb_typeof(pr.instellingen->'voorkeuren'->'keukens') = 'array'
         then array(select jsonb_array_elements_text(pr.instellingen->'voorkeuren'->'keukens'))
         else '{}'::text[] end
    into v_nooit, v_liever, v_nietprod, v_keukens
    from kal_profiel pr
   where pr.gebruiker_id = v_id;

  -- Geen profielrij: dan is er ook geen voorkeur.
  v_nooit := coalesce(v_nooit, '{}'::text[]);
  v_liever := coalesce(v_liever, '{}'::text[]);
  v_nietprod := coalesce(v_nietprod, '{}'::text[]);
  v_keukens := coalesce(v_keukens, '{}'::text[]);

  return coalesce((
    with nevo as (
      select n.nevo_code, n.naam_nl as naam, n.groep,
             n.energie_kcal_per_100g as kcal100, n.eiwit_g as eiwit100,
             m.naam as portie_naam, m.gram_schatting as portie_gram,
             m.gram_laag, m.gram_hoog
        from nevo_actief n
        join lateral (
          select pm.naam, pm.gram_schatting, pm.gram_laag, pm.gram_hoog
            from voeding_portiematen pm
           where pm.nevo_code = n.nevo_code
              or (pm.nevo_code is null and pm.nevo_groep = n.groep)
           order by (pm.nevo_code is not null) desc, pm.is_standaard desc, pm.volgorde
           limit 1
        ) m on true
       where n.energie_kcal_per_100g > 0
         and n.eiwit_g is not null
         and n.eiwit_g / n.energie_kcal_per_100g >= p_eis
         and n.naam_nl !~* '\mrauw\M|onbereid|ongekookt|poeder|gedroogd|extract|gist|gelatine|bouillon|kruiden'
         -- DE UITSLUITING. Hier, vóór "één per groep" en vóór de limiet.
         and not (n.groep = any(v_nooit))
         -- EN HET LOSSE PRODUCT, op code en nooit op naam. De zevenentwintig
         -- groepen zijn grof: wie geen spruitjes lust hoeft niet heel "Groente"
         -- uit te zetten om ervan af te zijn.
         and not (n.nevo_code = any(v_nietprod))
    ),
    merk as (
      select p.id, p.barcode, p.naam, p.merk, p.groep,
             p.energie_kcal_per_100g as kcal100, p.eiwit_g as eiwit100,
             p.vet_g, p.koolhydraten_g, p.vezels_g, p.verpakking_gram,
             coalesce(p.portie_naam, 'portie') as portie_naam, p.portie_gram
        from merk_actief p
       where p.energie_kcal_per_100g > 0
         and p.eiwit_g is not null
         and p.portie_gram is not null and p.portie_gram > 0
         and p.eiwit_g / p.energie_kcal_per_100g >= p_eis
    ),
    alles as (
      select 'nevo'::text as herkomst, nevo_code, null::jsonb as merk,
             naam, groep, kcal100, eiwit100, portie_naam, portie_gram, gram_laag, gram_hoog
        from nevo
      union all
      select 'merk', null,
             jsonb_build_object(
               'id', id, 'barcode', barcode, 'naam', naam, 'merk', merk, 'groep', groep,
               'kcal', kcal100, 'eiwit_g', eiwit100, 'vet_g', vet_g,
               'koolhydraat_g', koolhydraten_g, 'vezel_g', vezels_g,
               'verpakking_gram', verpakking_gram,
               'portie_gram', portie_gram, 'portie_naam', portie_naam),
             naam || coalesce(' (' || merk || ')', ''),
             'merk', kcal100, eiwit100, portie_naam, portie_gram,
             round(portie_gram * 0.9), round(portie_gram * 1.1)
        from merk
    ),
    per_portie as (
      select *,
             round(kcal100 * portie_gram / 100) as kcal,
             round(eiwit100 * portie_gram / 100, 1) as eiwit,
             round((eiwit100 / kcal100)::numeric, 3) as dichtheid,
             -- HET DUWTJE, hier als factor en niet als optelling: de dichtheid
             -- loopt van 0,05 tot 0,25 en +12 zou de lijst omgooien in plaats
             -- van hem te verschuiven. Zie de kop.
             round((eiwit100 / kcal100
                    * case when groep = any(v_liever) then 1.12 else 1 end)::numeric, 4) as orde
        from alles
    ),
    past as (
      select *,
             row_number() over (partition by groep order by orde desc, eiwit desc) as rn
        from per_portie
       where kcal <= p_max_kcal
         and kcal >= 40
         and eiwit >= 12
    )
    select jsonb_agg(jsonb_build_object(
             'herkomst', herkomst, 'nevo_code', nevo_code, 'merk', merk,
             'naam', naam, 'groep', groep,
             'portie_naam', portie_naam, 'portie_gram', portie_gram,
             'gram_laag', gram_laag, 'gram_hoog', gram_hoog,
             'kcal', kcal, 'eiwit_g', eiwit, 'dichtheid', dichtheid)
           -- De getoonde dichtheid blijft de échte; alleen de volgorde ziet
           -- het duwtje. Anders zou er een getal op het scherm staan dat
           -- nergens uit de tabel te herleiden is.
           order by orde desc, eiwit desc)
      from (select * from past where rn = 1
             order by orde desc, eiwit desc
             limit greatest(1, least(coalesce(p_limiet, 4), 10))) x
  ), '[]'::jsonb);
end $function$;


comment on function public.kal_eiwitrijk(text, numeric, numeric, integer) is
  'De eiwitrijkste producten per kcal binnen wat er nog past, en binnen wat de gebruiker in "Wat je lust" heeft aangegeven, inclusief losse producten die hij heeft weggeklikt. Zie 23, 35 en 37.';

grant execute on function public.kal_eiwitrijk(text, numeric, numeric, integer) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- BLOK 2: WAT VULT HET BEST
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
  v_nietprod text[];
  v_keukens text[];
begin
  v_id := kal_sessie(p_token);
  v_vandaag := (now() at time zone 'Europe/Amsterdam')::date;

  if p_max_kcal is null or p_max_kcal <= 0 then
    return '[]'::jsonb;
  end if;

  /* De voorkeuren uit "Wat je lust". Ontbreken ze, of staat er iets anders dan
     een lijst, dan blijven het lege lijsten en verandert er niets, een profiel
     zonder voorkeuren hoort exact te krijgen wat het onder bestand 29 kreeg. */
  select
    case when jsonb_typeof(pr.instellingen->'voorkeuren'->'nooit') = 'array'
         then array(select jsonb_array_elements_text(pr.instellingen->'voorkeuren'->'nooit'))
         else '{}'::text[] end,
    case when jsonb_typeof(pr.instellingen->'voorkeuren'->'liever') = 'array'
         then array(select jsonb_array_elements_text(pr.instellingen->'voorkeuren'->'liever'))
         else '{}'::text[] end
    ,
    case when jsonb_typeof(pr.instellingen->'voorkeuren'->'nietProduct') = 'array'
         then array(select jsonb_array_elements_text(pr.instellingen->'voorkeuren'->'nietProduct'))
         else '{}'::text[] end,
    case when jsonb_typeof(pr.instellingen->'voorkeuren'->'keukens') = 'array'
         then array(select jsonb_array_elements_text(pr.instellingen->'voorkeuren'->'keukens'))
         else '{}'::text[] end
    into v_nooit, v_liever, v_nietprod, v_keukens
    from kal_profiel pr
   where pr.gebruiker_id = v_id;

  v_nooit := coalesce(v_nooit, '{}'::text[]);
  v_liever := coalesce(v_liever, '{}'::text[]);
  v_nietprod := coalesce(v_nietprod, '{}'::text[]);
  v_keukens := coalesce(v_keukens, '{}'::text[]);

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
          telt niet mee, daar is geen groep van te weten. */
       where not exists (
         select 1
           from dish_ingredients di
           join nevo_actief dn on dn.nevo_code = di.external_food_id
          where di.dish_id = g.dish_id
            and di.external_source = 'nevo'
            and dn.groep = any(v_nooit))
         -- EN DE KEUKEN. Dat is het enige wat een gerecht zélf draagt: de
         -- uitsluiting hierboven loopt over de ingrediënten en zegt niets over
         -- "ik kook nooit Syrisch".
         and not (g.keuken = any(v_keukens))
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
         -- EN HET LOSSE PRODUCT, op code en nooit op naam. De zevenentwintig
         -- groepen zijn grof: wie geen spruitjes lust hoeft niet heel "Groente"
         -- uit te zetten om ervan af te zijn.
         and not (n.nevo_code = any(v_nietprod))
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
                verschuiving, een paar plaatsen, niet bovenaan. */
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
end $function$;


comment on function public.kal_verzadiging(text, numeric, integer, integer) is
  'Gerechten om te koken en producten om erbij te nemen, met de hoogste voorspelde verzadiging binnen een kcal-grens, en binnen wat de gebruiker in "Wat je lust" heeft aangegeven, groepen, keukens en weggeklikte producten. Zie 28, 29, 36 en 37.';

grant execute on function public.kal_verzadiging(text, numeric, integer, integer) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- BLOK 3: NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- 1. STAAT ER VAN ALLEBEI NOG PRECIES ÉÉN?
--
--    select proname, pg_get_function_identity_arguments(oid) as argumenten
--      from pg_proc where proname in ('kal_eiwitrijk', 'kal_verzadiging')
--     order by 1;
--
--    → twee regels. `kal_eiwitrijk` met vier argumenten, `kal_verzadiging` met
--      vier. Meer regels betekent dat er een oude versie naast staat, dat is
--      precies wat er met bestand 35 misging.
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
--      kal_eiwitrijk     fab85babcfa57342dbc65ffcecc18329
--      kal_hoeken        bda6e4088510345b98b58d73700695af
--      kal_verzadiging   06d1cccc04c19755174d281a789020e8
--
-- 3. DOET HET WAT HET BELOOFT? Klik in de app een product weg bij "Uit de
--    tabel", en zet in "Wat je lust" een keuken uit. Dan:
--
--    select e->>'soort' as soort, e->>'naam' as naam, e->>'groep' as groep
--      from jsonb_array_elements(kal_verzadiging('JOUW_TOKEN', 600, 3, 4)) e;
--
--    Het weggeklikte product hoort weg te zijn, en uit de uitgezette keuken
--    hoort geen gerecht meer te komen.
