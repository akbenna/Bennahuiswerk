# Bennahuiswerk × Junior Einstein — analyse en verbeterplan

_Opgesteld juli 2026. Doel: de didactische opbouw en best practices van Junior Einstein vertalen naar concrete verbeteringen voor jouw eigen app. Geen content van Junior Einstein wordt overgenomen — auteursrechtelijk beschermd — wél de onderliggende aanpak, waarmee je eigen, originele oefenstof sterker wordt._

## Waar je al staat

Voordat we naar Junior Einstein kijken, is het eerlijk om vast te stellen dat Bennahuiswerk didactisch al verrassend compleet is. Je hebt een adaptief niveau (Auto 1–3 dat meebeweegt met succes), slim herhalen via Leitner, interleaving, een proeftoets- en oefentoetsmodus met timer, meerkeuze, gerichte foutfeedback met uitlegpanelen en visuals, een automatisch foutenschrift, een volwaardig ouder-dashboard, per-kind cloud-accounts en een stevige motivatielaag met beloningen, rangen, spelletjes en challenges. Dat is precies de kern die Junior Einstein óók heeft — je zit dus niet achter, je mist vooral een paar specifieke bouwstenen in de *opbouw* rondom het oefenen zelf.

Junior Einstein is in de basis een oefenmachine met meer dan 500.000 vragen, verdeeld over aparte vakwebsites (rekenen, taal, begrijpend lezen, IEP, spelling, automatiseren, doorstroomtoets, engels, topo, zaakvakken). Hun voorsprong zit niet in de vraagtypes — die heb jij ook — maar in de schil eromheen: hoe ze een kind *naar* een som toe leiden, hoe ze uitleg aanbieden vóór en na een fout, hoe toegankelijk ze het maken, en hoe de ouder stuurt. Daar zit jouw winst.

## De zeven bouwstenen van Junior Einstein die jij kunt overnemen

**1. Uitleg vóór het oefenen — de "leerkaart".** Junior Einstein zet naast oefeningen honderden uitlegartikelen en meer dan tienduizend uitlegvideo's, precies op de lastige onderwerpen (klokkijken, breuken, werkwoordspelling). Het model is *eerst leren, dan oefenen*. Bij jou begint een kind meteen bij de som; de uitleg (`s`) verschijnt pas ná een antwoord of hint. Dat is prima voor herhalen, maar zwak voor nieuwe stof. De adoptie: geef elk onderwerp (`t`) een korte uitlegkaart van drie tot vijf regels plus de bestaande visual, die het kind één keer te zien krijgt voordat het aan een nieuw onderwerp begint — met een knop "ik snap het, start". Je hebt de uitleg feitelijk al liggen in de `s`- en `h`-velden; je hoeft die alleen te bundelen tot een introductie per onderwerp.

**2. Audio-ondersteuning — voorlezen.** Dit is de grootste, makkelijkste winst. Junior Einstein leest teksten, vragen én antwoordopties voor, standaard aan voor kleuters en groep 3, per kind instelbaar daarboven. Voor Selma (groep 5) en voor alle begrijpend-leesteksten is dat direct waardevol: het haalt de leeslast weg zodat een rekenfout niet stiekem een leesfout is. In een browser-app kost dit vrijwel niets: de ingebouwde `SpeechSynthesis` (Web Speech API) leest Nederlandse tekst voor, gratis, zonder externe dienst. Eén luidspreker-icoontje bij de vraag, één aan/uit-schakelaar per kind in de oudermodus. Geen nieuwe content nodig.

**3. Expliciete leerdoelen met beheersing per doel.** Junior Einstein deelt alles in "duidelijke categorieën en moeilijkheidsgraad per groep" en heeft een aparte "Leerdoelen"-ingang. Jij organiseert nu per onderwerp (`t`), en je ROADMAP schat dekking in procenten — maar het kind en de ouder zien geen leerdoelenkaart. De adoptie: til het onderwerp op tot een benoemd leerdoel per vak en toon een beheersingsraster (bijvoorbeeld per doel: nog niet begonnen / aan het leren / beheerst), gevoed door de scores die je al bijhoudt. Dat maakt zichtbaar wat áf is en waar nog werk zit, en het geeft de proeftoets een logische bron ("toets mijn zwakke doelen").

