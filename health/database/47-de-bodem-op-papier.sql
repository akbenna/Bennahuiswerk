-- DE BODEM OP PAPIER: FUNCTIES DIE DRAAIEN ZONDER VERSLAG
--
-- `controle-md5.sql` meldde tien functies met STAAT NIET IN DE REPO. Dat zijn
-- de sessie, het profiel en het wegschrijven van een dag: de bodem waar de hele
-- app op staat, en er ging nergens een bestand over. Dit bestand vult dat gat.
--
-- WAT DIT BESTAND IS, EN WAT HET NIET IS
--
-- Het is een verslag en geen wijziging. De tekst hieronder is letterlijk wat er
-- in de database draait, opgehaald met `pg_get_functiondef` via
-- `uitlezen-tien.sql`. Hem draaien verandert dus niets: het is dezelfde functie,
-- opnieuw neergezet.
--
-- Wat het niet is: een reconstructie. Geen van deze functies is uit het hoofd
-- geschreven. Een verslag dat lijkt op wat er draait is erger dan geen verslag,
-- want het wordt geloofd, en de md5-controle zou het meteen verraden.
--
-- NOG NIET COMPLEET, EN DAT STAAT HIER
--
-- Van de tien staat er één in. De negen die nog ontbreken:
--
--     kal_sessie            kal_afmelden          kal_profiel_zetten
--     kal_dagstand          kal_dag_zetten        kal_regels_toevoegen
--     kal_regel_wissen      kal_weekcijfers       kal_prikkel_bouwen
--
-- Zolang die er niet bij staan, blijft `controle-md5.sql` ze melden, en dat
-- hoort ook: het gat is pas dicht als het dicht is.
--
-- Bij `kal_dag_zetten` hangt er nog een vraag aan die de app raakt. Het venster
-- "Je wegingen" stuurt `gewicht_kg: null` om een foute weging weg te halen. Of
-- die null werkelijk wist of stilletjes de oude waarde laat staan, is alleen
-- aan die functie af te lezen.

-- --------------------------------------------------------------------------
-- kal_prikkel_gelogd
--
-- Houdt bij dat er een prikkel verstuurd is, en of dat lukte. Eén rij per
-- gebruiker per dag per soort; een tweede poging op dezelfde dag werkt die rij
-- bij in plaats van er een tweede naast te zetten.
--
-- Dat `do update` is geen uitzondering op de regel uit CLAUDE.md. Die regel
-- gaat over inhoud die met de hand is opgebouwd (de gerechten voorop). Dit is
-- een logregel over een verzending van vandaag, en de laatste poging is de
-- waarheid over die verzending.

CREATE OR REPLACE FUNCTION public.kal_prikkel_gelogd(p_gebruiker uuid, p_soort text, p_onderwerp text, p_gelukt boolean, p_fout text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into kal_prikkel_log(gebruiker_id, datum, soort, onderwerp, verstuurd, fout)
  values (p_gebruiker, (now() at time zone 'Europe/Amsterdam')::date, p_soort, p_onderwerp, p_gelukt, p_fout)
  on conflict (gebruiker_id, datum, soort) do update
    set verstuurd = excluded.verstuurd, fout = excluded.fout;
end $function$;
