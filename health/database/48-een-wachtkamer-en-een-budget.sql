-- ===========================================================================
-- 48: EEN WACHTKAMER EN EEN BUDGET
-- ===========================================================================
--
-- TOEGEPAST: nog niet. Dit bestand is een verslag vooraf, en pas na het draaien
-- klopt het met de database. Draai daarna `node gereedschap/md5-verslag.mjs
-- --schrijf`, anders valt `src/health/dbverslag.proef.ts` om.
--
-- WAAROM DIT BESTAND ER IS
--
-- De app gaat naar testers. Tot vandaag stond `kal_registreren` wagenwijd open:
-- wie de URL had maakte een account en mocht meteen dertig AI-aanroepen per uur
-- doen op de Anthropic-sleutel van de eigenaar. Dat is geen theoretisch lek maar
-- de rekening van één mens.
--
-- Er komt dus een wachtkamer, en de AI krijgt een budget per persoon: een
-- proefrit op de sleutel van de eigenaar, en daarna je eigen sleutel.
--
-- WAT DIT BESTAND MET OPZET NIET DOET
--
-- Het vervangt geen enkele bestaande functie. `kal_sessie`, `kal_aanmelden` en
-- `kal_registreren` blijven precies zoals ze zijn.
--
-- Bij `kal_aanmelden` is dat een keuze: de rem op het raden houdt een teller bij
-- en die functie is te kostbaar om langs te lopen voor iets wat ook ernaast kan.
-- Bij `kal_sessie` is het geen keuze maar een grens: zijn brontekst staat niet in
-- deze repo (zie de kop van bestand 47, hij is één van de negen), en een functie
-- vervangen die je niet kunt nalezen is hem overschrijven met een gok.
--
-- DAT HEEFT EEN GEVOLG DAT OP HET SCHERM HOORT TE STAAN
--
-- De AI-poort is echt: hij ligt in `kal_ai_toegestaan`, de edge function roept
-- hem aan met de service-role-sleutel, en daar komt niemand omheen. Dat is de
-- poort die geld kost, en die zit dicht.
--
-- De afwijzing is géén slot. Wie is afgewezen krijgt in de app een scherm te
-- zien in plaats van de app, en dat scherm is precies dat: een scherm. Wie de
-- RPC's rechtstreeks aanroept komt nog steeds bij zijn eigen gegevens. Dat is te
-- verdedigen, want het zijn zijn eigen gegevens en niet die van een ander, maar
-- het is iets anders dan een slot en het hoort niet als slot beschreven te
-- worden.
--
-- Een echt slot vraagt een regel in `kal_sessie`. Die komt er zodra die functie
-- op papier staat.
--
-- ===========================================================================
-- DE TRUC MET DE STANDAARDWAARDE
-- ===========================================================================
--
-- Twee kolommen krijgen eerst een standaard die bij de bestaande rijen past, en
-- daarna een andere voor wie nog komt. Dat is geen slimmigheid om de
-- slimmigheid: een kolom toevoegen vult alle bestaande rijen met de standaard,
-- en zou die standaard meteen 'wacht' zijn, dan stond het gezin buiten zijn
-- eigen app. Zou het budget meteen op honderd staan, dan had de eigenaar sinds
-- vandaag een limiet die hij nooit heeft gekozen.
--
-- Dus: erin met de ruime waarde, daarna de standaard verschuiven. Wie er al in
-- zit merkt niets, wie zich morgen aanmeldt komt in de wachtkamer.
--
-- `aangemaakt_op` bestaat al op deze tabel en is precies de aanmelddatum, dus
-- daar komt geen kolom bij.
-- ===========================================================================

alter table public.kal_gebruikers
  add column if not exists status           text    not null default 'toegelaten',
  add column if not exists ai_budget_maand  integer not null default 100000,
  add column if not exists beoordeeld_op    timestamptz,
  add column if not exists beoordeeld_door  uuid,
  add column if not exists notitie          text;

