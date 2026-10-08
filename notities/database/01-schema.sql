-- Notities: het schema van de notetaker.
--
-- Dit draait in een EIGEN Supabase-project, los van de database van BennaHub.
-- Daar gaat alle toegang via SECURITY DEFINER-functies en staat RLS aan zonder
-- policies. Hier niet, en dat is een keuze: er is precies één gebruiker, de app
-- leest en schrijft rechtstreeks in de tabellen, en elke rij draagt zijn
-- eigenaar. De policies hieronder laten alleen die eigenaar bij zijn rijen.
-- De worker gebruikt de service-role-sleutel en gaat daar langs.
--
-- Eén keer draaien in de SQL-editor van het nieuwe project. Twee keer draaien
-- verandert niets: alles is `if not exists`, `create or replace` of
-- `on conflict do nothing`.

create extension if not exists vector with schema extensions;

-- Contexten: waar een notitie bij hoort en hoe hij wordt samengevat.
create table if not exists contexts (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references auth.users(id) on delete cascade,
  naam               text not null,
  drive_folder_id    text,                          -- de worker vult dit bij het eerste gebruik
  agenda_trefwoorden text[] not null default '{}',  -- vergeleken met de titel van een afspraak of bestand
  instructie         text not null default '',      -- extra aanwijzing voor de samenvatting
  volgorde           int not null default 100,
  unique (owner_id, naam)
);

create table if not exists notes (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references auth.users(id) on delete cascade,
  status               text not null default 'opname'
                       check (status in ('opname','klaar_voor_verwerking','transcriberen','samenvatten',
                                         'gereed','goedgekeurd','opnieuw','fout')),
  bron                 text not null default 'app' check (bron in ('app','upload','drive')),
  context_id           uuid references contexts(id) on delete set null,
  context_vast         boolean not null default false,  -- door de gebruiker gekozen: niet overschrijven
  titel                text,
  gestart_op           timestamptz not null default now(),
  duur_sec             int,
  agenda_event_id      text,
  agenda_titel         text,
  deelnemers           text[] not null default '{}',
  samenvatting         jsonb,       -- de volledige gestructureerde uitvoer van het taalmodel
  transcript           text,
  drive_doc_id         text,
  drive_bron_file_id   text,        -- bij binnenkomst via de Drive-inbox
  modellen             jsonb not null default '{}',  -- welke dienst en welk model, ook bij uitval
  fout                 text,
  audio_verwijderen_na timestamptz,
  audio_verwijderd     boolean not null default false,
  embedding            extensions.vector(1536),
  aangemaakt           timestamptz not null default now(),
  bijgewerkt           timestamptz not null default now()
);
create index if not exists notes_status_idx on notes(status);
create index if not exists notes_owner_idx on notes(owner_id, gestart_op desc);

