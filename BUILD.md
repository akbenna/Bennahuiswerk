# Bouwen

De repo is één Vite-project met negen apps erin. Elke app houdt zijn eigen map en
dus zijn eigen adres — `/health/`, `/noer/`, `/rasikh/` — want die adressen
staan in bladwijzers, in negen service workers en in de tegels op de
startpagina. Er is geen router en geen enkele app weet van de andere.

```
npm install
npm run dev        de ontwikkelserver
npm run controle   typen, proeven, bouw en de CSP-proef achter elkaar
```

## De losse opdrachten

| | |
|---|---|
| `npm run typen` | `tsc --noEmit` over alles in `src/`. Levert niets op, controleert alles. |
| `npm run proef` | Vitest. Onder meer de gouden waarden van de rekenkern. |
| `npm run build` | Typen én bouw; het resultaat staat in `dist/`. |
| `npm run csp` | Zet `dist/` achter een server die de headers uit `vercel.json` meestuurt en laadt elke omgebouwde app in Chromium. Meldt elke CSP-overtreding, en speelt bij Spelletjes een potje, loopt bij Koran uit je hoofd een aya door, bij Geloofsstudie een hele week plus een kaart, bij Computers & Code een Python-les van begin tot eind plus de zandbak, bij Islam leren een profiel met een hele les en de gebedstijden, bij Arabisch een profiel met de eerste oefening, het alfabet en het zoeken, en bij Huiswerk een kind dat inlogt, een som maakt en de ouder-modus opent, om te zien of het ook wérkt. |
| `node gereedschap/health-voorbeeld.mjs` | Zet `dist/` achter de echte headers, onderschept de databaseaanroepen en vult ze met een verzonnen maar geloofwaardige reeks van achtentwintig dagen. Levert drie foto's van het startscherm van BennaHealth: de eerste dag, na vier weken, en het donkere thema. Het scherm is niet te beoordelen zonder gegevens erin — leeg ziet elk ontwerp er hetzelfde uit. |
| `npm run gouden-waarden` | Genereert de gouden waarden opnieuw uit de oude code: de rekenkern, de herhalingsplanner, de kaartplanner van Geloofsstudie, de Python-vertaler van Computers & Code, de gebedstijden van Islam leren, de FSRS-planner van Arabisch en het zakgeld, Leitner en de sjablonen van Huiswerk. Alleen nodig als die veranderen, en dat hoort niet te gebeuren. |

## De verbouwing is klaar, en dat staat in de code

Bovenin `vite.config.ts` staan twee lijsten:

```ts
const NOG_NIET_OMGEBOUWD: string[] = []
const OMGEBOUWD = [
  'start', 'health', 'spellen', 'rasikh', 'sanad', 'bunyan', 'noer', 'arabisch', 'huiswerk',
]
```

Wat in de eerste lijst staat, draait nog als los HTML-bestand en gaat onveranderd
mee naar `dist/`. Wat in de tweede staat is een echte ingang met React en
TypeScript. Zo blijft de site werken terwijl er app voor app wordt verbouwd; er
is geen moment waarop de helft stuk staat.

De eerste lijst is leeg: alle negen apps zijn om. De lijst blijft staan — hij is
de plek waar een nieuwe app die nog niet gebouwd wordt tijdelijk in kan.

Drie losse pagina's onder `huiswerk/` zijn níét omgebouwd en dat is met opzet:
`voxelsandbox.html` (een 3D-spel met three.js erin), `verkeersschool.html` en de
drie cursussen onder `cursussen/`. Het zijn zelfstandige bestanden met inline
script, ze staan los van de app en ze delen er geen code mee. Ze wonen nu in
`public/huiswerk/` en gaan onveranderd mee naar `dist/`; in `vercel.json` hebben
ze een eigen, smallere policy die inline script toestaat maar geen enkele
verbinding naar buiten (`connect-src 'none'`). Wie ze ooit ombouwt haalt die
uitzondering weg.

## Waarom er nu wél een bouwstap is

