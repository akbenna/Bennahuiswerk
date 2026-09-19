-- ===========================================================================
-- 39 — EEN WACHTWOORD DAT STANDHOUDT
-- ===========================================================================
--
-- TOEGEPAST: nee. Draai dit bestand in de SQL-editor.
--
-- De eis stond op acht tekens, op vier plaatsen los van elkaar ingetikt:
-- `kal_registreren`, `kal_ww_wijzigen`, `kal_ww_herstellen` en één regel in
-- Instellingen.tsx. Bestand 32 noemde dat zelf al te weinig en schoof het
-- besluit voor zich uit, want het raakt de mensen die er al zijn.
--
-- WAT ACHT TEKENS WAARD ZIJN
--
-- De hashes zijn bcrypt met cost 10. Dat is gemeten en niet aangenomen: 17,4
-- hashes per seconde op één kern. Een aanvaller die de hashes heeft en
-- tienduizend keer sneller rekent doet 173.000 gokken per seconde, en dan
-- duurt uitputtend zoeken over alleen kleine letters:
--
--      8 tekens   26^8  = 2,1e11   14 dagen
--     10 tekens   26^10 = 1,4e14   26 jaar
--     12 tekens   26^12 = 9,5e16   17.000 jaar
--
-- Acht is dus te weinig en twaalf is ruim. Let op waar de winst ophoudt: bij
-- tien is bruut geweld al kansloos, en nóg langer eisen koopt niets meer.
--
-- EN DAAROM IS LENGTE NIET WAAR HET GEVAAR ZIT
--
-- Niemand kiest twaalf willekeurige letters. Iemand kiest `abdelkader2019` —
-- veertien tekens, en in een woordenboekaanval binnen een seconde gevonden.
-- Een lengte-eis alleen verplaatst het probleem; hij lost het niet op.
--
-- WAAROM DEZELFDE REGEL TWEE KEER BESTAAT
--
-- Hij staat ook in `src/health/wachtwoord.ts`. Dat is geen verdubbeling uit
-- slordigheid maar het gewone onderscheid: de browser geeft antwoord terwijl
-- je typt, de database bepaalt wat er gebeurt. Wie rechtstreeks een RPC doet
-- gaat langs het scherm heen, dus de echte regel hoort hier te staan.
--
-- Dat ze gelijk blijven is niet aan het toeval overgelaten: een proef in
-- `src/health/wachtwoord.proef.ts` leest dít bestand en vergelijkt de lijst
-- hieronder woord voor woord met die in de TypeScript. Lopen ze uit elkaar,
-- dan valt `npm run controle` om.
--
-- WAT HIER MET OPZET NIET STAAT
--
-- Geen eis aan hoofdletters, cijfers of leestekens. Die regel is niet neutraal
-- maar schadelijk: hij levert `Wachtwoord1!` op — precies de vorm die elke
-- aanvaller als eerste probeert — en hij maakt een lange zin, het enige dat
-- werkelijk helpt, onnodig lastig. NIST liet die eis in 2017 vallen.
--
-- WIE ER AL IS BLIJFT BINNENKOMEN
--
-- De regel geldt alleen bij het zétten van een wachtwoord, nooit bij het
-- aanmelden. `kal_aanmelden` kijkt niet naar lengte en dat blijft zo. Anders
-- sluit een strengere regel met terugwerkende kracht mensen buiten uit hun
-- eigen gegevens, en dat is precies het bezwaar dat bestand 32 opschreef.
--
-- TERUGDRAAIEN
--
--   drop function if exists public.kal_ww_klacht(text, text);
--   drop function if exists public.kal_ww_grondvorm(text);
--   drop function if exists public.kal_ww_ontdubbel(text);
--   drop table if exists public.kal_ww_veelgebruikt;
--
-- en dan de drie functies uit bestand 33 en de dump opnieuw draaien, want die
-- worden hieronder vervangen. De tabel mag weg met een `drop`: hij is hier
-- aangemaakt en er staat niets in wat een mens heeft ingevuld.
-- ===========================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- BLOK 1 — DE LIJST
-- ---------------------------------------------------------------------------
--
-- Wat hier staat is samengesteld uit wat er in gepubliceerde datalekken telkens
-- boven komt drijven. Het is géén geverifieerde top-duizend — die is van de
-- bouwomgeving niet te bereiken. De lijst is dus een ondergrens en geen bewijs:
-- wat erin staat wordt geweigerd, en wat er niet in staat is daarmee niet
-- goedgekeurd.
--
-- Hij mag klein zijn omdat `kal_ww_grondvorm` het zware werk doet: een lijst
-- van korte wachtwoorden bijt daardoor ook op de lange varianten ervan.

