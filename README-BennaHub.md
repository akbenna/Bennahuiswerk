# BennaHub

Eén startpagina, negen apps. Elke app houdt zijn eigen map en dus zijn eigen
adres; er is geen router en geen app weet van de andere.

**De repo wordt verbouwd naar React 18 + Vite + TypeScript.** Dat gebeurt app
voor app, en welke er al om is staat in `vite.config.ts` in twee lijsten. Wat nog
niet is omgebouwd draait onveranderd als los HTML-bestand en gaat zo mee naar de
bouw; er is dus geen moment waarop de site half stuk staat. Zie BUILD.md voor
hoe je bouwt en waarom er nu wél een bouwstap is.

Alle negen apps zijn om: de startpagina, `health/`, `spellen/`, `rasikh/`, `sanad/`, `bunyan/`, `noer/`, `arabisch/` en `huiswerk/`.

```
index.html          de startpagina: aanmelden, de apps van die persoon, ouderoverzicht
huiswerk/index.html Huiswerk — oefenen voor school
                      de Vite-ingang; de app zelf staat in src/huiswerk/
public/huiswerk/    de losse pagina's die geen deel van de app zijn:
                      voxelsandbox.html, verkeersschool.html en cursussen/
noer/index.html     Islam leren — de basis van de islam en leren bidden (7–15 jaar)
                      de Vite-ingang; de app zelf staat in src/noer/
arabisch/index.html Arabisch — lezen, begrijpen en spreken, met een jaarprogramma
                      de Vite-ingang; de app zelf staat in src/arabisch/
bunyan/index.html   Computers & Code — een pc bouwen en leren programmeren (vanaf 10)
                      de Vite-ingang; de app zelf staat in src/bunyan/
spellen/index.html  Spelletjes — de speelhoek, los van de huiswerkapp
sanad/index.html    Geloofsstudie — achtentwintig weken islamitische wetenschappen
                      de Vite-ingang; de app zelf staat in src/sanad/
rasikh/             Koran uit je hoofd — memoriseren en vasthouden (voor volwassenen)
  index.html          de app
  tekst/              de hele Koran: 114 soera's, 6236 aya, plus de verwarpunten
  audio/              recitatie per aya, op te halen met het script dat er staat
health/             BennaHealth — verbruik gemeten uit de gewichtstrend (volwassenen)
  index.html          de Vite-ingang; de app zelf staat in src/health/
  VERANTWOORDING.md   elke rekenregel met zijn bron en zijn beperking
  AUTOMATISERING.md   wat er vanzelf draait: de ochtendprikkel en het opruimen
  database/           de SQL die naast de app hoort, in volgorde genummerd
src/
  gedeeld/db/         de getypte databasegrens: dertig functies, één keer
  start/              de startpagina: de poort, de tegels, het ouderoverzicht
  gedeeld/            datum- en getalhulp die alle apps kunnen gebruiken
  gedeeld/wolk.ts     aanmelden en bewaren voor de apps die dat delen
  health/             rekenkern, klinische modules, zes schermen, vier vensters
    rekenkern.proef.ts  171 vergelijkingen tegen de oude, verantwoorde uitkomsten
  spellen/            dertien spellen, de opslag en het samenvoegen
  rasikh/             de herhalingsplanner, de tekst, de recitatie, zes schermen
    planning.proef.ts   118 vergelijkingen tegen de oude planner
  sanad/              het programma, de kaartplanner, zeven schermen
    gegevens/           de leerstof: curriculum, kaarten, bronnen, lexicon, matn
    sanad.proef.ts      30 vergelijkingen tegen de oude app, stof én planner
  bunyan/             twee leersporen, de bouwbank, de beloning, zes schermen
    minipy/             een kleine Python: woorden, ontleden, uitvoeren
    minipy.proef.ts     132 programma's tegen de oude vertaler, 66 met een fout
    bunyan.proef.ts     29 vergelijkingen: stof, punten, samenvoegen, bouwbank
  noer/               profielen per kind, het leerpad, het gebed, de gebedstijden
    gebedstijden.ts     de stand van de zon: juliaanse dag, declinatie, uurhoek
    gebedstijden.proef.ts  1344 tijden tegen de oude app, zeven plaatsen
    noer.proef.ts       33 vergelijkingen: stof, kaarten, missie, insignes
public/               fonts, iconen, en de statische bestanden per app
gereedschap/          de bouw- en proefscripts, en de oude app als ijkpunt
iconen/             één pictogram per app, plus het script dat er PNG's van maakt
fonts/              Amiri, het Arabische lettertype van alle apps
```

## De namen

De apps heetten eerst Noer Islam, Lisan, Bunyan, Raha, Sanad en Rasikh. Mooie
namen, en ze staan er nog — klein, naast de nieuwe. Maar een kind van acht dat
op een telefoon de juiste tegel zoekt heeft er niets aan: het moet eerst weten
wat het woord betekent voordat het weet wat de app doet. De naam is nu wat de
app ís, in het Nederlands.

| Map | Nu | Heette | Op het beginscherm |
|---|---|---|---|
| `huiswerk/` | Huiswerk | Bennaghmouch Oefenclub | Huiswerk |
| `noer/` | Islam leren | Noer Islam · نور الإسلام | Islam |
| `arabisch/` | Arabisch | Lisan · لِسَان | Arabisch |
| `bunyan/` | Computers & Code | Bunyan · بُنْيَان | Computers |
| `spellen/` | Spelletjes | Raha · رَاحَة | Spelletjes |
| `sanad/` | Geloofsstudie | Sanad · سند | Geloofsstudie |
| `rasikh/` | Koran uit je hoofd | Rasikh · رَاسِخ | Koran |
| `health/` | BennaHealth | Kalibratie · Energiebalans | BennaHealth |

