-- =============================================================================
-- WACHTWOORD KWIJT — een weg terug, zonder e-mail
--
-- Toegepast 18 september 2026. Niet hier nagekeken: dat rust op een
-- mededeling en niet op een meting.
--
-- DE VRAAG
--
-- Vanaf het moment dat er meer dan één mens in de app zit, is "ik ben mijn
-- wachtwoord kwijt" geen randgeval maar een zekerheid. Er was geen weg terug:
-- de vier functies rond een account zijn `kal_registreren`, `kal_aanmelden`,
-- `kal_afmelden` en `kal_sessie`. Je kon je wachtwoord niet eens wijzigen.
--
-- WAAROM GEEN E-MAIL
--
-- De gewone oplossing is een herstelmail. Die kan hier niet, en dat is geen
-- luiheid maar een optelsom:
--
--   · `kal_gebruikers` heeft geen e-mailkolom. Er is er nooit een geweest.
--   · Een e-mailadres toevoegen is persoonsgegevens verzamelen die de app tot
--     nu toe niet nodig had. Voor een app die zegt dat hij bewaart wat hij
--     nodig heeft is dat een besluit en geen detail. Zie `health/DPIA.md`.
--   · Versturen vraagt een externe dienst, een sleutel in de vault, een edge
--     function en een adres dat bevestigd moet worden — vier dingen die stuk
--     kunnen op het moment dat iemand ze het hardst nodig heeft.
--
-- Dus een herstelcode: eenmalig, zelf te bewaren, en hij verlaat de database
-- maar één keer.
--
-- WAT ER NU IS
--
--   kal_ww_wijzigen(token, oud, nieuw)          wachtwoord veranderen
--   kal_herstelcode_maken(token, ww)            code aanmaken, één keer tonen
--   kal_ww_herstellen(account, code, nieuw)     met de code terug naar binnen
--
-- DE DRIE KEUZES DIE ERIN ZITTEN
--
-- 1. DE CODE VRAAGT JE WACHTWOORD, NIET ALLEEN JE TOKEN.
--    Een token ligt dertig dagen in localStorage. Wie dat steelt mag geen
--    herstelcode kunnen aanmaken, want dan wisselt hij een geleende sessie in
--    voor een blijvende ingang. Vandaar dat `kal_herstelcode_maken` het
--    wachtwoord opnieuw vraagt.
--
-- 2. HERSTELLEN GOOIT ALLE SESSIES ERUIT, OOK DE JOUWE.
--    Wie zijn wachtwoord herstelt doet dat meestal omdat er iets mis is. Bleef
--    een oude sessie geldig, dan blijft ook een indringer binnen. Alles eruit
--    dus, en er komt één nieuw token voor terug. Hetzelfde geldt bij het
--    wijzigen van je wachtwoord.
--
-- 3. DE CODE IS OP NA GEBRUIK.
--    `herstel_hash` gaat op null. Wie een nieuwe wil maakt er een. Zo kan een
--    code die ooit ergens is blijven staan — in een notitie, in een chat — niet
--    twee keer werken.
--
-- DE REM GELDT HIER OOK
--
-- Herstellen telt mee in dezelfde teller als aanmelden (`kal_aanmeld_poging`,
-- bestand 32). Zonder dat zou de herstelingang een omweg om de rem zijn: tien
-- keer raden op het wachtwoord, en daarna onbeperkt raden op de code.
--
-- En om dezelfde reden als daar geven deze functies bij een mislukking een
-- antwoord en geen exception: een exception draait de transactie terug, en
-- daarmee de poging die net was vastgelegd. De rem zou nooit grijpen.
--
-- WAT DIT NIET OPLOST
--
-- Wie zijn wachtwoord kwijt is én zijn herstelcode nooit heeft gemaakt of
-- bewaard, komt er niet meer in. Dat is eerlijk gezegd het waarschijnlijke
-- geval bij een gezin: niemand bewaart codes.
--
-- De aanvulling die dat wél dekt is een beheerder die voor een ander kan
-- herstellen — precies wat `bennahub_lid_reset` in de gezinsapp doet, waar een
-- ouder de code van een kind terugzet. Dat vraagt een beheerdersbegrip dat
-- `kal_gebruikers` nu niet heeft, en het is een apart besluit: het betekent dat
-- één account bij de gegevens van een ander kan. Daarom staat het hier niet in.
--
-- TERUGDRAAIEN
--
--   drop function if exists public.kal_ww_herstellen(text, text, text);
--   drop function if exists public.kal_herstelcode_maken(text, text);
--   drop function if exists public.kal_ww_wijzigen(text, text, text);
--   alter table public.kal_gebruikers
--     drop column if exists herstel_hash,
--     drop column if exists herstel_gemaakt_op;
--
-- Twee keer draaien verandert niets: de kolommen staan op `if not exists` en
-- een functie vervangen is de gewone gang van zaken.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- BLOK 1 — WAAR DE CODE IN STAAT
-- ---------------------------------------------------------------------------
--
-- Gehasht, net als het wachtwoord, en met dezelfde kostenfactor. De code
-- verlaat de database precies één keer: op het moment dat hij gemaakt wordt.

