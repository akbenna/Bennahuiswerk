-- =============================================================================
-- WAT HET ECHT INSTELLEN OP EEN IPHONE OPLEVERDE
--
-- Toegepast 23 augustus 2026, tijdens het opbouwen van de opdracht op een echt
-- toestel. Elk van deze wijzigingen komt uit iets dat daar stukliep. Dat is de
-- reden dat ze hier bij elkaar staan: het is geen ontwerp achteraf maar een
-- lijst van dingen die je niet bedenkt.
--
--   1. `p_dagen_terug` — de datum meesturen vraagt op een iPhone twee extra
--      acties, een aangepaste notatie en een variabele (`Huidige datum`) die
--      niet eens in de variabelenkiezer staat. Eén getal doet hetzelfde werk:
--      0 is vandaag, 1 is gisteren.
--
--   2. Alle getallen komen binnen als tekst. Een nacht zonder slaapmeting gaf
--      een lege waarde, PostgREST probeerde die naar numeric te casten, en het
--      hele bericht sneuvelde met 22P02 — inclusief de stappen die wél gemeten
--      waren. Eén ontbrekende meting hoort de andere niet mee te slepen.
--      `kal_getal` leest ze zelf: leeg is 'niet meegestuurd', een komma is een
--      decimaalteken (de telefoon staat op Nederlands), en iets onleesbaars
--      wordt overgeslagen en gemeld.
--
--   3. `p_hartslag_rust` — de rustpols bestond al als meting die je met de hand
--      invulde, maar kwam nergens binnen en werd nergens getoond. Het is het
--      waardevolste dagcijfer dat een horloge levert: hij daalt als de conditie
--      verbetert en stijgt bij ziekte, slechte slaap of te zware belasting.
--
--   4. Een 0 wordt niet weggeschreven. `Bereken statistiek` geeft over nul
--      monsters een 0 terug en niet leeg. Op 23 augustus kwam er zo 0 kcal
--      actieve energie binnen naast 1.746 stappen — onmogelijk als meting, en
--      niet te onderscheiden van "niets gevonden". Zo'n 0 maakt een dag die
--      eruitziet als gemeten, en het model rekent er dan mee.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Een getal uit tekst lezen, zonder dat een lege waarde een fout is.
-- -----------------------------------------------------------------------------
create or replace function public.kal_getal(p_tekst text)
returns numeric
language plpgsql
immutable
as $$
declare v text;
begin
  /* De telefoon staat op Nederlands en schrijft 7,45 waar Postgres 7.45 wil. */
  v := replace(trim(coalesce(p_tekst, '')), ',', '.');
  if v = '' then return null; end if;
  begin
    return v::numeric;
  exception when others then
    return null;
  end;
end $$;

comment on function public.kal_getal(text) is
  'Leest een getal uit tekst. Leeg of onleesbaar geeft null in plaats van een fout.';

-- -----------------------------------------------------------------------------
-- Eén dag insturen, plat, met alles als tekst.
--
-- De botsingsregels van kal_beweging_ontvangen blijven waar ze horen: deze
-- functie rekent niets uit, hij bouwt de dag en geeft hem door. De rustpols is
-- de uitzondering, want die woont in kal_metingen en heeft daar zijn eigen
-- regel: een meting die de koppeling zelf neerzette mag hij bijwerken (de
-- rustpols van vanochtend is voorlopig), maar een meting die jij hebt ingevuld
-- blijft staan.
-- -----------------------------------------------------------------------------
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
  p_hartslag_rust        text default null
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
  v_slaap     numeric;
  v_genegeerd boolean := false;
  v_leeg      text[]  := '{}';
  v_nul       text[]  := '{}';
  v_polsuit   text    := 'niet meegestuurd';
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
     Opdrachten-app. Wie via de lijst-ingang een 0 stuurt, meent hem. */
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

  /* ---- de rustpols, apart, want die woont in kal_metingen ---------------- */
  if v_pols is not null then
    /* Een pols buiten 25 en 150 is geen rustpols maar een verkeerd veld. */
    if v_pols < 25 or v_pols > 150 then
      v_polsuit := 'onmogelijk, genegeerd';
    else
      select k.gebruiker_id into v_id from kal_koppelingen k
       where k.sleutel_hash = encode(digest(p_sleutel, 'sha256'), 'hex') and k.actief;

      if exists (select 1 from kal_metingen m
                  where m.gebruiker_id = v_id and m.datum = v_datum
                    and m.soort = 'hartslag_rust'
                    and m.notitie is distinct from 'koppeling') then
        v_polsuit := 'die van jou blijft staan';
      else
        update kal_metingen set waarde = v_pols, eenheid = '/min'
         where gebruiker_id = v_id and datum = v_datum
           and soort = 'hartslag_rust' and notitie = 'koppeling';
        if not found then
          insert into kal_metingen(gebruiker_id, datum, soort, waarde, eenheid, notitie)
          values (v_id, v_datum, 'hartslag_rust', v_pols, '/min', 'koppeling');
        end if;
        v_polsuit := 'opgeslagen';
      end if;
    end if;
  end if;

  return v_uit
      || jsonb_build_object('datum', v_datum)
      || jsonb_build_object('slaap_genegeerd', v_genegeerd)
      || jsonb_build_object('hartslag_rust', v_polsuit)
      || jsonb_build_object('niet_gelezen', to_jsonb(v_leeg))
      || jsonb_build_object('nul_overgeslagen', to_jsonb(v_nul));
end $$;

revoke all on function public.kal_getal(text) from public;
revoke all on function public.kal_beweging_dag(
  text, text, text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.kal_beweging_dag(
  text, text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;

-- De oudere vormen weghalen, anders weet PostgREST niet welke je bedoelt.
drop function if exists public.kal_beweging_dag(
  text, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text);
drop function if exists public.kal_beweging_dag(
  text, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, integer);
drop function if exists public.kal_beweging_dag(
  text, text, text, text, text, text, text, text, text, text, text);

-- =============================================================================
-- De proef staat op 31 gevallen. Zie 03-proef-koppeling.sql voor waarom hij zo
-- werkt; de vijf nieuwe gaan over de rustpols en vier eerdere over wat een echte
-- telefoon stuurt: een lege waarde, een komma, iets onleesbaars, en dagen_terug.
--
--   select * from kal_proef_koppeling();
-- =============================================================================
