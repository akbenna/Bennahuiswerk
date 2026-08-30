-- =============================================================================
-- ZOEKEN MET ALTERNATIEVEN — één letter verkeerd mag geen leeg scherm geven
--
-- Nog niet toegepast.
--
-- DE AANLEIDING
--
-- "Lesagna" gaf nul resultaten. Lasagne staat gewoon in de tabel:
--
--     1491  Lasagne bolognese koelverse maaltijd   162 kcal
--     5458  Lasagne groenten- koelverse maaltijd   112 kcal
--
-- Eén letter verkeerd, en het scherm blijft leeg. Dat komt door de zoekregel
-- zelf: woorden van vijf letters of meer worden letterlijk als tekenreeks
-- gezocht (`position(w in tekst) > 0`), en "lesagna" staat nergens. Voor een
-- volwassene die twijfelt is dat vervelend; voor een kind dat zijn eten intypt
-- is het de gewoonste manier om niets te vinden en op te geven.
--
-- WAT ER GEMETEN IS, VOORDAT ER IETS GESCHREVEN WERD
--
-- Op een plaatselijke Postgres met dezelfde functie en een nagebouwde tabel.
-- Eerst de voor de hand liggende aanpak: trigram-gelijkenis op de hele naam.
--
--     word_similarity('lesagna', 'lasagne bolognese koelverse maaltijd') = 0,27
--     word_similarity('lesagna', 'mayonaise')                           = 0,00
--
-- Dat scheidt wel, maar 0,27 ligt te dicht bij de ruisgrens om er een drempel
-- op te durven zetten. Per wóórd meten is veel scherper:
--
--     woord tegen woord      similarity   word_similarity
--     brocoli   broccoli        0,70          0,70
--     komkomer  komkommer       0,70          0,70
--     bannaan   banaan          0,67          0,67
--     havermoud havermout       0,67          0,80
--     yoghurd   yoghurt         0,60          0,75
--     appl      appel           0,38          0,60
--     spagetti  spaghetti       0,58          0,58
--     lesagna   lasagne         0,23          0,27   <-- valt er nog steeds door
--
-- `word_similarity` is over de hele linie ruimer dan `similarity` en dat is hier
-- precies goed, dus die is het geworden. Maar "lesagna" blijft eronder, en juist
-- dat was de klacht. Trigrammen kunnen dat geval ook niet: lasagne -> lesagna
-- verwisselt twee klinkers, en dan is er van de negen trigrammen nog maar een
-- handvol heel.
--
-- DE TWEEDE MAAT: HET MEDEKLINKERSKELET
--
-- Wat blijft er van een woord over als je alleen houdt wat het hóórbaar maakt?
-- Accenten weg, dubbele letters samen, verwante medeklinkers gelijkgetrokken
-- (c->k, d->t, j->g, v->f, x->ks-achtig, z->s), klinkers en de h eruit.
--
--     lasagne  -> lsgn        lesagna   -> lsgn        gelijk
--     spaghetti-> spgt        spagetti  -> spgt        gelijk
--     komkommer-> kmkmr       komkomer  -> kmkmr       gelijk
--     couscous -> ksks        koeskoes  -> ksks        gelijk
--     tajine   -> tgn         tagine    -> tgn         gelijk
--     falafel  -> flfl        falaffel  -> flfl        gelijk
--     mayonaise-> mns         mayonnaise-> mns         gelijk
--
-- Dat is geen bibliotheek en geen extensie; het zijn twee `translate`s en twee
-- `regexp_replace`s. Klinkerfouten en verdubbelingen zijn in het Nederlands de
-- meest voorkomende schrijffout, en dit vangt ze allemaal in één regel.
--
-- Waar hij misgaat is bij korte woorden: "appel" wordt "pl" en "brood" en
-- "braad" worden allebei "brt". Vandaar de eis dat het skelet minstens drie
-- letters telt. Wat daar doorheen valt vangt de trigram op: "appl" tegen "appel"
-- is 0,60 en komt er langs die kant alsnog in.
--
-- De twee maten falen dus op verschillende plekken, en dat is de reden om ze
-- allebei te nemen in plaats van de beste te kiezen.
--
-- WANNEER HIJ DRAAIT — EN WAAROM DAT DE HELE VEILIGHEID IS
--
-- Alleen als het gewone woordzoeken niets vond. Een benadering hoort nooit een
-- echte treffer te verdringen: wie "mayonaise" typt krijgt exact wat hij nu
-- krijgt, in exact dezelfde volgorde. Gemeten op een nagebouwde tabel van 2464
-- rijen: een vraag mét treffers kost 83 ms (ongewijzigd), een vraag zonder
-- treffers 210-270 ms. Die driehonderd milliseconde betaal je alleen op het
-- scherm dat anders leeg was gebleven.
--
-- WAT DE PROEF OPLEVERDE
--
--     lesagna    -> Lasagne bolognese, Lasagne groenten-
--     spagetti   -> Spaghetti bolognese m kaas
--     komkomer   -> Komkommer rauw
--     yoghurd    -> Yoghurt magere
--     havermoud  -> Havermout ongekookt
--     appl       -> Appel rauw
--     bannaan    -> Banaan rauw
--     papprika   -> Paprika rood rauw
--     tonyn      -> Tonijn in water
--     koeskoes   -> Couscous gekookt
--     tagine     -> Tajine kip Marokkaans
--     felafel    -> Falafel gefrituurd
--     sjoarma    -> Shoarma vlees bereid
--
-- En wat leeg hoorde te blijven, bleef leeg: xyzzy, qwertyuiop, zzz. Ook "kase"
-- en "ryst" vonden niets — de terugval is geen spellingcorrector en doet niet
-- alsof.
--
-- De vier controlewoorden uit bestand 12 zijn ongeschonden: mayonaise,
-- halfvolle melk, halvarine en tonijn geven wat ze gaven.
--
-- DE PROEF IS ZELF GETOETST
--
-- Drie mutanten losgelaten op de functie, om te zien of blok 6 ze vangt:
--
--   drempel 0,5 -> 0,0            "xyzzy" gaf ineens acht producten   gevangen (6.4)
--   het `not exists`-slot eruit   mayonaise 2 -> 4, tonijn 1 -> 2      gevangen (6.1)
--   lengte-eis 4 -> 1             geen enkele uitslag veranderde       niet gevangen
--
-- Die derde is geen gat in de proef maar een eis die niets tegenhoudt; zie de
-- opmerking erbij in blok 2. Hij blijft staan, maar dan wel met die uitleg erbij
-- in plaats van met de suggestie dat hij nodig is.
--
-- WAAR DEZE TEKST VANDAAN KOMT
--
-- `kal_nevo_zoek` is niet overgetypt maar uit bestand 12 overgenomen, want dáár
-- staat de laatste versie met de telwoorden erin. Uit `schema-gegenereerd.sql`
-- knippen zou die correctie stilletjes terugdraaien. De eindselect is verplaatst
-- naar een CTE `treffers`, met de drie rangschikkingskolommen als kolom in de
-- rij, zodat de terugval eronder geplakt kan worden zonder dat de volgorde
-- verloren gaat. Verder is er niets aan veranderd.
--
-- `kal_zoeken` is om dezelfde reden uit bestand 18 overgenomen — dat is de versie
-- mét de merkemmer. Er verandert daar twee dingen. De nevo-emmer krijgt de
-- sleutel `benadering` mee, zodat het scherm kan zeggen dat het een benadering
-- toont. En de gerechtenemmer krijgt de kolom `names` erbij plus dezelfde
-- terugval; zie het commentaar daar. De rest is onaangeroerd.
--
-- WAT ER ONDERWEG BOVENKWAM EN NIET SPANNEND KLINKT
--
-- `cultural_dishes.names` bestaat vanaf het begin: alternatieve namen per taal,
-- met sleutels nl, darija_lat, darija_ar, tarifit_lat, ar, tr en srn. Het zoeken
-- keek er nooit in. Wie zijn eten in het Darija, het Turks of het Sranan noemt
-- vond dus niets, terwijl het antwoord in dezelfde rij stond. Op een nagebouwde
-- bibliotheek vindt "mercimek" nu de Turkse linzensoep, en "hariera",
-- "msemmene" en "tazjine" komen via de terugval bij Harira, Msemen en de
-- tajine uit — "qqqqqq" bij niets.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- BLOK 1 — HET MEDEKLINKERSKELET
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.kal_woordskelet(w text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE STRICT PARALLEL SAFE
 SET search_path TO 'public'
AS $function$
  -- Van binnen naar buiten: accenten weg, dan dubbele letters samen, dan
  -- verwante medeklinkers gelijk, dan klinkers en de h eruit. De volgorde doet
  -- ertoe: dubbele letters eerst samentrekken en pas daarna de klinkers weghalen,
  -- anders wordt "banaan" -> "bnn" -> "bn" en valt hij door de lengte-eis.
  select regexp_replace(
           translate(
             regexp_replace(
               translate(lower(w),
                 'áàâäãåéèêëíìîïóòôöõúùûüýÿçñ', 'aaaaaaeeeeiiiiooooouuuuyycn'),
               '(.)\1+', '\1', 'g'),
             'cdjqvxz', 'ktgkfks'),
           '[aeiouyh]', '', 'g')
$function$
;

comment on function public.kal_woordskelet(text) is
  'Medeklinkerskelet van een woord, voor het herkennen van schrijfvarianten. lasagne en lesagna geven allebei lsgn.';


-- ---------------------------------------------------------------------------
-- BLOK 2 — HET ZOEKEN, MET DE TERUGVAL ERONDER
-- ---------------------------------------------------------------------------

-- De uitvoer krijgt er een kolom bij, en daar is `create or replace` niet genoeg
-- voor: Postgres laat het type van een teruggegeven tabel niet wijzigen. Dus
-- eerst weg, dan opnieuw. De rechten komen terug op de standaard (execute voor
-- public), en dat is precies wat hij had — er staat nergens een grant of revoke
-- op deze functie.
drop function if exists public.kal_nevo_zoek(text, integer);

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
  -- DE TERUGVAL. Twee maten naast elkaar, want ze falen op verschillende plekken:
  -- het skelet vangt klinkerfouten en verdubbelingen, de trigram vangt
  -- weggevallen en omgewisselde letters. Beide per woord, niet op de hele naam:
  -- "lesagna" tegen "lasagne bolognese koelverse maaltijd" haalt 0,27 en zakt
  -- door elke drempel die ruis buiten houdt.
  --
  -- 0,75 voor een gelijk skelet is geen gemeten getal maar een keuze: hoger dan
  -- de drempel zodat hij telt, lager dan een echte trigram-treffer zodat die
  -- bovenaan blijft staan.
  --
  -- Woorden korter dan vier letters doen niet mee, aan geen van beide kanten.
  -- Eerlijk gezegd: dat is een voorzorg waar ik geen falend geval bij heb kunnen
  -- vinden. De mutatieproef (deze eis verlaagd naar >= 1) veranderde geen enkele
  -- uitslag — korte woorden worden hierboven al op woordbegin gezocht, en hun
  -- skelet is te kort voor de lengte-eis van drie. Hij staat er als grens voor
  -- wat er niet doorheen hoort, niet omdat hij nu iets tegenhoudt.
  benadering as (
    select b.nevo_code, b.naam_nl, b.groep, b.energie_kcal_per_100g,
           b.eiwit_g, b.vet_g, b.koolhydraten_g, b.vezels_g,
           9 as trede,                      -- altijd achter elke echte trede
           1 - max(m.gelijkenis) as afstand,
           length(b.naam_nl) as lengte,
           -- Deze vlag gaat mee naar het scherm. Zonder hem zou de app een
           -- benadering tonen alsof het een treffer was, en dat is dezelfde
           -- soort stilzwijgen als een getal zonder zijn onzekerheid.
           true as benadering
    from bron b
    join lateral (
      select greatest(
               case when length(kal_woordskelet(w.w)) >= 3
                     and kal_woordskelet(w.w) = kal_woordskelet(nw)
                    then 0.75 else 0 end,
               extensions.word_similarity(w.w, nw)) as gelijkenis
      from woorden w,
           unnest(string_to_array(
             regexp_replace(b.tekst, '[^a-zà-ÿ0-9 ]', ' ', 'g'), ' ')) as nw
      where length(nw) >= 4 and length(w.w) >= 4
    ) m on m.gelijkenis >= 0.5
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
-- BLOK 3 — DE VLAG DOORGEVEN AAN HET SCHERM
-- ---------------------------------------------------------------------------
--
-- `kal_zoeken` bouwt zijn eigen json op en noemt daarin elk veld apart, dus de
-- nieuwe kolom komt er niet vanzelf doorheen. Eén sleutel erbij, verder niets.
--
-- Deze tekst is overgenomen uit bestand 18 — dat is de laatste versie, met de
-- merkemmer erin. Uit `schema-gegenereerd.sql` knippen zou die emmer weggooien.

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
    -- Ten tweede: dezelfde terugval als bij NEVO. `jsonb_agg` geeft NULL bij
    -- een lege verzameling, dus een `coalesce` met drie takken doet precies
    -- wat er nodig is — de tweede tak wordt alleen berekend als de eerste
    -- niets opleverde, en de derde alleen als beide niets gaven.
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
                   where length(w) >= 4 and length(nw) >= 4
                     and ((length(kal_woordskelet(w)) >= 3
                           and kal_woordskelet(w) = kal_woordskelet(nw))
                          or extensions.word_similarity(w, nw) >= 0.5))
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
-- BLOK 4 — WAT DE TERUGVAL NIET KAN: EEN ANDERE NAAM VOOR HETZELFDE
-- ---------------------------------------------------------------------------
--
-- Een schrijfvariant vangt hij. Een ander wóórd niet: "koeskoes" en "couscous"
-- delen een skelet, "kikkererwtenpuree" en "hummus" delen niets. Daarvoor zijn
-- synoniemen nodig, net als in bestand 17.
--
-- Dit is bewust een korte lijst, en hij is zelfsnoeiend: een woord wordt alleen
-- toegevoegd als het nú niets vindt. Wat NEVO zelf al zo noemt slaat hij over.
--
-- Kijk eerst wat er gebeurt voordat je blok 5 draait. `raakt` is het aantal
-- producten dat het woord zou krijgen; alles boven de vijf is verdacht.

with paren as (
  select * from (values
     -- Marokkaans en Arabisch
     ('koeskoes',      '%couscous%'),
     ('kuskus',        '%couscous%'),
     ('tagine',        '%tajine%'),
     ('harira',        '%marokkaanse soep%'),
     ('houmous',       '%hummus%'),
     ('humus',         '%hummus%'),
     ('kikkererwtenspread', '%hummus%'),
     ('felafel',       '%falafel%'),
     -- Turks
     ('sjoarma',       '%shoarma%'),
     ('shawarma',      '%shoarma%'),
     ('doner',         '%döner%'),
     ('pide',          '%turks brood%'),
     ('bulgar',        '%bulgur%'),
     -- Surinaams en Indonesisch
     ('roti',          '%roti%'),
     ('bruine bonen',  '%bruine bonen%'),
     ('nasi',          '%nasi%'),
     ('bami',          '%bami%'),
     ('ketjap',        '%ketjap%'),
     -- Italiaans
     ('lasagna',       '%lasagne%'),
     ('tagliatelli',   '%tagliatelle%'),
     -- gewoon Nederlands, maar niet zoals NEVO het schrijft
     ('kwarktaart',    '%kwark%taart%'),
     ('aardappelpuree','%aardappelpuree%')
   ) as p(woord, patroon)
)
select p.woord, p.patroon,
       (select count(*) from kal_nevo_zoek(p.woord, 20))                    as vindt_nu,
       (select count(*) from nevo_actief n where n.naam_nl ilike p.patroon) as raakt,
       (select n.naam_nl from nevo_actief n
         where n.naam_nl ilike p.patroon order by length(n.naam_nl) limit 1) as voorbeeld
from paren p
order by vindt_nu, raakt desc, p.woord;


-- ---------------------------------------------------------------------------
-- BLOK 5 — DE KOPPELING
-- ---------------------------------------------------------------------------
--
-- Eerst per product verzamelen en dan één keer bijwerken, om dezelfde reden als
-- in bestand 17: Postgres werkt elke doelrij hoogstens één keer bij binnen één
-- opdracht, dus een gewone `update ... from (values ...)` zou van "houmous" en
-- "humus" er maar één toevoegen.
--
-- Herhaalbaar: een woord dat er al staat wordt niet nog eens toegevoegd, en na
-- afloop vindt het woord iets, dus grijpt de laatste voorwaarde niet meer.

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
-- BLOK 6 — NAKIJKEN
-- ---------------------------------------------------------------------------

-- 1. De vier controlewoorden uit bestand 12. Deze horen ongeschonden te zijn:
--    mayonaise 4 · halfvolle melk 20 · halvarine 19 · tonijn 6
select 'mayonaise' as term, count(*) from kal_nevo_zoek('mayonaise', 20)
union all select 'halfvolle melk', count(*) from kal_nevo_zoek('halfvolle melk', 20)
union all select 'halvarine',      count(*) from kal_nevo_zoek('halvarine', 20)
union all select 'tonijn',         count(*) from kal_nevo_zoek('tonijn', 20);

-- 2. En dat de telwoorden er nog in staan — anders is bestand 12 teruggedraaid.
select (regexp_match(prosrc, 'not in \(([^)]*)\)'))[1] ~ 'twee' as telwoorden_nog_aanwezig
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'kal_nevo_zoek';

-- 3. De verkeerd gespelde woorden. Deze horen alle boven nul te staan, en de
--    eerste treffer hoort te zijn wat er bedoeld werd.
select w as term, (select count(*) from kal_nevo_zoek(w, 8)) as treffers,
       (select naam_nl from kal_nevo_zoek(w, 8) limit 1) as eerste
from unnest(array['lesagna','spagetti','komkomer','yoghurd','havermoud',
                  'bannaan','papprika','tonyn','brocoli']) w
order by treffers, w;

-- 4. En wat leeg hoort te blijven. Alle drie nul. Vindt hij hier wél iets, dan
--    staat de drempel te laag en is elke uitslag verdacht.
select w as onzin, (select count(*) from kal_nevo_zoek(w, 8)) as hoort_nul_te_zijn
from unnest(array['xyzzy','qwertyuiop','zzzzz']) w;

-- 5. De andere namen uit blok 5.
select w as term, (select count(*) from kal_nevo_zoek(w, 8)) as treffers,
       (select naam_nl from kal_nevo_zoek(w, 8) limit 1) as eerste
from unnest(array['koeskoes','tagine','houmous','felafel','sjoarma','shawarma',
                  'nasi','bami','roti','lasagna']) w
order by treffers, w;

-- 6. En de vlag zelf: bij een echte treffer hoort hij overal false te zijn, bij
--    een benadering overal true. Staat er ergens een true bij "mayonaise", dan
--    verdringt de terugval echte treffers en klopt het slot niet meer.
select w as term,
       (select bool_or(benadering) from kal_nevo_zoek(w, 8)) as benadert
from unnest(array['mayonaise','tonijn','halvarine','lesagna','spagetti','koeskoes']) w;

-- 7. De gerechtenbibliotheek. Deze drie zeggen elk iets anders:
--    `nu` is wat het zoeken vandaag geeft, en voor de anderstalige namen hoort
--    dat nul te zijn — die kolom werd niet meegezocht. Na blok 3 hoort er iets
--    te staan. Vul hier gerust namen in die in jouw bibliotheek voorkomen; deze
--    zijn geraden op wat er in `names` pleegt te staan.
select w as term, jsonb_array_length(kal_zoeken(:'token', w, 10) -> 'gerechten') as gerechten
from unnest(array['tajine','tazjine','harira','hariera','msemen','msemmen',
                  'mercimek','roti','couscous']) w;

-- Terugdraaien: draai `kal_nevo_zoek` uit bestand 12 en `kal_zoeken` uit bestand
-- 18 opnieuw, en laat `kal_woordskelet` staan — die wordt dan door niets meer
-- aangeroepen en doet geen kwaad.
--
-- LET OP: blok 6 vraag 7 heeft een sessietoken nodig. Zet hem eerst:
--   \set token 'plak-hier-een-geldig-token'
-- of sla die ene vraag over; de andere zes werken zonder.
