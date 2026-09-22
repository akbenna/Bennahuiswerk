-- ===========================================================================
-- 49: EEN EIGEN SLEUTEL, IN DE VAULT
-- ===========================================================================
--
-- TOEGEPAST: nog niet. Draai bestand 48 eerst, dit bouwt erop verder. En draai
-- daarna `node gereedschap/md5-verslag.mjs --schrijf`.
--
-- Let op de volgorde: 48, dan dit, dan 51. Bestand 51 vervangt een functie die
-- uit 48 komt.
--
-- WAT HIER BIJ KOMT
--
-- Bestand 48 gaf elke tester een proefrit van vijfentwintig herkenningen op de
-- sleutel van de eigenaar. Dit bestand geeft hem de weg erna: zijn eigen
-- sleutel, en daarmee zijn eigen rekening.
--
-- Dat is niet alleen een kostenkwestie. Een proefrit die opraakt en dan ophoudt
-- is een app die uitgaat. Een proefrit die opraakt en dan zegt hoe je verder
-- kunt, is een app die je zelf in handen hebt.
--
-- ===========================================================================
-- WAAROM DE SLEUTEL IN DE VAULT STAAT EN NIET IN EEN KOLOM
-- ===========================================================================
--
-- Een API-sleutel in een gewone kolom is leesbaar voor iedereen die bij de
-- tabel kan: een back-up, een export, een kwartier in de SQL-editor. Deze app
-- heeft er al een regel over, en die staat in `CLAUDE.md`: elke sleutel die
-- geen publieke anon-sleutel is hoort in de omgeving van een edge function of
-- in de vault.
--
-- De vault versleutelt de waarde op de schijf en geeft hem alleen terug via
-- `vault.decrypted_secrets`. In `kal_gebruikers` staat dus niet de sleutel maar
-- zijn nummer, plus de laatste vier tekens.
--
-- WAAROM DE LAATSTE VIER EN NIET DE EERSTE
--
-- De tester moet kunnen zien wélke sleutel erin staat, anders is "je sleutel is
-- opgeslagen" een mededeling waar hij niets mee kan. De eerste tekens van een
-- OpenAI-projectsleutel dragen het projectnummer; de laatste vier dragen niets
-- dan herkenning. Dus de staart.
--
-- WAT ER NIET GEBEURT
--
-- De sleutel komt nooit terug naar de browser. Er is geen functie die hem
-- teruggeeft aan de gebruiker, ook niet aan de gebruiker zelf, ook niet aan de
-- beheerder. `kal_sleutel_voor` is de enige weg naar buiten en die staat alleen
-- open voor de service-role, dus voor de edge function.
--
-- Wie zijn sleutel kwijt is maakt een nieuwe bij zijn aanbieder. Dat is een
-- ongemak, en het is het juiste ongemak: een app die je sleutel kan laten zien,
-- kan hem ook laten zien aan iemand anders.
--
-- ===========================================================================
-- EN WAT DIT BETEKENT VOOR DE EIGENAAR
-- ===========================================================================
--
-- Dit moet hardop gezegd, want het is de keerzijde van de hele opzet: vanaf nu
-- bewaart deze database de betaalsleutels van andere mensen. Gaat er iets mis
-- met deze database, dan gaat er iets mis met hun rekening.
--
-- Daar staan drie dingen tegenover en meer niet: de waarde staat versleuteld,
-- er is geen enkele weg terug naar de browser, en de tester kan hem er zelf
-- uithalen. Dat is geen garantie. Het staat daarom ook op het scherm bij het
-- vak waar hij hem invult, want wie een sleutel afgeeft hoort te weten aan wie.
-- ===========================================================================

