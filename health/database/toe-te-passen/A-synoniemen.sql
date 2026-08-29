-- ===========================================================================
-- A. SYNONIEMEN — woorden die jij gebruikt en NEVO niet
-- ===========================================================================
--
-- Nog niet toegepast. De genummerde bestanden in `health/database/` zijn een
-- verslag van wat er in de database staat; dit is een voorstel dat er nog niet
-- in zit. Zodra het toegepast is hoort het te verhuizen naar het volgende
-- nummer en hoort deze kop weg.
--
-- WAT HIER EERST STOND, EN WAAROM HET WEG IS
--
-- Dit bestand begon als drie blokken over mayonaise. Twee daarvan zijn af en
-- verhuisd; wat overblijft is dit. Het is de moeite waard op te schrijven wat er
-- niet aan de hand bleek, want ik zat er twee keer naast:
--
--   * Mayonaise was gewoon vindbaar. Alle drie de spellingen geven treffers —
--     mayonaise 4, mayonnaise 5, mayo 5. Een synoniem "mayo" toevoegen zou niets
--     opgelost hebben. "mayo" is vier letters en valt onder de regel "begin van
--     een woord", en `mayonaise` begint met `mayo`.
--
--   * De huishoudmaat ontbrak ook niet. Voor de groep "Hartige sauzen" stond al
--     een eetlepel van 15 g, band 10 tot 20, als standaard.
--
--   * Waar het wél aan lag staat in `health/edge/kal-ai.ts`: bij het beschrijven
--     van een maaltijd kwam het portiegewicht van het model en werd
--     `voeding_portiematen` niet geraadpleegd. De maten stonden er; de weg liep
--     eraan voorbij. Verholpen daar, niet hier.
--
--   * En de graanreep die bovenaan verscheen was een derde ding: het telwoord
--     "twee" matchte op "B'tween". Zie 12-telwoorden-uit-het-zoeken.sql.
--
-- WAT ER DAN WEL OVERBLIJFT
--
-- Eén echt gat: "pasta" vindt `Macaroni` niet, en zal dat nooit doen — er is
-- geen gedeeld woordbegin. Datzelfde geldt voor "boterhammen", want NEVO kent
-- alleen "brood". Daar is `synoniemen_afgeleid` voor: geen NEVO-gegeven maar
-- iets van ons, dus het aanvullen tast de bron niet aan, en de zoekfunctie kijkt
-- er wel in mee.


-- ---------------------------------------------------------------------------
-- WOORDEN DIE JE THUIS GEBRUIKT
-- ---------------------------------------------------------------------------
--
-- Niet "mayo": dat werkt al. Wel het geval waar de zoekregel niets aan kan doen
-- omdat het woord niets met de tabelnaam gemeen heeft. "pasta" vindt `Macaroni`
-- niet, en zal dat nooit doen — er is geen gedeeld woordbegin. Daar is
-- `synoniemen_afgeleid` voor: het is geen NEVO-gegeven maar iets van ons, dus
-- het aanvullen tast de bron niet aan en de zoekfunctie kijkt er wel in mee.
--
-- Eerst: welke van deze woorden vindt nu al iets? Vul de lijst gerust aan met
--     wat de kinderen en jij werkelijk intypen. Alles wat op 0 staat is een gat.

select w.woord, (select count(*) from kal_nevo_zoek(w.woord, 20)) as treffers
from (values ('pasta'),('mayo'),('pindakaas'),('hagelslag'),('frisdrank'),
             ('patat'),('sla'),('kipfilet'),('yoghurt'),('kaas'),
             ('chips'),('koek'),('cola'),('brood'),('rijst')) as w(woord)
order by treffers, w.woord;

-- En dan de koppeling: woord → producten waar het bij hoort. Alleen de paren
--     invullen waarvan de vraag hierboven liet zien dat ze nu niets vinden, en alleen waar je
--     zeker van bent. Een synoniem dat te ruim staat maakt het zoeken slechter,
--     niet beter — dan komt bij "pasta" ook de pastasaus omhoog.
--
--     Herhaalbaar: het woord wordt alleen toegevoegd als het er nog niet staat.

update nevo_foods f
   set synoniemen_afgeleid = f.synoniemen_afgeleid || array[p.woord]
from (values
        ('pasta', '%macaroni%'),
        ('pasta', '%spaghetti%'),
        ('pasta', '%penne%')
     ) as p(woord, patroon)
 where f.naam_nl ilike p.patroon
   and not (p.woord = any(f.synoniemen_afgeleid));

-- Nakijken:
select 'pasta' as term, count(*) as treffers from kal_nevo_zoek('pasta', 20);

-- Terugdraaien:
-- update nevo_foods set synoniemen_afgeleid = array_remove(synoniemen_afgeleid, 'pasta')
--  where 'pasta' = any(synoniemen_afgeleid);
