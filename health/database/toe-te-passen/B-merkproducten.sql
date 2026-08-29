-- ===========================================================================
-- B. MERKPRODUCTEN — de winkel erbij, zonder te doen alsof het metingen zijn
-- ===========================================================================
--
-- Nog niet toegepast. Zie de kop van bestand A voor waarom dit hier staat en
-- niet in `health/database/`.
--
-- DE VRAAG
--
-- Yazio kan zeggen: dit is het product van de Lidl, en zoveel weegt de
-- verpakking. Dat is prettig, en wij kunnen het ook — Open Food Facts heeft die
-- gegevens, met streepjescode, merk en gewicht.
--
-- WAAROM ZE NIET IN `nevo_foods` MOGEN
--
-- Dit is de belangrijkste beslissing in dit bestand, en hij is niet
-- vrijblijvend.
--
-- Wat in NEVO staat is gemeten: laboratoriumbepalingen, met een bekende
-- methode. Wat op een etiket staat is een opgave van de fabrikant, met een
-- wettelijke speelruimte die voor de meeste voedingswaarden rond de twintig
-- procent ligt. Dat zijn twee verschillende soorten getal.
--
-- De app is er sinds kort op ingericht om dat verschil te tónen: ◆ betekent
-- "gemeten waarde uit de voedingsmiddelentabel", ◇ betekent geschat. Dat teken
-- wordt afgeleid uit `nevo_code` (zie `src/health/herkomst.tsx`). Zouden we
-- merkgegevens in `nevo_foods` schuiven, dan kregen ze ◆ en zou de app beweren
-- dat een etiketopgave een laboratoriumbepaling is. Dat is precies de leugen die
-- deze hele app probeert niet te vertellen.
--
-- Dus een eigen tabel, met een eigen herkomst. Voor het scherm betekent dat een
-- derde geval naast gemeten en geschat, en dat is app-werk dat hierna komt.
--
-- DE LICENTIEPOORT, NET ALS BIJ NEVO
--
-- `nevo_versies` heeft een schakelaar: staat de licentie niet op gecontroleerd,
-- dan is de weergave `nevo_actief` leeg en vindt zoeken niets. Dat is een goed
-- ontwerp en het geldt hier net zo goed. Open Food Facts staat onder ODbL: je
-- mag het gebruiken en verspreiden, maar bronvermelding is verplicht en een
-- afgeleide database valt onder dezelfde voorwaarden. Dat is voor een
-- gezinsapp prima, maar het is wél een voorwaarde, en een voorwaarde die
-- nergens vastligt wordt vergeten.
--
-- Vandaar dezelfde constructie: geen bronvermelding en geen gecontroleerde
-- licentie betekent geen zichtbare rijen.


-- ---------------------------------------------------------------------------
-- BLOK 1 — DE BRONNENTABEL
-- ---------------------------------------------------------------------------

create table if not exists public.merk_bronnen (
  bron                        text primary key,
  is_actief                   boolean not null default false,
  licentie                    text,
  licentie_gecontroleerd      boolean not null default false,
  licentie_gecontroleerd_op   date,
  licentie_gecontroleerd_door text,
  bronvermelding              text,
  aantal_items                integer,
  geimporteerd_op             timestamptz,
  created_at                  timestamptz not null default now(),

  -- Dezelfde twee sloten als bij NEVO: actief kan alleen met een gecontroleerde
  -- licentie, en gecontroleerd kan alleen als er staat wie het wanneer deed.
  constraint merk_actief_vereist_licentiecheck
    check (is_actief = false or licentie_gecontroleerd = true),
  constraint merk_licentiecheck_herleidbaar
    check (licentie_gecontroleerd = false
           or (licentie_gecontroleerd_op is not null
               and licentie_gecontroleerd_door is not null)),
  -- En één slot dat NEVO niet heeft: ODbL verplicht bronvermelding, dus zonder
  -- die tekst mag deze bron nooit aan.
  constraint merk_actief_vereist_bronvermelding
    check (is_actief = false or coalesce(bronvermelding, '') <> '')
);

comment on table public.merk_bronnen is
  'Herkomst van merkgegevens, met licentiepoort. Zonder gecontroleerde licentie en bronvermelding is de bron niet zichtbaar.';


-- ---------------------------------------------------------------------------
-- BLOK 2 — DE PRODUCTEN
-- ---------------------------------------------------------------------------

