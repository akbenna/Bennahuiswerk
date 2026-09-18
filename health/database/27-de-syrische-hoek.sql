-- =============================================================================
-- DE SYRISCHE HOEK — de laatste lege keuken
--
-- Toestand onbekend: de kop zei lang "nog niet toegepast" en dat klopte
-- vermoedelijk niet meer. Kijk het na voordat je iets doet — het antwoord staat
-- in de database en niet in dit bestand:
--
--   select count(*) from cultural_dishes where slug like 'sy-%';
--
-- Staat daar nul, dan is dit bestand nog te draaien. Staat er iets, dan is het
-- gedraaid en hoort een toevoeging in een nieuw bestand: de terugdraairegel
-- onderaan raakt alles wat aan dit patroon voldoet.
--
-- WAT IK VORIGE WEEK OPSCHREEF, EN WAAROM DAT MAAR HALF KLOPTE
--
-- In bestand 25 staat: "NEVO heeft er geen samengestelde gerechten voor, dus
-- daar zou voor álles gelden wat nu alleen voor roti en heri heri geldt:
-- verzonnen grammenlijsten." Dat is nagemeten en het klopt half.
--
-- Samengestelde Syrische gerechten heeft NEVO inderdaad niet. Maar hij heeft
-- wél een reeks Levantijnse onderdelen die als heel product zijn doorgemeten,
-- en dat is meer dan bij de Marokkaanse hoek beschikbaar was:
--
--     3207  Hummus naturel                    320 kcal / 100 g
--     1365  Baklava                           461
--     5547  Falafel onbereid                  231
--     1461  Pasta sesam- tahin                585
--     3200  Tarwe gebroken bulgur gekookt      80
--     2906  Shoarmavlees bereid               239
--     1361  Tarwebrood wit Turks              250
--     5174  Linzen rode gekookt               110
--     1576  Gehakt lams- gebakken             252
--
-- Hummus en baklava zijn daarmee complete gerechten met een gemeten waarde. De
-- rest is de bouwdoos, en daarmee valt de hoek op te bouwen uit onderdelen die
-- elk apart gemeten zijn — precies de opzet van blok 2 van bestand 24.
--
-- Dat is de derde keer in dit project dat meten vóór bouwen een aanname omkeert.
-- De eerste was de drempel van de zoekterugval, de tweede de Surinaamse hoek.
-- Er zit een patroon in: mijn schattingen van wat er in de tabel staat zijn
-- systematisch te pessimistisch. Dat is geen toeval en het is goedkoop te
-- verhelpen — één query.
--
-- WAT ONDERBOUWD IS EN WAT NIET
--
-- Onderbouwd: alle voedingswaarden, want ze komen uit de tabel. Elke code is
-- opgezocht en niet onthouden.
--
-- Niet onderbouwd: de grammen, de porties, en één getal dat apart aandacht
-- verdient — de opnamefractie van het frituurvet, hieronder.
--
-- Daarom weer overal `concept`, `ai_voorstel` en `estimated`: graad D.
--
-- HET FRITUURVET, EN WAAROM DAT GETAL EERLIJK MOET
--
-- Falafel en kibbeh worden gefrituurd. Het schema heeft daar een veld voor:
-- `absorbed_fraction` — hoeveel van het vet dat de pan in gaat in het gerecht
-- achterblijft. Bij een tajine is dat 1,0, want daar wordt in het vet gestoofd.
-- Bij frituren is het een fractie, en dat getal is niet te meten in deze tabel.
--
-- Ik heb het gekozen en daarna gecontroleerd waar het uitkomt, en die volgorde
-- hoort er eerlijk bij te staan: 0,12 voor falafel geeft 303 kcal per 100 gram
-- gefrituurde falafel, en 0,10 voor kibbeh geeft 200. Die eerste ligt midden in
-- wat er over gefrituurde falafel bekend is. De fractie is dus geen meting maar
-- een ijking — gekozen zodat de uitkomst klopt met wat er over het bereide
-- product bekend is. Wie hem verandert verandert de hele hoek mee, en daarom
-- staat hij per regel in `uncertainty_note` en niet verstopt in een som.
--
-- TWEE DINGEN DIE NEVO NIET GOED GENOEG HEEFT
--
-- **Shoarmavlees is varkensvlees.** NEVO 2906 en 3027 zijn de enige
-- shoarma-regels en allebei van varken. Voor een Syrisch gerecht is dat de
-- verkeerde regel, en niet een beetje. Het broodje hieronder is daarom met kip
-- gebouwd (NEVO 1635) — kipshoarma bestaat, is gangbaar, en staat gemeten in de
-- tabel. Wie lamsshoarma eet zit hoger.
--
-- **Ful medames staat er niet in.** Ful is de gedroogde bruine tuinboon,
-- gekookt; NEVO kent alleen de verse en de ingeblikte groene tuinboon, en dat
-- scheelt op de hoofdmoot van het gerecht ruim een derde. Een gerecht waarvan
-- het belangrijkste ingrediënt er een derde naast zit is slechter dan geen
-- gerecht. Ful ontbreekt dus, en dat is een keuze en geen vergeten regel.
--
-- DE REFERENTIEHOEVEELHEID
--
-- Bij de twee gerechten van blok 1 is de regel één kilo gerecht en niet een pan,
-- net als in bestand 25: `default_servings` zegt daar hoeveel standaardporties
-- er in een kilo gaan en niet wat een recept oplevert. Bij blok 2 is er wél een
-- pan, en staat er wat die pan oplevert — uitgerekend uit de ingrediënten en
-- niet ingevuld, zodat de twee niet uit elkaar kunnen lopen.
--
-- Draaien mag meer dan eens: wat er al staat wordt overgeslagen.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- BLOK 1 — DE TWEE DIE NEVO ALS GEHEEL GEMETEN HEEFT
-- ---------------------------------------------------------------------------

