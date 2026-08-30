# Hoe deze app werkt

Dit is geen verantwoording en geen bouwhandleiding. `VERANTWOORDING.md` legt elke
rekenregel uit met bron en beperking, `BUILD.md` legt uit hoe je hem bouwt. Dit
bestand legt uit **waarom de app zich gedraagt zoals hij doet**, in gewone taal,
voor wie hem gebruikt of eraan verder werkt.

Alles hieronder komt terug op één regel.

---

## De grondregel: geen getal zonder zijn onzekerheid

Een puntschatting zonder interval is in dit ontwerp een fout, geen
vereenvoudiging.

Als de app zegt dat je vandaag 1.847 kcal at, dan zegt hij er in dezelfde adem bij
dat het tussen de 1.610 en 2.084 ligt. Niet uit valse bescheidenheid, maar omdat
dat de waarheid is: een deel van je eten is gewogen, een deel is geschat, en het
verschil daartussen mag niet verdwijnen zodra er een getal op het scherm komt.

Daaruit volgt de rest van dit document. Wie zich afvraagt waarom de app iets
omslachtig doet, vindt het antwoord bijna altijd hier.

---

## 1. De drie tekens

Voor elke regel in je dag staat een teken. Het zegt waar het getal vandaan komt.

| | | |
|---|---|---|
| **◆** | gemeten | een laboratoriumbepaling uit de Nederlandse voedingsmiddelentabel (NEVO) |
| **◈** | etiket | de opgave van een fabrikant, met een wettelijke marge van rond de tien procent |
| **◇** | geschat | het model, een gerecht, of je eigen product |

Deze drie zijn met opzet niet twee. Een etiket is geen laboratoriumbepaling, maar
het is ook geen gok: er staat een fabrikant achter die er wettelijk aan gehouden
kan worden. Onder ◇ scharen zou een etiket te laag inschatten, onder ◆ te hoog.

Dit is ook de reden dat merkproducten in een **eigen tabel** staan en niet in de
NEVO-tabel. Zou je ze daar doorheen mengen, dan kregen ze ◆ en zou de app
beweren dat een etiketopgave een meting is. Dat is precies de leugen die deze app
probeert niet te vertellen.

---

## 2. Hoe het zoeken werkt

Typ je iets in het zoekveld, dan gebeurt er dit, in deze volgorde.

**Stap 1 — de woorden.** Je zin wordt in woorden geknipt. Vulwoorden gaan eruit:
`met`, `van`, `de`, `een`, en ook de telwoorden `twee` tot en met `tien`. Dat
laatste is geen kosmetiek. Zoeken op "twee boterhammen met mayonaise" zette ooit
een graanreep bovenaan, omdat in de merknaam `b'tween` achter de apostrof een
nieuw woord begint waar `twee` op past — en omdat "twee" in vrijwel geen
productnaam voorkomt, woog het ook nog eens het zwaarst.

**Stap 2 — zeldzame woorden wegen zwaarder.** Wie "tonijn in water" zoekt, wordt
geholpen door "tonijn" en nauwelijks door "water". De app rekent dat uit in plaats
van het aan te nemen.

**Stap 3 — synoniemen.** NEVO schrijft niet zoals mensen praten. Er staat geen
boterham maar Tarwebrood, geen patat maar Frites, geen kipfilet maar "Kip filet".
Die woorden zijn er los aan gehangen, zodat je vindt wat je bedoelt.

**Stap 4 — en pas als dat allemaal niets oplevert: de benadering.**

### Wat "Niets met precies die spelling" betekent

Vindt het zoeken helemaal niets, dan probeert de app het nog één keer, en dan
**zegt hij dat ook**:

> Niets met precies die spelling. Dit lijkt erop:

Wat er dan gebeurt, is dit. Van elk woord wordt het **medeklinkerskelet**
genomen: accenten weg, dubbele letters samengetrokken, verwante medeklinkers
gelijkgesteld (c→k, d→t, j→g, v→f, z→s), en klinkers en de h eruit. Wat overblijft
is wat een woord hóórbaar maakt.

```
lasagne   → lsgn        lesagna   → lsgn        gelijk
couscous  → ksks        koeskoes  → ksks        gelijk
spaghetti → spgt        spagetti  → spgt        gelijk
komkommer → kmkmr       komkomer  → kmkmr       gelijk
```

Zo vindt "lesagna" toch de lasagne. Vóór dit bestond gaf één verkeerde letter een
leeg scherm, en voor een kind dat zijn eten intypt is dat de gewoonste manier om
op te geven.

**Waarom hij pas als laatste draait.** Een benadering mag nooit een echte treffer
verdringen. Typ je "mayonaise", dan krijg je exact wat je altijd kreeg, in exact
dezelfde volgorde.

**Waarom hij alleen naar namen kijkt.** Een eerdere versie liet ook
gelijkenis-op-letterniveau meetellen, en zocht bovendien in de synoniemenvelden
mee. Het resultaat was dat "harira" Haring en Bokking gaf (Engels: *herring*) en
sperziebonen (Frans: *haricots*), en dat "doner" Pepermunt gaf — want NEVO zet
daar "after dinner mints" bij, en `dinner` heeft hetzelfde skelet als `doner`.
Allemaal netjes onder de kop "dit lijkt erop". **Een fout antwoord, netjes
ingepakt, is erger dan een leeg scherm.** Daarom: alleen op wat NEVO zelf een naam
noemt, en niet op een synoniem dat zelf al een benadering is.

