-- ===========================================================================
-- 52: JE GEGEVENS WEGHALEN
-- ===========================================================================
--
-- TOEGEPAST: nog niet. Dit bestand staat los van 48 tot en met 51 en kan in
-- elke volgorde. Draai daarna `node gereedschap/md5-verslag.mjs --schrijf`.
--
-- De privacyverklaring belooft dat je je gegevens kunt laten verwijderen. Tot
-- dit bestand was dat een belofte die met de hand moest worden waargemaakt: de
-- beheerder zou in de SQL-editor tabel voor tabel moeten langslopen, en één
-- vergeten tabel maakt de belofte stilletjes onwaar.
--
-- ===========================================================================
-- WAAROM DE LIJST TABELLEN NIET IN DIT BESTAND STAAT
-- ===========================================================================
--
-- Dat was de eerste opzet en hij deugt niet. Een lijst die ik hier intik is een
-- momentopname: wie morgen een tabel toevoegt met gegevens van een gebruiker,
-- voegt hem niet toe aan deze functie, en dan blijft er iets staan terwijl de
-- app zegt dat alles weg is. Dat is erger dan geen knop, want nu staat er een
-- belofte tegenover.
--
-- De functie zoekt de tabellen dus zelf op: elke tabel in `public` die een
-- kolom `gebruiker_id` heeft, hoort bij een gebruiker en gaat leeg. Een nieuwe
-- tabel met dat patroon doet vanzelf mee. Twee tabellen wijken af en staan
-- daarom apart genoemd:
--
--   `kal_gebruikers`      hangt aan `id` en niet aan `gebruiker_id`, en gaat
--                         als laatste, want alles verwijst ernaar.
--   `kal_aanmeld_poging`  hangt aan de accountnaam en niet aan een id. Die
--                         rijen zijn de rem op het raden van wachtwoorden, en
--                         ze verlopen vanzelf binnen een uur.
--
-- Wat er niet meegaat is de vault: de eigen AI-sleutel wordt apart weggegooid,
-- want die staat in `vault.secrets` en niet in `public`. Zie bestand 49.
--
-- ===========================================================================
-- WAAROM HIJ STANDAARD NIETS DOET
-- ===========================================================================
--
-- Verwijderen is onomkeerbaar en er is geen prullenbak. Een functie die dat
-- doet zodra je hem aanroept, is een functie die het een keer doet terwijl je
-- alleen wilde kijken.
--
-- Dus: `p_echt` staat standaard op `false` en dan telt hij alleen. Je krijgt
-- terug wat er zou verdwijnen, per tabel, met aantallen. Pas met `true` erbij
-- gebeurt het werkelijk, en dan krijg je dezelfde telling terug van wat er
-- weg is.
--
-- Het wachtwoord moet er ook bij, net als bij het wijzigen ervan. Een open
-- sessie op een telefoon die iemand anders even vasthoudt, is genoeg om op een
-- knop te tikken; hij is niet genoeg om een wachtwoord te weten.
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
  v_sleutel uuid;
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

  /* De eigen AI-sleutel staat in de vault en niet in public, dus die valt
     buiten de lus hierboven. Hem laten staan zou betekenen dat er een
     betaalsleutel achterblijft van iemand die zijn account heeft opgeheven. */
  select ai_sleutel_id into v_sleutel from kal_gebruikers where id = v_id;
  if v_sleutel is not null then
    v_uit := v_uit || jsonb_build_object('eigen_ai_sleutel', 1);
    v_totaal := v_totaal + 1;
    if p_echt then
      begin
        delete from vault.secrets where id = v_sleutel;
      exception when others then
        /* Staat bestand 49 nog niet in deze database, of mag deze rol niet bij
           de vault, dan hoort het account toch weg te kunnen. De melding gaat
           mee terug zodat het niet ongemerkt blijft liggen. */
        v_uit := v_uit || jsonb_build_object('sleutel_bleef_staan', sqlerrm);
      end;
    end if;
  end if;

  /* Als laatste de gebruiker zelf, want alles verwijst ernaar. */
  v_uit := v_uit || jsonb_build_object('kal_gebruikers', 1);
  v_totaal := v_totaal + 1;
  if p_echt then
    delete from kal_gebruikers where id = v_id;
  end if;

  return jsonb_build_object(
    'gewist', p_echt, 'account', v_account, 'totaal', v_totaal, 'per_tabel', v_uit);
end $function$;

-- ===========================================================================
-- EN DEZELFDE WEG VOOR DE BEHEERDER
-- ===========================================================================
--
-- Die is er, want de privacyverklaring zegt dat je het ook per bericht kunt
-- vragen. Iemand die zijn wachtwoord kwijt is en weg wil, kan de knop in de app
-- niet gebruiken.
--
-- Drie verschillen met de functie hierboven, en ze volgen alle drie uit
-- bestand 40: het gaat om de gegevens van een ander.
--
--   **Het wachtwoord van de beheerder moet erbij.** Niet dat van de tester, dat
--   heeft hij niet. Zijn eigen, zodat een openstaande sessie niet genoeg is.
--
--   **Het kan niet stil.** Elke wissing komt in `kal_herstel_log`, dezelfde
--   tabel waarin een uitgegeven herstelcode belandt. Die aantekening blijft
--   staan nadat de gegevens weg zijn, met de accountnaam erin, want een
--   verwijdering die zelf geen spoor achterlaat is niet na te gaan. Dat staat
--   ook in de privacyverklaring.
--
--   **En niet op jezelf.** Een beheerder die zichzelf wist via deze weg haalt
--   de laatste beheerder weg. Wil hij dat werkelijk, dan gebruikt hij de
--   gewone functie hierboven, met zijn eigen wachtwoord, net als iedereen.
-- ===========================================================================

