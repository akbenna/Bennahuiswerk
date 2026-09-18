-- =============================================================================
-- SATURATIE EN BLOEDDRUK UIT DEZELFDE KOPPELING
--
-- Toestand onbekend: de kop zei lang "nog niet toegepast" en dat klopte
-- vermoedelijk niet meer. Dit bestand vervangt functies (`create or replace`),
-- en dat is volgens CLAUDE.md de gewone gang van zaken — opnieuw draaien mag
-- dus. Kijk wel na of wat er staat is wat je verwacht voordat je het doet.
--
-- WAT ER AL AUTOMATISCH BINNENKWAM
--
-- De weg staat er sinds bestand 04 en is uitgelegd in Koppelen.tsx: het horloge
-- meet, de Garmin Connect-app schrijft het in Apple Gezondheid, en één opdracht
-- op de iPhone stuurt het elke ochtend hierheen. Langs die weg kwamen al mee:
--
--     stappen · slaap · actieve energie · fietsminuten · gewicht · rustpols
--
-- De rustpols is daarbij het voorbeeld dat de rest volgt: hij woont niet in
-- kal_dagen maar in kal_metingen, en heeft daar zijn eigen regel — wat de
-- koppeling zelf neerzette mag hij bijwerken, wat jíj hebt ingevuld blijft staan.
--
-- WAT ER NIET BINNENKWAM
--
-- Saturatie en bloeddruk. Allebei stonden ze al in kal_metingen en in het
-- klinische scherm, en allebei moest je ze met de hand overtikken uit een app
-- die ze al had. Dat is precies het werk dat een koppeling hoort weg te nemen.
--
-- Bloeddruk komt daarbij níet van een horloge. Garmin-horloges meten hem niet;
-- wat hem in Apple Gezondheid zet is een bloeddrukmeter met een manchet (de
-- Garmin Index BPM, of welk ander merk dan ook). Voor de opdracht maakt dat
-- niets uit — die leest Gezondheid en niet het horloge — maar het is het
-- verschil tussen een waarde die er elke dag staat en een waarde die er staat op
-- de dagen dat je hebt gemeten.
--
-- DRIE KEER HETZELFDE IS TWEE KEER TE VEEL
--
-- Het blok in bestand 04 dat de rustpols wegschrijft is twintig regels: een
-- grens, een botsingsregel, een bijwerken-of-invoegen. Dat blok drie keer
-- overschrijven is drie plekken waar de regel uit elkaar kan gaan lopen, en de
-- botsingsregel is juist het soort ding dat overal hetzelfde hoort te zijn.
-- Daarom staat hij nu één keer, in kal_meting_uit_koppeling, en gebruikt de
-- rustpols hem ook.
--
-- DE GRENZEN, EN WAAROM ZE ONDERAAN ERTOE DOEN
--
--     rustpols        25 – 150 /min      (ongewijzigd, uit bestand 04)
--     saturatie       70 – 100 %
--     bloeddruk boven 60 – 260 mmHg
--     bloeddruk onder 30 – 160 mmHg
--
-- Saturatie is een percentage, dus boven de honderd is geen meting maar een
-- verkeerd veld. Onder de zeventig meet een polssensor geen mens meer: dat is
-- het bereik dat het sensortype zelf aangeeft.
--
-- De ondergrenzen doen meer werk dan ze lijken. `Bereken statistiek` in de
-- Opdrachten-app geeft over nul monsters een 0 terug en niet leeg — de fout die
-- bestand 04 voor stappen en energie apart moest afvangen. Voor deze drie velden
-- is dat niet nodig: een 0 valt hier vanzelf buiten elk bereik en wordt als
-- onmogelijk gemeld in plaats van als meting weggeschreven.
--
-- Elk veld meldt apart wat ermee gebeurd is, in dezelfde vier woorden als de
-- rustpols: niet meegestuurd, onmogelijk genegeerd, die van jou blijft staan, of
-- opgeslagen. Zonder dat kun je aan het antwoord van de opdracht niet zien of
-- een waarde ontbrak of geweigerd werd, en zoek je op de verkeerde plek.
--
-- Na het toepassen:  select * from kal_proef_lichaamsparameters();
-- en, omdat kal_beweging_dag verandert: select * from kal_proef_koppeling();
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. ÉÉN MEETWAARDE UIT DE KOPPELING WEGSCHRIJVEN
-- -----------------------------------------------------------------------------
--
-- De botsingsregel op één plek. Wat de koppeling gisteren neerzette mag hij
-- vandaag bijwerken — de rustpols van vanochtend is voorlopig, en morgen weet
-- het horloge het beter. Wat jij hebt ingevuld blijft staan, altijd: jij stond
-- erbij toen die bloeddruk werd gemeten en het horloge niet.