### Namen in je eigen taal

De gerechtenbibliotheek bewaart per gerecht ook de namen in andere talen —
Nederlands, Darija, Tarifit, Arabisch, Turks en Sranan. Die worden meegezocht.
"Mercimek" vindt de Turkse linzensoep, ook al staat dat woord in geen enkele
Nederlandse naam.

---

## 3. Porties: de onzekerheid staat op de waarde, nooit op het gewicht

Dit onderscheid is klein en het is overal.

Een pak van 200 gram **is** 200 gram. Daar is niets onzeker aan; het staat op de
verpakking. Wat je niet zeker weet, is hoeveel kilocalorieën daarin zitten.

Dus: bij een merkproduct krijg je de fabrikantportie als eerste keuze, met het
gewicht als een hard getal en de energie met een marge eromheen. Bij een
huishoudmaat ("een eetlepel", "een schaaltje") ligt het andersom — dán is het
gewicht de onzekere kant, en staat er een band omheen.

### De tabel heeft gezag over het model

Vraag je de app om een maaltijd in gewone taal te herkennen, dan schat het model
wat er in zit. Maar hoeveel een eetlepel weegt, schat het model **niet** — dat
staat in de portietabel, en die wint. Als de tabel zegt dat een eetlepel 15 g is
(met 10–20 g als band), dan is het 15 g, en de app zegt erbij dat dat uit de tabel
komt en niet geschat is.

Deze regel gold al voor voedingsstoffen en geldt sinds kort ook voor
portiegewichten. Hij is er gekomen omdat één schaaltje cornflakes op 180 g stond
— dat is 672 kcal. Het is 54 g.

---

## 4. Waar het dagverbruik vandaan komt

Niet uit een formule maar uit **jouw gewichtstrend**. De app kijkt naar wat je at
en wat de weegschaal deed, en leidt daaruit af hoeveel je verbrandt.

Dat is meer werk dan een formule invullen, en het is om één reden beter: door te
meten worden adaptieve thermogenese (je verbranding zakt als je afvalt) en je
persoonlijke activiteitsniveau **automatisch meegenomen**. Die hoeven niet
gemodelleerd te worden — ze zitten al in de meting.

De prijs is dat het even duurt. De eerste weken leunt de app nog op een
formuleschatting en is het interval breed. Dat is geen storing; dat is het
interval dat eerlijk is over hoe weinig er nog gemeten is.

De volledige onderbouwing, inclusief wat er níet te verifiëren viel, staat in
`VERANTWOORDING.md`.

---

## 5. De poorten op de gegevensbronnen

Twee bronnen liggen achter een schakelaar die uit staat tenzij iemand hem
bewust omzet.

**NEVO.** De brontabel zelf staat niet in deze repo — dat mag niet van de
licentie. Wat er staat is wat eruit is afgeleid en in de database zit. Staat de
licentie van de actieve versie niet op "gecontroleerd", dan vindt het zoeken
niets. Dat is geen storing maar het slot dat werkt.

**Open Food Facts** (de merkproducten). Die staan onder ODbL: je mag ze
gebruiken en verspreiden, maar bronvermelding is verplicht. Daarom kan die bron
niet aan zonder dat er een bronvermelding is ingevuld. Een voorwaarde die nergens
vastligt, wordt vergeten.

---

## 6. Wat waar bewaard wordt

- **Je dagen, je gewicht, je maaltijden** — centraal, achter je eigen aanmelding.
- **De cursussen van de Academie** — alleen op het toestel waar je ze doet, in de
  browseropslag. Geen account, geen naam, geen code.
- **Je aanmelding** — acht uur, daarna verloopt hij vanzelf. Op een gedeelde
  tablet blijft anders het account van 's ochtends de hele avond openstaan.

Toegang tot de database loopt altijd via functies met vaste rechten; de tabellen
zijn niet rechtstreeks te lezen. In de browser komt alleen de publieke sleutel.
Waarom dat veilig is, staat uitgelegd in `src/gedeeld/db/verbinding.ts`.

---

## 7. Wat de app niet weet

Dit hoort er net zo goed in te staan.

- Hij weet niet of je alles hebt ingevoerd. Onderrapportage is de grootste
  foutenbron in elk voedingsdagboek, ook in dit.
- Hij weet bij een gerecht niet wat er is ingedampt. Wat verdampt verdwijnt uit
  de pan maar niet uit de noemer, dus bij lang stoven valt de uitkomst aan de
  lage kant. Dat staat bij de regel en wordt niet weggepoetst.
- Hij weet niet of er lamsvlees in de harira ging. Dat is geen onzekerheid maar
  een vraag met een antwoord, en die vraag stelt hij.

---

## Voor wie eraan verder werkt

`CLAUDE.md` heeft de werkafspraken, `BUILD.md` de bouw, `VERANTWOORDING.md` elke
rekenregel, `AUTOMATISERING.md` wat er vanzelf draait, en `BESCHOUWING.md` een
terugblik met de fouten erin die onderweg gemaakt zijn.

Eén gewoonte is belangrijker dan alle vier: **meten voordat je verandert.** In
deze app is bijna elke aanname die vanzelfsprekend leek, bij nameten onjuist
gebleken — de mayonaise die "stuk" was, de eetlepel die "ontbrak", de macaroni die
niet bestaat, en de haring die voor harira doorging.
