-- =============================================================================
-- EEN REM OP HET AANMELDEN — voordat er meer dan één mens in zit
--
-- Toegepast 18 september 2026. Niet hier nagekeken: dat rust op een
-- mededeling en niet op een meting.
--
-- DE VRAAG WAS EEN ANDERE
--
-- De vraag was of er een structuur kon komen zodat meerdere mensen een account
-- kunnen maken. Die structuur bestaat al: `kal_registreren` maakt een account
-- met een bcrypt-hash, `kal_aanmelden` geeft er een token bij, en op het
-- aanmeldscherm staat een knop "Nieuw account". Het gezin kan vandaag aan.
--
-- Maar bij het nalezen van die twee functies viel iets anders op, en dat weegt
-- zwaarder dan alles wat er nog aan ontbreekt.
--
-- ER ZAT GEEN REM OP
--
-- `kal_aanmelden` staat open voor `anon` — dat moet ook, anders kan niemand
-- inloggen — en telde niets. Wie een accountnaam kent mag onbeperkt raden.
--
-- Met bcrypt op kostenfactor 10 duurt één poging ergens rond de vijftig
-- milliseconde. Dat is traag genoeg om een lange zin veilig te houden en ruim
-- snel genoeg om een kort wachtwoord binnen een avond te vinden. Zolang er één
-- gebruiker was met één zelfgekozen wachtwoord viel daarmee te leven. Vanaf het
-- moment dat er een gezin en een praktijk in zitten niet meer: dan bepaalt de
-- zwakste van de zes hoe stevig het geheel is.
--
-- DE VAL DIE HIERONDER VERMEDEN WORDT
--
-- De voor de hand liggende bouw is: mislukte poging wegschrijven, teller
-- ophogen, en `raise exception` als de teller vol is.
--
-- Die werkt niet. `raise exception` draait de transactie terug — inclusief de
-- rij die net was weggeschreven. De teller blijft dus eeuwig op nul staan en de
-- rem grijpt nooit. Het is een rem die er ís, die getest lijkt, en die niets
-- doet.
--
-- Daarom geeft `kal_aanmelden` bij een mislukking geen fout meer maar een
-- antwoord: `{"fout": "..."}` in plaats van een token. De functie loopt
-- daarmee normaal af, de transactie legt vast, en de poging blijft staan.
--
-- Dat is een verandering in het contract, en de app is in dezelfde commit
-- meeveranderd: `toestand.ts` kijkt nu of er een token in het antwoord zit.
-- Zou iemand dat vergeten, dan lijkt een mislukte aanmelding op een geslaagde
-- zonder token — vandaar dat daar een proef op staat.
--
-- `kal_registreren` blijft wél gooien. Daar is geen teller die moet overleven,
-- en "dat account bestaat al" hoort een fout te zijn.
--
-- DE AFWEGING DIE ERIN ZIT
--
-- Tien mislukkingen in een kwartier per account. Daarna een kwartier wachten,
-- schuivend: elke nieuwe poging telt mee zolang hij binnen het venster valt.
--
-- Wie jouw accountnaam kent kan je daarmee een kwartier buitensluiten. Dat is
-- de prijs, en hij is bewust betaald: de rem telt per account en niet per
-- afzender, want een `SECURITY DEFINER`-functie achter PostgREST ziet geen
-- betrouwbaar afzenderadres. Tien is daarom ruim — een mens die zich vertypt
-- komt er niet aan — en het blokkeren is tijdelijk en niet blijvend.
--
-- Wat de rem níet is: bescherming tegen iemand die duizend verschillende
-- accounts probeert met één veelgebruikt wachtwoord. Daar helpt alleen een
-- eis aan het wachtwoord zelf, en die staat al in `kal_registreren` op acht
-- tekens. Dat is weinig; het verhogen ervan is een apart besluit, want het
-- raakt de mensen die er al zijn.
--
-- TERUGDRAAIEN
--
--   drop table if exists public.kal_aanmeld_poging;
--   -- en daarna de vorige kal_aanmelden terugzetten; die staat in
--   -- gereedschap/verhuizing/schema-gegenereerd.sql (LEZEN, niet draaien)
--
-- Twee keer draaien verandert niets: de tabel staat op `if not exists` en een
-- functie vervangen is de gewone gang van zaken.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- BLOK 1 — WAAR DE POGINGEN IN STAAN
-- ---------------------------------------------------------------------------
--
-- Alleen de accountnaam en het moment. Geen wachtwoord, ook niet gehasht, en
-- geen afzender: wat je niet bewaart kan niet uitlekken. De tabel is bovendien
-- niet leesbaar voor anon — net als elke andere tabel hier.