create table if not exists public.merk_producten (
  id              uuid primary key default gen_random_uuid(),
  bron            text not null references public.merk_bronnen(bron) on delete cascade,
  -- De streepjescode is de sleutel van het product bij de bron. Uniek per bron,
  -- zodat opnieuw importeren bijwerkt in plaats van verdubbelt.
  barcode         text not null,
  naam            text not null,
  merk            text,
  groep           text,

  -- Voedingswaarde per 100 g, net als NEVO, zodat de rekenkern er niets van
  -- hoeft te weten.
  energie_kcal_per_100g numeric(8,2) not null,
  eiwit_g         numeric(8,2),
  vet_g           numeric(8,2),
  koolhydraten_g  numeric(8,2),
  vezels_g        numeric(8,2),
  suikers_g       numeric(8,2),

  -- Waar het de gebruiker om te doen is: wat weegt de verpakking, en wat noemt
  -- de fabrikant een portie. Beide mogen ontbreken; niet elk product heeft ze.
  verpakking_gram numeric(10,2),
  portie_gram     numeric(10,2),
  portie_naam     text,

  synoniemen      text[] not null default '{}',
  geimporteerd_op timestamptz not null default now(),

  constraint merk_producten_bron_barcode unique (bron, barcode),
  constraint merk_energie_check     check (energie_kcal_per_100g >= 0),
  constraint merk_eiwit_check       check (eiwit_g is null or eiwit_g >= 0),
  constraint merk_vet_check         check (vet_g is null or vet_g >= 0),
  constraint merk_kh_check          check (koolhydraten_g is null or koolhydraten_g >= 0),
  constraint merk_verpakking_check  check (verpakking_gram is null or verpakking_gram > 0),
  constraint merk_portie_check      check (portie_gram is null or portie_gram > 0)
);

create index if not exists merk_producten_naam_trgm
  on public.merk_producten using gin (naam extensions.gin_trgm_ops);
create index if not exists merk_producten_merk
  on public.merk_producten (merk);

comment on table public.merk_producten is
  'Etiketgegevens van merkproducten. Geen laboratoriumwaarden: zie de kop van B-merkproducten.sql.';

-- De weergave met de poort erin, precies zoals `nevo_actief`.
create or replace view public.merk_actief as
  select p.*, b.bronvermelding
    from public.merk_producten p
    join public.merk_bronnen b on b.bron = p.bron
   where b.is_actief and b.licentie_gecontroleerd;


-- ---------------------------------------------------------------------------
-- BLOK 3 — DICHTZETTEN
-- ---------------------------------------------------------------------------
--
-- Zoals alles hier: RLS aan, geen policies, geen rechten voor anon. De toegang
-- loopt straks via een `kal_*`-functie en niet via de tabel.

alter table public.merk_bronnen   enable row level security;
alter table public.merk_producten enable row level security;

revoke all on public.merk_bronnen   from anon, authenticated;
revoke all on public.merk_producten from anon, authenticated;
revoke all on public.merk_actief    from anon, authenticated;


-- ---------------------------------------------------------------------------
-- BLOK 4 — DE BRON AANMELDEN
-- ---------------------------------------------------------------------------
--
-- Zet `licentie_gecontroleerd` pas op true als je het zelf hebt nagekeken. De
-- constraint dwingt af dat er dan ook staat wie en wanneer — vul je eigen naam
-- in, niet de mijne, want jij bent degene die het gecontroleerd heeft.
--
-- Zolang `is_actief` op false staat is `merk_actief` leeg en verandert er niets
-- aan de app. Dat is de veilige volgorde: eerst importeren, dan kijken, dan pas
-- aanzetten.

insert into merk_bronnen (bron, licentie, bronvermelding, is_actief)
values ('openfoodfacts',
        'ODbL 1.0 (database) / DbCL 1.0 (inhoud)',
        'Gegevens uit Open Food Facts, beschikbaar onder de Open Database License.',
        false)
on conflict (bron) do nothing;

-- Nakijken:
select bron, is_actief, licentie_gecontroleerd, bronvermelding from merk_bronnen;

-- Aanzetten, later, als de gegevens erin staan en je ze bekeken hebt:
-- update merk_bronnen
--    set licentie_gecontroleerd = true,
--        licentie_gecontroleerd_op = current_date,
--        licentie_gecontroleerd_door = 'VUL JE EIGEN NAAM IN',
--        is_actief = true
--  where bron = 'openfoodfacts';
