-- =============================================================================
-- DE KOPPELINGSREGELS VASTLEGGEN
--
-- Toegepast 23 augustus 2026.
--
-- De botsingsregels van `kal_beweging_ontvangen` zijn dragend voor het model:
-- als een weegschaal 's avonds een getal doorgeeft en dat overschrijft je
-- ochtendweging, is de helling waardeloos en merk je dat nooit. Die regels
-- stonden alleen in de functie zelf, en niets hield tegen dat iemand ze bij een
-- volgende wijziging omdraait.
--
-- Deze proef legt ze vast. Twee dingen daaraan zijn niet vanzelfsprekend:
--
-- 1. Hij schrijft in de échte tabellen. Anders toetst hij de regels niet maar
--    een nabootsing ervan, en dan bewijst hij niets over wat er in productie
--    gebeurt. Hij draait zichzelf altijd terug: alles staat in een blok dat
--    eindigt met een exception, en plpgsql rolt de schrijfacties van dat blok
--    dan terug. De uitslag overleeft dat wel, want variabelen zijn niet
--    transactioneel.
--
-- 2. De proef is zelf getoetst met een mutatieproef: met de gewichtsregel
--    omgedraaid — `coalesce(nieuw, oud)` in plaats van `coalesce(oud, nieuw)` —
--    slaan er twee gevallen om. Een proef die nooit rood wordt is erger dan
--    geen proef, want hij geeft dekking die er niet is.
--
-- Waarom dit geen vijfde poort in `npm run controle` is: die poorten draaien
-- zonder database. Dit is dus een script dat je zelf draait, na elke wijziging
-- aan `kal_beweging_ontvangen` of `kal_beweging_dag`:
--
--     select * from kal_proef_koppeling();
--
-- Alle regels horen `goed = true` te geven.
-- =============================================================================

create or replace function public.kal_proef_koppeling()
returns table(geval text, goed boolean, gezien text)
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_uit      jsonb := '[]'::jsonb;
  v_a        uuid;   -- gebruiker A, met een sleutel
  v_b        uuid;   -- gebruiker B, zonder
  v_sa       text;
  v_dood     text;   -- ingetrokken sleutel
  v_ant      jsonb;
  v_d        record;
  v_vandaag  date := (now() at time zone 'Europe/Amsterdam')::date;
  v_gist     date;
  v_dag      date;
  v_n        integer;
