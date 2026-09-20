-- ZEVEN FUNCTIES GELIJKTREKKEN MET DE BESTANDEN
--
-- Dit bestand voegt niets toe en haalt niets weg. Het vervangt zeven functies
-- door de tekst die in deze map staat, en daarmee is het verslag weer waar.
--
-- WAT DE CONTROLE VOND, EN WAT HET BLEEK TE ZIJN
--
-- `controle-md5.sql` meldde op 20 september 2026 zeven keer VERSCHILT. Drie
-- daarvan zijn gedrag en vier alleen commentaar. Dat onderscheid is de moeite
-- waard, want het zegt hoe de scheefgroei ontstond.
--
-- DRIE KEER GEDRAG:
--
--   kal_ww_klacht          De database zegt bij een zwak wachtwoord nog
--                          "Je accountnaam staat erin - dat raadt iemand
--                          meteen", met een gedachtestreepje. Dat teken is uit
--                          de hele repo gehaald en nooit opnieuw toegepast, dus
--                          stond het nog op het scherm van wie zich aanmeldt.
--
--   kal_coach_bouwen       Hetzelfde, in drie e-mailonderwerpen en in de
--                          opsomming eronder. Dat zijn berichten die de app
--                          zelf verstuurt.
--
--   kal_dagen_importeren   Bestand 42 is geschreven en nooit gedraaid. De
--                          database kent `fiets_min` daar niet, dus een import
--                          uit een schermafdruk liet de fietsminuten vallen
--                          zonder iets te zeggen.
--
-- VIER KEER ALLEEN COMMENTAAR: kal_nevo_zoek, kal_zoeken, kal_proef_koppeling
-- en kal_gerecht dragen in hun toelichting nog gedachtestreepjes. Het gedrag is
-- gelijk. Ze staan hier toch, want een controle die op drie van de zeven
-- VERSCHILT blijft zeggen, wordt een controle waar je overheen leest.
--
-- EN EEN ACHTSTE VERSCHIL, DE ANDERE KANT OP
--
-- Bij kal_gerecht loopt de database vóór: hij leest `nevo_actief` en bestand 01
-- zegt nog `nevo_foods`. Dat is de licentiepoort, en die hoort er te zijn: valt
-- de licentie weg, dan verdwijnt niet het gerecht maar de voedingswaarde
-- erachter. Die regel staat in bestand 12, 20, 21 en 22 wel opgeschreven en bij
-- kal_gerecht nergens. Hieronder staat hij zoals hij draait, dus mét de poort,
-- en daarmee is hij eindelijk ergens vastgelegd.
--
-- NA HET DRAAIEN
--
--   select * from kal_proef_koppeling();   -- 41 gevallen, alle goed
--   en daarna controle-md5.sql: alles hoort op 'gelijk' te staan.
--
-- De eerste van die twee omdat kal_proef_koppeling hier zelf in staat. Hij
-- schrijft in de echte tabellen en draait zichzelf terug; zie AUTOMATISERING.md.


-- ------------------------------------------------------------------------
-- kal_gerecht
-- uit 01-bibliotheek-en-portiematen.sql
-- Met de licentiepoort, zoals hij draait. Zie de kop van dit bestand.

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
      -- nevo_actief en niet nevo_foods: dit is de licentiepoort. Het blijft een
      -- left join, dus valt de licentie weg, dan verdwijnt niet het gerecht maar
      -- de voedingswaarde erachter: nul kcal en 'ongekoppeld' in beeld.
      -- Zichtbaar kapot is beter dan stilletjes verkeerd.
      left join nevo_actief n
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


-- ------------------------------------------------------------------------
-- kal_proef_koppeling
-- uit 03-proef-koppeling.sql
-- Alleen commentaar.

create or replace function public.kal_proef_koppeling()
returns table(geval text, goed boolean, gezien text)
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_uit      jsonb := '[]'::jsonb;
  v_a        uuid;
  v_b        uuid;
  v_sa       text;
  v_dood     text;
  v_ant      jsonb;
  v_d        record;
  v_vandaag  date := (now() at time zone 'Europe/Amsterdam')::date;
  v_gist     date;
  v_dag      date;
  v_n        integer;
  v_n2       integer;