create table if not exists public.kal_ww_veelgebruikt (
  woord text primary key
);

comment on table public.kal_ww_veelgebruikt is
  'Wachtwoorden die te vaak gekozen worden. Kleine letters en cijfers, zonder leestekens: de vergelijking gaat via kal_ww_grondvorm.';

alter table public.kal_ww_veelgebruikt enable row level security;
revoke all on public.kal_ww_veelgebruikt from anon, authenticated;

-- `do nothing`, nooit `do update`: twee keer draaien voegt niets toe en haalt
-- niets weg. Wie de lijst later vervangt door een echte top-duizend hoeft
-- alleen hier rijen bij te zetten.
insert into public.kal_ww_veelgebruikt(woord) values
  ('aanmelden'), ('abcabcabc'), ('admin'), ('ajax'), ('amanda'),
  ('amsterdam'), ('andrew'), ('angel'), ('arsenal'), ('ashley'), ('autumn'),
  ('azerty'), ('banana'), ('barcelona'), ('baseball'), ('batman'),
  ('bloemetje'), ('buster'), ('changemeplease'), ('charlie'), ('cheese'),
  ('chelsea'), ('chocolate'), ('computer'), ('cookie'),
  ('correcthorsebatterystaple'), ('corvette'), ('daniel'), ('diamond'),
  ('ditiseenwachtwoord'), ('ditismijnwachtwoord'), ('dokter'), ('dragon'),
  ('eenlangwachtwoord'), ('eten'), ('facebook'), ('family'), ('ferrari'),
  ('feyenoord'), ('flower'), ('football'), ('forever'), ('freedom'),
  ('friend'), ('geheim'), ('geheimgeheim'), ('gewicht'), ('gezin'),
  ('gezondheid'), ('ginger'), ('google'), ('guest'), ('hannah'), ('harley'),
  ('heaven'), ('hockey'), ('holland'), ('hondje'), ('huiswerk'), ('hunter'),
  ('ilovemyfamily'), ('iloveyou'), ('iloveyouiloveyou'), ('inloggen'),
  ('internet'), ('jasmine'), ('jennifer'), ('jessica'), ('jordan'),
  ('joshua'), ('juventus'), ('killer'), ('konijn'), ('kusje'),
  ('langwachtwoord'), ('lekker'), ('letmein'), ('letmeinletmein'),
  ('liefde'), ('lievelings'), ('liverpool'), ('login'), ('maggie'),
  ('master'), ('matthew'), ('mercedes'), ('michael'), ('mijnwachtwoord'),
  ('moeder'), ('monkey'), ('mypasswordis'), ('nederland'), ('nicole'),
  ('nieuwwachtwoord'), ('oma'), ('opa'), ('orange'), ('oranje'), ('passwd'),
  ('password'), ('passwordpassword'), ('pepper'), ('poesje'), ('pokemon'),
  ('porsche'), ('princess'), ('psv'), ('purple'), ('qwerty'),
  ('qwertyqwerty'), ('qwertz'), ('ranger'), ('robert'), ('root'),
  ('rotterdam'), ('samsung'), ('schatje'), ('school'), ('secret'),
  ('shadow'), ('silver'), ('soccer'), ('spring'), ('starwars'),
  ('sterkwachtwoord'), ('summer'), ('sunshine'), ('superman'),
  ('temporarypassword'), ('thisismypassword'), ('thomas'), ('tigger'),
  ('trustno'), ('trustnoone'), ('united'), ('vader'), ('vakantie'),
  ('veiligwachtwoord'), ('voetbal'), ('vriend'), ('wachtwoord'),
  ('wachtwoorden'), ('wachtwoordisgeheim'), ('wachtwoordwachtwoord'),
  ('welcome'), ('welkom'), ('welkomwelkom'), ('whatever'), ('winter'),
  ('yellow'), ('zaq'), ('zidane'), ('ziekenhuis'), ('zomer'), ('zonnetje')
on conflict do nothing;


-- ---------------------------------------------------------------------------
-- BLOK 2 — DE GRONDVORM
-- ---------------------------------------------------------------------------
--
-- Waarom een blokkeerlijst naast een eis van twaalf tekens niet zinloos is.
--
-- `password` is acht tekens en `123456` zes, dus die vallen al af op lengte.
-- Wat overblijft is juist het gevaar: `password1234`, `Passw0rd!!!!`,
-- `passwordpassword`. Twaalf tekens, en alle drie staan ze boven aan elke lijst
-- die ooit uit een datalek kwam.
--
-- Daarom toetst de lijst niet op het wachtwoord zelf maar op wat eronder zit:
-- kleine letters, cijferspelling teruggedraaid, leestekens eruit, een aangeplakt
-- jaartal eraf, en een herhaald stuk tot één keer teruggebracht.

