-- ===========================================================================
-- 53: DE VERWIJDERKNOP DIE OP EEN KOLOM WACHTTE
-- ===========================================================================
--
-- TOEGEPAST: ja, op 24 september 2026, na 49. Nagekeken met
-- `controle-md5.sql`: `kal_account_wissen` komt nu uit dit bestand en staat
-- op *gelijk*.
--
-- ===========================================================================
-- WAT ER FOUT GING, EN WAAROM HET NIET OPVIEL
-- ===========================================================================
--
-- In de kop van bestand 52 staat: "Dit bestand staat los van 48 tot en met 51
-- en kan in elke volgorde." Dat was niet waar, en het is toegepast voordat
-- iemand het merkte.
--
-- `kal_account_wissen` doet dit:
--
--     select ai_sleutel_id into v_sleutel from kal_gebruikers where id = v_id;
--
-- Die kolom komt uit bestand 49. Is dat niet gedraaid, dan bestaat hij niet, en
-- dan valt de functie om met "column ai_sleutel_id does not exist" op het moment
-- dat iemand op verwijderen tikt.
--
-- WAAROM POSTGRES DAT NIET BIJ HET AANMAKEN ZEI
--
-- Omdat plpgsql zijn SQL pas opzoekt bij het uitvoeren. `create function`
-- controleert de vorm en niet of de kolommen bestaan. Een functie die naar een
-- tabel verwijst die er niet is, wordt netjes aangemaakt en gaat pas stuk bij
-- de eerste aanroep. Daar is niets aan te doen, en het is precies de reden dat
-- de nakijklijst onder elk bestand hier staat: de proef is de aanroep en niet
-- het aanmaken.
--
-- Deze fout is van mij en niet van Postgres. Ik schreef "in elke volgorde"
-- zonder na te gaan waar dat bestand van afhing, terwijl de afhankelijkheid
-- drie regels verderop in hetzelfde bestand stond.
--
-- ===========================================================================
-- EN WAAROM DE OPLOSSING KORTER IS DAN HET PROBLEEM
-- ===========================================================================
--
-- Bestand 49 is intussen van vorm veranderd. De eigen AI-sleutel staat niet
-- meer in de vault maar als versleutelde tekst in een kolom van
-- `kal_gebruikers`, en dat maakt dit hele blok overbodig: wie die rij verwijdert,
-- verwijdert de sleutel mee. Geen aparte stap, geen `vault.secrets`, geen
-- uitzondering die kan mislukken.
--
-- Wat eruit gaat is dus niet alleen de fout maar het hele stuk dat hem droeg.
-- De rest van de functie blijft woord voor woord zoals hij was.
-- ===========================================================================

create or replace function public.kal_account_wissen(
  p_token text, p_ww text, p_echt boolean DEFAULT false)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare
  v_id      uuid;
  v_account text;
  v_tabel   text;
  v_aantal  bigint;
  v_uit     jsonb := '{}'::jsonb;
  v_totaal  bigint := 0;
begin
  v_id := kal_sessie(p_token);

  /* Het wachtwoord opnieuw, en met dezelfde ene foutmelding als elders: wie
     hem verkeerd intikt hoort niet te leren of het account bestaat. */
  select account into v_account from kal_gebruikers
   where id = v_id and ww_hash = crypt(p_ww, ww_hash);
  if v_account is null then
    return jsonb_build_object('fout', 'Je wachtwoord klopt niet');
  end if;

  /* Elke tabel in public met een kolom gebruiker_id. Op naam gesorteerd, zodat
     de uitkomst leesbaar en herhaalbaar is en niet van de planner afhangt. */
  for v_tabel in
    select c.table_name from information_schema.columns c
     join information_schema.tables t
       on t.table_schema = c.table_schema and t.table_name = c.table_name
     where c.table_schema = 'public' and c.column_name = 'gebruiker_id'
       and t.table_type = 'BASE TABLE'
     order by c.table_name
  loop
    if p_echt then
      execute format('delete from public.%I where gebruiker_id = $1', v_tabel)
        using v_id;
      get diagnostics v_aantal = row_count;
    else
      execute format('select count(*) from public.%I where gebruiker_id = $1', v_tabel)
        into v_aantal using v_id;
    end if;
    if v_aantal > 0 then
      v_uit := v_uit || jsonb_build_object(v_tabel, v_aantal);
      v_totaal := v_totaal + v_aantal;
    end if;
  end loop;

  /* Als laatste de gebruiker zelf, want alles verwijst ernaar. Hier zat het
     blok dat de eigen AI-sleutel apart uit de vault haalde; die staat sinds
     bestand 49 als versleutelde tekst in deze rij en gaat dus vanzelf mee. */
  v_uit := v_uit || jsonb_build_object('kal_gebruikers', 1);
  v_totaal := v_totaal + 1;
  if p_echt then
    delete from kal_gebruikers where id = v_id;
  end if;

  return jsonb_build_object(
    'gewist', p_echt, 'account', v_account, 'totaal', v_totaal, 'per_tabel', v_uit);
end $function$;

-- ===========================================================================
-- NAKIJKEN NA HET DRAAIEN
-- ===========================================================================
--
--   -- 1. Dit hoort nu gewoon een tabel terug te geven en niet een fout.
--   --    Vóór dit bestand kwam hier "column ai_sleutel_id does not exist".
--   select kal_account_wissen('<jouw token>', '<jouw wachtwoord>');
--
--   -- 2. En de knop in de app doet hetzelfde. Tik op "Al je gegevens
--   --    weghalen", vul je wachtwoord in en druk op "Laat zien wat er
--   --    weggaat". Er hoort een lijst te komen en geen foutmelding.
--
-- Draai daarna `node gereedschap/md5-verslag.mjs --schrijf`.
-- ===========================================================================