De mapnamen zijn niet meegegaan. Die staan in bladwijzers, in service workers,
in opgeslagen accounts en in het pad van elke opname die al ingesproken is; ze
hernoemen levert een dag opruimen op en niets extra's voor wie de app opent.

De oude naam staat op de startpagina onder de nieuwe, en in elke app naast het
merk in de bovenbalk — meestal in het Arabisch, want dáár betekent hij iets.

## De pictogrammen

Elke app heeft er nu een eigen, in zijn eigen kleur: `iconen/`. Daarvoor deelden
ze allemaal dezelfde lachende ster, en dan staan er op een beginscherm acht
identieke tegels naast elkaar. De tegels op de startpagina zijn precies dezelfde
bestanden, zodat wat je hier aanwijst hetzelfde is als wat je daar terugvindt.

Van elk pictogram staat er ook een PNG van 180×180, want iOS zet geen SVG op het
beginscherm. Verander je een SVG, draai dan `node iconen/maak-png.mjs` en commit
beide bestanden samen. Zie `iconen/LEESMIJ.md`.

De indeling van de startpagina volgt dezelfde gedachte: bovenaan de vijf apps van
de kinderen, daaronder de drie van de groten.

Eén tegel wijkt bewust af. BennaHealth is leisteengrijs, de enige onverzadigde
kleur van de acht. De zeven leerapps zijn gekleurd omdat een kind een tegel moet
kunnen herkennen voordat het vlot leest; die app is een meetinstrument voor een
volwassene en mag daar op het beginscherm ook naar uitzien.

## Het Arabische lettertype

Amiri staat als bestand in `fonts/` en komt niet meer van Google. Dat is geen
netheid maar noodzaak: de Warsh-druk gebruikt tekens die de meeste
systeemletters niet kennen — de kleine hoge nul boven de hamzat wasl (U+06EC)
staat in bijna elke aya — en een letter die dat teken mist laat een leeg vak
achter. Dan vallen er gaten midden in woorden en klopt de tekst niet meer met
wat er staat. Zonder verbinding gebeurde dat overal.

Elke app zet het lettertype nu zelf met een `@font-face` bovenaan het stijlblok
en haalt alleen de Latijnse letters nog bij Google. Zie `fonts/LEESMIJ.md` voor
de herkomst, de licentie en hoe je het vervangt.

## Aanmelden op de startpagina

Tot nu toe had elke app zijn eigen inlog en zijn eigen ouderscherm: zeven keer
ergens een naam en een wachtwoord, en nergens één plek waar je zag hoe het
ervoor stond. Binnen een gezinsaccount kon je bovendien gewoon het profiel van
je zus aanklikken — "eigen account" was een afspraak, geen slot.

Nu meldt iedereen zich op de startpagina. Je kiest je eigen tegel, typt je
wachtwoord, en krijgt daarna de apps te zien die voor jou bedoeld zijn:

- **kinderen** zien de vijf apps van de kinderen;
- **ouders** zien alles, plus een knop naar het overzicht;
- per lid kan daarvan worden afgeweken (`apps` op het lid): staat daar een lijst
  in, dan is dát de hele lijst. Zo kun je Amaani alleen het huiswerk en het
  Arabisch geven zonder de anderen erbij.

De aanmelding blijft acht uur staan en verloopt daarna vanzelf — op een gedeelde
tablet blijft anders het account van 's ochtends de hele avond openstaan.

### Het ouderoverzicht

Achter *Overzicht* staat alles van alle apps op één pagina: wat er nog open staat
aan zakgeld en bij wie, wie er wanneer voor het laatst is geweest, en per app een
tabel met punten, lessen en verdiensten. Elke app bewaart zijn voortgang in zijn
eigen vorm; er is geen gemeenschappelijk formaat en dat is ook niet afgedwongen.
In plaats daarvan staat er per app een kleine uitlezer (`UITLEZERS` in
`index.html`) die er het antwoord uit haalt op de twee vragen die je echt stelt:
heeft iemand iets gedaan, en hoeveel staat er open.

Vanaf hetzelfde scherm kun je het ouderwachtwoord wijzigen en het wachtwoord van
een kind **resetten**. Dat wist alleen het wachtwoord: de voortgang blijft staan,
en bij de volgende aanmelding kiest het kind zelf een nieuw wachtwoord. Je hoeft
er dus niets voor te onthouden en niemand raakt iets kwijt.

### Wachtwoorden

Iedereen staat op `Bennaclan`, hetzelfde wachtwoord dat de huiswerkapp al
gebruikt. Wie wil, zet er via *Wachtwoord* zijn eigen op. Er is nu ook een weg
terug als iemand het kwijtraakt — die ontbrak: `bennahub_wachtwoord` voor een
app-account, en *Resetten* voor een gezinslid.

### De tabellen

| tabel | wat |
|---|---|
| `bennahub_gezin` | één rij per gezin, met het ouderwachtwoord |
| `bennahub_leden` | één rij per persoon: rol, wachtwoord, emoji, kleur, welke apps |
| `bennahub_state` | de voortgang per app (bestond al) |

Alle drie zijn voor `anon` dicht; alles loopt via `SECURITY DEFINER`-functies en
geen enkele functie geeft ooit een hash terug.

| functie | doet |
|---|---|
| `bennahub_gezin_start` | het gezin één keer opzetten |
| `bennahub_leden_lijst` | de tegels op de startpagina — namen, verder niets |
| `bennahub_lid_aanmelden` | aanmelden; wie nog geen wachtwoord heeft, kiest er hier een |
| `bennahub_lid_code` | je eigen wachtwoord wijzigen |
| `bennahub_lid_zet` / `_reset` | beheer, alleen met het ouderwachtwoord |
| `bennahub_gezin_wachtwoord` | het ouderwachtwoord wijzigen |
| `bennahub_overzicht` | alles van alle apps, alleen voor de ouder |
| `bennahub_wachtwoord` | het wachtwoord van een app-account wijzigen |

