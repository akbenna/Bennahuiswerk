-- =============================================================================
-- DE ZEEF EN DE VOLGORDE OMGEDRAAID
--
-- Nog niet toegepast. Dit corrigeert bestand 20, dat al gedraaid heeft.
--
-- WAT ER MIS WAS
--
-- Bestand 20 liet twee maten naast elkaar de dienst uitmaken: het skelet én de
-- trigram-gelijkenis, allebei als zeef, met een drempel van 0,5. Op de echte
-- tabel gaf dat dit:
--
--   zoeken op "harira"   ->  Haring gezouten, Bokking gerookt, Haring pan- rauw,
--                            Bonen sperzie- rauw, Bonen sperzie- gekookt, ...
--   zoeken op "doner"    ->  Pepermunt, Donut ongevuld, Roggebrood volkoren,
--                            Glutenvrij brood donker, ...
--
-- Allemaal met de vlag `benadering` aan, dus onder de kop "Niets met precies die
-- spelling. Dit lijkt erop:". Haring is geen benadering van harira. Dat is een
-- fout antwoord, netjes ingepakt, en dat is erger dan een leeg scherm.
--
-- WAT DE METING LIET ZIEN
--
-- Op 2328 producten met hun Engelse namen erbij, per woord:
--
--     spagetti  -> spaghetti   0,58      goed
--     harira    -> haring      0,57      ruis
--     felafel   -> falafel     0,57      goed
--     lesagna   -> lasagna     0,50      goed
--     sjoarma   -> shoarma     0,50      goed
--     doner     -> donker      0,50      ruis
--
-- Er ís geen drempel die dit scheidt. Op 0,7 verlies je lasagne, falafel,
-- spaghetti en shoarma; op 0,5 krijg je haring en donut. De trigram-maat kan
-- deze klus niet doen, en dat had ik moeten meten vóór ik hem erin zette in
-- plaats van erna. De proef in bestand 20 keek naar aantallen en naar één
-- onzinwoord, en niet naar wat er in de rijen stond — precies de fout die aan
-- het begin van deze hele reeks bij "mayonaise" gemaakt werd.
--
-- WAT ER NU GEBEURT
--
-- Het skelet is de zeef, de trigram is de volgorde.
--
-- Het skelet zeeft schoon: harira wordt `rr` en valt af op de lengte-eis, doner
-- wordt `tnr` terwijl donker `tnkr` wordt. Over de hele tabel is 85% van de
-- skeletten van vier letters uniek en botst er geen enkele met meer dan vier
-- woorden.
--
-- Maar een kort skelet kan veel producten raken: `brt` staat voor brood, bereid,
-- bread en broad samen, en die zitten in 285 producten. Daar is de trigram wél
-- goed voor — als sorteersleutel binnen wat het skelet doorlaat:
--
--     broot     -> Glutenvrij brood ...    0,67   (bereid zakt weg)
--     yoghurd   -> Yoghurt volle/magere    0,75   (gort zakt weg)
--     havermoud -> Pap havermout-          0,80   (vermouth zakt naar 0,40)
--
-- WAT ER DAARDOOR VERANDERT AAN BLOK 2
--
-- Zonder de trigram-zeef vindt "sjoarma" niets meer — het skelet `sgrm` is niet
-- `srm`, want de sj en de sh worden verschillend behandeld. Dat is geen verlies
-- maar een verplaatsing: zo'n woord hoort een synoniem te zijn en geen toevallige
-- gelijkenis. Blok 2 draait de koppeling uit bestand 20 opnieuw; die is
-- zelfsnoeiend en voegt nu toe wat de zeef niet meer zelf oplost.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- BLOK 1 — DE TWEE FUNCTIES
-- ---------------------------------------------------------------------------
--
-- `kal_woordskelet` blijft zoals hij is; die stond niet ter discussie.

