-- =============================================================================
-- DE DAG IN PEILINGEN, ZODAT BEWEGING OOK IETS KAN ADVISEREN
--
-- Toegepast 23 augustus 2026.
--
-- Het probleem is scherp gesteld: eten voer je zelf in, dus dat is er meteen.
-- Beweging komt één keer per etmaal binnen, om 23:45, als de dag al voorbij is.
-- Adviseren over iets wat je pas achteraf weet, kan niet.
--
-- De helft van de oplossing zit niet in de database maar op de telefoon: laat
-- de opdracht vaker vuren. Vier of vijf keer per dag in plaats van één keer, en
-- de stand op het scherm loopt mee. Dat werkt vandaag al, zonder wijziging:
-- `stappen` heeft de regel "het toestel wint", en een nieuwere stand is altijd
-- hoger dan de vorige.
--
-- Maar dan weet de app nog steeds niet of 3.400 stappen om drie uur véél of
-- weinig is. Daarvoor moet hij weten hoe jóuw dag normaal verloopt, en dat is
-- niet af te leiden uit dagtotalen: die zeggen niets over het tempo binnen de
-- dag. Twee dagen van 8.000 stappen kunnen een ochtendwandeling zijn of een
-- avondrondje, en het advies om drie uur is in die twee gevallen tegengesteld.
--
-- Vandaar deze tabel. Elke keer dat de opdracht een stand van vandáág doorgeeft,
-- blijft die stand staan mét het tijdstip. Na een paar weken is daaruit af te
-- lezen hoe ver je op een gewone dinsdag om drie uur bent, en pas dán kan de app
-- zeggen dat je achterloopt zonder dat te verzinnen.
--
-- Dat is de reden dat dit nú gebouwd wordt en niet als het advies aan de beurt
-- is: elke dag zonder peilingen is een dag geschiedenis die niet meer in te
-- halen valt.
--
-- Twee dingen die deze tabel expres níét doet.
--
--   Hij vervangt `kal_dagen` niet. Daar staat het dagtotaal, en dat blijft de
--   waarheid over een dag. Dit zijn tussenstanden, en een tussenstand is geen
--   meting van de dag maar van een moment erin.
--
--   Hij rekent niet mee in het model. Stappen zitten sowieso niet in de
--   verbruiksschatting — zie hoofdstuk 6 van VERANTWOORDING.md — en een advies
--   om te wandelen is hier dus nooit een calorieënhandel ("dit gegeten, dat
--   eraf lopen"). Het is een uitspraak over je eigen patroon, meer niet.
-- =============================================================================

create table if not exists public.kal_beweging_peilingen (
  id                   uuid primary key default gen_random_uuid(),
  gebruiker_id         uuid not null references public.kal_gebruikers(id) on delete cascade,
  datum                date not null,
  /* Het tijdstip in Amsterdamse minuten sinds middernacht. Een timestamptz
     staat er los naast: voor het patroon telt de lokale klok, want daar leeft
     je dag in, maar voor het naspeuren van een rare rij wil je het echte
     moment. */
  minuut               integer not null check (minuut between 0 and 1439),
  op                   timestamptz not null default now(),
  stappen              integer,
  actieve_energie_kcal integer
);

create index if not exists kal_peilingen_zoek
  on public.kal_beweging_peilingen (gebruiker_id, datum, minuut);

-- Zoals de rest van dit schema: aan, zonder policies. De tabellen zijn niet
-- rechtstreeks te lezen; de functies bepalen wat eruit mag.
alter table public.kal_beweging_peilingen enable row level security;

-- -----------------------------------------------------------------------------
-- Een tussenstand vastleggen.
--
-- Alleen voor vandaag: een bericht dat een oude dag bijwerkt is een inhaalslag
-- en geen peiling, en zou het patroon vervuilen met een stand van 8.000 stappen
-- "om 23:45" die in werkelijkheid het totaal van drie dagen geleden is.
--
-- En alleen als er iets in staat. Een bericht met alleen een rustpols zegt niets
-- over je tempo.
-- -----------------------------------------------------------------------------
create or replace function public.kal_peiling_vastleggen(
  p_gebruiker uuid,
  p_datum     date,
  p_stappen   numeric,
  p_energie   numeric
) returns boolean
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_nu    timestamp := now() at time zone 'Europe/Amsterdam';
  v_min   integer;
begin
  if p_gebruiker is null then return false; end if;
  if p_datum is distinct from v_nu::date then return false; end if;
  if p_stappen is null and p_energie is null then return false; end if;

  v_min := extract(hour from v_nu)::integer * 60 + extract(minute from v_nu)::integer;

  insert into kal_beweging_peilingen(gebruiker_id, datum, minuut, stappen, actieve_energie_kcal)
  values (p_gebruiker, p_datum, v_min,
          round(p_stappen)::integer, round(p_energie)::integer);
  return true;
end $$;

comment on function public.kal_peiling_vastleggen(uuid, date, numeric, numeric) is
  'Legt een tussenstand van vandaag vast met het tijdstip erbij. Alleen vandaag, alleen met inhoud.';

revoke all on function public.kal_peiling_vastleggen(uuid, date, numeric, numeric)
  from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Wat je op dit tijdstip normaal gesproken hebt staan.
--
-- Geeft per peiling van vandaag terug hoe de stand zich verhoudt tot je eigen
-- gewoonte rond dat tijdstip op eerdere dagen. Een venster van veertig minuten
-- aan weerszijden, want peilingen komen niet elke dag op de minuut gelijk.
--
-- `n` staat er expres bij en is het belangrijkste veld: onder de vijf eerdere
-- dagen zegt dit niets en hoort de app te zwijgen in plaats van een percentage
-- te tonen dat op twee dagen berust.
-- -----------------------------------------------------------------------------
create or replace function public.kal_beweging_gewoonte(
  p_gebruiker uuid,
  p_minuut    integer,
  p_dagen     integer default 60
) returns table(mediaan integer, n integer)
language sql
stable
security definer
set search_path to 'public', 'extensions'
as $$
  with eerder as (
    select datum, max(stappen) as stand
      from kal_beweging_peilingen
     where gebruiker_id = p_gebruiker
       and datum < (now() at time zone 'Europe/Amsterdam')::date
       and datum >= (now() at time zone 'Europe/Amsterdam')::date - p_dagen
       and minuut between p_minuut - 40 and p_minuut + 40
       and stappen is not null
     group by datum
  )
  select percentile_cont(0.5) within group (order by stand)::integer, count(*)::integer
    from eerder;
$$;

comment on function public.kal_beweging_gewoonte(uuid, integer, integer) is
  'De mediane stand rond dit tijdstip op eerdere dagen, met het aantal dagen waarop dat berust.';

revoke all on function public.kal_beweging_gewoonte(uuid, integer, integer)
  from public, anon, authenticated;