-- ===========================================================================
-- WELKE VAULT, EN WAAROM DAT UITMAAKT
-- ===========================================================================
--
-- De eerste versie van dit bestand riep `vault.create_secret()` aan. Dat is de
-- oude Vault, die op `pgsodium` rust. Supabase heeft die afgeraden en in de
-- huidige versie bestaat die functie niet meer: het schema is er, de uitbreiding
-- is geïnstalleerd, en je schrijft gewoon rechtstreeks in `vault.secrets`.
--
-- Op dit project gaf de wachter hieronder dus alarm terwijl Vault er wél was.
-- Dat is precies het soort vals alarm waar een wachter voor deugt: hij hield
-- het bestand tegen in plaats van halverwege om te vallen.
--
-- Wat hij nu controleert is niet één functienaam maar wat dit bestand werkelijk
-- nodig heeft: de tabel, de ontsleutelde weergave, de kolommen die het gebruikt,
-- en of deze rol erin mág schrijven. Dat laatste is geen formaliteit: `security
-- definer` betekent "met de rechten van de eigenaar", en of die eigenaar bij de
-- vault mag is niets om aan te nemen. Faalt er iets, dan zegt hij wat.
-- ===========================================================================

do $$
declare v_mist text := '';
begin
  if to_regclass('vault.secrets') is null then
    v_mist := v_mist || ' de tabel vault.secrets;';
  end if;
  if to_regclass('vault.decrypted_secrets') is null then
    v_mist := v_mist || ' de weergave vault.decrypted_secrets;';
  end if;
  if v_mist = '' then
    if not exists (select 1 from information_schema.columns
                    where table_schema = 'vault' and table_name = 'secrets'
                      and column_name in ('secret', 'name', 'description')
                    group by table_name having count(*) = 3) then
      v_mist := v_mist || ' de kolommen secret, name en description op vault.secrets;';
    end if;
    if not exists (select 1 from information_schema.columns
                    where table_schema = 'vault' and table_name = 'decrypted_secrets'
                      and column_name = 'decrypted_secret') then
      v_mist := v_mist || ' de kolom decrypted_secret op vault.decrypted_secrets;';
    end if;
    if not has_table_privilege(current_user, 'vault.secrets', 'insert') then
      v_mist := v_mist || ' schrijfrecht op vault.secrets voor ' || current_user || ';';
    end if;
  end if;

  if v_mist <> '' then
    raise exception 'Vault is niet bruikbaar voor dit bestand. Wat ontbreekt:%', v_mist;
  end if;
end $$;

alter table public.kal_gebruikers
  add column if not exists ai_sleutel_id     uuid,
  add column if not exists ai_aanbieder      text,
  add column if not exists ai_sleutel_staart text,
  add column if not exists ai_sleutel_op     timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'kal_aanbieder_kent_twee') then
    alter table public.kal_gebruikers
      add constraint kal_aanbieder_kent_twee
      check (ai_aanbieder is null or ai_aanbieder in ('anthropic', 'openai'));
  end if;
end $$;

comment on column public.kal_gebruikers.ai_sleutel_id is
  'Het nummer van de sleutel in de vault, niet de sleutel zelf. Alleen '
  'kal_sleutel_voor leest hem uit, en die staat alleen open voor de '
  'service-role. Zie bestand 49.';
comment on column public.kal_gebruikers.ai_sleutel_staart is
  'De laatste vier tekens, zodat de tester ziet welke sleutel erin staat. '
  'Niet de eerste: die dragen bij OpenAI het projectnummer.';

-- ===========================================================================
-- WIENS REKENING WAS DIT
-- ===========================================================================
--
-- `kal_ai_log` wist tot nu toe niet op wiens sleutel een aanroep liep, want er
-- was er maar een. Vanaf nu zijn het er twee soorten en dat verschil is precies
-- het getal waar de beheerder naar kijkt: wat kost dit mij.
--
-- `kosten_usd` blijft staan zoals hij is, met het Sonnet-tarief en al, maar hij
-- telt alleen nog mee voor de beheerder als de aanroep op de gedeelde sleutel
-- liep. Wat een tester op zijn eigen rekening doet is niet van de eigenaar en
-- hoort ook niet in zijn totaal.
-- ===========================================================================

