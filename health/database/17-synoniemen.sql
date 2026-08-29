-- =============================================================================
-- SYNONIEMEN — woorden die jij gebruikt en NEVO niet
--
-- Toegepast 29 augustus 2026, in twee stappen.
--
-- HET PATROON ACHTER DE GATEN
--
-- De zoekregel doet twee dingen: woorden tot vier letters op woordbegin, woorden
-- van vijf letters of meer letterlijk als tekenreeks. Dat tweede gaat op twee
-- manieren mis. Samenstellingen die NEVO los schrijft — jij typt "kipfilet", er
-- staat "Kip filet". En huishoudwoorden die nergens op lijken: boterham tegen
-- Tarwebrood, patat tegen Frites.
--
-- WAT ER GEMETEN IS, NA AFLOOP
--
--     pindakaas 4    kipfilet 5    koffiemelk 5    eieren 9
--     friet 9        patat 9       slagroom 9      spaghetti 13
--     boterham 20    boterhammen 20               pasta 20
--
-- (20 is de limiet van de vraag, niet het aantal broden.)
--
-- DE ZELFSNOEI, EN WAAR HIJ OPHOUDT
--
-- Blok 2 voegt een woord alleen toe als het nú niets vindt. Dat scheelt handwerk:
-- pindakaas, slagroom en koffiemelk schrijft NEVO gewoon aan elkaar en die kregen
-- niets.
--
-- Maar hij telt treffers en leest ze niet, en daar liep het mis bij "pasta". Dat
-- woord vond al van alles — chocoladepasta, speculoospasta, kruidenpasta — want
-- in het Nederlands zijn dat twee woorden die hetzelfde geschreven worden. De
-- zelfsnoei zag treffers, zag geen gat, en sloeg het over.
--
-- Toen dacht ik dat macaroni ontbrak. Ook mis: er ís geen macaroni. NEVO noemt
-- álles "Pasta ...", tot "Manti gevulde pasta gekookt Turks" aan toe. Het gat zat
-- andersom — "spaghetti", "macaroni" en "penne" vonden niets, en dat zijn juist
-- de woorden die een kind gebruikt.
--
-- Blok 3 hangt die drie aan de pastaproducten, met de voorwaarde op de groep.
-- Zonder dat zou "Pasta chocolade- melk" een synoniem "spaghetti" krijgen. De
-- tegenproef na afloop: "spaghetti" geeft elf graanproducten, een bolognese en
-- een kruidenmix, en geen enkel smeersel.
-- =============================================================================


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
-- BLOK 3 — SPAGHETTI, MACARONI EN PENNE
-- ---------------------------------------------------------------------------
--
-- Alleen op de graangroep. Chocoladepasta en speculoospasta staan in "Suiker,
-- snoep, zoet beleg en zoete sauzen" en blijven ongemoeid.
--
-- Geen zelfsnoeiende voorwaarde meer zoals in A. Die telde treffers en las ze
-- niet, en juist dat ging bij "pasta" mis. Blok 1 is de controle, en die doe jij.

update nevo_foods f
   set synoniemen_afgeleid = f.synoniemen_afgeleid
                             || array['spaghetti','macaroni','penne','pastas']
 where f.naam_nl ilike '%pasta%'
   and f.groep = 'Graanproducten en meelsoorten'
   and not ('spaghetti' = any(f.synoniemen_afgeleid));


-- ---------------------------------------------------------------------------
-- NAKIJKEN
-- ---------------------------------------------------------------------------

select w as woord, (select count(*) from kal_nevo_zoek(w, 20)) as treffers
from unnest(array['kipfilet','boterham','boterhammen','patat','friet','eieren',
                  'pindakaas','slagroom','koffiemelk','spaghetti','macaroni',
                  'penne','pasta']) w
order by treffers, w;

-- De tegenproef die het meest waard is: hier hoort geen chocoladepasta te staan.
select nevo_code, naam_nl, groep from kal_nevo_zoek('spaghetti', 20);