create or replace function public.kal_ww_ontdubbel(p_tekst text)
 returns text
 language plpgsql
 immutable
 set search_path to 'public'
as $function$
declare v_lengte integer; v_stuk text;
begin
  /* `abcabcabc` → `abc`. Alleen als het hele woord een heel aantal keer
     hetzelfde stuk is: `passwordpassword` is niet twee keer zo sterk als
     `password`, het is precies even zwak. */
  for v_lengte in 1 .. length(p_tekst) / 2 loop
    if length(p_tekst) % v_lengte = 0 then
      v_stuk := substr(p_tekst, 1, v_lengte);
      if repeat(v_stuk, length(p_tekst) / v_lengte) = p_tekst then
        return v_stuk;
      end if;
    end if;
  end loop;
  return p_tekst;
end $function$;

create or replace function public.kal_ww_grondvorm(p_ww text)
 returns text[]
 language plpgsql
 immutable
 set search_path to 'public'
as $function$
declare
  v_klein   text := lower(coalesce(p_ww, ''));
  v_uit     text[] := '{}';
  v_vorm    text;
  v_letters text;
begin
  /* HET UITROEPTEKEN STAAT MET OPZET NIET IN DE OMKERING
     Als leet voor een `i` bestaat het, maar als opvulling achteraan komt het
     veel vaker voor — en dan is vertalen schadelijk. Stond het erin, dan werd
     `p4ssw0rd!!!!` de grondvorm `passwordiiii`, dat in geen enkele lijst staat,
     en glipte het er juist doorheen. Nu valt het als leesteken weg.

     De `1` kan een `i` of een `l` zijn en welke het is verschilt per woord —
     `passw1rd` bestaat niet, `adm1n` wel. Daarom allebei de lezingen. */
  foreach v_vorm in array array[
    v_klein,
    translate(v_klein, '4@310578$', 'aaeiostbs'),
    translate(v_klein, '4@310578$', 'aaelostbs')
  ] loop
    v_letters := regexp_replace(v_vorm, '[^a-z0-9]', '', 'g');
    if v_letters <> '' then
      v_uit := v_uit || v_letters;
      /* Alleen achteraan het getal eraf: `1password` is een ander woord en
         geen versiering. */
      v_uit := v_uit || regexp_replace(v_letters, '\d+$', '');
      v_uit := v_uit || kal_ww_ontdubbel(v_letters);
      v_uit := v_uit || kal_ww_ontdubbel(regexp_replace(v_letters, '\d+$', ''));
    end if;
  end loop;
  return array(select distinct u from unnest(v_uit) u where u <> '');
end $function$;


create or replace function public.kal_ww_rijlengte(p_ww text)
 returns integer
 language plpgsql
 immutable
 set search_path to 'public'
as $function$
declare
  v_rijen  text[] := array[
    'abcdefghijklmnopqrstuvwxyz',
    '0123456789',
    'qwertyuiop',
    'asdfghjkl',
    'zxcvbnm',
    'qazwsxedcrfvtgbyhnujmikolp'
  ];
  v_klein   text := lower(coalesce(p_ww, ''));
  v_rij     text;
  v_richting text;
  v_langste integer := 1;
  v_lopend  integer;
  v_vorige  integer;
  v_nu      integer;
  i         integer;
begin
  /* `123456789012` is twaalf tekens en valt dus niet af op lengte. `qwertyuiopas`
     ook niet, en `abcdefghijkl` ook niet. Dat zijn geen wachtwoorden maar
     handbewegingen, en ze staan in elke aanvalslijst die er is.

     Achterstevoren telt mee: terugtypen is even makkelijk als vooruit. */
  foreach v_rij in array v_rijen loop
    foreach v_richting in array array[v_rij, reverse(v_rij)] loop
      v_lopend := 1;
      for i in 2 .. greatest(length(v_klein), 1) loop
        v_vorige := position(substr(v_klein, i - 1, 1) in v_richting);
        v_nu     := position(substr(v_klein, i, 1) in v_richting);
        if v_vorige > 0 and v_nu = v_vorige + 1 then
          v_lopend := v_lopend + 1;
        else
          v_lopend := 1;
        end if;
        if v_lopend > v_langste then v_langste := v_lopend; end if;
      end loop;
    end loop;
  end loop;
  return v_langste;
end $function$;


-- ---------------------------------------------------------------------------
-- BLOK 3 — DE KLACHT
-- ---------------------------------------------------------------------------
--
-- Eén klacht tegelijk, en in deze volgorde: eerst wat je zelf ziet (te kort),
-- dan wat je zelf kunt bedenken (je eigen naam erin), dan wat je niet kunt weten
-- (het staat in een lijst). Wie drie klachten tegelijk krijgt leest er geen van.
--
-- Geeft null terug als er niets mis is. Dat is de enige uitkomst die doorlaat.

