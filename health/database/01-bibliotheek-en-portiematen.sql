-- =============================================================================
-- DE GERECHTENBIBLIOTHEEK EN DE HUISHOUDMATEN AANSLUITEN
--
-- De kennis stond er al, in dezelfde database, ongebruikt: 275 ingrediëntregels
-- verdeeld over 26 gerechten, 56 porties met bandbreedte, en 35 huishoudmaten
-- die alle 27 NEVO-groepen dekken. De app kon een tajine wel vínden en niet
-- loggen, en vroeg voor een los product om een aantal grammen — precies wat die
-- 35 maten moeten wegnemen.
--
-- Dit bestand voegt twee leesfuncties toe en verruimt één check. Er wordt geen
-- tabel aangeraakt, geen rij verplaatst en geen kennis gekopieerd. De
-- bibliotheek blijft van provita-care; daar werkt de diëtist eraan.
--
--   kal_gerecht()      een gerecht met zijn porties, doorgerekend naar kcal
--   kal_portiematen()  de huishoudmaten die bij een NEVO-product horen
--
-- Draaien mag meer dan eens; alles is CREATE OR REPLACE of voorwaardelijk.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. HERKOMST VAN EEN REGEL UIT DE BIBLIOTHEEK
-- -----------------------------------------------------------------------------
-- kal_regels.bron kende 'recept' voor een eigen recept uit kal_recepten. Een
-- gerecht uit de gedeelde bibliotheek is iets anders: het is niet van jou en
-- het is door een diëtist nagelopen. Dat verschil hoort in de herkomst te
-- staan, anders is over een jaar niet meer na te gaan waar een getal vandaan
-- kwam.

ALTER TABLE public.kal_regels DROP CONSTRAINT IF EXISTS kal_regels_bron_check;
ALTER TABLE public.kal_regels ADD  CONSTRAINT kal_regels_bron_check
  CHECK (bron IN ('handmatig','recept','bibliotheek','tekst-ai','foto-ai','import','nevo'));

-- -----------------------------------------------------------------------------
-- 2. EEN GERECHT, DOORGEREKEND
-- -----------------------------------------------------------------------------
--
-- HOE ER GEREKEND WORDT, EN WAAROM ZO
--
-- Per ingrediënt: grammen maal de NEVO-waarde per honderd gram. Bereidingsvet
-- telt mee naar de mate waarin het in het gerecht achterblijft — absorbed_
-- fraction. Bij een tajine is dat alles (1,0), bij frituren een fractie. Dat is
-- de post die de herkenning uit tekst en foto nu blind moet schatten en die
-- hier per gerecht is uitgezocht: 36 vetregels over 26 gerechten.
--
-- Van het gerecht als geheel volgt zo een energiedichtheid, en die gaat maal de
-- porties. Niet andersom, want een portie is geen vast deel van de pan: bij
-- harira is een kom niet een zesde van zes porties, en bij msemen is één stuk
-- dat wél. De dichtheid is het enige wat over beide klopt.
--
-- WAT DEZE REKENWIJZE NIET WEET
--
-- De dichtheid staat op het gewicht zoals de ingrediënten de pan in gaan. Wat
-- indampt, verdwijnt uit het gerecht maar niet uit deze noemer, dus voor een
-- gerecht dat lang stooft valt de uitkomst aan de lage kant. Dat wordt bij de
-- regel benoemd en niet stilzwijgend weggepoetst.
--
-- Optionele ingrediënten zitten niet in de band. Of er lamsvlees in de harira
-- ging is geen onzekerheid maar een vraag met een antwoord, en die vraag stelt
-- de app apart. Elke portie krijgt daarom een tweede set onder 'met'. Zou het
-- in de bovengrens verdwijnen, dan werd een kom harira 124 tot 227 kcal — een
-- band van tachtig procent die niets over de portie zegt.

