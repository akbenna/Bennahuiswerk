import type { Fout, Onderwerp, Regelsoort, Rouwstap } from './soorten'

/* =============================================================================
   DE GEBEDEN DIE NIET ELKE DAG TERUGKOMEN

   De vijf gebeden leer je door ze te doen: vijf keer per dag, jaar in jaar uit.
   Deze niet. Het feestgebed komt twee keer per jaar langs, en het gebed bij een
   overledene komt precies op het moment dat niemand in huis rustig kan nadenken.
   Juist daarom staan ze hier uitgeschreven, met wat je doet, wat je zegt, en
   wat er wél en niet moet.

   Per gebed staat de regel erbij:
     fard    — verplicht voor wie eraan toe is
     kifaya  — plicht van de gemeenschap: doet een groep het, dan is het gedaan
               voor iedereen; doet niemand het, dan draagt de hele buurt de schuld
     sunna   — sterk aanbevolen, niet verplicht
============================================================================= */
export const REGELS: Record<string, Regelsoort> = {
  fard:  {t:'Verplicht',                  c:'fout'},
  kifaya:{t:'Plicht van de gemeenschap',  c:'let'},
  sunna: {t:'Sterk aanbevolen',           c:'k'},
  mag:   {t:'Aanbevolen',                 c:'info'}
};

