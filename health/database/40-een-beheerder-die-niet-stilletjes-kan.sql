-- ===========================================================================
-- 40 — EEN BEHEERDER DIE HET NIET STILLETJES KAN
-- ===========================================================================
--
-- TOEGEPAST: nee. Draai dit bestand in de SQL-editor, ná bestand 39.
--
-- Het probleem staat al beschreven in de kop van bestand 33: wie zijn wachtwoord
-- kwijt is én zijn herstelcode niet bewaard heeft, komt er niet meer in. Dat is
-- bij een gezin het waarschijnlijke geval, want niemand bewaart codes.
--
-- Datzelfde bestand noemde ook de aanvulling die dat wél dekt — een beheerder
-- die voor een ander kan herstellen — en zette er meteen het bezwaar bij:
--
--     "het betekent dat één account bij de gegevens van een ander kan"
--
-- Dat bezwaar staat wat mij betreft nog steeds. Daarom doet dit bestand het
-- ánders dan de gezinsapp.
--
-- WAT DE GEZINSAPP DOET, EN WAAROM DAT HIER NIET KAN
--
-- `bennahub_lid_reset` zet de hash van een kind op null; het kind kiest bij de
-- volgende aanmelding zelf een nieuwe code. Dat werkt daar omdat het om een kind
-- binnen één gezin gaat, aan één tafel, op één tablet.
--
-- Hier zou het een gat zijn. Een lege hash betekent "de eerstvolgende die deze
-- accountnaam intikt mag het wachtwoord zetten", en BennaHealth-accounts staan
-- op het open internet. Wie de naam kent neemt het account over.
--
-- WAT DIT BESTAND WÉL DOET
--
-- De beheerder maakt een herstelcode vóór een ander, en geeft die door. Diegene
-- zet er zelf een nieuw wachtwoord mee via het scherm dat er al is.
--
-- WAT DIT NIET OPLOST, EN DAT HOORT ER METEEN BIJ TE STAAN
--
-- Hier stond eerst dat de beheerder "geen enkel gegeven van een ander opent".
-- Dat was niet waar, en het is bewezen niet waar: de beheerder maakt de code en
-- heeft hem dus zelf in handen. Niets houdt hem tegen om hem zélf in te wisselen
-- op `kal_ww_herstellen`, een wachtwoord te zetten dat hij kent, en als die ander
-- in te loggen. Tegen een echte database gedraaid geeft dat gewoon een token.
--
-- Dat is geen fout in dit ontwerp maar een eigenschap van het probleem. Wie een
-- wachtwoord van een ander kan terugzetten, kan dat account overnemen — bij de
-- gezinsapp net zo goed, en bij elke helpdesk ter wereld ook. Er is in deze app
-- geen e-mail en geen tweede kanaal, dus de beheerder ís de koerier. Wie de
-- code overbrengt heeft hem gezien.
--
-- Het bezwaar uit bestand 33 blijft dus overeind, en het antwoord erop is niet
-- "dat kan niet gebeuren" maar "dat kan niet stilletjes gebeuren":
--
--   * het slachtoffer merkt het onmiddellijk. Zijn eigen wachtwoord werkt niet
--     meer en al zijn sessies zijn eruit gegooid — dat doet `kal_ww_herstellen`.
--     Overname zonder dat de ander het doorheeft is er niet bij.
--   * blok 3 schrijft elke uitgifte weg: wie, voor wie, wanneer. Een beheerder
--     kan het dus doen, maar niet ontkennen.
--   * er staat geen enkel account open voor de eerste de beste. Dát is het
--     werkelijke verschil met de aanpak van de gezinsapp: een lege hash betekent
--     "wie deze naam intikt mag het wachtwoord zetten", en dat is op het open
--     internet een gat. Een code van honderd bits is dat niet.
--
-- Wat er verder overeind blijft:
--
--   * de code is eenmalig en vervalt bij gebruik, net als een eigen code.
--   * `kal_ww_herstellen` verandert niet en houdt zijn rem. Deze weg is dus geen
--     omweg om de rem heen, want hij komt uit op precies dezelfde functie.
--   * de beheerder moet telkens zijn eigen wachtwoord intikken. Een gestolen
--     token alleen is niet genoeg.
--
-- Kortom: geef de vlag aan wie je ook je reservesleutel zou geven, en aan
-- niemand anders. Dat is de werkelijke grens, en die staat niet in code.
--
-- HET WACHTWOORD VAN DE BEHEERDER WORDT GEVRAAGD
--
-- Net als bij `kal_herstelcode_maken`, en om dezelfde reden: een token ligt
-- dertig dagen in localStorage. Wie dat steelt mag daarmee geen ingang naar
-- andermans account kunnen openen.
--
-- WIE BEHEERDER IS, IS EEN HANDMATIG BESLUIT
--
-- Er komt geen scherm om iemand beheerder te maken. De vlag gaat met de hand
-- aan, in de SQL-editor, door iemand die bij de database kan. Een knop ervoor
-- zou betekenen dat een beheerder er meer kan bijmaken, en dan is één gestolen
-- sessie genoeg om de hele regeling om te draaien.
--
-- TERUGDRAAIEN
--
--   drop function if exists public.kal_herstelcode_voor(text, text, text);
--   drop table if exists public.kal_herstel_log;
--   alter table public.kal_gebruikers drop column if exists beheerder;
--
-- De kolom mag weg: hij is hier aangemaakt. Wie hem later opnieuw aanzet moet
-- de beheerders opnieuw aanwijzen, en dat is maar goed ook.
-- ===========================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- BLOK 1 — DE VLAG
-- ---------------------------------------------------------------------------