with portie(slug, label, maat, icoon, schat, laag, hoog, std, volg, notitie) as (values
  ('sy-hummus','Eetlepel','eetlepel','🫓',25::numeric,18::numeric,35::numeric,true,10,'Als mezze naast het brood.'),
  ('sy-hummus','Opscheplepel','opscheplepel','🫓',60,45,80,false,20,null::text),
  ('sy-hummus','Schaaltje','kom',        '🫓',120,90,160,false,30,'Als je er een maaltijd van maakt.'),
  ('sy-baklava','Een stuk','stuk','🍯',40,30,55,true,10,null),
  ('sy-baklava','Twee stuks','stuk','🍯',80,60,110,false,20,null)
),
gerecht(slug, naam, namen, omschrijving, momenten, nevo) as (values
  ('sy-hummus','Hummus',
   '{"nl":["hummus","houmous","kikkererwtenpuree"],"ar":["حمص"],"ar_lat":["hummus","hommos"]}',
   'Kikkererwtenpuree met tahin, citroen en knoflook. NEVO heeft hem als geheel gemeten.',
   array['lunch','avondeten','tussendoor'],'3207'),
  ('sy-baklava','Baklava',
   '{"nl":["baklava","baklawa","notengebak"],"ar":["بقلاوة"],"ar_lat":["baklawa"]}',
   'Filodeeg met noten en suikersiroop. NEVO heeft het als geheel gemeten.',
   array['tussendoor','feest'],'1365')
),
nieuw as (
  insert into public.cultural_dishes
    (slug, name_nl, names, cuisine, description_nl, meal_moments,
     default_servings, validation_status)
  select g.slug, g.naam, g.namen::jsonb, 'syrisch', g.omschrijving, g.momenten,
         greatest(1, round(1000 / (select p.schat from portie p
                                    where p.slug = g.slug and p.std))),
         'concept'
    from gerecht g
  on conflict (slug) do nothing
  returning id, slug
), ing as (
  insert into public.dish_ingredients
    (dish_id, position, ingredient_name_nl, category, quantity, unit,
     grams_equivalent, external_source, external_food_id, uncertainty_note)
  select n.id, 10, 'Het hele gerecht, zoals NEVO het gemeten heeft', 'overig',
         1000, 'g', 1000, 'nevo', g.nevo,
         'NEVO ' || g.nevo || ' is het complete gerecht en geen onderdeel ervan. '
         || 'Alleen het portiegewicht is geschat.'
    from nieuw n join gerecht g on g.slug = n.slug
  returning 1
)
insert into public.dish_portions
  (dish_id, label_nl, household_measure, icon, grams_estimate, grams_low,
   grams_high, measurement_basis, is_default, sort_order, notes)