CREATE OR REPLACE FUNCTION public.kal_nevo_zoek(p_q text, p_limiet integer DEFAULT 8)
 RETURNS TABLE(nevo_code text, naam_nl text, groep text, energie_kcal_per_100g numeric, eiwit_g numeric, vet_g numeric, koolhydraten_g numeric, vezels_g numeric, benadering boolean)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with vraag as (
    select regexp_replace(
             lower(regexp_replace(trim(coalesce(p_q,'')), '[^a-zà-ÿ0-9 ]', ' ', 'g')),
             '\s+', ' ', 'g') as q
  ),
  ruw as (
    select distinct w
    from vraag, unnest(string_to_array((select q from vraag), ' ')) as w
    where length(w) >= 2
      and w not in ('met','van','de','het','een','in','uit','op','aan','bij',
                    'er','of','en','per','voor','zonder',
                    -- telwoorden: ruis in een voedingstabel, en soms erger dan ruis
                    'twee','drie','vier','vijf','zes','zeven','acht','negen','tien',
                    'wat','beetje','stukje','paar')
  ),
  woorden as (
    -- sluitende -e eraf bij woorden van vijf letters of meer: gekookte -> gekookt
    select distinct
      case when length(w) >= 5 and right(w,1) = 'e' then left(w, length(w)-1) else w end as w
    from ruw
  ),
  bron as (
    -- nevo_actief en niet nevo_foods: dit is de licentiepoort. Staat de licentie
    -- van de actieve versie niet op gecontroleerd, dan is deze bron leeg en
    -- vindt het zoeken niets — precies wat de schakelaar hoort te doen. Dat geldt
    -- ook voor de terugval hieronder: die leest dezelfde bron.
    select n.nevo_code, n.naam_nl, n.groep, n.energie_kcal_per_100g,
           n.eiwit_g, n.vet_g, n.koolhydraten_g, n.vezels_g,
           lower(n.naam_nl) as nm,
           lower(n.naam_nl || ' ' || coalesce(n.naam_en,'') || ' '
                 || coalesce(n.synoniem_nevo,'') || ' '
                 || coalesce(array_to_string(n.synoniemen_afgeleid, ' '), '')) as tekst,
           (select array_agg(lower(s))
              from unnest(array[n.naam_en, n.synoniem_nevo]
                          || coalesce(n.synoniemen_afgeleid, '{}')) s
             where s is not null) as syn
    from nevo_actief n
  ),
  -- treffers per woord, in één keer; hieruit volgt zowel de document frequency
  -- als welke producten welk woord bevatten
  raak as (
    select w.w, b.nevo_code
    from woorden w
    join bron b on
      case when length(w.w) <= 2 then b.tekst ~ ('\m' || w.w || '\M')
           when length(w.w) <= 4 then b.tekst ~ ('\m' || w.w)
           else position(w.w in b.tekst) > 0 end
  ),
  gewicht as (
    select w.w,
           -- greatest(..., 1): bij een lege bron zou dit ln(0) zijn en afbreken.
           -- Vanaf één product verandert er niets aan de uitkomst.
           ln(greatest((select count(*) from bron), 1)::numeric
              / (1 + (select count(*) from raak r where r.w = w.w)))
             as idf
    from woorden w
  ),
  totaal as (
    select coalesce(sum(greatest(idf, 0.01)), 0) as punten, count(*)::int as n from gewicht
  ),
  geteld as (
    select b.*,
           coalesce((select sum(greatest(g.idf, 0.01))
                       from raak r join gewicht g on g.w = r.w
                      where r.nevo_code = b.nevo_code), 0) as score,
           (select count(*) from raak r where r.nevo_code = b.nevo_code) as woorden_raak
    from bron b
  ),
  -- Wat het woordzoeken oplevert. Dit stond vroeger als eindselect met een
  -- `order by` eronder; de drie sorteersleutels staan nu als kolom in de rij,
  -- zodat de terugval eronder geplakt kan worden en de volgorde blijft staan.
  treffers as (
    select g.nevo_code, g.naam_nl, g.groep, g.energie_kcal_per_100g,
           g.eiwit_g, g.vet_g, g.koolhydraten_g, g.vezels_g,
           case
             when g.nm = v.q               then 0   -- precies deze naam
             when v.q = any(g.syn)         then 1   -- precies dit hele synoniem
             when g.nm like v.q || '%'     then 2   -- de naam begint met de vraag
             when g.woorden_raak = t.n     then 3   -- alle woorden komen voor
             else 4                                 -- een deel van de woorden
           end as trede,
           t.punten - g.score as afstand,   -- het zeldzaamste woord weegt zwaarst
           length(g.naam_nl) as lengte,     -- NEVO geeft het kernproduct de kortste naam
           false as benadering              -- dit is gevonden, niet benaderd
    from geteld g, totaal t, vraag v
    where t.n > 0 and g.woorden_raak > 0
  ),
  -- DE TERUGVAL, NA METING HERZIEN
  --
  -- De eerste versie zeefde op trigram-gelijkenis (word_similarity >= 0,5) en
  -- dat was aantoonbaar fout. Gemeten op de echte tabel van 2328 producten met
  -- hun Engelse namen erbij:
  --
  --     spagetti  -> spaghetti   0,58      GOED
  --     harira    -> haring      0,57      RUIS
  --     felafel   -> falafel     0,57      GOED
  --     lesagna   -> lasagna     0,50      GOED
  --     sjoarma   -> shoarma     0,50      GOED
  --     doner     -> donker      0,50      RUIS
  --
  -- De goede treffers en de ruis liggen in dezelfde band. Er is geen drempel die
  -- ze scheidt: op 0,7 verdwijnen lasagne, falafel en spaghetti, op 0,5 komen
  -- haring en donut binnen. Het scherm liet dat ook zien — wie "harira" zocht
  -- kreeg vier haringen en drie sperziebonen (Frans: haricots) onder de kop
  -- "dit lijkt erop". Dat is erger dan een leeg scherm.
  --
  -- Het skelet doet het wel, en de reden is te zien in dezelfde rijen: "harira"
  -- wordt `rr` en valt af op de lengte-eis, "doner" wordt `tnr` en "donker"
  -- wordt `tnkr`. Over de hele tabel:
  --
  --     skeletlengte 3   62% uniek, ergste botsing 8 woorden
  --     skeletlengte 4   85% uniek, ergste botsing 4 woorden, nooit meer
  --     skeletlengte 5   92% uniek
  --
  -- Dus: het skelet is de zeef. Maar een korte botsing kan wel veel producten
  -- raken — `brt` (brood, bereid, bread, broad) zit in 285 producten — en dan
  -- staat het goede antwoord er wel tussen maar niet bovenaan.
  --
  -- Daar komt de trigram alsnog van pas, niet als zeef maar als volgorde. Wie
  -- "broot" typt lijkt sterk op "brood" en nauwelijks op "bereid", en gemeten
  -- zet dat de goede bovenaan:
  --
  --     broot     -> Glutenvrij brood ...    0,67   (bereid zakt weg)
  --     yoghurd   -> Yoghurt volle/magere    0,75   (gort zakt weg)
  --     havermoud -> Pap havermout-          0,80   (vermouth zakt naar 0,40)
  --
  -- Hij draait alleen als het woordzoeken niets vond. Dat is met opzet: een
  -- benadering hoort nooit een echte treffer te verdringen, en de kosten betaal
  -- je zo alleen op een scherm dat anders leeg was gebleven.
  benadering as (
    select b.nevo_code, b.naam_nl, b.groep, b.energie_kcal_per_100g,
           b.eiwit_g, b.vet_g, b.koolhydraten_g, b.vezels_g,
           9 as trede,                      -- altijd achter elke echte trede
           1 - max(m.nabij) as afstand,
           length(b.naam_nl) as lengte,
           -- Deze vlag gaat mee naar het scherm. Zonder hem zou de app een
           -- benadering tonen alsof het een treffer was, en dat is dezelfde
           -- soort stilzwijgen als een getal zonder zijn onzekerheid.
           true as benadering
    from bron b
    join lateral (
      select extensions.word_similarity(w.w, nw) as nabij
      from woorden w,
           unnest(string_to_array(
             regexp_replace(b.tekst, '[^a-zà-ÿ0-9 ]', ' ', 'g'), ' ')) as nw
      where length(nw) >= 4
        and length(kal_woordskelet(w.w)) >= 3
        and kal_woordskelet(w.w) = kal_woordskelet(nw)
    ) m on true
    group by b.nevo_code, b.naam_nl, b.groep, b.energie_kcal_per_100g,
             b.eiwit_g, b.vet_g, b.koolhydraten_g, b.vezels_g
  )
  select u.nevo_code, u.naam_nl, u.groep, u.energie_kcal_per_100g,
         u.eiwit_g, u.vet_g, u.koolhydraten_g, u.vezels_g, u.benadering
  from (
    select * from treffers
    -- `not exists` op een gematerialiseerde CTE wordt een InitPlan: staat er iets
    -- in `treffers`, dan wordt deze tak niet uitgevoerd en kost hij niets.
    union all
    select * from benadering where not exists (select 1 from treffers)
  ) u
  order by u.trede, u.afstand, u.lengte, u.naam_nl
  limit greatest(1, least(coalesce(p_limiet, 8), 50));
