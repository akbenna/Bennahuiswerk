-- ===========================================================================
-- A2. "PASTA" MOET OOK MACARONI VINDEN
-- ===========================================================================
--
-- Nog niet toegepast. Losse aanvulling op A-synoniemen.sql.
--
-- WAT ER GEBEURDE
--
-- In A-synoniemen.sql stond `pasta` als synoniem voor macaroni en spaghetti,
-- met daarbij een voorwaarde die zichzelf zou snoeien: voeg het woord alleen toe
-- als het nú niets vindt. Dat leek slim en was hier verkeerd.
--
-- "pasta" vindt namelijk al van alles, alleen niet wat je bedoelt:
--
--     Pasta speculoos-          speculoospasta, een smeersel
--     Pasta chocolade- melk     chocoladepasta, een smeersel
--     Pasta kruiden-/boemboe    kruidenpasta, een specerij
--     Pasta witte rauw          dit is wél pasta
--     Pasta volkoren rauw       dit ook
--
-- In het Nederlands is "pasta" twee woorden die toevallig hetzelfde geschreven
-- worden. NEVO gebruikt allebei. De zelfsnoei zag "vijf treffers, dus geen gat"
-- en sloeg het woord over — terwijl macaroni en spaghetti er nog steeds niet bij
-- zaten.
--
-- Dat is de grens van die automatische controle: hij telt treffers, hij leest ze
-- niet. Wat hij niet kan zien is dat de treffers de verkeerde zijn. Daar is de
-- kolom `voorbeeld` in blok 1 voor, en daar moet een mens naar kijken.
--
-- WAT DIT DOET
--
-- Hetzelfde als blok 2 van A, maar zonder die voorwaarde, en alleen voor pasta.
-- Na afloop geeft "pasta" zowel de smeersels als de macaroni. Dat is geen
-- vervuiling maar de waarheid: het woord betekent in het Nederlands allebei, en
-- de app hoort niet te kiezen welke jij bedoelde.


-- ---------------------------------------------------------------------------
-- BLOK 1 — VOOR. Verandert niets.
-- ---------------------------------------------------------------------------

select 'voor' as wanneer, nevo_code, naam_nl, groep from kal_nevo_zoek('pasta', 20);
select count(*) as macaroni_en_spaghetti_in_de_tabel
from nevo_actief
where naam_nl ilike '%macaroni%' or naam_nl ilike '%spaghetti%'
   or naam_nl ilike '%penne%' or naam_nl ilike '%tagliatelle%' or naam_nl ilike '%fusilli%';


-- ---------------------------------------------------------------------------
-- BLOK 2 — HET WOORD ERBIJ
-- ---------------------------------------------------------------------------
--
-- Per product verzameld en in één keer toegevoegd, om dezelfde reden als in A:
-- `update ... from` werkt elke doelrij maar één keer bij, en een product dat
-- zowel op '%macaroni%' als op iets anders past zou anders maar één woord
-- krijgen. Hier is dat één woord, maar de vorm blijft goed.

update nevo_foods f
   set synoniemen_afgeleid = f.synoniemen_afgeleid || nieuw.erbij
from (
  select b.id, array_agg(distinct p.woord) as erbij
    from nevo_foods b
    join (values
       ('pasta', '%macaroni%'),
       ('pasta', '%spaghetti%'),
       ('pasta', '%penne%'),
       ('pasta', '%tagliatelle%'),
       ('pasta', '%fusilli%')
     ) as p(woord, patroon)
      on b.naam_nl ilike p.patroon
   where not (p.woord = any(b.synoniemen_afgeleid))
   group by b.id
) as nieuw
where f.id = nieuw.id;


-- ---------------------------------------------------------------------------
-- BLOK 3 — NA
-- ---------------------------------------------------------------------------
--
-- Er hoort nu allebei in te staan. Staat de macaroni onderaan, dan is dat de
-- weging die zijn werk doet: de smeersels dragen het woord in hun naam en dat
-- weegt zwaarder dan een synoniem. Ze staan er wel bij, en dat was het doel.

select 'na' as wanneer, nevo_code, naam_nl, groep from kal_nevo_zoek('pasta', 20);

-- Terugdraaien:
-- update nevo_foods set synoniemen_afgeleid = array_remove(synoniemen_afgeleid, 'pasta')
--  where 'pasta' = any(synoniemen_afgeleid);
