-- =============================================================================
-- MERKPRODUCTEN — de winkel erbij, zonder te doen alsof het metingen zijn
--
-- Toegepast 29 augustus 2026.
--
-- Uitkomst: 854 producten van 40 merken, uit Lidl, Albert Heijn en Jumbo.
-- 696 met een verpakkingsgewicht, 606 met een portiegewicht. Opgehaald met
-- `gereedschap/merkgegevens.mjs`; van de 900 bekeken producten vielen er 46 af
-- omdat ze geen energiewaarde of geen naam hadden.
--
-- De controle op onwaarschijnlijke waarden gaf zestien treffers boven 800 kcal
-- per 100 g, en die waren alle zestien olie — 900 voor pure olijfolie, 828 voor
-- zonnebloem. Geen enkele invoerfout. Er is dus niets weggegooid.
--
-- Wat die controle níet ving: een naam als "SCORE CDE Milbona Smeerkaas Naturel
-- 200 ge Serveer" is vijftig tekens en glipt onder de grens van zestig door. Hij
-- staat er nog. Geldig product, rommelige naam.
--
-- =============================================================================

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


-- ===========================================================================
-- C. MERKPRODUCTEN VINDBAAR MAKEN
-- ===========================================================================
--
-- Nog niet toegepast. Draai dit ná B-merkproducten.sql.
--
-- B zette de tabellen neer; niets las ze. Dit maakt ze vindbaar, en verder
-- niets: zolang er geen bron actief is met een gecontroleerde licentie is
-- `merk_actief` leeg en verandert er niets aan de app.
--
-- WAAROM ONDERAAN
--
-- De emmer `merk` komt ná nevo, gerechten en eigen producten. Een etiketwaarde
-- is een opgave van de fabrikant met een wettelijke speelruimte van rond de
-- twintig procent; wat in NEVO staat is in een laboratorium bepaald. Die twee
-- door elkaar husselen zou de app laten doen alsof het hetzelfde soort getal is.
-- Het scherm toont ze dan ook apart, met een eigen teken.
--
-- DEZE TEKST IS AFGELEID EN NIET OVERGETYPT
--
-- `kal_zoeken` hieronder is de versie uit 12-telwoorden-uit-het-zoeken.sql — dus
-- mét de telwoorden in de vulwoordenlijst — met alleen de merk-emmer erbij. Zou
-- ik hem uit schema-gegenereerd.sql halen, dan draaide ik die correctie
-- stilletjes terug.


-- ---------------------------------------------------------------------------
-- BLOK 0 — EERST B, DAN DIT
-- ---------------------------------------------------------------------------
--
-- Dit bestand leunt op `merk_actief` uit B-merkproducten.sql. Draai je het los,
-- dan krijg je `type "public.merk_actief" does not exist` — een melding die
-- klopt maar niet zegt wat je eraan moet doen. Vandaar dit slot: het staat er
-- omdat een kop geen slot is.

do $$
begin
  if to_regclass('public.merk_actief') is null then
    raise exception
      'Draai eerst B-merkproducten.sql. De tabellen merk_bronnen en merk_producten bestaan nog niet, en zonder die twee heeft dit bestand niets om in te zoeken.';
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- BLOK 1 — ZOEKEN IN DE MERKPRODUCTEN
-- ---------------------------------------------------------------------------
--
-- Simpeler dan `kal_nevo_zoek`: geen woordweging, want deze tabel bevat
-- merknamen en die zoek je letterlijk. Wie "lidl roomboter" typt bedoelt precies
-- dat, en alle woorden moeten voorkomen.

CREATE OR REPLACE FUNCTION public.kal_merk_zoek(p_q text, p_limiet integer DEFAULT 15)
 RETURNS SETOF public.merk_actief
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with woorden as (
    select w from unnest(string_to_array(
      regexp_replace(regexp_replace(lower(trim(coalesce(p_q,''))),
                                    '[^a-zà-ÿ0-9 ]', ' ', 'g'), '\s+', ' ', 'g'), ' ')) w
     where length(w) >= 2
  )
  select m.* from merk_actief m
   where (select count(*) from woorden) > 0
     and (select bool_and(
            lower(m.naam || ' ' || coalesce(m.merk,'') || ' '
                  || coalesce(array_to_string(m.synoniemen, ' '), '')) like '%' || w || '%')
          from woorden)
   order by length(m.naam)
   limit least(coalesce(p_limiet, 15), 50);
$function$
;


-- ---------------------------------------------------------------------------
-- BLOK 2 — DE EMMER IN kal_zoeken
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.kal_zoeken(p_token text, p_q text, p_limiet integer DEFAULT 25)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_id uuid;
  v_q  text;
  v_w  text[];
