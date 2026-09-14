-- =============================================================================
-- NATRIUM IN HET ZOEKEN — en de vraag die eerst beantwoord moet worden
--
-- Toegepast op 14-09-2026.
--
-- Stap 1 gaf `natrium_mg`, numeric, en 2.326 van de 2.328 producten dragen een
-- waarde — geen lege kolom maar een echte import. Stap 2 liet zien dat de
-- levende kal_zoeken woordelijk gelijk was aan die in bestand 21. Stap 3 is
-- gedraaid en nagekeken: een bouillonblokje geeft 19.687 mg natrium per 100 g,
-- wat neerkomt op ruim 49 gram zout — een blokje is inderdaad ongeveer half
-- zout, en dat is de uitslag die je wilt zien als je weet dat het klopt.
--
-- WAAROM
--
-- Wie hoge bloeddruk heeft opgegeven, hoort bij een product te zien hoeveel
-- zout erin zit. Dat is de tegenhanger van wat er voor diabetes al staat: sinds
-- het conditieprofiel toont het zoekscherm koolhydraten en vezel zodra iemand
-- diabetes heeft aangevinkt (zie `Zoeken` in `src/health/schermen/Voeding.tsx`).
-- Voor zout kon dat niet, en niet omdat het scherm het niet wilde: het getal
-- komt niet mee uit `kal_zoeken`.
--
-- WAT ER NU MEEKOMT
--
-- kal_nevo_zoek() geeft precies acht kolommen terug, en die zijn in bestand 20
-- vastgelegd:
--
--     nevo_code, naam_nl, groep, energie_kcal_per_100g,
--     eiwit_g, vet_g, koolhydraten_g, vezels_g, benadering
--
-- Vier voedingsstoffen dus. Nergens in de hele map wordt een natriumkolom
-- genoemd — niet in het zoeken, niet in de portiematen, niet in de
-- verzadigingsscore. Dat is het vermoeden dat stap 1 moet toetsen: het is goed
-- mogelijk dat de import destijds alleen die vier stoffen heeft meegenomen en
-- dat natrium in de brontabel helemaal niet bestaat.
--
-- Dat verschil bepaalt welk werk het is. Staat de kolom er, dan is dit een
-- kwestie van één functie aanvullen. Staat hij er niet, dan is het een import
-- uit het NEVO-bestand, en dat is een heel ander soort klus — de CSV blijft
-- buiten de repo, dus die stap gebeurt met de hand en niet vanuit een bestand.
--
-- =============================================================================
-- STAP 1 — bestaat de kolom?
--
-- Draai dit eerst. Verder lezen heeft geen zin voordat je de uitslag hebt.

select column_name, data_type
  from information_schema.columns
 where table_schema = 'public'
   and table_name   = 'nevo_foods'
   and (column_name ilike '%natrium%' or column_name ilike '%sodium%'
        or column_name ilike '%zout%' or column_name ilike '%salt%')
 order by column_name;

-- Geen rijen terug? Dan houdt het hier op. Wat er dan moet gebeuren staat
-- onderaan onder "ALS DE KOLOM ER NIET IS". Voer de rest van dit bestand niet
-- uit: een functie die naar een kolom verwijst die niet bestaat is geen
-- vergissing die je later ontdekt, maar één die het zoeken meteen breekt.

-- =============================================================================
-- STAP 2 — is de levende functie nog dezelfde als bestand 21?
--
-- Alleen uitvoeren als stap 1 een kolom gaf.
--
-- De SQL in deze map is een verslag en geen migratiesysteem, en dat betekent
-- dat een `create or replace` van kal_zoeken() alles overschrijft wat er sinds
-- bestand 21 aan gedaan is. Vandaar deze stap, en niet de md5-vergelijking uit
-- CLAUDE.md: die vertelt je dát er verschil is, en hier wil je zien wélk.
--
-- Zet de uitkomst naast het `create or replace function public.kal_zoeken` in
-- 21-de-zeef-en-de-volgorde.sql, regel 244. Zijn ze gelijk, ga dan door naar
-- stap 3. Zijn ze niet gelijk, neem dan de nevo-tak uit stap 3 over in de
-- levende versie in plaats van die versie te vervangen.

select pg_get_functiondef(p.oid)
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'kal_zoeken';

-- =============================================================================
-- STAP 3 — de verandering zelf
--
-- Alleen uitvoeren als stap 1 een kolom gaf én stap 2 liet zien dat de levende
-- functie gelijk is aan die in 21-de-zeef-en-de-volgorde.sql. Op 14 september
-- 2026 was dat zo; de uitdraai van stap 2 kwam woordelijk overeen.
--
-- Wat hieronder staat is die functie, met één blok anders. kal_nevo_zoek()
-- blijft ongemoeid.
--
-- Stap 1 gaf op 14 september 2026: `natrium_mg`, numeric. Die naam staat
-- hieronder ingevuld en de sleutel heet net zo, dus de eenheid in de naam klopt
-- met wat erin zit. Zou de kolom ooit grammen gaan dragen, dan moet de sleutel
-- mee veranderen — een veld dat 'natrium_mg' heet met grammen erin is het soort
-- fout dat er jaren in blijft zitten.
--
-- EN ZOUT IS GEEN NATRIUM: zout = natrium x 2,5. Welke van de twee op het scherm
-- komt is een keuze voor het scherm, en de omrekening hoort op één plek te
-- gebeuren. Niet hier én daar.

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
    -- begin — alternatieve namen per taal, met sleutels nl, darija_lat,
    -- darija_ar, tarifit_lat, ar, tr en srn — en werd door het zoeken
    -- doodleuk overgeslagen. Wie zijn eten in het Darija of het Turks noemt
    -- vond niets, terwijl het antwoord al in de rij stond. Dat is geen nieuwe
    -- inhoud maar inhoud die er lag en niet bereikbaar was.
    --
    -- Ten tweede: dezelfde terugval als bij NEVO, en om dezelfde reden alleen
    -- op het skelet. De trigram-zeef haalde hier net zo goed onzin binnen.
    -- `jsonb_agg` geeft NULL bij een lege verzameling, dus een `coalesce` met
    -- drie takken doet precies wat er nodig is — de tweede tak wordt alleen
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

-- =============================================================================
-- STAP 4 — nakijken
--
-- Na het toepassen, met een product waarvan je de zoutwaarde kent:

-- select jsonb_pretty(kal_zoeken('<token>', 'bouillonblokje', 3) -> 'nevo');

-- =============================================================================
-- ALS DE KOLOM ER NIET IS
--
-- Dan is dit geen functiewijziging maar een import, en dan hoort de volgorde zo:
--
--   1. een kolom toevoegen aan nevo_foods, additief en zonder iets aan te raken
--      wat er al staat (`alter table ... add column if not exists`);
--   2. de waarden vullen uit het NEVO-bestand, per nevo_code, met
--      `on conflict do nothing`-denken: bestaande rijen worden bijgewerkt op
--      één kolom die nu leeg is, en verder nergens aan geraakt;
--   3. pas daarna stap 2 en 3 hierboven.
--
-- Die tweede stap gebeurt met de hand. De bronbestanden blijven buiten de repo
-- (zie CLAUDE.md), dus er komt geen bestand in deze map dat de tabel vult.
--
-- Zolang dit niet gebeurd is, zwijgt het zoekscherm over zout. Dat staat zo in
-- `Zoeken` in Voeding.tsx, met de reden erbij: een leeg streepje op de plek van
-- een zoutwaarde leest als "bevat geen zout", en dat is erger dan niets tonen.
