-- ===========================================================================
-- 55: JE GEGEVENS MEENEMEN
-- ===========================================================================
--
-- TOEGEPAST: nog niet. Na het toepassen:
--   node gereedschap/md5-verslag.mjs --schrijf
-- en de nakijklijst onderaan.
--
-- WAAROM
--
-- PRIVACY.md belooft een export "op verzoek, in een bestand", en dat is tot nu
-- toe handwerk van de beheerder. Twee redenen om dat een knop te maken:
--
--   1. Het recht op overdraagbaarheid (artikel 20 AVG) gaat over gegevens die
--      iemand zelf heeft aangeleverd, in een gangbaar, machineleesbaar formaat.
--      Een knop die dat levert, maakt van een belofte een functie.
--   2. De overstap naar een ProVita-programma. Wie BennaHealth los gebruikt en
--      daarna bij de praktijk een programma begint, hoeft niet opnieuw te
--      beginnen. Hij neemt dit bestand mee en leest het daar zelf in
--      (provita-care, src/lib/bennahealthImport.js). Dat is bewust geen
--      koppeling tussen de databases: BEOOGD-DOEL.md zegt dat deze app niet in
--      een dossier schrijft en dat er niemand meekijkt. Met een bestand dat de
--      gebruiker zelf meeneemt, blijft dat waar. Zie in provita-care
--      docs/bennahealth-integratie.md §6.
--
-- WAT ER WEL EN NIET IN STAAT
--
-- Wel: alles wat de gebruiker zelf heeft ingevoerd of laten herkennen. Profiel,
-- dagen, wat er gegeten is, eigen producten en maaltijden, metingen, labs,
-- vragenlijsten, training en inspanning.
--
-- Niet: wat geen gegeven over hem is maar over de werking van de app of over
-- de toegang. Sessies, koppelsleutels (ook niet gehasht), aanmeldpogingen, het
-- herstellogboek, het prikkellogboek, het AI-logboek met kosten, de laatste
-- modelstand, en de AI-sleutel. Een lijst met namen en niet "alles met een
-- gebruiker_id", zodat een tabel die er later bijkomt niet ongemerkt in een
-- bestand belandt dat iemand mailt of op een usb-stick zet. Wie een tabel
-- toevoegt die erin hoort, zet hem hier bij.
--
-- Het formaat draagt een naam en een versie, zodat een lezer aan de andere kant
-- kan weigeren wat hij niet kent in plaats van het verkeerd te lezen.
-- ===========================================================================

create or replace function public.kal_exporteren(p_token text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'extensions'
as $function$
declare
  v_id uuid;
begin
  v_id := kal_sessie(p_token);

  return jsonb_build_object(
    'formaat', 'bennahealth-export',
    'versie', 1,
    'gemaakt_op', now(),
    'toelichting', 'Wat je zelf in BennaHealth hebt vastgelegd. Herkomst per regel staat in bron en conf: '
                || 'conf A tot D is de kwaliteit van de waarde, bron zegt hoe hij erin kwam.',
    'profiel', (select to_jsonb(p) - 'gebruiker_id' from kal_profiel p where p.gebruiker_id = v_id),
    'dagen', coalesce((select jsonb_agg(to_jsonb(d) - 'gebruiker_id' order by d.datum)
                         from kal_dagen d where d.gebruiker_id = v_id), '[]'::jsonb),
    'regels', coalesce((select jsonb_agg(to_jsonb(r) - 'gebruiker_id' - 'id' - 'foto_pad' order by r.datum, r.created_at)
                          from kal_regels r where r.gebruiker_id = v_id), '[]'::jsonb),
    'producten', coalesce((select jsonb_agg(to_jsonb(x) - 'gebruiker_id' - 'id' order by x.naam)
                             from kal_producten x where x.gebruiker_id = v_id), '[]'::jsonb),
    'maaltijden', coalesce((select jsonb_agg(
                              (to_jsonb(m) - 'gebruiker_id' - 'id' - 'dish_id')
                              || jsonb_build_object('regels', coalesce((
                                   select jsonb_agg(to_jsonb(rr) - 'id' - 'recept_id')
                                     from kal_recept_regels rr where rr.recept_id = m.id), '[]'::jsonb))
                              order by m.naam)
                              from kal_recepten m where m.gebruiker_id = v_id), '[]'::jsonb),
    'metingen', coalesce((select jsonb_agg(to_jsonb(x) - 'gebruiker_id' - 'id' order by x.datum)
                            from kal_metingen x where x.gebruiker_id = v_id), '[]'::jsonb),
    'labs', coalesce((select jsonb_agg(to_jsonb(x) - 'gebruiker_id' - 'id' order by x.datum)
                        from kal_labs x where x.gebruiker_id = v_id), '[]'::jsonb),
    'vragenlijsten', coalesce((select jsonb_agg(to_jsonb(x) - 'gebruiker_id' - 'id' order by x.datum)
                                 from kal_vragenlijsten x where x.gebruiker_id = v_id), '[]'::jsonb),
    'training', coalesce((select jsonb_agg(to_jsonb(x) - 'gebruiker_id' - 'id' order by x.datum)
                            from kal_training x where x.gebruiker_id = v_id), '[]'::jsonb),
    'inspanning', coalesce((select jsonb_agg(to_jsonb(x) - 'gebruiker_id' - 'id' order by x.datum)
                              from kal_inspanning x where x.gebruiker_id = v_id), '[]'::jsonb)
  );
end $function$;

revoke all on function public.kal_exporteren(text) from public;
grant execute on function public.kal_exporteren(text) to anon, authenticated;

comment on function public.kal_exporteren(text) is
  'Alles wat de gebruiker zelf heeft vastgelegd, als één JSON (formaat bennahealth-export, versie 1). Geen sessies, sleutels of logboeken. Zie health/database/55.';

-- ===========================================================================
-- NAKIJKEN NA HET TOEPASSEN
-- ===========================================================================
--
--   select kal_exporteren('geen-token');
--     -> fout van kal_sessie, zoals bij elke andere functie zonder sessie
--
--   In de app, Account, "Je gegevens downloaden": er komt een bestand
--   bennahealth-<datum>.json, en daarin staan geen sleutel_hash, token,
--   ww_hash of kosten_usd. Zoek er even op; een vergeten kolom is precies het
--   soort fout dat een export lek maakt.
--
-- Let op bij kal_recept_regels: die tabel heeft geen gebruiker_id en hangt aan
-- kal_recepten. Wie de kolommen van die tabel uitbreidt met iets wat niet in een
-- export hoort, haalt het hierboven weg.