**De apps zelf hebben hun eigen inlog nog.** Dat is met opzet: eerst deze poort
erbij zetten en gebruiken, daarna de apps er één voor één op aansluiten. Zo werkt
er onderweg niets niet meer. De startpagina zet al wel `bennahub.wie` in
`localStorage`, zodat een app straks kan zien wie er is aangemeld.

## Centrale opslag

Islam leren, Geloofsstudie, Arabisch en BennaHealth slaan voortgang op in `localStorage` én centraal, zodat je op elk
toestel verder gaat waar je gebleven was. De opslag loopt via het bestaande
Supabase-project, tabel `bennahub_state`, met vier `SECURITY DEFINER`-functies:

| functie | doet |
|---|---|
| `bennahub_register(app, account, pin, data)` | account aanmaken |
| `bennahub_load(app, account, pin)` | ophalen |
| `bennahub_save(app, account, pin, data)` | wegschrijven |
| `bennahub_accounts(app)` | namen opsommen, zonder gegevens |

De tabel zelf is voor `anon` afgeschermd; alle toegang loopt via die functies en
vereist het wachtwoord. Het wachtwoord staat gehasht (bcrypt).

**De regel bij het samenvoegen is: niets weggooien.** Bij het openen wordt de
centrale kopie opgehaald en samengevoegd met wat er lokaal staat — nooit
overschreven. Een week die ergens is afgerond blijft afgerond, een kaart houdt
zijn verste interval, een profiel dat aan één kant bestaat blijft bestaan. Zonder
internet werkt alles gewoon door en wordt er bij de volgende verbinding
gelijkgetrokken.

De gedeelde code hiervoor (`WOLK` en `SAMEN`) staat letterlijk in beide apps,
bovenaan het scriptblok. Bewust gedupliceerd: één zelfstandig bestand per app
weegt zwaarder dan het vermijden van die dubbeling.

## Accounts

- **Geloofsstudie** — één account, voor Abdelkader. In te stellen onder *Instellingen*.
- **Arabisch** — één gezinsaccount met daarbinnen vijf leerprofielen (Hanae, Selma,
  Amine, Wassima, Amaani). In te stellen onder *Ouder*. Bij een lege installatie
  staat er een knop klaar die de vijf profielen in één keer aanmaakt.
- **Islam leren** — één gezinsaccount met daarbinnen een profiel per kind. In te
  stellen onder *Ouder*; bij een lege installatie staat er een knop klaar die de
  vier kinderen in één keer aanmaakt.
- **BennaHealth** — één account, voor Abdelkader. In te stellen achter de chip
  rechtsboven. Synchroniseren is hier geen gemak maar een voorwaarde: er wordt
  in de badkamer gewogen en op de laptop gelogd, en twee losse reeksen leveren
  geen trend op.
- **Huiswerk** — houdt zijn eigen bestaande inlog per kind. Ongewijzigd.

## Islam leren

### Het gebed compleet

Wat er in de volgorde ontbrak is toegevoegd, ook waar het geen plicht is:

- de **qunut** stond wel als tekst in de app maar niet in de volgorde; hij zit nu
  als eigen stap in de tweede rak'a van de Fajr, en alleen daar;
- de **du'a vóór de slotgroet** (bescherming tegen vier dingen) ontbrak helemaal,
  terwijl de stap ernaast al zei "daarna mag je vragen wat je wilt";
- de **dhikr ná de slotgroet** — istighfar, *allahumma anta s-salam*, 33/33/33 en
  de tahlil — stond alleen in een les over dhikr, niet in het gebedsonderdeel;
- **al-Humaza (104)** ontbrak in de rij soera's om uit het hoofd te leren: die
  liep van 114 terug naar 105 en sprong dan naar 103.

Daarnaast een blok **Naast de volgorde** met de openingsdu'a, het zoeken van
bescherming en *amin*. Die horen in de Malikitische school niet in het verplichte
gebed, en daarom staan ze niet tússen de stappen — maar wel eronder, met uitleg,
want in een vrijwillig gebed mogen ze wel en de meeste andere scholen zeggen ze
altijd.

**De iqama** ontbrak helemaal. Hij is nu de eerste stap van elk verplicht gebed,
met de tien zinnen erbij. In de Malikitische school is de iqama *enkel*: elke zin
één keer, alleen de takbir twee keer, en "qad qamati s-salah" ook maar één keer —
andere scholen verdubbelen, en dat hoor je in sommige moskeeën. Bij een
vrijwillig gebed en bij de witr komt hij niet, en in *Bid mee* verschijnt hij dan
ook niet.

**De soera na al-Fatiha is een eigen stap geworden.** Hij stond er als zinnetje
onder de Fatiha — "in deze rak'a lees je nog een soera" — en dat is precies hoe
je hem in het echt ook overslaat. In *Bid mee* kiest de app nu twee verschillende
korte soera's voor de eerste twee rak'a, toont ze regel voor regel met de
recitatie, en er zit een knop bij om er een andere te pakken. Een volledige Fajr
loopt daarmee van de intentie tot de dhikr ná de slotgroet, met alles ertussen.

**De uitspraak.** Onder de wetenschappelijke omschrijving staat nu een regel in
Nederlandse klanken, met de klemtoon in hoofdletters: *soeb-HAA-na RAB-bi-ya
l-A'-laa*. Die omschrijving is precies maar leest lastig — "Subhana rabbiya
l-a'la" wordt bij hardop lezen zomaar "soebhanaropbil ala". De nieuwe regel is
bedoeld om te lézen, niet om correct te zijn.

