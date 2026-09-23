-- ===========================================================================
-- 43: INSPANNING KRIJGT EEN SOORT
-- ===========================================================================
--
-- TOEGEPAST: ja, op 19 september 2026, samen met een nieuwe uitrol van
-- `health/edge/kal-ai.ts`. Die twee horen bij elkaar: zonder de uitrol geeft de
-- herkenning geen `soort` terug en komt elke work-out als "geen soort te zien"
-- binnen: de tabel werkt dan wel, maar er valt niets in te zetten dan met de
-- hand.
--
-- WAAROM
--
-- Er was één veld voor beweging buiten de stappen om: `kal_dagen.fiets_min`.
-- Die naam was altijd al te smal, wie zwemt of hardloopt zette zijn minuten in
-- een vakje dat "fietsen" heet, maar het werd pas echt fout bij het rekenen.
--
-- De WHO-richtlijn van 2020 noemt twee bedragen en geen één: 150 tot 300 minuten
-- matige inspanning per week, óf 75 tot 150 zware, óf een combinatie waarin een
-- minuut zware voor twee matige telt. Veertig minuten hardlopen is dus niet
-- hetzelfde als veertig minuten wandelen, en één integer kan dat verschil niet
-- dragen. De app zei tegen de hardloper dat hij nog niet op de helft was.
--
-- Er is nog een tweede reden, en die kwam uit de work-outlijst van bestand 42:
-- een dag kan meer dan één inspanning hebben. Een wandeling van een half uur
-- naast een rit van drie kwartier zijn twee dingen, en in één kolom worden ze
-- één getal waarvan je niet meer ziet waar het vandaan komt.
--
-- WAT ER MET `fiets_min` GEBEURT, en dat is met opzet niets
--
-- Hij blijft staan en blijft tellen. De app leest hem als één fietsrit van die
-- dag, matig, naast wat er in deze nieuwe tabel staat.
--
-- Dat scheelt een verhuizing van bestaande rijen, en belangrijker: het scheelt
-- een wijziging aan `kal_beweging_ontvangen`. De koppeling op de telefoon vuurt
-- elke ochtend om zeven uur en stuurt `fiets_min` mee; die afspraak breken zou
-- betekenen dat de opdracht op het toestel opnieuw moet, en tot dat gebeurd is
-- komt er niets meer binnen. Een veld dat blijft werken is hier meer waard dan
-- een schema dat er netter uitziet.
--
-- De prijs staat in het scherm: een rit die de koppeling doorgeeft én die je
-- met de hand als rij toevoegt telt twee keer. Dat is zichtbaar: beide staan in
-- de lijst van die dag, met hun herkomst, en met één tik weg te halen. Een
-- stille voorkeursregel die er één van de twee laat verdwijnen zou erger zijn:
-- dan mis je minuten zonder te weten welke.
--
-- WAT ER NIET IN DEZE TABEL HOORT
--
-- Krachttraining. Die telt in de richtlijn apart: twee keer per week
-- spierversterkend, naast de aerobe minuten, en heeft in `kal_training` zijn
-- eigen tabel en op het scherm zijn eigen drie bolletjes. Zou hij hier ook
-- meetellen, dan haalde één zware sessie de halve aerobe week.
--
-- DE INTENSITEIT IS EEN AANNAME, EN ZEGT DAT ZELF
--
-- `intensiteit` staat bij de rij en niet in een opzoektabel, zodat een latere
-- herindeling van de soorten geen geschiedenis herschrijft. `geschat` zegt
-- waar hij vandaan komt: `true` is afgeleid uit de soort, `false` is door een
-- mens gekozen. Rennen is niet altijd zwaar en wandelen niet altijd matig, en
-- wat een horloge daarover weet komt niet mee in een schermafdruk.
--
-- HOE DIT GETOETST IS
--
-- Op een lege Postgres met het hele schema uit
-- `gereedschap/verhuizing/schema-gegenereerd.sql` erin, met zeventien gevallen
-- binnen een transactie die zichzelf terugrolt. Veertien mutanten gedood.
--
-- Vier daarvan gingen over de buurman, en die hadden er eerst niet gestaan: met
-- één gebruiker in de proef kan een vergeten `gebruiker_id = v_id` nergens uit
-- komen. Toen dat geval erbij kwam, bleken drie mutaties die er tot dan toe
-- doorheen liepen: `kal_ophalen` dat de lijst van een ander meestuurt,
-- `kal_rij_wissen` dat de rij van een ander wist, en een dubbelvergelijking die
-- over de gebruikersgrens heen kijkt, alle drie zichtbaar. RLS staat aan
-- zonder policies, dus deze functies zíjn de grens; er is geen tweede slot dat
-- een fout hier opvangt.
--
-- TERUGDRAAIEN
--
--   drop function if exists public.kal_inspanning_toevoegen(text, jsonb);
--   -- en in kal_rij_toevoegen, kal_rij_wissen en kal_ophalen de tak
--   -- 'inspanning' weer weghalen; de vorige versies staan in
--   -- gereedschap/verhuizing/schema-gegenereerd.sql
--   drop table if exists public.kal_inspanning;
--
-- De tabel weggooien wist wat erin staat. Wie alleen de app wil terugzetten
-- laat hem staan: zonder de tak in `kal_ophalen` komt hij nergens meer langs.
-- ===========================================================================

