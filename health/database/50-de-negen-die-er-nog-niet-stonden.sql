-- ===========================================================================
-- 50: DE NEGEN DIE ER NOG NIET STONDEN
-- ===========================================================================
--
-- TOEGEPAST: dit bestand verandert niets. Het is een verslag van wat er al
-- draait, uitgelezen op 22 september 2026 met `uitlezen-tien.sql` en hier
-- woordgetrouw neergezet.
--
-- WAAROM DAT GEEN FORMALITEIT IS
--
-- De controle in `controle-md5.sql` vergelijkt wat er in de database staat met
-- wat er in deze map staat. Voor negen functies meldde hij "STAAT NIET IN DE
-- REPO", en dat is geen ontbrekend papiertje: het betekent dat niemand kon zien
-- wat die functies doen zonder de SQL-editor open te trekken.
--
-- Dat heeft deze week twee keer geld gekost aan omwegen. Bestand 48 vervangt
-- met opzet geen enkele bestaande functie, en de reden stond erbij: `kal_sessie`
-- was niet na te lezen, en een functie vervangen die je niet kunt nalezen is hem
-- overschrijven met een gok. Daardoor bleef de afwijzing van een tester een
-- scherm in plaats van een slot.
--
-- Nu ze er staan, kan dat alsnog. Dat gebeurt in bestand 51 en niet hier: dit
-- bestand beschrijft alleen wat er al was.
--
-- ===========================================================================
-- WAT ER METEEN UIT NAAR VOREN KWAM
-- ===========================================================================
--
-- **`kal_dag_zetten` wist een weging werkelijk.** Dat stond als vraag open sinds
-- het venster "Je wegingen" er kwam: als je daar op weghalen tikt, stuurt de app
-- `gewicht_kg: null`, en verdwijnt de weging dan echt of blijft hij staan?
--
-- Hij verdwijnt. De regel is
--
--     gewicht_kg = case when p_patch ? 'gewicht_kg'
--                       then nullif(p_patch->>'gewicht_kg','')::numeric
--                       else gewicht_kg end
--
-- en het scharnier is `?`. Die operator vraagt of de sleutel bestáát, niet of er
-- een waarde in zit. Bij `{"gewicht_kg": null}` bestaat de sleutel, geeft `->>`
-- een SQL-NULL terug, en komt er NULL in de kolom. Bij een patch die de sleutel
-- niet noemt blijft de oude waarde staan.
--
-- Dat is precies het gedrag dat het venster nodig heeft, en het is nu na te
-- lezen in plaats van aan te nemen. Aan de andere kant van de lijn had de
-- proefopstelling al vastgelegd dat de app werkelijk `gewicht_kg=null`
-- verstuurt; die twee samen maken de keten rond.
--
-- **En `fiets_min` kent geen leeg.** Daar staat `coalesce(..., 0)` in plaats van
-- de nullif alleen, dus een leeg veld wordt nul en niet onbekend. Voor dit ene
-- veld is dat te verdedigen (geen minuten is nul minuten), maar het wijkt af van
-- elk ander veld in dezelfde functie, waar leeg wél onbekend blijft. Het staat
-- hier zodat het een keuze is en geen verrassing.
--
-- ===========================================================================
-- WAT HIERONDER STAAT IS OVERGETIKT EN NIET BEDACHT
-- ===========================================================================
--
-- Elke functie hieronder is de tekst zoals `pg_proc` hem teruggaf. Er is niets
-- opgeruimd, niets hernoemd, geen commentaar toegevoegd binnen de functies. Dat
-- is het hele punt van een verslag: wijkt het af, dan is de verslaglegging fout
-- en niet de database.
--
-- Of de overname klopt is te toetsen zonder op mijn woord af te gaan. Draai
-- `node gereedschap/md5-verslag.mjs --schrijf` en plak daarna
-- `controle-md5.sql` in de editor. Staat er bij deze negen *gelijk*, dan is de
-- tekst tot op de spatie na hetzelfde.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.kal_afmelden(p_token text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin delete from kal_sessies where token = p_token; end $function$;


CREATE OR REPLACE FUNCTION public.kal_sessie(p_token text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare v_id uuid;
begin
  select gebruiker_id into v_id from kal_sessies
   where token = p_token and verloopt_op > now();
  if v_id is null then raise exception 'Sessie verlopen of onbekend'; end if;
  return v_id;
end $function$;


CREATE OR REPLACE FUNCTION public.kal_dag_zetten(p_token text, p_datum date, p_patch jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
  v_id := kal_sessie(p_token);
  insert into kal_dagen(gebruiker_id, datum) values (v_id, p_datum)
  on conflict (gebruiker_id, datum) do nothing;
  update kal_dagen set
    gewicht_kg           = case when p_patch ? 'gewicht_kg' then nullif(p_patch->>'gewicht_kg','')::numeric else gewicht_kg end,
    gewicht_bron         = coalesce(p_patch->>'gewicht_bron', gewicht_bron),
    stappen              = case when p_patch ? 'stappen' then nullif(p_patch->>'stappen','')::integer else stappen end,
    actieve_energie_kcal = case when p_patch ? 'actieve_energie_kcal' then nullif(p_patch->>'actieve_energie_kcal','')::integer else actieve_energie_kcal end,
    fiets_min            = case when p_patch ? 'fiets_min' then coalesce(nullif(p_patch->>'fiets_min','')::integer,0) else fiets_min end,
    slaap_min            = case when p_patch ? 'slaap_min' then nullif(p_patch->>'slaap_min','')::integer else slaap_min end,
    slaap_kwaliteit      = case when p_patch ? 'slaap_kwaliteit' then nullif(p_patch->>'slaap_kwaliteit','')::smallint else slaap_kwaliteit end,
    bedtijd              = case when p_patch ? 'bedtijd' then nullif(p_patch->>'bedtijd','')::time else bedtijd end,
    waaktijd             = case when p_patch ? 'waaktijd' then nullif(p_patch->>'waaktijd','')::time else waaktijd end,
    kracht               = case when p_patch ? 'kracht' then (p_patch->>'kracht')::boolean else kracht end,
    notitie              = case when p_patch ? 'notitie' then p_patch->>'notitie' else notitie end,
    bron                 = coalesce(p_patch->>'bron', bron),
    updated_at           = now()
  where gebruiker_id = v_id and datum = p_datum;
  return (select to_jsonb(d) from kal_dagen d where d.gebruiker_id = v_id and d.datum = p_datum);
end $function$;


CREATE OR REPLACE FUNCTION public.kal_profiel_zetten(p_token text, p_patch jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
  v_id := kal_sessie(p_token);
  insert into kal_profiel(gebruiker_id, lengte_cm) values (v_id, coalesce((p_patch->>'lengte_cm')::numeric, 170))
  on conflict (gebruiker_id) do nothing;
  update kal_profiel set
    lengte_cm         = coalesce((p_patch->>'lengte_cm')::numeric, lengte_cm),
    geboortedatum     = coalesce((p_patch->>'geboortedatum')::date, geboortedatum),
    leeftijd_jaar     = coalesce((p_patch->>'leeftijd_jaar')::integer, leeftijd_jaar),
    geslacht          = coalesce(p_patch->>'geslacht', geslacht),
    start_gewicht_kg  = coalesce((p_patch->>'start_gewicht_kg')::numeric, start_gewicht_kg),
    doel_gewicht_kg   = coalesce((p_patch->>'doel_gewicht_kg')::numeric, doel_gewicht_kg),
    tempo_pct_week    = coalesce((p_patch->>'tempo_pct_week')::numeric, tempo_pct_week),
    eiwit_g_per_kg    = coalesce((p_patch->>'eiwit_g_per_kg')::numeric, eiwit_g_per_kg),
    etniciteit        = coalesce(p_patch->>'etniciteit', etniciteit),
    fase              = coalesce(p_patch->>'fase', fase),
    onderhoud_basis_kg= coalesce((p_patch->>'onderhoud_basis_kg')::numeric, onderhoud_basis_kg),
    instellingen      = coalesce(p_patch->'instellingen', instellingen),
    updated_at        = now()
  where gebruiker_id = v_id;
  return (select to_jsonb(p) from kal_profiel p where p.gebruiker_id = v_id);
end $function$;


CREATE OR REPLACE FUNCTION public.kal_regel_wissen(p_token text, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid;
begin
  v_id := kal_sessie(p_token);
  delete from kal_regels where id = p_id and gebruiker_id = v_id;
end $function$;


CREATE OR REPLACE FUNCTION public.kal_regels_toevoegen(p_token text, p_regels jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_id uuid; v_r jsonb; v_uit jsonb := '[]'::jsonb; v_new kal_regels;
begin
  v_id := kal_sessie(p_token);
  for v_r in select * from jsonb_array_elements(p_regels) loop
    insert into kal_regels(gebruiker_id, datum, moment, naam, hoeveelheid, eenheid, gram_equivalent,
      kcal_punt, kcal_laag, kcal_hoog, eiwit_g, vet_g, koolhydraat_g, vezel_g,
      conf, onzekerheidsbronnen, bron, nevo_code, dish_id, recept_id, foto_pad, ruwe_invoer, ai_model)
    values (v_id, (v_r->>'datum')::date, coalesce(v_r->>'moment','onbekend'), v_r->>'naam',
      nullif(v_r->>'hoeveelheid','')::numeric, v_r->>'eenheid', nullif(v_r->>'gram_equivalent','')::numeric,
      (v_r->>'kcal_punt')::numeric, nullif(v_r->>'kcal_laag','')::numeric, nullif(v_r->>'kcal_hoog','')::numeric,
      nullif(v_r->>'eiwit_g','')::numeric, nullif(v_r->>'vet_g','')::numeric,
      nullif(v_r->>'koolhydraat_g','')::numeric, nullif(v_r->>'vezel_g','')::numeric,
      coalesce(v_r->>'conf','D'),
      case when v_r ? 'onzekerheidsbronnen'
           then array(select jsonb_array_elements_text(v_r->'onzekerheidsbronnen')) else null end,
      coalesce(v_r->>'bron','handmatig'), v_r->>'nevo_code', nullif(v_r->>'dish_id','')::uuid,
      nullif(v_r->>'recept_id','')::uuid, v_r->>'foto_pad', v_r->>'ruwe_invoer', v_r->>'ai_model')
    returning * into v_new;
    v_uit := v_uit || to_jsonb(v_new);
  end loop;
  return v_uit;
end $function$;


CREATE OR REPLACE FUNCTION public.kal_dagstand(p_gebruiker uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_vandaag date := (now() at time zone 'Europe/Amsterdam')::date;
  v_start   date := v_vandaag - 27;
  v_gewogen boolean;
  v_wegingen integer;
  v_bruikbaar integer;
  v_laatste date;
  v_gaten integer;
  v_gewicht numeric;
begin
  select exists(select 1 from kal_dagen
                 where gebruiker_id = p_gebruiker and datum = v_vandaag and gewicht_kg is not null)
    into v_gewogen;

  select count(*) into v_wegingen from kal_dagen
   where gebruiker_id = p_gebruiker and datum between v_start and v_vandaag and gewicht_kg is not null;

  select max(datum), max(gewicht_kg) filter (where datum = (select max(datum) from kal_dagen d2
        where d2.gebruiker_id = p_gebruiker and d2.gewicht_kg is not null))
    into v_laatste, v_gewicht
    from kal_dagen where gebruiker_id = p_gebruiker and gewicht_kg is not null;

  -- Bruikbare registratiedagen: boven 1.200 kcal en niet de lopende dag.
  select count(*) into v_bruikbaar from (
    select datum, sum(kcal_punt) as kcal from kal_regels
     where gebruiker_id = p_gebruiker and datum between v_start and v_vandaag - 1
     group by datum having sum(kcal_punt) >= 1200) t;

  -- Gaten in de afgelopen zeven dagen, de lopende dag niet meegeteld.
  select count(*) into v_gaten from generate_series(v_vandaag - 7, v_vandaag - 1, '1 day') g(d)
   where not exists (select 1 from kal_regels r
                      where r.gebruiker_id = p_gebruiker and r.datum = g.d);

  return jsonb_build_object(
    'datum', v_vandaag,
    'gewogen_vandaag', v_gewogen,
    'wegingen_28', v_wegingen,
    'bruikbare_dagen_28', v_bruikbaar,
    'laatste_weging', v_laatste,
    'laatste_gewicht', v_gewicht,
    'dagen_zonder_weging', case when v_laatste is null then null else v_vandaag - v_laatste end,
    'gaten_7', v_gaten,
    'model_klaar', (v_wegingen >= 7 and v_bruikbaar >= 7),
    'wegingen_te_gaan', greatest(0, 7 - v_wegingen),
    'dagen_te_gaan', greatest(0, 7 - v_bruikbaar)
  );
end $function$;


CREATE OR REPLACE FUNCTION public.kal_weekcijfers(p_gebruiker uuid, p_venster integer DEFAULT 28)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_eind date := (now() at time zone 'Europe/Amsterdam')::date;
  v_start date := v_eind - (p_venster - 1);
  n integer; helling numeric; sxx numeric; syy numeric; se numeric;
  gem_inname numeric; sd_inname numeric; n_inname integer;
  gewicht numeric; lengte numeric; leeftijd integer; geslacht text;
  tempo numeric; eiwit_kg numeric; doelgew numeric;
  rust integer; pal_l numeric := 1.35; pal_h numeric;
  gem_stappen numeric; tdee numeric; half numeric; doel integer;
  eiwit_ref numeric; gem_eiwit numeric; gemarkeerd integer; gaten integer;
begin
  select count(*), regr_slope(gewicht_kg, extract(epoch from datum)/86400),
         regr_sxx(gewicht_kg, extract(epoch from datum)/86400),
         regr_syy(gewicht_kg, extract(epoch from datum)/86400)
    into n, helling, sxx, syy
    from kal_dagen where gebruiker_id = p_gebruiker
      and datum between v_start and v_eind and gewicht_kg is not null;

  if n >= 3 and sxx > 0 then
    se := sqrt(greatest(0, (syy - helling*helling*sxx)) / (greatest(1, n-2) * sxx));
  end if;

  select p.lengte_cm, p.leeftijd_jaar, p.geslacht, p.tempo_pct_week, p.eiwit_g_per_kg, p.doel_gewicht_kg
    into lengte, leeftijd, geslacht, tempo, eiwit_kg, doelgew
    from kal_profiel p where p.gebruiker_id = p_gebruiker;

  select d.gewicht_kg into gewicht from kal_dagen d
   where d.gebruiker_id = p_gebruiker and d.gewicht_kg is not null
   order by d.datum desc limit 1;

  with dag as (
    select datum, sum(kcal_punt) as kcal, sum(eiwit_g) as eiwit
      from kal_regels where gebruiker_id = p_gebruiker
       and datum between v_start and v_eind - 1
     group by datum)
  select avg(kcal) filter (where kcal >= 1200), stddev_samp(kcal) filter (where kcal >= 1200),
         count(*) filter (where kcal >= 1200), count(*) filter (where kcal < 1200),
         avg(eiwit)
    into gem_inname, sd_inname, n_inname, gemarkeerd, gem_eiwit from dag;

  select avg(stappen) into gem_stappen from kal_dagen
   where gebruiker_id = p_gebruiker and datum between v_start and v_eind and stappen is not null;

  select count(*) into gaten from generate_series(v_eind - 7, v_eind - 1, '1 day') g(d)
   where not exists (select 1 from kal_regels r where r.gebruiker_id = p_gebruiker and r.datum = g.d);

  gewicht := coalesce(gewicht, 0);
  if lengte is null or gewicht = 0 then return jsonb_build_object('bruikbaar', false, 'reden', 'profiel of gewicht ontbreekt'); end if;

  rust := round(10*gewicht + 6.25*lengte - 5*leeftijd + case when geslacht='m' then 5 else -161 end);
  pal_h := case when gem_stappen is null then 1.60 else least(1.70, 1.40 + gem_stappen/22000) end;
  eiwit_ref := least(gewicht, 30*(lengte/100)*(lengte/100));

  if n >= 7 and n_inname >= 7 and helling is not null then
    tdee := gem_inname - helling*7700;
    half := greatest(100, 1.96*sqrt(power(coalesce(se,0.05)*7700,2)
            + power(coalesce(sd_inname,150)/sqrt(n_inname),2)));
    doel := greatest(rust, round((tdee - (tempo/100)*gewicht*7700/7)/10)*10);
  end if;

  return jsonb_build_object(
    'bruikbaar', true, 'venster', p_venster, 'tot', v_eind,
    'gewicht', gewicht, 'doel_gewicht', doelgew, 'bmi', round(gewicht/((lengte/100)*(lengte/100)), 1),
    'wegingen', n, 'helling_kg_week', round(coalesce(helling,0)*7, 3),
    'helling_pct_week', case when gewicht>0 then round(coalesce(helling,0)*7/gewicht*100, 3) end,
    'se_helling', round(coalesce(se,0), 4),
    'gem_inname', round(coalesce(gem_inname,0)), 'sd_inname', round(coalesce(sd_inname,0)),
    'bruikbare_dagen', coalesce(n_inname,0), 'dagen_onder_1200', coalesce(gemarkeerd,0),
    'gaten_laatste_7', gaten,
    'gem_eiwit', round(coalesce(gem_eiwit,0)), 'eiwit_doel', round(eiwit_kg*eiwit_ref),
    'eiwit_referentiegewicht', round(eiwit_ref,1),
    'gem_stappen', round(coalesce(gem_stappen,0)),
    'rust_bmr', rust, 'prior_laag', round(rust*pal_l), 'prior_hoog', round(rust*pal_h),
    'tdee', case when tdee is not null then round(tdee) end,
    'tdee_laag', case when tdee is not null then round(tdee-half) end,
    'tdee_hoog', case when tdee is not null then round(tdee+half) end,
    'doel_kcal', doel,
    'te_snel', (helling is not null and gewicht>0 and helling*7/gewicht*100 < -1.0)
  );
end $function$;


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
        v_ond := 'Kalibratie — de weegreeks staat stil';
        v_tekst := 'Er is ' || coalesce((v_st->>'dagen_zonder_weging')::text, 'lang') ||
          ' dagen niet gewogen. Zonder die reeks rekent het model niets uit: het is de enige invoer ' ||
          'die niet te schatten valt, en het enige onbevooroordeelde signaal in het systeem. ' ||
          'Eén weging vanochtend zet hem weer in beweging.';
      else
        v_ond := 'Kalibratie — nog niet gewogen vanochtend';
        v_tekst := case when (v_st->>'model_klaar')::boolean
          then 'Nuchter, na het toilet, vóór het eten. De reeks loopt; één ontbrekende dag verbreedt het interval meer dan een onnauwkeurige schatting dat doet.'
          else 'Nuchter, na het toilet, vóór het eten. Nog ' || (v_st->>'wegingen_te_gaan') ||
               ' weging(en) en ' || (v_st->>'dagen_te_gaan') || ' registratiedag(en) voordat het model een verbruik met interval kan tonen.'
          end;
      end if;
    else
      v_ond := 'Kalibratie — gaten in de registratie';
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
-- NAKIJKEN
-- ===========================================================================
--
--   node gereedschap/md5-verslag.mjs --schrijf
--
-- en dan `controle-md5.sql` in de editor. Alle vijfenvijftig horen *gelijk* te
-- melden, op de vier van bestand 48 en 49 na zolang die nog niet gedraaid zijn:
-- die staan dan op *STAAT NIET IN DE DATABASE*, en dat is geen fout maar een
-- opdracht.
-- ===========================================================================
