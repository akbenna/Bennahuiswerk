-- ===========================================================================
-- 49: EEN EIGEN SLEUTEL, VERSLEUTELD BUITEN DE DATABASE OM
-- ===========================================================================
--
-- TOEGEPAST: nog niet. Draai bestand 48 eerst, dit bouwt erop verder, en daarna
-- 51, 52 en 53. Draai dan `node gereedschap/md5-verslag.mjs --schrijf`.
--
-- Bestand 48 gaf elke tester een proefrit van vijfentwintig herkenningen op de
-- sleutel van de eigenaar. Dit bestand geeft hem de weg erna: zijn eigen
-- sleutel, en daarmee zijn eigen rekening.
--
-- ===========================================================================
-- DIT BESTAND HEETTE EERST "IN DE VAULT", EN DAT IS HET NIET GEWORDEN
-- ===========================================================================
--
-- Dat was het plan, en het liep twee keer vast. De eerste versie riep
-- `vault.create_secret()` aan; die functie bestaat hier niet meer, want dat is
-- de oude Vault die op `pgsodium` rust en die Supabase heeft afgeraden. De
-- tweede versie schreef rechtstreeks in `vault.secrets`, zoals de huidige Vault
-- het wil, en liep op iets anders vast:
--
--     Vault is niet bruikbaar voor dit bestand. Wat ontbreekt: schrijfrecht op
--     vault.secrets voor postgres;
--
-- De rol die deze functies bezit mag daar niet in schrijven en kan zichzelf dat
-- recht niet geven: `pg_has_role(current_user, 'supabase_admin', 'member')`
-- geeft `false`. Daarmee houdt die weg op, en niet omdat er iets niet geprobeerd
-- is.
--
-- Dat is trouwens de wachter die dat aan het licht bracht en niet een uitrol die
-- halverwege omviel. Hij keek eerst naar één functienaam, gaf daarmee vals
-- alarm, en is toen vervangen door een die kijkt naar wat er werkelijk nodig is:
-- de tabel, de weergave, de kolommen, en het schrijfrecht. Die laatste vond het.
--
-- ===========================================================================
-- WAT ERVOOR IN DE PLAATS KOMT, EN WAAROM DAT BETER IS
-- ===========================================================================
--
-- De sleutel wordt versleuteld in de edge function, met een hoofdsleutel die in
-- de omgeving van die functie staat, naast `ANTHROPIC_API_KEY`. Wat hier in de
-- database terechtkomt is cijfertekst en verder niets.
--
-- Dat is sterker dan Vault zou zijn geweest, en het verschil is scherp:
--
--   **Bij Vault kan de database zelf ontsleutelen.** Wie een export van deze
--   database in handen krijgt, krijgt de sleutels van alle testers erbij.
--
--   **Hier kan de database er niets mee.** Geen functie, geen beheerder, geen
--   back-up en geen export komt aan de inhoud. De hoofdsleutel staat ergens
--   anders, en je hebt allebei nodig.
--
-- WAAROM DAN NIET `pgcrypto`, DAT STAAT AL AAN
--
-- Omdat versleutelen in de database betekent dat de hoofdsleutel dáárheen moet:
-- over de lijn bij elke aanroep, mogelijk in een logregel, en in elk geval
-- binnen bereik van wie de database beheert. Dan is precies de winst hierboven
-- weg. `pgcrypto` blijft ongebruikt voor dit doel; AES-GCM in de edge function
-- vraagt geen uitbreiding en de database ziet de sleutel nooit, ook niet even.
--
-- ===========================================================================
-- WAT DAT VOOR DEZE FUNCTIES BETEKENT
-- ===========================================================================
--
-- Ze bergen op en geven terug, en ze begrijpen niet wat ze dragen. Drie van de
-- vier staan daarom alleen open voor de service-role, dus voor de edge function:
-- die is de enige die de hoofdsleutel heeft en dus de enige voor wie die
-- cijfertekst iets betekent.
--
-- De vierde, `kal_sleutel_weghalen`, staat wél open voor de app. Weghalen vraagt
-- geen hoofdsleutel, en het hoort te werken ook als de edge function er even uit
-- ligt. Wie zijn sleutel terug wil hebben, moet dat altijd kunnen.
--
-- En de staart van vier tekens staat er los naast, onversleuteld. Dat is met
-- opzet: de tester moet kunnen zien wélke sleutel erin staat, anders is "je
-- sleutel is opgeslagen" een mededeling waar hij niets mee kan. De laatste vier
-- en niet de eerste, want die dragen bij OpenAI het projectnummer.
-- ===========================================================================