alter table public.kal_gebruikers
  add column if not exists herstel_hash text,
  add column if not exists herstel_gemaakt_op timestamptz;

comment on column public.kal_gebruikers.herstel_hash is
  'Bcrypt-hash van de eenmalige herstelcode, of null als er geen is. Gaat op null zodra de code gebruikt is.';


-- ---------------------------------------------------------------------------
-- BLOK 2 — JE WACHTWOORD WIJZIGEN
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.kal_ww_wijzigen(
  p_token text, p_oud text, p_nieuw text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_id uuid; v_account text; v_token text;
begin
  v_id := kal_sessie(p_token);

  if length(coalesce(p_nieuw, '')) < 8 then
    return jsonb_build_object('fout', 'Kies een wachtwoord van minstens acht tekens');
  end if;

  select account into v_account from kal_gebruikers
   where id = v_id and ww_hash = crypt(p_oud, ww_hash);

  if v_account is null then
    return jsonb_build_object('fout', 'Je huidige wachtwoord klopt niet');
  end if;

  update kal_gebruikers
     set ww_hash = crypt(p_nieuw, gen_salt('bf', 10))
   where id = v_id;

  /* Alles eruit, ook dit toestel. Wie zijn wachtwoord wijzigt wil dat een
     ander toestel dat nog openstaat eruit vliegt. */
  delete from kal_sessies where gebruiker_id = v_id;
  v_token := encode(gen_random_bytes(32), 'hex');
  insert into kal_sessies(token, gebruiker_id, verloopt_op)
  values (v_token, v_id, now() + interval '30 days');

  return jsonb_build_object('token', v_token, 'account', v_account);
end $function$;

COMMENT ON FUNCTION public.kal_ww_wijzigen(text, text, text) IS
  'Wijzigt het wachtwoord van de aangemelde gebruiker. Gooit alle sessies eruit en geeft een nieuw token, of {fout}.';


-- ---------------------------------------------------------------------------
-- BLOK 3 — EEN HERSTELCODE MAKEN
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.kal_herstelcode_maken(p_token text, p_ww text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  /* Tweeëndertig tekens, zonder I, O, nul en één — die worden overgeschreven
     als elkaar. Precies tweeëndertig, dus vijf bits per teken en geen
     modulo-scheefheid: 256 is deelbaar door 32. Twintig tekens is honderd bits. */
  c_alfabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_id   uuid;
  v_ruw  bytea;
  v_code text := '';
  i      integer;
begin
  v_id := kal_sessie(p_token);

  /* Met opzet óók het wachtwoord, en niet alleen het token. Zie de kop. */
  if not exists (select 1 from kal_gebruikers
                  where id = v_id and ww_hash = crypt(p_ww, ww_hash)) then
    return jsonb_build_object('fout', 'Je wachtwoord klopt niet');
  end if;

  v_ruw := gen_random_bytes(20);
  for i in 0..19 loop
    if i > 0 and i % 5 = 0 then v_code := v_code || '-'; end if;
    v_code := v_code || substr(c_alfabet, (get_byte(v_ruw, i) % 32) + 1, 1);
  end loop;

  update kal_gebruikers
     set herstel_hash = crypt(v_code, gen_salt('bf', 10)),
         herstel_gemaakt_op = now()
   where id = v_id;

  /* De enige keer dat deze code de database verlaat. */
  return jsonb_build_object('code', v_code);
end $function$;

COMMENT ON FUNCTION public.kal_herstelcode_maken(text, text) IS
  'Maakt een eenmalige herstelcode en geeft hem terug. Vraagt het wachtwoord opnieuw, zodat een gestolen token er geen kan maken. Een bestaande code vervalt.';


-- ---------------------------------------------------------------------------
-- BLOK 4 — MET DE CODE TERUG NAAR BINNEN
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.kal_ww_herstellen(
  p_account text, p_code text, p_nieuw text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_id      uuid;
  v_account text;
  v_code    text;
  v_token   text;
  v_mis     integer;
begin
  v_account := lower(trim(coalesce(p_account, '')));
  /* Streepjes en spaties zijn leeshulp en geen inhoud; hoofdletters ook niet. */
  v_code    := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));

  delete from kal_aanmeld_poging where moment < now() - interval '1 hour';

  select count(*) into v_mis from kal_aanmeld_poging
   where account = v_account and moment > now() - interval '15 minutes';

  if v_mis >= 10 then
    return jsonb_build_object('fout',
      'Te veel mislukte pogingen. Probeer het over een kwartier opnieuw.');
  end if;

  if length(coalesce(p_nieuw, '')) < 8 then
    return jsonb_build_object('fout', 'Kies een wachtwoord van minstens acht tekens');
  end if;

  /* De code is opgeslagen mét streepjes, dus die moeten er bij het vergelijken
     weer in. Vier groepen van vijf. */
  select id into v_id
    from kal_gebruikers
   where account = v_account
     and herstel_hash is not null
     and herstel_hash = crypt(
           substr(v_code,1,5) || '-' || substr(v_code,6,5) || '-'
           || substr(v_code,11,5) || '-' || substr(v_code,16,5), herstel_hash);

  if v_id is null then
    insert into kal_aanmeld_poging(account) values (v_account);
    /* Eén boodschap voor alle drie de gevallen — account bestaat niet, er is
       geen code, de code klopt niet. Het verschil zou verklappen welke
       accounts er zijn en welke een code hebben klaarstaan. */
    return jsonb_build_object('fout', 'Die combinatie klopt niet');
  end if;

  update kal_gebruikers
     set ww_hash = crypt(p_nieuw, gen_salt('bf', 10)),
         herstel_hash = null,          -- op na gebruik
         herstel_gemaakt_op = null
   where id = v_id;

  /* Alles eruit: wie herstelt doet dat meestal omdat er iets mis is. */
  delete from kal_sessies where gebruiker_id = v_id;
  delete from kal_aanmeld_poging where account = v_account;

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into kal_sessies(token, gebruiker_id, verloopt_op)
  values (v_token, v_id, now() + interval '30 days');

  return jsonb_build_object('token', v_token, 'account', v_account);
end $function$;

COMMENT ON FUNCTION public.kal_ww_herstellen(text, text, text) IS
  'Zet een nieuw wachtwoord met de eenmalige herstelcode. Verbruikt de code, gooit alle sessies eruit en geeft een nieuw token, of {fout}. Telt mee in dezelfde rem als aanmelden.';

GRANT EXECUTE ON FUNCTION public.kal_ww_wijzigen(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kal_herstelcode_maken(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kal_ww_herstellen(text, text, text) TO anon, authenticated;

COMMIT;


-- ---------------------------------------------------------------------------
-- BLOK 5 — NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- Met je eigen account, en let op: elke geslaagde stap meldt je overal af.
--
-- 1. Een code maken vraagt je wachtwoord.
--
--    select kal_herstelcode_maken('JOUW_TOKEN','verkeerd')->>'fout';
--    → 'Je wachtwoord klopt niet'
--    select kal_herstelcode_maken('JOUW_TOKEN','JOUW_WACHTWOORD')->>'code';
--    → bijvoorbeeld 'K7H2M-4RPXQ-93FTW-BN6DZ'      ← schrijf hem op
--
-- 2. Een verkeerde code geeft geen weg naar binnen, en telt mee in de rem.
--
--    select kal_ww_herstellen('jouwaccount','AAAAA-BBBBB-CCCCC-DDDDD','ietsnieuws')->>'fout';
--    → 'Die combinatie klopt niet'
--    select count(*) from kal_aanmeld_poging where account='jouwaccount';
--    → 1
--
-- 3. De goede code werkt, met of zonder streepjes.
--
--    select kal_ww_herstellen('jouwaccount','k7h2m4rpxq93ftwbn6dz','eennieuwlangwachtwoord') ? 'token';
--    → t
--
-- 4. En hij werkt maar één keer.
--
--    select kal_ww_herstellen('jouwaccount','k7h2m4rpxq93ftwbn6dz','nogietsanders')->>'fout';
--    → 'Die combinatie klopt niet'
--
-- 5. Alle oude sessies zijn eruit. Voor het herstellen had je er n; nu één.
--
--    select count(*) from kal_sessies s
--      join kal_gebruikers g on g.id = s.gebruiker_id
--     where g.account = 'jouwaccount';
--    → 1