select n.id, p.label, p.maat, p.icoon, p.schat, p.laag, p.hoog,
       'estimated', p.std, p.volg, p.notitie
  from nieuw n join portie p on p.slug = n.slug;


-- ---------------------------------------------------------------------------
-- BLOK 2 — DE NEGEN DIE UIT GEMETEN ONDERDELEN ZIJN OPGEBOUWD
-- ---------------------------------------------------------------------------
--
-- Per gerecht één regel in `gerecht`, zijn ingrediënten in `onderdeel` en zijn
-- porties in `portie`. Dat is uit elkaar te houden en het scheelt driehonderd
-- regels ten opzichte van negen losse blokken.

with portie(slug, label, maat, icoon, schat, laag, hoog, std, volg, notitie) as (values
  ('sy-shorbat-adas','Kom','kom','🍲',250::numeric,200::numeric,350::numeric,true,10,'De maat van voeding_portiematen voor de groep Soepen.'),
  ('sy-shorbat-adas','Grote kom','kom','🍲',400,350,500,false,20,null::text),
  ('sy-tabouleh','Opscheplepel','opscheplepel','🥗',100,70,140,true,10,'Als mezze naast de rest.'),
  ('sy-tabouleh','Bord','bord','🥗',200,150,280,false,20,null),
  ('sy-fattoush','Bord','bord','🥗',200,150,280,true,10,null),
  ('sy-fattoush','Opscheplepel','opscheplepel','🥗',100,70,140,false,20,null),
  ('sy-mujadara','Bord','bord','🍚',300,240,400,true,10,null),
  ('sy-mujadara','Groot bord','bord','🍚',430,370,530,false,20,null),
  ('sy-mujadara','Kleine portie','bord','🍚',180,140,230,false,30,null),
  ('sy-moutabal','Eetlepel','eetlepel','🍆',25,18,35,true,10,'Als mezze naast het brood.'),
  ('sy-moutabal','Opscheplepel','opscheplepel','🍆',60,45,80,false,20,null),
  ('sy-falafel','Vier balletjes','stuk','🧆',100,80,130,true,10,'Een balletje weegt ongeveer 25 gram.'),
  ('sy-falafel','Een balletje','stuk','🧆',25,20,32,false,20,null),
  ('sy-falafel','Zes balletjes','stuk','🧆',150,120,195,false,30,null),
  ('sy-shawarma-brood','Een broodje','stuk','🌯',330,270,420,true,10,'De pan komt op 326 g per broodje uit; die twee schattingen zijn los van elkaar gemaakt.'),
  ('sy-shawarma-brood','Half broodje','stuk','🌯',165,135,210,false,20,null),
  ('sy-maqluba','Bord','bord','🍚',350,280,450,true,10,null),
  ('sy-maqluba','Groot bord','bord','🍚',500,430,620,false,20,null),
  ('sy-maqluba','Kleine portie','bord','🍚',220,170,280,false,30,null),
  ('sy-kibbeh','Een kibbeh','stuk','🥟',65,50,85,true,10,null),
  ('sy-kibbeh','Twee kibbeh','stuk','🥟',130,105,170,false,20,null),
  ('sy-kibbeh','Drie kibbeh','stuk','🥟',195,155,255,false,30,null),
  ('sy-manakish','Een manakish','stuk','🫓',130,100,170,true,10,null),
  ('sy-manakish','Halve manakish','stuk','🫓',65,50,85,false,20,null)
),
gerecht(slug, naam, namen, omschrijving, momenten, nevo_dummy) as (values
  ('sy-shorbat-adas','Rode linzensoep',
   '{"nl":["linzensoep","rode linzensoep","linzensoep syrisch"],"ar":["شوربة عدس"],"ar_lat":["shorbat adas","shorbet adas"]}',
   'Rode linzen met ui, wortel en komijn tot een gladde soep gekookt. Het dagelijkse gerecht in de ramadan.',
   array['avondeten','lunch','iftar'],''),
  ('sy-tabouleh','Tabouleh',
   '{"nl":["tabouleh","tabbouleh","peterseliesalade","bulgursalade"],"ar":["تبولة"],"ar_lat":["tabbouleh","tabouli"]}',
   'Vooral peterselie, met een beetje bulgur, tomaat, citroen en olijfolie. Niet andersom — dat is de Turkse kisir.',
   array['lunch','avondeten'],''),
  ('sy-fattoush','Fattoush',
   '{"nl":["fattoush","broodsalade","salade met geroosterd brood"],"ar":["فتوش"],"ar_lat":["fattoush","fattush"]}',
   'Salade van sla, komkommer, tomaat en radijs met stukken geroosterd brood erdoor.',
   array['lunch','avondeten'],''),
  ('sy-mujadara','Mujadara',
   '{"nl":["mujadara","moedjadara","linzen met rijst","linzen met gebakken ui"],"ar":["مجدرة"],"ar_lat":["mujadara","mjaddara"]}',
   'Linzen en rijst samen gekookt, met veel gebakken ui erop.',
   array['avondeten','lunch'],''),
  ('sy-moutabal','Moutabal',
   '{"nl":["moutabal","mutabbal","baba ganoush","auberginedip"],"ar":["متبل"],"ar_lat":["moutabal","mutabbal","baba ghanoush"]}',
   'Geroosterde aubergine met tahin, citroen en knoflook.',
   array['lunch','avondeten','tussendoor'],''),
  ('sy-falafel','Falafel',
   '{"nl":["falafel","felafel","kikkererwtenballetjes"],"ar":["فلافل"],"ar_lat":["falafel"]}',
   'Gefrituurde balletjes van gemalen kikkererwten en kruiden.',
   array['lunch','avondeten','tussendoor'],''),
  ('sy-shawarma-brood','Broodje shawarma met kip',
   '{"nl":["shawarma","shoarma","broodje shoarma","kipshoarma","shawarma broodje"],"ar":["شاورما"],"ar_lat":["shawarma","shawerma"]}',
   'Kipshawarma in brood met sla, tomaat, ui en knoflooksaus. NEVO kent alleen shoarma van varkensvlees; dit is met kip gebouwd.',
   array['lunch','avondeten'],''),
  ('sy-maqluba','Maqluba',
   '{"nl":["maqluba","makloube","omgekeerde rijstschotel","rijst met aubergine en kip"],"ar":["مقلوبة"],"ar_lat":["maqluba","maqlouba","makloubeh"]}',
   'Rijst, aubergine en kip in lagen gestoofd en omgekeerd op de schaal gestort.',
   array['avondeten','feest'],''),
  ('sy-kibbeh','Kibbeh',
   '{"nl":["kibbeh","kibbe","bulgurkroket","gevulde bulgurballen"],"ar":["كبة"],"ar_lat":["kibbeh","kubba"]}',
   'Gefrituurde bulgurschil gevuld met lamsgehakt, ui en pijnboompitten.',
   array['avondeten','lunch','feest'],''),
  ('sy-manakish','Manakish met zaatar',
   '{"nl":["manakish","manakeesh","zaatarbrood","platbrood met zaatar"],"ar":["مناقيش"],"ar_lat":["manakish","manaeesh","manoushe"]}',
   'Platbrood uit de oven met zaatar en olijfolie. Het ontbijt.',
   array['ontbijt','lunch'],'')
),
onderdeel(slug, pos, naam, lokaal, cat, gram, eenheid, nevo, rol, vetregel, vetsoort, opname, notitie) as (values
  -- rode linzensoep
  ('sy-shorbat-adas',10,'Rode linzen','adas','peulvrucht',600::numeric,'g','5174','ingredient',false,null::text,null::numeric,'Gekookt gewicht; dat is ongeveer 200 g droog.'),
  ('sy-shorbat-adas',20,'Ui',null,'groente',150,'g','63','ingredient',false,null,null,null::text),
  ('sy-shorbat-adas',30,'Wortel',null,'groente',150,'g','72','ingredient',false,null,null,'Gekookt gewicht.'),
  ('sy-shorbat-adas',40,'Komijn','kammoun','kruiden',5,'g','827','ingredient',false,null,null,null),
  ('sy-shorbat-adas',50,'Zout',null,'kruiden',8,'g','841','ingredient',false,null,null,null),
  ('sy-shorbat-adas',60,'Water',null,'overig',700,'ml','1885','ingredient',false,null,null,'DIT GETAL BEPAALT DE HELE SOEP. Water heeft geen energie maar wel gewicht, dus het staat in de noemer van de dichtheid en verder nergens. Met 700 ml komt de soep op 64 kcal per 100 g; met een liter op 54, en dan is het bouillon met linzen erin en geen shorbat adas. 200 g droge linzen op 700 ml is de verhouding van een gewone huishoudpan.'),
  ('sy-shorbat-adas',200,'Olijfolie','zeit zeitoun','vet',30,'ml','601','preparation_fat',true,'olijfolie',1.000,'De ui wordt erin gefruit en het vet blijft in de soep.'),
  -- tabouleh
  ('sy-tabouleh',10,'Platte peterselie','baqdounis','kruiden',300,'g','128','ingredient',false,null,null,'Peterselie is de hoofdmoot en niet een garnering — dat is het verschil met de Turkse kisir.'),
  ('sy-tabouleh',20,'Bulgur','burghul','graan',150,'g','3200','ingredient',false,null,null,'Gekookt gewicht; de fijne bulgur wordt geweekt en niet gekookt, wat op hetzelfde neerkomt.'),
  ('sy-tabouleh',30,'Tomaat','banadoura','groente',300,'g','2734','ingredient',false,null,null,null),
  ('sy-tabouleh',40,'Ui',null,'groente',80,'g','63','ingredient',false,null,null,null),
  ('sy-tabouleh',50,'Verse munt','naanaa','kruiden',40,'g','3450','ingredient',false,null,null,null),
  ('sy-tabouleh',60,'Citroensap','hamod','fruit',60,'ml','1127','ingredient',false,null,null,null),
  ('sy-tabouleh',70,'Zout',null,'kruiden',5,'g','841','ingredient',false,null,null,null),
  ('sy-tabouleh',200,'Olijfolie','zeit zeitoun','vet',60,'ml','601','preparation_fat',true,'olijfolie',1.000,'Gaat er rauw overheen, dus alles blijft erin. Dit is de grootste post van dit gerecht: zestig gram olie is meer energie dan alle groente bij elkaar.'),
  -- fattoush
  ('sy-fattoush',10,'Romaine sla',null,'groente',200,'g','3332','ingredient',false,null,null,null),
  ('sy-fattoush',20,'Komkommer','khyar','groente',200,'g','27','ingredient',false,null,null,null),
  ('sy-fattoush',30,'Tomaat','banadoura','groente',250,'g','2734','ingredient',false,null,null,null),
  ('sy-fattoush',40,'Radijs','fijl','groente',80,'g','124','ingredient',false,null,null,null),
  ('sy-fattoush',50,'Platte peterselie','baqdounis','kruiden',40,'g','128','ingredient',false,null,null,null),
  ('sy-fattoush',60,'Verse munt','naanaa','kruiden',20,'g','3450','ingredient',false,null,null,null),
  ('sy-fattoush',70,'Geroosterd platbrood','khubz','graan',80,'g','1361','ingredient',false,null,null,'Oud brood, geroosterd of gefrituurd. NEVO heeft geen Syrisch platbrood; Turks witbrood is de dichtstbijzijnde regel. Gefrituurd in plaats van geroosterd zit fors hoger.'),
  ('sy-fattoush',80,'Citroensap','hamod','fruit',40,'ml','1127','ingredient',false,null,null,null),
  ('sy-fattoush',90,'Zout',null,'kruiden',5,'g','841','ingredient',false,null,null,null),
  ('sy-fattoush',200,'Olijfolie','zeit zeitoun','vet',50,'ml','601','preparation_fat',true,'olijfolie',1.000,'Rauw over de salade.'),
  -- mujadara
  ('sy-mujadara',10,'Bruine linzen','adas','peulvrucht',500,'g','970','ingredient',false,null,null,'Gekookt gewicht.'),
  ('sy-mujadara',20,'Witte rijst','ruz','graan',500,'g','658','ingredient',false,null,null,'Gekookt gewicht.'),
  ('sy-mujadara',30,'Ui','basal','groente',200,'g','63','ingredient',false,null,null,'Rauw gewogen; het vet waarin hij bruin wordt staat als aparte regel, anders telt het dubbel.'),
  ('sy-mujadara',40,'Komijn','kammoun','kruiden',4,'g','827','ingredient',false,null,null,null),
  ('sy-mujadara',50,'Zout',null,'kruiden',8,'g','841','ingredient',false,null,null,null),
  ('sy-mujadara',200,'Olijfolie','zeit zeitoun','vet',50,'ml','601','preparation_fat',true,'olijfolie',1.000,'De ui wordt er donkerbruin in gebakken en het vet gaat mee de schaal op.'),
  -- moutabal
  ('sy-moutabal',10,'Aubergine','batinjan','groente',600,'g','11','ingredient',false,null,null,'Boven de vlam geroosterd en dan uitgelekt. NEVO heeft alleen gekookte aubergine; geroosterd verliest meer vocht, dus per gram valt dit aan de lage kant.'),
  ('sy-moutabal',20,'Tahin','tahina','noten',90,'g','1461','ingredient',false,null,null,'De tweede hoofdmoot en veruit de grootste energiepost.'),
  ('sy-moutabal',30,'Citroensap','hamod','fruit',40,'ml','1127','ingredient',false,null,null,null),
  ('sy-moutabal',40,'Knoflook','toum','groente',10,'g','830','ingredient',false,null,null,null),
  ('sy-moutabal',50,'Zout',null,'kruiden',5,'g','841','ingredient',false,null,null,null),
  ('sy-moutabal',200,'Olijfolie','zeit zeitoun','vet',20,'ml','601','preparation_fat',true,'olijfolie',1.000,'Eroverheen bij het opdienen.'),
  -- falafel
  ('sy-falafel',10,'Falafelmengsel',null,'peulvrucht',500,'g','5547','ingredient',false,null,null,'NEVO 5547 is het onbereide mengsel. Het frituurvet staat apart, want dat is waar de energie zit.'),
  ('sy-falafel',200,'Frituurvet',null,'vet',500,'ml','2068','preparation_fat',true,'zonnebloemolie',0.120,'GEIJKT, NIET GEMETEN. Van het vet in de pan blijft een fractie in het product achter. Met 0,12 komt de gefrituurde falafel op 303 kcal per 100 g, en dat ligt midden in wat er over gefrituurde falafel bekend is. Wie in de oven bakt zit fors lager; wie hem verandert verandert dit hele gerecht.'),
  -- broodje shawarma
  ('sy-shawarma-brood',10,'Kipshawarma','shawarma djaj','vlees',400,'g','1635','ingredient',false,null,null,'Bereid gewicht. NEVO 2906 en 3027 zijn de enige shoarmaregels en allebei van varken; kip is de dichtstbijzijnde regel die klopt. Lamsshawarma zit hoger.'),
  ('sy-shawarma-brood',20,'Platbrood','khubz','graan',400,'g','1361','ingredient',false,null,null,'Vier broodjes van 100 g. NEVO heeft geen Syrisch platbrood; Turks witbrood is de dichtstbijzijnde regel.'),
  ('sy-shawarma-brood',30,'IJsbergsla',null,'groente',150,'g','1399','ingredient',false,null,null,null),
  ('sy-shawarma-brood',40,'Tomaat','banadoura','groente',150,'g','2734','ingredient',false,null,null,null),
  ('sy-shawarma-brood',50,'Ui','basal','groente',80,'g','63','ingredient',false,null,null,null),
  ('sy-shawarma-brood',60,'Knoflooksaus','toum','saus',120,'g','2573','ingredient',false,null,null,'Echte toum is knoflook geëmulgeerd met olie en zit hoger dan deze kant-en-klare saus van 20 tot 30 procent olie. Dit is een ondergrens.'),
  ('sy-shawarma-brood',70,'Zout',null,'kruiden',5,'g','841','ingredient',false,null,null,null),
  -- maqluba
  ('sy-maqluba',10,'Witte rijst','ruz','graan',900,'g','658','ingredient',false,null,null,'Gekookt gewicht.'),
  ('sy-maqluba',20,'Aubergine','batinjan','groente',500,'g','11','ingredient',false,null,null,'In de klassieke versie wordt de aubergine eerst gefrituurd; dan komt er per 100 g fors bij. Dit is de gebakken-in-de-pan versie, met het vet als aparte regel.'),
  ('sy-maqluba',30,'Kip','djaj','vlees',500,'g','1635','ingredient',false,null,null,'Bereid gewicht, zonder bot.'),
  ('sy-maqluba',40,'Ui','basal','groente',150,'g','63','ingredient',false,null,null,null),
  ('sy-maqluba',50,'Pijnboompitten','snoubar','noten',40,'g','2176','ingredient',false,null,null,null),
  ('sy-maqluba',60,'Zout',null,'kruiden',10,'g','841','ingredient',false,null,null,null),
  ('sy-maqluba',200,'Olijfolie','zeit zeitoun','vet',80,'ml','601','preparation_fat',true,'olijfolie',1.000,'Alles blijft in de schotel; er wordt gestoofd, niet gefrituurd.'),
  -- kibbeh
  ('sy-kibbeh',10,'Bulgur','burghul','graan',400,'g','3200','ingredient',false,null,null,'Gekookt gewicht; de fijne bulgur van de schil wordt geweekt.'),
  ('sy-kibbeh',20,'Lamsgehakt','lahme','vlees',400,'g','1576','ingredient',false,null,null,'Gebakken gewicht.'),
  ('sy-kibbeh',30,'Ui','basal','groente',150,'g','63','ingredient',false,null,null,null),
  ('sy-kibbeh',40,'Pijnboompitten','snoubar','noten',50,'g','2176','ingredient',false,null,null,null),
  ('sy-kibbeh',50,'Komijn','kammoun','kruiden',5,'g','827','ingredient',false,null,null,null),
  ('sy-kibbeh',60,'Zout',null,'kruiden',8,'g','841','ingredient',false,null,null,null),
  ('sy-kibbeh',200,'Frituurvet',null,'vet',400,'ml','2068','preparation_fat',true,'zonnebloemolie',0.100,'GEIJKT, NIET GEMETEN. Met 0,10 komt de kibbeh op 200 kcal per 100 g. Lager dan falafel omdat de bulgurschil dichter is en minder vet opneemt dan een los kikkererwtenmengsel.'),
  -- manakish
  ('sy-manakish',10,'Platbrooddeeg','ajin','graan',500,'g','1361','ingredient',false,null,null,'NEVO heeft geen Syrisch platbrood; Turks witbrood is de dichtstbijzijnde regel voor het bakresultaat.'),
  ('sy-manakish',20,'Sesamzaad','simsim','noten',25,'g','838','ingredient',false,null,null,'Zaatar is een mengsel van tijm, sumak en sesam, en staat als mengsel niet in NEVO. Het sesamzaad is de enige post die er energetisch toe doet; de tijm en de sumak zijn samen minder dan tien kilocalorieën en ontbreken daarom in plaats van dat er iets voor wordt verzonnen.'),
  ('sy-manakish',200,'Olijfolie','zeit zeitoun','vet',50,'ml','601','preparation_fat',true,'olijfolie',1.000,'Tien gram per manakish. De zaatar wordt met olie tot een pasta geroerd en gaat zo de oven in. Dit is na het deeg de grootste post, en de post waar bakkers het meest in verschillen.')
),
nieuw as (
  insert into public.cultural_dishes
    (slug, name_nl, names, cuisine, description_nl, meal_moments,
     default_servings, validation_status)
  select g.slug, g.naam, g.namen::jsonb, 'syrisch', g.omschrijving, g.momenten,
         greatest(1, round((select sum(o.gram) from onderdeel o where o.slug = g.slug)
                           / (select p.schat from portie p where p.slug = g.slug and p.std))),
         'concept'
    from gerecht g
  on conflict (slug) do nothing
  returning id, slug
), ing as (
  insert into public.dish_ingredients
    (dish_id, position, ingredient_name_nl, ingredient_name_local, category,
     quantity, unit, grams_equivalent, external_source, external_food_id,
     role, is_preparation_fat, fat_type, absorbed_fraction, uncertainty_note)
  select n.id, o.pos, o.naam, o.lokaal, o.cat, o.gram, o.eenheid, o.gram,
         'nevo', o.nevo, o.rol, o.vetregel, o.vetsoort, o.opname, o.notitie
    from nieuw n join onderdeel o on o.slug = n.slug
  returning 1
)
insert into public.dish_portions
  (dish_id, label_nl, household_measure, icon, grams_estimate, grams_low,
   grams_high, measurement_basis, is_default, sort_order, notes)
