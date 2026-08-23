-- =============================================================================
-- DE COACH OP DE POST
--
-- Toegepast 23 augustus 2026.
--
-- Het scherm rekent al uit wat er nog in past en stelt voor wat dat kan vullen.
-- Dat helpt alleen als je kijkt. Een prikkel is het scherm dat naar jou toe komt
-- op het moment dat er nog iets aan te doen is.
--
-- ---------------------------------------------------------------------------
-- HET PROBLEEM DAT DIT BESTAND OPLOST, EN WAAROM DE OPLOSSING ZO RAAR OOGT
-- ---------------------------------------------------------------------------
--
-- Om te kunnen zeggen "je hebt nog 800 kcal" moet je het doel kennen. Dat doel
-- komt uit de rekenkern: een regressie over de weegreeks, gekruist met de
-- gelogde inname, met een interval eromheen. Die kern staat in TypeScript en is
-- daar met gouden waarden vastgelegd.
--
-- De verleiding is om hem hier in SQL na te bouwen. Dat is precies de fout die
-- deze app nergens anders maakt: twee implementaties van hetzelfde model lopen
-- uit elkaar, en dan is er geen manier meer om te weten welke van de twee de
-- waarheid is. Het model heeft één huis.
--
-- Dus draait het om: de app rékent en publiceert de uitkomst; de prikkel léést
-- die. `kal_modelstand` is een postbus, geen tweede model. Er staat bij wanneer
-- hij gevuld is, en dat veld is dragend — een doel van vorige week is geen doel
-- meer, en een prikkel die daarop stoelt zou een verzonnen getal versturen.
-- Staat er niets vers in de bus, dan zwijgt de coach. Dat is meteen de juiste
-- uitkomst om een tweede reden: als de app twee dagen niet open is geweest, is
-- de dagregistratie waarschijnlijk ook onvolledig, en dan klopt het tekort toch
-- niet.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- De postbus.
-- -----------------------------------------------------------------------------
create table if not exists public.kal_modelstand (
  gebruiker_id uuid primary key references public.kal_gebruikers(id) on delete cascade,
  doel_kcal    numeric,
  eiwit_doel_g numeric,
  tdee_laag    numeric,
  tdee_hoog    numeric,
  zekerheid    text,
  berekend_op  timestamptz not null default now()
);

alter table public.kal_modelstand enable row level security;

comment on table public.kal_modelstand is
  'Wat de rekenkern in de app het laatst uitrekende. Een postbus, geen tweede model.';

-- -----------------------------------------------------------------------------
-- De app legt zijn uitkomst neer. Eén rij per gebruiker; hij overschrijft
-- zichzelf, want alleen de laatste stand is interessant.
-- -----------------------------------------------------------------------------
create or replace function public.kal_modelstand_zetten(
  p_token        text,
  p_doel_kcal    numeric default null,
  p_eiwit_doel_g numeric default null,
  p_tdee_laag    numeric default null,
  p_tdee_hoog    numeric default null,
  p_zekerheid    text    default null
) returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare v_id uuid;
begin
  v_id := kal_sessie(p_token);

  insert into kal_modelstand(gebruiker_id, doel_kcal, eiwit_doel_g,
                             tdee_laag, tdee_hoog, zekerheid, berekend_op)
  values (v_id, p_doel_kcal, p_eiwit_doel_g, p_tdee_laag, p_tdee_hoog, p_zekerheid, now())
  on conflict (gebruiker_id) do update
    set doel_kcal = excluded.doel_kcal,
        eiwit_doel_g = excluded.eiwit_doel_g,
        tdee_laag = excluded.tdee_laag,
        tdee_hoog = excluded.tdee_hoog,
        zekerheid = excluded.zekerheid,
        berekend_op = now();
end $$;

revoke all on function public.kal_modelstand_zetten(text, numeric, numeric, numeric, numeric, text)
  from public;
