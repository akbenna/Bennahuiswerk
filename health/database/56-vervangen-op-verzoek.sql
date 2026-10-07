-- ===========================================================================
-- 56: VERVANGEN OP VERZOEK, MET HET OUDE IN HET ARCHIEF
-- ===========================================================================
--
-- TOEGEPAST: nog niet. Plak dit bestand in de SQL-editor van dit project en
-- draai het. Daarna: node gereedschap/md5-verslag.mjs --schrijf, en de
-- nakijklijst onderaan.
--
-- WAAROM
--
-- Bestand 54 neemt gevalideerde gerechten uit ProVita aan en overschrijft
-- nooit wat er al staat. Dat is de regel uit CLAUDE.md, en hij blijft. Maar
-- op 6 oktober 2026 liep hij tegen zijn eigen grens aan: de 74
-- conceptgerechten van deze app (kwaliteit D, de bestanden 24, 25 en 27)
-- gingen als voorstel naar ProVita, werden daar overgenomen, gevalideerd en
-- hun 403 NEVO-koppelingen bevestigd door een arts. Bij het terugsturen
-- meldde 54 ze netjes onder `aan_de_bron_gewijzigd`, en liet ze hier op
-- concept staan. Er was geen weg om de nagelopen versie de oude te laten
-- vervangen.
--
-- Dit bestand is die weg. Hij vuurt niet uit zichzelf: een mens vinkt in
-- ProVita aan welke gerechten vervangen worden, en alleen die komen hier
-- binnen.
--
-- WAT HIER WEL EN NIET GEBEURT
--
--   1. Alleen met het gedeelde geheim, dezelfde hash als bestand 54.
--   2. Alleen een gerecht dat hier al staat (op slug), uit de bibliotheek
--      (owner_patient_id is null), en alleen met een versie die in ProVita
--      gevalideerd is. Een nieuw gerecht gaat via 54, niet via deze functie.
--   3. Is het gerecht hier ná de ProVita-versie nog bijgewerkt, dan wordt het
--      overgeslagen. Dan heeft iemand hier iets gedaan wat ProVita niet kent,
--      en dat hoort niet stil te verdwijnen.
--   4. Het gerecht houdt zijn id. kal_regels en de eigen maaltijden verwijzen
--      naar dish_id, en een registratie bewaart haar eigen kilocalorieën
--      (kcal_punt, kcal_laag, kcal_hoog): wat iemand al vastlegde verandert
--      dus niet. Alleen wat er vanaf nu gekozen wordt, rekent met de nieuwe
--      ingrediënten en porties.
--   5. Vóór het vervangen gaat de oude versie, met ingrediënten en porties, als
--      één jsonb-rij in kal_bibliotheek_archief. Terugdraaien kan daaruit;
--      zie onderaan.
--
-- Over regel 1 uit CLAUDE.md ("toevoegen is on conflict do nothing, nooit do
-- update"): die regel gaat over bestanden die inhoud toevoegen, zodat een
-- tweede keer draaien niets stuk maakt. Deze functie voegt niets toe uit
-- zichzelf. Ze doet alleen iets op een expliciete vraag per gerecht, bewaart
-- wat ze vervangt, en twee keer dezelfde vraag stellen levert twee keer
-- hetzelfde gerecht op.
-- ===========================================================================

create table if not exists public.kal_bibliotheek_archief (
  id           bigserial primary key,
  dish_id      uuid not null,
  slug         text not null,
  vervangen_op timestamptz not null default now(),
  reden        text not null,
  oude_versie  jsonb not null
);

-- Zoals elke tabel hier: RLS aan, geen policies. Alleen de functie hieronder
-- schrijft, en lezen gaat via de SQL-editor.
alter table public.kal_bibliotheek_archief enable row level security;

create index if not exists kal_bibliotheek_archief_slug on public.kal_bibliotheek_archief (slug, vervangen_op desc);

create or replace function public.kal_bibliotheek_vervangen(p_geheim text, p_gerechten jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare
  v_hash       text;
  v_g          jsonb;
  v_lokaal     record;
  v_vervangen  text[] := '{}';
  v_overgesl   jsonb := '[]'::jsonb;
begin
  select waarde into v_hash from kal_config where sleutel = 'bibliotheek_geheim_sha256';
  if v_hash is null or v_hash = '' then
    return jsonb_build_object('fout', 'De ontvangst van de bibliotheek is niet ingericht');
  end if;
  if p_geheim is null or encode(digest(p_geheim, 'sha256'), 'hex') <> v_hash then
    return jsonb_build_object('fout', 'Geen toegang');
  end if;
  if p_gerechten is null or jsonb_typeof(p_gerechten) <> 'array' then
    return jsonb_build_object('fout', 'Verwacht een lijst gerechten');
  end if;

  for v_g in select value from jsonb_array_elements(p_gerechten) loop
    if coalesce(v_g->>'validation_status', '') <> 'validated' then
      v_overgesl := v_overgesl || jsonb_build_object('slug', v_g->>'slug', 'reden', 'niet gevalideerd in ProVita');
      continue;
    end if;

    select id, slug, updated_at into v_lokaal
      from cultural_dishes
     where slug = v_g->>'slug' and owner_patient_id is null;
    if not found then
      v_overgesl := v_overgesl || jsonb_build_object('slug', v_g->>'slug', 'reden', 'staat hier niet; gebruik delen');
      continue;
    end if;

    if v_lokaal.updated_at > (v_g->>'updated_at')::timestamptz then
      v_overgesl := v_overgesl || jsonb_build_object('slug', v_g->>'slug', 'reden', 'hier later bijgewerkt dan in ProVita');
      continue;
    end if;

    -- Eerst het oude, compleet, in het archief.
    insert into kal_bibliotheek_archief (dish_id, slug, reden, oude_versie)
    select d.id, d.slug, 'vervangen door de gevalideerde versie uit ProVita',
           to_jsonb(d) || jsonb_build_object(
             'ingredienten', coalesce((select jsonb_agg(to_jsonb(i) order by i.position)
                                         from dish_ingredients i where i.dish_id = d.id), '[]'::jsonb),
             'porties', coalesce((select jsonb_agg(to_jsonb(p) order by p.sort_order)
                                    from dish_portions p where p.dish_id = d.id), '[]'::jsonb))
      from cultural_dishes d where d.id = v_lokaal.id;

    update cultural_dishes set
      name_nl = v_g->>'name_nl',
      names = coalesce(v_g->'names', '{}'::jsonb),
      cuisine = v_g->>'cuisine',
      region = v_g->>'region',
      region_note = v_g->>'region_note',
      description_nl = v_g->>'description_nl',
      meal_moments = coalesce(array(select jsonb_array_elements_text(v_g->'meal_moments')), '{}'),
      default_servings = coalesce((v_g->>'default_servings')::numeric, 4),
      validation_status = 'validated',
      reviewed_by_clinician_id = (v_g->>'reviewed_by_clinician_id')::uuid,
      reviewer_name = v_g->>'reviewer_name',
      reviewer_big_number = v_g->>'reviewer_big_number',
      reviewed_at = (v_g->>'reviewed_at')::timestamptz,
      review_note = v_g->>'review_note',
      validation_reference = 'provita:' || coalesce(v_g->>'validation_reference', 'gevalideerd'),
      updated_at = now()
     where id = v_lokaal.id;

    delete from dish_ingredients where dish_id = v_lokaal.id;
    delete from dish_portions where dish_id = v_lokaal.id;

    insert into dish_ingredients (
      dish_id, position, ingredient_name_nl, ingredient_name_local, category,
      quantity, unit, grams_equivalent, external_source, external_food_id,
      external_serving_id, role, is_preparation_fat, fat_type, absorbed_fraction,
      is_optional, substitution_group, uncertainty_note, mapping_status,
      mapping_beoordeeld_door, mapping_beoordeeld_op, mapping_big_nummer, mapping_opmerking)
    select v_lokaal.id, coalesce((i->>'position')::int, 0), i->>'ingredient_name_nl', i->>'ingredient_name_local',
           i->>'category', (i->>'quantity')::numeric, i->>'unit', (i->>'grams_equivalent')::numeric,
           coalesce(i->>'external_source', 'unmapped'), i->>'external_food_id', i->>'external_serving_id',
           coalesce(i->>'role', 'ingredient'), coalesce((i->>'is_preparation_fat')::boolean, false),
           i->>'fat_type', (i->>'absorbed_fraction')::numeric, coalesce((i->>'is_optional')::boolean, false),
           i->>'substitution_group', i->>'uncertainty_note', coalesce(i->>'mapping_status', 'ai_voorstel'),
           i->>'mapping_beoordeeld_door', (i->>'mapping_beoordeeld_op')::date, i->>'mapping_big_nummer',
           i->>'mapping_opmerking'
      from jsonb_array_elements(coalesce(v_g->'ingredienten', '[]'::jsonb)) i;

    insert into dish_portions (
      dish_id, label_nl, household_measure, icon, grams_estimate, grams_low, grams_high,
      measurement_basis, is_default, sort_order, notes)
    select v_lokaal.id, p->>'label_nl', p->>'household_measure', p->>'icon',
           (p->>'grams_estimate')::numeric, (p->>'grams_low')::numeric, (p->>'grams_high')::numeric,
           coalesce(p->>'measurement_basis', 'estimated'), coalesce((p->>'is_default')::boolean, false),
           coalesce((p->>'sort_order')::int, 0), p->>'notes'
      from jsonb_array_elements(coalesce(v_g->'porties', '[]'::jsonb)) p;

    v_vervangen := v_vervangen || (v_g->>'slug');
  end loop;

  return jsonb_build_object(
    'vervangen', to_jsonb(v_vervangen),
    'overgeslagen', v_overgesl);
end $function$;

revoke all on function public.kal_bibliotheek_vervangen(text, jsonb) from public;
grant execute on function public.kal_bibliotheek_vervangen(text, jsonb) to anon, authenticated;

comment on function public.kal_bibliotheek_vervangen(text, jsonb) is
  'Vervangt bibliotheekgerechten door hun gevalideerde ProVita-versie, alleen op expliciet verzoek per gerecht. Bewaart het oude in kal_bibliotheek_archief. Zie health/database/56.';

-- ===========================================================================
-- NAKIJKEN NA HET TOEPASSEN
-- ===========================================================================
--
--   select kal_bibliotheek_vervangen('fout', '[]'::jsonb);
--     -> {"fout": "Geen toegang"}
--
--   Na een vervanging vanuit ProVita:
--   select slug, vervangen_op from kal_bibliotheek_archief order by vervangen_op desc;
--
-- TERUGDRAAIEN, ÉÉN GERECHT
--
-- Zet de laatste archiefversie van een slug terug. Ingrediënten en porties
-- komen terug zoals ze waren; het gerecht houdt zijn id.
--
--   with a as (
--     select oude_versie v from kal_bibliotheek_archief
--      where slug = '<slug>' order by vervangen_op desc limit 1)
--   , d as (
--     update cultural_dishes c set
--       validation_status = (a.v->>'validation_status'),
--       validation_reference = (a.v->>'validation_reference'),
--       reviewer_name = (a.v->>'reviewer_name'),
--       reviewer_big_number = (a.v->>'reviewer_big_number'),
--       reviewed_at = (a.v->>'reviewed_at')::timestamptz,
--       default_servings = (a.v->>'default_servings')::numeric,
--       updated_at = now()
--     from a where c.id = (a.v->>'id')::uuid returning c.id)
--   select id from d;
--   -- en daarna de kinderen: delete en opnieuw invoegen uit a.v->'ingredienten'
--   -- en a.v->'porties' met jsonb_populate_recordset(null::dish_ingredients, ...).