alter table public.kal_gebruikers
  add column if not exists beheerder boolean not null default false;

comment on column public.kal_gebruikers.beheerder is
  'Mag een herstelcode maken voor een ander. Gaat met de hand aan; zie 40-een-beheerder-die-niet-stilletjes-kan.sql.';


-- ---------------------------------------------------------------------------
-- BLOK 2 — HET LOGBOEK
-- ---------------------------------------------------------------------------
--
-- Voorkomen kan niet, ontkennen wel. Wie een code voor een ander maakt, laat
-- hier een regel achter: wie, voor wie, wanneer. Dat is het enige wat een
-- beheerdersrecht draaglijk maakt zonder e-mail of tweede kanaal.
--
-- Er staat met opzet geen code in, ook niet gehasht. De code zelf hoort maar op
-- één plek te staan — `kal_gebruikers.herstel_hash` — en daar verdwijnt hij bij
-- gebruik. Een logboek dat codes bewaart zou de uitgifte juist gevaarlijker
-- maken dan hij is.
--
-- Geen `delete`-recht, ook niet voor de functie: de tabel is alleen aan te
-- vullen. Dat is niet waterdicht — wie bij de database kan, kan alles — maar het
-- betekent dat het wissen van een spoor een handeling is die je moet wíllen.

create table if not exists public.kal_herstel_log (
  id            bigint generated always as identity primary key,
  beheerder_id  uuid not null,
  doel_id       uuid not null,
  doel_account  text not null,
  moment        timestamptz not null default now()
);

comment on table public.kal_herstel_log is
  'Welke beheerder wanneer een herstelcode voor wie maakte. Bevat geen codes. Alleen aanvullen.';

create index if not exists kal_herstel_log_doel
  on public.kal_herstel_log (doel_id, moment desc);

alter table public.kal_herstel_log enable row level security;
revoke all on public.kal_herstel_log from anon, authenticated;


-- ---------------------------------------------------------------------------
-- BLOK 3 — EEN CODE VOOR EEN ANDER
-- ---------------------------------------------------------------------------