$function$
;

CREATE OR REPLACE FUNCTION public.kal_zoeken(p_token text, p_q text, p_limiet integer DEFAULT 25)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_id uuid;
  v_q  text;
  v_w  text[];
begin
  v_id := kal_sessie(p_token);
  v_q := lower(trim(coalesce(p_q, '')));
  if length(v_q) < 2 then
    return '{"nevo":[],"gerechten":[],"eigen":[],"maaltijden":[]}'::jsonb;
  end if;

  -- woorden van twee letters of meer, zonder de gebruikelijke vulwoorden
  select coalesce(array_agg(w), '{}') into v_w
  from unnest(string_to_array(
         regexp_replace(regexp_replace(v_q, '[^a-zà-ÿ0-9 ]', ' ', 'g'), '\s+', ' ', 'g'),
         ' ')) as w
  where length(w) >= 2
    and w not in ('met','van','de','het','een','in','uit','op','aan','bij',
                  'er','of','en','per','voor','zonder',
                    -- telwoorden: ruis in een voedingstabel, en soms erger dan ruis
                    'twee','drie','vier','vijf','zes','zeven','acht','negen','tien',
                    'wat','beetje','stukje','paar');
  if array_length(v_w, 1) is null then v_w := array[v_q]; end if;

  return jsonb_build_object(
    -- Eigen maaltijden eerst opgezocht, want ze staan in het scherm ook bovenaan:
    -- wie "tonijn" typt bedoelt zijn eigen salade en niet de tabel. Er wordt in de
    -- naam én in de onderdelen gezocht, zodat "paprika" hem ook vindt.
    'maaltijden', coalesce((
      select jsonb_agg(kal_maaltijd_een(m.id) order by m.favoriet desc, length(m.naam))
      from kal_recepten m
     where m.gebruiker_id = v_id
       and (select bool_and(
              lower(m.naam || ' ' || coalesce(
                (select string_agg(g.naam, ' ') from kal_recept_regels g where g.recept_id = m.id),
                '')) like '%' || w || '%')
            from unnest(v_w) w)), '[]'::jsonb),

    'nevo', coalesce((
      select jsonb_agg(jsonb_build_object(
               'nevo_code', z.nevo_code, 'naam', z.naam_nl, 'groep', z.groep,
               'kcal', z.energie_kcal_per_100g, 'eiwit_g', z.eiwit_g, 'vet_g', z.vet_g,
               'koolhydraat_g', z.koolhydraten_g, 'vezel_g', z.vezels_g,
               'benadering', z.benadering))
      from kal_nevo_zoek(p_q, least(coalesce(p_limiet, 25), 50)) z), '[]'::jsonb),

    -- DE GERECHTEN, MET TWEE DINGEN ERBIJ
    --
    -- Ten eerste: `names` wordt nu meegezocht. Die kolom staat er vanaf het
    -- begin — alternatieve namen per taal, met sleutels nl, darija_lat,
    -- darija_ar, tarifit_lat, ar, tr en srn — en werd door het zoeken
    -- doodleuk overgeslagen. Wie zijn eten in het Darija of het Turks noemt
    -- vond niets, terwijl het antwoord al in de rij stond. Dat is geen nieuwe
    -- inhoud maar inhoud die er lag en niet bereikbaar was.
    --
    -- Ten tweede: dezelfde terugval als bij NEVO, en om dezelfde reden alleen
    -- op het skelet. De trigram-zeef haalde hier net zo goed onzin binnen.
    -- `jsonb_agg` geeft NULL bij een lege verzameling, dus een `coalesce` met
    -- drie takken doet precies wat er nodig is — de tweede tak wordt alleen
    -- berekend als de eerste niets opleverde, en de derde alleen als beide
    -- niets gaven.
    'gerechten', coalesce(
      (select jsonb_agg(jsonb_build_object(
               'id', d.id, 'naam', d.name_nl, 'keuken', d.cuisine,
               'omschrijving', d.description_nl, 'porties', d.default_servings,
               'status', d.validation_status))
       from (select * from cultural_dishes
              where owner_patient_id is null
                and (select bool_and(lower(coalesce(name_nl,'') || ' ' ||
                                           coalesce(description_nl,'') || ' ' ||
                                           coalesce(cuisine,'') || ' ' ||
                                           coalesce((select string_agg(t.value, ' ')
                                                       from jsonb_each_text(names) t), ''))
                                     like '%' || w || '%')
                       from unnest(v_w) w)
              order by length(coalesce(name_nl,'')) limit 15) d),
      (select jsonb_agg(jsonb_build_object(
               'id', d.id, 'naam', d.name_nl, 'keuken', d.cuisine,
               'omschrijving', d.description_nl, 'porties', d.default_servings,
               'status', d.validation_status))
       from (select d.* from cultural_dishes d
              where d.owner_patient_id is null
                and exists (
                  select 1
                    from unnest(v_w) w,
                         unnest(string_to_array(
                           regexp_replace(
                             lower(coalesce(d.name_nl,'') || ' ' ||
                                   coalesce((select string_agg(t.value, ' ')
                                               from jsonb_each_text(d.names) t), '')),
                             '[^a-zà-ÿ0-9 ]', ' ', 'g'), ' ')) as nw
                   where length(nw) >= 4
                     and length(kal_woordskelet(w)) >= 3
                     and kal_woordskelet(w) = kal_woordskelet(nw))
              order by length(coalesce(d.name_nl,'')) limit 15) d),
      '[]'::jsonb),

    'eigen', coalesce((
      select jsonb_agg(to_jsonb(x))
      from (select * from kal_producten
             where gebruiker_id = v_id
               and (select bool_and(lower(naam) like '%' || w || '%') from unnest(v_w) w)
             order by length(naam) limit 15) x), '[]'::jsonb),

    -- Merkproducten uit `merk_actief`, dus achter de licentiepoort. Staat er
    -- geen actieve bron met gecontroleerde licentie, dan is deze emmer leeg en
    -- merkt de app er niets van. Zie 18-merkproducten.sql.
    --
    -- Onderaan en niet bovenaan: een etiketwaarde is een opgave van de fabrikant
    -- en geen laboratoriumbepaling. Wat gemeten is hoort eerst te staan.
    'merk', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', x.id, 'barcode', x.barcode, 'naam', x.naam, 'merk', x.merk,
               'groep', x.groep, 'kcal', x.energie_kcal_per_100g,
               'eiwit_g', x.eiwit_g, 'vet_g', x.vet_g,
               'koolhydraat_g', x.koolhydraten_g, 'vezel_g', x.vezels_g,
               'verpakking_gram', x.verpakking_gram,
               'portie_gram', x.portie_gram, 'portie_naam', x.portie_naam))
      from (select * from merk_actief m
             where (select bool_and(
                      lower(m.naam || ' ' || coalesce(m.merk,'') || ' '
                            || coalesce(array_to_string(m.synoniemen, ' '), ''))
                      like '%' || w || '%')
                    from unnest(v_w) w)
             order by length(m.naam) limit 15) x), '[]'::jsonb)
  );
