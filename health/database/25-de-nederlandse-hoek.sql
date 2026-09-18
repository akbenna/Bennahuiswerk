-- =============================================================================
-- DE NEDERLANDSE HOEK — en wat er wél en niet uit het RIVM-bestand kwam
--
-- Toestand onbekend: de kop zei lang "nog niet toegepast" en dat klopte
-- vermoedelijk niet meer. Kijk het na voordat je iets doet — het antwoord staat
-- in de database en niet in dit bestand:
--
--   select count(*) from cultural_dishes where slug like 'nl-%';
--
-- Staat daar nul, dan is dit bestand nog te draaien. Staat er iets, dan is het
-- gedraaid en hoort een toevoeging in een nieuw bestand: de terugdraairegel
-- onderaan raakt alles wat aan dit patroon voldoet.
--
-- EERST DE VERWARRING WEG: WAAR ZIJN DE RIVM-BESTANDEN?
--
-- Ze staan er, compleet. `nevo_versies` houdt dat bij:
--
--     versie            2025/9.0
--     aantal_items      2328
--     geimporteerd_op   12 augustus 2026
--     bronvermelding    "Gebaseerd op gegevens van NEVO-online versie
--                        2025/9.0, RIVM, Bilthoven"
--
-- Het hele bestand is die dag ingelezen met scripts/import-nevo.mjs --apply,
-- 2328 van 2328 rijen bruikbaar, nul overgeslagen. Er is dus niets zoek. De
-- CSV zelf staat niet in de repo — dat is de afspraak in CLAUDE.md — maar wat
-- eruit volgt staat in `nevo_foods` en is doorzoekbaar.
--
-- Wat leeg was, is iets anders: de gerechtenbibliotheek. Dat zijn twee
-- verschillende dingen en het loont om ze uit elkaar te houden.
--
--     nevo_foods        2328 voedingsmiddelen van het RIVM. Vooral
--                       ingrediënten, maar ook 83 samengestelde gerechten en
--                       29 soepen die als geheel zijn doorgemeten.
--
--     cultural_dishes   27 gerechten, met de hand gemaakt: 16 Marokkaanse,
--                       10 Turkse, 1 Nederlands concept. Wat een gerecht hier
--                       toevoegt boven een NEVO-regel is een náám die mensen
--                       intikken en een pórtie in huishoudmaten.
--
-- De bibliotheek is handwerk en had geen Nederlandse hoek. Het RIVM-bestand
-- had die wel — er stond stamppot, hachee, erwtensoep, tosti en kroket in,
-- allemaal doorgemeten, en de app kwam er niet bij omdat niemand ze een naam
-- en een portie had gegeven. Dat is wat dit bestand doet.
--
-- WAT ONDERBOUWD IS EN WAT NIET
--
-- Onderbouwd: alle voedingswaarden. Elk gerecht hieronder wijst naar één
-- NEVO-regel waarin het hele gerecht is gemeten — niet naar een optelsom van
-- ingrediënten die ik heb geschat. kal_gerecht() rekent daarmee; in dit
-- bestand staat geen enkel voedingsgetal.
--
-- Niet onderbouwd: de portiegewichten. Waar de maat voor de hand ligt — een
-- kroket, een tosti, een oliebol — is dat mijn schatting. Waar het om
-- opscheppen gaat, staat de maat van `voeding_portiematen` voor de NEVO-groep
-- waar het gerecht in valt: "Samengestelde gerechten" kent portie 250 g
-- (175–350) en "Soepen" kom 250 g (200–350). Die maten zijn er eerder gezet en
-- ook daar staat `gecontroleerd_door_dietist = false`. Een schatting van een
-- ander blijft een schatting; wat het niet is, is een schatting die ik er
-- vandaag bij heb verzonnen.
--
-- Daarom: gerecht `concept`, koppeling `ai_voorstel`, portie `estimated`. De
-- app toont ze als graad D. Naar 'validated' mag pas als een diëtist de
-- porties heeft nagelopen.
--
-- DE REFERENTIEHOEVEELHEID
--
-- Bij een recept is `default_servings` de opbrengst van de pan. Hier is er
-- geen pan: de regel is één kilo gerecht zoals NEVO het gemeten heeft. Het
-- getal is daarom uitgerekend en niet ingevuld — hoeveel standaardporties er
-- in een kilo gaan. Dat zegt iets, en het doet niet alsof het een recept is.
--
-- WAT ER NIET BIJ ZIT
--
-- Hutspot mét vlees. NEVO 1485 is de stamppot van wortel en ui zónder vlees,
-- en een versie mét bestaat niet in het bestand — anders dan bij boerenkool
-- en andijvie, waar beide varianten er staan. Dat is geen omissie hier maar
-- een gat in de bron, en het is beter dat gat te laten zien dan hem te vullen
-- met een getal dat ik zelf optel.
--
-- BLOK 2 is niet Nederlands en staat er apart om: bami, nasi, saté, pizza. Wat
-- er wekelijks gegeten wordt en wat uit de Nederlandse keuken komt zijn twee
-- lijsten. Ze hier door elkaar zetten zou de keuken `nederlands` onbruikbaar
-- maken als filter. Wie dit blok niet wil, laat het weg — blok 1 staat los.
--
-- Draaien mag meer dan eens: wat er al staat wordt overgeslagen, ook als de
-- diëtist het intussen heeft bijgewerkt.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- BLOK 1 — DE NEDERLANDSE KEUKEN
-- ---------------------------------------------------------------------------