create or replace function public.kal_meting_uit_koppeling(
  p_gebruiker uuid,
  p_datum     date,
  p_soort     text,
  p_waarde    numeric,
  p_eenheid   text,
  p_laag      numeric,
  p_hoog      numeric
)
returns text
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
begin
  if p_waarde is null then
    return 'niet meegestuurd';
  end if;

  if p_waarde < p_laag or p_waarde > p_hoog then
    return 'onmogelijk, genegeerd';
  end if;

  if exists (select 1 from kal_metingen m
              where m.gebruiker_id = p_gebruiker
                and m.datum  = p_datum
                and m.soort  = p_soort
                and m.notitie is distinct from 'koppeling') then
    return 'die van jou blijft staan';
  end if;

  update kal_metingen
     set waarde = p_waarde, eenheid = p_eenheid
   where gebruiker_id = p_gebruiker
     and datum = p_datum
     and soort = p_soort
     and notitie = 'koppeling';

  if not found then
    insert into kal_metingen (gebruiker_id, datum, soort, waarde, eenheid, notitie)
    values (p_gebruiker, p_datum, p_soort, p_waarde, p_eenheid, 'koppeling');
  end if;

  return 'opgeslagen';
end $$;

comment on function public.kal_meting_uit_koppeling(uuid, date, text, numeric, text, numeric, numeric) is
  'Een meetwaarde uit de koppeling in kal_metingen zetten. Buiten het bereik wordt genegeerd; een meting die de gebruiker zelf invulde blijft staan. Zie 26-lichaamsparameters-uit-de-koppeling.sql.';

revoke all on function public.kal_meting_uit_koppeling(uuid, date, text, numeric, text, numeric, numeric)
  from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. DRIE VELDEN ERBIJ IN DE PLATTE INGANG
-- -----------------------------------------------------------------------------
--
-- Verder ongewijzigd ten opzichte van bestand 04. De nieuwe parameters staan
-- achteraan en hebben een standaardwaarde, dus een opdracht die ze niet stuurt
-- blijft werken zoals hij werkte.

