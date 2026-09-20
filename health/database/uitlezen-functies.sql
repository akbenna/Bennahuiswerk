-- UITLEZEN: GEEF ME DE FUNCTIE ZOALS DE DATABASE HEM KENT
--
-- Ook dit bestand verandert niets, en het heeft daarom geen nummer. Het is de
-- tweede helft van `controle-md5.sql`: die zegt wélke functies scheef staan,
-- dit haalt de tekst op zodat er een verslag van gemaakt kan worden.
--
-- WANNEER JE DIT DRAAIT
--
-- Na een controle die VERSCHILT of STAAT NIET IN DE REPO meldt. Bij VERSCHILT
-- is de vraag welke van de twee vooroploopt, en die is alleen te beantwoorden
-- door ze naast elkaar te leggen. Bij STAAT NIET IN DE REPO is er geen tweede
-- kant: de functie draait, en er is geen bestand dat haar beschrijft.
--
-- `pg_get_functiondef` geeft het geheel terug, dus mét de handtekening, mét
-- `security definer` en mét het vastgezette `search_path`. Dat is precies wat
-- `prosrc` níet laat zien en wat de md5-vergelijking dus ook niet vergelijkt.
--
-- De uitvoer is lang. Draai hem per groepje als de editor er moeite mee heeft.

-- 1. DE FUNCTIES DIE NERGENS IN DE REPO STAAN
--    Tien stuks op 20 september 2026, en ze dragen samen de hele sessie, het
--    profiel en het wegschrijven van een dag. Dat die zonder verslag draaien is
--    het grootste gat dat de controle heeft blootgelegd.
select p.proname::text as functie,
       pg_get_function_identity_arguments(p.oid) as argumenten,
       pg_get_functiondef(p.oid) as definitie
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = any (array[
    'kal_sessie', 'kal_afmelden', 'kal_profiel_zetten', 'kal_dagstand',
    'kal_dag_zetten', 'kal_regels_toevoegen', 'kal_regel_wissen',
    'kal_weekcijfers', 'kal_prikkel_bouwen', 'kal_prikkel_gelogd'
  ])
order by p.proname;

-- 2. DE FUNCTIES DIE VERSCHILLEN VAN HET BESTAND
--    Zeven stuks op dezelfde dag. Leg ze naast het genummerde bestand dat de
--    controle noemt en bepaal welke van de twee vooroploopt. Loopt de database
--    voor, dan hoort het bestand bijgewerkt te worden; loopt het bestand voor,
--    dan is het geschreven en nooit toegepast, en dan is de vraag waarom niet.
select p.proname::text as functie,
       pg_get_function_identity_arguments(p.oid) as argumenten,
       pg_get_functiondef(p.oid) as definitie
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = any (array[
    'kal_coach_bouwen', 'kal_dagen_importeren', 'kal_gerecht', 'kal_nevo_zoek',
    'kal_proef_koppeling', 'kal_ww_klacht', 'kal_zoeken'
  ])
order by p.proname;