CREATE OR REPLACE FUNCTION public.kal_gerecht(p_token text, p_dish_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_gebruiker uuid;
  v_naam      text;
  v_uit       jsonb;
begin
  v_gebruiker := kal_sessie(p_token);

  -- Persoonlijke varianten van een patiënt horen hier niet; die filtert
  -- kal_zoeken al weg en dat mag deze ingang niet omzeilen.
  select name_nl into v_naam
    from cultural_dishes
   where id = p_dish_id and owner_patient_id is null;
  if v_naam is null then
    raise exception 'Dit gerecht staat niet in de bibliotheek';
  end if;

  with regel as (
    select i.position, i.ingredient_name_nl, i.category,
           i.is_optional, i.is_preparation_fat, i.fat_type, i.absorbed_fraction,
           i.mapping_status, i.uncertainty_note,
           (i.external_source = 'nevo' and n.nevo_code is not null) as gekoppeld,
           n.naam_nl as nevo_naam,
           -- Het gewicht dat werkelijk in het gerecht belandt.
           coalesce(i.grams_equivalent, 0)
             * case when i.is_preparation_fat
                    then coalesce(i.absorbed_fraction, 1) else 1 end as gram,
           coalesce(n.energie_kcal_per_100g, 0) as kcal100,
           coalesce(n.eiwit_g, 0)               as eiwit100,
           coalesce(n.vet_g, 0)                 as vet100,
           coalesce(n.koolhydraten_g, 0)        as koolh100,
           coalesce(n.vezels_g, 0)              as vezel100
      from dish_ingredients i
      left join nevo_foods n
        on n.nevo_code = i.external_food_id and i.external_source = 'nevo'
     where i.dish_id = p_dish_id
  ),
  som as (
    select
      -- het gerecht zoals het minimaal is
      coalesce(sum(gram)              filter (where not is_optional), 0) as gram_z,
      coalesce(sum(gram/100*kcal100)  filter (where not is_optional), 0) as kcal_z,
      coalesce(sum(gram/100*eiwit100) filter (where not is_optional), 0) as eiwit_z,
      coalesce(sum(gram/100*vet100)   filter (where not is_optional), 0) as vet_z,
      coalesce(sum(gram/100*koolh100) filter (where not is_optional), 0) as koolh_z,
      coalesce(sum(gram/100*vezel100) filter (where not is_optional), 0) as vezel_z,
      -- en met alles wat erin kán
      nullif(coalesce(sum(gram), 0), 0)   as gram_m,
      coalesce(sum(gram/100*kcal100), 0)  as kcal_m,
      coalesce(sum(gram/100*eiwit100), 0) as eiwit_m,
      coalesce(sum(gram/100*vet100), 0)   as vet_m,
      coalesce(sum(gram/100*koolh100), 0) as koolh_m,
      coalesce(sum(gram/100*vezel100), 0) as vezel_m,
      -- wat er over de kwaliteit van dít gerecht te zeggen valt
      count(*)                                            as n_ingredienten,
      count(*) filter (where mapping_status = 'bevestigd') as n_bevestigd,
      count(*) filter (where not gekoppeld)               as n_ongekoppeld,
      count(*) filter (where is_optional)                 as n_optioneel,
      coalesce(sum(gram) filter (where is_preparation_fat), 0) as vet_gram,
      (select string_agg(distinct fat_type, ', ')
         from regel where is_preparation_fat and fat_type is not null) as vet_soort,
      (select string_agg(ingredient_name_nl, ', ' order by position)
         from regel where not gekoppeld) as ongekoppeld_namen,
      (select string_agg(lower(ingredient_name_nl), ', ' order by position)
         from regel where is_optional) as optioneel_namen
    from regel
  )
  select jsonb_build_object(
    'id',           d.id,
    'naam',         d.name_nl,
    'keuken',       d.cuisine,
    'omschrijving', d.description_nl,
    'recept_porties', d.default_servings,
    'status',       d.validation_status,
    'beoordelaar',  d.reviewer_name,
    'beoordeeld_op', d.reviewed_at,
    'ingredienten', s.n_ingredienten,
    'bevestigd',    s.n_bevestigd,
    'ongekoppeld',  s.n_ongekoppeld,
    'ongekoppeld_namen', s.ongekoppeld_namen,
    'optioneel',    s.n_optioneel,
    'optioneel_namen', s.optioneel_namen,
    'vet_gram',     round(s.vet_gram),
    'vet_soort',    s.vet_soort,
    'totaal_gram',  round(s.gram_z),
    'kcal_per_100', case when s.gram_z > 0 then round(s.kcal_z / s.gram_z * 100) end,

    'porties', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id',        p.id,
               'label',     p.label_nl,
               'maat',      p.household_measure,
               'icoon',     p.icon,
               'standaard', p.is_default,
               'notitie',   p.notes,
               'gram',      round(p.grams_estimate),
               'gram_laag', round(p.grams_low),
               'gram_hoog', round(p.grams_high),
               -- De band gaat uitsluitend over de portie.
               'kcal_punt', round(s.kcal_z  / s.gram_z * p.grams_estimate),
               'kcal_laag', round(s.kcal_z  / s.gram_z * p.grams_low),
               'kcal_hoog', round(s.kcal_z  / s.gram_z * p.grams_high),
               'eiwit_g',   round(s.eiwit_z / s.gram_z * p.grams_estimate, 1),
               'vet_g',     round(s.vet_z   / s.gram_z * p.grams_estimate, 1),
               'koolhydraat_g', round(s.koolh_z / s.gram_z * p.grams_estimate, 1),
               'vezel_g',   round(s.vezel_z / s.gram_z * p.grams_estimate, 1),
               -- Dezelfde portie, mét de optionele ingrediënten erin.
               'met', case when s.n_optioneel > 0 and s.gram_m is not null then jsonb_build_object(
                 'kcal_punt', round(s.kcal_m  / s.gram_m * p.grams_estimate),
                 'kcal_laag', round(s.kcal_m  / s.gram_m * p.grams_low),
                 'kcal_hoog', round(s.kcal_m  / s.gram_m * p.grams_high),
                 'eiwit_g',   round(s.eiwit_m / s.gram_m * p.grams_estimate, 1),
                 'vet_g',     round(s.vet_m   / s.gram_m * p.grams_estimate, 1),
                 'koolhydraat_g', round(s.koolh_m / s.gram_m * p.grams_estimate, 1),
                 'vezel_g',   round(s.vezel_m / s.gram_m * p.grams_estimate, 1)) end)
             order by p.sort_order)
        from dish_portions p
       where p.dish_id = p_dish_id and s.gram_z > 0), '[]'::jsonb),

    -- De opbouw hoort zichtbaar te zijn. Een getal dat je niet kunt uitklappen
    -- is een getal dat je moet geloven.
    'regels', coalesce((
      select jsonb_agg(jsonb_build_object(
               'naam',      r.ingredient_name_nl,
               'categorie', r.category,
               'gram',      round(r.gram),
               'kcal',      round(r.gram/100*r.kcal100),
               'vet_regel', r.is_preparation_fat,
               'optioneel', r.is_optional,
               'bevestigd', r.mapping_status = 'bevestigd',
               'gekoppeld', r.gekoppeld,
               'notitie',   r.uncertainty_note,
               'nevo_naam', r.nevo_naam)
             order by r.position)
        from regel r), '[]'::jsonb)
  )
    into v_uit
    from cultural_dishes d, som s
   where d.id = p_dish_id;

  return v_uit;