create table if not exists segments (
  id       bigserial primary key,
  note_id  uuid not null references notes(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  spreker  text,
  start_s  real,
  eind_s   real,
  tekst    text not null
);
create index if not exists segments_note_idx on segments(note_id, start_s);

create table if not exists actions (
  id         uuid primary key default gen_random_uuid(),
  note_id    uuid not null references notes(id) on delete cascade,
  owner_id   uuid not null references auth.users(id) on delete cascade,
  wie        text,
  wat        text not null,
  deadline   date,
  van_mij    boolean not null default false,
  afgerond   boolean not null default false,
  aangemaakt timestamptz not null default now()
);
create index if not exists actions_open_idx on actions(owner_id, afgerond, deadline);

-- Instellingen, één rij per gebruiker.
create table if not exists settings (
  owner_id                  uuid primary key references auth.users(id) on delete cascade,
  mijn_naam                 text not null default 'Abdelkader',
  stemreferentie_pad        text,   -- pad in de bucket 'audio'
  drive_root_folder_id      text,   -- de map 'Notities' in Drive; de worker maakt hem aan
  drive_inbox_folder_id     text,   -- de map 'Notities/_inbox'; idem
  bewaartermijn_audio_dagen int not null default 30
);

create or replace function touch_bijgewerkt() returns trigger
language plpgsql set search_path = public as $$
begin new.bijgewerkt = now(); return new; end $$;
drop trigger if exists notes_touch on notes;
create trigger notes_touch before update on notes for each row execute function touch_bijgewerkt();

-- RLS: alles alleen voor de eigenaar, en alleen voor wie is ingelogd. De rol
-- anon komt nergens bij, ook niet bij een lege uitkomst.
alter table contexts enable row level security;
alter table notes    enable row level security;
alter table segments enable row level security;
alter table actions  enable row level security;
alter table settings enable row level security;

do $$
declare t text;
begin
  foreach t in array array['contexts','notes','segments','actions','settings'] loop
    execute format('drop policy if exists eigenaar on %I', t);
    execute format('create policy eigenaar on %I for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t);
  end loop;
end $$;

-- Opslag: een besloten bucket, één map per gebruiker: {owner_id}/{note_id}/chunk-00001.webm
insert into storage.buckets (id, name, public) values ('audio', 'audio', false)
on conflict (id) do nothing;

drop policy if exists audio_eigenaar on storage.objects;
create policy audio_eigenaar on storage.objects for all to authenticated
  using (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'audio' and (storage.foldername(name))[1] = auth.uid()::text);

-- Zoeken op betekenis over de eigen notities.
create or replace function zoek_notities(query_embedding extensions.vector(1536), aantal int default 10)
returns table (id uuid, titel text, gestart_op timestamptz, context_id uuid, score real)
language sql stable security invoker set search_path = public, extensions as $$
  select n.id, n.titel, n.gestart_op, n.context_id,
         (1 - (n.embedding <=> query_embedding))::real as score
  from notes n
  where n.owner_id = auth.uid() and n.embedding is not null
  order by n.embedding <=> query_embedding
  limit aantal;
$$;

-- De standaardcontexten en de instellingen voor wie is ingelogd. De app roept
-- dit aan bij de eerste keer; het neemt geen gebruiker als argument maar
-- auth.uid(), zodat niemand rijen op naam van een ander kan aanmaken.
drop function if exists maak_standaard_aan(uuid);
create or replace function maak_standaard_aan() returns void
language plpgsql security invoker set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'niet ingelogd'; end if;
  insert into settings (owner_id) values (uid) on conflict do nothing;
  insert into contexts (owner_id, naam, agenda_trefwoorden, instructie, volgorde) values
    (uid, 'ASF Limburg', array['ASF','Achterstandsfonds'],
     'Bestuursvergadering of overleg van Stichting Achterstandsfonds Limburg; Abdelkader is voorzitter. Leg besluiten formeel en genummerd vast, met eventuele stemming en wie wat uitvoert.', 10),
    (uid, 'Meditta CVRM', array['Meditta','CVRM','kader'],
     'Overleg als kaderarts CVRM bij Meditta. Let op inhoudelijke afspraken over zorgprogramma, scholing, indicatoren en wie wat oppakt.', 20),
    (uid, 'BAC Digitalisering', array['BAC','digitalisering'],
     'Adviescommissie Digitalisering Meditta (zonder mandaat). Onderscheid scherp tussen advies, standpunten van leden en besluiten die elders (HaCo/RHO) liggen.', 30),
    (uid, 'Het Roosendael', array['Roosendael','praktijkoverleg','VvIT','apotheek','FTO'],
     'Zakelijk overleg rond Huisartsenpraktijk Het Roosendael (geen patiëntgegevens). Leg afspraken, bedragen, leveranciers en deadlines vast.', 40),
    (uid, 'Holding & vastgoed', array['Benholding','accountant','notaris','pand'],
     'Zakelijk overleg over Benholding BV, BenMedical BV, vastgoed of fiscaliteit. Leg bedragen, termijnen en open juridische of fiscale vragen nauwkeurig vast.', 50),
    (uid, 'De Kaboutertjes', array['Kaboutertjes','kinderdagverblijf'],
     'Overleg rond Kinderdagverblijf De Kaboutertjes.', 60),
    (uid, 'ProVita & software', array['ProVita','SmartVoice','developer'],
     'Overleg over ProVita Care of eigen software. Leg technische besluiten, scope en planning vast.', 70),
    (uid, 'Telefoon', array[]::text[],
     'Telefoongesprek. Houd het kort: één alinea samenvatting, afspraken en de vervolgstap.', 80),
    (uid, 'Overig', array[]::text[], '', 90)
  on conflict do nothing;
end $$;
revoke all on function maak_standaard_aan() from public, anon;
grant execute on function maak_standaard_aan() to authenticated;