alter table public.kal_gebruikers
  add column if not exists ai_sleutel_cijfer text,
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

comment on column public.kal_gebruikers.ai_sleutel_cijfer is
  'De eigen AI-sleutel van deze gebruiker, versleuteld met AES-GCM door de edge '
  'function. De hoofdsleutel staat daar in de omgeving en niet hier, dus deze '
  'kolom is vanuit de database niet te lezen. Zie bestand 49.';
comment on column public.kal_gebruikers.ai_sleutel_staart is
  'De laatste vier tekens, onversleuteld, zodat de tester ziet welke sleutel '
  'erin staat. Niet de eerste: die dragen bij OpenAI het projectnummer.';

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
-- OPBERGEN
-- ===========================================================================
--
-- Deze functie kent de sleutel niet en controleert hem daarom ook niet. Dat
-- gebeurt in de edge function, vóór het versleutelen, want daar is hij nog
-- leesbaar. Wat hier binnenkomt is cijfertekst, en daar valt niets aan te
-- keuren behalve dat het er is.
--
-- Hij staat alleen open voor de service-role. Zonder die grens zou iedereen met
-- de anon-sleutel de cijfertekst van een willekeurige gebruiker kunnen
-- overschrijven, en dan stuurt de app straks een herkenning met de sleutel van
-- iemand anders. `security definer` betekent "met de rechten van de eigenaar",
-- niet "alleen voor de eigenaar", en dat verschil is hier de hele zaak.
-- ===========================================================================

