import type { Blok } from './soorten'

/* =============================================================================
   HET SPOOR CODEREN

   Python eerst, en pas daarna de webtalen. Dat is geen willekeurige volgorde:
   in Python zie je meteen wat je doet met één regel, terwijl je in HTML/CSS/JS
   drie talen tegelijk moet leren voordat er iets beweegt. Wie eerst weet wat
   een variabele, een lus en een functie zijn, leert de rest in een week.

   De opdrachten gaan over voetbal, games en pc's. Dat is geen versiering: een
   opdracht die over jouw eigen dingen gaat wordt afgemaakt, een opdracht over
   "Jan en Piet die appels kopen" niet.
============================================================================= */
export const CODE: Blok[] = [
{id:'c1', n:'Eerste stappen', ico:'🐍', u:'Laat de computer iets doen', lessen:[

 {id:'c1-1', t:'Hallo wereld', d:'De computer iets laten zeggen',
  uitleg:[
   'Een programma is een lijstje opdrachten. De computer leest ze van boven naar beneden en doet precies wat er staat — niet wat je bedoelde. Dat laatste is het hele vak.',
   'De eerste opdracht die iedereen leert is <code>print</code>. Die zet iets op het scherm. Wat tussen de haakjes en de aanhalingstekens staat komt eruit.',
   'Aanhalingstekens betekenen: dit is tekst, kijk er verder niet naar. Zonder aanhalingstekens denkt Python dat het een naam is van iets, en dan klaagt hij.'
  ],
  voorbeeld:'print("Hallo wereld")\nprint("Ik ben Amine")',
  opdracht:{ vraag:'Laat het programma jouw naam zeggen en daarna je lievelingsclub. Twee regels.',
   start:'print("...")\n', hint:'Twee keer print onder elkaar. Vergeet de aanhalingstekens niet.',
   check:r => r.uit.length>=2 && r.uit.every(x=>x.trim().length>0),
   fout:'Er moeten twee regels uit komen die allebei iets zeggen.' },
  vragen:[
   {v:'Wat doet <code>print("3+4")</code>?', o:['Er komt 7 uit','Er komt 3+4 uit','Er komt een fout'], j:1,
    u:'Tussen aanhalingstekens is alles gewoon tekst. Python rekent er niet in.'},
   {v:'Wat gaat er mis bij <code>print(Hallo)</code>?', o:['Niets','Python zoekt iets dat Hallo heet en vindt het niet','Het staat op de kop'], j:1,
    u:'Zonder aanhalingstekens denkt Python dat Hallo de naam van een variabele is.'}
  ]},

 {id:'c1-2', t:'Variabelen', d:'Dingen onthouden',
  uitleg:[
   'Een variabele is een naam waar iets in zit. Je maakt hem met een <code>=</code>: links de naam, rechts wat erin moet.',
   'Dat <code>=</code> betekent niet "is gelijk aan" zoals bij wiskunde. Het betekent "stop dit erin". Daarom kan <code>score = score + 1</code> gewoon: neem wat erin zat, tel er één bij op, stop het terug.',
   'Kies namen die zeggen wat erin zit. <code>doelpunten</code> is beter dan <code>d</code>. Over twee weken weet je niet meer wat <code>d</code> was.'
  ],
  voorbeeld:'club = "Ajax"\ndoelpunten = 3\nprint(club)\nprint(doelpunten)\n\ndoelpunten = doelpunten + 1\nprint(doelpunten)',
  opdracht:{ vraag:'Maak een variabele <code>speler</code> met een naam erin en <code>rugnummer</code> met een getal. Print ze allebei.',
   start:'speler = \nrugnummer = \n', hint:'Tekst tussen aanhalingstekens, getallen zonder.',
   check:r => r.uit.length>=2,
   fout:'Er moeten twee dingen geprint worden: de naam en het nummer.' },
  vragen:[
   {v:'Wat staat er na <code>x = 5</code> en dan <code>x = 8</code> in x?', o:['5','8','13'], j:1,
    u:'De tweede regel gooit de eerste waarde eruit. Er past er maar één in.'},
   {v:'Welke naam is het beste voor het aantal levens in een spel?', o:['a','levens','x1'], j:1,
    u:'Een naam die zegt wat erin zit scheelt je later uren zoeken.'}
  ]},

 {id:'c1-3', t:'Rekenen', d:'Plus, min, keer, delen — en twee rare',
  uitleg:[
   'Python rekent met <code>+</code>, <code>-</code>, <code>*</code> (keer) en <code>/</code> (delen). Haakjes werken zoals op school: wat tussen haakjes staat gaat eerst.',
   'Er zijn twee die je op school niet ziet. <code>//</code> deelt en gooit de rest weg: <code>7 // 2</code> is 3. En <code>%</code> geeft juist alleen de rest: <code>7 % 2</code> is 1.',
   'Die <code>%</code> lijkt raar maar je gebruikt hem constant. "Is dit getal even?" is <code>getal % 2 == 0</code>. "Om de drie beurten iets doen" is <code>beurt % 3 == 0</code>.'
  ],
  voorbeeld:'print(10 + 5)\nprint(10 / 4)\nprint(10 // 4)\nprint(10 % 4)\nprint(2 ** 10)',
  opdracht:{ vraag:'Een team speelde 34 wedstrijden en maakte 68 doelpunten. Print het gemiddelde per wedstrijd.',
   start:'wedstrijden = 34\ndoelpunten = 68\n', hint:'Delen doe je met /. Print het antwoord.',
   check:r => r.uit.join(' ').includes('2'),
   fout:'Er moet 2 (of 2.0) uitkomen: 68 gedeeld door 34.' },
  vragen:[
   {v:'Wat is <code>17 % 5</code>?', o:['3','2','3.4'], j:1,
    u:'5 past 3 keer in 17, dan blijft er 2 over. Die rest is wat % geeft.'},
   {v:'Hoe controleer je of een getal even is?', o:['getal / 2 == 0','getal % 2 == 0','getal // 2 == 0'], j:1,
    u:'Even betekent: geen rest bij deling door 2.'}
  ]},

 {id:'c1-4', t:'Tekst', d:'Woorden aan elkaar plakken en bewerken',
  uitleg:[
   'Tekst heet in Python een <em>string</em>. Je plakt twee stukken aan elkaar met <code>+</code>, en je herhaalt tekst met <code>*</code>.',
   'Met <code>len(woord)</code> tel je hoeveel tekens erin zitten. Met <code>.upper()</code> maak je er hoofdletters van en met <code>.lower()</code> kleine letters. Zo\'n punt-ding heet een <em>methode</em>: iets dat een stuk tekst zelf kan.',
   'Let op: tekst en getallen plak je niet zomaar aan elkaar. <code>"score: " + 5</code> geeft een fout. Je zet het getal eerst om met <code>str(5)</code> — of je gebruikt een f-string, die komt zo.'
  ],
  voorbeeld:'naam = "amine"\nprint(naam.upper())\nprint(len(naam))\nprint("=" * 20)\nprint("Doel! " * 3)',
  opdracht:{ vraag:'Maak een variabele met de naam van je club. Print hem in hoofdletters, met een streep van 20 tekens eronder.',
   start:'club = "Ajax"\n', hint:'.upper() voor hoofdletters, "-" * 20 voor de streep.',
   check:r => r.uit.length>=2 && r.uit.some(x=>x.length>=15 && /^(.)\1+$/.test(x.trim())),
   fout:'Er moet een regel bij zitten van minstens 15 keer hetzelfde teken.' },
  vragen:[
   {v:'Wat is <code>len("voetbal")</code>?', o:['6','7','8'], j:1,
    u:'v-o-e-t-b-a-l zijn zeven tekens.'},
   {v:'Wat geeft <code>"punt" + 3</code>?', o:['punt3','een fout','punt 3'], j:1,
    u:'Tekst en een getal gaan niet samen met +. Gebruik str(3) of een f-string.'}
  ]},

 {id:'c1-5', t:'input', d:'De computer stelt een vraag',
  uitleg:[
   'Met <code>input()</code> vraagt je programma iets aan degene die het gebruikt. Wat er tussen de haakjes staat is de vraag die op het scherm komt.',
   'Wat je terugkrijgt is <b>altijd tekst</b>, ook als er een getal is ingetypt. Wil je ermee rekenen, dan zet je het om met <code>int(...)</code> voor hele getallen of <code>float(...)</code> voor kommagetallen.',
   'Hier in de app typ je je antwoorden vooraf in het vakje "Wat jij intypt", elk antwoord op een eigen regel. Op een echte computer typ je ze terwijl het programma draait.'
  ],
  voorbeeld:'naam = input("Hoe heet je? ")\nprint("Hoi " + naam)\n\nleeftijd = int(input("Hoe oud ben je? "))\nprint("Volgend jaar ben je " + str(leeftijd + 1))',
  opdracht:{ vraag:'Vraag om twee getallen en print de som. Zet in het invoervak twee getallen, elk op een eigen regel.',
   start:'a = int(input("Eerste getal: "))\n', invoer:'12\n30',
   hint:'Nog een input voor het tweede getal, dan print(a + b).',
   check:r => r.uit.join(' ').includes('42'),
   fout:'Met 12 en 30 in het invoervak moet er 42 uitkomen.' },
  vragen:[
   {v:'Wat voor soort ding geeft <code>input()</code> terug?', o:['Een getal','Tekst','Dat hangt ervan af'], j:1,
    u:'Altijd tekst. Ook "42" is dan gewoon tekst, geen getal.'},
   {v:'Hoe reken je met wat er ingetypt is?', o:['Gewoon +','Eerst int(...) eromheen','Eerst str(...) eromheen'], j:1,
    u:'int() maakt van de tekst "42" het getal 42.'}
  ]},

 {id:'c1-6', t:'f-strings', d:'Tekst en getallen door elkaar',
  uitleg:[
   'Steeds <code>str(...)</code> typen wordt vervelend. Daarom bestaat de f-string: zet een <code>f</code> voor de aanhalingstekens en je mag overal <code>{ }</code> zetten met iets erin.',
   'Alles tussen die accolades wordt uitgerekend en op die plek gezet. Er mag ook een som in: <code>f"over {jaren * 12} maanden"</code>.',
   'Wil je afronden, zet dan <code>:.2f</code> achter de naam: <code>f"{gemiddelde:.2f}"</code> geeft twee cijfers achter de komma. Handig bij gemiddeldes, waar anders 2.6666666666 uit komt.'
  ],
  voorbeeld:'naam = "Amine"\ndoelpunten = 7\nwedstrijden = 3\nprint(f"{naam} maakte {doelpunten} doelpunten")\nprint(f"Dat is {doelpunten / wedstrijden:.2f} per wedstrijd")',
  opdracht:{ vraag:'Maak variabelen voor een speler, zijn doelpunten en zijn wedstrijden. Print één zin met alle drie erin, en het gemiddelde op twee cijfers.',
   start:'speler = "Haaland"\ndoelpunten = 27\nwedstrijden = 31\n', hint:'Eén print met een f-string, en {doelpunten/wedstrijden:.2f} erin.',
   check:r => r.uit.some(x=>/\d\.\d\d/.test(x)),
   fout:'Er moet een getal met twee cijfers achter de komma in staan.' },
  vragen:[
   {v:'Wat print <code>f"{2+3} punten"</code>?', o:['2+3 punten','5 punten','{2+3} punten'], j:1,
    u:'Wat tussen accolades staat wordt eerst uitgerekend.'},
   {v:'Wat doet <code>:.1f</code>?', o:['Eén cijfer achter de komma','Één teken breed','Niets'], j:0,
    u:'Het rondt af op zoveel cijfers achter de komma als je opgeeft.'}
  ]},

 {id:'c1-7', t:'Project: je spelerskaart', d:'Alles uit blok 1 bij elkaar', project:true,
  uitleg:[
   'Tijd om het bij elkaar te zetten. Je maakt een spelerskaart zoals in FIFA of FC: een kop, een streep, wat gegevens en een berekening.',
   'Dit is meteen de eerste keer dat je iets maakt dat niet in een les staat voorgeschreven. Dat voelt anders — en dat hoort.'
  ],
  voorbeeld:'# zoiets moet eruit komen:\n# ====================\n# HAALAND  ·  9\n# ====================\n# Doelpunten : 27\n# Wedstrijden: 31\n# Gemiddelde : 0.87 per wedstrijd',
  opdracht:{ vraag:'Maak een spelerskaart. Nodig: een naam in hoofdletters, een rugnummer, twee strepen van minstens 20 tekens, de doelpunten, de wedstrijden en het gemiddelde met twee cijfers achter de komma.',
   start:'naam = "Haaland"\nnummer = 9\ndoelpunten = 27\nwedstrijden = 31\n\n',
   hint:'Gebruik "=" * 20 voor de strepen, .upper() voor de naam en f-strings voor de rest.',
   check:r => r.uit.length>=5 && r.uit.filter(x=>/^(.)\1{15,}/.test(x.trim())).length>=2 && r.uit.some(x=>/\d\.\d\d/.test(x)) && r.uit.some(x=>/[A-Z]{3,}/.test(x)),
   fout:'Nodig: minstens vijf regels, twee strepen, een naam in hoofdletters en een getal met twee cijfers achter de komma.' },
  vragen:[]}
]},

{id:'c2', n:'Keuzes en herhalen', ico:'🔀', u:'if, while en for — hier begint het echt', lessen:[

 {id:'c2-1', t:'if', d:'Een keuze maken',
  uitleg:[
   'Tot nu toe deed je programma altijd hetzelfde. Met <code>if</code> gaat het nadenken: doe dit alleen <em>als</em> er iets waar is.',
   'Achter de <code>if</code> staat een test, en daarachter een dubbele punt. De regels die erbij horen springen in met vier spaties. Die inspringing is in Python geen opmaak maar echte betekenis — daaraan ziet Python wat er bij de if hoort.',
   'Vergeet je de dubbele punt of de inspringing, dan werkt het niet. Dat is de meest gemaakte fout van iedereen die begint, ook van mensen die het al twintig jaar doen.'
  ],
  voorbeeld:'punten = 82\n\nif punten > 75:\n    print("Je bent door!")\n    print("Goed gedaan.")\n\nprint("Dit komt er altijd uit")',
  opdracht:{ vraag:'Een speler is een topscorer als hij meer dan 20 doelpunten heeft. Print "Topscorer!" als dat zo is.',
   start:'doelpunten = 27\n\n', hint:'if doelpunten > 20: — en de regel eronder vier spaties inspringen.',
   check:r => r.uit.join(' ').toLowerCase().includes('topscorer'),
   fout:'Met 27 doelpunten moet er "Topscorer!" uit komen.' },
  vragen:[
   {v:'Wat hoort er aan het eind van een if-regel?', o:['Een puntkomma','Een dubbele punt','Niets'], j:1,
    u:'Altijd een : — daarna springt het blok eronder in.'},
   {v:'Hoe weet Python welke regels bij de if horen?', o:['Aan de accolades','Aan de inspringing','Aan het woord end'], j:1,
    u:'Python gebruikt inspringing waar andere talen accolades gebruiken.'}
  ]},

 {id:'c2-2', t:'Vergelijken', d:'Groter, kleiner, gelijk',
  uitleg:[
   'In de test achter een <code>if</code> vergelijk je twee dingen. Dat kan met <code>&gt;</code>, <code>&lt;</code>, <code>&gt;=</code>, <code>&lt;=</code>, <code>==</code> (is gelijk) en <code>!=</code> (is niet gelijk).',
   'Let op die dubbele <code>==</code>. Eén <code>=</code> betekent "stop erin", twee betekent "is dit hetzelfde?". Dit is de tweede meest gemaakte fout.',
   'Zo\'n vergelijking geeft <code>True</code> of <code>False</code> terug. Dat zijn echte waardes in Python — je kunt ze in een variabele stoppen en printen.'
  ],
  voorbeeld:'fps = 58\nprint(fps > 60)\nprint(fps >= 58)\nprint(fps == 60)\nprint(fps != 60)\n\nsoepel = fps >= 60\nprint(f"Loopt het soepel? {soepel}")',
  opdracht:{ vraag:'Print of 144 groter is dan 60, en of "Ajax" hetzelfde is als "ajax".',
   start:'', hint:'print(144 > 60) en print("Ajax" == "ajax"). Let op de hoofdletter.',
   check:r => r.uit.join(' ').includes('True') && r.uit.join(' ').includes('False'),
   fout:'Er moet één True en één False uit komen — hoofdletters tellen mee bij tekst.' },
  vragen:[
   {v:'Wat is het verschil tussen <code>=</code> en <code>==</code>?', o:['Geen','= stopt erin, == vergelijkt','== stopt erin, = vergelijkt'], j:1,
    u:'Één = geeft een waarde, twee == stelt een vraag.'},
   {v:'Wat geeft <code>"a" == "A"</code>?', o:['True','False'], j:1,
    u:'Hoofdletters en kleine letters zijn verschillende tekens.'}
  ]},

 {id:'c2-3', t:'else en elif', d:'En anders dan?',
  uitleg:[
   'Met <code>else</code> zeg je wat er moet gebeuren als de test níet waar is. Het is de andere kant van de weg.',
   'Wil je meer dan twee kanten op, dan gebruik je <code>elif</code> — kort voor "else if". Python loopt ze van boven naar beneden af en pakt de eerste die klopt. De rest slaat hij over, ook als die ook zou kloppen.',
   'Daarom is de volgorde belangrijk. Zet je <code>if punten > 10</code> boven <code>if punten > 100</code>, dan komt de tweede nooit aan de beurt.'
  ],
  voorbeeld:'fps = 45\n\nif fps >= 120:\n    print("Vloeiend")\nelif fps >= 60:\n    print("Prima")\nelif fps >= 30:\n    print("Speelbaar")\nelse:\n    print("Zet je instellingen lager")',
  opdracht:{ vraag:'Geef een rapportcijfer een oordeel: 8 of hoger is "goed", 5.5 of hoger is "voldoende", daaronder "onvoldoende".',
   start:'cijfer = 6.5\n\n', hint:'if, dan elif, dan else. Denk aan de volgorde: hoogste eerst.',
   check:(r,code) => r.uit.join(' ').toLowerCase().includes('voldoende') && /elif/.test(code) && /else/.test(code),
   fout:'Gebruik if, elif én else. Met 6.5 hoort er "voldoende" uit te komen.' },
  vragen:[
   {v:'Hoeveel <code>elif</code> mag je achter één <code>if</code> zetten?', o:['Eén','Zoveel je wilt','Hooguit drie'], j:1,
    u:'Zoveel je wilt, maar bij meer dan vier wordt het onleesbaar.'},
   {v:'Wat gebeurt er als twee elif-regels allebei kloppen?', o:['Allebei worden uitgevoerd','Alleen de eerste','Er komt een fout'], j:1,
    u:'Python stopt bij de eerste die waar is.'}
  ]},

 {id:'c2-4', t:'and, or en not', d:'Meer dan één voorwaarde',
  uitleg:[
   'Soms hangt het van twee dingen af. <code>and</code> betekent: allebei moeten waar zijn. <code>or</code> betekent: eentje is genoeg. <code>not</code> draait het om.',
   'Zo test je "past deze videokaart in mijn budget én is hij snel genoeg" met één regel: <code>if prijs &lt; 400 and punten &gt; 180:</code>.',
   'Als je twijfelt over de volgorde, zet dan haakjes. Die kosten niets en maken het meteen leesbaar voor jezelf van volgende week.'
  ],
  voorbeeld:'geld = 350\nfps = 75\n\nif geld < 400 and fps > 60:\n    print("Kopen")\n\nif fps < 30 or geld < 100:\n    print("Nog even wachten")\n\nklaar = False\nif not klaar:\n    print("Nog niet af")',
  opdracht:{ vraag:'Een pc is "gamewaardig" als hij minstens 16 GB RAM heeft én minstens 60 fps haalt. Print of deze pc dat is.',
   start:'ram = 16\nfps = 75\n\n', hint:'if ram >= 16 and fps >= 60:',
   check:(r,code)=> /and/.test(code) && r.uit.length>0,
   fout:'Gebruik and in je test, en print een uitkomst.' },
  vragen:[
   {v:'Wanneer is <code>A and B</code> waar?', o:['Als A waar is','Als allebei waar zijn','Als eentje waar is'], j:1,
    u:'and eist allebei; or is tevreden met eentje.'},
   {v:'Wat is <code>not True</code>?', o:['True','False'], j:1,
    u:'not draait de uitkomst om.'}
  ]},

 {id:'c2-5', t:'while', d:'Zolang als',
  uitleg:[
   'Een <code>while</code>-lus herhaalt een blok zolang de test waar blijft. Na elke ronde kijkt Python opnieuw.',
   'Er is één ding dat je nooit mag vergeten: in de lus moet iets veranderen waardoor de test ooit onwaar wordt. Doe je dat niet, dan blijft hij eeuwig draaien. In deze app grijpt de app dan in en zegt het; op een echte computer loopt je programma vast.',
   'Een lus die met de hand telt gebruikt bijna altijd dit patroon: een variabele op 0 zetten, testen, en aan het eind van de lus ophogen.'
  ],
  voorbeeld:'leven = 100\nronde = 1\n\nwhile leven > 0:\n    schade = ronde * 15\n    leven = leven - schade\n    print(f"Ronde {ronde}: nog {leven} leven")\n    ronde = ronde + 1\n\nprint("Game over")',
  opdracht:{ vraag:'Tel van 10 terug naar 1 en print elk getal. Sluit af met "Start!".',
   start:'teller = 10\n\n', hint:'while teller > 0: ... en vergeet teller = teller - 1 niet.',
   check:r => r.uit.length>=11 && r.uit.join(' ').includes('10') && r.uit.join(' ').includes('1') && r.uit.join(' ').toLowerCase().includes('start'),
   fout:'Er moeten tien getallen uit komen en daarna Start!.' },
  vragen:[
   {v:'Wat gebeurt er als je vergeet de teller op te hogen?', o:['Hij stopt na één ronde','Hij blijft eeuwig doorgaan','Er komt een fout'], j:1,
    u:'De test blijft dan altijd waar. Dat heet een oneindige lus.'},
   {v:'Wanneer kijkt Python of de test nog waar is?', o:['Alleen aan het begin','Voor elke ronde opnieuw','Aan het eind'], j:1,
    u:'Elke ronde opnieuw — daarom kun je hem tijdens de lus onwaar maken.'}
  ]},

 {id:'c2-6', t:'for en range', d:'Precies zo vaak',
  uitleg:[
   'Weet je van tevoren hoe vaak iets moet, dan is <code>for</code> handiger dan <code>while</code>. Je hoeft niets op te hogen: dat doet Python.',
   '<code>range(5)</code> geeft de getallen 0, 1, 2, 3, 4. Vijf stuks, maar beginnend bij nul en zonder de vijf zelf. Dat voelt raar en went snel; het hele vak telt vanaf nul.',
   'Je kunt ook een begin en een stap meegeven: <code>range(2, 10, 2)</code> geeft 2, 4, 6, 8.'
  ],
  voorbeeld:'for i in range(5):\n    print(f"Ronde {i}")\n\nprint("---")\n\nfor tafel in range(1, 11):\n    print(f"7 x {tafel} = {7 * tafel}")',
  opdracht:{ vraag:'Print de tafel van 8, van 1 tot en met 10, in de vorm "8 x 3 = 24".',
   start:'', hint:'for n in range(1, 11): en een f-string erin.',
   check:r => r.uit.length===10 && (r.uit[2]??'').replace(/\s/g,'').includes('8x3=24'),
   fout:'Er moeten precies tien regels uit komen, en de derde is "8 x 3 = 24".' },
  vragen:[
   {v:'Wat geeft <code>range(3)</code>?', o:['1, 2, 3','0, 1, 2','0, 1, 2, 3'], j:1,
    u:'Beginnen bij 0 en stoppen vóór het getal dat je opgeeft.'},
   {v:'Wanneer kies je for boven while?', o:['Als je weet hoe vaak','Als je het niet weet','Maakt niet uit'], j:0,
    u:'Bekend aantal rondes: for. Onbekend, tot iets gebeurt: while.'}
  ]},

 {id:'c2-7', t:'Project: raad het getal', d:'Je eerste echte spelletje', project:true,
  uitleg:[
   'Het klassieke eerste spel: de computer denkt aan een getal, jij raadt, hij zegt hoger of lager. Hier zit alles in wat je net geleerd hebt.',
   'Nieuw is <code>break</code>: daarmee stap je meteen uit een lus, ook als de test nog waar is. Handig als je klaar bent en niet wilt wachten tot de ronde af is.',
   'In het invoervak zet je je gokken, elk op een eigen regel. Het geheime getal ligt vast zolang je niets aan het programma verandert.'
  ],
  voorbeeld:'import random\ngeheim = random.randint(1, 20)\n\nwhile True:\n    gok = int(input("Raad (1-20): "))\n    if gok < geheim:\n        print("Hoger")\n    elif gok > geheim:\n        print("Lager")\n    else:\n        print("Goed!")\n        break',
  opdracht:{ vraag:'Bouw het spel na, maar tel er ook bij hoeveel pogingen er nodig waren, en zeg dat aan het eind.',
   start:'import random\ngeheim = random.randint(1, 20)\npogingen = 0\n\n', invoer:'10\n15\n12\n13\n14\n11\n9\n8\n7\n6\n5\n4\n3\n2\n1\n16\n17\n18\n19\n20',
   hint:'pogingen = pogingen + 1 in de lus, en aan het eind een f-string met het aantal.',
   check:(r,code)=> /break/.test(code) && /pogingen/.test(code) && r.uit.join(' ').toLowerCase().includes('goed'),
   fout:'Het spel moet met break stoppen, de pogingen tellen en "goed" zeggen als je het hebt.' },
  vragen:[]}
]},

{id:'c3', n:'Lijsten en tabellen', ico:'📋', u:'Veel dingen tegelijk bewaren', lessen:[

 {id:'c3-1', t:'Lijsten', d:'Meer dan één ding in één naam',
  uitleg:[
   'Een lijst is een rij dingen in één variabele. Je maakt hem met blokhaken en komma\'s: <code>[3, 7, 1]</code>.',
   'Elk ding heeft een plek, en die plekken beginnen bij <b>0</b>. Bij <code>clubs = ["Ajax", "PSV", "Feyenoord"]</code> is <code>clubs[0]</code> dus Ajax en <code>clubs[2]</code> Feyenoord.',
   'Met een minteken tel je van achteren: <code>clubs[-1]</code> is de laatste. Dat is korter dan uitrekenen hoe lang de lijst is.'
  ],
  voorbeeld:'clubs = ["Ajax", "PSV", "Feyenoord", "AZ"]\nprint(clubs[0])\nprint(clubs[-1])\nprint(len(clubs))\n\nclubs[1] = "Twente"\nprint(clubs)',
  opdracht:{ vraag:'Maak een lijst met vijf games. Print de eerste, de laatste, en hoeveel het er zijn.',
   start:'games = [', hint:'games[0], games[-1] en len(games).',
   check:r => r.uit.length>=3 && r.uit.join(' ').includes('5'),
   fout:'Drie regels: de eerste game, de laatste, en het getal 5.' },
  vragen:[
   {v:'Wat is <code>["a","b","c"][1]</code>?', o:['a','b','c'], j:1,
    u:'Plek 0 is a, plek 1 is b. Tellen begint bij nul.'},
   {v:'Wat doet <code>lijst[-1]</code>?', o:['Fout','Het laatste ding','Het één na laatste'], j:1,
    u:'Negatief tellen begint achteraan bij -1.'}
  ]},

 {id:'c3-2', t:'Door een lijst lopen', d:'for zonder range',
  uitleg:[
   'Je kunt met <code>for</code> rechtstreeks door een lijst lopen. Je krijgt dan de dingen zelf, niet de plekken: <code>for club in clubs:</code>.',
   'Dat leest bijna als Nederlands en is bijna altijd wat je wilt. Alleen als je het nummer erbij nodig hebt gebruik je <code>enumerate</code>, die geeft plek én ding.',
   'Ook door tekst kun je lopen: <code>for letter in "voetbal":</code> geeft je één letter per ronde.'
  ],
  voorbeeld:'punten = [3, 1, 0, 3, 3]\n\ntotaal = 0\nfor p in punten:\n    totaal = totaal + p\nprint(f"Totaal: {totaal}")\n\nclubs = ["Ajax", "PSV", "AZ"]\nfor plek in enumerate(clubs):\n    print(f"{plek[0] + 1}. {plek[1]}")',
  opdracht:{ vraag:'Je hebt een lijst met de fps van vijf games. Print voor elke game of hij boven de 60 zit.',
   start:'fps = [45, 88, 120, 30, 61]\n\n', hint:'for f in fps: en daarin een if.',
   check:r => r.uit.length>=5,
   fout:'Er moet voor alle vijf getallen een regel uit komen.' },
  vragen:[
   {v:'Wat krijg je bij <code>for x in [10,20]:</code>?', o:['0 en 1','10 en 20','De lijst zelf'], j:1,
    u:'De dingen uit de lijst, niet hun plaatsnummers.'},
   {v:'Wanneer gebruik je <code>enumerate</code>?', o:['Altijd','Als je het nummer erbij nodig hebt','Nooit'], j:1,
    u:'Bijvoorbeeld om een genummerd lijstje te printen.'}
  ]},

 {id:'c3-3', t:'Lijsten veranderen', d:'append, sort en de rest',
  uitleg:[
   'Een lijst kan groeien en krimpen. <code>.append(x)</code> plakt er iets achter, <code>.pop()</code> haalt het laatste eraf, <code>.remove(x)</code> haalt een bepaald ding weg.',
   '<code>.sort()</code> zet de lijst op volgorde — klein naar groot bij getallen, alfabetisch bij tekst. Let op: dat verandert de lijst zelf. Wil je de oude houden, gebruik dan <code>sorted(lijst)</code>, dat geeft een nieuwe.',
   'Verder: <code>.reverse()</code> draait om, <code>.count(x)</code> telt hoe vaak iets erin zit en <code>.index(x)</code> zegt op welke plek het staat.'
  ],
  voorbeeld:'scores = [88, 45, 120]\nscores.append(61)\nscores.sort()\nprint(scores)\n\nscores.reverse()\nprint(scores)\nprint(f"De hoogste is {scores[0]}")',
  opdracht:{ vraag:'Begin met een lege lijst. Zet er met een for-lus de kwadraten van 1 tot en met 5 in, en print de lijst.',
   start:'kwadraten = []\n\n', hint:'kwadraten.append(n * n) binnen een for over range(1, 6).',
   check:r => r.uit.join(' ').replace(/\s/g,'').includes('[1,4,9,16,25]'),
   fout:'Er moet [1, 4, 9, 16, 25] uit komen.' },
  vragen:[
   {v:'Wat doet <code>.append()</code>?', o:['Plakt er iets achteraan','Haalt iets weg','Sorteert'], j:0,
    u:'Achteraan erbij — het meest gebruikte lijstding dat er is.'},
   {v:'Wat is het verschil tussen <code>.sort()</code> en <code>sorted()</code>?', o:['Geen','.sort() verandert de lijst zelf, sorted() maakt een nieuwe','Andersom'], j:1,
    u:'Belangrijk verschil zodra je de oude volgorde nog nodig hebt.'}
  ]},

 {id:'c3-4', t:'Woordenboeken', d:'Iets opzoeken op naam',
  uitleg:[
   'In een lijst zoek je op plek. Vaak wil je op naam zoeken: hoeveel punten heeft Ajax? Daar is een <em>woordenboek</em> voor, met accolades: <code>{"Ajax": 68, "PSV": 71}</code>.',
   'Links staat de <em>sleutel</em> waarmee je zoekt, rechts de <em>waarde</em>. Je haalt hem op met <code>stand["Ajax"]</code>, en je zet er iets in of overschrijft het met <code>stand["AZ"] = 55</code>.',
   'Bestaat een sleutel niet, dan krijg je een fout. Weet je het niet zeker, gebruik dan <code>.get("AZ", 0)</code>: die geeft 0 terug als AZ er niet in staat.'
  ],
  voorbeeld:'stand = {"Ajax": 68, "PSV": 71, "Feyenoord": 64}\nprint(stand["PSV"])\nprint(stand.get("Twente", 0))\n\nstand["Ajax"] = stand["Ajax"] + 3\n\nfor club in stand:\n    print(f"{club}: {stand[club]}")',
  opdracht:{ vraag:'Maak een woordenboek met drie pc-onderdelen en hun prijs. Print de totaalprijs.',
   start:'delen = {"processor": 220, "videokaart": 340, "geheugen": 70}\n\n', hint:'Loop met for door delen en tel delen[naam] bij een totaal op — of gebruik sum(delen.values()).',
   check:r => r.uit.join(' ').includes('630'),
   fout:'De drie prijzen samen zijn 630. Dat getal moet eruit komen.' },
  vragen:[
   {v:'Waarmee zoek je in een woordenboek?', o:['Met een plaatsnummer','Met een sleutel','Met een for-lus'], j:1,
    u:'Dat is juist het verschil met een lijst.'},
   {v:'Wat doet <code>.get("x", 0)</code> als "x" er niet in staat?', o:['Een fout','Geeft 0 terug','Zet x erin'], j:1,
    u:'Handig als je niet zeker weet of iets bestaat.'}
  ]},

 {id:'c3-5', t:'Lijsten in lijsten', d:'Een echte tabel',
  uitleg:[
   'In een lijst mag alles staan, ook andere lijsten. Zo maak je een tabel: elke rij is een lijstje.',
   '<code>tabel[1][2]</code> betekent: pak rij 1, en daaruit ding 2. Eerst de rij, dan de kolom.',
   'Zo bewaar je wedstrijduitslagen, een speelveld voor een spel, of een scorebord. Bijna elk bordspel dat je programmeert is onderhuids een lijst met lijsten.'
  ],
  voorbeeld:'uitslagen = [\n    ["Ajax", 3, "PSV", 1],\n    ["AZ", 2, "Feyenoord", 2]\n]\n\nfor wed in uitslagen:\n    print(f"{wed[0]} {wed[1]} - {wed[3]} {wed[2]}")',
  opdracht:{ vraag:'Maak een lijst met drie spelers, elk met naam en aantal doelpunten. Print wie er de meeste heeft.',
   start:'spelers = [["Amine", 12], ["Youssef", 8], ["Sami", 15]]\n\n', hint:'Houd een beste bij: begin met de eerste en vergelijk in de lus.',
   check:r => r.uit.join(' ').toLowerCase().includes('sami'),
   fout:'Sami heeft er 15, dus die naam moet eruit komen.' },
  vragen:[
   {v:'Wat is <code>[[1,2],[3,4]][1][0]</code>?', o:['1','2','3'], j:2,
    u:'Rij 1 is [3,4], en daarvan plek 0 is 3.'},
   {v:'Waarvoor gebruik je een lijst met lijsten?', o:['Een tabel of speelveld','Alleen voor getallen','Nooit'], j:0,
    u:'Elke rij een lijstje — dat is een tabel.'}
  ]},

 {id:'c3-6', t:'Rekenen met lijsten', d:'sum, min, max en len',
  uitleg:[
   'Voor de dingen die je constant doet bestaan kant-en-klare functies. <code>sum(lijst)</code> telt alles op, <code>min</code> en <code>max</code> geven de kleinste en de grootste, <code>len</code> telt hoeveel het er zijn.',
   'Een gemiddelde is dan één regel: <code>sum(cijfers) / len(cijfers)</code>. Pas op dat de lijst niet leeg is, want delen door nul kan niet.',
   'Bij een woordenboek werken ze ook, op <code>.values()</code>: <code>sum(prijzen.values())</code>.'
  ],
  voorbeeld:'cijfers = [7.5, 8, 6, 9, 5.5]\nprint(f"Aantal: {len(cijfers)}")\nprint(f"Hoogste: {max(cijfers)}")\nprint(f"Laagste: {min(cijfers)}")\nprint(f"Gemiddeld: {sum(cijfers) / len(cijfers):.2f}")',
  opdracht:{ vraag:'Van deze fps-metingen: print de laagste, de hoogste en het gemiddelde met één cijfer achter de komma.',
   start:'metingen = [58, 72, 141, 39, 88, 64]\n\n', hint:'min(), max() en sum()/len(), met :.1f in de f-string.',
   check:r => r.uit.join(' ').includes('39') && r.uit.join(' ').includes('141') && /\d\.\d/.test(r.uit.join(' ')),
   fout:'Nodig: 39, 141 en een gemiddelde met één cijfer achter de komma.' },
  vragen:[
   {v:'Hoe bereken je een gemiddelde?', o:['sum(l) / len(l)','max(l) / 2','len(l) / sum(l)'], j:0,
    u:'Alles bij elkaar, gedeeld door hoeveel het er zijn.'},
   {v:'Wat gaat er mis bij een lege lijst?', o:['Niets','Delen door nul','sum geeft een fout'], j:1,
    u:'len is dan 0, en daardoor kun je niet delen. Vang dat af met een if.'}
  ]},

 {id:'c3-7', t:'Project: de competitiestand', d:'Uitslagen omzetten naar een tabel', project:true,
  uitleg:[
   'Dit is het soort programma waarvoor mensen betaald worden: gegevens erin, iets bruikbaars eruit.',
   'Je krijgt een lijst met uitslagen en moet er een stand van maken. Winst is drie punten, gelijkspel één, verlies nul. Dat vraagt een woordenboek om de punten bij te houden en een lus door de uitslagen.',
   'Begin klein: eerst alleen de punten voor de thuisploeg, dan pas de rest. Alles tegelijk werkend krijgen lukt zelden.'
  ],
  voorbeeld:'# de uitslagen staan zo:\n# ["Ajax", 3, "PSV", 1]  betekent Ajax 3 - PSV 1',
  opdracht:{ vraag:'Reken de stand uit en print per club "naam: X punten". Winst 3, gelijk 1, verlies 0.',
   start:'uitslagen = [\n    ["Ajax", 3, "PSV", 1],\n    ["PSV", 2, "Feyenoord", 2],\n    ["Feyenoord", 0, "Ajax", 1],\n    ["Ajax", 2, "Feyenoord", 2]\n]\nstand = {"Ajax": 0, "PSV": 0, "Feyenoord": 0}\n\n',
   hint:'Loop door uitslagen. Vergelijk wed[1] met wed[3] en tel punten op bij stand[wed[0]] of stand[wed[2]].',
   check:r => { const t=r.uit.join(' '); return /Ajax\D*7/.test(t) && /PSV\D*1/.test(t) && /Feyenoord\D*2/.test(t); },
   fout:'Ajax hoort op 7 te komen, PSV op 1 en Feyenoord op 2. Kijk of je het gelijkspel goed telt — dan krijgen ze allebei een punt.' },
  vragen:[]}
]},

{id:'c4', n:'Functies en fouten', ico:'🧩', u:'Zelf gereedschap maken', lessen:[

 {id:'c4-1', t:'Functies', d:'Een eigen opdracht maken',
  uitleg:[
   'Als je hetzelfde stuk code drie keer typt, doe je iets fout. Een functie is een stuk code met een naam eraan, dat je zo vaak kunt gebruiken als je wilt.',
   'Je maakt hem met <code>def</code>, een naam, haakjes en een dubbele punt. Alles wat erbij hoort springt in. Bij het maken gebeurt er nog niets — pas als je hem <em>aanroept</em> met zijn naam en haakjes gaat hij draaien.',
   'Een goede functie doet één ding en heeft een naam die dat zegt. <code>bereken_fps</code> is goed, <code>doe_dingen</code> niet.'
  ],
  voorbeeld:'def welkom():\n    print("=" * 25)\n    print("  BUNYAN")\n    print("=" * 25)\n\nwelkom()\nprint("Klaar om te beginnen")\nwelkom()',
  opdracht:{ vraag:'Maak een functie <code>streep()</code> die een regel van 30 sterretjes print, en roep hem drie keer aan.',
   start:'def streep():\n    ', hint:'print("*" * 30) in de functie, en daaronder drie keer streep().',
   check:r => r.uit.length===3 && r.uit.every(x=>x.trim().length>=25),
   fout:'Er moeten precies drie lange strepen uit komen.' },
  vragen:[
   {v:'Wat gebeurt er als je een functie alleen maakt maar niet aanroept?', o:['Hij draait één keer','Niets','Een fout'], j:1,
    u:'def zegt alleen: onthoud dit stukje. Aanroepen doet het uitvoeren.'},
   {v:'Waarom maak je een functie?', o:['Om code niet te herhalen','Omdat het moet','Om het langer te maken'], j:0,
    u:'Eén plek om iets te veranderen in plaats van drie.'}
  ]},

 {id:'c4-2', t:'Iets meegeven', d:'Argumenten',
  uitleg:[
   'Een functie wordt pas echt nuttig als je hem iets kunt meegeven. Zet namen tussen de haakjes bij <code>def</code>, dan mag je die binnenin gebruiken.',
   'Bij het aanroepen geef je de echte waarden mee, in dezelfde volgorde. Geef je er te weinig of te veel, dan klaagt Python meteen — dat is maar goed ook.',
   'Wat er binnenin een functie gebeurt met die namen blijft binnenin. Dat is precies de bedoeling: je kunt een functie gebruiken zonder te weten hoe hij werkt.'
  ],
  voorbeeld:'def begroet(naam, club):\n    print(f"Hoi {naam}, hup {club}!")\n\nbegroet("Amine", "Ajax")\nbegroet("Sami", "PSV")\n\ndef balk(teken, lengte):\n    print(teken * lengte)\n\nbalk("#", 20)\nbalk("-", 10)',
  opdracht:{ vraag:'Maak een functie <code>kaart(naam, doelpunten)</code> die een regel print als "HAALAND — 27 doelpunten". Roep hem twee keer aan.',
   start:'def kaart(naam, doelpunten):\n    ', hint:'Gebruik .upper() en een f-string in de functie.',
   check:r => r.uit.length>=2 && r.uit.every(x=>/[A-Z]{3,}/.test(x)),
   fout:'Twee regels, allebei met de naam in hoofdletters.' },
  vragen:[
   {v:'Wat gebeurt er bij <code>def f(a, b)</code> als je hem aanroept met <code>f(1)</code>?', o:['b wordt 0','Een fout: er hoort er nog een','b wordt None'], j:1,
    u:'Python telt de argumenten en zegt het als het aantal niet klopt.'},
   {v:'Maakt de volgorde van argumenten uit?', o:['Nee','Ja'], j:1,
    u:'Ze worden op volgorde ingevuld: de eerste bij de eerste naam.'}
  ]},

 {id:'c4-3', t:'return', d:'Een antwoord teruggeven',
  uitleg:[
   'Een functie die alleen print is een doodlopende weg: je kunt niet verder rekenen met wat eruit komt. Met <code>return</code> geeft een functie een <em>antwoord</em> terug dat je kunt bewaren of gebruiken.',
   'Zodra Python bij <code>return</code> komt is de functie klaar. Wat eronder staat gebeurt niet meer. Dat kun je gebruiken: eerst de rare gevallen afvangen met een <code>return</code>, daarna het normale werk.',
   'Vuistregel: <code>print</code> is voor een mens die kijkt, <code>return</code> is voor de rest van je programma.'
  ],
  voorbeeld:'def fps(gpu, zwaarte):\n    if zwaarte == 0:\n        return 0\n    return round(gpu / zwaarte)\n\nsnelheid = fps(190, 2.2)\nprint(f"Ongeveer {snelheid} fps")\n\nif fps(190, 2.2) > 60:\n    print("Speelbaar")',
  opdracht:{ vraag:'Maak een functie <code>gemiddelde(getallen)</code> die het gemiddelde teruggeeft — en 0 als de lijst leeg is. Print het gemiddelde van twee verschillende lijsten.',
   start:'def gemiddelde(getallen):\n    ', hint:'Eerst if len(getallen) == 0: return 0. Daarna return sum(...) / len(...).',
   check:(r,code)=> /return/.test(code) && r.uit.length>=2,
   fout:'Gebruik return in je functie en print twee gemiddeldes.' },
  vragen:[
   {v:'Wat is het verschil tussen print en return?', o:['Geen','print toont iets, return geeft iets terug om mee verder te rekenen','return is sneller'], j:1,
    u:'Met een print kun je niets meer; met een return wel.'},
   {v:'Wat gebeurt er met de regels ná een return?', o:['Die worden ook gedaan','Die worden overgeslagen','Fout'], j:1,
    u:'return stopt de functie meteen.'}
  ]},

 {id:'c4-4', t:'Toeval', d:'random',
  uitleg:[
   'Zonder toeval is een spel na één keer saai. Bovenaan je programma zet je <code>import random</code>, en daarna heb je er drie nodig.',
   '<code>random.randint(1, 6)</code> geeft een heel getal van 1 tot en met 6 — een dobbelsteen. <code>random.choice(lijst)</code> pakt er willekeurig eentje uit. <code>random.shuffle(lijst)</code> husselt een lijst door elkaar.',
   'Dat "import" betekent: haal er een kist gereedschap bij. Python heeft er honderden; random is de eerste die je nodig hebt.'
  ],
  voorbeeld:'import random\n\nprint(random.randint(1, 6))\n\nclubs = ["Ajax", "PSV", "Feyenoord", "AZ"]\nprint(f"Je speelt tegen {random.choice(clubs)}")\n\nrandom.shuffle(clubs)\nprint(clubs)',
  opdracht:{ vraag:'Gooi twintig keer met een dobbelsteen en tel hoe vaak je een zes gooit. Print dat aantal.',
   start:'import random\nzessen = 0\n\n', hint:'for i in range(20): gooi = random.randint(1,6), en een if.',
   check:(r,code)=> /randint/.test(code) && r.uit.length>=1,
   fout:'Gebruik random.randint en print hoe vaak je zes gooide.' },
  vragen:[
   {v:'Wat geeft <code>random.randint(1, 6)</code>?', o:['1 tot en met 5','1 tot en met 6','0 tot en met 6'], j:1,
    u:'Anders dan bij range hoort het laatste getal er hier wél bij.'},
   {v:'Wat doet <code>random.choice</code>?', o:['Sorteert','Pakt er willekeurig eentje uit','Telt'], j:1,
    u:'Precies wat je nodig hebt om een willekeurige tegenstander te kiezen.'}
  ]},

 {id:'c4-5', t:'Fouten lezen', d:'De beste vaardigheid die er is',
  uitleg:[
   'Iedereen die programmeert maakt de hele dag fouten. Het verschil tussen iemand die het kan en iemand die het niet kan, is hoe snel hij ze vindt.',
   'Lees altijd eerst het <b>regelnummer</b>. Staat de fout op regel 7, kijk dan ook op regel 6 — een vergeten haakje merkt Python vaak pas een regel later.',
   'De drie fouten die je het vaakst maakt: de dubbele punt vergeten, verkeerd inspringen, en <code>=</code> gebruiken waar <code>==</code> hoort. Als iets niet werkt, kijk die drie eerst na.',
   'Werkt het nog steeds niet? Zet dan <code>print</code>-regels tussen je code om te zien wat er echt in je variabelen zit. Negen van de tien keer is dat iets anders dan je dacht.'
  ],
  voorbeeld:'punten = 10\n\n# print om te kijken wat er echt in zit\nprint(f"[test] punten is nu {punten}")\n\nif punten > 5:\n    print("Genoeg")',
  opdracht:{ vraag:'In dit programma zitten drie fouten. Zoek ze en maak het werkend: er moet "Gewonnen!" uit komen.',
   start:'score = 12\nif score = 12\nprint("Gewonnen!")\n',
   hint:'Eén: == in plaats van =. Twee: er mist een dubbele punt. Drie: de print moet inspringen.',
   check:r => r.uit.join(' ').includes('Gewonnen'),
   fout:'Er moet precies "Gewonnen!" uit komen. Kijk naar de =, de dubbele punt en de inspringing.' },
  vragen:[
   {v:'Wat kijk je als eerste bij een foutmelding?', o:['Het regelnummer','De kleur','Niets'], j:0,
    u:'En daarna de regel erboven, want daar zit hij vaak echt.'},
   {v:'Hoe zie je wat er in een variabele zit?', o:['Raden','Er een print bij zetten','Opnieuw beginnen'], j:1,
    u:'Dat heet debuggen met prints, en de halve wereld doet het zo.'}
  ]},

 {id:'c4-6', t:'Project: dobbelspel', d:'Twee spelers, tien rondes', project:true,
  uitleg:[
   'Een compleet spelletje met alles erin: functies, toeval, een lus, een woordenboek en een winnaar aan het eind.',
   'De regels: twee spelers, tien rondes. Elke ronde gooien ze allebei één keer. Wie het hoogst gooit krijgt een punt; bij gelijk krijgt niemand iets. Na tien rondes zeg je wie gewonnen heeft — of dat het gelijk is.',
   'Bouw het in stukjes en draai na elk stukje. Eerst één ronde, dan tien, dan pas de winnaar.'
  ],
  voorbeeld:'import random\n\ndef gooi():\n    return random.randint(1, 6)',
  opdracht:{ vraag:'Bouw het spel. Nodig: een functie voor het gooien, tien rondes, punten bijhouden voor beide spelers, en aan het eind zeggen wie won.',
   start:'import random\n\ndef gooi():\n    return random.randint(1, 6)\n\npunten = {"Amine": 0, "Computer": 0}\n\n',
   hint:'for ronde in range(10): allebei gooien, vergelijken, punt geven. Daarna een if/elif/else voor de winnaar.',
   check:(r,code)=> /def /.test(code) && /range\(10\)/.test(code) && r.uit.length>=10,
   fout:'Nodig: een eigen functie, tien rondes, en minstens tien regels uitvoer.' },
  vragen:[]}
]},

{id:'c5', n:'De webtalen', ico:'🌐', u:'HTML, CSS en JavaScript', lessen:[

 {id:'c5-1', t:'HTML', d:'Het skelet van een pagina',
  uitleg:[
   'Elke website die je opent bestaat uit drie talen die samenwerken. HTML is het skelet: wat staat er. CSS is de kleding: hoe ziet het eruit. JavaScript is de spier: wat gebeurt er als je klikt.',
   'HTML werkt met <em>tags</em> tussen punthaken. Bijna elke tag gaat open en weer dicht: <code>&lt;h1&gt;Titel&lt;/h1&gt;</code>. Wat ertussen staat is de inhoud.',
   'De belangrijkste: <code>h1</code> tot <code>h6</code> voor koppen, <code>p</code> voor een stuk tekst, <code>ul</code> met <code>li</code> voor een lijstje, <code>a</code> voor een link, <code>img</code> voor een plaatje en <code>button</code> voor een knop.',
   'Deze app die je nu gebruikt is ook gewoon HTML. Druk op je pc op Ctrl+U bij een willekeurige site en je ziet het.'
  ],
  voorbeeld:'<h1>Mijn gamepagina</h1>\n<p>Dit zijn mijn drie favoriete games.</p>\n<ul>\n  <li>Minecraft</li>\n  <li>Rocket League</li>\n  <li>EA FC</li>\n</ul>\n<button>Klik mij</button>',
  taal:'html',
  opdracht:{ vraag:'Maak een pagina over jezelf: een kop, een stukje tekst en een lijstje met drie dingen die je leuk vindt.',
   start:'<h1>', taal:'html',
   hint:'Denk aan het sluiten van elke tag: <h1>...</h1>.',
   check:(_r,code)=> /<h1>[\s\S]*<\/h1>/.test(code) && /<p>/.test(code) && (code.match(/<li>/g)||[]).length>=3,
   fout:'Nodig: een h1, een p en drie li-regels.' },
  vragen:[
   {v:'Waar is HTML voor?', o:['De kleuren','Wat er op de pagina staat','Wat er gebeurt bij klikken'], j:1,
    u:'HTML is de inhoud en de structuur. Kleuren zijn CSS.'},
   {v:'Wat hoort bij <code>&lt;p&gt;</code>?', o:['&lt;/p&gt;','&lt;p/&gt;','Niets'], j:0,
    u:'Bijna elke tag heeft een sluittag met een schuine streep.'}
  ]},

 {id:'c5-2', t:'CSS', d:'Hoe het eruitziet',
  uitleg:[
   'CSS bepaalt kleur, grootte, ruimte en plek. Je schrijft een <em>selector</em> (waarop het slaat), accolades, en daarin regels als <code>eigenschap: waarde;</code>.',
   'Je kunt kiezen op tagnaam (<code>h1</code>), op klasse (<code>.knop</code>, als er <code>class="knop"</code> staat) of op id (<code>#score</code>). Klassen gebruik je het meest.',
   'De eigenschappen die je meteen nodig hebt: <code>color</code> voor tekstkleur, <code>background</code> voor de achtergrond, <code>font-size</code>, <code>padding</code> voor ruimte binnenin, <code>margin</code> voor ruimte eromheen en <code>border-radius</code> voor ronde hoeken.'
  ],
  voorbeeld:'<style>\n  h1 { color: #0B6E6E; font-size: 32px; }\n  .kaart {\n    background: #EFE8F6;\n    padding: 16px;\n    border-radius: 12px;\n  }\n</style>\n\n<h1>Mijn pagina</h1>\n<div class="kaart">Dit staat in een kaart.</div>',
  taal:'html',
  opdracht:{ vraag:'Maak een gekleurde kaart met een kop erin. Gebruik een klasse met een achtergrond, ruimte binnenin en ronde hoeken.',
   start:'<style>\n  .kaart {\n    \n  }\n</style>\n\n<div class="kaart">\n  <h2>Hallo</h2>\n</div>', taal:'html',
   hint:'background, padding en border-radius in de .kaart-regel.',
   check:(_r,code)=> /background/.test(code) && /padding/.test(code) && /border-radius/.test(code),
   fout:'De klasse mist background, padding of border-radius.' },
  vragen:[
   {v:'Wat selecteert <code>.knop</code>?', o:['De tag knop','Alles met class="knop"','Het id knop'], j:1,
    u:'Een punt is een klasse, een hekje is een id.'},
   {v:'Wat is <code>padding</code>?', o:['Ruimte binnenin','Ruimte eromheen','De rand'], j:0,
    u:'Binnenin is padding, eromheen is margin.'}
  ]},

 {id:'c5-3', t:'JavaScript', d:'De taal van de browser',
  uitleg:[
   'JavaScript lijkt op Python maar ziet er anders uit. Accolades in plaats van inspringing, een puntkomma aan het eind, en <code>let</code> of <code>const</code> voor een variabele.',
   'Het grote verschil met Python: JavaScript zit ingebouwd in elke browser. Je hoeft niets te installeren — daarom draait de app die je nu gebruikt erin.',
   'Wat je in Python geleerd hebt geldt gewoon: variabelen, if, lussen, functies. Alleen de schrijfwijze verandert. Dat is meteen de belangrijkste les over programmeertalen: de tweede kost een tiende van de tijd van de eerste.'
  ],
  voorbeeld:'let score = 0;\nconst naam = "Amine";\n\nfor (let i = 0; i < 3; i++) {\n  score = score + 10;\n  console.log("Ronde " + i + ": " + score);\n}\n\nfunction dubbel(n) {\n  return n * 2;\n}\nconsole.log(dubbel(21));',
  taal:'js',
  opdracht:{ vraag:'Schrijf in JavaScript een lus die de getallen 1 tot en met 5 in de console zet, en daarna een functie die een getal verdubbelt.',
   start:'for (let i = 1; i <= 5; i++) {\n  \n}\n', taal:'js',
   hint:'console.log(i) in de lus. Daarna function dubbel(n) { return n * 2; } en console.log(dubbel(8)).',
   check:r => r.uit.length>=6,
   fout:'Er moeten minstens zes regels in de uitvoer staan: vijf getallen en het verdubbelde getal.' },
  vragen:[
   {v:'Hoe print je iets in JavaScript?', o:['print(...)','console.log(...)','echo ...'], j:1,
    u:'In de browser gaat dat naar de console.'},
   {v:'Wat gebruikt JavaScript in plaats van inspringing?', o:['Accolades','Puntkomma\'s','Haakjes'], j:0,
    u:'{ en } geven het blok aan. Inspringen doe je voor de leesbaarheid.'}
  ]},

 {id:'c5-4', t:'De pagina veranderen', d:'De DOM',
  uitleg:[
   'Het leuke begint als JavaScript de pagina zelf gaat veranderen. Die pagina heet in code de DOM: een boom van alle tags.',
   'Je pakt een stuk beet met <code>document.querySelector("#score")</code> — dezelfde selectors als bij CSS. Daarna verander je de inhoud met <code>.textContent</code> of de opmaak met <code>.style</code>.',
   'Dit is hoe elke website waarop iets verandert zonder herladen werkt: van je scorebord tot je YouTube-teller.'
  ],
  voorbeeld:'<p id="score">0</p>\n<script>\n  const p = document.querySelector("#score");\n  p.textContent = "42 punten";\n  p.style.color = "#0B6E6E";\n<\/script>',
  taal:'html',
  opdracht:{ vraag:'Maak een pagina met een tekst die door JavaScript wordt aangepast en een andere kleur krijgt.',
   start:'<p id="uit">nog niets</p>\n<script>\n  \n<\/script>', taal:'html',
   hint:'document.querySelector("#uit").textContent = "..."; en daarna .style.color = "...";',
   check:(_r,code)=> /querySelector/.test(code) && /textContent/.test(code) && /style/.test(code),
   fout:'Gebruik querySelector, textContent én style.' },
  vragen:[
   {v:'Wat doet <code>querySelector</code>?', o:['Maakt een nieuwe tag','Zoekt een stuk van de pagina op','Verwijdert iets'], j:1,
    u:'Met dezelfde selectors als in CSS.'},
   {v:'Waarmee verander je de tekst van een element?', o:['.textContent','.name','.write'], j:0,
    u:'Er is ook .innerHTML, maar die is gevaarlijker: die voert tags uit.'}
  ]},

 {id:'c5-5', t:'Klikken', d:'Events',
  uitleg:[
   'Een <em>event</em> is iets dat gebeurt: een klik, een toets, de muis die beweegt. Je zegt tegen de browser: als dit gebeurt, doe dan dat.',
   'Dat gaat met <code>addEventListener("click", functie)</code>. De functie die je meegeeft draait niet meteen — hij wacht tot het gebeurt. Dat is nieuw: code die op een moment draait dat jij niet kiest.',
   'Hiermee kun je alles maken wat op een knop reageert: een teller, een spel, een quiz.'
  ],
  voorbeeld:'<button id="knop">Doelpunt</button>\n<p id="tel">0</p>\n<script>\n  let score = 0;\n  document.querySelector("#knop").addEventListener("click", function () {\n    score = score + 1;\n    document.querySelector("#tel").textContent = score;\n  });\n<\/script>',
  taal:'html',
  opdracht:{ vraag:'Maak een teller met twee knoppen: eentje die er één bij optelt en eentje die alles op nul zet.',
   start:'<button id="plus">+1</button>\n<button id="nul">Nul</button>\n<p id="tel">0</p>\n<script>\n  \n<\/script>', taal:'html',
   hint:'Twee keer addEventListener, en een variabele score erbuiten.',
   check:(_r,code)=> (code.match(/addEventListener/g)||[]).length>=2,
   fout:'Er moeten twee knoppen zijn die allebei ergens op reageren.' },
  vragen:[
   {v:'Wanneer draait de functie in <code>addEventListener</code>?', o:['Meteen','Als het event gebeurt','Nooit'], j:1,
    u:'Hij ligt klaar en wacht tot er geklikt wordt.'},
   {v:'Welk event hoort bij klikken?', o:['"press"','"click"','"tap"'], j:1,
    u:'Op een telefoon werkt "click" ook bij aanraken.'}
  ]},

 {id:'c5-6', t:'Tekenen', d:'Canvas',
  uitleg:[
   'Met <code>&lt;canvas&gt;</code> krijg je een leeg vlak waarop je met code kunt tekenen. Hier worden browserspellen op gemaakt.',
   'Je haalt eerst het "penseel" op met <code>getContext("2d")</code>. Daarna teken je met <code>fillRect(x, y, breedte, hoogte)</code> voor een rechthoek en <code>fillStyle</code> voor de kleur.',
   'Let op de assen: x loopt naar rechts, y naar <b>beneden</b>. Linksboven is (0,0). Dat is anders dan bij wiskunde en de eerste keer verwarrend.'
  ],
  voorbeeld:'<canvas id="doek" width="300" height="150"></canvas>\n<script>\n  const c = document.querySelector("#doek").getContext("2d");\n  c.fillStyle = "#0B6E6E";\n  c.fillRect(10, 10, 80, 40);\n  c.fillStyle = "#A6501B";\n  c.fillRect(120, 60, 60, 60);\n<\/script>',
  taal:'html',
  opdracht:{ vraag:'Teken een voetbalveld: een groen vlak met een witte lijn in het midden.',
   start:'<canvas id="doek" width="300" height="180"></canvas>\n<script>\n  const c = document.querySelector("#doek").getContext("2d");\n  \n<\/script>', taal:'html',
   hint:'Eerst een grote groene fillRect over alles, dan een smalle witte in het midden.',
   check:(_r,code)=> (code.match(/fillRect/g)||[]).length>=2 && (code.match(/fillStyle/g)||[]).length>=2,
   fout:'Nodig: minstens twee keer fillStyle en twee keer fillRect.' },
  vragen:[
   {v:'Waar is (0,0) op een canvas?', o:['Linksonder','Linksboven','In het midden'], j:1,
    u:'y loopt naar beneden, niet naar boven.'},
   {v:'Wat doet <code>fillRect(10, 20, 30, 40)</code>?', o:['Een rechthoek van 30 bij 40 op plek 10,20','Een lijn','Een cirkel'], j:0,
    u:'Eerst waar, dan hoe groot.'}
  ]},

 {id:'c5-7', t:'Project: klikspel', d:'Een spel in de browser', project:true,
  uitleg:[
   'Je maakt een spel waarin een doelwit steeds op een andere plek verschijnt en je zo snel mogelijk moet klikken. Alles zit erin: HTML voor het scherm, CSS voor het uiterlijk, JavaScript voor het spel.',
   'Nieuw hierbij is <code>Math.random()</code>, dat een getal tussen 0 en 1 geeft — de JavaScript-versie van <code>random.random()</code>. Vermenigvuldig het om een plek op je veld te krijgen.',
   'Dit is een echt project. Neem er de tijd voor en probeer dingen uit die hier niet staan.'
  ],
  voorbeeld:'// een willekeurige plek tussen 0 en 250:\nconst x = Math.floor(Math.random() * 250);',
  taal:'html',
  opdracht:{ vraag:'Maak een klikspel: een gekleurd blokje dat na elke klik naar een willekeurige plek springt, met een teller die bijhoudt hoe vaak je raak klikte.',
   start:'<style>\n  #veld { position: relative; width: 280px; height: 200px; background: #EFE8F6; border-radius: 12px; }\n  #doel { position: absolute; width: 40px; height: 40px; background: #0B6E6E; border-radius: 50%; cursor: pointer; }\n</style>\n\n<div id="veld"><div id="doel"></div></div>\n<p>Score: <span id="tel">0</span></p>\n\n<script>\n  \n<\/script>', taal:'html',
   hint:'addEventListener op #doel. In de functie: score omhoog, tel bijwerken, en doel.style.left / doel.style.top op een willekeurig aantal pixels zetten.',
   check:(_r,code)=> /addEventListener/.test(code) && /Math\.random/.test(code) && /style\.(left|top)/.test(code),
   fout:'Nodig: addEventListener, Math.random en het verzetten van style.left of style.top.' },
  vragen:[]}
]},

{id:'c6', n:'Hoe het verder gaat', ico:'🚀', u:'Welke taal waarvoor, en wat je nu installeert', lessen:[

 {id:'c6-1', t:'Welke taal waarvoor', d:'Er zijn er honderden; dit zijn de zeven die ertoe doen',
  uitleg:[
   '<b>Python</b> — waar je mee begon. Voor het leren, voor data, voor kunstmatige intelligentie, voor scriptjes die iets voor je regelen. Traag voor spellen, en dat maakt meestal niets uit.',
   '<b>JavaScript</b> — de taal van de browser. Alles wat op een website beweegt. Met Node.js draait het ook buiten de browser.',
   '<b>C#</b> — de taal van Unity, waarmee een groot deel van de games gemaakt wordt die jij speelt. Lijkt op Java en op JavaScript.',
   '<b>Lua</b> — klein en snel, de taal van Roblox. Als je in Roblox wilt bouwen begin je hier.',
   '<b>GDScript</b> — hoort bij Godot, een gratis game-engine. Lijkt sprekend op Python, dus voor jou de kortste weg naar een echte game.',
   '<b>C++</b> — de taal waarin de zware dingen gemaakt worden: game-engines, besturingssystemen, browsers. Moeilijk, snel, en niet waar je begint.',
   '<b>SQL</b> — geen taal om programma\'s in te schrijven maar om dingen te vragen aan een database. Kort te leren, altijd nuttig.'
  ],
  vragen:[
   {v:'Je wilt een game maken in Roblox. Welke taal?', o:['Python','Lua','C++'], j:1,
    u:'Roblox draait op Lua.'},
   {v:'Welke taal lijkt het meest op Python?', o:['C++','GDScript','SQL'], j:1,
    u:'Daarom is Godot voor jou de snelste route naar een eigen game.'},
   {v:'Waarmee is het grootste deel van de games gemaakt?', o:['Unity met C#','Python','HTML'], j:0,
    u:'Unity met C#, en de zwaardere met Unreal en C++.'}
  ]},

 {id:'c6-2', t:'Python op je eigen pc', d:'Van deze app naar het echte werk',
  uitleg:[
   'De Python hier is met de hand gebouwd zodat hij in je browser past. Hij kent genoeg voor alles wat je tot nu toe deed, maar de echte kan meer: bestanden lezen, internet op, plaatjes maken, spellen bouwen.',
   'Installeren doe je zo. Ga naar <code>python.org</code>, download de laatste versie, en zet bij het installeren op Windows een vinkje bij <b>"Add Python to PATH"</b>. Vergeet je dat vinkje, dan werkt het commando straks niet — dat is de klassieke eerste hobbel.',
   'Daarna heb je een <em>editor</em> nodig. VS Code is gratis en wat bijna iedereen gebruikt. Installeer daarin de Python-uitbreiding en je kunt je programma draaien met één toets.',
   'Test of het gelukt is: open de terminal en typ <code>python --version</code>. Komt er een versienummer, dan staat het goed.'
  ],
  vragen:[
   {v:'Welk vinkje moet je op Windows aanzetten bij het installeren?', o:['Add Python to PATH','Install for all users','Beta'], j:0,
    u:'Zonder dat vinkje kent je terminal het commando python niet.'},
   {v:'Waarmee controleer je of het gelukt is?', o:['python --version','python help','start python'], j:0,
    u:'Komt er een versienummer, dan zit het goed.'}
  ]},

 {id:'c6-3', t:'Git', d:'Nooit meer werk kwijt',
  uitleg:[
   'Git houdt de geschiedenis van je code bij. Elke keer dat je iets af hebt maak je een <em>commit</em>: een foto van hoe alles er nu uitziet, met een zinnetje erbij over wat je deed.',
   'Waarom dat handig is: je kunt altijd terug. Iets kapot gemaakt en je weet niet meer wat? Terug naar de laatste commit die werkte. Zonder git is dat "opnieuw beginnen".',
   'GitHub is een website waar je die geschiedenis kunt neerzetten. Zo staat je werk veilig, kun je het op een andere computer verder maken, en kan iemand anders zien wat je gemaakt hebt.',
   'De vier commando\'s waarmee je een jaar vooruit kunt: <code>git init</code> (begin), <code>git add .</code> (neem alles mee), <code>git commit -m "wat ik deed"</code> (maak de foto), <code>git push</code> (zet het online).'
  ],
  vragen:[
   {v:'Wat is een commit?', o:['Een foto van je code op dat moment','Een fout','Een programma'], j:0,
    u:'Met een zinnetje erbij, zodat je later terugvindt wat er gebeurde.'},
   {v:'Waarom is git handig?', o:['Het maakt code sneller','Je kunt altijd terug naar iets dat werkte','Het test je code'], j:1,
    u:'En je raakt niets kwijt als je pc stukgaat.'}
  ]},

 {id:'c6-4', t:'Hoe je verder leert', d:'De enige manier die werkt',
  uitleg:[
   'Je leert programmeren niet door lessen te lezen maar door dingen te maken die je zelf wilt hebben. Een lijstje wat je nu al kunt bouwen: een quiz over voetbal, een rekenmachine, een programma dat een elftal opstelt, een dobbelspel, een klikspel.',
   'Kies iets dat net iets te moeilijk is. Te makkelijk is saai, veel te moeilijk is frustrerend — er zit een smalle strook tussen waar je het snelst leert.',
   'Vast? Dan zijn er drie stappen, in deze volgorde. Eén: lees de foutmelding echt. Twee: zet prints neer om te zien wat er in je variabelen zit. Drie: pas dan vraag je hulp — en dan met de foutmelding erbij en wat je al geprobeerd hebt.',
   'En stop op tijd. Bijna elke bug die je \'s avonds niet vindt, vind je de volgende ochtend in twee minuten. Dat is geen grap; dat is het bekendste verschijnsel in het vak.'
  ],
  vragen:[
   {v:'Wat is de beste manier om verder te leren?', o:['Meer lessen lezen','Dingen maken die je zelf wilt hebben','Video\'s kijken'], j:1,
    u:'Lessen geven je gereedschap; projecten leren je het gebruiken.'},
   {v:'Wat doe je als eerste als je vastzit?', o:['Hulp vragen','De foutmelding echt lezen','Opnieuw beginnen'], j:1,
    u:'Daarna prints neerzetten, en pas dan hulp vragen.'}
  ]}
]}
];
