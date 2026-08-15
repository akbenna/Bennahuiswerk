# De map `audio`

Hier staat het geluid dat Bidaya afspeelt bij de Arabische teksten. De app werkt
zonder deze map: dan valt alles terug op de stem van het toestel. Met de map
erin klinkt het zoals het hoort.

```
audio/
  haal-recitatie.mjs   haalt de recitatiefragmenten op
  quran/
    lijst.json         welke fragmenten er zijn — de app leest dit
    h-fatiha-1.mp3     al-Fatiha, eerste regel
    h-ikhlas-3.mp3     al-Ikhlas, derde regel
    …
```

## De recitatie ophalen

De fragmenten zitten niet in de repository; ze komen uit een archief dat per aya
één opname aanbiedt. Eén commando:

```sh
node bidaya/audio/haal-recitatie.mjs --basis="https://<archief>/<map-van-de-reciteerder>"
```

Het script haalt precies de tweeënzestig regels op die in de app staan, zet ze
neer onder de naam die de app verwacht, en schrijft `lijst.json`. Wat mislukt,
meldt het; die regel valt in de app terug op de stem van het toestel.

**Warsh.** Zoek een map van een reciteerder in de riwāya van Warsh — dat is de
lezing die in Marokko en de rest van de Maghreb gebruikt wordt, en dus wat de
kinderen in de moskee horen. Op everyayah.com staan die onder `data/warsh/…`.
Krijg je alleen maar 404's, dan klopt de mapnaam niet; probeer een andere.

**De telling van al-Fatiha.** De meeste archieven houden de Kufische telling aan:
de basmala is aya 1 en de soera loopt tot aya 7. Bij Warsh hoort de
Medinensische telling, waarin de basmala niet meetelt en alles één opschuift.
Draai het script dus af en luister daarna naar `quran/h-fatiha-1.mp3`: hoor je
"bismillahi r-rahmani r-rahim"? Zo niet, draai opnieuw met `--fatiha=madani`.

Het script waarschuwt ook wanneer een soera in het archief méér aya's blijkt te
hebben dan het aantal regels in de app — dan houdt dat archief een andere
telling aan en moet de indeling van die soera nagekeken worden.

## De tekst en de lezing

De Arabische tekst in de app staat in de gebruikelijke Hafs-schrijfwijze, omdat
die overal online en in de meeste drukken staat en omdat de klankweergave in
Nederlandse letters daarop aansluit. Wie een Warsh-recitatie meelevert, hoort op
een enkele plek iets anders dan er staat — het bekendste geval is
`مَالِكِ يَوْمِ الدِّينِ` (Hafs) tegenover `مَلِكِ يَوْمِ الدِّينِ` (Warsh) in
al-Fatiha. Dat is geen fout van de een of de ander; het zijn twee overgeleverde
lezingen. Leg het een keer uit aan tafel, dan is het meteen een les.

## De zinnen van het gebed

Voor de takbir, de tashahhud, de salawat, de woorden in de buiging en de knieval
en de du'a's van de dag bestaat geen archief. Die spreek je thuis zelf in: in de
app onder **Ouder → Eigen stem opnemen**. De opnames blijven in het toestel waar
ze gemaakt zijn; met de knop onderaan dat scherm sla je ze op als bestand en lees
je ze in op de telefoon van een kind.

Een eigen opname gaat altijd vóór op een meegeleverd fragment, en beide gaan vóór
op de stem van het toestel.

## Herkomst

Recitaties worden door de archieven vrij verspreid voor persoonlijk en
educatief gebruik. Dit is een app voor één gezin; blijf daarbinnen, en zet de
opnames niet door als eigen materiaal.