create or replace function public.kal_beweging_dag(
  p_sleutel              text,
  p_datum                text default null,
  p_stappen              text default null,
  p_slaap_min            text default null,
  p_slaap_uur            text default null,
  p_slaap_sec            text default null,
  p_actieve_energie_kcal text default null,
  p_fiets_min            text default null,
  p_gewicht_kg           text default null,
  p_gewicht_bron         text default null,
  p_dagen_terug          text default null,
  p_hartslag_rust        text default null,
  p_saturatie            text default null,
  p_bloeddruk_sys        text default null,
  p_bloeddruk_dia        text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_datum     date;
  v_vandaag   date := (now() at time zone 'Europe/Amsterdam')::date;
  v_terug     numeric := kal_getal(p_dagen_terug);
  v_stappen   numeric := kal_getal(p_stappen);
  v_energie   numeric := kal_getal(p_actieve_energie_kcal);
  v_fiets     numeric := kal_getal(p_fiets_min);
  v_gewicht   numeric := kal_getal(p_gewicht_kg);
  v_pols      numeric := kal_getal(p_hartslag_rust);
  v_sat       numeric := kal_getal(p_saturatie);
  v_sys       numeric := kal_getal(p_bloeddruk_sys);
  v_dia       numeric := kal_getal(p_bloeddruk_dia);
  v_slaap     numeric;
  v_genegeerd boolean := false;
  v_leeg      text[]  := '{}';
  v_nul       text[]  := '{}';
  v_peiling   boolean := false;
  v_id        uuid;
  v_dag       jsonb;
  v_uit       jsonb;
begin
  v_datum := coalesce(
    nullif(trim(coalesce(p_datum, '')), '')::date,
    v_vandaag - v_terug::integer,
    v_vandaag - 1);

  v_slaap := coalesce(kal_getal(p_slaap_min),
                      kal_getal(p_slaap_uur) * 60,
                      kal_getal(p_slaap_sec) / 60);
  if v_slaap is not null and (v_slaap < 0 or v_slaap > 1440) then
    v_slaap := null;
    v_genegeerd := true;
  end if;

  /* Welke velden wel meekwamen maar niet te lezen waren. Zonder dit lijkt een
     onleesbare meting op een meting die je vergat mee te sturen, en dan zoek je
     op de verkeerde plek. Een léég veld staat hier niet in: dat is de gewone
     gang van zaken op een dag zonder die meting. */
  if nullif(trim(coalesce(p_stappen,'')),'')              is not null and v_stappen is null then v_leeg := array_append(v_leeg, 'stappen'); end if;
  if nullif(trim(coalesce(p_actieve_energie_kcal,'')),'') is not null and v_energie is null then v_leeg := array_append(v_leeg, 'actieve_energie_kcal'); end if;
  if nullif(trim(coalesce(p_fiets_min,'')),'')            is not null and v_fiets   is null then v_leeg := array_append(v_leeg, 'fiets_min'); end if;
  if nullif(trim(coalesce(p_gewicht_kg,'')),'')           is not null and v_gewicht is null then v_leeg := array_append(v_leeg, 'gewicht_kg'); end if;
  if nullif(trim(coalesce(p_hartslag_rust,'')),'')        is not null and v_pols    is null then v_leeg := array_append(v_leeg, 'hartslag_rust'); end if;
  if nullif(trim(coalesce(p_saturatie,'')),'')            is not null and v_sat     is null then v_leeg := array_append(v_leeg, 'saturatie'); end if;
  if nullif(trim(coalesce(p_bloeddruk_sys,'')),'')        is not null and v_sys     is null then v_leeg := array_append(v_leeg, 'bloeddruk_sys'); end if;
  if nullif(trim(coalesce(p_bloeddruk_dia,'')),'')        is not null and v_dia     is null then v_leeg := array_append(v_leeg, 'bloeddruk_dia'); end if;

  /* ---- een 0 die uit een lege zoekactie komt ----------------------------- */
  /* Bereken statistiek geeft over nul monsters een 0 terug en niet leeg. Die 0
     is dus niet te onderscheiden van "niets gevonden" — en als meting is hij
     voor elk van deze velden onmogelijk: wie zijn telefoon bij zich draagt komt
     niet op nul stappen of nul actieve energie uit, en nul minuten slaap
     bestaat niet. Wegschrijven levert een dag op die eruitziet als gemeten en
     die het model als echte nul meeneemt.

     Dit staat expres ná de leescontrole hierboven: een "0" is prima leesbaar en
     hoort niet in niet_gelezen thuis. En het staat expres alléén hier, in de
     platte ingang: die is van de telefoon, en dit is een eigenaardigheid van de
     Opdrachten-app. Wie via de lijst-ingang een 0 stuurt, meent hem.

     Saturatie, bloeddruk en rustpols staan hier niet bij, en missen niets: hun
     ondergrens vangt de 0 al af, en met een duidelijker melding — "onmogelijk,
     genegeerd" in plaats van stilte. */
  if v_stappen = 0 then v_stappen := null; v_nul := array_append(v_nul, 'stappen'); end if;
  if v_energie = 0 then v_energie := null; v_nul := array_append(v_nul, 'actieve_energie_kcal'); end if;
  if v_fiets   = 0 then v_fiets   := null; v_nul := array_append(v_nul, 'fiets_min'); end if;
  if v_slaap   = 0 then v_slaap   := null; v_nul := array_append(v_nul, 'slaap'); end if;
  if v_gewicht = 0 then v_gewicht := null; v_nul := array_append(v_nul, 'gewicht_kg'); end if;

  v_dag := jsonb_build_object('datum', v_datum);
  if v_stappen is not null then v_dag := v_dag || jsonb_build_object('stappen', v_stappen); end if;
  if v_slaap   is not null then v_dag := v_dag || jsonb_build_object('slaap_min', v_slaap); end if;
  if v_energie is not null then v_dag := v_dag || jsonb_build_object('actieve_energie_kcal', v_energie); end if;
  if v_fiets   is not null then v_dag := v_dag || jsonb_build_object('fiets_min', v_fiets); end if;
  if v_gewicht is not null then v_dag := v_dag || jsonb_build_object('gewicht_kg', v_gewicht); end if;
  if nullif(trim(coalesce(p_gewicht_bron,'')),'') is not null then
    v_dag := v_dag || jsonb_build_object('gewicht_bron', trim(p_gewicht_bron));
  end if;

  v_uit := kal_beweging_ontvangen(p_sleutel, jsonb_build_array(v_dag));

  /* Wie dit stuurde. Eén keer opzoeken: zowel de peiling als de metingen heeft
     het nodig, en twee keer dezelfde hash uitrekenen is twee plekken waar het
     uit elkaar kan gaan lopen. */
  select k.gebruiker_id into v_id from kal_koppelingen k
   where k.sleutel_hash = encode(digest(p_sleutel, 'sha256'), 'hex') and k.actief;

  /* Een tussenstand van vandaag blijft staan mét het tijdstip erbij. Waarom dat
     nodig is staat in 05: uit dagtotalen valt niet af te lezen of 3.400 stappen
     om drie uur voor jou veel of weinig is, en zonder dat weet de app niet
     wanneer het zin heeft om iets te zeggen. */
  v_peiling := kal_peiling_vastleggen(v_id, v_datum, v_stappen, v_energie);

  /* ---- de lichaamsparameters, want die wonen in kal_metingen ------------- */
  return v_uit
      || jsonb_build_object('datum', v_datum)
      || jsonb_build_object('slaap_genegeerd', v_genegeerd)
      || jsonb_build_object('hartslag_rust',
           kal_meting_uit_koppeling(v_id, v_datum, 'hartslag_rust', v_pols, '/min',  25, 150))
      || jsonb_build_object('saturatie',
           kal_meting_uit_koppeling(v_id, v_datum, 'saturatie',     v_sat,  '%',     70, 100))
      || jsonb_build_object('bloeddruk_sys',
           kal_meting_uit_koppeling(v_id, v_datum, 'bloeddruk_sys', v_sys,  'mmHg',  60, 260))
      || jsonb_build_object('bloeddruk_dia',
           kal_meting_uit_koppeling(v_id, v_datum, 'bloeddruk_dia', v_dia,  'mmHg',  30, 160))
      || jsonb_build_object('niet_gelezen', to_jsonb(v_leeg))
      || jsonb_build_object('nul_overgeslagen', to_jsonb(v_nul))
      || jsonb_build_object('peiling', v_peiling);
end $$;

revoke all on function public.kal_beweging_dag(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.kal_beweging_dag(
  text, text, text, text, text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;

-- De vorige vorm weghalen, anders weet PostgREST niet welke je bedoelt.
drop function if exists public.kal_beweging_dag(
  text, text, text, text, text, text, text, text, text, text, text, text);

COMMIT;


-- ---------------------------------------------------------------------------
-- 3. DE PROEF
-- ---------------------------------------------------------------------------
--
-- Apart van kal_proef_koppeling en niet erin. Die staat op 41 gevallen en gaat
-- over de dagtabel; deze gaat over kal_metingen. Ze in elkaar schuiven zou één
-- functie van vierhonderd regels opleveren waarin niet meer te zien is welke
-- regel welk geval dekt.
--
-- Hij schrijft in de echte tabellen en draait zichzelf terug, net als 03.

create or replace function public.kal_proef_lichaamsparameters()
returns table(geval text, goed boolean, gezien text)
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_a      uuid;
  v_sa     text := 'proef-lichaam-' || gen_random_uuid()::text;
  v_datum  date := (now() at time zone 'Europe/Amsterdam')::date;
  v_ant    jsonb;
  v_w      numeric;
  v_n      integer;
  v_uit    jsonb := '[]'::jsonb;
begin
  begin
    select id into v_a from kal_gebruikers order by aangemaakt_op limit 1;
    if v_a is null then
      return query select 'geen gebruiker om mee te proeven'::text, false, ''::text;
      return;
    end if;

    insert into kal_koppelingen (gebruiker_id, naam, sleutel_hash, actief)
    values (v_a, 'proef', encode(digest(v_sa, 'sha256'), 'hex'), true);

    /* ---- 1. het gewone geval ------------------------------------------- */
    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0',
               p_saturatie := '97', p_bloeddruk_sys := '128', p_bloeddruk_dia := '82');

    v_uit := v_uit || jsonb_build_object('geval','saturatie wordt opgeslagen',
      'goed', v_ant->>'saturatie' = 'opgeslagen', 'gezien', v_ant->>'saturatie');
    v_uit := v_uit || jsonb_build_object('geval','bloeddruk boven wordt opgeslagen',
      'goed', v_ant->>'bloeddruk_sys' = 'opgeslagen', 'gezien', v_ant->>'bloeddruk_sys');
    v_uit := v_uit || jsonb_build_object('geval','bloeddruk onder wordt opgeslagen',
      'goed', v_ant->>'bloeddruk_dia' = 'opgeslagen', 'gezien', v_ant->>'bloeddruk_dia');

    select waarde into v_w from kal_metingen
     where gebruiker_id = v_a and datum = v_datum and soort = 'saturatie';
    v_uit := v_uit || jsonb_build_object('geval','en staat er met de juiste waarde',
      'goed', v_w = 97, 'gezien', format('%s', v_w));

    /* ---- 2. een komma, want de telefoon staat op Nederlands -------------- */
    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '1', p_saturatie := '96,5');
    select waarde into v_w from kal_metingen
     where gebruiker_id = v_a and datum = v_datum - 1 and soort = 'saturatie';
    v_uit := v_uit || jsonb_build_object('geval','een komma is een decimaalteken',
      'goed', v_w = 96.5, 'gezien', format('%s', v_w));

    /* ---- 3. de grenzen --------------------------------------------------- */
    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '2', p_saturatie := '104');
    v_uit := v_uit || jsonb_build_object('geval','saturatie boven 100 wordt geweigerd',
      'goed', v_ant->>'saturatie' = 'onmogelijk, genegeerd', 'gezien', v_ant->>'saturatie');

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '2', p_saturatie := '0');
    v_uit := v_uit || jsonb_build_object('geval','EEN 0 UIT EEN LEGE ZOEKACTIE WORDT GEWEIGERD',
      'goed', v_ant->>'saturatie' = 'onmogelijk, genegeerd', 'gezien', v_ant->>'saturatie');

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '2', p_bloeddruk_sys := '0');
    v_uit := v_uit || jsonb_build_object('geval','een bloeddruk van 0 ook',
      'goed', v_ant->>'bloeddruk_sys' = 'onmogelijk, genegeerd', 'gezien', v_ant->>'bloeddruk_sys');

    select count(*) into v_n from kal_metingen
     where gebruiker_id = v_a and datum = v_datum - 2;
    v_uit := v_uit || jsonb_build_object('geval','en er staat niets van die dag',
      'goed', v_n = 0, 'gezien', format('%s metingen', v_n));

    /* ---- 4. de botsingsregel -------------------------------------------- */
    /* Deze is de reden dat deze proef bestaat. Een koppeling die elke ochtend
       vuurt mag niet de bloeddruk overschrijven die je gisteravond zelf hebt
       ingevuld met de manchet om je arm. */
    insert into kal_metingen (gebruiker_id, datum, soort, waarde, eenheid, notitie)
    values (v_a, v_datum - 3, 'bloeddruk_sys', 142, 'mmHg', null);

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '3', p_bloeddruk_sys := '118');
    v_uit := v_uit || jsonb_build_object('geval','JOUW METING WORDT NIET OVERSCHREVEN',
      'goed', v_ant->>'bloeddruk_sys' = 'die van jou blijft staan',
      'gezien', v_ant->>'bloeddruk_sys');

    select waarde into v_w from kal_metingen
     where gebruiker_id = v_a and datum = v_datum - 3 and soort = 'bloeddruk_sys';
    v_uit := v_uit || jsonb_build_object('geval','en staat er onveranderd',
      'goed', v_w = 142, 'gezien', format('%s', v_w));

    /* ---- 5. maar zijn eigen meting mag hij wel bijwerken ----------------- */
    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '0', p_saturatie := '95');
    select waarde into v_w from kal_metingen
     where gebruiker_id = v_a and datum = v_datum and soort = 'saturatie';
    v_uit := v_uit || jsonb_build_object('geval','de koppeling werkt zijn eigen meting bij',
      'goed', v_w = 95, 'gezien', format('%s', v_w));

    select count(*) into v_n from kal_metingen
     where gebruiker_id = v_a and datum = v_datum and soort = 'saturatie';
    v_uit := v_uit || jsonb_build_object('geval','en maakt er geen tweede rij bij',
      'goed', v_n = 1, 'gezien', format('%s rijen', v_n));

    /* ---- 6. onleesbaar en leeg ------------------------------------------ */
    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '4', p_saturatie := 'geen data');
    v_uit := v_uit || jsonb_build_object('geval','onleesbaar wordt gemeld als niet gelezen',
      'goed', v_ant->'niet_gelezen' ? 'saturatie', 'gezien', v_ant->>'niet_gelezen');

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '4', p_stappen := '2000');
    v_uit := v_uit || jsonb_build_object('geval','weggelaten is niet hetzelfde als onleesbaar',
      'goed', v_ant->>'saturatie' = 'niet meegestuurd' and not (v_ant->'niet_gelezen' ? 'saturatie'),
      'gezien', format('%s / %s', v_ant->>'saturatie', v_ant->>'niet_gelezen'));

    /* ---- 7. de rustpols doet nog steeds wat hij deed ---------------------- */
    /* Hij loopt nu door dezelfde functie. Als dat iets gebroken heeft, hoort het
       hier zichtbaar te worden en niet pas op een telefoon. */
    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '5', p_hartslag_rust := '58');
    v_uit := v_uit || jsonb_build_object('geval','de rustpols werkt onveranderd',
      'goed', v_ant->>'hartslag_rust' = 'opgeslagen', 'gezien', v_ant->>'hartslag_rust');

    v_ant := kal_beweging_dag(v_sa, p_dagen_terug := '5', p_hartslag_rust := '180');
    v_uit := v_uit || jsonb_build_object('geval','en weigert een pols van 180 nog steeds',
      'goed', v_ant->>'hartslag_rust' = 'onmogelijk, genegeerd', 'gezien', v_ant->>'hartslag_rust');

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

-- Alleen via de SQL-editor of een beheerdersverbinding.
revoke all on function public.kal_proef_lichaamsparameters() from public, anon, authenticated;

-- =============================================================================
-- Zeventien gevallen. Draaien na het toepassen:
--
--   select * from kal_proef_lichaamsparameters();   -- alles goed
--   select * from kal_proef_koppeling();            -- 41 gevallen, alle goed
--
-- De tweede hoort er ook bij: kal_beweging_dag is vervangen, en de rustpols
-- loopt nu door een andere functie dan gisteren.
--
-- Terugdraaien: bestand 04 opnieuw draaien, daarna
--   drop function if exists public.kal_proef_lichaamsparameters();
--   drop function if exists public.kal_meting_uit_koppeling(uuid, date, text, numeric, text, numeric, numeric);
--   drop function if exists public.kal_beweging_dag(
--     text, text, text, text, text, text, text, text, text, text, text, text, text, text, text);
-- =============================================================================