with portie(slug, label, maat, icoon, schat, laag, hoog, std, volg, notitie) as (values
  -- warme maaltijd
  ('nl-stamppot-boerenkool-worst','Bord','bord','🥘',350::numeric,280::numeric,450::numeric,true,10,null::text),
  ('nl-stamppot-boerenkool-worst','Groot bord','bord','🥘',500,430,620,false,20,null),
  ('nl-stamppot-boerenkool-worst','Kleine portie','bord','🥘',220,170,280,false,30,null),
  ('nl-stamppot-boerenkool','Bord','bord','🥬',350,280,450,true,10,null),
  ('nl-stamppot-boerenkool','Groot bord','bord','🥬',500,430,620,false,20,null),
  ('nl-stamppot-andijvie-gehaktbal','Bord','bord','🥘',350,280,450,true,10,null),
  ('nl-stamppot-andijvie-gehaktbal','Groot bord','bord','🥘',500,430,620,false,20,null),
  ('nl-stamppot-andijvie','Bord','bord','🥬',350,280,450,true,10,null),
  ('nl-stamppot-andijvie','Groot bord','bord','🥬',500,430,620,false,20,null),
  ('nl-hutspot','Bord','bord','🥕',350,280,450,true,10,'Zonder vlees; de rookworst of het draadjesvlees log je er los bij.'),
  ('nl-hutspot','Groot bord','bord','🥕',500,430,620,false,20,null),
  ('nl-hutspot','Kleine portie','bord','🥕',220,170,280,false,30,null),
  ('nl-stamppot-zuurkool','Bord','bord','🥬',350,280,450,true,10,null),
  ('nl-stamppot-zuurkool','Groot bord','bord','🥬',500,430,620,false,20,null),
  ('nl-hachee','Opscheplepel','opscheplepel','🍲',150,110,200,true,10,'Hachee gaat naast de aardappelen; die log je er los bij.'),
  ('nl-hachee','Bord','bord','🍲',250,200,330,false,20,null),
  ('nl-goulash','Opscheplepel','opscheplepel','🍲',150,110,200,true,10,null),
  ('nl-goulash','Bord','bord','🍲',250,200,330,false,20,null),
  ('nl-ragout','Opscheplepel','opscheplepel','🍲',100,70,140,true,10,'Als vulling van een pasteitje of over toast.'),
  ('nl-ragout','Bord','bord','🍲',200,150,280,false,20,null),
  ('nl-witlof-ham-kaas','Stuk','stuk','🧀',250,200,320,true,10,null),
  ('nl-witlof-ham-kaas','Twee stuks','stuk','🧀',500,420,620,false,20,null),
  ('nl-spaghetti-bolognese','Bord','bord','🍝',350,280,450,true,10,null),
  ('nl-spaghetti-bolognese','Groot bord','bord','🍝',500,430,620,false,20,null),
  ('nl-pasta-carbonara','Bord','bord','🍝',350,280,450,true,10,null),
  ('nl-pasta-carbonara','Groot bord','bord','🍝',500,430,620,false,20,null),
  ('nl-lasagne-bolognese','Punt','punt','🍽️',300,240,400,true,10,null),
  ('nl-lasagne-bolognese','Grote punt','punt','🍽️',450,380,550,false,20,null),
  ('nl-lasagne-groenten','Punt','punt','🍽️',300,240,400,true,10,null),
  ('nl-lasagne-groenten','Grote punt','punt','🍽️',450,380,550,false,20,null),
  ('nl-risotto','Bord','bord','🍚',300,240,400,true,10,null),
  ('nl-risotto','Groot bord','bord','🍚',420,360,520,false,20,null),
  ('nl-quiche-lorraine','Punt','punt','🥧',150,120,200,true,10,null),
  ('nl-quiche-lorraine','Kleine punt','punt','🥧',90,70,120,false,20,null),
  ('nl-hartige-taart','Punt','punt','🥧',150,120,200,true,10,null),
  ('nl-hartige-taart','Kleine punt','punt','🥧',90,70,120,false,20,null),
  ('nl-paprika-gevuld','Stuk','stuk','🫑',220,180,280,true,10,null),
  ('nl-paprika-gevuld','Twee stuks','stuk','🫑',440,370,560,false,20,null),
  -- soep
  ('nl-erwtensoep','Kom','kom','🍲',250,200,350,true,10,'De maat van voeding_portiematen voor de groep Soepen.'),
  ('nl-erwtensoep','Grote kom','kom','🍲',400,350,500,false,20,null),
  ('nl-groentesoep-gebonden','Kom','kom','🍲',250,200,350,true,10,null),
  ('nl-groentesoep-gebonden','Grote kom','kom','🍲',400,350,500,false,20,null),
  ('nl-heldere-soep-vermicelli','Kom','kom','🍜',250,200,350,true,10,null),
  ('nl-heldere-soep-vermicelli','Kop','kop','🍜',150,120,200,false,20,null),
  ('nl-maaltijdsoep-peulvruchten','Kom','kom','🍲',350,280,450,true,10,'Maaltijdsoep, dus een kom groter dan een voorafje.'),
  ('nl-maaltijdsoep-peulvruchten','Kleine kom','kom','🍲',250,200,320,false,20,null),
  ('nl-tomatensoep','Kom','kom','🍅',250,200,350,true,10,null),
  ('nl-tomatensoep','Grote kom','kom','🍅',400,350,500,false,20,null),
  -- brood en lunch
  ('nl-tosti-ham-kaas','Een tosti','stuk','🥪',85,70,110,true,10,'Van bruin of volkoren brood; van witbrood ligt het iets hoger.'),
  ('nl-tosti-ham-kaas','Twee tosti''s','stuk','🥪',170,145,215,false,20,null),
  ('nl-broodje-gezond','Een broodje','stuk','🥖',150,120,200,true,10,null),
  ('nl-broodje-gezond','Half broodje','stuk','🥖',75,60,100,false,20,null),
  ('nl-wrap-kip','Een wrap','stuk','🌯',200,170,250,true,10,null),
  ('nl-wrap-kip','Twee wraps','stuk','🌯',400,340,500,false,20,null),
  ('nl-omelet-roerei','Portie','bord','🍳',150,120,200,true,10,'Ongeveer drie eieren.'),
  ('nl-omelet-roerei','Grote portie','bord','🍳',220,180,280,false,20,null),
  ('nl-omelet-ham-kaas','Portie','bord','🍳',160,130,210,true,10,null),
  ('nl-omelet-ham-kaas','Grote portie','bord','🍳',230,190,290,false,20,null),
  ('nl-huzarensalade','Opscheplepel','opscheplepel','🥗',100,70,150,true,10,null),
  ('nl-huzarensalade','Bord','bord','🥗',200,150,280,false,20,null),
  ('nl-eiersalade-maaltijd','Opscheplepel','opscheplepel','🥗',100,70,150,true,10,null),
  ('nl-eiersalade-maaltijd','Bord','bord','🥗',200,150,280,false,20,null),
  -- zoet en tussendoor
  ('nl-pannenkoek-appel-rozijn','Een pannenkoek','stuk','🥞',110,90,140,true,10,null),
  ('nl-pannenkoek-appel-rozijn','Twee pannenkoeken','stuk','🥞',220,185,280,false,20,null),
  ('nl-pannenkoek-kaas','Een pannenkoek','stuk','🥞',110,90,140,true,10,null),
  ('nl-pannenkoek-kaas','Twee pannenkoeken','stuk','🥞',220,185,280,false,20,null),
  ('nl-wentelteefje','Een wentelteefje','stuk','🍞',70,55,90,true,10,null),
  ('nl-wentelteefje','Twee wentelteefjes','stuk','🍞',140,115,180,false,20,null),
  ('nl-poffertjes','Bord','bord','🥞',100,75,140,true,10,'Een portie van twaalf.'),
  ('nl-poffertjes','Groot bord','bord','🥞',160,130,210,false,20,null),
  ('nl-oliebol','Een oliebol','stuk','🍩',80,65,100,true,10,null),
  ('nl-oliebol','Twee oliebollen','stuk','🍩',160,135,200,false,20,null),
  -- snackbar
  ('nl-patat-speciaal','Klein bakje','bord','🍟',175,150,250,true,10,null),
  ('nl-patat-speciaal','Groot bakje','bord','🍟',280,240,350,false,20,null),
  ('nl-kapsalon','Bak','bord','🍟',450,350,600,true,10,null),
  ('nl-kapsalon','Halve bak','bord','🍟',225,180,300,false,20,null),
  ('nl-kroket','Een kroket','stuk','🥐',70,60,85,true,10,'Gefrituurd. In de oven bereid ligt de energie een kwart lager.'),
  ('nl-kroket','Twee kroketten','stuk','🥐',140,120,170,false,20,null),
  ('nl-frikandel','Een frikandel','stuk','🌭',85,75,100,true,10,null),
  ('nl-frikandel','Twee frikandellen','stuk','🌭',170,150,200,false,20,null),
  ('nl-bitterbal','Een bitterbal','stuk','🍘',20,15,25,true,10,null),
  ('nl-bitterbal','Acht bitterballen','stuk','🍘',160,120,200,false,20,null),
  ('nl-kaassouffle','Een kaassouffle','stuk','🧀',75,65,90,true,10,null),
  ('nl-kaassouffle','Twee kaassouffles','stuk','🧀',150,130,180,false,20,null),
  ('nl-broodje-hamburger','Een broodje','stuk','🍔',180,150,230,true,10,null),
  ('nl-loempia','Een loempia','stuk','🥠',120,100,150,true,10,null),
  ('nl-loempia','Twee loempia''s','stuk','🥠',240,200,300,false,20,null)
),
gerecht(slug, naam, namen, omschrijving, momenten, nevo) as (values
  ('nl-stamppot-boerenkool-worst','Stamppot boerenkool met rookworst',
   '{"nl":["boerenkool","stamppot boerenkool","boerenkool met worst","boerenkoolstamppot"]}',
   'Boerenkool door de aardappelpuree, met rookworst en spekjes. Als geheel gemeten door het RIVM.',
   array['avondeten'],'5401'),
  ('nl-stamppot-boerenkool','Stamppot boerenkool zonder vlees',
   '{"nl":["boerenkool zonder vlees","vegetarische boerenkool","stamppot boerenkool"]}',
   'Boerenkool door de aardappelpuree, zonder vlees. Als geheel gemeten door het RIVM.',
   array['avondeten'],'1483'),
  ('nl-stamppot-andijvie-gehaktbal','Stamppot andijvie met gehaktbal',
   '{"nl":["andijviestamppot","stamppot andijvie","andijvie met gehaktbal","rauwe andijvie"]}',
   'Rauwe andijvie door de aardappelpuree, met gehaktbal en spekjes. Als geheel gemeten door het RIVM.',
   array['avondeten'],'5402'),
  ('nl-stamppot-andijvie','Stamppot andijvie zonder vlees',
   '{"nl":["andijvie zonder vlees","vegetarische andijviestamppot","stamppot andijvie"]}',
   'Rauwe andijvie door de aardappelpuree, zonder vlees. Als geheel gemeten door het RIVM.',
   array['avondeten'],'1531'),
  ('nl-hutspot','Hutspot',
   '{"nl":["hutspot","stamppot wortel en ui","wortelstamppot","hutspot met wortel en ui"]}',
   'Wortel en ui door de aardappelpuree. Het RIVM heeft alleen de versie zonder vlees gemeten; rookworst of draadjesvlees log je er los bij.',
   array['avondeten'],'1485'),
  ('nl-stamppot-zuurkool','Stamppot zuurkool',
   '{"nl":["zuurkool","zuurkoolstamppot","stamppot zuurkool"]}',
   'Zuurkool door de aardappelpuree, zonder vlees. Als geheel gemeten door het RIVM.',
   array['avondeten'],'1486'),
  ('nl-hachee','Hachee',
   '{"nl":["hachee","hachee met uien","rundvleesstoof"]}',
   'Rundvlees langzaam gestoofd met ui, azijn en kruidnagel. Als geheel gemeten door het RIVM.',
   array['avondeten'],'5329'),
  ('nl-goulash','Goulash',
   '{"nl":["goulash","goulashsoep","paprikastoof"]}',
   'Rundvleesstoof met paprikapoeder. Als geheel gemeten door het RIVM.',
   array['avondeten'],'788'),
  ('nl-ragout','Ragout met vlees',
   '{"nl":["ragout","vleesragout","pasteivulling","kippenragout"]}',
   'Gebonden vleessaus, als vulling van een pasteitje of over toast. Als geheel gemeten door het RIVM.',
   array['avondeten','lunch'],'787'),
  ('nl-witlof-ham-kaas','Witlof met ham en kaas uit de oven',
   '{"nl":["witlof met ham en kaas","witlofschotel","gegratineerde witlof"]}',
   'Gekookte witlof in ham gerold, met kaassaus gegratineerd. Als geheel gemeten door het RIVM.',
   array['avondeten'],'5317'),
  ('nl-spaghetti-bolognese','Spaghetti bolognese met kaas',
   '{"nl":["spaghetti","spaghetti bolognese","pasta bolognese","spaghetti met gehaktsaus"]}',
   'Zelfgemaakte spaghetti bolognese met geraspte kaas. Als geheel gemeten door het RIVM.',
   array['avondeten'],'5531'),
  ('nl-pasta-carbonara','Pasta carbonara',
   '{"nl":["carbonara","pasta carbonara","spaghetti carbonara"]}',
   'Zelfgemaakte carbonara met spek, ei en kaas. Als geheel gemeten door het RIVM.',
   array['avondeten'],'5393'),
  ('nl-lasagne-bolognese','Lasagne bolognese',
   '{"nl":["lasagne","lasagne bolognese","lasagna"]}',
   'Koelverse lasagne met gehaktsaus. Als geheel gemeten door het RIVM.',
   array['avondeten'],'1491'),
  ('nl-lasagne-groenten','Groentelasagne',
   '{"nl":["groentelasagne","vegetarische lasagne","lasagne groenten"]}',
   'Koelverse lasagne met groenten. Als geheel gemeten door het RIVM.',
   array['avondeten'],'5458'),
  ('nl-risotto','Risotto',
   '{"nl":["risotto","risottorijst"]}',
   'Romig gekookte risottorijst. Als geheel gemeten door het RIVM.',
   array['avondeten'],'5359'),
  ('nl-quiche-lorraine','Quiche lorraine',
   '{"nl":["quiche","quiche lorraine","hartige taart met spek"]}',
   'Hartige taart van korstdeeg met spek, ei en room. Als geheel gemeten door het RIVM.',
   array['lunch','avondeten'],'5398'),
  ('nl-hartige-taart','Hartige taart met groente, kaas en ei',
   '{"nl":["hartige taart","groentetaart","bladerdeegtaart"]}',
   'Hartige taart van bladerdeeg met groente, kaas en ei. Als geheel gemeten door het RIVM.',
   array['lunch','avondeten'],'1533'),
  ('nl-paprika-gevuld','Gevulde paprika met gehakt',
   '{"nl":["gevulde paprika","paprika met gehakt","gevulde paprikas"]}',
   'Paprika gevuld met gehakt, uit de oven. Als geheel gemeten door het RIVM.',
   array['avondeten'],'5337'),
  ('nl-erwtensoep','Erwtensoep met vlees',
   '{"nl":["erwtensoep","snert","erwtensoep met rookworst"]}',
   'Dikke erwtensoep met vlees. Als geheel gemeten door het RIVM.',
   array['avondeten','lunch'],'5177'),
  ('nl-groentesoep-gebonden','Gebonden groentesoep',
   '{"nl":["groentesoep","gebonden soep","soep met soepgroente"]}',
   'Gebonden soep met soepgroente. Als geheel gemeten door het RIVM.',
   array['lunch','avondeten'],'763'),
  ('nl-heldere-soep-vermicelli','Heldere soep met vlees, groente en vermicelli',
   '{"nl":["heldere soep","vermicellisoep","kippensoep","soep met balletjes"]}',
   'Heldere bouillon met vlees, soepgroente en vermicelli. Als geheel gemeten door het RIVM.',
   array['lunch','avondeten'],'762'),
  ('nl-maaltijdsoep-peulvruchten','Maaltijdsoep met peulvruchten en vlees',
   '{"nl":["maaltijdsoep","bonensoep","linzensoep met vlees"]}',
   'Dikke maaltijdsoep met peulvruchten en vlees. Als geheel gemeten door het RIVM.',
   array['avondeten','lunch'],'766'),
  ('nl-tomatensoep','Tomatensoep met vermicelli',
   '{"nl":["tomatensoep","tomatensoep met balletjes","tomatensoep met vermicelli"]}',
   'Tomatensoep met vermicelli. Als geheel gemeten door het RIVM.',
   array['lunch','avondeten'],'5062'),
  ('nl-tosti-ham-kaas','Tosti ham-kaas',
   '{"nl":["tosti","tosti ham kaas","tostie","gegrilde boterham"]}',
   'Tosti van bruin of volkoren brood met ham en kaas. Als geheel gemeten door het RIVM.',
   array['lunch','tussendoor'],'5534'),
  ('nl-broodje-gezond','Broodje gezond',
   '{"nl":["broodje gezond","gezond","broodje met kaas ham en ei"]}',
   'Wit broodje met kaas, ham, ei en rauwkost. Als geheel gemeten door het RIVM.',
   array['lunch'],'5352'),
  ('nl-wrap-kip','Wrap met kip',
   '{"nl":["wrap","wrap kip","kipwrap","tortillawrap"]}',
   'Tortillawrap gevuld met kip en groente. Als geheel gemeten door het RIVM.',
   array['lunch'],'5363'),
  ('nl-omelet-roerei','Omelet of roerei',
   '{"nl":["omelet","roerei","eieren","gebakken ei"]}',
   'Omelet of roerei, zonder vulling. Als geheel gemeten door het RIVM.',
   array['ontbijt','lunch'],'5321'),
  ('nl-omelet-ham-kaas','Omelet met ham en kaas',
   '{"nl":["omelet ham kaas","ham-kaasomelet","gevulde omelet"]}',
   'Omelet met ham en kaas. Als geheel gemeten door het RIVM.',
   array['ontbijt','lunch'],'5322'),
  ('nl-huzarensalade','Huzarensalade',
   '{"nl":["huzarensalade","huzarensla","aardappelsalade met vlees"]}',
   'Huzarensalade van aardappel, groente en vlees in mayonaise. Als geheel gemeten door het RIVM.',
   array['lunch'],'577'),
  ('nl-eiersalade-maaltijd','Eiersalade',
   '{"nl":["eiersalade","eisalade","salade met ei"]}',
   'Maaltijdsalade met ei. Als geheel gemeten door het RIVM.',
   array['lunch'],'2948'),
  ('nl-pannenkoek-appel-rozijn','Pannenkoek met appel en rozijnen',
   '{"nl":["pannenkoek","pannekoek","appelpannenkoek","pannenkoek met appel"]}',
   'Zelfgebakken pannenkoek met appel en rozijnen. Als geheel gemeten door het RIVM.',
   array['avondeten','tussendoor'],'2862'),
  ('nl-pannenkoek-kaas','Pannenkoek met kaas',
   '{"nl":["kaaspannenkoek","pannenkoek met kaas","pannekoek kaas"]}',
   'Zelfgebakken pannenkoek met kaas. Als geheel gemeten door het RIVM.',
   array['avondeten','tussendoor'],'2859'),
  ('nl-wentelteefje','Wentelteefje',
   '{"nl":["wentelteefje","verloren brood","gewelde boterham"]}',
   'Witbrood door ei en melk gehaald en gebakken. Als geheel gemeten door het RIVM.',
   array['ontbijt','tussendoor'],'5378'),
  ('nl-poffertjes','Poffertjes',
   '{"nl":["poffertjes","poffertje"]}',
   'Zelfgebakken poffertjes. Als geheel gemeten door het RIVM; boter en poedersuiker log je er los bij.',
   array['tussendoor'],'5597'),
  ('nl-oliebol','Oliebol met krenten en rozijnen',
   '{"nl":["oliebol","oliebollen","gevulde oliebol"]}',
   'Gefrituurde oliebol met krenten en rozijnen. Als geheel gemeten door het RIVM.',
   array['tussendoor','feest'],'474'),
  ('nl-patat-speciaal','Patat speciaal',
   '{"nl":["patat","friet","patatje speciaal","frites speciaal","patat met"]}',
   'Frites met mayonaise, curry en ui. Als geheel gemeten door het RIVM.',
   array['avondeten','tussendoor'],'5394'),
  ('nl-kapsalon','Kapsalon',
   '{"nl":["kapsalon","frites kapsalon"]}',
   'Frites met shoarma, kaas, sla en saus. Als geheel gemeten door het RIVM.',
   array['avondeten'],'5396'),
  ('nl-kroket','Vleeskroket',
   '{"nl":["kroket","vleeskroket","broodje kroket"]}',
   'Gefrituurde vleeskroket. Als geheel gemeten door het RIVM.',
   array['lunch','tussendoor'],'326'),
  ('nl-frikandel','Frikandel',
   '{"nl":["frikandel","frikadel","frituurworst"]}',
   'Gefrituurde frikandel. Als geheel gemeten door het RIVM.',
   array['avondeten','tussendoor'],'322'),
  ('nl-bitterbal','Bitterbal',
   '{"nl":["bitterbal","bitterballen","borrelhapje"]}',
   'Gefrituurde bitterbal. Als geheel gemeten door het RIVM.',
   array['tussendoor','feest'],'5560'),
  ('nl-kaassouffle','Kaassouffle',
   '{"nl":["kaassouffle","kaassoufflé","kaassouflee"]}',
   'Gefrituurde kaassouffle. Als geheel gemeten door het RIVM.',
   array['tussendoor'],'3075'),
  ('nl-broodje-hamburger','Broodje hamburger',
   '{"nl":["hamburger","broodje hamburger","burger"]}',
   'Zelfgemaakt broodje hamburger. Als geheel gemeten door het RIVM.',
   array['avondeten','lunch'],'5355'),
  ('nl-loempia','Loempia',
   '{"nl":["loempia","lumpia","gefrituurde loempia"]}',
   'Gefrituurde loempia. Als geheel gemeten door het RIVM.',
   array['avondeten','tussendoor'],'369')
),
nieuw as (
  insert into public.cultural_dishes
    (slug, name_nl, names, cuisine, description_nl, meal_moments,
     default_servings, validation_status)
  select g.slug, g.naam, g.namen::jsonb, 'nederlands', g.omschrijving, g.momenten,
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
  select n.id, 10, 'Het hele gerecht, zoals het RIVM het gemeten heeft', 'overig',
         1000, 'g', 1000, 'nevo', g.nevo,
         'NEVO ' || g.nevo || ' is het complete gerecht en geen onderdeel ervan. '
         || 'De energie per gram komt dus uit een meting van dit gerecht; alleen '
         || 'het portiegewicht is geschat.'
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
-- BLOK 2 — WAT ER IN NEDERLAND OP TAFEL STAAT MAAR NIET NEDERLANDS IS
-- ---------------------------------------------------------------------------
--
-- Keuken `overig`, en dat is geen restcategorie maar een weigering om het
-- anders te noemen. Bami staat wekelijks op tafel en is niet Nederlands; de
-- keuken die het wél is heeft de bibliotheek nog niet.

with portie(slug, label, maat, icoon, schat, laag, hoog, std, volg, notitie) as (values
  ('ov-bami-goreng','Bord','bord','🍜',350::numeric,280::numeric,450::numeric,true,10,null::text),
  ('ov-bami-goreng','Groot bord','bord','🍜',500,430,620,false,20,null),
  ('ov-nasi-goreng','Bord','bord','🍚',350,280,450,true,10,null),
  ('ov-nasi-goreng','Groot bord','bord','🍚',500,430,620,false,20,null),
  ('ov-babi-pangang','Opscheplepel','opscheplepel','🍖',150,110,200,true,10,'Zonder rijst; die log je er los bij.'),
  ('ov-babi-pangang','Bord','bord','🍖',250,200,330,false,20,null),
  ('ov-foe-yong-hai','Stuk','stuk','🍳',200,160,260,true,10,'Zonder rijst.'),
  ('ov-foe-yong-hai','Bord','bord','🍳',300,250,380,false,20,null),
  ('ov-tjap-tjoi','Opscheplepel','opscheplepel','🥬',150,110,200,true,10,'Zonder rijst.'),
  ('ov-tjap-tjoi','Bord','bord','🥬',250,200,330,false,20,null),
  ('ov-sate-kip','Portie met saus','bord','🍢',150,120,200,true,10,'Twee stokjes met satésaus.'),
  ('ov-sate-kip','Grote portie','bord','🍢',250,200,320,false,20,null),
  ('ov-gado-gado','Bord','bord','🥗',250,200,330,true,10,'Zonder rijst en zonder ei.'),
  ('ov-gado-gado','Groot bord','bord','🥗',350,300,450,false,20,null),
  ('ov-pizza-margherita','Punt','punt','🍕',75,60,95,true,10,null),
  ('ov-pizza-margherita','Hele pizza','stuk','🍕',300,250,400,false,20,null),
  ('ov-chili-con-carne','Bord','bord','🌶️',300,240,400,true,10,null),
  ('ov-chili-con-carne','Opscheplepel','opscheplepel','🌶️',150,110,200,false,20,null),
  ('ov-griekse-salade','Bord','bord','🥗',200,150,280,true,10,'Zonder dressing.'),
  ('ov-griekse-salade','Klein bord','bord','🥗',120,90,160,false,20,null)
),
gerecht(slug, naam, namen, omschrijving, momenten, nevo) as (values
  ('ov-bami-goreng','Bami goreng',
   '{"nl":["bami","bami goreng","gebakken mie"]}',
   'Gebakken mie met groente en vlees, zonder ei. Als geheel gemeten door het RIVM.',
   array['avondeten','lunch'],'470'),
  ('ov-nasi-goreng','Nasi goreng met ei',
   '{"nl":["nasi","nasi goreng","gebakken rijst"]}',
   'Gebakken rijst met groente, vlees en ei. Als geheel gemeten door het RIVM.',
   array['avondeten','lunch'],'471'),
  ('ov-babi-pangang','Babi pangang',
   '{"nl":["babi pangang","babi","varkensvlees in zoetzure saus"]}',
   'Varkensvlees in zoetzure saus, zonder rijst. Als geheel gemeten door het RIVM.',
   array['avondeten'],'469'),
  ('ov-foe-yong-hai','Foe yong hai',
   '{"nl":["foe yong hai","foeyonghai","omelet in tomatensaus"]}',
   'Omelet met groente in zoetzure tomatensaus, zonder rijst. Als geheel gemeten door het RIVM.',
   array['avondeten'],'473'),
  ('ov-tjap-tjoi','Tjap tjoi',
   '{"nl":["tjap tjoi","tjaptjoi","roergebakken groente"]}',
   'Roergebakken groente met vlees, zonder rijst. Als geheel gemeten door het RIVM.',
   array['avondeten'],'472'),
  ('ov-sate-kip','Kipsaté met satésaus',
   '{"nl":["sate","saté","kipsate","satesaus","saté met pindasaus"]}',
   'Kipsaté met satésaus. Als geheel gemeten door het RIVM.',
   array['avondeten','lunch'],'865'),
  ('ov-gado-gado','Gado gado',
   '{"nl":["gado gado","gadogado","groente met pindasaus"]}',
   'Groente met pindasaus, zonder rijst en zonder ei. Als geheel gemeten door het RIVM.',
   array['avondeten'],'853'),
  ('ov-pizza-margherita','Pizza margherita',
   '{"nl":["pizza","pizza margherita","margherita"]}',
   'Pizza met mozzarella en tomaat. Als geheel gemeten door het RIVM.',
   array['avondeten','lunch'],'5432'),
  ('ov-chili-con-carne','Chili con carne',
   '{"nl":["chili con carne","chili","bonen met gehakt"]}',
   'Gehakt met bonen, tomaat en chili. Als geheel gemeten door het RIVM.',
   array['avondeten'],'1595'),
  ('ov-griekse-salade','Griekse salade',
   '{"nl":["griekse salade","griekse sla","salade met feta"]}',
   'Salade met feta, komkommer, tomaat en olijf, zonder dressing. Als geheel gemeten door het RIVM.',
   array['lunch','avondeten'],'5358')
),
nieuw as (
  insert into public.cultural_dishes
    (slug, name_nl, names, cuisine, description_nl, meal_moments,
     default_servings, validation_status)
  select g.slug, g.naam, g.namen::jsonb, 'overig', g.omschrijving, g.momenten,
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
  select n.id, 10, 'Het hele gerecht, zoals het RIVM het gemeten heeft', 'overig',
         1000, 'g', 1000, 'nevo', g.nevo,
         'NEVO ' || g.nevo || ' is het complete gerecht en geen onderdeel ervan. '
         || 'De energie per gram komt dus uit een meting van dit gerecht; alleen '
         || 'het portiegewicht is geschat.'
    from nieuw n join gerecht g on g.slug = n.slug
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
-- 1. Wijst elke code naar een bestaande tabelregel? Nul rijen is goed. Dit is
--    de proef die een typefout in een NEVO-code vangt, en dat is de fout die
--    hier het makkelijkst te maken is.

-- select d.slug, i.external_food_id
--   from dish_ingredients i
--   join cultural_dishes d on d.id = i.dish_id
--  where (d.slug like 'nl-%' or d.slug like 'ov-%')
--    and not exists (select 1 from nevo_foods n where n.nevo_code = i.external_food_id);

-- 2. Heeft elk gerecht precies één ingrediënt en minstens één standaardportie?
--    Alles moet op 1 staan; een 0 of een 2 is fout.

-- select d.slug,
--        count(distinct i.id)                            as ingredienten,
--        count(distinct p.id) filter (where p.is_default) as standaardporties
--   from cultural_dishes d
--   left join dish_ingredients i on i.dish_id = d.id
--   left join dish_portions    p on p.dish_id = d.id
--  where d.cuisine in ('nederlands','overig')
--  group by d.slug
-- having count(distinct i.id) <> 1
--     or count(distinct p.id) filter (where p.is_default) <> 1;

-- 3. Dragen alle nieuwe rijen het merkteken van niet-nagekeken inhoud?
--    Alle drie de kolommen horen nul te zijn.

-- select count(*) filter (where d.validation_status <> 'concept')     as niet_concept,
--        count(*) filter (where i.mapping_status <> 'ai_voorstel')    as niet_voorstel,
--        count(*) filter (where p.measurement_basis <> 'estimated')   as niet_geschat
--   from cultural_dishes d
--   join dish_ingredients i on i.dish_id = d.id
--   join dish_portions    p on p.dish_id = d.id
--  where d.cuisine in ('nederlands','overig');

-- 4. Wat een standaardportie oplevert. Zes ijkpunten om met de hand te toetsen:
--
--     nl-stamppot-boerenkool-worst   bord 350 g      480 kcal
--     nl-hutspot                     bord 350 g      221
--     nl-erwtensoep                  kom  250 g      193
--     nl-tosti-ham-kaas              stuk  85 g      209
--     nl-kroket                      stuk  70 g      190
--     nl-patat-speciaal              bakje 175 g     436
--
-- Wijkt een van deze af, dan is er een code verschoven — niet een afronding.

-- select d.slug, p.label_nl, p.grams_estimate,
--        round(n.energie_kcal_per_100g / 100 * p.grams_estimate) as kcal
--   from cultural_dishes d
--   join dish_ingredients i on i.dish_id = d.id
--   join nevo_foods       n on n.nevo_code = i.external_food_id
--   join dish_portions    p on p.dish_id = d.id and p.is_default
--  where d.cuisine in ('nederlands','overig')
--  order by d.cuisine, d.slug;

-- 5. En de hoek als geheel:

-- select cuisine, count(*) from cultural_dishes group by cuisine order by 2 desc;

-- Terugdraaien:
--   delete from cultural_dishes where slug like 'nl-%' or slug like 'ov-%';
-- (dish_ingredients en dish_portions gaan mee via on delete cascade)
