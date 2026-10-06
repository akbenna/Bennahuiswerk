-- ===========================================================================
-- 54: DE BIBLIOTHEEK VAN PROVITA, ÉÉN KANT OP
-- ===========================================================================
--
-- TOEGEPAST: 6 oktober 2026, op huiuvnjrvvoybbzwfrfp, en dicht: er staat nog
-- geen bibliotheek_geheim_sha256 in kal_config, dus de functie antwoordt "De
-- ontvangst van de bibliotheek is niet ingericht". Openzetten gaat zoals
-- hieronder beschreven. controle-md5.sql: gelijk.
--
-- WAAROM
--
-- De gerechtenbibliotheek is gebouwd in provita-care en wordt daar door de
-- diëtist gevalideerd. Deze app las er tot 26 augustus rechtstreeks uit; bij de
-- verhuizing naar een eigen database ging er een kopie van 25 gerechten mee,
-- en sindsdien groeide er aan de ProVita-kant bij wat hier niet aankwam.
-- VERANTWOORDING.md zei het al: "één plek waar de gerechten worden nagelopen is
-- beter dan twee die uit elkaar lopen". Dit bestand maakt van die zin weer een
-- route: ProVita is de bron, en deze functie neemt aan wat daar gevalideerd is.
--
-- De andere richting bestaat niet. De 74 conceptgerechten van deze app (de
-- bestanden 24, 25 en 27: modelvoorstellen, kwaliteit D) gaan naar ProVita in
-- een aparte wachtrij, waar de diëtist per gerecht beslist. Zie in de
-- ProVita-repo `20261006_bibliotheek_voorstellen.sql`.
--
-- DE VIER REGELS UIT CLAUDE.md, EN HOE ZE HIER GELDEN
--
--   1. Toevoegen is `on conflict do nothing`. Een gerecht dat hier al staat,
--      op id of op slug, blijft zoals het is. Ook als ProVita het later heeft
--      bijgewerkt: dat wordt gemeld in `aan_de_bron_gewijzigd`, en een mens
--      beslist of het vervangen wordt. Kinderrijen (ingrediënten, porties)
--      komen alleen bij een gerecht dat deze aanroep net heeft neergezet, via
--      `returning`, nooit via een opzoeking op naam.
--   2. Twee keer draaien voegt niets toe en haalt niets weg. De tweede keer is
--      alles `bestond_al`.
--   3. Terugdraaien raakt alleen wat deze route neerzette: die rijen dragen
--      `validation_reference` met het voorvoegsel 'provita:'. Zie onderaan.
--   4. Niet van toepassing: dit is geen koppeling die uit zichzelf vuurt.
--
-- WIE MAG AANROEPEN
--
-- Alleen wie het gedeelde geheim kent. Dat staat als sha256 in kal_config
-- (`bibliotheek_geheim_sha256`), en in klare tekst alleen in de omgeving van
-- de edge function `bibliotheek-delen` aan de ProVita-kant. Staat de hash er
-- niet, dan weigert de functie alles: zo is hij na het aanmaken dicht tot
-- iemand hem bewust openzet.
--
--   insert into kal_config (sleutel, waarde)
--   values ('bibliotheek_geheim_sha256', encode(extensions.digest('<geheim>', 'sha256'), 'hex'))
--   on conflict (sleutel) do nothing;
--
-- Alleen gevalideerde bibliotheekgerechten komen binnen: geen concept, geen
-- persoonlijke variant (`owner_patient_id` gaat nooit mee, en de functie zet
-- hem op null ongeacht wat er binnenkomt).
-- ===========================================================================