create or replace function public.kal_sleutel_opbergen(
  p_gebruiker uuid, p_aanbieder text, p_cijfer text, p_staart text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
begin
  if p_aanbieder not in ('anthropic', 'openai') then
    return jsonb_build_object('fout', 'Onbekende aanbieder');
  end if;
  if p_cijfer is null or length(p_cijfer) < 20 then
    return jsonb_build_object('fout', 'Dat is geen versleutelde sleutel');
  end if;

  update kal_gebruikers
     set ai_sleutel_cijfer = p_cijfer,
         ai_aanbieder      = p_aanbieder,
         ai_sleutel_staart = p_staart,
         ai_sleutel_op     = now()
   where id = p_gebruiker;

  if not found then
    return jsonb_build_object('fout', 'Die gebruiker bestaat niet');
  end if;
  return jsonb_build_object('aanbieder', p_aanbieder, 'staart', p_staart);
end $function$;

revoke all on function public.kal_sleutel_opbergen(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.kal_sleutel_opbergen(uuid, text, text, text) to service_role;

-- ===========================================================================
-- TERUGGEVEN, EN AAN WIE
-- ===========================================================================
--
-- Alleen aan de edge function, want alleen die kan er iets mee. Voor ieder
-- ander is het een brok tekst, en toch staat de `revoke` eronder: een brok
-- tekst die je kunt ophalen bij een geraden uuid is nog steeds iets dat je niet
-- hoort te kunnen ophalen.
--
-- Wat er níet is, is een functie die de sleutel teruggeeft aan de gebruiker
-- zelf. Ook niet de staart plus de rest, ook niet aan de beheerder. Wie zijn
-- sleutel kwijt is maakt een nieuwe bij zijn aanbieder; dat is het juiste
-- ongemak, want een app die je sleutel kan laten zien kan hem ook aan iemand
-- anders laten zien.
-- ===========================================================================

create or replace function public.kal_sleutel_voor(p_gebruiker uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare v_cijfer text; v_aanbieder text;
begin
  select ai_sleutel_cijfer, ai_aanbieder into v_cijfer, v_aanbieder
    from kal_gebruikers where id = p_gebruiker;
  if v_cijfer is null then
    return jsonb_build_object('eigen', false);
  end if;
  return jsonb_build_object('eigen', true, 'aanbieder', v_aanbieder, 'cijfer', v_cijfer);
end $function$;

revoke all on function public.kal_sleutel_voor(uuid) from public, anon, authenticated;
grant execute on function public.kal_sleutel_voor(uuid) to service_role;

-- ===========================================================================
-- WEGHALEN, LANGS TWEE WEGEN
-- ===========================================================================
--
-- `kal_sleutel_weghalen` is van de gebruiker zelf en gaat met zijn sessietoken.
-- Die staat met opzet open voor de app en niet alleen voor de edge function:
-- weghalen vraagt geen hoofdsleutel, en het hoort te werken ook als die functie
-- er even uit ligt. Wie zijn sleutel terug wil, moet dat altijd kunnen.
--
-- `kal_sleutel_weg` doet hetzelfde op een uuid en is voor de edge function, die
-- daar al een sessietoken voor heeft omgezet. Twee functies voor één handeling
-- is één te veel als je ze allebei kunt aanroepen, en precies goed als de een
-- alleen met een token werkt en de ander alleen met de service-role.
-- ===========================================================================

create or replace function public.kal_sleutel_weghalen(p_token text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare v_id uuid;
begin
  v_id := kal_sessie(p_token);
  update kal_gebruikers
     set ai_sleutel_cijfer = null, ai_aanbieder = null,
         ai_sleutel_staart = null, ai_sleutel_op = null
   where id = v_id;
  return jsonb_build_object('weg', true);
end $function$;

create or replace function public.kal_sleutel_weg(p_gebruiker uuid)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
begin
  update kal_gebruikers
     set ai_sleutel_cijfer = null, ai_aanbieder = null,
         ai_sleutel_staart = null, ai_sleutel_op = null
   where id = p_gebruiker;
  return jsonb_build_object('weg', true);
end $function$;

revoke all on function public.kal_sleutel_weg(uuid) from public, anon, authenticated;
grant execute on function public.kal_sleutel_weg(uuid) to service_role;

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
  select status, ai_budget_maand, ai_sleutel_cijfer is not null
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
          'eigen_sleutel', g.ai_sleutel_cijfer is not null,
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
-- Zet eerst `SLEUTELKLUIS` in de Supabase-secrets, naast `ANTHROPIC_API_KEY`.
-- Tweeendertig bytes als base64, en maak hem met een generator en niet met je
-- hoofd:
--
--     openssl rand -base64 32
--
-- Bewaar hem ook ergens anders. Raakt hij kwijt, dan is elke opgeslagen
-- sleutel onleesbaar en moeten testers hem opnieuw invullen; de app zegt dat
-- dan ook met zoveel woorden in plaats van stil terug te vallen op jouw
-- rekening.
--
--   -- 1. De kolommen staan er en er staat nog niets in.
--   select account, ai_aanbieder, ai_sleutel_staart from kal_gebruikers
--    order by aangemaakt_op;
--
--   -- 2. Zet er vanuit de app een sleutel in. Kijk dan wat de database draagt:
--   --    hier hoort cijfertekst te staan die met v1. begint, en nergens iets
--   --    dat op sk- lijkt.
--   select ai_aanbieder, ai_sleutel_staart, left(ai_sleutel_cijfer, 24)
--     from kal_gebruikers where account = '<jij>';
--
--   -- 3. En de poort laat je nu door zonder budget.
--   select kal_ai_toegestaan('<jouw uuid>');
--
--   -- 4. Laat daarna een maaltijd herkennen. Dat is de eerste keer dat de
--   --    sleutel werkelijk gebruikt wordt, en dus de enige echte proef.
--
-- Draai daarna `node gereedschap/md5-verslag.mjs --schrijf`.
-- ===========================================================================
