-- ===========================================================================
-- A3. HET GAT ZAT ANDERSOM
-- ===========================================================================
--
-- Nog niet toegepast. Vervangt A2-pasta-ook-macaroni.sql, die niets deed.
--
-- WAT IK TWEE KEER FOUT HAD
--
-- Eerst dacht ik dat "pasta" niets vond en macaroni wel. Toen bleek "pasta" van
-- alles te vinden — óók chocoladepasta en speculoospasta, want in het Nederlands
-- zijn dat twee woorden die hetzelfde geschreven worden. Dus schreef ik A2, dat
-- "pasta" aan macaroni moest hangen.
--
-- Dat deed niets, en de reden staat in de uitkomst van A2 zelf: er is geen
-- macaroni. NEVO noemt álles "Pasta ...":
--
--     Pasta witte rauw            Pasta volkoren gekookt
--     Pasta witte m ei gekookt    Pasta glutenvrij rauw
--     Pasta verrijkt m vezel      Manti gevulde pasta gekookt Turks
--
-- Het patroon '%macaroni%' raakte nul rijen. A2 was dus geen verkeerde ingreep
-- maar een lege.
--
-- HET ECHTE GAT
--
-- Andersom. Typ "spaghetti" of "macaroni" en je vindt niets, want die woorden
-- staan nergens in de tabel. Dat zijn juist de woorden die een kind gebruikt.
--
-- ALLEEN DE GRAANKANT
--
-- Cruciaal: de voorwaarde staat op de groep. Zonder dat zou "Pasta chocolade-
-- melk" een synoniem "spaghetti" krijgen, en dan levert zoeken op spaghetti een
-- chocoladesmeersel op. Precies de vervuiling waar ik in A voor waarschuwde.


-- ---------------------------------------------------------------------------
-- BLOK 1 — METEN. Verandert niets.
-- ---------------------------------------------------------------------------
--
-- `vindt_nu` hoort 0 te zijn voor alle drie, en `raakt` het aantal echte
-- pastaproducten in de graangroep. Is `vindt_nu` boven nul, dan bestaat het
-- woord wél en is dit blok niet nodig.

select w as woord, (select count(*) from kal_nevo_zoek(w, 20)) as vindt_nu
from unnest(array['spaghetti','macaroni','penne','tagliatelle','fusilli','pasta']) w
order by vindt_nu, w;

select count(*) as pasta_in_de_graangroep,
       string_agg(naam_nl, ' · ' order by naam_nl) as welke
from nevo_actief
where naam_nl ilike '%pasta%' and groep = 'Graanproducten en meelsoorten';


-- ---------------------------------------------------------------------------
-- BLOK 2 — DE WOORDEN ERBIJ
-- ---------------------------------------------------------------------------
--
-- Alleen op de graangroep. Chocoladepasta en speculoospasta staan in "Suiker,
-- snoep, zoet beleg en zoete sauzen" en blijven ongemoeid.
--
-- Geen zelfsnoeiende voorwaarde meer zoals in A. Die telde treffers en las ze
-- niet, en juist dat ging bij "pasta" mis. Blok 1 is de controle, en die doe jij.

update nevo_foods f
   set synoniemen_afgeleid = f.synoniemen_afgeleid
                             || array['spaghetti','macaroni','penne','pastas']
 where f.naam_nl ilike '%pasta%'
   and f.groep = 'Graanproducten en meelsoorten'
   and not ('spaghetti' = any(f.synoniemen_afgeleid));


-- ---------------------------------------------------------------------------
-- BLOK 3 — NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- De drie woorden horen nu de pasta te vinden. En de tegenproef is hier de
-- belangrijkste: "spaghetti" mag géén chocoladepasta opleveren.

select w as woord, (select count(*) from kal_nevo_zoek(w, 20)) as treffers
from unnest(array['spaghetti','macaroni','penne']) w order by w;

select nevo_code, naam_nl, groep from kal_nevo_zoek('spaghetti', 20);

-- Terugdraaien:
-- update nevo_foods
--    set synoniemen_afgeleid = synoniemen_afgeleid - '{spaghetti,macaroni,penne,pastas}'::text[]
--  where 'spaghetti' = any(synoniemen_afgeleid);