select n.id, p.label, p.maat, p.icoon, p.schat, p.laag, p.hoog,
       'estimated', p.std, p.volg, p.notitie
  from nieuw n join portie p on p.slug = n.slug;

COMMIT;


-- ---------------------------------------------------------------------------
-- BLOK 3 — NAKIJKEN
-- ---------------------------------------------------------------------------
--
-- 1. Wijst elke code naar een bestaande tabelregel? Nul rijen is goed.

-- select d.slug, i.ingredient_name_nl, i.external_food_id
--   from dish_ingredients i join cultural_dishes d on d.id = i.dish_id
--  where d.cuisine = 'syrisch'
--    and not exists (select 1 from nevo_foods n where n.nevo_code = i.external_food_id);

-- 2. Heeft elk gerecht precies één standaardportie, en staan de merktekens goed?
--    Alle kolommen horen nul te zijn.

-- select count(*) filter (where d.validation_status <> 'concept')   as niet_concept,
--        count(*) filter (where i.mapping_status <> 'ai_voorstel')  as niet_voorstel,
--        count(*) filter (where p.measurement_basis <> 'estimated') as niet_geschat
--   from cultural_dishes d join dish_ingredients i on i.dish_id = d.id
--   join dish_portions p on p.dish_id = d.id
--  where d.cuisine = 'syrisch';