create table if not exists public.kal_aanmeld_poging (
  account text not null,
  moment  timestamptz not null default now()
);

comment on table public.kal_aanmeld_poging is
  'Mislukte aanmeldpogingen per account, voor de rem in kal_aanmelden. Rijen ouder dan een uur worden bij elke aanmelding opgeruimd.';

create index if not exists kal_aanmeld_poging_zoek
  on public.kal_aanmeld_poging (account, moment desc);

alter table public.kal_aanmeld_poging enable row level security;
revoke all on public.kal_aanmeld_poging from anon, authenticated;


-- ---------------------------------------------------------------------------
-- BLOK 2 — AANMELDEN, MET DE REM EROP
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.kal_aanmelden(p_account text, p_ww text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_id      uuid;
  v_token   text;
  v_account text;
  v_mis     integer;
begin
  v_account := lower(trim(coalesce(p_account, '')));

  /* Opruimen bij elke aanmelding, zodat de tabel niet groeit. Een uur is ruim
     vier keer het venster van een kwartier. */
  delete from kal_aanmeld_poging where moment < now() - interval '1 hour';

  select count(*) into v_mis
    from kal_aanmeld_poging
   where account = v_account
     and moment > now() - interval '15 minutes';

  if v_mis >= 10 then
    /* Geen token, en met opzet dezelfde soort antwoord als bij een verkeerd
       wachtwoord: wie de rem voelt weet daarmee nog steeds niet of het account
       bestaat. */
    return jsonb_build_object('fout',
      'Te veel mislukte pogingen. Probeer het over een kwartier opnieuw.');
  end if;

  select id into v_id
    from kal_gebruikers
   where account = v_account
     and ww_hash = crypt(p_ww, ww_hash);

  if v_id is null then
    insert into kal_aanmeld_poging(account) values (v_account);
    /* Eén boodschap voor "bestaat niet" en voor "verkeerd wachtwoord", zoals
       het hiervoor ook was. Het verschil zou verklappen welke accounts er zijn. */
    return jsonb_build_object('fout', 'Onbekend account of verkeerd wachtwoord');
  end if;

  /* Gelukt: de teller van dit account gaat leeg. Wie zijn wachtwoord na negen
     pogingen alsnog goed heeft, begint morgen weer bij nul. */
  delete from kal_aanmeld_poging where account = v_account;

  delete from kal_sessies where verloopt_op < now();
  v_token := encode(gen_random_bytes(32), 'hex');
  insert into kal_sessies(token, gebruiker_id, verloopt_op)
  values (v_token, v_id, now() + interval '30 days');

  return jsonb_build_object('token', v_token, 'account', v_account);
end $function$;

COMMENT ON FUNCTION public.kal_aanmelden(text, text) IS
  'Meldt aan en geeft {token, account}, of {fout} bij een mislukking. Geeft met opzet geen exception: een exception draait de transactie terug en daarmee de vastgelegde poging, waardoor de rem nooit zou grijpen.';

GRANT EXECUTE ON FUNCTION public.kal_aanmelden(text, text) TO anon, authenticated;

COMMIT;


-- ---------------------------------------------------------------------------
-- BLOK 3 — NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- 1. Een verkeerd wachtwoord geeft een fout en géén token, en laat een poging
--    achter. Dat laatste is het hele punt.
--
--    select kal_aanmelden('bestaatniet', 'fout wachtwoord');
--    → {"fout": "Onbekend account of verkeerd wachtwoord"}
--    select count(*) from kal_aanmeld_poging where account = 'bestaatniet';
--    → 1
--
-- 2. Na tien pogingen slaat de rem aan.
--
--    select kal_aanmelden('bestaatniet','x') from generate_series(1,10);
--    select kal_aanmelden('bestaatniet','x')->>'fout';
--    → 'Te veel mislukte pogingen. Probeer het over een kwartier opnieuw.'
--
-- 3. En de rem geldt per account, niet voor iedereen.
--
--    select kal_aanmelden('iemandanders','x')->>'fout';
--    → 'Onbekend account of verkeerd wachtwoord'   (dus niet de remboodschap)
--
-- 4. Een geslaagde aanmelding veegt de teller schoon. Met je eigen account:
--
--    select kal_aanmelden('jouwaccount','jouwwachtwoord') ? 'token';
--    → t
--    select count(*) from kal_aanmeld_poging where account = 'jouwaccount';
--    → 0