export const BIJZONDER: Onderwerp[] = [
 {id:'jumua', n:'Het vrijdaggebed', ar:'صلاة الجمعة', regel:'fard', rak:'2 rak\'a, hardop',
  kort:'Op vrijdag vervangt dit het Dhuhr-gebed. Voor volwassen mannen die thuis zijn is het geen keuze: je gaat.',
  wanneer:'Vrijdagmiddag, in de tijd van Dhuhr, in de moskee van de buurt.',
  hoe:['De imam houdt eerst de <b>khutba</b>, de preek — in twee stukken, met een korte zit ertussen.',
       'Daarna bid je twee rak\'a achter de imam, hardop gelezen.',
       'Kom je zo laat dat je de imam niet meer in de buiging van de tweede rak\'a haalt, dan heb je het vrijdaggebed gemist: je bidt dan gewoon Dhuhr, vier rak\'a.'],
  let:'In deze school hoort de khutba erbij als voorwaarde: wie alleen het gebed pakt en de preek overslaat, heeft het vrijdaggebed niet. Tijdens de preek zwijg je — zelfs "ssst" tegen iemand die praat is te veel. Telefoon uit, dus.',
  tips:['Was je (ghusl), trek schone kleren aan en gebruik geur. Dat is sunna en het is precies wat vrijdag anders maakt dan donderdag.',
        'Lees soerat al-Kahf op vrijdag.',
        'Zeg vaak de zegenwens op de Profeet ﷺ; vrijdag is daar de dag voor.',
        'Ergens op vrijdag zit een uur waarin een du\'a wordt verhoord. Niemand weet precies wanneer — dus vraag de hele dag door.'],
  vragen:[['Geldt het ook voor kinderen?','Nee. Het is verplicht voor volwassen mannen die niet op reis zijn. Ga je als kind mee, dan is dat prachtig en went het vanzelf — maar het is geen plicht en niemand mag je erop aankijken.'],
          ['En vrouwen?','Voor vrouwen is het niet verplicht. Wil je gaan, dan mag dat; blijf je thuis, dan bid je Dhuhr.']],
  zeg:[]},

 {id:'eid', n:'Het feestgebed', ar:'صلاة العيد', regel:'sunna', rak:'2 rak\'a, hardop',
  kort:'Twee keer per jaar: op de ochtend van het suikerfeest (\'id al-fitr) en van het offerfeest (\'id al-adha).',
  wanneer:'\'s Ochtends, vanaf een klein half uur na zonsopgang tot de middag. Het liefst buiten of in een grote zaal, met de hele buurt bij elkaar.',
  hoe:['Er is <b>geen adhan en geen iqama</b>. Het gebed begint gewoon.',
       'Eerste rak\'a: zeven takbirs — de openingstakbir meegeteld, dus zes extra. Daarna al-Fatiha en een soera, hardop.',
       'Tweede rak\'a: zes takbirs, waaronder die waarmee je opstaat. Dus vijf extra, en daarna weer al-Fatiha en een soera.',
       'De rest gaat als een gewoon gebed: buiging, knieval, tashahhud, slotgroet.',
       'Pas <b>ná</b> het gebed komt de preek — andersom dan op vrijdag. Je mag weglopen, maar blijven is beter.'],
  let:'Vergeet je een takbir of doe je er een te veel, dan is je gebed niet stuk. De takbirs zijn sunna. In andere scholen worden ze anders geteld; bid je mee, kijk dan naar de imam en volg hem.',
  tips:['Op het suikerfeest eet je iets zoets vóór je gaat — een oneven aantal dadels is de gewoonte. Op het offerfeest juist niet: daar eet je pas ná het gebed.',
        'Schone of nieuwe kleren, geur, en iedereen mee: ook de kleintjes.',
        'Loop naar het gebed langs de ene weg en terug langs de andere. Zo groet je meer mensen.',
        'Onderweg zeg je de takbir van het feest, hardop, samen.'],
  vragen:[['Wanneer zeg je die takbir precies?','Bij het suikerfeest op weg naar het gebed. Bij het offerfeest bovendien na elk verplicht gebed — in deze school vanaf Dhuhr op de feestdag zelf tot en met het Fajr-gebed op de dertiende. Dat zijn vijftien gebeden.'],
          ['Is het feestgebed verplicht?','In deze school niet: het is sterk aanbevolen. Maar het is een van die dingen die je niet overslaat — het feest ís dat gebed.']],
  zeg:['takbirEid']},

 {id:'janaza', n:'Het gebed bij een overledene', ar:'صلاة الجنازة', regel:'kifaya', rak:'Geen rak\'a — vier takbirs, staand',
  kort:'Het enige gebed zonder buiging en zonder knieval. Je staat, en je vraagt vergeving voor iemand die er niet meer is.',
  wanneer:'Vlak voor de begrafenis, meestal na een van de vijf gebeden. In de moskee of op het kerkhof.',
  hoe:['Je hebt wudu nodig, net als bij elk gebed, en je staat naar de qibla met de overledene voor je.',
       '<b>Eerste takbir</b> — handen omhoog. Daarna prijs je Allah en zeg je de zegenwens op de Profeet ﷺ.',
       '<b>Tweede takbir</b> — handen blijven nu omlaag. Du\'a voor de overledene.',
       '<b>Derde takbir</b> — nog een du\'a, ook voor alle moslims, levend en overleden.',
       '<b>Vierde takbir</b> — een korte du\'a, en dan één slotgroet naar rechts, zachtjes.',
       'Daarna loop je mee naar het graf. De overledene wordt op zijn rechterzij gelegd, met het gezicht naar de qibla.'],
  let:'Er wordt geen al-Fatiha gelezen in dit gebed volgens de Malikitische school, en de handen gaan alleen bij de éérste takbir omhoog. In andere scholen wordt al-Fatiha wél gelezen. Sta je ergens anders mee te bidden: kijk en volg.',
  tips:['Het is een <i>fard kifaya</i>: als een groep het doet, is het voor iedereen gedaan. Maar meelopen is een van de mooiste dingen die je voor iemand kunt doen, en je krijgt er beloning voor tot het graf gedicht is.',
        'Kinderen mogen mee. Het is niet eng — het is eerlijk, en beter dan het van een afstand raden.',
        'Voor een klein kind zeg je een andere du\'a: een kind heeft geen vergeving nodig, dus je vraagt of het zijn ouders vooruit mag gaan.'],
  vragen:[['Mag ik het ook doen als ik te laat ben?','Ja. Je stapt in bij de takbir waar de imam is en maakt de takbirs die je mist daarna alleen af.'],
          ['En als iemand ver weg begraven wordt?','Dan wordt er soms in afwezigheid gebeden. In deze school gebeurt dat niet standaard; vraag je imam.']],
  zeg:['janazaDua','janazaKind','bijGraf']},

 {id:'reis', n:'Bidden op reis', ar:'صلاة المسافر', regel:'sunna', rak:'4 wordt 2',
  kort:'Ben je onderweg naar iets ver weg, dan wordt het gebed korter. Dat is geen uitzondering die je krijgt — het is hoe het hoort.',
  wanneer:'Vanaf ongeveer 80 kilometer, gerekend vanaf de rand van je eigen plaats.',
  hoe:['Dhuhr, Asr en Isha bid je met <b>twee</b> rak\'a in plaats van vier.',
       'Fajr blijft twee en Maghrib blijft drie — die veranderen niet.',
       'Het korten begint zodra je de bebouwde kom uit bent, en stopt zodra je terug bent.',
       'Ben je van plan vier dagen of langer op één plek te blijven, dan bid je daar weer volledig.'],
  let:'Het korten heet <i>qasr</i> en is in deze school sterk aanbevolen: je slaat het niet zomaar over omdat je het "netter" vindt om vier te bidden.',
  tips:['Bid je achter een imam die niet op reis is, dan bid je met hem mee volledig.',
        'Het samenvoegen van twee gebeden (Dhuhr met Asr, Maghrib met Isha) mag, maar de voorwaarden zijn in deze school nauwer dan in sommige andere. Vraag ernaar bij je imam voor je op reis gaat.',
        'In de auto, het vliegtuig of de trein: bepaal de qibla zo goed als je kunt en bid. Niet bidden omdat het lastig is, is geen optie.'],
  vragen:[['Geldt het ook voor een schoolreisje?','Alleen als het ver genoeg is. Rijden jullie van Roermond naar Amsterdam, dan zit je er ruim over.']],
  zeg:[]},

 {id:'verduistering', n:'Bij een zons- of maansverduistering', ar:'صلاة الكسوف والخسوف', regel:'sunna', rak:'2 rak\'a',
  kort:'Gaat de zon of de maan overdag of \'s nachts op slot, dan ga je bidden. Niet uit angst — uit ontzag.',
  wanneer:'Zolang de verduistering duurt.',
  hoe:['Bij een <b>zonsverduistering</b>: twee rak\'a, maar met twee keer lezen en twee keer buigen in elke rak\'a. Je leest, buigt, komt overeind, leest opnieuw, buigt opnieuw, en gaat dan pas naar de knieval. In deze school lees je zachtjes.',
       'Dat gebeurt in de moskee, samen, en er wordt daarna gesproken.',
       'Bij een <b>maansverduistering</b> bidt iedereen voor zichzelf, twee rak\'a tegelijk, zoals elk vrijwillig gebed.',
       'Verder: veel du\'a, istighfar en iets weggeven.'],
  let:'De Profeet ﷺ zei het er expres bij toen zijn zoon Ibrahim stierf op de dag van een verduistering: de zon en de maan verduisteren niet om de dood of de geboorte van wie dan ook. Het is een teken van Allah, geen voorspelling en geen ongeluk.',
  tips:['Kijk nooit met het blote oog naar een zonsverduistering. Dat is geen fiqh, dat is je ogen.',
        'Een verduistering staat jaren van tevoren in de agenda. Zet hem erin — dan sta je niet te zoeken als het zover is.'],
  vragen:[],
  zeg:[]},

 {id:'regen', n:'Om regen vragen', ar:'صلاة الاستسقاء', regel:'sunna', rak:'2 rak\'a, hardop',
  kort:'Blijft de regen te lang weg en droogt het land uit, dan gaat de hele gemeenschap naar buiten en vraagt erom.',
  wanneer:'Bij droogte, \'s ochtends, buiten het dorp of de stad.',
  hoe:['Twee rak\'a hardop, net als het feestgebed, zonder adhan en zonder iqama.',
       'Daarna de preek, met veel istighfar erin.',
       'De imam draait zijn mantel binnenstebuiten — een oud gebaar: moge de toestand ook omslaan.',
       'Iedereen komt: oud, jong, kinderen.'],
  let:'Vooraf wordt aangeraden te vasten en ruzies bij te leggen. De gedachte erachter staat in de Koran: "Vraag jullie Heer om vergeving, Hij is zeer vergevend — Hij zal de hemel overvloedig regen laten zenden." (71:10-11)',
  tips:['Zeg als het regent: <i>allahumma sayyiban nafi\'a</i> — Allah, laat het regen zijn die goed doet.',
        'Regen is een moment waarop du\'a wordt verhoord. Steek je hand uit en vraag.'],
  vragen:[],
  zeg:['istisqa']},

 {id:'istikhara', n:'Als je moet kiezen', ar:'صلاة الاستخارة', regel:'mag', rak:'2 rak\'a',
  kort:'Twee rak\'a en een du\'a, voor als je een besluit moet nemen en er niet uitkomt.',
  wanneer:'Wanneer je maar wilt, behalve op de momenten waarop je niet bidt (vlak na zonsopgang en vlak voor zonsondergang).',
  hoe:['Bid twee gewone vrijwillige rak\'a.',
       'Zeg daarna de du\'a van de istikhara, en noem in gedachten waar het over gaat op de plek waar "deze zaak" staat.',
       'Neem daarna je besluit en ga ervoor. Vraag ook mensen om raad — dat hoort erbij.'],
  let:'Je hoeft geen droom te krijgen en er komt geen teken in de lucht. Het gaat om iets anders: je legt de keuze bij Allah neer, en daarna is de onrust weg — of het nu de ene of de andere kant op gaat.',
  tips:['Voor kleine dingen mag het ook. Een schoolkeuze, een team, een vriendschap.',
        'Ken je de du\'a nog niet uit je hoofd? Lees hem van je telefoon. Dat mag gewoon.'],
  vragen:[],
  zeg:['istikhara']}
];