-- 3. De ijkpunten. Dit hoort er te staan — gemeten op het echte schema, met
--    kal_gerecht's eigen rekenwijze (bereidingsvet maal zijn opnamefractie):
--
--      gerecht             kcal/100 g   standaardportie
--      sy-baklava             461       een stuk 40 g      184 kcal
--      sy-falafel             303       vier balletjes     303
--      sy-fattoush             87       bord 200 g         174
--      sy-hummus              320       eetlepel 25 g       80
--      sy-kibbeh              200       een kibbeh 65 g    130
--      sy-manakish            323       een manakish       420
--      sy-maqluba             155       bord 350 g         543
--      sy-moutabal            113       eetlepel 25 g       28
--      sy-mujadara            140       bord 300 g         420
--      sy-shawarma-brood      162       een broodje        535
--      sy-shorbat-adas         64       kom 250 g          161
--      sy-tabouleh             93       opscheplepel       93
--
--    De eerste twee kolommen zijn de proef. Wijkt de dichtheid af, dan is er een
--    code verschoven of een gram verkeerd overgenomen — niet een afronding.
--
--    Twee ervan zijn tijdens het schrijven bijgesteld omdat ze buiten hun
--    bereik uitkwamen, en dat hoort hier te staan omdat het laat zien waar de
--    hefbomen zitten. De soep gaf met een liter water 54 kcal per 100 g; dat is
--    bouillon met linzen erin. En de manakish gaf met 80 ml olie op vijf stuks
--    354 kcal per 100 g, zestien gram olie per brood. Water en olie zijn in deze
--    hoek de twee getallen die alles bepalen, en allebei zijn het schattingen.