begin
  v_gist := v_vandaag - 1;
  v_dag  := v_vandaag - 5;

  begin
    insert into kal_gebruikers(account, ww_hash) values ('proef-a-'||gen_random_uuid(), 'x')
      returning id into v_a;
    insert into kal_gebruikers(account, ww_hash) values ('proef-b-'||gen_random_uuid(), 'x')
      returning id into v_b;

    v_sa   := 'kal_' || encode(gen_random_bytes(24), 'hex');
    v_dood := 'kal_' || encode(gen_random_bytes(24), 'hex');
    insert into kal_koppelingen(gebruiker_id, naam, sleutel_hash, sleutel_begin)
      values (v_a, 'proef', encode(digest(v_sa,'sha256'),'hex'), left(v_sa,12));
    insert into kal_koppelingen(gebruiker_id, naam, sleutel_hash, sleutel_begin, actief)
      values (v_a, 'ingetrokken', encode(digest(v_dood,'sha256'),'hex'), left(v_dood,12), false);

    /* ================================ de sleutel ======================== */
    begin
      perform kal_beweging_ontvangen('kal_bestaatniet', '[]'::jsonb);
      v_uit := v_uit || jsonb_build_object('geval','onbekende sleutel wordt geweigerd','goed',false,'gezien','geaccepteerd');
    exception when others then
      v_uit := v_uit || jsonb_build_object('geval','onbekende sleutel wordt geweigerd','goed',sqlerrm like '%koppelsleutel%','gezien',sqlerrm);
    end;

    begin
      perform kal_beweging_ontvangen('', '[]'::jsonb);
      v_uit := v_uit || jsonb_build_object('geval','lege sleutel wordt geweigerd','goed',false,'gezien','geaccepteerd');
    exception when others then
      v_uit := v_uit || jsonb_build_object('geval','lege sleutel wordt geweigerd','goed',true,'gezien',sqlerrm);
    end;

    begin
      perform kal_beweging_ontvangen(v_dood, '[]'::jsonb);
      v_uit := v_uit || jsonb_build_object('geval','ingetrokken sleutel wordt geweigerd','goed',false,'gezien','geaccepteerd');
    exception when others then
      v_uit := v_uit || jsonb_build_object('geval','ingetrokken sleutel wordt geweigerd','goed',true,'gezien',sqlerrm);
    end;

    /* ============================ de botsingsregels ===================== */
    insert into kal_dagen(gebruiker_id, datum, gewicht_kg, stappen, kracht, notitie, bron)
      values (v_a, v_dag, 111.1, 3000, true, 'met de hand', 'app');

    v_ant := kal_beweging_ontvangen(v_sa, jsonb_build_array(jsonb_build_object(
      'datum', v_dag, 'gewicht_kg', 999, 'stappen', 8421.0,
      'slaap_min', 447.6, 'actieve_energie_kcal', 612.4)));
    select * into v_d from kal_dagen where gebruiker_id=v_a and datum=v_dag;

    v_uit := v_uit || jsonb_build_object('geval','stappen: het toestel wint',
      'goed', v_d.stappen = 8421, 'gezien', format('%s (was 3000, kwam 8421.0)', v_d.stappen));
    v_uit := v_uit || jsonb_build_object('geval','GEWICHT WORDT NOOIT OVERSCHREVEN',
      'goed', v_d.gewicht_kg = 111.1, 'gezien', format('%s (was 111,1, kwam 999)', v_d.gewicht_kg));
    v_uit := v_uit || jsonb_build_object('geval','kommagetallen worden afgerond',
      'goed', v_d.slaap_min = 448 and v_d.actieve_energie_kcal = 612,
      'gezien', format('slaap %s uit 447.6, energie %s uit 612.4', v_d.slaap_min, v_d.actieve_energie_kcal));
    v_uit := v_uit || jsonb_build_object('geval','kracht en notitie blijven onaangeraakt',
      'goed', v_d.kracht and v_d.notitie = 'met de hand',
      'gezien', format('kracht=%s notitie=%s', v_d.kracht, v_d.notitie));
    v_uit := v_uit || jsonb_build_object('geval','behouden weging wordt gemeld',
      'goed', (v_ant->>'gewicht_behouden')::int = 1, 'gezien', v_ant::text);

    v_ant := kal_beweging_ontvangen(v_sa, jsonb_build_array(
      jsonb_build_object('datum', v_dag, 'fiets_min', 30)));
    select * into v_d from kal_dagen where gebruiker_id=v_a and datum=v_dag;
    v_uit := v_uit || jsonb_build_object('geval','weggelaten velden blijven staan',
      'goed', v_d.stappen = 8421 and v_d.slaap_min = 448 and v_d.fiets_min = 30,
      'gezien', format('stappen=%s slaap=%s fiets=%s', v_d.stappen, v_d.slaap_min, v_d.fiets_min));

    v_ant := kal_beweging_ontvangen(v_sa, jsonb_build_array(jsonb_build_object(
      'datum', v_dag - 1, 'gewicht_kg', 116.4, 'gewicht_bron', 'garmin')));
    select * into v_d from kal_dagen where gebruiker_id=v_a and datum=v_dag-1;
    v_uit := v_uit || jsonb_build_object('geval','lege dag krijgt het gewicht wel',
      'goed', v_d.gewicht_kg = 116.4 and v_d.gewicht_bron = 'garmin',
      'gezien', format('%s kg, bron %s', v_d.gewicht_kg, v_d.gewicht_bron));

    /* ============================== de grenzen ========================== */
    v_ant := kal_beweging_ontvangen(v_sa, jsonb_build_array(
      jsonb_build_object('datum', v_vandaag + 5, 'stappen', 1),
      jsonb_build_object('datum', '2014-12-31',  'stappen', 1),
      jsonb_build_object('datum', null,          'stappen', 1)));
    v_uit := v_uit || jsonb_build_object('geval','toekomst, te oud en zonder datum: overgeslagen',
      'goed', (v_ant->>'overgeslagen')::int = 3 and (v_ant->>'dagen')::int = 0, 'gezien', v_ant::text);
    select count(*) into v_n from kal_dagen where gebruiker_id=v_a and datum > v_vandaag;
    v_uit := v_uit || jsonb_build_object('geval','er staat geen dag in de toekomst',
      'goed', v_n = 0, 'gezien', format('%s dagen', v_n));

    begin
      perform kal_beweging_ontvangen(v_sa, (
        select jsonb_agg(jsonb_build_object('datum', v_vandaag - i, 'stappen', 1))
          from generate_series(1, 401) i));
      v_uit := v_uit || jsonb_build_object('geval','meer dan 400 dagen wordt geweigerd','goed',false,'gezien','geaccepteerd');
    exception when others then
      v_uit := v_uit || jsonb_build_object('geval','meer dan 400 dagen wordt geweigerd','goed',true,'gezien',sqlerrm);
    end;

    begin
      perform kal_beweging_ontvangen(v_sa, '{"geen":"lijst"}'::jsonb);
      v_uit := v_uit || jsonb_build_object('geval','iets dat geen lijst is wordt geweigerd','goed',false,'gezien','geaccepteerd');
    exception when others then
      v_uit := v_uit || jsonb_build_object('geval','iets dat geen lijst is wordt geweigerd','goed',true,'gezien',sqlerrm);
    end;

    /* ======================= scheiding tussen gebruikers ================ */
    select count(*) into v_n from kal_dagen where gebruiker_id = v_b;
    v_uit := v_uit || jsonb_build_object('geval','SLEUTEL VAN A RAAKT DE DAGEN VAN B NIET',
      'goed', v_n = 0, 'gezien', format('%s dagen bij B', v_n));

    /* ============================== de tellers ========================== */
    select aantal_berichten, aantal_dagen, laatst_gebruikt_op is not null as gezien
      into v_d from kal_koppelingen where sleutel_hash = encode(digest(v_sa,'sha256'),'hex');
    v_uit := v_uit || jsonb_build_object('geval','de koppeling houdt bij dat er iets binnenkwam',
      'goed', v_d.aantal_berichten >= 4 and v_d.aantal_dagen >= 3 and v_d.gezien,
      'gezien', format('%s berichten, %s dagen, gezien=%s', v_d.aantal_berichten, v_d.aantal_dagen, v_d.gezien));

    /* ========================= de platte ingang ========================= */
    /* Alle waarden als tekst: zo stuurt de Opdrachten-app ze ook. */
    v_ant := kal_beweging_dag(v_sa, p_stappen := '7000');
    v_uit := v_uit || jsonb_build_object('geval','zonder datum wordt het gisteren',
      'goed', (v_ant->>'datum')::date = v_gist, 'gezien', v_ant->>'datum');

    v_ant := kal_beweging_dag(v_sa, p_datum := '', p_stappen := '7001');
    v_uit := v_uit || jsonb_build_object('geval','lege datumtekst wordt ook gisteren',
      'goed', (v_ant->>'datum')::date = v_gist, 'gezien', v_ant->>'datum');

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_stappen := '7002');
    v_uit := v_uit || jsonb_build_object('geval','dagen_terug 0 is vandaag',
      'goed', (v_ant->>'datum')::date = v_vandaag, 'gezien', v_ant->>'datum');

    v_ant := kal_beweging_dag(v_sa, p_datum := (v_vandaag - 6)::text, p_dagen_terug := '0', p_stappen := '100');
    v_uit := v_uit || jsonb_build_object('geval','een eigen datum overrulet de standaard',
      'goed', (v_ant->>'datum')::date = v_vandaag - 6, 'gezien', v_ant->>'datum');

    perform kal_beweging_dag(v_sa, p_slaap_uur := '7.45');
    select slaap_min into v_d from kal_dagen where gebruiker_id=v_a and datum=v_gist;
    v_uit := v_uit || jsonb_build_object('geval','slaap in uren wordt minuten',
      'goed', v_d.slaap_min = 447, 'gezien', format('7.45 uur -> %s min', v_d.slaap_min));

    perform kal_beweging_dag(v_sa, p_slaap_sec := '28800');
    select slaap_min into v_d from kal_dagen where gebruiker_id=v_a and datum=v_gist;
    v_uit := v_uit || jsonb_build_object('geval','slaap in seconden wordt minuten',
      'goed', v_d.slaap_min = 480, 'gezien', format('28800 sec -> %s min', v_d.slaap_min));

    v_ant := kal_beweging_dag(v_sa, p_slaap_min := '28800');
    select slaap_min into v_d from kal_dagen where gebruiker_id=v_a and datum=v_gist;
    v_uit := v_uit || jsonb_build_object('geval','onmogelijke slaap wordt geweigerd en gemeld',
      'goed', (v_ant->>'slaap_genegeerd')::boolean and v_d.slaap_min = 480,
      'gezien', format('genegeerd=%s, blijft %s min', v_ant->>'slaap_genegeerd', v_d.slaap_min));

    /* ---- wat een echte telefoon stuurt: soms niets, en komma's ---------- */
    /* Een nacht zonder slaapmeting gaf 22P02 en sloopte het hele bericht,
       inclusief de stappen die wél gemeten waren. */
    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0',
                              p_stappen := '8421', p_actieve_energie_kcal := '612',
                              p_slaap_sec := '');
    select stappen, actieve_energie_kcal into v_d
      from kal_dagen where gebruiker_id=v_a and datum=v_vandaag;
    v_uit := v_uit || jsonb_build_object('geval','EEN LEEG GETAL SLOOPT HET BERICHT NIET',
      'goed', (v_ant->>'dagen')::int = 1 and v_d.stappen = 8421 and v_d.actieve_energie_kcal = 612,
      'gezien', format('stappen=%s energie=%s', v_d.stappen, v_d.actieve_energie_kcal));

    perform kal_beweging_dag(v_sa, p_dagen_terug := '0', p_slaap_uur := '7,45');
    select slaap_min into v_d from kal_dagen where gebruiker_id=v_a and datum=v_vandaag;
    v_uit := v_uit || jsonb_build_object('geval','een komma is een decimaalteken',
      'goed', v_d.slaap_min = 447, 'gezien', format('7,45 uur -> %s min', v_d.slaap_min));

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_stappen := 'zeven');
    select stappen into v_d from kal_dagen where gebruiker_id=v_a and datum=v_vandaag;
    v_uit := v_uit || jsonb_build_object('geval','onleesbaar wordt gemeld, niet weggeschreven',
      'goed', v_ant->'niet_gelezen' ? 'stappen' and v_d.stappen = 8421,
      'gezien', format('niet_gelezen=%s, stappen blijft %s', v_ant->>'niet_gelezen', v_d.stappen));

    /* ---------------------------- de rustpols --------------------------- */
    /* Hij woont in kal_metingen en niet in kal_dagen, dus hij heeft zijn eigen
       botsingsregels, en die zijn net anders: een meting die de koppeling zelf
       neerzette mag hij bijwerken, want de rustpols van vanochtend is voorlopig. */
    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_hartslag_rust := '58');
    select waarde into v_d from kal_metingen
     where gebruiker_id=v_a and datum=v_vandaag and soort='hartslag_rust';
    v_uit := v_uit || jsonb_build_object('geval','rustpols komt binnen',
      'goed', v_ant->>'hartslag_rust' = 'opgeslagen' and v_d.waarde = 58,
      'gezien', format('%s -> %s', v_ant->>'hartslag_rust', v_d.waarde));

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_hartslag_rust := '55');
    select count(*) into v_n from kal_metingen
     where gebruiker_id=v_a and datum=v_vandaag and soort='hartslag_rust';
    select waarde into v_d from kal_metingen
     where gebruiker_id=v_a and datum=v_vandaag and soort='hartslag_rust';
    v_uit := v_uit || jsonb_build_object('geval','tweede keer werkt bij, zonder dubbele rij',
      'goed', v_n = 1 and v_d.waarde = 55, 'gezien', format('%s rij(en), waarde %s', v_n, v_d.waarde));

    update kal_metingen set notitie = null, waarde = 62
     where gebruiker_id=v_a and datum=v_vandaag and soort='hartslag_rust';
    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_hartslag_rust := '55');
    select waarde into v_d from kal_metingen
     where gebruiker_id=v_a and datum=v_vandaag and soort='hartslag_rust';
    v_uit := v_uit || jsonb_build_object('geval','EEN POLS DIE JIJ INVULDE BLIJFT STAAN',
      'goed', v_d.waarde = 62 and v_ant->>'hartslag_rust' = 'die van jou blijft staan',
      'gezien', format('%s -> %s', v_ant->>'hartslag_rust', v_d.waarde));

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '2', p_hartslag_rust := '600');
    select count(*) into v_n from kal_metingen
     where gebruiker_id=v_a and datum=v_vandaag-2 and soort='hartslag_rust';
    v_uit := v_uit || jsonb_build_object('geval','onmogelijke pols wordt geweigerd',
      'goed', v_n = 0 and v_ant->>'hartslag_rust' = 'onmogelijk, genegeerd',
      'gezien', format('%s, %s rijen', v_ant->>'hartslag_rust', v_n));

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_stappen := '100');
    v_uit := v_uit || jsonb_build_object('geval','zonder pols verandert er niets aan de pols',
      'goed', v_ant->>'hartslag_rust' = 'niet meegestuurd', 'gezien', v_ant->>'hartslag_rust');

    /* ------------------- een 0 uit een lege zoekactie -------------------- */
    /* Bereken statistiek geeft over nul monsters een 0 en niet leeg. Die 0 is
       niet te onderscheiden van "niets gevonden" en hoort dus niet in de
       tabellen; hij hoort wel in het antwoord. */
    perform kal_beweging_dag(v_sa, p_datum := (v_vandaag - 8)::text,
                             p_stappen := '5000', p_actieve_energie_kcal := '300');
    v_ant := kal_beweging_dag(v_sa, p_datum := (v_vandaag - 8)::text,
                              p_stappen := '6000', p_actieve_energie_kcal := '0');
    select stappen, actieve_energie_kcal into v_d
      from kal_dagen where gebruiker_id = v_a and datum = v_vandaag - 8;
    v_uit := v_uit || jsonb_build_object('geval','EEN 0 WORDT NIET WEGGESCHREVEN',
      'goed', v_d.stappen = 6000 and v_d.actieve_energie_kcal = 300
              and v_ant->'nul_overgeslagen' ? 'actieve_energie_kcal',
      'gezien', format('stappen=%s energie=%s nul=%s',
                       v_d.stappen, v_d.actieve_energie_kcal, v_ant->>'nul_overgeslagen'));

    v_uit := v_uit || jsonb_build_object('geval','een 0 is leesbaar, dus niet niet_gelezen',
      'goed', not (v_ant->'niet_gelezen' ? 'actieve_energie_kcal'),
      'gezien', v_ant->>'niet_gelezen');

    v_ant := kal_beweging_dag(v_sa, p_datum := (v_vandaag - 8)::text, p_slaap_sec := '0');
    select slaap_min into v_d from kal_dagen where gebruiker_id = v_a and datum = v_vandaag - 8;
    v_uit := v_uit || jsonb_build_object('geval','nul minuten slaap bestaat niet',
      'goed', v_d.slaap_min is null and v_ant->'nul_overgeslagen' ? 'slaap'
              and not (v_ant->>'slaap_genegeerd')::boolean,
      'gezien', format('slaap=%s nul=%s', v_d.slaap_min, v_ant->>'nul_overgeslagen'));

    v_ant := kal_beweging_dag(v_sa, p_datum := (v_vandaag - 8)::text, p_stappen := '0');
    select stappen into v_d from kal_dagen where gebruiker_id = v_a and datum = v_vandaag - 8;
    v_uit := v_uit || jsonb_build_object('geval','0 stappen laat de gemeten stappen staan',
      'goed', v_d.stappen = 6000, 'gezien', format('%s', v_d.stappen));

    v_ant := kal_beweging_dag(v_sa, p_datum := (v_vandaag - 8)::text, p_stappen := '7000');
    v_uit := v_uit || jsonb_build_object('geval','zonder nullen blijft de lijst leeg',
      'goed', jsonb_array_length(v_ant->'nul_overgeslagen') = 0,
      'gezien', v_ant->>'nul_overgeslagen');

    /* ---------------------- de peilingen van de dag ---------------------- */
    /* Een tussenstand van vandaag hoort te blijven staan met zijn tijdstip;
       een bijgewerkte oude dag is geen peiling maar een inhaalslag. */
    select count(*) into v_n from kal_beweging_peilingen
     where gebruiker_id = v_a and datum = v_vandaag;
    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_stappen := '4321');
    select count(*) into v_n2 from kal_beweging_peilingen
     where gebruiker_id = v_a and datum = v_vandaag;
    v_uit := v_uit || jsonb_build_object('geval','een stand van vandaag wordt een peiling',
      'goed', (v_ant->>'peiling')::boolean and v_n2 > v_n,
      'gezien', format('peiling=%s, %s rijen (was %s)', v_ant->>'peiling', v_n2, v_n));

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_stappen := '4400');
    select count(*) into v_n from kal_beweging_peilingen
     where gebruiker_id = v_a and datum = v_vandaag;
    v_uit := v_uit || jsonb_build_object('geval','peilingen stapelen, ze overschrijven elkaar niet',
      'goed', v_n > v_n2, 'gezien', format('%s rijen (was %s)', v_n, v_n2));

    v_ant := kal_beweging_dag(v_sa, p_datum := (v_vandaag - 3)::text, p_stappen := '9000');
    select count(*) into v_n2 from kal_beweging_peilingen
     where gebruiker_id = v_a and datum = v_vandaag - 3;
    v_uit := v_uit || jsonb_build_object('geval','EEN OUDE DAG WORDT GEEN PEILING',
      'goed', not (v_ant->>'peiling')::boolean and v_n2 = 0,
      'gezien', format('peiling=%s, %s rijen', v_ant->>'peiling', v_n2));

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_hartslag_rust := '60');
    v_uit := v_uit || jsonb_build_object('geval','zonder stappen of energie geen peiling',
      'goed', not (v_ant->>'peiling')::boolean, 'gezien', v_ant->>'peiling');

    /* De gewoonte kijkt alleen naar eerdere dagen. Alles wat deze proef vandaag
       schreef mag daar dus niet in meetellen, anders vergelijkt de app je met
       jezelf van vijf seconden geleden. */
    select n into v_n from kal_beweging_gewoonte(v_a, 720);
    v_uit := v_uit || jsonb_build_object('geval','de gewoonte telt vandaag niet mee',
      'goed', v_n = 0, 'gezien', format('%s eerdere dagen', v_n));

    /* Altijd terugdraaien. Deze proef schrijft in echte tabellen; hij mag er
       niets van achterlaten. */
    raise exception 'PROEF-TERUGDRAAIEN';

  exception when others then
    if sqlerrm <> 'PROEF-TERUGDRAAIEN' then
      v_uit := v_uit || jsonb_build_object('geval','de proef zelf liep vast',
                                           'goed', false, 'gezien', sqlerrm);
    end if;
  end;

  return query
    select x->>'geval', (x->>'goed')::boolean, x->>'gezien'
      from jsonb_array_elements(v_uit) x;
