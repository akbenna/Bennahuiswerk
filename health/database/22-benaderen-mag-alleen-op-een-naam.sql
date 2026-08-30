-- =============================================================================
-- BENADEREN MAG ALLEEN OP EEN NAAM
--
-- Nog niet toegepast. Eén regel uit bestand 21, strakker gezet.
--
-- WAT ER OVERBLEEF NA BESTAND 21
--
-- Zeventien woorden nagelopen, zestien goed. Deze bleef staan:
--
--     zoeken op "doner"  ->  Pepermunt      (benadering = true)
--
-- De herkomst is te volgen. NEVO zet bij Pepermunt in `synoniem_nevo` de tekst
-- "Tic-tac mint, after dinner mints"; de afgeleide synoniemen maken daar onder
-- meer "after", "dinner" en "mints" van. Het skelet van "dinner" is `tnr`, en
-- dat van "doner" ook.
--
-- En het is erger dan een verkeerde treffer, want er ís geen goede treffer:
-- nagezocht op '%kebab%', '%doner%', '%döner%' en '%gyros%' in de Nederlandse en
-- de Engelse namen kent NEVO precies twee producten uit die hoek, allebei
-- "Shoarmavlees varkens-". Het juiste antwoord op "doner" is nul.
--
-- DE REGEL
--
-- Niet "pepermunt uitzonderen" — dat is een pleister, en morgen staat er een
-- ander woord. De regel is: **benaderen mag alleen op wat NEVO zelf een naam
-- noemt**, dus `naam_nl` en `naam_en`. Niet op de synoniemenvelden, want die
-- bevatten losse woorden en zelfs plaksels als "mintsdinnerafterminttic-tac".
-- Een benadering bovenop een synoniem dat zelf al een benadering is, is twee
-- keer raden.
--
-- WAT HET KOST
--
-- Niets dat gemeten is. Elk woord dat na bestand 21 werkte — lesagna, spagetti,
-- komkomer, yoghurd, havermoud, bannaan, papprika, brocoli, broot, koeskoes,
-- felafel, lasagna, bulgar, tagliatelli — vindt zijn treffer in `naam_nl` of
-- `naam_en`. En wat alleen via een synoniem te vinden is (sjoarma, shawarma,
-- houmous, roti, nasi, bami, ketjap, pide, kwarktaart) gaat via het gewone
-- woordzoeken, en dat leest alle velden gewoon door.
--
-- HOE HET GETOETST IS
--
-- Met een mutatieproef op een plaatselijke Postgres: "Tic-tac mint, after
-- dinner mints" als synoniem op Mayonaise geplakt, en toen gezocht op "tener"
-- (skelet `tnr`, staat in geen enkele naam).
--
--     oude versie, op alle velden   ->  Mayonaise [benadering]
--     nieuwe versie, alleen namen   ->  niets
--
-- Alleen `kal_nevo_zoek` verandert. De gerechtenbibliotheek blijft zoals hij is:
-- `cultural_dishes.names` bevat echte namen in andere talen en geen woordenbrij.
-- =============================================================================


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
           -- Alleen de namen, voor de terugval hieronder. Zie het commentaar daar.
           lower(n.naam_nl || ' ' || coalesce(n.naam_en,'')) as namen,
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
  -- DE TERUGVAL — OP DE NAMEN, EN OP NIETS ANDERS
  --
  -- Waarom `b.namen` en niet `b.tekst`: `tekst` bevat ook de synoniemenvelden,
  -- en daar staat losse woordenbrij in. NEVO zet bij Pepermunt in
  -- `synoniem_nevo` de tekst "Tic-tac mint, after dinner mints", en de afgeleide
  -- synoniemen maken daar onder meer "after", "dinner", "mints" en
  -- "mintsdinnerafterminttic-tac" van.
  --
  -- "dinner" heeft skelet `tnr`, net als "doner". Dus wie shoarma zocht en
  -- "doner" typte kreeg Pepermunt. En dat terwijl NEVO helemaal geen döner of
  -- kebab kent — nagezocht in de Nederlandse én de Engelse namen: er zijn twee
  -- shoarmaproducten en verder niets. Het goede antwoord op "doner" is nul.
  --
  -- De regel die daaruit volgt is niet "pepermunt uitzonderen" maar: benaderen
  -- mag alleen op wat NEVO zelf een náám noemt. Een benadering bovenop een
  -- synoniem dat zelf al een benadering is, is twee keer raden. Het gewone
  -- woordzoeken hierboven leest alle velden gewoon door, dus wat alleen via een
  -- synoniem te vinden is (sjoarma, roti, nasi, ketjap) verandert niet.
  --
  -- DE MAAT ZELF, NA METING HERZIEN
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
             regexp_replace(b.namen, '[^a-zà-ÿ0-9 ]', ' ', 'g'), ' ')) as nw
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

-- ---------------------------------------------------------------------------
-- NAKIJKEN
-- ---------------------------------------------------------------------------

-- 1. De controlewoorden. Ongeschonden: mayonaise 4 · halfvolle melk 20 ·
--    halvarine 19 · tonijn 6.
select 'mayonaise' as term, count(*) from kal_nevo_zoek('mayonaise', 20)
union all select 'halfvolle melk', count(*) from kal_nevo_zoek('halfvolle melk', 20)
union all select 'halvarine',      count(*) from kal_nevo_zoek('halvarine', 20)
union all select 'tonijn',         count(*) from kal_nevo_zoek('tonijn', 20);

-- 2. Waar het om ging. Hier hoort niets te staan — geen pepermunt, en ook niets
--    anders, want NEVO kent geen döner.
select naam_nl, groep, benadering from kal_nevo_zoek('doner', 8);

-- 3. En dat de rest ongeschonden is. Alle acht een treffer, de laatste twee leeg.
select w as term, (select naam_nl from kal_nevo_zoek(w, 8) limit 1) as eerste
from unnest(array['lesagna','spagetti','komkomer','yoghurd','havermoud',
                  'bannaan','papprika','brocoli','broot','koeskoes','felafel',
                  'harira','xyzzy','qwertyuiop']) w;

-- 4. En de synoniemen, die via het gewone zoeken moeten blijven werken.
select w as term, (select count(*) from kal_nevo_zoek(w, 8)) as treffers
from unnest(array['sjoarma','shawarma','houmous','roti','nasi','bami',
                  'ketjap','pide','kwarktaart']) w
order by treffers, w;

-- Terugdraaien: draai `kal_nevo_zoek` opnieuw uit bestand 21.