begin
  v_id := kal_sessie(p_token);
  v_q := lower(trim(coalesce(p_q, '')));
  if length(v_q) < 2 then
    return '{"nevo":[],"gerechten":[],"eigen":[],"maaltijden":[]}'::jsonb;
  end if;

  -- woorden van twee letters of meer, zonder de gebruikelijke vulwoorden
  select coalesce(array_agg(w), '{}') into v_w
  from unnest(string_to_array(
         regexp_replace(regexp_replace(v_q, '[^a-zà-ÿ0-9 ]', ' ', 'g'), '\s+', ' ', 'g'),
         ' ')) as w
  where length(w) >= 2
    and w not in ('met','van','de','het','een','in','uit','op','aan','bij',
                  'er','of','en','per','voor','zonder',
                    -- telwoorden: ruis in een voedingstabel, en soms erger dan ruis
                    'twee','drie','vier','vijf','zes','zeven','acht','negen','tien',
                    'wat','beetje','stukje','paar');
  if array_length(v_w, 1) is null then v_w := array[v_q]; end if;

  return jsonb_build_object(
    -- Eigen maaltijden eerst opgezocht, want ze staan in het scherm ook bovenaan:
    -- wie "tonijn" typt bedoelt zijn eigen salade en niet de tabel. Er wordt in de
    -- naam én in de onderdelen gezocht, zodat "paprika" hem ook vindt.
    'maaltijden', coalesce((
      select jsonb_agg(kal_maaltijd_een(m.id) order by m.favoriet desc, length(m.naam))
      from kal_recepten m
     where m.gebruiker_id = v_id
       and (select bool_and(
              lower(m.naam || ' ' || coalesce(
                (select string_agg(g.naam, ' ') from kal_recept_regels g where g.recept_id = m.id),
                '')) like '%' || w || '%')
            from unnest(v_w) w)), '[]'::jsonb),

    'nevo', coalesce((
      select jsonb_agg(jsonb_build_object(
               'nevo_code', z.nevo_code, 'naam', z.naam_nl, 'groep', z.groep,
               'kcal', z.energie_kcal_per_100g, 'eiwit_g', z.eiwit_g, 'vet_g', z.vet_g,
               'koolhydraat_g', z.koolhydraten_g, 'vezel_g', z.vezels_g))
      from kal_nevo_zoek(p_q, least(coalesce(p_limiet, 25), 50)) z), '[]'::jsonb),

    'gerechten', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', d.id, 'naam', d.name_nl, 'keuken', d.cuisine,
               'omschrijving', d.description_nl, 'porties', d.default_servings,
               'status', d.validation_status))
      from (select * from cultural_dishes
             where owner_patient_id is null
               and (select bool_and(lower(coalesce(name_nl,'') || ' ' ||
                                          coalesce(description_nl,'') || ' ' ||
                                          coalesce(cuisine,'')) like '%' || w || '%')
                      from unnest(v_w) w)
             order by length(coalesce(name_nl,'')) limit 15) d), '[]'::jsonb),

    'eigen', coalesce((
      select jsonb_agg(to_jsonb(x))
      from (select * from kal_producten
             where gebruiker_id = v_id
               and (select bool_and(lower(naam) like '%' || w || '%') from unnest(v_w) w)
             order by length(naam) limit 15) x), '[]'::jsonb),

    -- Merkproducten uit `merk_actief`, dus achter de licentiepoort. Staat er
    -- geen actieve bron met gecontroleerde licentie, dan is deze emmer leeg en
    -- merkt de app er niets van. Zie B-merkproducten.sql.
    --
    -- Onderaan en niet bovenaan: een etiketwaarde is een opgave van de fabrikant
    -- en geen laboratoriumbepaling. Wat gemeten is hoort eerst te staan.
    'merk', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', x.id, 'barcode', x.barcode, 'naam', x.naam, 'merk', x.merk,
               'groep', x.groep, 'kcal', x.energie_kcal_per_100g,
               'eiwit_g', x.eiwit_g, 'vet_g', x.vet_g,
               'koolhydraat_g', x.koolhydraten_g, 'vezel_g', x.vezels_g,
               'verpakking_gram', x.verpakking_gram,
               'portie_gram', x.portie_gram, 'portie_naam', x.portie_naam))
      from (select * from merk_actief m
             where (select bool_and(
                      lower(m.naam || ' ' || coalesce(m.merk,'') || ' '
                            || coalesce(array_to_string(m.synoniemen, ' '), ''))
                      like '%' || w || '%')
                    from unnest(v_w) w)
             order by length(m.naam) limit 15) x), '[]'::jsonb)
  );
end $function$
;


-- ---------------------------------------------------------------------------
-- BLOK 3 — RECHTEN
-- ---------------------------------------------------------------------------
--
-- `kal_merk_zoek` is een hulpfunctie voor `kal_zoeken` en hoeft niet van buiten
-- aanroepbaar te zijn. `kal_zoeken` had zijn recht al; hij houdt het.

revoke all on function public.kal_merk_zoek(text, integer) from public, anon, authenticated;


-- ---------------------------------------------------------------------------
-- BLOK 4 — NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- Zolang de bron niet actief is hoort dit leeg te zijn. Dat is geen storing maar
-- de poort die doet wat hij moet doen.

select count(*) as zichtbare_merkproducten from merk_actief;
select count(*) as treffers from kal_merk_zoek('lidl');

-- En dat de rest onaangeroerd is: de vulwoordenlijst hoort de telwoorden nog te
-- bevatten, anders is de correctie uit bestand 12 teruggedraaid.
select (regexp_match(prosrc, 'not in \(([^)]*)\)'))[1] ~ 'twee' as telwoorden_nog_aanwezig
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'kal_zoeken';
