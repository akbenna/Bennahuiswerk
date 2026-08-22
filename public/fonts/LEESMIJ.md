# Amiri

`amiri-400.woff2` en `amiri-700.woff2` — het Arabische lettertype van alle apps in
BennaHub, hier als bestand in plaats van via Google Fonts.

## Waarom in de repo

De Warsh-druk gebruikt tekens die de meeste systeemletters niet kennen. De kleine
hoge nul boven de hamzat wasl (U+06EC) is de opvallendste: die staat in bijna elke
aya, en een letter die hem niet heeft laat een leeg vak achter. Dan vallen er
gaten midden in woorden en klopt de tekst niet meer met wat er staat.

Zolang Amiri van Google Fonts kwam, gold dat bij elke eerste opening zonder
verbinding — precies de situatie waarin je in de trein een soera wilt nakijken.
Nu staat het lettertype naast de app en is er geen extra adres meer nodig.

Newsreader, Figtree en de andere Latijnse letters komen nog wél van Google. Die
missen niets als ze wegvallen: de tekst valt dan terug op een systeemletter en
blijft leesbaar.

## Bestanden

| Bestand | Wat | Grootte |
| --- | --- | --- |
| `amiri-400.woff2` | Amiri Regular, volledig | 146 kB |
| `amiri-700.woff2` | Amiri Bold, volledig | 137 kB |
| `OFL.txt` | de licentie | |

Ze zijn niet uitgedund. Dat scheelde maar zo'n 25 kB en Amiri leunt zwaar op
contextuele vervangingen om Arabisch goed aan elkaar te schrijven — bij het
wegsnijden van glyphs gaat dat stilletjes stuk, en dat merk je pas als een
kind een woord verkeerd overneemt.

## Herkomst en licentie

Amiri van het Alif Type-project, opgehaald uit `google/fonts` (`ofl/amiri`) en
met fontTools omgezet naar woff2. SIL Open Font License 1.1 — zie `OFL.txt`.
Vrij te gebruiken en mee te leveren; de naam Amiri mag niet op een gewijzigde
versie blijven staan. Wij wijzigen niets, alleen het bestandsformaat.

## Vervangen

    pip install fonttools brotli
    curl -LO https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf
    python3 -m fontTools.ttLib.woff2 compress -o fonts/amiri-400.woff2 Amiri-Regular.ttf

Idem voor `Amiri-Bold.ttf` naar `amiri-700.woff2`.

## Gebruik in de apps

Elke app zet bovenaan het stijlblok:

    @font-face{font-family:'Amiri';font-style:normal;font-weight:400;font-display:swap;
      src:url('../fonts/amiri-400.woff2') format('woff2')}

De hub gebruikt `fonts/…` zonder `../`, want die staat één map hoger.