alter table public.kal_ai_log
  add column if not exists eigen_sleutel boolean not null default false;

comment on column public.kal_ai_log.eigen_sleutel is
  'Liep deze aanroep op de eigen sleutel van de gebruiker? Zo ja, dan is '
  'kosten_usd niet de rekening van de eigenaar. Zie bestand 49.';

-- ===========================================================================
-- DE SLEUTEL ERIN ZETTEN
-- ===========================================================================
--
-- Vier grenzen, en ze zitten er alle vier omdat een sleutel die niet werkt pas
-- opvalt op het moment dat je iets wilt laten herkennen.
--
--   1. Hij moet bij de aanbieder passen. Anthropic begint met `sk-ant-`, OpenAI
--      met `sk-`. Wie zijn Anthropic-sleutel bij OpenAI invult krijgt dat hier
--      te horen en niet drie dagen later.
--   2. Geen witruimte. Een sleutel uit een e-mail draagt vaak een regeleinde
--      mee, en dat geeft een foutmelding die nergens op slaat.
--   3. Een lengte die ergens op slaat. Twintig tekens is geen sleutel.
--   4. De oude gaat eruit. Een vault die volloopt met oude sleutels van dezelfde
--      gebruiker is een vault die je niet meer kunt opruimen.
--
-- Wat hier níet gebeurt is de sleutel uitproberen. Dat zou een aanroep naar de
-- aanbieder vragen vanuit de database, en de database belt niet naar buiten.
-- De eerste herkenning is de proef, en de app zegt dat er met zoveel woorden bij.
-- ===========================================================================

