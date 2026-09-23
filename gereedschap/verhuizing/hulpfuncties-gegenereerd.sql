-- =============================================================================
--  ⚠  DIT BESTAND IS EEN VERSLAG EN GEEN MIGRATIE. NIET DRAAIEN.
--
--  Het is één keer gebruikt, op 26 augustus 2026, om het schema op een lége
--  nieuwe database neer te zetten. Zie `SUPABASE-scheiding.md`.
--
--  Draai je het op een database waar de tabellen al staan, dan valt het om:
--
--      ERROR: 42P16: multiple primary keys for table "bennahub_gezin"
--                    are not allowed
--
--  De `create table if not exists` bovenaan slaan namelijk over, en de
--  `alter table ... add primary key` verderop proberen daarna een tweede
--  sleutel toe te voegen aan een tabel die er al een heeft.
--
--  Dat is niet gevaarlijk: er staat geen enkele `drop`, `truncate` of
--  losse `delete` in, en de `update`-regels die je bij het zoeken tegenkomt
--  staan alle binnen functielichamen die op dat moment nog niet eens
--  bestaan. Maar het levert ook niets op.
--
--  WAAR DIT BESTAND WÉL VOOR IS
--
--  Nakijken hoe een tabel er werkelijk uitziet: welke kolommen verplicht
--  zijn, en welke waarden een check-constraint toelaat. Dat is de enige
--  betrouwbare bron daarvoor, en een handgeschreven proefopstelling is dat
--  niet: zie de kop van `health/database/31-de-lunchhoek.sql`.
--
--  Wil je een lokale proefopstelling met de echte constraints erin, knip er
--  dan de tabellen uit die je nodig hebt plus hun sleutels en indexen. Dat
--  is lezen uit dit bestand, niet het draaien ervan.
--
--  WAT JE WÉL DRAAIT
--
--  De genummerde bestanden in `health/database/`, één voor één, in volgorde.
--  Die zijn daarvoor geschreven en dragen elk hun eigen terugdraairegel.
-- =============================================================================

-- Hulpfuncties die de hub aanroept maar die niet naar de hub heten.

CREATE OR REPLACE FUNCTION public.bh_ouder_ok(p_gezin text, p_wachtwoord text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare g public.bennahub_gezin;
begin
  select * into g from public.bennahub_gezin where gezin = lower(trim(p_gezin));
  if not found then return false; end if;
  return g.wachtwoord_hash = extensions.crypt(p_wachtwoord, g.wachtwoord_hash);
end $function$
;

revoke all on function public.bh_ouder_ok(p_gezin text, p_wachtwoord text) from public, anon, authenticated;