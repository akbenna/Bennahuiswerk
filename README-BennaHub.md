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

Tien modules met vierenvijftig lessen over de basis van de islam, en een
gebedsonderdeel dat het leren bidden helemaal afdekt: de wassing, de twaalf
onderdelen van het gebed, een meebid-oefening voor elk van de vijf gebeden,
vijftien teksten om uit het hoofd te leren, de du'a's van de dag, een overzicht
van alle gebeden en wat te doen als het misgaat. De fiqh volgt de Malikitische
school; waar andere scholen het anders doen staat dat erbij.

Elk kind krijgt de versie die bij zijn leeftijd hoort: 7–9 jaar korte teksten,
10–12 de gewone versie, 13–15 met verdieping erbij. De leeftijd volgt uit het
geboortejaar in het profiel.

Alles zit in het bestand zelf. De gebedshoudingen en de wassing zijn getekende
SVG's, het geluid komt uit de Web Audio API en het voorlezen uit de stem van het
toestel (Nederlands en, als die geïnstalleerd is, Arabisch). Kinderen kunnen
zichzelf opnemen en terugluisteren; die opname blijft in het geheugen en wordt
nergens bewaard of verstuurd.

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