grant execute on function public.kal_modelstand_zetten(text, numeric, numeric, numeric, numeric, text)
  to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Wat er nu nog in past, en wat dat kan vullen.
--
-- Dit is de SQL-tweelingbroer van `src/health/coach.ts`. Twee dingen zijn daar
-- bewezen en staan hier expres in dezelfde vorm: het tekort draagt zijn band
-- (at je aan de bovenkant van de schatting, dan hou je aan de ónderkant over),
-- en de rangschikking gaat op eiwit per kcal en niet op absoluut eiwit — anders
-- staat het zwaarste gerecht bovenaan en eet je je hele resterende ruimte op.
--
-- Waarom er tóch twee zijn: het scherm moet reageren terwijl je typt, zonder
-- een reis naar de server; de prikkel draait als er niemand kijkt. Wat ze delen
-- zijn de regels, en die staan in beide bestanden uitgeschreven met een verwijzing
-- naar elkaar. Een gedeelde kopie zou hier een edge function tussen het scherm
-- en zijn eigen rekenwerk zetten, en dat is een slechtere ruil.
-- -----------------------------------------------------------------------------
create or replace function public.kal_coach_stand(p_gebruiker uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public', 'extensions'
as $$
declare
  v_vandaag   date := (now() at time zone 'Europe/Amsterdam')::date;
  v_m         record;
  v_d         record;
  v_over      numeric;
  v_eiwit_over numeric;
  v_eis       numeric;
  v_voorstellen jsonb;
begin
  select * into v_m from kal_modelstand where gebruiker_id = p_gebruiker;

  /* Geen verse stand, geen uitspraak. Achtenveertig uur is ruim: de app wordt
     dagelijks geopend om te wegen, dus twee dagen stilte betekent dat er iets
     anders aan de hand is dan een vergeten prikkel. */
  if v_m.gebruiker_id is null or v_m.doel_kcal is null
     or v_m.berekend_op < now() - interval '48 hours' then
    return jsonb_build_object('bruikbaar', false, 'reden', 'geen verse modelstand');
  end if;

  select coalesce(sum(kcal_punt), 0) as kcal,
         coalesce(sum(kcal_laag), 0)  as laag,
         coalesce(sum(kcal_hoog), 0)  as hoog,
         coalesce(sum(eiwit_g), 0)    as eiwit
    into v_d
    from kal_regels where gebruiker_id = p_gebruiker and datum = v_vandaag;

  v_over       := v_m.doel_kcal - v_d.kcal;
  v_eiwit_over := greatest(0, coalesce(v_m.eiwit_doel_g, 0) - v_d.eiwit);
  v_eis        := case when v_eiwit_over > 0 and v_over > 0 then v_eiwit_over / v_over end;

  /* De voorstellen: wat je de afgelopen zestig dagen at, samengevat per naam,
     dat binnen de resterende ruimte past. De laatste portie telt, want die neem
     je over — niet een gemiddelde van iets wat je nooit zo gegeten hebt.

     Importregels vallen af, en dat is niet cosmetisch. Tegen het echte logboek
     stelde deze functie "Dagtotaal uit Yazio" voor: 1.319 kcal, 76 gram eiwit,
     zeventien keer voorgekomen. Dat is geen gerecht maar een hele dag, en als
     suggestie is het onzin. Dezelfde uitsluiting staat in `herhalingen` in
     herhaal.ts, waar hij dezelfde lijst voedde. */
  with laatste as (
    select distinct on (lower(btrim(regexp_replace(naam, '\s+', ' ', 'g'))))
           lower(btrim(regexp_replace(naam, '\s+', ' ', 'g'))) as sleutel,
           naam, kcal_punt, eiwit_g, datum
      from kal_regels
     where gebruiker_id = p_gebruiker
       and datum between v_vandaag - 60 and v_vandaag - 1
       and kcal_punt > 0
       and bron <> 'import'
     order by 1, datum desc
  ), geteld as (
    select l.*, (select count(*) from kal_regels r
                  where r.gebruiker_id = p_gebruiker
                    and lower(btrim(regexp_replace(r.naam, '\s+', ' ', 'g'))) = l.sleutel
                    and r.datum between v_vandaag - 60 and v_vandaag - 1
                    and r.bron <> 'import') as aantal
      from laatste l
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'naam', naam, 'kcal', round(kcal_punt), 'eiwit', round(eiwit_g),
           'dichtheid', round(eiwit_g / kcal_punt, 4), 'aantal', aantal,
           'haalt_eis', v_eis is not null and eiwit_g / kcal_punt >= v_eis
         ) order by (v_eis is not null and eiwit_g / kcal_punt >= v_eis) desc,
                    eiwit_g / kcal_punt desc), '[]'::jsonb)
    into v_voorstellen
    from (select * from geteld
           where v_over > 0 and kcal_punt <= v_over and aantal >= 2
           order by (v_eis is not null and eiwit_g / kcal_punt >= v_eis) desc,
                    eiwit_g / kcal_punt desc
           limit 3) t;

  return jsonb_build_object(
    'bruikbaar', true,
    'datum', v_vandaag,
    'gelogd', round(v_d.kcal),
    'doel', round(v_m.doel_kcal),
    'kcal_over', round(v_over),
    'kcal_over_laag', round(v_m.doel_kcal - v_d.hoog),
    'kcal_over_hoog', round(v_m.doel_kcal - v_d.laag),
    'eiwit_gelogd', round(v_d.eiwit),
    'eiwit_doel', round(coalesce(v_m.eiwit_doel_g, 0)),
    'eiwit_over', round(v_eiwit_over),
    'eis_per_100', case when v_eis is not null then round(v_eis * 100, 1) end,
    'erover', v_over < 0,
    'voorstellen', v_voorstellen);
