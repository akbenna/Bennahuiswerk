-- CONTROLE: DRAAIT DE DATABASE WAT ER IN DEZE MAP STAAT?
--
-- Dit bestand verandert niets. Het leest `pg_proc` en vergelijkt elke functie
-- met het genummerde bestand dat haar het laatst neerzet. Plak het geheel in de
-- SQL-editor van Supabase en draai het; er komt één tabel uit.
--
-- WAAROM DIT BESTAAT
--
-- De genummerde bestanden in `health/database/` zijn een verslag en geen
-- migratiesysteem. Ze horen te kloppen met wat er draait, en dat is precies het
-- soort belofte dat ongemerkt scheef groeit: iemand past een functie aan in de
-- editor, of een bestand wordt geschreven en nooit toegepast, en niets merkt
-- het. Deze vergelijking merkt het wel.
--
-- HOE DE VERGELIJKING WERKT
--
-- Aan beide kanten hetzelfde recept: neem de body van de functie zoals Postgres
-- die in `prosrc` bewaart (dat is wat er tussen de dollartekens stond), haal de
-- blokcommentaren `/* ... */` eruit, trek elke reeks witruimte samen tot één
-- spatie, en neem daar de md5 van. Zo vallen opmaak en toelichting weg en
-- blijft alleen over wat de functie dóét.
--
-- Let op wat er daardoor NIET meeweegt: regelcommentaar met twee streepjes
-- blijft staan en telt dus wel mee, en de handtekening (argumenten, retourtype,
-- `security definer`, `set search_path`) valt buiten `prosrc` en wordt hier dus
-- niet vergeleken. Een functie kan gelijk zijn en toch met andere rechten
-- draaien.
--
-- WAT DE UITKOMSTEN BETEKENEN
--
--   gelijk                      de database draait wat het bestand zegt
--   VERSCHILT                   allebei aanwezig, andere inhoud. Uitzoeken welk
--                               van de twee vooroploopt, en het andere bijwerken
--   STAAT NIET IN DE DATABASE   het bestand is geschreven maar nooit toegepast
--   STAAT NIET IN DE REPO       de functie draait wel maar staat nergens in deze
--                               map. Dat is een functie zonder verslag
--
-- Staat een naam twee keer in de uitslag, dan zijn er twee functies met
-- dezelfde naam en verschillende argumenten. De kolom `argumenten` laat zien
-- welke; de repo kent er dan maar één van.
--
-- De verwachte waarden hieronder zijn uit de bestanden gerekend op de stand van
-- deze tak. Verandert er een functie, dan hoort dit bestand opnieuw gemaakt te
-- worden.