-- select d.slug, p.label_nl, p.grams_estimate,
--        round(sum(i.grams_equivalent * case when i.is_preparation_fat
--                       then coalesce(i.absorbed_fraction,1) else 1 end
--                  / 100 * n.energie_kcal_per_100g)
--            / sum(i.grams_equivalent * case when i.is_preparation_fat
--                       then coalesce(i.absorbed_fraction,1) else 1 end) * 100) as kcal_per_100g
--   from cultural_dishes d
--   join dish_ingredients i on i.dish_id = d.id
--   join nevo_foods       n on n.nevo_code = i.external_food_id
--   join dish_portions    p on p.dish_id = d.id and p.is_default
--  where d.cuisine = 'syrisch'
--  group by d.slug, p.label_nl, p.grams_estimate
--  order by d.slug;

-- 4. En de hoek als geheel:

-- select cuisine, count(*) from cultural_dishes group by cuisine order by 2 desc;

-- Terugdraaien — op de slugs van dit bestand en niet op de keuken:
--
--   delete from cultural_dishes where slug like 'sy-%';
--
-- Zie bestand 24 voor waarom dat verschil ertoe doet: een terugdraairegel op de
-- keuken haalt ook weg wat er later door iemand anders bij is gezet.
-- (dish_ingredients en dish_portions gaan mee via on delete cascade)