create or replace function public.kal_sleutel_zetten(
  p_token text, p_aanbieder text, p_sleutel text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare v_id uuid; v_oud uuid; v_nieuw uuid; v_s text;
begin
  v_id := kal_sessie(p_token);
  v_s := p_sleutel;

  if p_aanbieder not in ('anthropic', 'openai') then
    return jsonb_build_object('fout', 'Onbekende aanbieder');
  end if;
  if v_s is null or v_s <> btrim(v_s) or v_s ~ '\s' then
    return jsonb_build_object('fout',
      'Er zit witruimte in die sleutel. Plak hem nog eens, zonder spatie of regeleinde.');
  end if;
  if length(v_s) < 30 then
    return jsonb_build_object('fout', 'Dat is te kort voor een sleutel');
  end if;
  if p_aanbieder = 'anthropic' and v_s not like 'sk-ant-%' then
    return jsonb_build_object('fout',
      'Een sleutel van Anthropic begint met sk-ant-. Staat er alleen sk-, dan is het er een van OpenAI.');
  end if;
  if p_aanbieder = 'openai' and (v_s not like 'sk-%' or v_s like 'sk-ant-%') then
    return jsonb_build_object('fout',
      'Een sleutel van OpenAI begint met sk-, en niet met sk-ant-.');
  end if;

  select ai_sleutel_id into v_oud from kal_gebruikers where id = v_id;

  /* Rechtstreeks in de tabel en niet via `vault.create_secret()`: die functie
     hoort bij de oude, op pgsodium gebouwde Vault en bestaat hier niet meer.
     Het versleutelen gebeurt aan de kant van de vault; wat hier binnengaat is
     de sleutel zelf en wat erin blijft staan is onleesbaar.

     De naam draagt een tijdstempel, want twee sleutels van dezelfde gebruiker
     mogen niet op dezelfde naam botsen, ook niet als de oude nog een tel
     bestaat. */
  insert into vault.secrets (secret, name, description)
  values (v_s,
          'kal_ai_' || v_id::text || '_' || to_char(now(), 'YYYYMMDDHH24MISS'),
          'Eigen AI-sleutel van een BennaHealth-gebruiker')
  returning id into v_nieuw;

  update kal_gebruikers
     set ai_sleutel_id = v_nieuw,
         ai_aanbieder = p_aanbieder,
         ai_sleutel_staart = right(v_s, 4),
         ai_sleutel_op = now()
   where id = v_id;

  /* Pas weghalen nadat de nieuwe erin staat. Andersom zou een fout halverwege
     de gebruiker zonder sleutel achterlaten terwijl hij er net een gaf. */
  if v_oud is not null then
    delete from vault.secrets where id = v_oud;
  end if;

  return jsonb_build_object('aanbieder', p_aanbieder, 'staart', right(v_s, 4));
end $function$;

create or replace function public.kal_sleutel_weghalen(p_token text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare v_id uuid; v_oud uuid;
begin
  v_id := kal_sessie(p_token);
  select ai_sleutel_id into v_oud from kal_gebruikers where id = v_id;
  update kal_gebruikers
     set ai_sleutel_id = null, ai_aanbieder = null,
         ai_sleutel_staart = null, ai_sleutel_op = null
   where id = v_id;
  if v_oud is not null then
    delete from vault.secrets where id = v_oud;
  end if;
  return jsonb_build_object('weg', true);
end $function$;

-- ===========================================================================
-- DE ENIGE WEG NAAR BUITEN
-- ===========================================================================
--
-- Eén functie, en alleen de service-role mag hem. De edge function vraagt ermee
-- of deze gebruiker een eigen sleutel heeft en krijgt hem dan terug.
--
-- Zonder de `revoke` hieronder zou elke bezoeker met de anon-sleutel de
-- betaalsleutel van een willekeurige gebruiker kunnen opvragen door zijn uuid
-- te raden. `security definer` betekent "draait met de rechten van de eigenaar",
-- niet "alleen voor de eigenaar", en dat verschil is hier de hele zaak.
-- ===========================================================================

create or replace function public.kal_sleutel_voor(p_gebruiker uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare v_id uuid; v_aanbieder text; v_sleutel text;
begin
  select ai_sleutel_id, ai_aanbieder into v_id, v_aanbieder
    from kal_gebruikers where id = p_gebruiker;
  if v_id is null then
    return jsonb_build_object('eigen', false);
  end if;
  select decrypted_secret into v_sleutel from vault.decrypted_secrets where id = v_id;
  if v_sleutel is null then
    /* De rij wijst naar een geheim dat er niet meer is. Dat is geen storing om
       op te vallen maar een toestand om te melden: de app valt terug op de
       gedeelde sleutel en het budget, en de tester ziet dat zijn sleutel weg is. */
    return jsonb_build_object('eigen', false, 'kwijt', true);
  end if;
  return jsonb_build_object('eigen', true, 'aanbieder', v_aanbieder, 'sleutel', v_sleutel);
end $function$;

revoke all on function public.kal_sleutel_voor(uuid) from public, anon, authenticated;
grant execute on function public.kal_sleutel_voor(uuid) to service_role;

-- ===========================================================================
-- HET BUDGET GELDT NIET VOOR JE EIGEN SLEUTEL
-- ===========================================================================
--
-- Dit is de reden dat `kal_ai_toegestaan` hier opnieuw geschreven wordt en niet
-- in bestand 48 bleef staan.
--
-- Het maandbudget bestaat om de rekening van de eigenaar te begrenzen. Wie zijn
-- eigen sleutel geeft, betaalt zelf, en dan is die grens geen bescherming maar
-- een rem op iemand anders zijn geld. Hij vervalt dus.
--
-- De rem per uur blijft wél staan, voor iedereen. Die gaat niet over kosten
-- maar over een aanroeper die op hol slaat, en dat is even onwenselijk met een
-- eigen sleutel: het is dan nog steeds deze app die de aanroepen doet.
--
-- De wachtkamer blijft ook staan. Een eigen sleutel is geen toegangsbewijs: wie
-- nog niet is toegelaten, is nog niet toegelaten, en dat gaat niet over geld.
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
  v_eigen   boolean;
  v_maand   integer;
  v_uur     integer;
begin
  select status, ai_budget_maand, ai_sleutel_id is not null
    into v_status, v_budget, v_eigen
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
    'mag', v_status = 'toegelaten' and (v_eigen or v_maand < v_budget) and v_uur < 30,
    'reden', case
      when v_status = 'wacht'                       then 'wacht'
      when v_status = 'afgewezen'                   then 'afgewezen'
      when v_uur >= 30                              then 'uur-vol'
      when not v_eigen and v_maand >= v_budget      then 'maand-op'
      else 'goed' end,
    'status', v_status,
    'gebruikt', v_maand,
    'budget', v_budget,
    'eigen_sleutel', v_eigen,
    'uur', v_uur);
end $function$;

-- En wat de gebruiker over zichzelf leest, met zijn sleutel erbij. De staart en
-- de aanbieder, nooit de sleutel.
create or replace function public.kal_mijn_toegang(p_token text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare v_id uuid; v_uit jsonb; v_beheerder boolean; v_aanbieder text; v_staart text;
begin
  v_id := kal_sessie(p_token);
  v_uit := kal_ai_toegestaan(v_id);
  select beheerder, ai_aanbieder, ai_sleutel_staart
    into v_beheerder, v_aanbieder, v_staart
    from kal_gebruikers where id = v_id;
  return v_uit
    || jsonb_build_object(
         'beheerder', coalesce(v_beheerder, false),
         'aanbieder', v_aanbieder,
         'staart', v_staart,
         'maand_tot', (date_trunc('month', now()) + interval '1 month')::date);
end $function$;

-- ===========================================================================
-- DE LIJST, MET DE SLEUTEL VAN DE TESTER EROP
-- ===========================================================================
--
-- Twee dingen erbij en een ding rechtgezet.
--
-- Erbij: welke aanbieder een tester gebruikt en of hij een eigen sleutel heeft.
-- Zonder dat staat er in de lijst een tester met honderd aanroepen en weet de
-- beheerder niet of die hem iets gekost hebben.
--
-- Rechtgezet: `maand_usd` telt nu alleen de aanroepen op de gedeelde sleutel.
-- Dat is de rekening van de eigenaar, en dat is waar dat getal voor staat.
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
          'aanbieder', g.ai_aanbieder,
          'eigen_sleutel', g.ai_sleutel_id is not null,
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
             where l.gebruiker_id = g.id and not l.eigen_sleutel
               and l.created_at >= date_trunc('month', now())),
          'laatst_actief', (
            select max(l.created_at) from kal_ai_log l where l.gebruiker_id = g.id)
        ) as r
        from kal_gebruikers g
      ) x), '[]'::jsonb);
end $function$;

-- ===========================================================================
-- NAKIJKEN NA HET DRAAIEN
-- ===========================================================================
--
--   -- 1. De kolommen staan er, en er staat nog niets in.
--   select account, ai_aanbieder, ai_sleutel_staart, ai_budget_maand
--     from kal_gebruikers order by aangemaakt_op;
--
--   -- 2. Zet er vanuit de app een sleutel in, en kijk dan of de tabel hem
--   --    níet draagt. Hier hoort alleen een nummer en een staart te staan.
--   select ai_sleutel_id, ai_sleutel_staart from kal_gebruikers where account = '<jij>';
--
--   -- 3. En of de vault hem wel draagt, versleuteld.
--   select id, name, left(secret, 12) as versleuteld from vault.secrets
--    where name like 'kal_ai_%';
--
--   -- 4. De poort laat je nu door zonder budget.
--   select kal_ai_toegestaan('<jouw uuid>');
--
-- Draai daarna `node gereedschap/md5-verslag.mjs --schrijf`.
-- ===========================================================================