end $$;


-- ------------------------------------------------------------------------
-- kal_coach_bouwen
-- uit 06-de-coach-prikkelt.sql
-- De drie onderwerpen en de opsomming, zonder gedachtestreepjes.

create or replace function public.kal_coach_bouwen(p_soort text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_aan text; v_mail text; v_url text;
  v_g record; v_s jsonb; v_v jsonb;
  v_vandaag date := (now() at time zone 'Europe/Amsterdam')::date;
  v_uur integer := extract(hour from now() at time zone 'Europe/Amsterdam')::integer;
  v_ond text; v_tekst text; v_lijst text; v_uit jsonb := '[]'::jsonb;
  v_melden boolean; v_reden text;
begin
  select waarde into v_aan  from kal_config where sleutel = 'prikkel_aan';
  select waarde into v_mail from kal_config where sleutel = 'prikkel_email';
  select waarde into v_url  from kal_config where sleutel = 'app_url';
  if coalesce(v_aan, 'ja') <> 'ja' or v_mail is null then return v_uit; end if;

  for v_g in select g.id from kal_gebruikers g join kal_profiel p on p.gebruiker_id = g.id loop

    if exists (select 1 from kal_prikkel_log
                where gebruiker_id = v_g.id and datum = v_vandaag and soort = p_soort) then
      continue;
    end if;

    v_s := kal_coach_stand(v_g.id);
    if not (v_s->>'bruikbaar')::boolean then continue; end if;

    /* Wanneer er iets te zeggen valt. Zie coach.ts: het antwoord is meestal nee. */
    v_melden := false;
    if (v_s->>'erover')::boolean then
      v_melden := false;                       -- daar valt vandaag niets meer aan te doen
    elsif v_uur < 17 and (v_s->>'kcal_over')::numeric between 1 and 349 then
      v_melden := true; v_reden := 'bijna-op';
    elsif (v_s->>'eiwit_over')::numeric >= 15 and (v_s->>'kcal_over')::numeric >= 150 then
      v_melden := true; v_reden := 'eiwit-achter';
    elsif v_uur >= 17 and (v_s->>'kcal_over')::numeric > 700 then
      v_melden := true; v_reden := 'ruimte-over';
    end if;
    if not v_melden then continue; end if;

    v_lijst := '';
    for v_v in select * from jsonb_array_elements(v_s->'voorstellen') loop
      v_lijst := v_lijst || '<li style="margin:0 0 6px">' || (v_v->>'naam')
        || ', ' || (v_v->>'kcal') || ' kcal, ' || (v_v->>'eiwit') || ' g eiwit ('
        || replace(round((v_v->>'dichtheid')::numeric * 100, 1)::text, '.', ',')
        || ' g per 100 kcal)</li>';
    end loop;

    if v_reden = 'bijna-op' then
      v_ond := 'BennaHealth, je ruimte is bijna op';
      v_tekst := 'Er is nog ' || (v_s->>'kcal_over') || ' kcal over en het is pas ' || v_uur
        || ' uur. Niet dramatisch, wel het weten waard: de rest van de dag moet daarin passen.';
    elsif v_reden = 'ruimte-over' then
      v_ond := 'BennaHealth, er is nog veel ruimte';
      v_tekst := 'Er staat nog ' || (v_s->>'kcal_over') || ' kcal open. Structureel onder je doel '
        || 'eten ondermijnt het model net zo goed als eroverheen gaan: de weegreeks gaat dan dalen '
        || 'om een reden die niet in de logboeken staat.';
    else
      v_ond := 'BennaHealth, je eiwit loopt achter';
      v_tekst := 'Nog ' || (v_s->>'eiwit_over') || ' g eiwit te gaan in ' || (v_s->>'kcal_over')
        || ' kcal. Dat vraagt ' || replace((v_s->>'eis_per_100'), '.', ',')
        || ' g eiwit per 100 kcal in alles wat er nog bij komt.';
    end if;

    v_uit := v_uit || jsonb_build_object(
      'gebruiker_id', v_g.id, 'soort', p_soort, 'to', v_mail, 'subject', v_ond,
      'reden', v_reden,
      /* De edge function vraagt alleen een model om raad als je eigen
         geschiedenis niets te bieden had. Dan pas voegt een model iets toe. */
      'vraag_model', jsonb_array_length(v_s->'voorstellen') = 0,
      'stand', v_s,
      'tekst', v_tekst,
      'html', '<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:15px;'
        || 'line-height:1.6;color:#28352F;max-width:520px">'
        || '<p style="font-size:20px;font-weight:600;margin:0 0 12px;color:#07785C">BennaHealth</p>'
        || '<p style="margin:0 0 14px">' || v_tekst || '</p>'
        || case when v_lijst = '' then ''
                else '<p style="margin:0 0 6px;font-size:13px;color:#5B6862">Dit at je eerder en '
                     || 'het past nog:</p><ul style="margin:0 0 14px;padding-left:18px;font-size:14px">'
                     || v_lijst || '</ul>' end
        || case when coalesce(trim(v_url), '') = '' then ''
                else '<p style="margin:0"><a href="' || v_url
                     || '" style="color:#07785C">Openen</a></p>' end
        || '</div>');
  end loop;
  return v_uit;
end $$;


-- ------------------------------------------------------------------------
-- kal_nevo_zoek
-- uit 22-benaderen-mag-alleen-op-een-naam.sql
-- Alleen commentaar.

CREATE OR REPLACE FUNCTION public.kal_nevo_zoek(p_q text, p_limiet integer DEFAULT 8)
 RETURNS TABLE(nevo_code text, naam_nl text, groep text, energie_kcal_per_100g numeric, eiwit_g numeric, vet_g numeric, koolhydraten_g numeric, vezels_g numeric, benadering boolean)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  with vraag as (
    select regexp_replace(
             lower(regexp_replace(trim(coalesce(p_q,'')), '[^a-zà-ÿ0-9 ]', ' ', 'g')),
             '\s+', ' ', 'g') as q
  ),
  ruw as (
    select distinct w
    from vraag, unnest(string_to_array((select q from vraag), ' ')) as w
    where length(w) >= 2
      and w not in ('met','van','de','het','een','in','uit','op','aan','bij',
                    'er','of','en','per','voor','zonder',
                    -- telwoorden: ruis in een voedingstabel, en soms erger dan ruis
                    'twee','drie','vier','vijf','zes','zeven','acht','negen','tien',
                    'wat','beetje','stukje','paar')
  ),
  woorden as (
    -- sluitende -e eraf bij woorden van vijf letters of meer: gekookte -> gekookt
    select distinct
      case when length(w) >= 5 and right(w,1) = 'e' then left(w, length(w)-1) else w end as w
    from ruw
  ),
  bron as (
    -- nevo_actief en niet nevo_foods: dit is de licentiepoort. Staat de licentie
    -- van de actieve versie niet op gecontroleerd, dan is deze bron leeg en
    -- vindt het zoeken niets: precies wat de schakelaar hoort te doen. Dat geldt
    -- ook voor de terugval hieronder: die leest dezelfde bron.
    select n.nevo_code, n.naam_nl, n.groep, n.energie_kcal_per_100g,
           n.eiwit_g, n.vet_g, n.koolhydraten_g, n.vezels_g,
           lower(n.naam_nl) as nm,
           -- Alleen de namen, voor de terugval hieronder. Zie het commentaar daar.
           lower(n.naam_nl || ' ' || coalesce(n.naam_en,'')) as namen,
           lower(n.naam_nl || ' ' || coalesce(n.naam_en,'') || ' '
                 || coalesce(n.synoniem_nevo,'') || ' '
                 || coalesce(array_to_string(n.synoniemen_afgeleid, ' '), '')) as tekst,
           (select array_agg(lower(s))
              from unnest(array[n.naam_en, n.synoniem_nevo]
                          || coalesce(n.synoniemen_afgeleid, '{}')) s
             where s is not null) as syn
    from nevo_actief n
  ),
  -- treffers per woord, in één keer; hieruit volgt zowel de document frequency
  -- als welke producten welk woord bevatten
  raak as (
    select w.w, b.nevo_code
    from woorden w
    join bron b on
      case when length(w.w) <= 2 then b.tekst ~ ('\m' || w.w || '\M')
           when length(w.w) <= 4 then b.tekst ~ ('\m' || w.w)
           else position(w.w in b.tekst) > 0 end
  ),
  gewicht as (
    select w.w,
           -- greatest(..., 1): bij een lege bron zou dit ln(0) zijn en afbreken.
           -- Vanaf één product verandert er niets aan de uitkomst.
           ln(greatest((select count(*) from bron), 1)::numeric
              / (1 + (select count(*) from raak r where r.w = w.w)))
             as idf
    from woorden w
  ),
  totaal as (
    select coalesce(sum(greatest(idf, 0.01)), 0) as punten, count(*)::int as n from gewicht
  ),
  geteld as (
    select b.*,
           coalesce((select sum(greatest(g.idf, 0.01))
                       from raak r join gewicht g on g.w = r.w
                      where r.nevo_code = b.nevo_code), 0) as score,
           (select count(*) from raak r where r.nevo_code = b.nevo_code) as woorden_raak
    from bron b
  ),
  -- Wat het woordzoeken oplevert. Dit stond vroeger als eindselect met een
  -- `order by` eronder; de drie sorteersleutels staan nu als kolom in de rij,
  -- zodat de terugval eronder geplakt kan worden en de volgorde blijft staan.
  treffers as (
    select g.nevo_code, g.naam_nl, g.groep, g.energie_kcal_per_100g,
           g.eiwit_g, g.vet_g, g.koolhydraten_g, g.vezels_g,
           case
             when g.nm = v.q               then 0   -- precies deze naam
             when v.q = any(g.syn)         then 1   -- precies dit hele synoniem
             when g.nm like v.q || '%'     then 2   -- de naam begint met de vraag
             when g.woorden_raak = t.n     then 3   -- alle woorden komen voor
             else 4                                 -- een deel van de woorden
           end as trede,
           t.punten - g.score as afstand,   -- het zeldzaamste woord weegt zwaarst
           length(g.naam_nl) as lengte,     -- NEVO geeft het kernproduct de kortste naam
           false as benadering              -- dit is gevonden, niet benaderd
    from geteld g, totaal t, vraag v
    where t.n > 0 and g.woorden_raak > 0
  ),
  -- DE TERUGVAL: OP DE NAMEN, EN OP NIETS ANDERS
  --
  -- Waarom `b.namen` en niet `b.tekst`: `tekst` bevat ook de synoniemenvelden,
  -- en daar staat losse woordenbrij in. NEVO zet bij Pepermunt in
  -- `synoniem_nevo` de tekst "Tic-tac mint, after dinner mints", en de afgeleide
  -- synoniemen maken daar onder meer "after", "dinner", "mints" en
  -- "mintsdinnerafterminttic-tac" van.
  --
  -- "dinner" heeft skelet `tnr`, net als "doner". Dus wie shoarma zocht en
  -- "doner" typte kreeg Pepermunt. En dat terwijl NEVO helemaal geen döner of
  -- kebab kent: nagezocht in de Nederlandse én de Engelse namen: er zijn twee
  -- shoarmaproducten en verder niets. Het goede antwoord op "doner" is nul.
  --
  -- De regel die daaruit volgt is niet "pepermunt uitzonderen" maar: benaderen
  -- mag alleen op wat NEVO zelf een náám noemt. Een benadering bovenop een
  -- synoniem dat zelf al een benadering is, is twee keer raden. Het gewone
  -- woordzoeken hierboven leest alle velden gewoon door, dus wat alleen via een
  -- synoniem te vinden is (sjoarma, roti, nasi, ketjap) verandert niet.
  --
  -- DE MAAT ZELF, NA METING HERZIEN
  --
  -- De eerste versie zeefde op trigram-gelijkenis (word_similarity >= 0,5) en
  -- dat was aantoonbaar fout. Gemeten op de echte tabel van 2328 producten met
  -- hun Engelse namen erbij:
  --
  --     spagetti  -> spaghetti   0,58      GOED
  --     harira    -> haring      0,57      RUIS
  --     felafel   -> falafel     0,57      GOED
  --     lesagna   -> lasagna     0,50      GOED
  --     sjoarma   -> shoarma     0,50      GOED
  --     doner     -> donker      0,50      RUIS
  --
  -- De goede treffers en de ruis liggen in dezelfde band. Er is geen drempel die
  -- ze scheidt: op 0,7 verdwijnen lasagne, falafel en spaghetti, op 0,5 komen
  -- haring en donut binnen. Het scherm liet dat ook zien: wie "harira" zocht
  -- kreeg vier haringen en drie sperziebonen (Frans: haricots) onder de kop
  -- "dit lijkt erop". Dat is erger dan een leeg scherm.
  --
  -- Het skelet doet het wel, en de reden is te zien in dezelfde rijen: "harira"
  -- wordt `rr` en valt af op de lengte-eis, "doner" wordt `tnr` en "donker"
  -- wordt `tnkr`. Over de hele tabel:
  --
  --     skeletlengte 3   62% uniek, ergste botsing 8 woorden
  --     skeletlengte 4   85% uniek, ergste botsing 4 woorden, nooit meer
  --     skeletlengte 5   92% uniek
  --
  -- Dus: het skelet is de zeef. Maar een korte botsing kan wel veel producten
  -- raken (`brt` (brood, bereid, bread, broad) zit in 285 producten) en dan
  -- staat het goede antwoord er wel tussen maar niet bovenaan.
  --
  -- Daar komt de trigram alsnog van pas, niet als zeef maar als volgorde. Wie
  -- "broot" typt lijkt sterk op "brood" en nauwelijks op "bereid", en gemeten
  -- zet dat de goede bovenaan:
  --
  --     broot     -> Glutenvrij brood ...    0,67   (bereid zakt weg)
  --     yoghurd   -> Yoghurt volle/magere    0,75   (gort zakt weg)
  --     havermoud -> Pap havermout-          0,80   (vermouth zakt naar 0,40)
  --
  -- Hij draait alleen als het woordzoeken niets vond. Dat is met opzet: een
  -- benadering hoort nooit een echte treffer te verdringen, en de kosten betaal
  -- je zo alleen op een scherm dat anders leeg was gebleven.
  benadering as (
    select b.nevo_code, b.naam_nl, b.groep, b.energie_kcal_per_100g,
           b.eiwit_g, b.vet_g, b.koolhydraten_g, b.vezels_g,
           9 as trede,                      -- altijd achter elke echte trede
           1 - max(m.nabij) as afstand,
           length(b.naam_nl) as lengte,
           -- Deze vlag gaat mee naar het scherm. Zonder hem zou de app een
           -- benadering tonen alsof het een treffer was, en dat is dezelfde
           -- soort stilzwijgen als een getal zonder zijn onzekerheid.
           true as benadering
    from bron b
    join lateral (
      select extensions.word_similarity(w.w, nw) as nabij
      from woorden w,
           unnest(string_to_array(
             regexp_replace(b.namen, '[^a-zà-ÿ0-9 ]', ' ', 'g'), ' ')) as nw
      where length(nw) >= 4
        and length(kal_woordskelet(w.w)) >= 3
        and kal_woordskelet(w.w) = kal_woordskelet(nw)
    ) m on true
    group by b.nevo_code, b.naam_nl, b.groep, b.energie_kcal_per_100g,
             b.eiwit_g, b.vet_g, b.koolhydraten_g, b.vezels_g
  )
  select u.nevo_code, u.naam_nl, u.groep, u.energie_kcal_per_100g,
         u.eiwit_g, u.vet_g, u.koolhydraten_g, u.vezels_g, u.benadering
  from (
    select * from treffers
    -- `not exists` op een gematerialiseerde CTE wordt een InitPlan: staat er iets
    -- in `treffers`, dan wordt deze tak niet uitgevoerd en kost hij niets.
    union all
    select * from benadering where not exists (select 1 from treffers)
  ) u
  order by u.trede, u.afstand, u.lengte, u.naam_nl
  limit greatest(1, least(coalesce(p_limiet, 8), 50));
$function$;


-- ------------------------------------------------------------------------
-- kal_zoeken
-- uit 30-natrium-in-het-zoeken.sql
-- Alleen commentaar.

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

    -- NATRIUM ERBIJ, ZONDER kal_nevo_zoek AAN TE RAKEN
    --
    -- Zijn retourtype veranderen betekent hem eerst droppen, en dat raakt elke
    -- aanroep. Het is ook niet nodig: de nevo_code zit al in de uitslag, dus het
    -- getal is er met een join bij te halen.
    --
    -- `left join` en geen gewone: een product zonder natriumwaarde hoort uit het
    -- resultaat te blijven vallen, niet uit de lijst te verdwijnen. Het scherm
    -- toont dan een streepje, en dat is iets anders dan nul.
    'nevo', coalesce((
      select jsonb_agg(jsonb_build_object(
               'nevo_code', z.nevo_code, 'naam', z.naam_nl, 'groep', z.groep,
               'kcal', z.energie_kcal_per_100g, 'eiwit_g', z.eiwit_g, 'vet_g', z.vet_g,
               'koolhydraat_g', z.koolhydraten_g, 'vezel_g', z.vezels_g,
               'natrium_mg', nf.natrium_mg,
               'benadering', z.benadering))
      from kal_nevo_zoek(p_q, least(coalesce(p_limiet, 25), 50)) z
      left join nevo_foods nf on nf.nevo_code = z.nevo_code), '[]'::jsonb),

    -- DE GERECHTEN, MET TWEE DINGEN ERBIJ
    --
    -- Ten eerste: `names` wordt nu meegezocht. Die kolom staat er vanaf het
    -- begin: alternatieve namen per taal, met sleutels nl, darija_lat,
    -- darija_ar, tarifit_lat, ar, tr en srn, en werd door het zoeken
    -- doodleuk overgeslagen. Wie zijn eten in het Darija of het Turks noemt
    -- vond niets, terwijl het antwoord al in de rij stond. Dat is geen nieuwe
    -- inhoud maar inhoud die er lag en niet bereikbaar was.
    --
    -- Ten tweede: dezelfde terugval als bij NEVO, en om dezelfde reden alleen
    -- op het skelet. De trigram-zeef haalde hier net zo goed onzin binnen.
    -- `jsonb_agg` geeft NULL bij een lege verzameling, dus een `coalesce` met
    -- drie takken doet precies wat er nodig is, de tweede tak wordt alleen
    -- berekend als de eerste niets opleverde, en de derde alleen als beide
    -- niets gaven.
    'gerechten', coalesce(
      (select jsonb_agg(jsonb_build_object(
               'id', d.id, 'naam', d.name_nl, 'keuken', d.cuisine,
               'omschrijving', d.description_nl, 'porties', d.default_servings,
               'status', d.validation_status))
       from (select * from cultural_dishes
              where owner_patient_id is null
                and (select bool_and(lower(coalesce(name_nl,'') || ' ' ||
                                           coalesce(description_nl,'') || ' ' ||
                                           coalesce(cuisine,'') || ' ' ||
                                           coalesce((select string_agg(t.value, ' ')
                                                       from jsonb_each_text(names) t), ''))
                                     like '%' || w || '%')
                       from unnest(v_w) w)
              order by length(coalesce(name_nl,'')) limit 15) d),
      (select jsonb_agg(jsonb_build_object(
               'id', d.id, 'naam', d.name_nl, 'keuken', d.cuisine,
               'omschrijving', d.description_nl, 'porties', d.default_servings,
               'status', d.validation_status))
       from (select d.* from cultural_dishes d
              where d.owner_patient_id is null
                and exists (
                  select 1
                    from unnest(v_w) w,
                         unnest(string_to_array(
                           regexp_replace(
                             lower(coalesce(d.name_nl,'') || ' ' ||
                                   coalesce((select string_agg(t.value, ' ')
                                               from jsonb_each_text(d.names) t), '')),
                             '[^a-zà-ÿ0-9 ]', ' ', 'g'), ' ')) as nw
                   where length(nw) >= 4
                     and length(kal_woordskelet(w)) >= 3
                     and kal_woordskelet(w) = kal_woordskelet(nw))
              order by length(coalesce(d.name_nl,'')) limit 15) d),
      '[]'::jsonb),

    'eigen', coalesce((
      select jsonb_agg(to_jsonb(x))
      from (select * from kal_producten
             where gebruiker_id = v_id
               and (select bool_and(lower(naam) like '%' || w || '%') from unnest(v_w) w)
             order by length(naam) limit 15) x), '[]'::jsonb),

    -- Merkproducten uit `merk_actief`, dus achter de licentiepoort. Staat er
    -- geen actieve bron met gecontroleerde licentie, dan is deze emmer leeg en
    -- merkt de app er niets van. Zie 18-merkproducten.sql.
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
end $function$;


-- ------------------------------------------------------------------------
-- kal_ww_klacht
-- uit 39-een-wachtwoord-dat-standhoudt.sql
-- De twee meldingen aan de gebruiker, zonder gedachtestreepjes.

create or replace function public.kal_ww_klacht(p_ww text, p_account text default '')
 returns text
 language plpgsql
 stable
 set search_path to 'public'
as $function$
declare
  v_ww           text := coalesce(p_ww, '');
  v_klein        text := lower(coalesce(p_ww, ''));
  v_naam         text := lower(trim(coalesce(p_account, '')));
  v_verschillend integer;
  v_rij          integer;
begin
  if length(v_ww) < 12 then
    return 'Kies een wachtwoord van minstens 12 tekens';
  end if;

  /* Drie tekens is te kort om iets te betekenen: wie "ali" heet mag
     "kwaliteit" gebruiken. Vanaf vier wordt het een aanwijzing. */
  if length(v_naam) >= 4 and position(v_naam in v_klein) > 0 then
    return 'Je accountnaam staat erin, dat raadt iemand meteen';
  end if;

  select count(distinct c) into v_verschillend
    from regexp_split_to_table(v_klein, '') c;
  if v_verschillend < 5 then
    return 'Te weinig verschillende tekens, dit is een patroon, geen wachtwoord';
  end if;

  v_rij := kal_ww_rijlengte(v_klein);
  if v_rij * 2 > length(v_ww) then
    return 'Dit loopt in een rechte lijn over het toetsenbord';
  end if;

  if exists (select 1 from kal_ww_veelgebruikt
              where woord = any (kal_ww_grondvorm(v_ww))) then
    return 'Dit lijkt te veel op een wachtwoord dat heel veel mensen kiezen';
  end if;

  return null;
end $function$;


-- ------------------------------------------------------------------------
-- kal_dagen_importeren
-- uit 42-beweegminuten-uit-een-schermafdruk.sql
-- Bestand 42, dat nooit gedraaid is. Hiermee komen de fietsminuten mee.

create or replace function public.kal_dagen_importeren(p_token text, p_dagen jsonb)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_id uuid; v_rij jsonb; v_n integer := 0; v_fiets integer;
begin
  v_id := kal_sessie(p_token);
  for v_rij in select * from jsonb_array_elements(p_dagen) loop
    /* Ronden en niet afkappen, net als kal_beweging_dag doet: een post van
       44 min 36 s komt als 44,6 binnen en `'44.6'::integer` weigert Postgres. */
    v_fiets := round(nullif(v_rij->>'fiets_min','')::numeric)::integer;

    insert into kal_dagen(gebruiker_id, datum, gewicht_kg, stappen, actieve_energie_kcal,
                          fiets_min, bron)
    values (v_id, (v_rij->>'datum')::date,
            nullif(v_rij->>'gewicht_kg','')::numeric,
            nullif(v_rij->>'stappen','')::integer,
            nullif(v_rij->>'actieve_energie_kcal','')::integer,
            coalesce(v_fiets, 0),
            coalesce(v_rij->>'bron','import'))
    on conflict (gebruiker_id, datum) do update set
      gewicht_kg           = coalesce(excluded.gewicht_kg, kal_dagen.gewicht_kg),
      stappen              = coalesce(excluded.stappen, kal_dagen.stappen),
      actieve_energie_kcal = coalesce(excluded.actieve_energie_kcal, kal_dagen.actieve_energie_kcal),
      fiets_min            = coalesce(v_fiets, kal_dagen.fiets_min),
      updated_at           = now();
    v_n := v_n + 1;
  end loop;
  return v_n;
end $function$;
