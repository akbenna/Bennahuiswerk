-- ===========================================================================
-- 42 — BEWEEGMINUTEN UIT EEN SCHERMAFDRUK
-- ===========================================================================
--
-- TOEGEPAST: nee. Tot dit bestand gedraaid is komt er van een work-outlijst
-- niets in de database terecht — zie "WAT ER NU GEBEURT" hieronder, dat is geen
-- halve werking maar helemaal geen.
--
-- WAAROM
--
-- Apple Gezondheid heeft onder "Work-outs" een lijst van posts: een duur, een
-- datum en de app die hem schreef. Dat is de enige plek waar beweegminuten
-- vandaan komen voor wie geen koppeling laat draaien, en het scherm Beweging
-- rekent er de WHO-norm van 150 minuten per week mee uit.
--
-- WAT ER NU GEBEURT
--
-- `kal_dagen_importeren` kent vier velden: datum, gewicht, stappen en actieve
-- energie. `fiets_min` staat wél in het type dat de app verstuurt
-- (`NieuweDag` in `src/gedeeld/db/rpc.ts`) maar niet in de insert. Postgres
-- klaagt daar niet over — een sleutel in een jsonb-object die niemand uitleest
-- verdwijnt geruisloos. De import zou dus melden dat er dagen zijn overgenomen
-- en de minuten onderweg laten vallen. Dat is het soort fout dat pas opvalt als
-- iemand er weken later achter komt dat zijn week leeg is.
--
-- WAT DIT BESTAND VERANDERT
--
-- Eén veld erbij, en verder niets. De functie wordt vervangen en geen rij
-- aangeraakt; functies zijn code, geen inhoud.
--
-- DE OMWEG VIA EEN VARIABELE, EN WAAROM HIJ NODIG IS
--
-- `kal_dagen.fiets_min` heeft `default 0`. Die standaard geldt alleen als de
-- kolom niet in de insertlijst staat — zet je hem er wél in met de waarde null,
-- dan wint die null. Een nieuwe dag uit een import zonder work-outs zou daarmee
-- van 0 naar null gaan. Dat leest de app weliswaar hetzelfde (overal `?? 0`),
-- maar het is een verandering die niemand gevraagd heeft en die pas opvalt bij
-- de eerste query die `is null` gebruikt.
--
-- Andersom kan het ook niet: zet je in de insert `coalesce(..., 0)`, dan is
-- `excluded.fiets_min` bij een bestaande dag óók 0 als er niets meegestuurd
-- werd, en veegt de update een goed getal weg.
--
-- Vandaar `v_fiets`: de insert krijgt `coalesce(v_fiets, 0)` en gedraagt zich
-- als vanouds, de update krijgt `coalesce(v_fiets, oud)` en laat met rust wat
-- niet meekwam. Twee keer hetzelfde getal, twee keer een andere bodem.
--
-- WAT EEN MEEGESTUURDE WAARDE DOET MET WAT ER STAAT
--
-- Hij vervangt hem, net als bij stappen en actieve energie. Dat is met opzet
-- anders dan bij het gewicht, dat alleen ingevuld wordt als er nog niets staat.
--
-- Het verschil is wie er aan de knop zit. De koppeling vuurt uit zichzelf en
-- mag daarom nooit over een met de hand ingevuld gewicht heen. Een import is
-- een mens die schermafdrukken kiest en op Overnemen drukt — die heeft het
-- gevraagd.
--
-- En er is geen alternatief dat werkt: laat je een bestaande waarde staan, dan
-- doet de import niets op elke dag die de koppeling al aangeraakt heeft, en dat
-- zijn bij wie een koppeling heeft álle dagen. Het veld heeft bovendien
-- `default 0`, dus zelfs een dag waar niets aan gemeten is heeft al een waarde.
--
-- WAAR DAT MIS KAN GAAN, EN WAT ERTEGEN GEDAAN IS
--
-- Een schermafdruk knipt. Staan de twee ritten van dinsdag op de grens van twee
-- afdrukken, dan valt de halve regel eraf (dat is een regel in de herkenning,
-- niet hier) en telt de import 30 minuten waar er 75 waren. Die 30 komt dan
-- over de 75 heen.
--
-- Daar is geen SQL tegen: de database kan niet zien dat een afdruk incompleet
-- was. Wat er wél tegen gedaan is, staat in het scherm — het toont per dag wat
-- er overgenomen wordt én wat er al staat, met een vinkje per post, vóór er iets
-- verstuurd wordt. Zie `ImportVenster` in `src/health/vensters/Instellingen.tsx`.
--
-- TERUGDRAAIEN
--
-- Zet de vorige versie terug: dezelfde functie zonder `v_fiets` en zonder de
-- regel `fiets_min` in de insert en de update. Hij staat in
-- `gereedschap/verhuizing/schema-gegenereerd.sql`. Rijen die al geschreven zijn
-- blijven staan; ze zijn met de hand te wissen via het scherm Beweging.
-- ===========================================================================