**4. De weektaak — de ouder zet de week klaar.** Junior Einstein heeft een weektaakmodule waarmee de ouder wekelijks gerichte oefeningen klaarzet, toegesneden op het niveau. Jij hebt een dagdoel en een zomer-challenge, maar geen manier voor jou als vader om te zeggen: "Amine, deze week vooral samenvatten en werkwoordspelling." Dat is precies wat het IEP-detailrapport vraagt. De adoptie: een simpel scherm in de oudermodus waar je per kind twee tot vier onderwerpen voor de week aanvinkt; het kind ziet die als "jouw weektaak" bovenaan, met een voortgangsbalk. Sluit naadloos aan op je bestaande dagmissie.

**5. De prijzenkast — sparen wat je kunt zien.** Junior Einstein laat kinderen plaatjes verdienen en medailles winnen voor een zichtbare "prijzenkast". Jij hebt punten, rangen en trofeeën, maar die zijn abstract. Een verzamelbaar, zichtbaar album (stickers of plaatjes die je vrijspeelt met beheerste doelen) werkt sterk bij jongere kinderen — voor Selma en Amine meer dan een getal. Dit past bij je bestaande beloningslogica: koppel een nieuw plaatje aan elk beheerst leerdoel of elke gehaalde weektaak, geen echt geld nodig.

**6. Sessie-review — elke vraag teruglezen.** Junior Einstein laat kind én ouder na afloop elk gegeven antwoord terugzien: wat was goed, wat fout, en waarom. Jouw foutenschrift vangt de fouten, maar niet de hele sessie. De adoptie is klein: bewaar per oefensessie de gestelde vragen met het gegeven antwoord en toon aan het eind een compact overzicht ("18 goed, 2 fout — bekijk je fouten"), met de uitleg (`s`) direct erbij. Voor de proeftoets heb je dit half al; trek het door naar gewone sessies.

**7. Toegankelijkheid als expliciete laag.** De rode draad bij Junior Einstein is dat een kind dat iets nog niet kan, niet vastloopt: audio bij zwakke lezers, video bij een fout, artikelen bij een lastig onderwerp. Dat is geen losse functie maar een houding — bij elk moment van falen is er een uitweg omhoog. Jouw hints en uitlegpanelen doen dit al; audio (punt 2) en de leerkaart vooraf (punt 1) maken de laag compleet.

## Prioritering — impact tegen inspanning

De volgorde die ik zou aanhouden, van meeste rendement per uur werk naar minste:

1. **Audio-ondersteuning (voorlezen).** Klein te bouwen, groot effect, vooral voor Selma en alle leesteksten. Geen content nodig.
2. **Leerkaart vóór het oefenen.** Middelgroot; hergebruikt je bestaande `s`/`h`-teksten. Grootste didactische sprong voor nieuwe stof.
3. **Weektaak in de oudermodus.** Klein tot middel; sluit direct aan op Amine's IEP-zwaktes en jouw dagmissie.
4. **Sessie-review.** Klein; grotendeels aanwezig in de proeftoetsmodus, alleen doortrekken.
5. **Leerdoelen-beheersingsraster.** Middel tot groot; vraagt een lichte herordening van `t` naar benoemde doelen, maar maakt voortgang echt zichtbaar.
6. **Prijzenkast met verzamelplaatjes.** Middel; leukste voor de kinderen, maar puur motivatie — daarom lager dan de didactische punten.

## Wat ik meteen kan bouwen

Alles hierboven past binnen je huidige opzet: oefenstof blijft in `SEED`/`TEMPLATES`, de schermcode in `index.dev.html`, en na wijziging hercompileer ik `index.html` (JSX → `React.createElement`, Babel eruit) zoals je BUILD.md voorschrijft. Geen van deze punten vereist nieuwe externe diensten; audio en review draaien volledig in de browser.

Zeg welk punt je eerst wilt, dan bouw ik het in `index.dev.html`, hercompileer ik de live-versie en laat ik je precies zien wat er veranderd is. Mijn advies: begin met audio-ondersteuning (punt 1 op de prioriteitenlijst) — de kortste weg naar zichtbaar resultaat voor de kinderen.