De stappen dragen nu drie etiketten in plaats van twee: *moet*, *sunna* en *na
het gebed*, met een legenda erboven die uitlegt wat elk etiket betekent voor de
geldigheid van je gebed. Het examen over de volgorde loopt van de intentie tot
de slotgroet; de qunut hoort alleen bij één gebed en de dhikr komt ná de
slotgroet, dus die twee tellen daar niet in mee.

### Bijzondere gebeden

Een eigen tabblad onder *Leren bidden*, voor de gebeden die niet elke dag
terugkomen. De vijf dagelijkse gebeden leer je vanzelf, door ze te doen. Deze
niet: het feestgebed komt twee keer per jaar langs, en het gebed bij een
overledene komt precies op de dag dat niemand in huis rustig kan nadenken.
Daarom staan ze uitgeschreven, met wat je doet, wat je zegt en wat er wél en
niet moet.

Zeven gebeden, elk met een etiket voor de regel — *verplicht*, *plicht van de
gemeenschap* (fard kifaya), *sterk aanbevolen* — plus wanneer, hoeveel rak'a,
de stappen op volgorde, een "let op" en de tips:

- **het vrijdaggebed** — inclusief dat de khutba in deze school een voorwaarde
  is, en dat wie de tweede rak'a niet meer haalt gewoon Dhuhr bidt;
- **het feestgebed** — zeven takbirs in de eerste rak'a en zes in de tweede
  (Malikitisch geteld, de openingstakbir en de opsta-takbir meegerekend), geen
  adhan, geen iqama, en de preek erná;
- **het gebed bij een overledene** — vier takbirs, staand, geen buiging en geen
  knieval, geen al-Fatiha en de handen alleen omhoog bij de eerste takbir;
- **bidden op reis**, **de verduistering**, **om regen vragen** en **de
  istikhara**.

Direct achter het janaza-gebed staat **Rond een overlijden**: het nieuws, de
wassing, het gebed, het graf, condoleren en wat daarna helpt — met de teksten
erbij. Uitgeschreven omdat niemand op zo'n dag iets kan opzoeken. Er staat ook
in dat huilen mag en jammeren niet, en dat kinderen gerust mee mogen.

Tien nieuwe teksten met Arabisch, omschrijving, uitspraak in Nederlandse klanken
en betekenis: de takbir van het feest, de du'a bij een overledene en die bij een
overleden kind, *inna lillahi wa inna ilayhi raji'un*, de du'a bij verdriet, de
zin waarmee je condoleert, wat je zegt bij het graf, de groet aan het kerkhof,
de du'a van de istikhara en die om regen. Ze staan ook in de opnamestudio onder
*Ouder → eigen stem opnemen*, en in `maak-stemmen.mjs`.

Verschillen tussen de scholen zijn hier groter dan bij het dagelijkse gebed, en
gebruiken verschillen per land en per moskee. Dat staat er onderaan ook zo bij:
sta je ergens anders mee te bidden, kijk naar de imam.

**De wassing** kreeg bij elke stap een tip uit de praktijk: je ring afdoen omdat
er anders geen water onderdoor komt, je mouw ruim genoeg opstropen, nieuw water
pakken voor je oren, en tussen je tenen afdrogen. Ook daar staat nu een legenda
bij wat *moet* en wat *sunna* is.

Veertien modules met vierenzeventig lessen over de basis van de islam — geloof,
de vijf zuilen, reinheid, het gebed, de Koran, de seerah, gedrag, du'a, de
kalender, het leven hier, de soennah en de hadithwetenschap, de geschiedenis van
na de Profeet ﷺ tot en met al-Andalus en de Maghreb, de betekenis van de soera's
die je uit je hoofd leert, en de grote vragen voor de oudsten. Daarnaast een
gebedsonderdeel dat het leren bidden helemaal afdekt: de wassing, de zeventien
onderdelen van het gebed, een meebid-oefening voor elk van de vijf gebeden,
vijftien teksten om uit het hoofd te leren, de du'a's van de dag, een overzicht
van alle gebeden en wat te doen als het misgaat. De fiqh volgt de Malikitische
school; waar andere scholen het anders doen staat dat erbij.

Elk kind krijgt zijn eigen leerlijn, afgeleid uit het geboortejaar in het
profiel: 7–9 jaar krijgt korte teksten en 47 lessen, 10–12 de volledige uitleg en
69 lessen, 13 jaar en ouder alle 74 met een blok verdieping onder elke les.
Modules die nog niet aan de beurt zijn staan zichtbaar op slot met "vanaf 10
jaar" erbij — dat scheelt uitleg en geeft de jongsten iets om naar uit te kijken.

De gebedshoudingen en de wassing zijn getekende SVG's en de geluidjes komen uit
de Web Audio API, dus daar zijn geen bestanden voor nodig.

**Het geluid bij de Arabische teksten** komt uit een opname die thuis zelf is
ingesproken, en anders uit een meegeleverd recitatiefragment uit `public/noer/audio/`.
De stem van het toestel wordt daar níet meer achteraan geplakt — zie *Het
Arabisch komt alleen uit opnames* hieronder.

De recitatie zit niet in de repository maar wordt opgehaald met
`node public/noer/audio/haal-recitatie.mjs --basis="…"`; zie `public/noer/audio/LEESMIJ.md`
voor de bron, de Warsh-lezing en de valkuil met de telling van al-Fatiha. Voor de
zinnen van het gebed en de du'a's bestaat geen archief — die spreek je thuis in
onder *Ouder → Eigen stem opnemen*. Opnames staan in de IndexedDB van het toestel
zelf en gaan niet mee met de centrale opslag; er zit een knop bij om ze als
bestand over te zetten naar de telefoon van een kind.