BEGIN;

create table if not exists public.kal_inspanning (
  id            uuid primary key default gen_random_uuid(),
  gebruiker_id  uuid not null,
  datum         date not null,
  soort         text not null,
  /* Alleen gevuld bij soort 'anders'. Deze lijst is nooit af, en "Anders" in de
     lijst is geen naam, dan staat er drie keer hetzelfde. */
  eigennaam     text,
  /* Meer dan een etmaal kan niet, en nul minuten is geen inspanning maar een
     afgebroken invoer. De grens waarboven een post onaannemelijk wórdt (vier
     uur) staat niet hier: die zet in de app een vinkje uit en hoort geen rij te
     weigeren die een mens er met opzet in zet. */
  minuten       integer not null check (minuten > 0 and minuten <= 1440),
  intensiteit   text not null check (intensiteit in ('matig','zwaar')),
  geschat       boolean not null default true,
  bron          text not null default 'app',
  tijd          time,
  notitie       text,
  created_at    timestamptz not null default now()
);

create index if not exists kal_inspanning_gebruiker_datum
  on public.kal_inspanning (gebruiker_id, datum);

/* RLS aan zonder policies, net als de rest van dit schema: de tabel is niet
   rechtstreeks te lezen en de functies hieronder bepalen wat eruit mag. */
alter table public.kal_inspanning enable row level security;

comment on table public.kal_inspanning is
  'Aerobe inspanning per keer: soort, duur en intensiteit. Krachttraining staat in kal_training en telt apart.';
comment on column public.kal_inspanning.geschat is
  'true = de intensiteit is afgeleid uit de soort, false = een mens heeft hem gekozen.';

COMMIT;


BEGIN;