with verwacht (functie, uit_bestand, md5_repo) as (
  values
    ('kal_aanmelden'::text, '32-aanmelden-met-rem.sql'::text, '6ec3ba30adde2c81469d6ed41c22ade3'::text),
    ('kal_ben_ik_beheerder', '41-de-beheerder-op-het-scherm.sql', '243c3bb34424abb6433fc8c9d6708465'),
    ('kal_beweging_dag', '26-lichaamsparameters-uit-de-koppeling.sql', '46b9b4a245a44fa5524304a4aaa76350'),
    ('kal_beweging_gewoonte', '05-peilingen-van-de-dag.sql', '50b1ce06ac9d8ce23d7f6c2978a162aa'),
    ('kal_beweging_ontvangen', '02-koppelingen-voor-beweging.sql', '89014c215dc107b9d7ddad125ebfc169'),
    ('kal_coach_bouwen', '46-zeven-functies-gelijktrekken.sql', 'b497686b36de46b6ed512355f776d9b5'),
    ('kal_coach_stand', '06-de-coach-prikkelt.sql', '9bd4b0e1cf8950cb392ed9fae0ceabe7'),
    ('kal_dagen_importeren', '46-zeven-functies-gelijktrekken.sql', '05af439cd4eb591c0f0aff80ee32c186'),
    ('kal_eiwitrijk', '38-een-getal-dat-niet-kan-bestaan.sql', 'da67ff29517e540dd2c2e20abf789bfa'),
    ('kal_gerecht', '46-zeven-functies-gelijktrekken.sql', 'd13ab7efd4acf76aaf832ea586f68374'),
    ('kal_getal', '04-koppeling-in-de-praktijk.sql', '33bd5b9806655c94c81b1082d7c72b1f'),
    ('kal_herstelcode_maken', '33-wachtwoord-kwijt.sql', 'dc4c8ff70087e460d430ef59e96e8d18'),
    ('kal_herstelcode_voor', '40-een-beheerder-die-niet-stilletjes-kan.sql', '32af9a32b04fbf7145ab37ad61ca993a'),
    ('kal_hoeken', '35-de-voorkeuren-in-de-lijsten.sql', 'bda6e4088510345b98b58d73700695af'),
    ('kal_inspanning_toevoegen', '43-inspanning-krijgt-een-soort.sql', 'd6a015baa2475c80fd204f6e3cfc8b05'),
    ('kal_koppeling_maken', '02-koppelingen-voor-beweging.sql', 'cfefbf077c092f1833878424ca46f84f'),
    ('kal_koppeling_wissen', '02-koppelingen-voor-beweging.sql', '2dbfb40a5a985a8fee8f67373bea326a'),
    ('kal_koppelingen_lijst', '02-koppelingen-voor-beweging.sql', 'bd2c63b0c4658470eff8447ca41ff122'),
    ('kal_maaltijd_bewaren', '09-favoriet-en-vindbaar.sql', '2d20aa272743b24411e660422ac12b90'),
    ('kal_maaltijd_een', '09-favoriet-en-vindbaar.sql', 'c746438f8907d32140e747fbb346a55f'),
    ('kal_maaltijd_favoriet', '09-favoriet-en-vindbaar.sql', '8a908b093c3dc38b8c84ddc0fc04f592'),
    ('kal_maaltijd_wissen', '07-eigen-maaltijden.sql', '4a024725c27141d0fe69f2f204ac7ba3'),
    ('kal_maaltijden', '09-favoriet-en-vindbaar.sql', 'b1231836f2b07629b303660d25c4e785'),
    ('kal_merk_zoek', '18-merkproducten.sql', '8f7c2c06c977886d8f7cf05a26f54d8a'),
    ('kal_meting_uit_koppeling', '26-lichaamsparameters-uit-de-koppeling.sql', '817dadef499b1d9ba4866a0c601dcfb7'),
    ('kal_modelstand_zetten', '06-de-coach-prikkelt.sql', 'e000dbb78ec2d65d9a70c064d867bfde'),
    ('kal_nevo_zoek', '46-zeven-functies-gelijktrekken.sql', '16022319f990c6f09d21a7ae053eff24'),
    ('kal_ophalen', '43-inspanning-krijgt-een-soort.sql', '57fd6bdea1ad93546829ab45c03c32ae'),
    ('kal_peiling_vastleggen', '05-peilingen-van-de-dag.sql', '893f196d4272174ffa16dad25aab511a'),
    ('kal_portiematen', '14-huishoudmaten-verdiepen.sql', '875f959ec7e89f6899b95592057e1e0d'),
    ('kal_prikkel_gelogd', '47-de-bodem-op-papier.sql', '713ef4d7fd017ae4b9b87f60cc08bd89'),
    ('kal_proef_koppeling', '46-zeven-functies-gelijktrekken.sql', '2c3860d35f55b2f1907d1523181ba489'),
    ('kal_proef_lichaamsparameters', '26-lichaamsparameters-uit-de-koppeling.sql', '57fb4f69be7545c5bff3969cd3777743'),
    ('kal_registreren', '39-een-wachtwoord-dat-standhoudt.sql', 'aee59c9d0fec9e0cc5ec572fbcc153ad'),
    ('kal_rij_toevoegen', '43-inspanning-krijgt-een-soort.sql', 'e8fada26c73efb92264d4e789465bfec'),
    ('kal_rij_wissen', '43-inspanning-krijgt-een-soort.sql', 'ef52f68b7f1679822e4c9da4e5a067c3'),
    ('kal_verzadiging', '37-fijner-dan-een-groep.sql', '06d1cccc04c19755174d281a789020e8'),
    ('kal_woordskelet', '20-zoeken-met-alternatieven.sql', 'd90a1d62a23214b29f97e1bd7445a938'),
    ('kal_ww_grondvorm', '39-een-wachtwoord-dat-standhoudt.sql', '231106adfab4719f2004e38a75da09ef'),
    ('kal_ww_herstellen', '39-een-wachtwoord-dat-standhoudt.sql', 'aa755cc76ca4c1501c7a4700a02ee1ff'),
    ('kal_ww_klacht', '46-zeven-functies-gelijktrekken.sql', 'efc154e780a964c2ade77daac5eea9f0'),
    ('kal_ww_ontdubbel', '39-een-wachtwoord-dat-standhoudt.sql', '3d697a81652f371000f03192ec716b6c'),
    ('kal_ww_rijlengte', '39-een-wachtwoord-dat-standhoudt.sql', '3054fa527ddc7e4ceefa9aae5a486f4d'),
    ('kal_ww_wijzigen', '39-een-wachtwoord-dat-standhoudt.sql', 'ca7f165acbca970c33586d21cd111c12'),
    ('kal_zoeken', '46-zeven-functies-gelijktrekken.sql', '171744fe829ccf08e5afcb778f258d6b')
),
in_de_database as (
  select p.proname::text                                   as functie,
         pg_get_function_identity_arguments(p.oid)          as argumenten,
         md5(regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'gs'),
                            '\s+', ' ', 'g'))               as md5_database
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname like 'kal\_%'
)
select coalesce(v.functie, d.functie)                      as functie,
       case
         when d.functie is null      then 'STAAT NIET IN DE DATABASE'
         when v.functie is null      then 'STAAT NIET IN DE REPO'
         when v.md5_repo = d.md5_database then 'gelijk'
         else 'VERSCHILT'
       end                                                 as uitkomst,
       v.uit_bestand,
       d.argumenten,
       v.md5_repo,
       d.md5_database
  from verwacht v
  full join in_de_database d on d.functie = v.functie
 order by (case
             when d.functie is null then 1
             when v.functie is null then 2
             when v.md5_repo = d.md5_database then 4
             else 3
           end),
          1;