Kinderen kunnen zichzelf ook opnemen en terugluisteren bij het oefenen; die
opname blijft in het geheugen en wordt nergens bewaard of verstuurd.

De gebedstijden worden ter plekke uitgerekend uit de stand van de zon. Voor
Nederland staat de regel "nacht in zevenen" aan, omdat het in juni 's nachts
niet donker genoeg wordt voor de gebruikelijke hoeken; zonder die regel vallen
Fajr en Isha van de kalender. Vergelijk de uitkomst een keer met de kalender van
de eigen moskee en stel de methode desnoods bij onder *Ouder*.

**De beloning.** Geld hoort bij het leren: een les halen, een tekst echt uit het
hoofd kennen, een examen halen, de dagopdracht afmaken. Er is een hard
weekbudget per kind (standaard € 10) en de ouder betaalt uit; de app rekent
alleen. Het afvinken van een gebed levert standaard géén geld op — dat is een
bewuste keuze en onder *Ouder* met één klik om te zetten. Voor het gebed werken
de stickerkaart, de dagenreeks en de insignes.

## Het jaarprogramma in Arabisch

Naast het losse leerpad staat er in Arabisch een **jaarplan**: zesendertig weken van
negentig minuten, bedoeld voor één vast moment per week — zaterdag of zondag.
Elke les heeft dezelfde zeven onderdelen: openen, herhalen, nieuwe letters,
lezen, schrijven, een stuk geloof, en afsluiten met wat er thuis blijft liggen.

Het begint met een **niveaubepaling** van achttien vragen die oploopt van
letterherkenning naar het lezen van een vers. De uitslag bepaalt niet wie het
knapst is maar op welke week het programma voor dat kind begint — wie de eerste
letters al kent, slaat ze over. Nooit verder dan week 17: de tekens en het
verbinden slaat niemand over.

De stof loopt cumulatief. Blok 1 doet de eerste zestien letters met de korte
klinkers, blok 2 maakt het alfabet af en voegt de tekens toe, blok 3 gaat over
verbinden, het lidwoord en de eerste zinnen, en blok 4 leest al-Fatiha en de
korte soera's. Elke negende week is herhaling met een **toets**, waarvan de
uitslag bewaard blijft. Het geloofsdeel haakt waar het kan aan de letter of het
woord van die week: de week van de ب is de week van *bismillah*, de week van de
ق die van de *qibla*.

Bij elke week hoort een **werkblad** om af te drukken: de letters in hun vier
vormen, twee rijen om over te trekken en lege regels om zelf te schrijven.

Het **ouderscherm** opent met een cockpit: per kind de week, het percentage, het
aantal lessen en uren, de uitslag van de niveaubepaling en van elke blokstoets,
wanneer de laatste les was en wat er hierna komt — met knoppen om het jaarplan
te openen, het werkblad van die week af te drukken of opnieuw te meten.

## Koran uit je hoofd — memoriseren

Deze app is niet voor de kinderen. Hij gaat uit van een
volwassene die laat begint, en dat verandert wat er nodig is: geen tekort aan
begrip maar aan herhaaltijd.

**De hele Koran staat erin.** In `rasikh/tekst/` staat per soera een JSON-bestand
met de Warsh- én de Hafs-tekst (de druk van het King Fahd-complex), de vertaling
van Fred Leemhuis en een klankweergave — samen 6236 aya, gecontroleerd tegen de
gangbare telling. De app laadt alleen de soera die je op dat moment nodig hebt.
Het doelgebied stel je zelf in; standaard is dat juz 'amma, soera 78 tot en met
114. Met één knop wordt dat de laatste twee juz of het hele boek.

**Zes stappen per aya**, in deze volgorde: horen, begrijpen, inprenten,
losmaken, vastzetten, knopen. Betekenis komt vóór klank — een volwassene onthoudt
via begrip, een kind via klank. *Knopen* is de laatste stap: de aya aan de vorige
vastmaken, want dáár breekt het reciteren.

**De planner is de kern.** De opgegeven tijd per dag wordt éérst gevuld met wat
herhaald moet worden. Wat overblijft bepaalt of er nieuwe stof bij mag. Blijft er
niets over, dan komt er niets bij, en dat zegt de app ook met zoveel woorden.
Herhalen loopt op 1, 2, 4, 8, 16, 32, 64, 120, 200 dagen; een misser zet de reeks
terug.

**Verwarpunten** zijn niet met de hand bedacht maar berekend uit de hele Koran:
86 groepen aya's die woordelijk gelijk zijn en 349 die met dezelfde vier woorden
beginnen, opgeslagen in `rasikh/tekst/mutashabihat.json`. Zodra je stof zo'n
groep raakt, kun je er een ronde over doen: je krijgt de gedeelde tekst en de
plaats, en moet zeggen wat dáár volgt. Dit is waar hifz omvalt — niet bij
moeilijke woorden.