begin
  v_gist := v_vandaag - 1;
  v_dag  := v_vandaag - 5;

  begin
    /* ---- opzet: twee gebruikers, één sleutel, één ingetrokken sleutel ---- */
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
      v_uit := v_uit || jsonb_build_object('geval','onbekende sleutel wordt geweigerd',
                                           'goed',false,'gezien','geaccepteerd');
    exception when others then
      v_uit := v_uit || jsonb_build_object('geval','onbekende sleutel wordt geweigerd',
                                           'goed',sqlerrm like '%koppelsleutel%','gezien',sqlerrm);
    end;

    begin
      perform kal_beweging_ontvangen('', '[]'::jsonb);
      v_uit := v_uit || jsonb_build_object('geval','lege sleutel wordt geweigerd',
                                           'goed',false,'gezien','geaccepteerd');
    exception when others then
      v_uit := v_uit || jsonb_build_object('geval','lege sleutel wordt geweigerd',
                                           'goed',true,'gezien',sqlerrm);
    end;

    begin
      perform kal_beweging_ontvangen(v_dood, '[]'::jsonb);
      v_uit := v_uit || jsonb_build_object('geval','ingetrokken sleutel wordt geweigerd',
                                           'goed',false,'gezien','geaccepteerd');
    exception when others then
      v_uit := v_uit || jsonb_build_object('geval','ingetrokken sleutel wordt geweigerd',
                                           'goed',true,'gezien',sqlerrm);
    end;

    /* ============================ de botsingsregels ===================== */
    /* Een dag zoals hij eruitziet als je hem zelf hebt ingevuld. */
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

    /* Weglaten laat staan wat er stond. */
    v_ant := kal_beweging_ontvangen(v_sa, jsonb_build_array(
      jsonb_build_object('datum', v_dag, 'fiets_min', 30)));
    select * into v_d from kal_dagen where gebruiker_id=v_a and datum=v_dag;
    v_uit := v_uit || jsonb_build_object('geval','weggelaten velden blijven staan',
      'goed', v_d.stappen = 8421 and v_d.slaap_min = 448 and v_d.fiets_min = 30,
      'gezien', format('stappen=%s slaap=%s fiets=%s', v_d.stappen, v_d.slaap_min, v_d.fiets_min));

    /* Een lege dag krijgt het gewicht wél. */
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
      'goed', (v_ant->>'overgeslagen')::int = 3 and (v_ant->>'dagen')::int = 0,
      'gezien', v_ant::text);
    select count(*) into v_n from kal_dagen where gebruiker_id=v_a and datum > v_vandaag;
    v_uit := v_uit || jsonb_build_object('geval','er staat geen dag in de toekomst',
      'goed', v_n = 0, 'gezien', format('%s dagen', v_n));

    begin
      perform kal_beweging_ontvangen(v_sa, (
        select jsonb_agg(jsonb_build_object('datum', v_vandaag - i, 'stappen', 1))
          from generate_series(1, 401) i));
      v_uit := v_uit || jsonb_build_object('geval','meer dan 400 dagen wordt geweigerd',
                                           'goed',false,'gezien','geaccepteerd');
    exception when others then
      v_uit := v_uit || jsonb_build_object('geval','meer dan 400 dagen wordt geweigerd',
                                           'goed',true,'gezien',sqlerrm);
    end;

    begin
      perform kal_beweging_ontvangen(v_sa, '{"geen":"lijst"}'::jsonb);
      v_uit := v_uit || jsonb_build_object('geval','iets dat geen lijst is wordt geweigerd',
                                           'goed',false,'gezien','geaccepteerd');
    exception when others then
      v_uit := v_uit || jsonb_build_object('geval','iets dat geen lijst is wordt geweigerd',
                                           'goed',true,'gezien',sqlerrm);
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
      'gezien', format('%s berichten, %s dagen, gezien=%s',
                       v_d.aantal_berichten, v_d.aantal_dagen, v_d.gezien));

    /* ========================= de platte ingang ========================= */
    v_ant := kal_beweging_dag(v_sa, p_stappen := 7000);
    v_uit := v_uit || jsonb_build_object('geval','zonder datum wordt het gisteren',
      'goed', (v_ant->>'datum')::date = v_gist, 'gezien', v_ant->>'datum');

    v_ant := kal_beweging_dag(v_sa, p_datum := '', p_stappen := 7001);
    v_uit := v_uit || jsonb_build_object('geval','lege datumtekst wordt ook gisteren',
      'goed', (v_ant->>'datum')::date = v_gist, 'gezien', v_ant->>'datum');

    v_ant := kal_beweging_dag(v_sa, p_datum := (v_vandaag - 6)::text, p_stappen := 100);
    v_uit := v_uit || jsonb_build_object('geval','een eigen datum overrulet de standaard',
      'goed', (v_ant->>'datum')::date = v_vandaag - 6, 'gezien', v_ant->>'datum');

    perform kal_beweging_dag(v_sa, p_slaap_uur := 7.45);
    select slaap_min into v_d from kal_dagen where gebruiker_id=v_a and datum=v_gist;
    v_uit := v_uit || jsonb_build_object('geval','slaap in uren wordt minuten',
      'goed', v_d.slaap_min = 447, 'gezien', format('7,45 uur -> %s min', v_d.slaap_min));

    perform kal_beweging_dag(v_sa, p_slaap_sec := 28800);
    select slaap_min into v_d from kal_dagen where gebruiker_id=v_a and datum=v_gist;
    v_uit := v_uit || jsonb_build_object('geval','slaap in seconden wordt minuten',
      'goed', v_d.slaap_min = 480, 'gezien', format('28800 sec -> %s min', v_d.slaap_min));

    v_ant := kal_beweging_dag(v_sa, p_slaap_min := 28800);
    select slaap_min into v_d from kal_dagen where gebruiker_id=v_a and datum=v_gist;
    v_uit := v_uit || jsonb_build_object('geval','onmogelijke slaap wordt geweigerd en gemeld',
      'goed', (v_ant->>'slaap_genegeerd')::boolean and v_d.slaap_min = 480,
      'gezien', format('genegeerd=%s, blijft %s min', v_ant->>'slaap_genegeerd', v_d.slaap_min));

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

-- Alleen via de SQL-editor of een beheerdersverbinding. De app heeft hier niets
-- te zoeken, en anon en authenticated al helemaal niet.
revoke all on function public.kal_proef_koppeling() from public, anon, authenticated;