Die was er niet, en dat was een echte waarde: wat in de repo stond, was wat er
draaide. Die eigenschap is opgegeven voor drie dingen die zonder bouwstap niet
te krijgen zijn.

**Getypte databasegrens.** Negen apps praten met dertig databasefuncties via
handgetypte parameternamen. Eén letter mis en PostgREST geeft netjes 200 terug op
een aanroep die niets doet — het getal blijft dan gewoon weg uit het scherm, en
dat merk je pas als je het mist. In `src/gedeeld/db/rpc.ts` staat elke functie
één keer, met wat erin gaat en wat eruit komt. Een verkeerde naam is nu een fout
bij het bouwen.

**Geen invoerveld dat leegloopt.** De oude schermen werden bij elke wijziging in
hun geheel opnieuw opgebouwd met `innerHTML`. Daarom stond overal `onchange` en
nergens `oninput`, en daarom moest de portiekeuze een veld met de hand uitlezen
voordat er hertekend werd. Dat probleem bestaat in React niet.

**Een strikte Content-Security-Policy.** Die kan alleen als er geen inline script
en geen inline stijl meer in de pagina staat. Voor de startpagina en
`/health/` staat hij nu aan — `script-src 'self'`, geen `unsafe-inline` — en
`npm run csp` laadt beide in een echte Chromium en telt de overtredingen. De
andere zeven apps hebben nog inline script en vallen daar dus buiten; zodra ze om
zijn komt hun pad erbij in `vercel.json`.

Wat er níét is: geen Tailwind. De stijl is gewone CSS met namen die iets
betekenen. Dat vervangen door utility-klassen levert meer regels op en minder
uitleg.

## Wat de apps wél delen

Bijna niets, en dat is de bedoeling — behalve waar zes kopieën van hetzelfde
uit elkaar gaan lopen. Op dit moment is dat drie dingen in `src/gedeeld/`:

| | |
|---|---|
| `db/` | De databasegrens. Elke functie één keer getypt; zie `db/rpc.ts`. |
| `wolk.ts` | Aanmelden en bewaren voor de zes apps die dat delen. |
| `schil.css` | De omlijsting: boven 1000 pixels wordt de tabbalk een zijbalk. |

`schil.css` is stijl en geen component. Vijf apps — Islam leren, Arabisch,
Computers & Code, Geloofsstudie en Koran uit je hoofd — hadden exact hetzelfde
skelet (`header.top` / `nav.tabs` / `main.wrap`) met elk een eigen kopie in hun
eigen `stijl.css`. Ze zetten nu `schil` op het element dat die drie bij elkaar
houdt en importeren dat bestand; verder verandert er niets in hun markup en
houden ze hun eigen kop, hun eigen teller en hun eigen kleuren.

Elke regel in dat bestand staat binnen `@media (min-width:1000px)`. Onder die
breedte raakt het niets aan: een telefoon krijgt exact de app die hij eerst
kreeg — nagemeten door de schermafdruk op 420 pixels voor en na te vergelijken,
en die is bij alle vijf byte voor byte gelijk. De kleuren van de zijbalk staan
in `gedeeld/zijbalk.css`, want de startpagina gebruikt ze ook.

## De rekenkern is overgezet, niet herschreven

Elke regel van `src/health/rekenkern.ts` en `klinisch.ts` komt uit de oude
oude app (nu `gereedschap/oud/health-index.html`), met typen erbij en zonder één getal te veranderen. Zo'n
overzetting is precies het moment waarop een stille fout binnenkomt: een haakje
verplaatst, een `Math.round` een niveau verschoven, een `>=` dat een `>` wordt.

Daarom staat de oude code er nog, in `gereedschap/oud/`, en genereert
`gereedschap/gouden-waarden-maken.mjs` daaruit de uitkomsten over veertig
dagenreeksen, dertig SCORE2-gevallen, twintig FIB-4's, vijfentwintig
STOP-BANG-invullingen en vijftien onderhoudszones. `rekenkern.proef.ts`
controleert de TypeScript-versie daartegen: 171 vergelijkingen, allemaal tegen
wat er wérkelijk uit kwam en niet tegen wat ik dacht dat eruit moest komen.
