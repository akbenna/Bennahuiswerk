# De pictogrammen van BennaHub

Elke app heeft er hier één, in zijn eigen kleur. Daarvóór deelden ze allemaal
dezelfde lachende ster, en dat is precies wat je niet wilt: op het beginscherm
van een telefoon staan acht identieke tegels naast elkaar en zoekt een kind zich
suf. Kleur en vorm samen zijn genoeg om ze uit elkaar te houden, ook op een
scherm van zestien pixels breed en ook voor wie nog niet vlot leest.

| Bestand | App | Kleur | Merk |
|---|---|---|---|
| `hub.svg` | BennaHub | antraciet | vier gekleurde tegels: alle apps onder één dak |
| `huiswerk.svg` | Huiswerk | groen | een opengeslagen boek |
| `islam.svg` | Islam leren | groenblauw | maan en ster |
| `arabisch.svg` | Arabisch | blauw | de letter bāʾ |
| `code.svg` | Computers & Code | pruim | de haken van code |
| `spelletjes.svg` | Spelletjes | terracotta | een dobbelsteen |
| `geloofsstudie.svg` | Geloofsstudie | paars | een boekrol |
| `koran.svg` | Koran uit je hoofd | indigo | een boek met leeslint |
| `kalibratie.svg` | Energiebalans | leisteen | een balans met twee schalen |
| `kompas.svg` | Kompas | oker | een kompasroos |
| `verbind.svg` | Verbind | oker | twee tekstballonnen die elkaar raken |
| `podium.svg` | Podium | oker | een microfoon op een standaard |

De kleuren komen uit het palet van de hub (`index.html`, de lichte variant).
Leisteen is er als enige onverzadigd bij: de zeven leerapps zijn gekleurd omdat
een kind een tegel moet kunnen aanwijzen, Energiebalans is een meetinstrument
voor een volwassene en herkenbaar juist doordat hij niet meedoet.
Het merk is altijd crème (`#FFF8EE`) op een vol gekleurd vlak: dat haalt ruim
contrast en het blijft leesbaar als het besturingssysteem er een rondje van
maakt.

## De PNG's

iOS gebruikt geen SVG voor het pictogram op het beginscherm, dus staat er van
elk merk ook een `-180.png`. Die zijn gemaakt uit dezelfde SVG met:

    node iconen/maak-png.mjs

Verander je een SVG, draai dat script dan opnieuw en zet beide bestanden in
dezelfde commit. Het script heeft Playwright nodig; die zit in deze omgeving al.

## Veilige rand

De tekening blijft binnen de middelste tachtig procent van het vlak. Android
knipt er bij een *maskable* pictogram een cirkel of een afgerond vierkant uit,
en wat buiten die rand staat is het eerste wat sneuvelt.
