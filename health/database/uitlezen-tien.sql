-- DE TIEN ZONDER VERSLAG, ÉÉN VOOR ÉÉN
--
-- `uitlezen-functies.sql` haalt ze in één keer op, en dat is voor de SQL-editor
-- te veel: tien functies van een paar honderd regels in één cel wordt afgekapt,
-- en een afgekapte functie in een verslagbestand is erger dan geen verslag.
--
-- Hier staat dezelfde vraag in tien losse regels. Draai er één, plak de
-- uitkomst, draai de volgende. Niets hiervan verandert iets.
--
-- Wat er per functie te zien hoort te zijn en waarom het ertoe doet:
--
--   kal_sessie             de poort waar élke andere functie doorheen gaat
--   kal_dag_zetten         hoe een `null` in de patch behandeld wordt. Het
--                          venster "Je wegingen" stuurt `gewicht_kg: null` om
--                          een weging weg te halen, en of dat werkelijk wist of
--                          stilletjes de oude waarde laat staan, is alleen hier
--                          af te lezen
--   kal_profiel_zetten     dezelfde vraag voor het profiel
--   kal_regels_toevoegen   wat er gebeurt met een regel die er al staat
--   kal_weekcijfers        het enige wat AUTOMATISERING.md beschrijft en
--                          nergens in SQL staat

select pg_get_functiondef(p.oid) from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'kal_sessie';

select pg_get_functiondef(p.oid) from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'kal_dag_zetten';

select pg_get_functiondef(p.oid) from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'kal_profiel_zetten';

select pg_get_functiondef(p.oid) from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'kal_regels_toevoegen';

select pg_get_functiondef(p.oid) from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'kal_regel_wissen';

select pg_get_functiondef(p.oid) from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'kal_dagstand';

select pg_get_functiondef(p.oid) from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'kal_weekcijfers';

select pg_get_functiondef(p.oid) from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'kal_afmelden';

select pg_get_functiondef(p.oid) from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'kal_prikkel_bouwen';

select pg_get_functiondef(p.oid) from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'kal_prikkel_gelogd';