create or replace function public.kal_herstelcode_voor(
  p_token text, p_ww text, p_account text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare
  /* Hetzelfde alfabet en dezelfde vorm als `kal_herstelcode_maken`, want de
     code komt uit op dezelfde `kal_ww_herstellen` die vier groepen van vijf
     verwacht. Tweeëndertig tekens zonder I, O, nul en één: die worden
     overgeschreven als elkaar. Precies tweeëndertig, dus vijf bits per teken en
     geen modulo-scheefheid. Twintig tekens is honderd bits. */
  c_alfabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_id     uuid;
  v_doel   uuid;
  v_naam   text;
  v_ruw    bytea;
  v_code   text := '';
  i        integer;
begin
  v_id   := kal_sessie(p_token);
  v_naam := lower(trim(coalesce(p_account, '')));

  /* Met opzet óók het wachtwoord, en niet alleen het token. Zie de kop. */
  if not exists (select 1 from kal_gebruikers
                  where id = v_id and ww_hash = crypt(p_ww, ww_hash)
                    and beheerder) then
    /* Eén boodschap voor twee gevallen — geen beheerder, of het wachtwoord
       klopt niet. Het verschil zou verklappen wie beheerder is. */
    return jsonb_build_object('fout', 'Dat mag niet met dit wachtwoord');
  end if;

  select id into v_doel from kal_gebruikers where account = v_naam;
  if v_doel is null then
    return jsonb_build_object('fout', 'Dat account bestaat niet');
  end if;

  /* Voor jezelf bestaat `kal_herstelcode_maken` al, en die weg is de juiste:
     deze functie hoort niet stilletjes ook je eigen code te vervangen. */
  if v_doel = v_id then
    return jsonb_build_object('fout', 'Voor jezelf gebruik je "Herstelcode maken"');
  end if;

  v_ruw := gen_random_bytes(20);
  for i in 0..19 loop
    if i > 0 and i % 5 = 0 then v_code := v_code || '-'; end if;
    v_code := v_code || substr(c_alfabet, (get_byte(v_ruw, i) % 32) + 1, 1);
  end loop;

  update kal_gebruikers
     set herstel_hash = crypt(v_code, gen_salt('bf', 10)),
         herstel_gemaakt_op = now()
   where id = v_doel;

  /* Vastleggen vóór teruggeven, in dezelfde transactie. Zou het andersom staan,
     dan kon een mislukte schrijfactie een code opleveren die nergens staat. */
  insert into kal_herstel_log(beheerder_id, doel_id, doel_account)
  values (v_id, v_doel, v_naam);

  /* De enige keer dat deze code de database verlaat. Er staat met opzet geen
     token in dit antwoord — maar wie hem doorgeeft heeft hem gezien, en kan hem
     dus ook zelf inwisselen. Zie de kop: dat is geen gat maar de aard van het
     probleem, en daarom staat het in het logboek hierboven. */
  return jsonb_build_object('code', v_code, 'account', v_naam);
end $function$;

comment on function public.kal_herstelcode_voor(text, text, text) is
  'Maakt een eenmalige herstelcode voor een ander account. Alleen voor een beheerder, en alleen met diens eigen wachtwoord. Let op: wie de code maakt kan hem ook zelf inwisselen — elke uitgifte staat daarom in kal_herstel_log.';

grant execute on function public.kal_herstelcode_voor(text, text, text) to anon, authenticated;

COMMIT;


-- ===========================================================================
-- NAKIJKEN
-- ===========================================================================
--
-- 1. Wijs jezelf aan als beheerder. Dit is de handmatige stap, en met opzet de
--    enige manier waarop de vlag aangaat:
--
--      update kal_gebruikers set beheerder = true where account = 'abdelkader';
--
--    Verwacht: UPDATE 1. Komt er UPDATE 0, dan bestaat dat account niet.
--
-- 2. Wie zijn er nu beheerder? Houd dit kort — het is een lijst die je moet
--    kunnen overzien.
--
--      select account, beheerder from kal_gebruikers order by beheerder desc, account;
--
-- 3. Een code maken voor een ander. Vervang het token door een echt token uit
--    localStorage (sleutel `kalibratie.sessie`):
--
--      select kal_herstelcode_voor('<token>', '<jouw wachtwoord>', '<de ander>');
--
--    Verwacht: {"code": "XXXXX-XXXXX-XXXXX-XXXXX", "account": "<de ander>"}.
--
-- 4. En de vier manieren waarop het hoort te weigeren. Alle vier horen een
--    `fout` te geven en géén code:
--
--      select kal_herstelcode_voor('<token>', 'verkeerd', '<de ander>');
--        → "Dat mag niet met dit wachtwoord"
--      select kal_herstelcode_voor('<token van een niet-beheerder>', '<ww>', '<de ander>');
--        → "Dat mag niet met dit wachtwoord"   (zelfde tekst, met opzet)
--      select kal_herstelcode_voor('<token>', '<jouw wachtwoord>', 'bestaatniet');
--        → "Dat account bestaat niet"
--      select kal_herstelcode_voor('<token>', '<jouw wachtwoord>', '<jijzelf>');
--        → "Voor jezelf gebruik je ..."
--
-- 5. De code hoort bij één account en niet bij dat van de beheerder. Neem de
--    code uit stap 3 en probeer er mee te herstellen op je eigen account:
--
--      select kal_ww_herstellen('<jouw account>', '<die code>', 'zeilbootkaravaan');
--
--    Verwacht: {"fout": "Die combinatie klopt niet"}. Komt hier een token uit,
--    dan klopt er iets niet en moet dit bestand teruggedraaid worden.
--
--    Let op wat dit wél en niet zegt. Het zegt niet dat een beheerder er niet in
--    kan: hij heeft de code van die ánder en kan die zelf inwisselen. Zie de kop.
--    Wat het zegt is dat een code niet op een willekeurig account past.
--
-- 6. Het spoor. Elke uitgifte hoort hier te staan, en dit is de enige reden dat
--    een beheerdersrecht draaglijk is:
--
--      select l.moment, b.account as door, l.doel_account as voor
--        from kal_herstel_log l join kal_gebruikers b on b.id = l.beheerder_id
--       order by l.moment desc limit 20;
--
--    Verwacht: één regel per geslaagde uitgifte uit stap 3, en géén regels voor
--    de geweigerde pogingen uit stap 4. Staat er een regel die jij niet hebt
--    gemaakt, dan heeft een beheerder een code voor iemand aangevraagd — en dan
--    is dat een gesprek en geen bug.
-- ===========================================================================
