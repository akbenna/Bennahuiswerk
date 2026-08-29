-- ===========================================================================
-- A. WOORDEN DIE JIJ GEBRUIKT EN NEVO NIET
-- ===========================================================================
--
-- Nog niet toegepast.
--
-- HET PATROON ACHTER DE GATEN
--
-- De zoekregel doet twee dingen. Woorden tot vier letters worden op woordbegin
-- gezocht; woorden van vijf letters of meer letterlijk, als tekenreeks. Dat
-- tweede is waar het misgaat, en het gaat systematisch mis:
--
--     jij typt          NEVO schrijft          waarom het misgaat
--     kipfilet          Kip filet              spatie ertussen
--     boterham          Tarwebrood bruin       heel ander woord
--     pasta             Macaroni ongekookt     heel ander woord
--     patat             Frites                 heel ander woord
--
-- Twee soorten dus. Samenstellingen die NEVO los schrijft, en huishoudwoorden
-- die nergens op lijken. Voor allebei is `synoniemen_afgeleid` de plek: geen
-- NEVO-gegeven maar iets van ons, dus het aanvullen tast de bron niet aan, en de
-- zoekfunctie kijkt er wel in mee.
--
-- WAAROM DIT VOORZICHTIG MOET
--
-- Een synoniem dat te ruim staat maakt het zoeken slechter, niet beter. Hang je
-- "pasta" aan alles met "saus" erin, dan komt bij "pasta" de pastasaus omhoog en
-- de macaroni niet. Daarom laat blok 1 eerst zien hoeveel producten elk patroon
-- zou raken. Een woord dat aan dertig producten hangt is geen synoniem meer maar
-- een categorie.


-- ---------------------------------------------------------------------------
-- BLOK 1 — WAT ELK WOORD NU DOET EN ZOU GAAN DOEN. Verandert niets.
-- ---------------------------------------------------------------------------
--
-- Drie kolommen om naar te kijken:
--
--   `vindt_nu`   staat dit op 0, dan is er een gat. Staat het boven 0, dan is
--                het woord al vindbaar en hoeft er niets bij.
--   `raakt`      hoeveel producten het patroon zou aanhaken. Eén tot een stuk of
--                acht is een synoniem. Boven de vijftien is het te ruim.
--   `voorbeeld`  de eerste treffer, om te zien of het het goede product is.

with paren as (
  select * from (values
     ('kipfilet',    '%kip%filet%'),
     ('kalkoenfilet','%kalkoen%filet%'),
     ('boterham',    '%brood%'),
     ('boterhammen', '%brood%'),
     ('pasta',       '%macaroni%'),
     ('pasta',       '%spaghetti%'),
     ('pasta',       '%penne%'),
     ('pasta',       '%tagliatelle%'),
     ('patat',       '%frites%'),
     ('friet',       '%frites%'),
     ('eieren',      '%ei kippen%'),
     ('pindakaas',   '%pinda%kaas%'),
     ('slagroom',    '%room slag%'),
     ('halfvol',     '%halfvolle%'),
     ('koffiemelk',  '%koffie%melk%'),
     ('sinaasappel', '%sinaasappel%')
   ) as p(woord, patroon)
)
select p.woord, p.patroon,
       (select count(*) from kal_nevo_zoek(p.woord, 20))               as vindt_nu,
       (select count(*) from nevo_actief n where n.naam_nl ilike p.patroon) as raakt,
       (select n.naam_nl from nevo_actief n
         where n.naam_nl ilike p.patroon order by length(n.naam_nl) limit 1) as voorbeeld
from paren p
order by vindt_nu, raakt desc, p.woord;