create or replace function public.kal_tester_wissen(
  p_token text, p_ww text, p_account text, p_echt boolean DEFAULT false)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare
  v_id     uuid;
  v_naam   text;
  v_doel   uuid;
  v_tabel  text;
  v_aantal bigint;
  v_uit    jsonb := '{}'::jsonb;
  v_totaal bigint := 0;
begin
  v_id := kal_sessie(p_token);

  if not exists (select 1 from kal_gebruikers
                  where id = v_id and beheerder and ww_hash = crypt(p_ww, ww_hash)) then
    /* Dezelfde melding voor "je bent geen beheerder" en "je wachtwoord klopt
       niet", zoals in bestand 40. Het verschil zou verklappen wie beheerder is. */
    return jsonb_build_object('fout', 'Dat kan niet');
  end if;

  v_naam := lower(trim(p_account));
  select id into v_doel from kal_gebruikers where account = v_naam;
  if v_doel is null then
    return jsonb_build_object('fout', 'Dat account bestaat niet');
  end if;
  if v_doel = v_id then
    return jsonb_build_object('fout',
      'Je eigen account gaat via Account, met je eigen wachtwoord');
  end if;

  for v_tabel in
    select c.table_name from information_schema.columns c
     join information_schema.tables t
       on t.table_schema = c.table_schema and t.table_name = c.table_name
     where c.table_schema = 'public' and c.column_name = 'gebruiker_id'
       and t.table_type = 'BASE TABLE'
     order by c.table_name
  loop
    if p_echt then
      execute format('delete from public.%I where gebruiker_id = $1', v_tabel) using v_doel;
      get diagnostics v_aantal = row_count;
    else
      execute format('select count(*) from public.%I where gebruiker_id = $1', v_tabel)
        into v_aantal using v_doel;
    end if;
    if v_aantal > 0 then
      v_uit := v_uit || jsonb_build_object(v_tabel, v_aantal);
      v_totaal := v_totaal + v_aantal;
    end if;
  end loop;

  if p_echt then
    /* Het logboek vóór de rij zelf, want daarna is de gebruiker er niet meer.
       De accountnaam staat er los in en niet alleen het id, precies omdat dat
       id straks nergens meer heen verwijst.

       Deze aantekening blijft dus staan nadat alles weg is, en dat is met
       opzet: een verwijdering die zelf geen spoor achterlaat, is niet na te
       gaan. Dat het gebeurt staat in de privacyverklaring, want het betekent
       dat je accountnaam de wissing overleeft. */
    insert into kal_herstel_log(beheerder_id, doel_id, doel_account)
    values (v_id, v_doel, v_naam);
    delete from kal_gebruikers where id = v_doel;
  end if;
  v_uit := v_uit || jsonb_build_object('kal_gebruikers', 1);
  v_totaal := v_totaal + 1;

  return jsonb_build_object(
    'gewist', p_echt, 'account', v_naam, 'totaal', v_totaal, 'per_tabel', v_uit);
end $function$;

-- ===========================================================================
-- NAKIJKEN NA HET DRAAIEN
-- ===========================================================================
--
-- Kijk eerst, en wis daarna. Dat is de hele reden dat `p_echt` bestaat.
--
--   -- 1. Wat zou er van jou verdwijnen? Dit verandert niets.
--   select kal_account_wissen('<jouw token>', '<jouw wachtwoord>');
--
--   -- 2. En welke tabellen worden er eigenlijk langsgelopen? Deze lijst hoort
--   --    elke tabel te bevatten waar gegevens van een gebruiker in staan. Mist
--   --    er een, dan mist die tabel een kolom `gebruiker_id` en is dat het
--   --    probleem, niet deze functie.
--   select c.table_name from information_schema.columns c
--    join information_schema.tables t
--      on t.table_schema = c.table_schema and t.table_name = c.table_name
--    where c.table_schema = 'public' and c.column_name = 'gebruiker_id'
--      and t.table_type = 'BASE TABLE'
--    order by 1;
--
--   -- 3. Maak een proefaccount in de app, voer er een weging en een maaltijd
--   --    in, en wis hem dan werkelijk. Het totaal hoort te kloppen met wat
--   --    stap 1 voorspelde.
--   select kal_tester_wissen('<jouw token>', '<jouw wachtwoord>', 'proefnaam', true);
--
--   -- 4. En er staat niets meer.
--   select count(*) from kal_gebruikers where account = 'proefnaam';   -- 0
--   select * from kal_herstel_log order by moment desc limit 1;        -- de aantekening
--
-- Draai daarna `node gereedschap/md5-verslag.mjs --schrijf`.
-- ===========================================================================