-- --------------------------------------------------------------------------
-- Eén rij erbij, via dezelfde weg als een training of een meting.
-- --------------------------------------------------------------------------
create or replace function public.kal_rij_toevoegen(p_token text, p_tabel text, p_rij jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_id uuid; v_uit jsonb;
begin
  v_id := kal_sessie(p_token);
  if p_tabel = 'product' then
    insert into kal_producten(gebruiker_id, naam, per, eenheid, kcal, eiwit_g, vet_g, koolhydraat_g, vezel_g, conf, tag, nevo_code)
    values (v_id, p_rij->>'naam', coalesce((p_rij->>'per')::numeric,100), coalesce(p_rij->>'eenheid','g'),
            (p_rij->>'kcal')::numeric, nullif(p_rij->>'eiwit_g','')::numeric, nullif(p_rij->>'vet_g','')::numeric,
            nullif(p_rij->>'koolhydraat_g','')::numeric, nullif(p_rij->>'vezel_g','')::numeric,
            coalesce(p_rij->>'conf','A'), p_rij->>'tag', p_rij->>'nevo_code')
    returning to_jsonb(kal_producten.*) into v_uit;
  elsif p_tabel = 'meting' then
    insert into kal_metingen(gebruiker_id, datum, soort, waarde, eenheid, notitie)
    values (v_id, (p_rij->>'datum')::date, p_rij->>'soort', (p_rij->>'waarde')::numeric, p_rij->>'eenheid', p_rij->>'notitie')
    returning to_jsonb(kal_metingen.*) into v_uit;
  elsif p_tabel = 'lab' then
    insert into kal_labs(gebruiker_id, datum, code, naam, waarde, eenheid, ref_laag, ref_hoog, notitie)
    values (v_id, (p_rij->>'datum')::date, p_rij->>'code', p_rij->>'naam', nullif(p_rij->>'waarde','')::numeric,
            p_rij->>'eenheid', nullif(p_rij->>'ref_laag','')::numeric, nullif(p_rij->>'ref_hoog','')::numeric, p_rij->>'notitie')
    returning to_jsonb(kal_labs.*) into v_uit;
  elsif p_tabel = 'vragenlijst' then
    insert into kal_vragenlijsten(gebruiker_id, datum, soort, antwoorden, score, klasse)
    values (v_id, (p_rij->>'datum')::date, p_rij->>'soort', coalesce(p_rij->'antwoorden','{}'::jsonb),
            nullif(p_rij->>'score','')::numeric, p_rij->>'klasse')
    returning to_jsonb(kal_vragenlijsten.*) into v_uit;
  elsif p_tabel = 'training' then
    insert into kal_training(gebruiker_id, datum, oefening, spiergroep, sets, reps, gewicht_kg, rpe, notitie)
    values (v_id, (p_rij->>'datum')::date, p_rij->>'oefening', p_rij->>'spiergroep',
            nullif(p_rij->>'sets','')::integer, nullif(p_rij->>'reps','')::integer,
            nullif(p_rij->>'gewicht_kg','')::numeric, nullif(p_rij->>'rpe','')::numeric, p_rij->>'notitie')
    returning to_jsonb(kal_training.*) into v_uit;
  elsif p_tabel = 'inspanning' then
    insert into kal_inspanning(gebruiker_id, datum, soort, eigennaam, minuten, intensiteit, geschat, bron, tijd, notitie)
    values (v_id, (p_rij->>'datum')::date, p_rij->>'soort', nullif(p_rij->>'eigennaam',''),
            round(nullif(p_rij->>'minuten','')::numeric)::integer,
            coalesce(nullif(p_rij->>'intensiteit',''), 'matig'),
            coalesce((p_rij->>'geschat')::boolean, true),
            coalesce(nullif(p_rij->>'bron',''), 'app'),
            nullif(p_rij->>'tijd','')::time, p_rij->>'notitie')
    returning to_jsonb(kal_inspanning.*) into v_uit;
  else
    raise exception 'Onbekende tabel %', p_tabel;
  end if;
  return v_uit;
end $function$;

create or replace function public.kal_rij_wissen(p_token text, p_tabel text, p_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_id uuid;
begin
  v_id := kal_sessie(p_token);
  if    p_tabel = 'product'     then delete from kal_producten     where id = p_id and gebruiker_id = v_id;
  elsif p_tabel = 'meting'      then delete from kal_metingen      where id = p_id and gebruiker_id = v_id;
  elsif p_tabel = 'lab'         then delete from kal_labs          where id = p_id and gebruiker_id = v_id;
  elsif p_tabel = 'vragenlijst' then delete from kal_vragenlijsten where id = p_id and gebruiker_id = v_id;
  elsif p_tabel = 'training'    then delete from kal_training      where id = p_id and gebruiker_id = v_id;
  elsif p_tabel = 'inspanning'  then delete from kal_inspanning    where id = p_id and gebruiker_id = v_id;
  else raise exception 'Onbekende tabel %', p_tabel;
  end if;
end $function$;

-- --------------------------------------------------------------------------
-- Een hele lijst in één keer: de weg die het importvenster loopt.
--
-- WAAROM DIT NIET GEWOON EEN LUS OVER kal_rij_toevoegen IS
--
-- Omdat twee keer dezelfde afdruk importeren niet twee keer mag tellen. Een
-- rij die er al staat: zelfde dag, zelfde soort, zelfde duur, zelfde herkomst
--: wordt overgeslagen, en het antwoord zegt hoeveel dat er waren.
--
-- Wat die regel kost: twee werkelijk identieke ritten op één dag, allebei uit
-- dezelfde import, worden er één. Dat is zeldzaam en het is te zien (de lijst
-- van die dag toont wat er staat); de tweede is met de hand toe te voegen. Het
-- omgekeerde (stilzwijgend verdubbelen bij een herhaalde import) is niet te
-- zien en niet terug te vinden.
--
-- De vergelijking gaat niet over `tijd`: de work-outlijst geeft die lang niet
-- altijd, en dan zou null ≠ null elke rij alsnog dubbel laten binnenkomen.
-- --------------------------------------------------------------------------
create or replace function public.kal_inspanning_toevoegen(p_token text, p_rijen jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_id uuid; v_rij jsonb; v_n integer := 0; v_dubbel integer := 0;
  v_datum date; v_soort text; v_min integer; v_bron text;
begin
  v_id := kal_sessie(p_token);
  if jsonb_typeof(p_rijen) is distinct from 'array' then
    raise exception 'Een lijst rijen verwacht';
  end if;
  if jsonb_array_length(p_rijen) > 200 then
    raise exception 'Hooguit 200 rijen per keer';
  end if;

  for v_rij in select * from jsonb_array_elements(p_rijen) loop
    v_datum := nullif(v_rij->>'datum','')::date;
    v_soort := nullif(v_rij->>'soort','');
    v_min   := round(nullif(v_rij->>'minuten','')::numeric)::integer;
    v_bron  := coalesce(nullif(v_rij->>'bron',''), 'import');
    if v_datum is null or v_soort is null or v_min is null or v_min <= 0 then
      continue;
    end if;

    if exists (select 1 from kal_inspanning x
                where x.gebruiker_id = v_id and x.datum = v_datum
                  and x.soort = v_soort and x.minuten = v_min and x.bron = v_bron) then
      v_dubbel := v_dubbel + 1;
      continue;
    end if;

    insert into kal_inspanning(gebruiker_id, datum, soort, eigennaam, minuten,
                               intensiteit, geschat, bron, tijd, notitie)
    values (v_id, v_datum, v_soort, nullif(v_rij->>'eigennaam',''), v_min,
            coalesce(nullif(v_rij->>'intensiteit',''), 'matig'),
            coalesce((v_rij->>'geschat')::boolean, true),
            v_bron, nullif(v_rij->>'tijd','')::time, v_rij->>'notitie');
    v_n := v_n + 1;
  end loop;

  return jsonb_build_object('toegevoegd', v_n, 'overgeslagen', v_dubbel);
end $function$;

comment on function public.kal_inspanning_toevoegen(text, jsonb) is
  'Een lijst inspanningen wegschrijven. Een rij die er al staat (zelfde dag, soort, duur en herkomst) wordt overgeslagen en geteld.';

grant execute on function public.kal_inspanning_toevoegen(text, jsonb) to anon, authenticated;

-- --------------------------------------------------------------------------
-- En de lijst mee naar het scherm.
-- --------------------------------------------------------------------------
create or replace function public.kal_ophalen(p_token text, p_vanaf date default null::date)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_id uuid; v_vanaf date;
begin
  v_id := kal_sessie(p_token);
  v_vanaf := coalesce(p_vanaf, current_date - 400);
  return jsonb_build_object(
    'profiel', (select to_jsonb(p) from kal_profiel p where p.gebruiker_id = v_id),
    'dagen', coalesce((select jsonb_agg(to_jsonb(d) order by d.datum)
                       from kal_dagen d where d.gebruiker_id = v_id and d.datum >= v_vanaf), '[]'::jsonb),
    'regels', coalesce((select jsonb_agg(to_jsonb(r) order by r.datum, r.created_at)
                       from kal_regels r where r.gebruiker_id = v_id and r.datum >= v_vanaf), '[]'::jsonb),
    'producten', coalesce((select jsonb_agg(to_jsonb(x) order by x.naam)
                       from kal_producten x where x.gebruiker_id = v_id), '[]'::jsonb),
    'recepten', coalesce((select jsonb_agg(jsonb_build_object(
                            'recept', to_jsonb(rc),
                            'regels', coalesce((select jsonb_agg(to_jsonb(rr) order by rr.positie)
                                                from kal_recept_regels rr where rr.recept_id = rc.id), '[]'::jsonb))
                          order by rc.naam)
                       from kal_recepten rc where rc.gebruiker_id = v_id), '[]'::jsonb),
    'metingen', coalesce((select jsonb_agg(to_jsonb(m) order by m.datum)
                       from kal_metingen m where m.gebruiker_id = v_id), '[]'::jsonb),
    'labs', coalesce((select jsonb_agg(to_jsonb(l) order by l.datum)
                       from kal_labs l where l.gebruiker_id = v_id), '[]'::jsonb),
    'vragenlijsten', coalesce((select jsonb_agg(to_jsonb(v) order by v.datum)
                       from kal_vragenlijsten v where v.gebruiker_id = v_id), '[]'::jsonb),
    'training', coalesce((select jsonb_agg(to_jsonb(t) order by t.datum)
                       from kal_training t where t.gebruiker_id = v_id and t.datum >= v_vanaf), '[]'::jsonb),
    'inspanning', coalesce((select jsonb_agg(to_jsonb(i) order by i.datum, i.created_at)
                       from kal_inspanning i where i.gebruiker_id = v_id and i.datum >= v_vanaf), '[]'::jsonb)
  );
end $function$;

COMMIT;


-- ===========================================================================
-- NAKIJKEN
-- ===========================================================================
--
--   begin;
--   -- één met de hand
--   select kal_rij_toevoegen('<token>', 'inspanning',
--     '{"datum":"2015-01-02","soort":"rennen","minuten":40,"intensiteit":"zwaar","geschat":false}');
--   -- een lijst uit een import, twee keer dezelfde
--   select kal_inspanning_toevoegen('<token>',
--     '[{"datum":"2015-01-02","soort":"wandelen","minuten":30},
--       {"datum":"2015-01-02","soort":"wandelen","minuten":30}]');
--     -- verwacht: {"toegevoegd": 1, "overgeslagen": 1}
--   select kal_inspanning_toevoegen('<token>',
--     '[{"datum":"2015-01-02","soort":"wandelen","minuten":30}]');
--     -- verwacht: {"toegevoegd": 0, "overgeslagen": 1}: nog eens draaien doet niets
--   select soort, minuten, intensiteit, geschat, bron from kal_inspanning
--    where datum = '2015-01-02' order by created_at;
--     -- verwacht: rennen 40 zwaar f app · wandelen 30 matig t import
--   select jsonb_array_length(kal_ophalen('<token>')->'inspanning');  -- 2
--   rollback;
--
-- En met het token van iemand anders, want dit is de enige grens die er is:
--
--   select jsonb_array_length(kal_ophalen('<ander token>')->'inspanning');  -- 0
--
-- En de grenzen, die horen te weigeren:
--
--   select kal_rij_toevoegen('<token>', 'inspanning',
--     '{"datum":"2015-01-02","soort":"wandelen","minuten":0}');        -- fout
--   select kal_rij_toevoegen('<token>', 'inspanning',
--     '{"datum":"2015-01-02","soort":"wandelen","minuten":30,"intensiteit":"licht"}'); -- fout
-- ===========================================================================