-- ---------------------------------------------------------------------------
-- BLOK 2 — DE KOPPELING
-- ---------------------------------------------------------------------------
--
-- Het snoeien gebeurt hier vanzelf. De laatste voorwaarde eist dat het woord nú
-- niets vindt: een synoniem toevoegen voor iets wat al vindbaar is voegt niets
-- toe behalve ruis, en op deze proefgegevens gold dat al voor "pindakaas",
-- "slagroom" en "koffiemelk" — NEVO schrijft die gewoon aan elkaar.
--
-- Dat `kal_nevo_zoek` STABLE is maakt dit veilig: hij kijkt naar de toestand aan
-- het begin van de opdracht, dus de drie patronen van "pasta" zien alle drie nog
-- een nul en worden alle drie toegepast.
--
-- Wat het NIET zelf kan snoeien is een patroon dat te veel producten raakt. Daar
-- is blok 1 voor, en daar moet je zelf naar kijken.
--
-- Herhaalbaar op twee manieren: een woord dat er al staat wordt niet nog eens
-- toegevoegd, en na afloop vindt het woord iets, dus grijpt de laatste
-- voorwaarde niet meer.

/* EERST VERZAMELEN, DAN ÉÉN KEER BIJWERKEN

   Dit stond eerst als een gewone `update ... from (values ...)`, en dat was
   fout. Postgres werkt elke doelrij hoogstens één keer bij binnen één opdracht,
   ook als er meerdere bronrijen op passen: "Tarwebrood wit" kreeg dan wel
   `boterham` óf `boterhammen`, niet allebei. Twee keer draaien vulde de rest
   aan, en dat is precies het soort fout dat je alleen ziet door twee keer te
   draaien — de eerste keer zag er goed uit.

   Nu worden de woorden per product eerst verzameld en dan in één keer
   toegevoegd. Eén doorloop is genoeg, en de tweede verandert niets meer. */
update nevo_foods f
   set synoniemen_afgeleid = f.synoniemen_afgeleid || nieuw.erbij
from (
  select b.id, array_agg(distinct p.woord) as erbij
    from nevo_foods b
    join (values
       ('kipfilet',    '%kip%filet%'),
       ('kalkoenfilet','%kalkoen%filet%'),
       ('boterham',    '%brood%'),
       ('boterhammen', '%brood%'),
       ('pasta',       '%macaroni%'),
       ('pasta',       '%spaghetti%'),
       ('pasta',       '%penne%'),
       ('pasta',       '%tagliatelle%'),
       ('patat',       '%frites%'),
       ('friet',       '%frites%'),
       ('eieren',      '%ei kippen%'),
       ('pindakaas',   '%pinda%kaas%'),
       ('slagroom',    '%room slag%'),
       ('koffiemelk',  '%koffie%melk%')
     ) as p(woord, patroon)
      on b.naam_nl ilike p.patroon
   where not (p.woord = any(b.synoniemen_afgeleid))
     and (select count(*) from kal_nevo_zoek(p.woord, 5)) = 0
   group by b.id
) as nieuw
where f.id = nieuw.id;


-- ---------------------------------------------------------------------------
-- BLOK 3 — NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- Elk woord hoort nu boven nul te staan. En de tweede vraag is de belangrijkste:
-- de dingen die al werkten moeten blijven werken. Een synoniem dat te ruim staat
-- verpest die eerst.

select w as woord, (select count(*) from kal_nevo_zoek(w, 20)) as treffers
from unnest(array['kipfilet','boterham','boterhammen','pasta','patat','friet',
                  'eieren','pindakaas','slagroom','koffiemelk']) w
order by treffers, w;

select w as woord, (select count(*) from kal_nevo_zoek(w, 20)) as treffers
from unnest(array['mayonaise','tonijn','halfvolle melk','halvarine','brood',
                  'kaas','rijst','appel']) w
order by treffers, w;

-- En waar "pasta" nu op uitkomt, als steekproef:
select nevo_code, naam_nl from kal_nevo_zoek('pasta', 10);

-- Terugdraaien, per woord:
-- update nevo_foods set synoniemen_afgeleid = array_remove(synoniemen_afgeleid, 'pasta')
--  where 'pasta' = any(synoniemen_afgeleid);