create or replace function public.kal_ww_klacht(p_ww text, p_account text default '')
 returns text
 language plpgsql
 stable
 set search_path to 'public'
as $function$
declare
  v_ww           text := coalesce(p_ww, '');
  v_klein        text := lower(coalesce(p_ww, ''));
  v_naam         text := lower(trim(coalesce(p_account, '')));
  v_verschillend integer;
  v_rij          integer;
begin
  if length(v_ww) < 12 then
    return 'Kies een wachtwoord van minstens 12 tekens';
  end if;

  /* Drie tekens is te kort om iets te betekenen: wie "ali" heet mag
     "kwaliteit" gebruiken. Vanaf vier wordt het een aanwijzing. */
  if length(v_naam) >= 4 and position(v_naam in v_klein) > 0 then
    return 'Je accountnaam staat erin — dat raadt iemand meteen';
  end if;

  select count(distinct c) into v_verschillend
    from regexp_split_to_table(v_klein, '') c;
  if v_verschillend < 5 then
    return 'Te weinig verschillende tekens — dit is een patroon, geen wachtwoord';
  end if;

  v_rij := kal_ww_rijlengte(v_klein);
  if v_rij * 2 > length(v_ww) then
    return 'Dit loopt in een rechte lijn over het toetsenbord';
  end if;

  if exists (select 1 from kal_ww_veelgebruikt
              where woord = any (kal_ww_grondvorm(v_ww))) then
    return 'Dit lijkt te veel op een wachtwoord dat heel veel mensen kiezen';
  end if;

  return null;
end $function$;

comment on function public.kal_ww_klacht(text, text) is
  'Wat er mis is met dit wachtwoord, of null. De regel staat ook in src/health/wachtwoord.ts; een proef bewaakt dat ze gelijk blijven.';


-- ---------------------------------------------------------------------------
-- BLOK 4 — DE DRIE PLAATSEN WAAR EEN WACHTWOORD GEZET WORDT
-- ---------------------------------------------------------------------------
--
-- Alle drie krijgen dezelfde regel, en verder verandert er niets aan ze. De
-- bodies hieronder zijn die uit bestand 33 en uit de dump, met precies één
-- blok vervangen: de losse lengtetoets wordt een aanroep van `kal_ww_klacht`.
--
-- Een functie vervangen is de gewone gang van zaken — functies zijn code en
-- geen inhoud, en `create or replace` raakt geen enkele rij aan.
--
-- `kal_registreren` blijft gooien waar de andere twee `{fout}` teruggeven. Dat
-- verschil is geen slordigheid maar staat uitgelegd in toestand.ts: aanmelden
-- en herstellen houden een teller van mislukte pogingen bij, en een exception
-- zou die teller mee terugdraaien. Registreren heeft geen teller, dus daar mag
-- het. De client vangt hem al op en laat de boodschap zien.

CREATE OR REPLACE FUNCTION public.kal_registreren(p_account text, p_ww text, p_naam text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_id uuid; v_token text; v_klacht text;
begin
  v_klacht := kal_ww_klacht(p_ww, p_account);
  if v_klacht is not null then
    raise exception '%', v_klacht;
  end if;
  insert into kal_gebruikers(account, ww_hash, weergavenaam)
  values (lower(trim(p_account)), crypt(p_ww, gen_salt('bf', 10)), p_naam)
  returning id into v_id;
  v_token := encode(gen_random_bytes(32), 'hex');
  insert into kal_sessies(token, gebruiker_id, verloopt_op)
  values (v_token, v_id, now() + interval '30 days');
  return jsonb_build_object('token', v_token, 'account', lower(trim(p_account)));
exception when unique_violation then
  raise exception 'Dat account bestaat al';
end $function$;


CREATE OR REPLACE FUNCTION public.kal_ww_wijzigen(
  p_token text, p_oud text, p_nieuw text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_id uuid; v_account text; v_token text; v_klacht text;
begin
  v_id := kal_sessie(p_token);

  /* De accountnaam halen we hier op vóór de toets, want `kal_ww_klacht` wil
     weten hoe je heet om te zien of het erin staat. */
  select account into v_account from kal_gebruikers where id = v_id;

  v_klacht := kal_ww_klacht(p_nieuw, v_account);
  if v_klacht is not null then
    return jsonb_build_object('fout', v_klacht);
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
  v_klacht  text;
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

  v_klacht := kal_ww_klacht(p_nieuw, v_account);
  if v_klacht is not null then
    return jsonb_build_object('fout', v_klacht);
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

COMMIT;
