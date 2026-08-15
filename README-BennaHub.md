# BennaHub

Eén startpagina, vijf apps. Alles is statische HTML: geen build-stap, geen server,
geen dependencies behalve de Latijnse letters van Google Fonts — het Arabisch
staat in de repo zelf. Wat hier staat, is wat er draait.

```
index.html          de startpagina (klein, alleen doorverwijzing)
huiswerk/           de oefenapp voor de kinderen — ongewijzigd, alleen een link terug
  index.html          de live versie (voorgecompileerd, niet met de hand bewerken)
  index.dev.html      de bron met JSX en de oefenstof
noer/index.html     Noer Islam — de basis van de islam en leren bidden (7–15 jaar)
sanad/index.html    Sanad — achtentwintig weken islamitische wetenschappen
arabisch/index.html Lisan — Arabisch voor het hele gezin, met een jaarprogramma
rasikh/             Rasikh — de Koran memoriseren (voor volwassenen)
  index.html          de app
  tekst/              de hele Koran: 114 soera's, 6236 aya, plus de verwarpunten
  audio/              recitatie per aya, op te halen met het script dat er staat
fonts/              Amiri, het Arabische lettertype van alle apps
```

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

## Centrale opslag

Noer Islam, Sanad en Lisan slaan voortgang op in `localStorage` én centraal, zodat je op elk
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

- **Sanad** — één account, voor Abdelkader. In te stellen onder *Instellingen*.
- **Lisan** — één gezinsaccount met daarbinnen vijf leerprofielen (Hanae, Selma,
  Amine, Wassima, Amaani). In te stellen onder *Ouder*. Bij een lege installatie
  staat er een knop klaar die de vijf profielen in één keer aanmaakt.
- **Noer Islam** — één gezinsaccount met daarbinnen een profiel per kind. In te
  stellen onder *Ouder*; bij een lege installatie staat er een knop klaar die de
  vier kinderen in één keer aanmaakt.
- **Huiswerk** — houdt zijn eigen bestaande inlog per kind. Ongewijzigd.

## Noer Islam

Veertien modules met vierenzeventig lessen over de basis van de islam — geloof,
de vijf zuilen, reinheid, het gebed, de Koran, de seerah, gedrag, du'a, de
kalender, het leven hier, de soennah en de hadithwetenschap, de geschiedenis van
na de Profeet ﷺ tot en met al-Andalus en de Maghreb, de betekenis van de soera's
die je uit je hoofd leert, en de grote vragen voor de oudsten. Daarnaast een
gebedsonderdeel dat het leren bidden helemaal afdekt: de wassing, de twaalf
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

**Het geluid bij de Arabische teksten** komt uit drie bronnen, in deze volgorde:
een opname die thuis zelf is ingesproken, anders een meegeleverd recitatiefragment
uit `noer/audio/`, en anders de stem van het toestel. Die laatste is het
noodvangnet: een voorleesstem is geen reciteerder, en dat hoor je.

De recitatie zit niet in de repository maar wordt opgehaald met
`node noer/audio/haal-recitatie.mjs --basis="…"`; zie `noer/audio/LEESMIJ.md`
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

## Het jaarprogramma in Lisan

Naast het losse leerpad staat er in Lisan een **jaarplan**: zesendertig weken van
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

## Rasikh — memoriseren

Rasikh is de enige app die niet voor de kinderen is. Hij gaat uit van een
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
Warsh-fragmenten uit Noer Islam. De rest haal je op met
`node rasikh/audio/haal-audio.mjs` (zonder opties: juz 'amma); zie
`rasikh/audio/LEESMIJ.md`. De hele Koran is ruim zesduizend bestanden en een
halve gigabyte — dat wil je waarschijnlijk niet in git.

**Zonder internet.** De servicewerker bewaart de app, de tekst, de recitatie en
het Arabische lettertype (zie hierboven). Onder *Instellingen* staat een knop die
het hele doelgebied vooraf klaarzet.

## De AI-functies in Sanad

*Doorvragen* en *laat meelezen* praten rechtstreeks met de Anthropic-API vanuit de
browser. Daarvoor is een eigen sleutel nodig, in te vullen onder *Instellingen*;
die blijft in `localStorage` van dat ene toestel en gaat niet mee naar de centrale
opslag. Zonder sleutel werkt de rest van de app volledig.

Wil je dat later netter: zet het geheel op Vercel en verplaats de aanroep naar een
serverless functie, dan hoeft de sleutel de browser niet meer in.

## Onderhoud

De huiswerkapp bouw je zoals altijd: bewerk `huiswerk/index.dev.html` en compileer
naar `huiswerk/index.html` (zie `BUILD.md`). Noer Islam, Sanad, Lisan en Rasikh
zijn gewone HTML — openen, bewerken, klaar. In Noer Islam staat de leerstof
bovenaan het scriptblok als gewone lijsten (`MODULES`, `WUDU`, `STAPPEN`, `HIFZ`,
`DUAS`); wie de inhoud wil aanpassen hoeft de schermcode niet aan te raken. In
Rasikh zit de stof niet in het bestand maar in `rasikh/tekst/`; de app zelf bevat
alleen de leerlogica. Let bij alle apps op de terugpijl naar `../`; die
veronderstelt dat de app in een submap onder de hub staat.