**Recitatie.** Zonder eigen bestanden valt de app terug op de achtenvijftig
Warsh-fragmenten uit Islam leren. De rest haal je op met
`node rasikh/audio/haal-audio.mjs` (zonder opties: juz 'amma); zie
`rasikh/audio/LEESMIJ.md`. De hele Koran is ruim zesduizend bestanden en een
halve gigabyte — dat wil je waarschijnlijk niet in git.

**Zonder internet.** De servicewerker bewaart de app, de tekst, de recitatie en
het Arabische lettertype (zie hierboven). Onder *Instellingen* staat een knop die
het hele doelgebied vooraf klaarzet.

**Centrale opslag.** De app hangt aan dezelfde `WOLK` als de andere apps, met een
samenvoeging die past bij herhaalgegevens: niet "de hoogste waarde wint" — een
hoge `due` betekent immers *later* herhalen — maar het toestel waarop het laatst
geoefend is. Dat weet wat er echt gebeurd is. Instellingen dragen een tijdstempel
zodat een doel dat je op je telefoon verzet niet wordt teruggedraaid door de
oudere stand op je laptop. Voor een reeks van jaren is dat geen luxe.

## Computers & Code — coderen en pc's bouwen

De app voor Amine (11), die van gamen, computers en voetbal houdt. Twee sporen
naast elkaar, 63 lessen in totaal.

**Coderen** (38 lessen) begint met Python, want daarin zie je met één regel wat
je doet. Zes blokken: de eerste stappen, keuzes en herhalen, lijsten en
woordenboeken, functies en fouten, de webtalen (HTML, CSS, JavaScript, DOM,
events, canvas), en tot slot welke taal waarvoor is, hoe je Python op je eigen pc
zet, en wat git doet. Elk blok eindigt met een project: een spelerskaart, "raad
het getal", een competitiestand uit uitslagen, een dobbelspel en een klikspel in
de browser.

**Bouwen** (25 lessen) doet eerst de acht onderdelen en waarom ze er zijn, dan de
getallen (GHz, VRAM, fps, Hz, bottleneck, compatibiliteit), dan het bouwen zelf
(statisch werken, volgorde, koelpasta, kabels, BIOS, Windows of Linux) en tot
slot onderhoud, problemen zoeken, upgraden en online veilig blijven.

**De Python zit in de app.** Geen Pyodide, geen CDN: MINIPY is met de hand
geschreven en staat in `src/bunyan/minipy/` — woorden lezen, ontleden, uitvoeren. Reden één is dat de app dan zonder
internet werkt en niets van buiten haalt. Reden twee weegt zwaarder: de taal van
de foutmeldingen. Een kind van elf leert niets van `SyntaxError: invalid syntax`,
maar wel van *"regel 3: je bent de dubbele punt vergeten aan het eind van de
if-regel"*. Hij kent getallen, tekst, lijsten, woordenboeken, if/elif/else,
while, for, functies, f-strings, `random` en de gewone ingebouwde functies — het
eerste jaar Python, en niets daarbuiten. Een oneindige lus wordt na een vast
aantal stappen afgebroken met een uitleg in plaats van een vastgelopen tabblad.

De overzetting naar TypeScript is niet nagelopen maar bewézen: honderdtweeëndertig
programma's door de oude vertaler én de nieuwe, en per programma vergeleken op de
uitvoer regel voor regel en — bij zesenzestig ervan — op regelnummer, melding en
tip woord voor woord. Het corpus staat in `gereedschap/bunyan-python-corpus.txt`
en bevat één programma per foutmelding, plus elk voorbeeld en elke startcode uit
de lessen zelf. Wie een melding herformuleert, breekt de toets; dat is de
bedoeling, want die zinnen zíjn het onderwijs.

JavaScript en HTML draaien in `public/bunyan/zandbak.html`, een frame met
`sandbox="allow-scripts"` en dus een eigen herkomst: een typefout of een
`while(true)` legt de app niet plat, en wat daar draait kan niet bij de opslag of
het scherm van de app. Vroeger was dat een `srcdoc`-frame, maar dat erft de
policy van de pagina eromheen en die verbiedt losse scripts. De zandbak heeft nu
één eigen regel in `vercel.json` — losse scripts mogen daar, en verder niets, tot
en met `connect-src 'none'`. `console.log` komt via `postMessage` terug in het
uitvoervenster.

**De bouwbank** staat op de werkbank: kies onderdelen binnen een budget en de app
controleert de vijf dingen die je in het echt ook nakijkt (voetje, geheugentype,
wattage met marge, bordmaat in de kast, lengte van de videokaart) en schat wat je
haalt in zes spellen op 1080p, 1440p of 4K. De schatting neemt het minimum van
een videokaart- en een processorgrens, zodat een dure kaart naast een zwakke
processor zichtbaar niets oplevert — precies de les uit blok 2.

**De beloning** werkt als in de huiswerkapp: geld voor afgemaakt werk, niet voor
tijd. Een gewone les € 0,40, een project € 1,50, met een hard weekplafond
(standaard € 6) en uitbetalen door de ouder. Punten, rangen en insignes lopen
dóór als het budget op is — leren stopt niet als het geld stopt.

## Spelletjes

De spelletjes zaten tot augustus 2026 verstopt in de huiswerkapp, achter een knop
op het beginscherm. Nu staan ze als eigen app op de startpagina: dertien stuks,
plus de twee grote die als eigen bestand naast de huiswerkapp blijven wonen
(AminoQMc en de Verkeersschool).

De naam betekent *rust*. De religieuze toets zit in de naam en het onderschrift,
niet in de spelletjes zelf — een spel dat stiekem een les is, is geen van beide.
Wat de app wél doet is niets doen om je langer vast te houden dan je van plan
was: geen meldingen, geen dagelijkse beloning, geen reclame, geen eindeloze
reeks. De grap staat onderaan, één regel, elke keer een andere.

Twaalf spellen komen uit de huiswerkapp en zijn overgezet naar gewone
JavaScript; **Letterjacht** is nieuw en oefent de Arabische letters die in Arabisch
geleerd worden. Het geheugenspel kan met plaatjes of met Arabische letters.

De **records** verhuizen mee: bij de eerste opening leest de app de oude
`oefenapp_v1`-opslag en neemt de topscores over. Ze gaan verder via dezelfde
`WOLK` als de andere apps, met één verschil in het samenvoegen — bij het
geheugenspel is *minder* beter, dus daar wint het laagste getal.

In de huiswerkapp blijven de twee knoppen staan, inclusief de instelling
*spelletjes pas na het dagdoel*; ze verwijzen nu naar `/spellen/`.

## BennaHealth — meten in plaats van schatten

De app heette eerst *Kalibratie* en daarna *Energiebalans*. Geen van beide
klopte. "Kalibratie" is de méthode en niet het onderwerp; "energiebalans" is
erger, want de app balanceert niets — hij meet, en het woord balans suggereert
juist een streefgetal waar je op of onder hoort te zitten. Dat is precies wat
hier met opzet niet gebeurt. De app woont nu op `/health/`; wie de oude
bladwijzer gebruikt wordt doorgestuurd. Bestaande apps tonen een caloriedoel dat uit een
formule rolt, met twee decimalen en zonder voorbehoud, alsof het een meting is.
Het is een gok met een spreiding van vele honderden kilocalorieën, en wie er zijn
dag op inricht en niets ziet gebeuren, concludeert dat er iets mis is met hem in
plaats van met het getal.

Hier wordt het verbruik uitgerekend uit wat er werkelijk gebeurt. Over een venster
van achtentwintig dagen loopt een kleinste-kwadratenregressie over de ochtend­
wegingen; die helling maal 7.700 kcal per kilo, opgeteld bij de gemiddelde
gelogde inname, is het verbruik. Daar hoort een betrouwbaarheidsinterval bij, en
dat interval staat groot in beeld — niet het puntgetal. Zijn er minder dan zeven
wegingen of minder dan zeven bruikbare registratiedagen, dan geeft de app geen
uitkomst en legt ze uit wat er ontbreekt. Dat weigeren is functionaliteit.

Drie dingen zitten hard in de code en zijn geen instelling:

- het doel zakt nooit onder de berekende ruststofwisseling;
- gaat de trend sneller dan één kilo per week, dan luidt het advies **méér** eten;
- actieve energie uit Garmin of Apple wordt nooit bij het doel opgeteld — bij lage
  intensiteit zijn die waarden stelselmatig dertig tot zestig procent te hoog, en
  wie ze bijtelt eet precies het tekort op dat hij denkt te maken.

Dagen onder 1.200 kcal worden geteld en getoond, maar niet meegerekend en nooit
als succes gepresenteerd: dat is vrijwel altijd een onvolledige registratie.

**Recepten die meeschuiven.** Een samengesteld gerecht dat elke dag terugkomt —
de tonijnsalade, de cappuccino — is één keer geijkt en rekent daarna mee met wat
er in het profiel staat over de olijfolie en de melk. Weeg je één keer af hoeveel
olie er werkelijk in gaat, dan verschuiven álle porties, ook die van vorige week.
Zolang die twee niet gewogen zijn, staan de betreffende recepten op een D en niet
op een B; de app doet niet alsof.

Elke waarde draagt zo'n graad: **A** etiket en gewogen, **B** etiket met een
geschatte portie, **C** databasewaarde, **D** ruwe schatting. De Marokkaanse en
Turkse gerechten staan bijna allemaal op D. Dat is eerlijker dan een cijfer met
één decimaal, en het is nog altijd meer dan de mainstream apps bieden, die deze
keuken domweg niet kennen.

Onder *Model* staat ook een lijstje **Wat het model nog mist**, op volgorde van
onzekerheid. De grootste post van de dag is de olijfolie: tussen veertig en
zeventig gram zit 265 kcal. Daarna de melk per cappuccino, bij vier of vijf op een
werkdag de grootste onzichtbare post. De app wacht daar niet passief op maar
vraagt erom.

Er staat één contra-intuïtieve mededeling in beeld die er hoort te staan. Als de
formuleschatting fors hoger uitvalt dan het gemeten verbruik, registreert de
gebruiker stelselmatig te laag — meestal olie, brood, sauzen en samengestelde
gerechten. Dat maakt het advies niet ongeldig: het model rekent in *gelogde*
calorieën, en zolang de registratiegewoonte gelijk blijft, klopt het doel in
gelogde eenheden. Staat dat er niet bij, dan verliest iemand het vertrouwen in
zijn eigen cijfers zodra hij de twee getallen naast elkaar ziet.

De rekenkern (`bmr`, `palUitStappen`, `regressie`, `analyse`) staat als losse,
pure functies bovenaan het scriptblok: geen scherm, geen opslag. Zo is hij na te
rekenen met een verzonnen reeks, en later te hergebruiken. De grafieken zijn met
de hand getekende SVG; een grafiekbibliotheek zou drie megabyte kosten voor drie
figuren en dan nog assen tekenen die van dit ontwerp niets weten.

**Wat er nog niet in zit.** De klinische nulmeting — bloeddruk, nuchter glucose of
HbA1c, lipiden, ALAT en GGT met het oog op MASLD, TSH, vitamine D, middelomtrek,
STOP-BANG en SCORE2 — staat niet in het profiel. En er is geen onderhoudsfase:
twintig kilo verliezen zonder gedefinieerd onderhoudsprotocol is waar de meeste
trajecten stranden, niet in de afvalfase.

De app staat bij de groten en is voor kinderen niet zichtbaar. Dat is geen
smaakkwestie: dagelijks wegen en een calorietekort zijn voor een kind van acht tot
vijftien een bekende risicofactor, en de rest van de hub is juist wél voor hen.

## Het ouderscherm zit op slot

Elk beheerscherm vraagt een code voordat er iets te veranderen valt. Dat was er
niet, en het gevolg was voorspelbaar: een kind dat de stemmen, het weekbudget en
de gebedstijden omzette omdat het kon.

| App | Wat er achter de code zit |
|---|---|
| Islam leren | het hele ouderscherm: kinderen, budget, gebedstijden, stemmen, opnames, uitbetalen |
| Computers & Code | het hele ouderscherm: tarieven, weekbudget, voortgang, uitbetalen |
| Arabisch | het hele ouderscherm: profielen, sporen, back-up, alles wissen |
| Spelletjes | inloggen en records wissen — het geluid mag een kind zelf aan- en uitzetten |
| Huiswerk | had dit al (de bestaande PIN, standaard 1234) |
| Koran uit je hoofd, Geloofsstudie | geen slot; dat zijn de apps van de ouder zelf |

De standaardcode is **1234**, dezelfde die de huiswerkapp altijd al had. Zolang
hij daarop staat toont elk ouderscherm een waarschuwing om hem te veranderen —
dat is het enige dat het scherm dichthoudt. Het veld leeg laten kan niet meer;
dan geldt weer 1234. Eerder betekende leeg *geen slot*, en dat was precies het
gat.

## Het Arabisch komt alleen uit opnames

Islam leren speelde bij Arabische tekst zonder opname de stem van het toestel af.
Die legt klemtonen verkeerd en spreekt de Koran uit als een voorleesrobot; bij
het gebed en de Koran is dat geen detail. Er is nu één schakelaar, **"alleen
echte opnames"**, en die staat standaard aan: je hoort de recitatie van de
reciteerder en wat er thuis is ingesproken, en verder blijft het stil — met een
regel erbij die zegt waar je het inspreekt. Zet de ouder hem uit, dan komen de
keuze van de toestelstem en de uitleg over betere stemmen weer tevoorschijn.

Alle toestellen worden één keer teruggezet op wat er thuis is afgesproken:
`alleenEcht` aan, geen zelfgekozen toestelstem meer, klinkertekens aan en het
rustige tempo. Een stempel (`instel.stemV`) zorgt dat dit precies één keer per
toestel gebeurt en daarna nooit meer — een latere bewuste keuze van de ouder
blijft dus staan. Het herstel loopt ook ná het gelijktrekken, want anders komt
de oude stand gewoon via een ander toestel terug.

## De AI-functies in Geloofsstudie

*Doorvragen* en *laat meelezen* praten rechtstreeks met de Anthropic-API vanuit de
browser, via de officiële SDK met `dangerouslyAllowBrowser`. Daarvoor is een eigen
sleutel nodig, in te vullen onder *Instellingen*; die blijft in `localStorage` van
dat ene toestel en gaat niet mee naar de centrale opslag. Zonder sleutel werkt de
rest van de app volledig.

Het model is `claude-opus-5` met adaptief denken (`thinking: {type: 'adaptive'}`) —
de vragen gaan over meningsverschil tussen scholen, over ketens en over wat wél en
niet in een tekst staat, en dat is het werk waar doordenken vóór antwoorden verschil
maakt. Omdat de denkstappen uit hetzelfde budget komen als het antwoord, staat
`max_tokens` op 4000 terwijl het antwoord zelf op 150–300 woorden gevraagd wordt.
Het antwoord komt stromend binnen en verschijnt terwijl het geschreven wordt; wie
zich vergist kan afbreken. De SDK zelf wordt pas opgehaald bij de eerste vraag —
zij is groter dan de hele leerstof bij elkaar, en de meeste avonden wordt er niets
gevraagd.

Voor `/sanad/` staat daarom `https://api.anthropic.com` in de `connect-src` van de
CSP in `vercel.json`. Dat is de enige app met die uitzondering.

**De afweging.** Een sleutel in een browser is voor een dienst mét gebruikers fout:
die hoort op een server, zoals bij BennaHealth, waar de edge function hem draagt.
Hier is het één persoon met zijn eigen rekening, en dan is de ruil verdedigbaar:
geen tussenserver die de vragen zou kunnen meelezen, in ruil voor een sleutel die
op dit toestel staat. Wie de app deelt, moet die keuze omdraaien — verplaats de
aanroep naar een edge function, dan hoeft de sleutel de browser niet meer in.

## Onderhoud

Alle apps staan in `src/`; daar geldt de bouwstap uit `BUILD.md`. De opgaven van
Huiswerk staan in `src/huiswerk/gegevens/` — `seed.ts` met de vaste opgaven en
`sjablonen.ts` met de sommen die per beurt nieuwe getallen krijgen; wie er een
opgave bij zet doet dat áchteraan, want de id's zijn afgeleid van de plaats in
de lijst en staan zo in ieders opslag. In Islam leren staat de leerstof
in `src/noer/gegevens/` als gewone lijsten (`MODULES`, `WUDU`, `STAPPEN`, `HIFZ`,
`DUAS`); wie de inhoud wil aanpassen hoeft de schermcode niet aan te raken. In
Koran uit je hoofd zit de stof niet in het bestand maar in `rasikh/tekst/`; de app zelf bevat
alleen de leerlogica. Bij Geloofsstudie staat de leerstof in `src/sanad/gegevens/`
— curriculum, kaarten, bronnen, lexicon en de brontekstfragmenten, elk als een
eigen bestand met een type erboven; wie de inhoud aanpast raakt geen schermcode aan. In
Arabisch staat de leerstof in `src/arabisch/gegevens/` — letters, woorden, grammatica,
zinnen, teksten, Koranwoorden en het jaarprogramma, elk als een eigen lijst; de FSRS-planner
staat los in `src/arabisch/fsrs.ts` en het leerpad in `leerplan.ts`. Let bij alle apps op de terugpijl naar `../`; die
veronderstelt dat de app in een submap onder de hub staat.
