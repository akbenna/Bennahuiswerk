# De pictogrammen van BennaHub

Elke app heeft er hier één, in zijn eigen kleur. Daarvóór deelden ze allemaal
dezelfde lachende ster, en dat is precies wat je niet wilt: op het beginscherm
van een telefoon staan acht identieke tegels naast elkaar en zoekt een kind zich
suf. Kleur en vorm samen zijn genoeg om ze uit elkaar te houden, ook op een
scherm van zestien pixels breed en ook voor wie nog niet vlot leest.

| Bestand | App | Kleur | Merk |
|---|---|---|---|
| `hub.svg` | BennaHub | antraciet | vier gekleurde tegels: alle apps onder één dak |
| `huiswerk.svg` | Huiswerk | groen | een opengeslagen boek met een rug en tekstregels |
| `islam.svg` | Islam leren | groenblauw | maan en ster |
| `arabisch.svg` | Arabisch | blauw | de letter bāʾ, met de ruitvormige punt eronder |
| `code.svg` | Computers & Code | pruim | de haken van code |
| `spelletjes.svg` | Spelletjes | terracotta | een dobbelsteen |
| `geloofsstudie.svg` | Geloofsstudie | paars | een boekrol |
| `koran.svg` | Koran uit je hoofd | indigo | een boek met leeslint |
| `kalibratie.svg` | Energiebalans | leisteen | een balans met twee schalen |
| `kompas.svg` | Kompas | oker | een kompasroos met een tweekleurige naald |
| `verbind.svg` | Verbind | oker | twee tekstballonnen die elkaar overlappen |
| `podium.svg` | Podium | oker | een microfoon op een standaard |

De laatste drie delen één kleur, en dat is de enige uitzondering op de regel
hierboven. Het zijn de drie cursussen van de Academie: ze horen bij elkaar en dat
hoort te zien te zijn. Uit elkaar houden doet de vórm, een kompasroos, twee
tekstballonnen en een microfoon lijken in niets op elkaar, ook niet op zestien
pixels.

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

## Hertekenen, en wat een beeldgenerator wel en niet kan

Vier van deze pictogrammen zijn in september 2026 opnieuw getekend naar een
voorbeeld dat met een beeldgenerator gemaakt was. Dat werkte, maar niet zoals je
zou denken.

De **compositie** die eruit kwam was beter dan wat er stond: de twee ballonnen van
Verbind overlapten netter, het boek van Huiswerk kreeg een rug en tekstregels, de
bāʾ werd een echte letter in plaats van een kom met een punt, en de kompasnaald
werd groot genoeg om de ring niet te laten winnen.

Het **bestand** was elke keer onbruikbaar. Bitmap in plaats van vector, gerasterde
randen, een verloop in de achtergrond waar een vlakke kleur hoort, en bij Verbind
witte vegen die uit de generatie waren blijven staan. Zulke bestanden passen niet
in deze set: ze schalen niet, ze wijken af in kleur, en op zestien pixels vallen
ze uit elkaar.

De werkwijze die wél klopt is dus: laat de generator de vorm bedenken, meet de
verhoudingen eruit, en teken hem over als vectorpaden in de kleuren die hier al
liggen. Dat kost een paar minuten per pictogram.

Twee dingen die daarbij misgingen en het onthouden waard zijn. Een staartje van
zeven eenheden aan een ballon van zesentwintig hoog leest als een hoekje en niet
als een punt, de verhouding telt, niet de aanwezigheid. En een letter opbouwen
uit twee losse contouren (buitenkant en binnenkant) gaat mis bij de uiteinden:
die lopen dan dood. Eén gestreken boog met een vaste lijndikte houdt zijn dikte
overal, ook bij de tip.
