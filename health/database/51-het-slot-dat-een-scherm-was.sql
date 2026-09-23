-- ===========================================================================
-- 51: HET SLOT DAT EEN SCHERM WAS
-- ===========================================================================
--
-- TOEGEPAST: nog niet. Draai 48 en 49 eerst. En daarna
-- `node gereedschap/md5-verslag.mjs --schrijf`.
--
-- Bestand 48 zette een wachtkamer neer en schreef er meteen een voorbehoud bij:
--
--     "De afwijzing is géén slot. Wie is afgewezen krijgt in de app een scherm
--      te zien in plaats van de app, en dat scherm is precies dat: een scherm."
--
-- De reden stond erbij en was geen keuze: `kal_sessie` stond niet in deze repo,
-- en een functie vervangen die je niet kunt nalezen is hem overschrijven met een
-- gok. Sinds bestand 50 staat hij er. Dit bestand maakt het af.
--
-- ===========================================================================
-- WAAROM DE GRENS NIET IN `kal_sessie` KOMT
-- ===========================================================================
--
-- Dat was het plan en het is het niet geworden, en de reden is het opschrijven
-- waard.
--
-- `kal_sessie` staat op het pad van élke aanroep. Een afgewezen account daar
-- laten stuklopen werkt, maar de app leest een 4xx op een sessiecontrole als een
-- afmelding: zo staat het in `toestand.ts` en dat is daar terecht. De gebruiker
-- vliegt er dan uit zonder te horen waarom, meldt zich opnieuw aan (want
-- `kal_aanmelden` kent zijn status niet), en vliegt er weer uit. Dat is geen
-- slot maar een draaideur.
--
-- Bovendien roept `kal_mijn_toegang` zelf `kal_sessie` aan. Precies de functie
-- die zou moeten uitleggen wat er aan de hand is, zou dan als eerste omvallen.
--
-- Twee kleinere ingrepen doen hetzelfde werk zonder die twee gevolgen:
--
--   1. `kal_aanmelden` geeft een afgewezen account geen token meer. Hij geeft
--      `{fout}` terug, net als bij een verkeerd wachtwoord, en het aanmeldscherm
--      toont die zin al. Geen draaideur: je komt er niet in en je leest waarom.
--
--   2. `kal_tester_zetten` gooit bij een afwijzing de lopende sessies weg. Wie
--      op dat moment openstaat, is bij zijn eerstvolgende handeling afgemeld.
--      Zonder deze regel zou een afwijzing pas werken als de sessie verloopt, en
--      dat is dertig dagen.
--
-- Samen: binnen één handeling eruit, en er niet meer in. Het pad van elke
-- aanroep blijft ongemoeid.
--
-- WAT ER DAN NOG OVERBLIJFT, EN DAT HOORT ER OOK TE STAAN
--
-- Wie op het moment van afwijzen zijn token heeft opgeschreven en de RPC's
-- rechtstreeks aanroept, komt er niet meer in: de sessie is weg. Wie een nieuwe
-- wil, moet langs `kal_aanmelden`. Dat is een slot.
--
-- Het is geen slot tegen iemand die vóór de afwijzing gegevens heeft gekopieerd.
-- Dat kan geen enkel slot, en het zijn zijn eigen gegevens.
--
-- ===========================================================================
-- EN DRIE GEDACHTESTREEPJES DIE IN ELKE E-MAIL STONDEN
-- ===========================================================================
--
-- Hoofdstuk 26 van VERANTWOORDING.md verbiedt het gedachtestreepje in
-- schermtekst, en `CLAUDE.md` zegt erbij waar dat geldt: niet in de apps, niet
-- in de edge-functies, niet in de handleidingen.
--
-- `kal_prikkel_bouwen` draait in de database en schrijft de onderwerpsregel van
-- elke prikkelmail. Daar stond het drie keer, telkens tussen "Kalibratie" en
-- wat erachter komt: bij de weegreeks die stilstaat, bij nog niet gewogen
-- vanochtend, en bij gaten in de registratie. (Hier met opzet omschreven en niet
-- overgetikt; het teken zelf staat in bestand 50, waar het thuishoort.)
--
-- Dat is geen codecommentaar maar de eerste regel die een mens in zijn inbox
-- leest. Precies de tekst waar de regel over gaat.
--
-- Het worden dubbele punten. Verder verandert er aan die functie niets: dit is
-- een leesteken en geen gedrag.
--
-- WAT IK HIER EERST FOUT OVER SCHREEF
--
-- In de eerste versie van dit bestand stond dat de proef die dit bewaakt alleen
-- `src/` leest, en dat de database daarom een blinde vlek was. Dat klopte niet.
-- `src/gedeeld/schermtekst.proef.ts` heeft twee blokken: het eerste ontleedt de
-- bestanden in `src/` met de parser van TypeScript, en het tweede loopt met
-- `git grep` de héle repo af, deze map inbegrepen. Ik had alleen het eerste
-- gelezen.
--
-- Die proef viel dan ook meteen om op bestand 50 en op dit bestand, en dat was
-- precies goed: de blinde vlek zat bij mij en niet in de bewaking.
--
-- Wat er wél aan de hand was, blijft staan: het teken stond in de database en
-- niemand had het gezien, omdat die functie tot bestand 50 nergens in deze repo
-- stond. Niet de proef schoot tekort maar het verslag.
--
-- WAAROM BESTAND 50 NU EEN UITZONDERING IS
--
-- Omdat het bewijsmateriaal is. Het legt vast wat er op 22 september in de
-- database stond, inclusief deze drie streepjes, en dat moet tot op het teken
-- kloppen: de md5-controle vergelijkt het met `prosrc`. Een verslag dat het
-- teken weglaat om een proef groen te krijgen, liegt over wat het aantrof.
--
-- Dat is dezelfde regel als bij `gereedschap/oud/`, en om dezelfde reden. Dít
-- bestand hoeft die uitzondering niet, want het is geen verslag maar een
-- wijziging, en het noemt het teken hierboven zonder het te zetten.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.kal_aanmelden(p_account text, p_ww text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_id      uuid;
  v_token   text;
  v_account text;
  v_mis     integer;
  v_status  text;
begin
  v_account := lower(trim(coalesce(p_account, '')));

  /* Opruimen bij elke aanmelding, zodat de tabel niet groeit. Een uur is ruim
     vier keer het venster van een kwartier. */
  delete from kal_aanmeld_poging where moment < now() - interval '1 hour';

  select count(*) into v_mis
    from kal_aanmeld_poging
   where account = v_account
     and moment > now() - interval '15 minutes';

  if v_mis >= 10 then
    /* Geen token, en met opzet dezelfde soort antwoord als bij een verkeerd
       wachtwoord: wie de rem voelt weet daarmee nog steeds niet of het account
       bestaat. */
    return jsonb_build_object('fout',
      'Te veel mislukte pogingen. Probeer het over een kwartier opnieuw.');
  end if;

  select id, status into v_id, v_status
    from kal_gebruikers
   where account = v_account
     and ww_hash = crypt(p_ww, ww_hash);

  if v_id is null then
    insert into kal_aanmeld_poging(account) values (v_account);
    /* Eén boodschap voor "bestaat niet" en voor "verkeerd wachtwoord", zoals
       het hiervoor ook was. Het verschil zou verklappen welke accounts er zijn. */
    return jsonb_build_object('fout', 'Onbekend account of verkeerd wachtwoord');
  end if;

  /* Afgewezen betekent: er komt geen token meer. Dit staat ná de
     wachtwoordcontrole en niet ervoor, en dat is met opzet: wie een verkeerd
     wachtwoord intikt hoort niet te leren dat dit account bestaat en afgewezen
     is. Die volgorde kost een bcrypt-vergelijking en houdt de mededeling bij
     degene die hem aangaat.

     De teller gaat hier níet omhoog. Dit is geen mislukte poging maar een
     geslaagde aanmelding op een account dat niet meer meedoet; wie hem laat
     meetellen, zet een rem op iemand die niets fout doet. */
  if v_status = 'afgewezen' then
    return jsonb_build_object('fout',
      'Dit account is niet toegelaten tot de test. Neem contact op met de beheerder.');
  end if;

  /* Gelukt: de teller van dit account gaat leeg. Wie zijn wachtwoord na negen
     pogingen alsnog goed heeft, begint morgen weer bij nul. */
  delete from kal_aanmeld_poging where account = v_account;

  delete from kal_sessies where verloopt_op < now();
  v_token := encode(gen_random_bytes(32), 'hex');
  insert into kal_sessies(token, gebruiker_id, verloopt_op)
  values (v_token, v_id, now() + interval '30 days');

  return jsonb_build_object('token', v_token, 'account', v_account);
end $function$;


-- En de tweede helft: een afwijzing werkt meteen en niet over dertig dagen.
CREATE OR REPLACE FUNCTION public.kal_tester_zetten(
  p_token text, p_account text, p_status text DEFAULT NULL::text,
  p_budget integer DEFAULT NULL::integer, p_notitie text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_id uuid; v_doel uuid; v_naam text;
begin
  v_id := kal_sessie(p_token);
  if not exists (select 1 from kal_gebruikers where id = v_id and beheerder) then
    return jsonb_build_object('fout', 'Dat kan niet');
  end if;

  v_naam := lower(trim(p_account));
  select id into v_doel from kal_gebruikers where account = v_naam;
  if v_doel is null then
    return jsonb_build_object('fout', 'Dat account bestaat niet');
  end if;

  if p_status is not null and p_status not in ('wacht', 'toegelaten', 'afgewezen') then
    return jsonb_build_object('fout', 'Onbekende status');
  end if;
  if p_budget is not null and (p_budget < 0 or p_budget > 100000) then
    return jsonb_build_object('fout', 'Een budget ligt tussen 0 en 100.000 aanroepen');
  end if;

  if v_doel = v_id and p_status is not null and p_status <> 'toegelaten' then
    return jsonb_build_object('fout', 'Je kunt jezelf niet buitensluiten');
  end if;

  update kal_gebruikers
     set status          = coalesce(p_status, status),
         ai_budget_maand = coalesce(p_budget, ai_budget_maand),
         notitie         = coalesce(p_notitie, notitie),
         beoordeeld_op   = case when p_status is null then beoordeeld_op else now() end,
         beoordeeld_door = case when p_status is null then beoordeeld_door else v_id end
   where id = v_doel;

  /* Afwijzen zonder de lopende sessies weg te gooien werkt pas als die
     verlopen, en dat is dertig dagen. Dan is de afwijzing een mededeling en
     geen grens. */
  if p_status = 'afgewezen' then
    delete from kal_sessies where gebruiker_id = v_doel;
  end if;

  return jsonb_build_object('account', v_naam, 'status',
    (select status from kal_gebruikers where id = v_doel),
    'budget', (select ai_budget_maand from kal_gebruikers where id = v_doel));
end $function$;


-- En de drie streepjes. Alleen het leesteken; verder staat deze functie er
-- woordgetrouw zoals bestand 50 hem aantrof.
CREATE OR REPLACE FUNCTION public.kal_prikkel_bouwen(p_soort text DEFAULT 'dagelijks'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_aan text; v_mail text; v_url text; v_g record; v_st jsonb;
  v_vandaag date := (now() at time zone 'Europe/Amsterdam')::date;
  v_ond text; v_tekst text; v_knop text; v_uit jsonb := '[]'::jsonb;
begin
  select waarde into v_aan  from kal_config where sleutel = 'prikkel_aan';
  select waarde into v_mail from kal_config where sleutel = 'prikkel_email';
  select waarde into v_url  from kal_config where sleutel = 'app_url';
  if coalesce(v_aan,'ja') <> 'ja' or v_mail is null then return v_uit; end if;

  v_knop := case when coalesce(trim(v_url), '') = '' then ''
                 else '<p style="margin:0"><a href="' || v_url
                      || '" style="color:#3D5A57">Openen</a></p>' end;

  for v_g in select g.id, coalesce(g.weergavenaam, g.account) as naam
               from kal_gebruikers g join kal_profiel p on p.gebruiker_id = g.id loop

    if exists (select 1 from kal_prikkel_log
                where gebruiker_id = v_g.id and datum = v_vandaag and soort = p_soort) then
      continue;
    end if;

    v_st := kal_dagstand(v_g.id);

    /* Zwijgen wanneer er niets aan de hand is. Een bericht dat elke dag komt
       ongeacht de inhoud wordt binnen twee weken weggeklikt, en dan is het
       kanaal weg op het moment dat er wél iets te melden valt. */
    if (v_st->>'gewogen_vandaag')::boolean and (v_st->>'gaten_7')::integer <= 1 then
      continue;
    end if;

    if not (v_st->>'gewogen_vandaag')::boolean then
      if coalesce((v_st->>'dagen_zonder_weging')::integer, 999) >= 7 then
        v_ond := 'Kalibratie: de weegreeks staat stil';
        v_tekst := 'Er is ' || coalesce((v_st->>'dagen_zonder_weging')::text, 'lang') ||
          ' dagen niet gewogen. Zonder die reeks rekent het model niets uit: het is de enige invoer ' ||
          'die niet te schatten valt, en het enige onbevooroordeelde signaal in het systeem. ' ||
          'Eén weging vanochtend zet hem weer in beweging.';
      else
        v_ond := 'Kalibratie: nog niet gewogen vanochtend';
        v_tekst := case when (v_st->>'model_klaar')::boolean
          then 'Nuchter, na het toilet, vóór het eten. De reeks loopt; één ontbrekende dag verbreedt het interval meer dan een onnauwkeurige schatting dat doet.'
          else 'Nuchter, na het toilet, vóór het eten. Nog ' || (v_st->>'wegingen_te_gaan') ||
               ' weging(en) en ' || (v_st->>'dagen_te_gaan') || ' registratiedag(en) voordat het model een verbruik met interval kan tonen.'
          end;
      end if;
    else
      v_ond := 'Kalibratie: gaten in de registratie';
      v_tekst := (v_st->>'gaten_7') || ' van de afgelopen zeven dagen heeft geen registratie. ' ||
        'Een ruwe schatting is beter dan niets: een ontbrekende dag verbreedt het interval sneller ' ||
        'dan een onnauwkeurige waarde dat doet.';
    end if;

    v_uit := v_uit || jsonb_build_object(
      'gebruiker_id', v_g.id, 'soort', p_soort, 'to', v_mail, 'subject', v_ond, 'tekst', v_tekst,
      'html', '<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.6;color:#2A2E28;max-width:520px">'
        || '<p style="font-family:Georgia,serif;font-size:20px;margin:0 0 12px">Kalibratie</p>'
        || '<p style="margin:0 0 14px">' || v_tekst || '</p>'
        || '<p style="margin:0 0 14px;font-size:13px;color:#5E6159">'
        || (v_st->>'wegingen_28') || ' wegingen en ' || (v_st->>'bruikbare_dagen_28')
        || ' bruikbare registratiedagen in het venster van 28 dagen.'
        || case when (v_st->>'laatste_gewicht') is not null
                then ' Laatste weging: ' || replace((v_st->>'laatste_gewicht'), '.', ',') || ' kg op '
                     || to_char((v_st->>'laatste_weging')::date, 'DD-MM') || '.' else '' end
        || '</p>' || v_knop || '</div>');
  end loop;
  return v_uit;
end
$function$;

-- ===========================================================================
-- NAKIJKEN NA HET DRAAIEN
-- ===========================================================================
--
--   -- 1. Wijs jezelf niet af; dat weigert hij, en dat hoort zo.
--   select kal_tester_zetten('<jouw token>', '<jouw account>', 'afgewezen');
--
--   -- 2. Wijs een proefaccount af en kijk of zijn sessies weg zijn.
--   select kal_tester_zetten('<jouw token>', 'proefnaam', 'afgewezen');
--   select count(*) from kal_sessies s join kal_gebruikers g on g.id = s.gebruiker_id
--    where g.account = 'proefnaam';   -- hoort 0 te zijn
--
--   -- 3. En of hij er niet meer in komt.
--   select kal_aanmelden('proefnaam', '<zijn wachtwoord>');
--   -- hoort {"fout": "Dit account is niet toegelaten tot de test. ..."} te zijn
--
--   -- 4. Zet hem daarna terug, anders staat je proefaccount buiten.
--   select kal_tester_zetten('<jouw token>', 'proefnaam', 'toegelaten');
--
--   -- 5. En de onderwerpsregels dragen geen streepje meer.
--   select jsonb_array_elements(kal_prikkel_bouwen())->>'subject';
--
-- Draai daarna `node gereedschap/md5-verslag.mjs --schrijf`.
-- ===========================================================================
