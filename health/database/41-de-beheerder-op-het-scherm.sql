-- ===========================================================================
-- 41: DE BEHEERDER OP HET SCHERM
-- ===========================================================================
--
-- TOEGEPAST: ja, op 19 september 2026. `kal_ben_ik_beheerder` bestaat; de
-- beheerdersregel staat daarmee in het accountvenster van wie de vlag heeft.
--
-- Bestand 40 leverde `kal_herstelcode_voor` en daarmee was de klus half af: de
-- functie was nergens vanuit de app bereikbaar. Dat klinkt als een detail maar
-- haalde het punt eruit.
--
-- WAAROM EEN FUNCTIE ZONDER SCHERM HIER NIETS TOEVOEGT
--
-- De enige manier om hem aan te roepen was de SQL-editor. Wie die openheeft, kan
-- al bij álles in de database: die heeft geen functie nodig om een herstelcode
-- te maken, die kan de kolom zo overschrijven. De functie bestaat juist voor een
-- beheerder die géén databasetoegang heeft. Zonder scherm hielp hij dus precies
-- de ene persoon die hem niet nodig had.
--
-- WAT DIT BESTAND TOEVOEGT
--
-- Eén functie, en hij doet één ding: vertellen of jíj beheerder bent. Het scherm
-- heeft dat nodig, want een knop die bij iedereen staat en bij bijna niemand
-- werkt is geen knop maar een raadsel.
--
-- WAAROM DIT NIETS VERKLAPT
--
-- Bestand 40 geeft met opzet dezelfde foutmelding voor "je bent geen beheerder"
-- en "je wachtwoord klopt niet", het verschil zou verklappen wie beheerder is.
-- Deze functie doet dat niet alsnog: ze antwoordt alleen over de houder van het
-- token, en die weet het al. Er is geen vorm van deze vraag die iets over een
-- ander zegt, want er gaat geen accountnaam in.
--
-- Wat ze ook niet doet is toegang geven. Ze leest één boolean en raakt niets aan.
-- Wie het antwoord vervalst in zijn browser krijgt een knop te zien die bij het
-- indrukken alsnog door `kal_herstelcode_voor` geweigerd wordt, de echte grens
-- ligt daar en niet hier.
--
-- TERUGDRAAIEN
--
--   drop function if exists public.kal_ben_ik_beheerder(text);
--
-- Het scherm valt dan terug op "niet gevonden" en toont de regel niet meer. De
-- werking van bestand 40 verandert er niet door.
-- ===========================================================================

BEGIN;

create or replace function public.kal_ben_ik_beheerder(p_token text)
 returns jsonb
 language plpgsql
 stable
 security definer
 set search_path to 'public'
as $function$
declare v_id uuid;
begin
  v_id := kal_sessie(p_token);
  /* Geen sessie is geen beheerder, en geen fout: het scherm vraagt dit bij het
     openen van je account, en een verlopen token hoort daar geen rode melding
     op te leveren maar gewoon een ontbrekende regel. */
  return jsonb_build_object(
    'beheerder',
    coalesce((select beheerder from kal_gebruikers where id = v_id), false));
end $function$;

comment on function public.kal_ben_ik_beheerder(text) is
  'Of de houder van dit token beheerder is. Zegt niets over een ander en geeft geen toegang; alleen om de knop wel of niet te tonen.';

grant execute on function public.kal_ben_ik_beheerder(text) to anon, authenticated;

COMMIT;


-- ===========================================================================
-- NAKIJKEN
-- ===========================================================================
--
-- 1. Met je eigen token, nadat je jezelf in bestand 40 beheerder hebt gemaakt:
--
--      select kal_ben_ik_beheerder('<token>');
--
--    Verwacht: {"beheerder": true}.
--
-- 2. Met het token van iemand die het niet is:
--
--      select kal_ben_ik_beheerder('<ander token>');
--
--    Verwacht: {"beheerder": false}.
--
-- 3. En met onzin, want een verlopen token hoort geen fout te geven:
--
--      select kal_ben_ik_beheerder('bestaatniet');
--
--    Verwacht: {"beheerder": false}. Komt hier een exception uit, dan krijgt
--    iedereen met een verlopen sessie een rode melding in zijn account.
-- ===========================================================================