end $function$
;

-- ---------------------------------------------------------------------------
-- BLOK 2 — DE SYNONIEMEN OPNIEUW, NU DE ZEEF STRENGER IS
-- ---------------------------------------------------------------------------
--
-- Dezelfde lijst als in bestand 20, met twee toevoegingen: `%kebab%` naast
-- `%döner%`, want in de eerste ronde vond "doner" alleen ruis en bleef de
-- koppeling dus liggen, en `%shoarma%` doet nu wél wat.
--
-- Zelfsnoeiend: een woord wordt alleen toegevoegd als het nú niets vindt. Wat
-- het skelet zelf oplost (koeskoes, felafel, lasagna, bulgar, tagliatelli)
-- wordt overgeslagen. Herhaalbaar; twee keer draaien verandert niets meer.

update nevo_foods f
   set synoniemen_afgeleid = f.synoniemen_afgeleid || nieuw.erbij
from (
  select b.id, array_agg(distinct p.woord) as erbij
    from nevo_foods b
    join (values
       ('koeskoes',      '%couscous%'),
       ('kuskus',        '%couscous%'),
       ('tagine',        '%tajine%'),
       ('harira',        '%marokkaanse soep%'),
       ('houmous',       '%hummus%'),
       ('humus',         '%hummus%'),
       ('kikkererwtenspread', '%hummus%'),
       ('felafel',       '%falafel%'),
       ('sjoarma',       '%shoarma%'),
       ('shawarma',      '%shoarma%'),
       ('doner',         '%döner%'),
       ('doner',         '%kebab%'),
       ('pide',          '%turks brood%'),
       ('bulgar',        '%bulgur%'),
       ('roti',          '%roti%'),
       ('nasi',          '%nasi%'),
       ('bami',          '%bami%'),
       ('ketjap',        '%ketjap%'),
       ('lasagna',       '%lasagne%'),
       ('tagliatelli',   '%tagliatelle%'),
       ('kwarktaart',    '%kwark%taart%')
     ) as p(woord, patroon)
      on b.naam_nl ilike p.patroon
   where not (p.woord = any(b.synoniemen_afgeleid))
     and (select count(*) from kal_nevo_zoek(p.woord, 5)) = 0
   group by b.id
) as nieuw
where f.id = nieuw.id;


