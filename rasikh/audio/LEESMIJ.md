# Recitatie voor Rasikh

Rasikh speelt per aya een fragment af. Zonder eigen bestanden valt de app terug
op de achtenvijftig fragmenten die al in `noer/audio/quran` staan — al-Fatiha en
de laatste elf korte soera's. Voor al het andere hoor je niets.

Hier zet je de rest neer.

## Ophalen

Vanuit de map van het project:

    node rasikh/audio/haal-audio.mjs

Zonder opties haalt hij juz 'amma op, soera 78 tot en met 114. Dat is 564 aya,
ongeveer zestig megabyte, en duurt een paar minuten.

| Wat je wilt | Wat je typt |
| --- | --- |
| Een ander stuk | `--soera=67-114` |
| Eén soera | `--soera=2` |
| Alles | `--soera=alles --ja` |
| Een bepaalde reciteerder | `--bron=warsh-dosary` |
| De bronnen zien | `--lijst` |
| Opnieuw ophalen wat er al staat | `--opnieuw` |

Bij meer dan vijfhonderd nieuwe fragmenten vraagt het script eerst om `--ja`.
De hele Koran is ruim zesduizend bestanden en een halve gigabyte.

Het script begint bij Warsh — de lezing van de Maghreb, dezelfde die in de app
standaard aanstaat. Werkt geen van de Warsh-bronnen, dan pakt het een Hafs-lezing
en zegt het erbij. Zet in dat geval ook de lezing in de app om, anders lees je
iets anders dan je hoort.

Al opgehaalde bestanden worden overgeslagen, dus je kunt het script gerust
afbreken en later verdergaan.

## Wat er ontstaat

    rasikh/audio/78-1.mp3      soera 78, aya 1
    rasikh/audio/78-2.mp3
    …
    rasikh/audio/lijst.json    wat er ligt, en van wie

De app leest `lijst.json` bij het opstarten en weet daarna welke aya's een stem
hebben. Bij een aya zonder fragment blijft de luisterknop weg — geen kapotte knop.

## Twee stemmen door elkaar

Haal je later een stuk op bij een andere reciteerder, dan waarschuwt het script.
Bij memoriseren is dat lastiger dan het lijkt: je onthoudt een aya mede aan de
melodie, en een wisseling halverwege haalt dat onderuit. Wil je overstappen,
gooi dan de map leeg en haal alles opnieuw op.

## Grootte en git

Mp3's zijn zwaar. Juz 'amma erbij in git is nog te doen; de hele Koran maakt de
map een halve gigabyte, en die blijft daarna voorgoed in de geschiedenis zitten.
Wil je alles lokaal houden, zet dan in `.gitignore`:

    rasikh/audio/*.mp3

`lijst.json` moet je dan wél meenemen op het apparaat waar je oefent, want daar
leest de app uit wat er beschikbaar is.