create or replace function public.kal_bibliotheek_ontvangen(p_geheim text, p_gerechten jsonb)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare
  v_hash      text;
  v_g         jsonb;
  v_id        uuid;
  v_lokaal    timestamptz;
  v_nieuw     int := 0;
  v_bestond   int := 0;
  v_overgesl  int := 0;
  v_gewijzigd text[] := '{}';
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
      v_overgesl := v_overgesl + 1;
      continue;
    end if;

    v_id := null;
    insert into cultural_dishes (
      id, slug, name_nl, names, cuisine, region, region_note, description_nl,
      meal_moments, default_servings, owner_patient_id, validation_status,
      reviewed_by_clinician_id, reviewer_name, reviewer_big_number, reviewed_at,
      review_note, validation_reference)
    values (
      (v_g->>'id')::uuid, v_g->>'slug', v_g->>'name_nl', coalesce(v_g->'names', '{}'::jsonb),
      v_g->>'cuisine', v_g->>'region', v_g->>'region_note', v_g->>'description_nl',
      coalesce(array(select jsonb_array_elements_text(v_g->'meal_moments')), '{}'),
      coalesce((v_g->>'default_servings')::numeric, 4), null, 'validated',
      (v_g->>'reviewed_by_clinician_id')::uuid, v_g->>'reviewer_name', v_g->>'reviewer_big_number',
      (v_g->>'reviewed_at')::timestamptz, v_g->>'review_note',
      'provita:' || coalesce(v_g->>'validation_reference', 'gevalideerd'))
    on conflict do nothing
    returning id into v_id;

    if v_id is null then
      v_bestond := v_bestond + 1;
      select updated_at into v_lokaal from cultural_dishes
       where id = (v_g->>'id')::uuid or slug = v_g->>'slug'
       order by (id = (v_g->>'id')::uuid) desc limit 1;
      if (v_g->>'updated_at')::timestamptz > v_lokaal then
        v_gewijzigd := v_gewijzigd || (v_g->>'slug');
      end if;
      continue;
    end if;

    insert into dish_ingredients (
      dish_id, position, ingredient_name_nl, ingredient_name_local, category,
      quantity, unit, grams_equivalent, external_source, external_food_id,
      external_serving_id, role, is_preparation_fat, fat_type, absorbed_fraction,
      is_optional, substitution_group, uncertainty_note, mapping_status,
      mapping_beoordeeld_door, mapping_beoordeeld_op, mapping_big_nummer, mapping_opmerking)
    select v_id, coalesce((i->>'position')::int, 0), i->>'ingredient_name_nl', i->>'ingredient_name_local',
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
    select v_id, p->>'label_nl', p->>'household_measure', p->>'icon',
           (p->>'grams_estimate')::numeric, (p->>'grams_low')::numeric, (p->>'grams_high')::numeric,
           coalesce(p->>'measurement_basis', 'estimated'), coalesce((p->>'is_default')::boolean, false),
           coalesce((p->>'sort_order')::int, 0), p->>'notes'
      from jsonb_array_elements(coalesce(v_g->'porties', '[]'::jsonb)) p;

    v_nieuw := v_nieuw + 1;
  end loop;

  return jsonb_build_object(
    'nieuw', v_nieuw,
    'bestond_al', v_bestond,
    'niet_gevalideerd_overgeslagen', v_overgesl,
    'aan_de_bron_gewijzigd', to_jsonb(v_gewijzigd));
end $function$;

revoke all on function public.kal_bibliotheek_ontvangen(text, jsonb) from public;
grant execute on function public.kal_bibliotheek_ontvangen(text, jsonb) to anon, authenticated;

comment on function public.kal_bibliotheek_ontvangen(text, jsonb) is
  'Neemt gevalideerde gerechten uit de ProVita-bibliotheek aan. Alleen toevoegen, nooit bijwerken; dicht zolang bibliotheek_geheim_sha256 niet in kal_config staat. Zie health/database/54.';

-- ===========================================================================
-- NAKIJKEN NA HET TOEPASSEN
-- ===========================================================================
--
--   select kal_bibliotheek_ontvangen('fout', '[]'::jsonb);
--     -> {"fout": "De ontvangst van de bibliotheek is niet ingericht"}  (zonder hash)
--     -> {"fout": "Geen toegang"}                                         (met hash)
--
-- Op de echte database is op 6 oktober 2026 alleen het eerste geval nagekeken
-- (zonder hash); zie TOEGEPAST bovenaan.
--
-- TERUGDRAAIEN, ALLEEN WAT DEZE ROUTE NEERZETTE
--
--   delete from cultural_dishes where validation_reference like 'provita:%';
--   drop function public.kal_bibliotheek_ontvangen(text, jsonb);
--
-- (Ingrediënten en porties gaan mee via on delete cascade.)