-- ---------------------------------------------------------------------------
-- BLOK 3 — NAKIJKEN, EN NU WÉL NAAR DE RIJEN
-- ---------------------------------------------------------------------------

-- 1. De vier controlewoorden. Ongeschonden: mayonaise 4 · halfvolle melk 20 ·
--    halvarine 19 · tonijn 6.
select 'mayonaise' as term, count(*) from kal_nevo_zoek('mayonaise', 20)
union all select 'halfvolle melk', count(*) from kal_nevo_zoek('halfvolle melk', 20)
union all select 'halvarine',      count(*) from kal_nevo_zoek('halvarine', 20)
union all select 'tonijn',         count(*) from kal_nevo_zoek('tonijn', 20);

-- 2. De schrijffouten. Alle boven nul, en de eerste treffer hoort te zijn wat er
--    bedoeld werd.
select w as term, (select count(*) from kal_nevo_zoek(w, 8)) as treffers,
       (select naam_nl from kal_nevo_zoek(w, 8) limit 1) as eerste
from unnest(array['lesagna','spagetti','komkomer','yoghurd','havermoud',
                  'bannaan','papprika','brocoli','broot','gekokt']) w
order by treffers, w;

-- 3. DE BELANGRIJKSTE. Deze twee gaven de ruis, en horen nu leeg te zijn of het
--    goede product te geven — geen haring en geen donut. Kijk naar de námen,
--    niet naar het aantal. Dat was de fout in bestand 20.
select 'harira' as term, naam_nl, groep, benadering from kal_nevo_zoek('harira', 8)
union all
select 'doner', naam_nl, groep, benadering from kal_nevo_zoek('doner', 8);

-- 4. Onzin blijft onzin.
select w as onzin, (select count(*) from kal_nevo_zoek(w, 8)) as hoort_nul_te_zijn
from unnest(array['xyzzy','qwertyuiop','zzzzz','mercimek']) w;

-- 5. En de andere namen. Alle boven nul; of dat via het skelet of via een
--    synoniem gaat maakt voor het scherm niets uit.
select w as term, (select count(*) from kal_nevo_zoek(w, 8)) as vindt_nu,
       (select count(*) from nevo_foods where w = any(synoniemen_afgeleid)) as als_synoniem
from unnest(array['koeskoes','kuskus','tagine','houmous','felafel','sjoarma',
                  'shawarma','doner','pide','bulgar','roti','nasi','bami',
                  'ketjap','lasagna','tagliatelli','kwarktaart']) w
order by vindt_nu, w;

-- Terugdraaien: draai de twee functies opnieuw uit bestand 20. De synoniemen uit
-- blok 2 mogen blijven staan; die doen geen kwaad.