BEGIN;

create or replace function public.kal_dagen_importeren(p_token text, p_dagen jsonb)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_id uuid; v_rij jsonb; v_n integer := 0; v_fiets integer;
begin
  v_id := kal_sessie(p_token);
  for v_rij in select * from jsonb_array_elements(p_dagen) loop
    /* Ronden en niet afkappen, net als kal_beweging_dag doet: een post van
       44 min 36 s komt als 44,6 binnen en `'44.6'::integer` weigert Postgres. */
    v_fiets := round(nullif(v_rij->>'fiets_min','')::numeric)::integer;

    insert into kal_dagen(gebruiker_id, datum, gewicht_kg, stappen, actieve_energie_kcal,
                          fiets_min, bron)
    values (v_id, (v_rij->>'datum')::date,
            nullif(v_rij->>'gewicht_kg','')::numeric,
            nullif(v_rij->>'stappen','')::integer,
            nullif(v_rij->>'actieve_energie_kcal','')::integer,
            coalesce(v_fiets, 0),
            coalesce(v_rij->>'bron','import'))
    on conflict (gebruiker_id, datum) do update set
      gewicht_kg           = coalesce(excluded.gewicht_kg, kal_dagen.gewicht_kg),
      stappen              = coalesce(excluded.stappen, kal_dagen.stappen),
      actieve_energie_kcal = coalesce(excluded.actieve_energie_kcal, kal_dagen.actieve_energie_kcal),
      fiets_min            = coalesce(v_fiets, kal_dagen.fiets_min),
      updated_at           = now();
    v_n := v_n + 1;
  end loop;
  return v_n;
end $function$;

comment on function public.kal_dagen_importeren(text, jsonb) is
  'Dagen uit een import wegschrijven. Een meegestuurd veld vervangt wat er staat; een veld dat niet meekomt laat het met rust.';

grant execute on function public.kal_dagen_importeren(text, jsonb) to anon, authenticated;

COMMIT;


-- ===========================================================================
-- NAKIJKEN
-- ===========================================================================
--
-- De zes vragen hieronder zijn precies de zes die in de proef van dit bestand
-- staan. Ze draaien op jouw eigen token en laten rijen achter — draai ze op een
-- datum waar niets staat, of draai ze binnen een transactie die je terugrolt.
--
--   begin;
--   select kal_dagen_importeren('<token>', '[{"datum":"2015-01-02","fiets_min":40}]');
--   select fiets_min from kal_dagen where datum = '2015-01-02';   -- 40
--
--   select kal_dagen_importeren('<token>', '[{"datum":"2015-01-02","stappen":900}]');
--   select fiets_min, stappen from kal_dagen where datum = '2015-01-02';  -- 40, 900
--                                            -- de 40 blijft: niets meegestuurd
--
--   select kal_dagen_importeren('<token>', '[{"datum":"2015-01-02","fiets_min":25}]');
--   select fiets_min from kal_dagen where datum = '2015-01-02';   -- 25, vervangen
--
--   select kal_dagen_importeren('<token>', '[{"datum":"2015-01-03","stappen":100}]');
--   select fiets_min from kal_dagen where datum = '2015-01-03';   -- 0, niet null
--
--   select kal_dagen_importeren('<token>', '[{"datum":"2015-01-04","fiets_min":44.6}]');
--   select fiets_min from kal_dagen where datum = '2015-01-04';   -- 45, afgerond
--   rollback;
-- ===========================================================================