end
$function$;

COMMENT ON FUNCTION public.kal_gerecht(text, uuid) IS
  'Een gerecht uit de gedeelde bibliotheek met zijn porties, doorgerekend via de energiedichtheid van de ingredienten. Bereidingsvet telt mee naar zijn opnamefractie; optionele ingredienten staan apart onder porties[].met.';

-- -----------------------------------------------------------------------------
-- 3. DE HUISHOUDMATEN BIJ EEN NEVO-PRODUCT
-- -----------------------------------------------------------------------------
--
-- voeding_portiematen hangt aan de NEVO-groep, en die 27 groepen dekken het
-- hele bestand: er is geen product zonder maat. Daarmee kan de vraag "hoeveel
-- gram brood?" vervangen worden door "hoeveel sneetjes?", en dat is de vraag
-- waar een mens een antwoord op heeft.
--
-- De maat brengt zijn eigen bandbreedte mee. Een snee brood is 25 tot 45 gram,
-- en dat hoort in de regel te belanden in plaats van te verdwijnen achter één
-- getal dat de gebruiker zelf heeft ingetikt.

CREATE OR REPLACE FUNCTION public.kal_portiematen(p_token text, p_nevo_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_gebruiker uuid;
  v_uit       jsonb;
begin
  v_gebruiker := kal_sessie(p_token);

  select jsonb_build_object(
    'nevo_code', n.nevo_code,
    'naam',      n.naam_nl,
    'groep',     n.groep,
    'kcal',      n.energie_kcal_per_100g,
    'eiwit_g',   n.eiwit_g,
    'vet_g',     n.vet_g,
    'koolhydraat_g', n.koolhydraten_g,
    'vezel_g',   n.vezels_g,
    'maten', coalesce((
      select jsonb_agg(jsonb_build_object(
               'naam',      m.naam,
               'meervoud',  coalesce(m.meervoud, m.naam),
               'gram',      m.gram_schatting,
               'gram_laag', m.gram_laag,
               'gram_hoog', m.gram_hoog,
               'standaard', m.is_standaard,
               'herkomst',  m.herkomst,
               'dietist',   m.gecontroleerd_door_dietist)
             order by m.is_standaard desc, m.volgorde)
        from voeding_portiematen m
       where m.nevo_code = n.nevo_code
          or (m.nevo_code is null and m.nevo_groep = n.groep)), '[]'::jsonb))
    into v_uit
    from nevo_foods n
   where n.nevo_code = p_nevo_code
   limit 1;

  if v_uit is null then
    raise exception 'Dit product staat niet in het voedingsstoffenbestand';
  end if;
  return v_uit;
end
$function$;

COMMENT ON FUNCTION public.kal_portiematen(text, text) IS
  'De huishoudmaten die bij een NEVO-product horen, via zijn groep, elk met eigen bandbreedte. Vervangt de vraag om een aantal grammen.';

COMMIT;
