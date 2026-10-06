-- ===========================================================================
-- DE CONCEPTGERECHTEN UITLEZEN, VOOR DE WACHTRIJ VAN PROVITA
-- ===========================================================================
--
-- Geen nummer, net als controle-md5.sql: dit is geen verslag maar een vraag.
-- Het verandert niets. Plak het in de SQL-editor van dit project, kopieer de
-- ene waarde die eruit komt naar een bestand (bijvoorbeeld
-- conceptgerechten.json), en lees dat in op /admin/voeding/validatie in
-- ProVita, onder "Voorstellen uit BennaHealth".
--
-- WAT ER UITKOMT
--
-- Alle bibliotheekgerechten met validation_status 'concept' (de modelvoorstellen
-- uit de bestanden 24, 25 en 27, kwaliteit D), met hun ingrediënten en porties.
-- Nooit een persoonlijke variant: owner_patient_id moet leeg zijn.
--
-- WAAROM EEN BESTAND EN GEEN KOPPELING
--
-- Omdat deze gerechten aan de ProVita-kant door een diëtist moeten. Een
-- koppeling die ze vanzelf overzet, zet ze voor een patiënt neer voordat
-- iemand ze heeft gezien. Met een bestand zit er een mens tussen, en daarna
-- nog een: wie inleest, en wie overneemt. Zie in provita-care
-- supabase/migrations/20261006_bibliotheek_voorstellen.sql.
-- ===========================================================================

select jsonb_build_object(
  'bron', 'bennahealth',
  'uitgelezen_op', now(),
  'gerechten', coalesce(jsonb_agg(g order by g->>'slug'), '[]'::jsonb)
) as conceptgerechten
from (
  select to_jsonb(d) - 'id' - 'owner_patient_id' - 'derived_from_dish_id'
                     - 'reviewed_by_clinician_id' - 'created_by'
         || jsonb_build_object(
              'ingredienten', coalesce((
                select jsonb_agg(to_jsonb(i) - 'id' - 'dish_id' order by i.position)
                  from dish_ingredients i where i.dish_id = d.id), '[]'::jsonb),
              'porties', coalesce((
                select jsonb_agg(to_jsonb(p) - 'id' - 'dish_id' order by p.sort_order)
                  from dish_portions p where p.dish_id = d.id), '[]'::jsonb)
            ) as g
    from cultural_dishes d
   where d.validation_status = 'concept'
     and d.owner_patient_id is null
) t;
