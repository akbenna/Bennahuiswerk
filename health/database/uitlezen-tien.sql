-- DE TIEN ZONDER VERSLAG, IN ÉÉN OPDRACHT
--
-- WAAROM DIT BESTAND ÉÉN SELECT IS EN GEEN TIEN
--
-- De SQL-editor van Supabase toont het resultaat van de láátste opdracht in
-- het venster. Staan er tien selects, dan zie je de tiende en verdwijnen de
-- negen ervoor zonder melding. Dat is twee keer misgegaan: de eerste versie
-- van `uitlezen-functies.sql` had twee vragen en leverde alleen de tweede op,
-- en de versie erna had er tien en leverde alleen `kal_prikkel_gelogd`.
--
-- Vandaar één vraag met tien rijen. Draai hem, en plak de hele tabel.
--
-- Dit bestand verandert niets. Het heeft daarom geen nummer: het is geen
-- verslag maar een vraag.

select p.proname::text                             as functie,
       pg_get_function_identity_arguments(p.oid)   as argumenten,
       pg_get_functiondef(p.oid)                   as definitie
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = any (array[
    'kal_sessie', 'kal_afmelden', 'kal_profiel_zetten', 'kal_dagstand',
    'kal_dag_zetten', 'kal_regels_toevoegen', 'kal_regel_wissen',
    'kal_weekcijfers', 'kal_prikkel_bouwen', 'kal_prikkel_gelogd'
  ])
order by p.proname;
