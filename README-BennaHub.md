# BennaHub

Eén startpagina, vier apps. Alles is statische HTML: geen build-stap, geen server,
geen dependencies behalve Google Fonts. Wat hier staat, is wat er draait.

```
index.html          de startpagina (klein, alleen doorverwijzing)
huiswerk/           de oefenapp voor de kinderen — ongewijzigd, alleen een link terug
  index.html          de live versie (voorgecompileerd, niet met de hand bewerken)
  index.dev.html      de bron met JSX en de oefenstof
bidaya/index.html   Bidaya — de basis van de islam en leren bidden (7–15 jaar)
sanad/index.html    Sanad — achtentwintig weken islamitische wetenschappen
arabisch/index.html Lisan — Arabisch voor het hele gezin
```

## Centrale opslag

Bidaya, Sanad en Lisan slaan voortgang op in `localStorage` én centraal, zodat je op elk
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
- **Bidaya** — één gezinsaccount met daarbinnen een profiel per kind. In te
  stellen onder *Ouder*; bij een lege installatie staat er een knop klaar die de
  vier kinderen in één keer aanmaakt.
- **Huiswerk** — houdt zijn eigen bestaande inlog per kind. Ongewijzigd.

## Bidaya

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
uit `bidaya/audio/`, en anders de stem van het toestel. Die laatste is het
noodvangnet: een voorleesstem is geen reciteerder, en dat hoor je.

De recitatie zit niet in de repository maar wordt opgehaald met
`node bidaya/audio/haal-recitatie.mjs --basis="…"`; zie `bidaya/audio/LEESMIJ.md`
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

## De AI-functies in Sanad

*Doorvragen* en *laat meelezen* praten rechtstreeks met de Anthropic-API vanuit de
browser. Daarvoor is een eigen sleutel nodig, in te vullen onder *Instellingen*;
die blijft in `localStorage` van dat ene toestel en gaat niet mee naar de centrale
opslag. Zonder sleutel werkt de rest van de app volledig.

Wil je dat later netter: zet het geheel op Vercel en verplaats de aanroep naar een
serverless functie, dan hoeft de sleutel de browser niet meer in.

## Onderhoud

De huiswerkapp bouw je zoals altijd: bewerk `huiswerk/index.dev.html` en compileer
naar `huiswerk/index.html` (zie `BUILD.md`). Bidaya, Sanad en Lisan zijn gewone
HTML — openen, bewerken, klaar. In Bidaya staat de leerstof bovenaan het
scriptblok als gewone lijsten (`MODULES`, `WUDU`, `STAPPEN`, `HIFZ`, `DUAS`);
wie de inhoud wil aanpassen hoeft de schermcode niet aan te raken. Let bij beide op de terugpijl naar `../`; die veronderstelt
dat de app in een submap onder de hub staat.