/* Rond een overlijden gebeurt er meer dan het gebed alleen. Wat hier staat is
   het stuk dat kinderen meemaken: het nieuws, het huis vol mensen, het kerkhof.
   Uitgeschreven omdat niemand op dat moment iets kan opzoeken. */
export const ROUW: Rouwstap[] = [
 {t:'Als je het hoort', d:'Je zegt de woorden die in de Koran staan. Verdriet mag: huilen is toegestaan en de Profeet ﷺ deed het zelf. Wat niet mag is jammeren, jezelf slaan of je kleren scheuren.', zeg:['istirja','duaMusiba']},
 {t:'De wassing en de lijkwade', d:'De overledene wordt gewassen door mensen van dezelfde sekse — familie het liefst — en in witte doeken gewikkeld. Wie in ihram stierf tijdens de hadj, wordt niet geparfumeerd. Dit is werk voor volwassenen; kinderen hoeven hier niet bij te zijn.'},
 {t:'Het gebed', d:'Vier takbirs, staand, zonder buiging en zonder knieval. Hoe dat precies gaat, staat hierboven bij het gebed bij een overledene.'},
 {t:'Naar het graf', d:'De baar wordt gedragen en meelopen is sterk aanbevolen. De overledene wordt op de rechterzij gelegd, met het gezicht naar de qibla, terwijl er gezegd wordt: bismillahi wa \'ala millati rasulillah. Daarna wordt het graf gedicht en blijft men nog even staan om te vragen of hij standvastig gehouden wordt.', zeg:['bijGraf']},
 {t:'Condoleren', d:'Drie dagen lang. Je hoeft geen mooie zin te bedenken; er ís een zin. Wat je verder doet: eten brengen naar het huis van de familie. Zij koken die dagen niet — dat is een sunna, en het is precies wat helpt.', zeg:['taziya']},
 {t:'Daarna', d:'Wat een overledene het meest heeft aan de levenden: du\'a voor hem, schulden die worden afbetaald, en goed dat uit zijn naam wordt gedaan. Bezoek het graf af en toe — dat is toegestaan en het herinnert je aan hoe kort alles is. Bij binnenkomst groet je de bewoners van het kerkhof.', zeg:['groetGraf']}
];