end $$;

revoke all on function public.kal_coach_stand(uuid) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Het bericht. Zelfde vorm als `kal_prikkel_bouwen`, zodat de edge function er
-- niets nieuws voor hoeft te leren: een lijst met to, subject, tekst en html.
--
-- De soort draagt het tijdvak — 'coach-12', 'coach-15', 'coach-18' — zodat de
-- ontdubbeling per dag én per moment werkt. Zonder dat zou de eerste prikkel van
-- de dag de rest van de dag blokkeren.
--
-- De drempels zijn dezelfde als in `meldenNu` in coach.ts, en om dezelfde reden:
-- vijftien gram eiwit is ongeveer een portie, en daaronder is het verschil
-- kleiner dan de meetfout van het loggen zelf. Een prikkel die daarvoor afgaat
-- stoort je voor ruis, en de volgende die er wél toe doet klik je dan weg.
-- -----------------------------------------------------------------------------
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
        || ' — ' || (v_v->>'kcal') || ' kcal, ' || (v_v->>'eiwit') || ' g eiwit ('
        || replace(round((v_v->>'dichtheid')::numeric * 100, 1)::text, '.', ',')
        || ' g per 100 kcal)</li>';
    end loop;

    if v_reden = 'bijna-op' then
      v_ond := 'BennaHealth — je ruimte is bijna op';
      v_tekst := 'Er is nog ' || (v_s->>'kcal_over') || ' kcal over en het is pas ' || v_uur
        || ' uur. Niet dramatisch, wel het weten waard: de rest van de dag moet daarin passen.';
    elsif v_reden = 'ruimte-over' then
      v_ond := 'BennaHealth — er is nog veel ruimte';
      v_tekst := 'Er staat nog ' || (v_s->>'kcal_over') || ' kcal open. Structureel onder je doel '
        || 'eten ondermijnt het model net zo goed als eroverheen gaan: de weegreeks gaat dan dalen '
        || 'om een reden die niet in de logboeken staat.';
    else
      v_ond := 'BennaHealth — je eiwit loopt achter';
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

revoke all on function public.kal_coach_bouwen(text) from public, anon, authenticated;