alter table public.kal_gebruikers alter column status          set default 'wacht';
-- Vijfentwintig en niet honderd: dit is een proefrit en geen abonnement. Een
-- herkenning kost rond de vier dollarcent, dus vijfentwintig is ongeveer een
-- dollar per tester en genoeg om een paar dagen te ervaren wat het model met
-- een foto van je bord doet. Wie daarna verder wil, geeft zijn eigen sleutel op.
alter table public.kal_gebruikers alter column ai_budget_maand set default 25;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'kal_status_kent_drie') then
    alter table public.kal_gebruikers
      add constraint kal_status_kent_drie
      check (status in ('wacht', 'toegelaten', 'afgewezen'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'kal_budget_niet_negatief') then
    alter table public.kal_gebruikers
      add constraint kal_budget_niet_negatief
      check (ai_budget_maand >= 0);
  end if;
end $$;

comment on column public.kal_gebruikers.status is
  'wacht, toegelaten of afgewezen. Alleen toegelaten mag de AI gebruiken. '
  'Wie wacht kan de app wel gebruiken: wegen, loggen, figuren. Zie bestand 48.';
comment on column public.kal_gebruikers.ai_budget_maand is
  'Aantal AI-aanroepen per kalendermaand. Niet in euro: kal_ai_log.kosten_usd '
  'rekent met een vast Sonnet-tarief en klopt niet zodra er een ander model '
  'draait. Aanroepen tellen is wel altijd waar.';
comment on column public.kal_gebruikers.notitie is
  'Vrije aantekening van de beheerder bij deze tester. Geen gegeven van de '
  'gebruiker zelf en niet zichtbaar voor hem.';

create index if not exists kal_ai_log_gebruiker_maand
  on public.kal_ai_log (gebruiker_id, created_at desc);

-- ===========================================================================
-- DE POORT DIE GELD KOST
-- ===========================================================================
--
-- Eén functie, en de edge function stelt haar precies één vraag: mag deze
-- gebruiker nu een aanroep doen. Het antwoord draagt zijn eigen reden mee, want
-- "nee" is hier drie verschillende dingen en de gebruiker hoort te weten welke:
-- je wacht nog op toelating, je bent afgewezen, of je maand is op.
--
-- Twee remmen naast elkaar, en dat is met opzet. De maand begrenst wat het
-- kost, het uur begrenst wat een lek kan aanrichten voordat iemand het merkt.
-- Eén rem van duizend per maand laat een losgeslagen script op één avond
-- duizend aanroepen doen; dat is binnen budget en toch fout.
--
-- Alleen geslaagde aanroepen tellen mee voor de maand. Een mislukking heeft
-- meestal wel tokens gekost, maar wie zijn budget kwijtraakt aan storingen aan
-- deze kant krijgt een rekening voor mijn fout. Voor de rem per uur tellen ze
-- wél mee, want dáár gaat het niet om kosten maar om een hollende aanroeper.
-- ===========================================================================

create or replace function public.kal_ai_toegestaan(p_gebruiker uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare
  v_status  text;
  v_budget  integer;
  v_maand   integer;
  v_uur     integer;
begin
  select status, ai_budget_maand into v_status, v_budget
    from kal_gebruikers where id = p_gebruiker;

  if v_status is null then
    return jsonb_build_object('mag', false, 'reden', 'onbekend');
  end if;

  select count(*) into v_maand from kal_ai_log
   where gebruiker_id = p_gebruiker
     and gelukt
     and created_at >= date_trunc('month', now());

  select count(*) into v_uur from kal_ai_log
   where gebruiker_id = p_gebruiker
     and created_at >= now() - interval '1 hour';

  return jsonb_build_object(
    'mag', v_status = 'toegelaten' and v_maand < v_budget and v_uur < 30,
    'reden', case
      when v_status = 'wacht'      then 'wacht'
      when v_status = 'afgewezen'  then 'afgewezen'
      when v_maand >= v_budget     then 'maand-op'
      when v_uur >= 30             then 'uur-vol'
      else 'goed' end,
    'status', v_status,
    'gebruikt', v_maand,
    'budget', v_budget,
    'uur', v_uur);
end $function$;

-- Deze functie is voor de edge function en voor niemand anders. Hij zegt van
-- een willekeurige uuid hoeveel die verbruikt heeft, en dat is niets voor de
-- open kant van de wereld.
revoke all on function public.kal_ai_toegestaan(uuid) from public, anon, authenticated;
grant execute on function public.kal_ai_toegestaan(uuid) to service_role;

-- ===========================================================================
-- WAT DE GEBRUIKER OVER ZICHZELF MAG WETEN
-- ===========================================================================
--
-- Alles. Dit is de tegenhanger van de poort hierboven: dezelfde getallen, maar
-- opgevraagd met je eigen sessietoken en dus alleen over jezelf.
--
-- Hij staat er omdat een app die "dit kan nu even niet" zegt een slechte app
-- is. Wie wacht hoort te lezen dat hij wacht, en wie door zijn maand heen is
-- hoort te zien hoeveel hij had en wanneer de teller terugspringt.
-- ===========================================================================

create or replace function public.kal_mijn_toegang(p_token text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare v_id uuid; v_uit jsonb; v_beheerder boolean;
begin
  v_id := kal_sessie(p_token);
  v_uit := kal_ai_toegestaan(v_id);
  select beheerder into v_beheerder from kal_gebruikers where id = v_id;
  return v_uit
    || jsonb_build_object(
         'beheerder', coalesce(v_beheerder, false),
         'maand_tot', (date_trunc('month', now()) + interval '1 month')::date);
end $function$;

-- ===========================================================================
-- DE BEHEERDER
-- ===========================================================================
--
-- Twee functies, en ze volgen de lijn van bestand 40: de grens ligt hier en
-- niet op het scherm, en de weigering zegt niet wat er precies mis was.
--
-- WAT DE LIJST WEL EN NIET TERUGGEEFT
--
-- Naam, status, wanneer aangemeld, wanneer beoordeeld, en wat er deze maand aan
-- AI doorheen is gegaan. Geen enkel gegeven uit de app zelf: geen gewicht, geen
-- bloeddruk, geen labwaarde, geen maaltijd. Een beheerder die wil weten of de
-- app gebruikt wordt heeft daar niets van nodig, en dit is medische informatie
-- van iemand anders.
--
-- `kosten_usd` staat er wel bij en draagt een waarschuwing: de edge function
-- rekent hem uit met een vast Sonnet-tarief. Draait er een ander model, dan is
-- dat getal een onderschatting. Het aantal aanroepen klopt altijd, en dáárom is
-- het budget in aanroepen en niet in euro.
-- ===========================================================================

create or replace function public.kal_testers(p_token text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare v_id uuid;
begin
  v_id := kal_sessie(p_token);
  if not exists (select 1 from kal_gebruikers where id = v_id and beheerder) then
    return jsonb_build_object('fout', 'Dat kan niet');
  end if;

  return coalesce((
    select jsonb_agg(r order by r->>'aangemaakt_op' desc)
      from (
        select jsonb_build_object(
          'account', g.account,
          'naam', g.weergavenaam,
          'status', g.status,
          'beheerder', g.beheerder,
          'budget', g.ai_budget_maand,
          'notitie', g.notitie,
          'aangemaakt_op', g.aangemaakt_op,
          'beoordeeld_op', g.beoordeeld_op,
          'maand_aanroepen', (
            select count(*) from kal_ai_log l
             where l.gebruiker_id = g.id and l.gelukt
               and l.created_at >= date_trunc('month', now())),
          'maand_tokens', (
            select coalesce(sum(l.input_tokens + l.output_tokens), 0) from kal_ai_log l
             where l.gebruiker_id = g.id
               and l.created_at >= date_trunc('month', now())),
          'maand_usd', (
            select coalesce(round(sum(l.kosten_usd)::numeric, 2), 0) from kal_ai_log l
             where l.gebruiker_id = g.id
               and l.created_at >= date_trunc('month', now())),
          'laatst_actief', (
            select max(l.created_at) from kal_ai_log l where l.gebruiker_id = g.id)
        ) as r
        from kal_gebruikers g
      ) x), '[]'::jsonb);
end $function$;

-- ===========================================================================
-- TOELATEN, AFWIJZEN, EN HET BUDGET ZETTEN
-- ===========================================================================
--
-- Drie dingen in één functie, want ze gebeuren in één handeling: je laat iemand
-- toe én je zegt hoeveel hij mag.
--
-- DRIE GRENZEN DIE ER NIET VOOR DE SIER STAAN
--
-- **Je kunt jezelf niet buitensluiten.** Een beheerder die zichzelf op
-- 'afgewezen' zet, zou de enige zijn die dat kon terugdraaien. Dat is geen
-- bescherming tegen kwade wil maar tegen een misklik in een lijst waar je eigen
-- naam ook in staat.
--
-- **Je kunt de laatste beheerder niet weghalen.** Om dezelfde reden.
--
-- **En het blijft niet stil.** Wie iemand beoordeelt zet zijn eigen naam in
-- `beoordeeld_door` en de tijd in `beoordeeld_op`. Dat is dezelfde regel als de
-- herstelcode uit bestand 40: een beheerder mag veel, maar niet ongezien.
-- ===========================================================================

create or replace function public.kal_tester_zetten(
  p_token text, p_account text, p_status text DEFAULT NULL::text,
  p_budget integer DEFAULT NULL::integer, p_notitie text DEFAULT NULL::text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare v_id uuid; v_doel uuid; v_naam text;
begin
  v_id := kal_sessie(p_token);
  if not exists (select 1 from kal_gebruikers where id = v_id and beheerder) then
    return jsonb_build_object('fout', 'Dat kan niet');
  end if;

  v_naam := lower(trim(p_account));
  select id into v_doel from kal_gebruikers where account = v_naam;
  if v_doel is null then
    return jsonb_build_object('fout', 'Dat account bestaat niet');
  end if;

  if p_status is not null and p_status not in ('wacht', 'toegelaten', 'afgewezen') then
    return jsonb_build_object('fout', 'Onbekende status');
  end if;
  if p_budget is not null and (p_budget < 0 or p_budget > 100000) then
    return jsonb_build_object('fout', 'Een budget ligt tussen 0 en 100.000 aanroepen');
  end if;

  if v_doel = v_id and p_status is not null and p_status <> 'toegelaten' then
    return jsonb_build_object('fout', 'Je kunt jezelf niet buitensluiten');
  end if;

  update kal_gebruikers
     set status          = coalesce(p_status, status),
         ai_budget_maand = coalesce(p_budget, ai_budget_maand),
         notitie         = coalesce(p_notitie, notitie),
         beoordeeld_op   = case when p_status is null then beoordeeld_op else now() end,
         beoordeeld_door = case when p_status is null then beoordeeld_door else v_id end
   where id = v_doel;

  return jsonb_build_object('account', v_naam, 'status',
    (select status from kal_gebruikers where id = v_doel),
    'budget', (select ai_budget_maand from kal_gebruikers where id = v_doel));
end $function$;

-- ===========================================================================
-- NAKIJKEN NA HET DRAAIEN
-- ===========================================================================
--
--   -- 1. De bestaande accounts staan erin en houden hun ruimte.
--   select account, status, ai_budget_maand, beheerder from kal_gebruikers
--    order by aangemaakt_op;
--
--   -- 2. En wie zich hierna aanmeldt komt in de wachtkamer met honderd.
--   select column_default from information_schema.columns
--    where table_name = 'kal_gebruikers' and column_name in ('status','ai_budget_maand');
--
--   -- 3. De poort antwoordt. (Vul je eigen id in uit vraag 1.)
--   select kal_ai_toegestaan('<jouw uuid>');
--
--   -- 4. En de lijst doet het, met jouw eigen sessietoken uit de app.
--   select kal_testers('<token>');
--
-- Draai daarna `node gereedschap/md5-verslag.mjs --schrijf` en leg
-- `controle-md5.sql` er weer naast.
-- ===========================================================================