export const FOUTEN: Fout[] = [
 {v:'Ik ben vergeten of dit de derde of de vierde rak\'a is.', a:'Ga uit van het kleinste zekere aantal — dus derde — en maak de vierde af. Verricht daarna de knieval van vergetelheid.'},
 {v:'Ik ben de eerste tashahhud vergeten.', a:'Sta je al recht, ga dan niet terug. Maak het gebed af en doe twee knievallen <b>vóór</b> de slotgroet.'},
 {v:'Ik heb per ongeluk een rak\'a te veel gebeden.', a:'Toevoegen herstel je met twee knievallen <b>na</b> de slotgroet, waarna je opnieuw de slotgroet geeft.'},
 {v:'Er kwam iemand binnen en ik zei iets.', a:'Praten met opzet maakt het gebed ongeldig; begin dan opnieuw. Ging het per ongeluk, dan herstel je met de knieval van vergetelheid.'},
 {v:'Mijn wassing ging kapot tijdens het gebed.', a:'Stop, doe opnieuw de wassing en bid het gebed opnieuw.'},
 {v:'Ik moet heel nodig naar het toilet.', a:'Ga eerst. Bidden terwijl je je in moet houden, gaat ten koste van je aandacht en wordt afgeraden.'},
 {v:'Ik ben een gebed vergeten of ik heb me verslapen.', a:'Bid het zodra je eraan denkt. "Wie een gebed vergeet, laat hem het bidden wanneer hij het zich herinnert." Geen paniek, geen schuldgevoel — inhalen.'},
 {v:'Mijn gedachten dwalen steeds af.', a:'Dat overkomt iedereen. Breng je aandacht terug naar de woorden die je zegt, zonder boos op jezelf te worden. Wie de betekenis kent, dwaalt minder af — daarom staat de vertaling er in deze app bij.'}
];
