import type { Blok } from './soorten'

/* =============================================================================
   HET SPOOR BOUWEN

   Eerst weten wát er in een computer zit en waarom, dan pas schroeven. Wie de
   volgorde omdraait bouwt één keer een pc na een filmpje en kan daarna nog
   steeds niets zelf uitzoeken.

   De prijzen en snelheden hieronder zijn ordes van grootte uit 2025-2026, geen
   dagprijzen. Ze zijn er om te leren kiezen, niet om mee te bestellen.
============================================================================= */
export const PC: Blok[] = [
{id:'p1', n:'Wat zit erin', ico:'🔩', u:'De acht onderdelen en wat ze doen', lessen:[

 {id:'p1-1', t:'Wat is een computer', d:'Vier dingen, meer niet',
  uitleg:[
   'Elke computer — een pc, een telefoon, een PlayStation, de chip in een wasmachine — doet vier dingen: iets binnenkrijgen, het onthouden, het uitrekenen, en het weer laten zien.',
   'Binnenkrijgen doet je toetsenbord en muis. Onthouden doet het geheugen en de schijf. Uitrekenen doet de processor. Laten zien doet de videokaart via je scherm.',
   'Alle onderdelen die je straks koopt vallen in een van die vier hokjes. Als je twijfelt waar iets voor is, vraag je jezelf af in welk hokje het valt.',
   'Belangrijk verschil: <b>geheugen</b> (RAM) is wat de computer nu vasthoudt en vergeet zodra hij uitgaat. De <b>schijf</b> (SSD) onthoudt het ook als hij uit is. Mensen halen die twee constant door elkaar.'
  ],
  vragen:[
   {v:'Wat gebeurt er met RAM als de pc uitgaat?', o:['Blijft staan','Is weg','Gaat naar de schijf'], j:1,
    u:'Daarom moet je opslaan: dan gaat het naar de SSD, die het wél onthoudt.'},
   {v:'In welk hokje valt de videokaart?', o:['Onthouden','Laten zien','Binnenkrijgen'], j:1,
    u:'Hij rekent wel, maar zijn werk is het beeld.'}
  ]},

 {id:'p1-2', t:'De processor', d:'CPU — het brein',
  uitleg:[
   'De processor doet de berekeningen. Hij is klein, wordt heet, en zit in een voetje op het moederbord met honderden pinnetjes.',
   'Twee getallen tellen. <b>Kernen</b> (cores) is hoeveel dingen hij tegelijk kan doen; 6 tot 8 is voor gamen prima, meer heb je nodig bij video bewerken. <b>Kloksnelheid</b> in GHz is hoe snel elke kern werkt.',
   'Meer kernen is niet automatisch beter. Een spel gebruikt er vaak maar vier echt goed; dan is een snelle 6-kerner beter dan een langzame 16-kerner.',
   'Er zijn twee merken: Intel en AMD. Ze zijn allebei goed, maar ze passen in verschillende voetjes — daarover meer bij het moederbord.'
  ],
  vragen:[
   {v:'Wat betekent 6 kernen?', o:['Zes keer zo snel','Zes dingen tegelijk','Zes GHz'], j:1,
    u:'Tegelijk, niet sneller per stuk. Dat is een ander getal.'},
   {v:'Is 16 kernen altijd beter dan 8 voor gamen?', o:['Ja','Nee, spellen gebruiken er vaak maar een paar','Alleen bij Intel'], j:1,
    u:'Voor gamen telt de snelheid per kern zwaarder dan het aantal.'}
  ]},

 {id:'p1-3', t:'De videokaart', d:'GPU — waar je fps vandaan komt',
  uitleg:[
   'De videokaart tekent het beeld. Bij gamen is dit veruit het belangrijkste onderdeel: hij bepaalt bijna in zijn eentje hoeveel fps je haalt.',
   'Waarom hij zo goed is in beeld: een processor heeft 8 sterke kernen, een videokaart heeft er duizenden zwakke. Voor een miljoen keer dezelfde kleine som — één per beeldpunt — is dat precies goed.',
   '<b>VRAM</b> is het eigen geheugen van de kaart, waar de texturen in staan. 8 GB is het minimum dat je nu nog moet willen, 12 GB is comfortabel. Te weinig VRAM zie je niet aan een laag gemiddelde maar aan haperingen: alles loopt en dan opeens niet.',
   'Dit is ook het duurste onderdeel. In een gamepc gaat er vaak veertig procent van je budget naartoe, en dat is een verstandige verdeling.'
  ],
  vragen:[
   {v:'Wat bepaalt vooral je fps bij gamen?', o:['De processor','De videokaart','De SSD'], j:1,
    u:'Op hoge instellingen is de videokaart bijna altijd de rem.'},
   {v:'Waaraan merk je te weinig VRAM?', o:['Alles is traag','Plotselinge haperingen','De pc start niet'], j:1,
    u:'Het gemiddelde blijft goed; het zijn de stotters die het verraden.'}
  ]},

 {id:'p1-4', t:'Het geheugen', d:'RAM — de werkbank',
  uitleg:[
   'RAM is de werkbank van de computer: alles waar hij nu mee bezig is ligt erop. Groter betekent niet sneller, maar wel dat er meer tegelijk op past.',
   '16 GB is nu de norm voor gamen. 8 GB kan nog net maar loopt vol zodra je een spel, Discord en een browser tegelijk open hebt. 32 GB heb je pas nodig bij video bewerken of streamen.',
   'Zet altijd <b>twee reepjes</b> in plaats van één grote. Het geheugen kan dan via twee banen tegelijk werken (dual channel) en dat scheelt in spellen zomaar tien procent. Twee keer 8 GB is dus beter dan één keer 16 GB.',
   'DDR4 en DDR5 zijn generaties. Ze passen niet in elkaars sleuven — het moederbord bepaalt welke je nodig hebt.'
  ],
  vragen:[
   {v:'Wat is beter: 1×16 GB of 2×8 GB?', o:['1×16','2×8','Maakt niet uit'], j:1,
    u:'Twee reepjes geven dual channel: twee banen in plaats van één.'},
   {v:'Past DDR4-geheugen in een DDR5-moederbord?', o:['Ja','Nee'], j:1,
    u:'De sleuven zijn anders gekeept, juist om dit te voorkomen.'}
  ]},

 {id:'p1-5', t:'De opslag', d:'SSD, NVMe en de oude schijf',
  uitleg:[
   'Hier staan je spellen, je bestanden en Windows zelf. In tegenstelling tot RAM blijft dit staan als de stroom eraf gaat.',
   'Er zijn drie soorten. Een <b>HDD</b> is een echte draaiende schijf: goedkoop per terabyte, langzaam, en niet waar je Windows op zet. Een <b>SATA-SSD</b> heeft geen bewegende delen en is een stuk sneller. Een <b>NVMe</b> is een reepje dat rechtstreeks op het moederbord klikt en nog eens vijf tot tien keer sneller is.',
   'Neem een NVMe van minstens 1 TB. Een groot spel is tegenwoordig 100 GB, dus 500 GB is na vier spellen vol.',
   'De sprong van HDD naar SSD is de grootste snelheidswinst die je in een computer kunt stoppen. Een oude langzame laptop wordt er echt weer bruikbaar van.'
  ],
  vragen:[
   {v:'Waar zet je Windows op?', o:['Op de HDD','Op een NVMe of SSD','Op het RAM'], j:1,
    u:'Het verschil in opstarttijd is enorm.'},
   {v:'Hoeveel ruimte kost een groot spel ongeveer?', o:['5 GB','100 GB','1 GB'], j:1,
    u:'Daarom is 1 TB het verstandige minimum.'}
  ]},

 {id:'p1-6', t:'Het moederbord', d:'Waar alles op samenkomt',
  uitleg:[
   'Het moederbord verbindt alles. Zelf maakt het je pc niet sneller, maar het bepaalt wél wat erop past en wat je later nog kunt bijzetten.',
   'Het <b>voetje</b> (socket) bepaalt welke processors passen: AM5 voor de nieuwe AMD\'s, LGA1700 en LGA1851 voor Intel. Een processor die niet bij het voetje hoort past fysiek niet — en dat is maar goed ook.',
   'Verder bepaalt het bord welk geheugen erin kan (DDR4 of DDR5), hoeveel NVMe-reepjes erop kunnen, en welke aansluitingen je achterop krijgt: usb, netwerk, geluid.',
   'De <b>maat</b> heet de vormfactor. ATX is de gewone grote, micro-ATX iets kleiner, mini-ITX heel klein. De kast moet die maat aankunnen.'
  ],
  vragen:[
   {v:'Wat bepaalt het voetje van het moederbord?', o:['Welke videokaart past','Welke processor past','Hoeveel fps je haalt'], j:1,
    u:'AM5 en LGA1700 zijn niet uitwisselbaar.'},
   {v:'Wat is ATX?', o:['Een merk','Een maat van moederbord en kast','Een soort geheugen'], j:1,
    u:'De vormfactor. De kast moet hem aankunnen.'}
  ]},

 {id:'p1-7', t:'De voeding', d:'PSU — het onderdeel waarop je niet bezuinigt',
  uitleg:[
   'De voeding maakt van de 230 volt uit het stopcontact de lage spanningen die de onderdelen willen. Hij is saai, hij maakt niets sneller, en hij is het enige onderdeel dat bij falen de rest kan meeslepen.',
   'Tel op hoeveel je onderdelen samen trekken en neem daar ruim boven. Een videokaart die 200 watt gebruikt met een processor van 120 watt zit rond de 400 watt totaal; een voeding van 650 watt is dan verstandig. Ruimte is geen verspilling: een voeding is het zuinigst rond de helft van zijn maximum.',
   'Let op het keurmerk <b>80 Plus</b> (Bronze, Gold, Platinum). Dat zegt hoeveel stroom er verloren gaat als warmte. Gold is de gebruikelijke keuze.',
   'Koop dit onderdeel nooit tweedehands en nooit van een merk dat je nergens terugvindt. En maak een voeding <b>nooit</b> open, ook niet als hij al uren van het stopcontact af is: er zitten condensatoren in die lang hun lading houden.'
  ],
  vragen:[
   {v:'Waarom neem je een voeding met marge?', o:['Voor de zekerheid en de zuinigheid','Om meer fps te halen','Dat hoeft niet'], j:0,
    u:'Rond de helft van zijn maximum werkt hij het zuinigst en het koelst.'},
   {v:'Mag je een voeding openmaken?', o:['Ja, als de stekker eruit is','Nee, nooit','Alleen met handschoenen'], j:1,
    u:'De condensatoren houden hun lading nog lang vast. Dit is het enige onderdeel dat je echt niet opent.'}
  ]},

 {id:'p1-8', t:'Koeling en de kast', d:'Warmte moet weg',
  uitleg:[
   'Alle stroom die erin gaat komt er als warmte weer uit. Blijft die hangen, dan gaat je pc zichzelf afremmen om niet stuk te gaan — dat heet <em>throttling</em>, en je merkt het als fps die na tien minuten inzakt.',
   'De processor heeft een eigen koeler: een blok metaal met een ventilator, of een waterkoeler met een radiator. Voor de meeste bouwen is een goede luchtkoeler genoeg, goedkoper en stiller dan mensen denken.',
   'Tussen de processor en de koeler hoort <b>koelpasta</b>. Een klodder ter grootte van een erwt in het midden is genoeg — meer werkt averechts.',
   'De kast moet lucht kunnen doorlaten: voor naar binnen, achter en boven naar buiten. Een mooie kast met glas rondom en nauwelijks gaten ziet er goed uit en is warm.'
  ],
  vragen:[
   {v:'Wat is throttling?', o:['De pc remt zichzelf af omdat hij te heet wordt','Een virus','Een instelling'], j:0,
    u:'Fps die na tien minuten inzakt is bijna altijd dit.'},
   {v:'Hoeveel koelpasta gebruik je?', o:['Zoveel mogelijk','Ongeveer een erwt','Geen'], j:1,
    u:'Meer isoleert juist in plaats van te geleiden.'}
  ]}
]},

{id:'p2', n:'De getallen', ico:'📊', u:'Wat betekenen al die cijfers', lessen:[

 {id:'p2-1', t:'GHz, kernen en threads', d:'De cijfers op een processor',
  uitleg:[
   'Op de doos van een processor staat bijvoorbeeld: 6 cores, 12 threads, 4.7 GHz boost. Wat betekent dat.',
   '<b>Cores</b> zijn echte rekeneenheden. <b>Threads</b> zijn de banen erlangs: veel processors doen twee taken per kern, dus 6 cores geeft 12 threads. Dat is geen twaalf kernen — het vult alleen de gaatjes op.',
   '<b>GHz</b> is hoeveel miljard stappen per seconde. Boost is de snelheid die hij haalt als hij het even druk heeft en koud genoeg is; de basissnelheid is lager.',
   'Vergelijk GHz alleen binnen dezelfde generatie en hetzelfde merk. Een nieuwe processor van 4 GHz is meestal sneller dan een oude van 5 GHz, omdat hij per stap meer werk doet. Dat heet IPC, en dat staat nergens op de doos — daarom kijk je naar tests in plaats van naar getallen.'
  ],
  vragen:[
   {v:'Is 6 cores / 12 threads hetzelfde als 12 cores?', o:['Ja','Nee, threads zijn banen langs dezelfde kernen','Threads zijn sneller'], j:1,
    u:'Twaalf threads geeft ongeveer dertig procent extra, niet honderd.'},
   {v:'Is een oude 5 GHz sneller dan een nieuwe 4 GHz?', o:['Ja, altijd','Meestal niet','Precies gelijk'], j:1,
    u:'Nieuwere kernen doen per stap meer werk. Kijk naar tests, niet naar GHz.'}
  ]},

 {id:'p2-2', t:'fps en resolutie', d:'Waar het bij gamen om gaat',
  uitleg:[
   '<b>Fps</b> is het aantal beelden per seconde. 30 is speelbaar, 60 voelt soepel, 120 en hoger merk je vooral bij snelle shooters. Boven de vernieuwingssnelheid van je scherm heb je er niets aan.',
   '<b>Resolutie</b> is hoeveel beeldpunten je scherm heeft. 1080p is 1920×1080, 1440p is anderhalf keer zoveel punten, 4K is vier keer zoveel als 1080p. Elk punt moet apart getekend worden, dus 4K vraagt ruwweg vier keer zoveel van je videokaart als 1080p.',
   'Daarom is de eerste vraag bij een gamepc niet "hoeveel fps wil ik" maar "op welk scherm". Een sterke kaart op 1080p is zonde; een zwakke kaart op 4K is teleurstellend.',
   'Wat je gemiddelde niet vertelt zijn de <b>1% lows</b>: de traagste momenten. Een spel met 90 fps gemiddeld dat af en toe naar 25 zakt voelt slechter dan een spel dat stabiel 60 haalt.'
  ],
  vragen:[
   {v:'Hoeveel zwaarder is 4K dan 1080p, ruwweg?', o:['Twee keer','Vier keer','Gelijk'], j:1,
    u:'Vier keer zoveel beeldpunten om te tekenen.'},
   {v:'Wat voelt beter: 90 fps met dips naar 25, of stabiel 60?', o:['90 met dips','Stabiel 60'], j:1,
    u:'Stotters merk je veel sterker dan een lager gemiddelde.'}
  ]},

 {id:'p2-3', t:'Je scherm', d:'Hz, ms en paneel',
  uitleg:[
   'Een videokaart die 144 fps maakt op een scherm van 60 Hz levert je niets: dat scherm laat er 60 zien. <b>Hz</b> is hoe vaak per seconde je monitor ververst.',
   'Voor gewone spellen is 60 Hz prima, 144 Hz is een duidelijke stap vooruit bij shooters en racespellen, en boven de 240 Hz zit je op het terrein waar alleen wedstrijdspelers verschil merken.',
   '<b>Responstijd</b> in ms is hoe snel een beeldpunt van kleur verandert. Onder de 5 ms is prima; getallen als 0,5 ms zijn vooral marketing.',
   'Panelen: <b>IPS</b> heeft de mooiste kleuren en kijkhoeken, <b>VA</b> heeft het diepste zwart, <b>TN</b> is het snelst en het lelijkst. Voor een gamepc thuis is IPS bijna altijd de juiste keuze.'
  ],
  vragen:[
   {v:'Wat heb je aan 200 fps op een 60 Hz-scherm?', o:['Veel','Niet zoveel: je ziet er 60','Alles wordt vloeiender'], j:1,
    u:'Je scherm laat niet meer zien dan zijn eigen vernieuwingssnelheid.'},
   {v:'Welk paneel kies je meestal thuis?', o:['TN','IPS','Maakt niet uit'], j:1,
    u:'IPS: mooie kleuren en goede kijkhoeken, snel genoeg voor bijna iedereen.'}
  ]},

 {id:'p2-4', t:'De bottleneck', d:'De rem zit altijd ergens',
  uitleg:[
   'Een computer is zo snel als zijn traagste onderdeel voor die ene taak. Dat onderdeel heet de bottleneck — de flessenhals.',
   'Bij gamen op hoge instellingen is dat bijna altijd de videokaart. Speel je op lage instellingen of op 1080p met een hele snelle kaart, dan wordt de processor de rem: hij kan de beelden niet snel genoeg klaarzetten.',
   'Een dure videokaart naast een zwakke processor is dus weggegooid geld, en andersom net zo goed. Een pc van 900 euro die in verhouding is klopt beter dan een van 1300 waarin één onderdeel alles ophoudt.',
   'Twijfel je waar de rem zit? Kijk tijdens het spelen naar het gebruik van beide. Zit de videokaart op 99% en de processor op 40%, dan is het goed. Andersom betekent dat je processor het niet bijhoudt.'
  ],
  vragen:[
   {v:'Wat is meestal de bottleneck bij gamen op hoge instellingen?', o:['De processor','De videokaart','De SSD'], j:1,
    u:'Daarom gaat het grootste deel van het budget daarheen.'},
   {v:'Videokaart op 99%, processor op 40% — is dat goed?', o:['Ja, zo hoort het','Nee, de processor is de rem','Nee, de kaart is stuk'], j:0,
    u:'De kaart werkt vol, dat is precies wat je wilt.'}
  ]},

 {id:'p2-5', t:'Past het bij elkaar', d:'De vijf dingen die je nakijkt',
  uitleg:[
   'Voordat je iets bestelt loop je vijf dingen na. Doe je dat niet, dan staat er een doos die niet past.',
   '<b>Een:</b> past de processor in het voetje van het moederbord? AM5-processor hoort bij een AM5-bord.',
   '<b>Twee:</b> is het geheugen van de goede generatie? Een DDR5-bord wil DDR5-reepjes.',
   '<b>Drie:</b> is de voeding sterk genoeg, met marge? Tel de processor en de videokaart op en neem daar ruim boven.',
   '<b>Vier:</b> past het moederbord in de kast? Een ATX-bord past niet in een mini-ITX-kast.',
   '<b>Vijf:</b> past de videokaart qua lengte in de kast, en de processorkoeler qua hoogte? Dat staat bij beide in de specificaties, in millimeters.',
   'Op de Werkbank staat een bouwbank waar je dit kunt oefenen: kies onderdelen binnen een budget en de app zegt wat er niet klopt.'
  ],
  vragen:[
   {v:'Je hebt een AM5-processor. Welk bord heb je nodig?', o:['LGA1700','AM5','Maakt niet uit'], j:1,
    u:'Het voetje moet exact kloppen; anders passen de pinnen niet.'},
   {v:'Waarom kijk je naar de lengte van de videokaart?', o:['Voor het gewicht','Of hij in de kast past','Voor de fps'], j:1,
    u:'De grote kaarten zijn ruim dertig centimeter lang en passen niet in elke kast.'}
  ]}
]},

{id:'p3', n:'Bouwen', ico:'🛠️', u:'Van dozen naar een werkende pc', lessen:[

 {id:'p3-1', t:'Veilig werken', d:'Statisch, stroom en geduld',
  uitleg:[
   'Twee gevaren: statische elektriciteit voor je onderdelen, en netstroom voor jou.',
   '<b>Statisch:</b> de vonk die je voelt bij een deurklink is duizenden volts. Voor jou onschuldig, voor een chip niet. Trek de stekker eruit, en raak voordat je begint even iets metalen van de kast aan om je te ontladen. Doe dat opnieuw na elk rondje lopen over tapijt. Een polsbandje mag, maar dat metalen aanraken is het belangrijkst.',
   '<b>Stroom:</b> altijd de stekker eruit voordat je iets aanraakt binnenin. En de voeding gaat nooit open — daar zit spanning in die er uren na het uittrekken nog staat.',
   'Verder: werk op een tafel en niet op je bed of een kleed, doe het bij daglicht, en neem er de tijd voor. Bijna alle schade bij een eerste bouw ontstaat door kracht zetten waar iets gewoon moest glijden. Als het niet past, past het niet — kijk nog eens in plaats van harder te duwen.'
  ],
  vragen:[
   {v:'Wat doe je voordat je iets binnenin aanraakt?', o:['Stekker eruit en jezelf ontladen','Handschoenen aan','Niets'], j:0,
    u:'Even iets metalen van de kast aanraken is genoeg, en herhaal het na het lopen.'},
   {v:'Iets past niet en je moet flink duwen. Wat doe je?', o:['Harder duwen','Stoppen en kijken of het wel de juiste kant is','Een tang pakken'], j:1,
    u:'Behalve de 24-pins stekker en de RAM-clips gaat alles zonder kracht.'}
  ]},

 {id:'p3-2', t:'De volgorde', d:'Waarom je buiten de kast begint',
  uitleg:[
   'De volgorde die het minste gedoe geeft: eerst het moederbord op tafel klaarmaken, dan pas in de kast.',
   'Op tafel: processor in het voetje, geheugen in de sleuven, NVMe op zijn plek, koeler erop. Al die dingen zitten op plekken waar je in een dichte kast nauwelijks bij komt.',
   'Daarna: bord in de kast, videokaart erin, voeding erin, kabels aansluiten, en pas op het eind alles netjes wegwerken.',
   'Leg de doos van het moederbord onder het bord als je op tafel werkt — dat is precies waar hij voor bedoeld is, en het scheelt krassen.',
   'Handig tussenstapje dat bijna niemand doet: als het bord klaar is, sluit dan buiten de kast even de voeding aan en start hem. Werkt het niet, dan hoef je niet alles weer uit te bouwen om te zoeken.'
  ],
  vragen:[
   {v:'Waarom maak je het moederbord buiten de kast klaar?', o:['Dat is voorgeschreven','Omdat je er in de kast slecht bij kunt','Het is sneller'], j:1,
    u:'Vooral bij de koeler en het geheugen scheelt het veel gepruts.'},
   {v:'Waar leg je het bord op tafel?', o:['Op de doos van het moederbord','Op een handdoek','Rechtstreeks op tafel'], j:0,
    u:'De doos is antistatisch en beschermt de achterkant.'}
  ]},

 {id:'p3-3', t:'Processor, geheugen, NVMe', d:'De drie dingen op het bord',
  uitleg:[
   '<b>Processor:</b> de hendel naast het voetje omhoog, het klepje open. Op de processor en op het voetje staat een klein driehoekje in een hoek — die twee moeten bij elkaar. Leg hem erin, niet duwen, en doe de hendel dicht. Die voelt zwaar; dat hoort.',
   '<b>Koeler:</b> een erwt koelpasta in het midden, koeler erop, en de schroeven <em>kruislings</em> beetje bij beetje aandraaien. Dus niet één schroef helemaal vast en dan de volgende — dan staat hij scheef. Vergeet de kabel van de ventilator niet: die gaat op <code>CPU_FAN</code>.',
   '<b>Geheugen:</b> de clips open, kijk naar het keepje in het reepje zodat je weet welke kant voor is, en druk aan beide uiteinden tot de clips vanzelf dichtklikken. Dit is het onderdeel waar je écht kracht op zet. Twee reepjes horen meestal in sleuf 2 en 4 — het boekje zegt welke.',
   '<b>NVMe:</b> schroefje eruit, reepje schuin in de sleuf, plat drukken, schroefje erin. Zit er een koelplaatje bij, denk dan aan het folie dat eraf moet.'
  ],
  vragen:[
   {v:'Hoe weet je hoe de processor erin moet?', o:['Proberen','Aan het driehoekje in de hoek','Het maakt niet uit'], j:1,
    u:'Het driehoekje op de processor hoort bij dat op het voetje.'},
   {v:'Hoe draai je de koeler vast?', o:['Eén voor één helemaal vast','Kruislings, beetje bij beetje','Zo vast mogelijk'], j:1,
    u:'Anders staat de koeler scheef en raakt hij de processor maar half.'},
   {v:'Waarom horen twee reepjes vaak in sleuf 2 en 4?', o:['Voor dual channel','Voor de koeling','Dat maakt niet uit'], j:0,
    u:'Het boekje van het moederbord zegt precies welke sleuven.'}
  ]},

 {id:'p3-4', t:'In de kast', d:'Bord, kaart en voeding',
  uitleg:[
   'Eerst het <b>achterplaatje</b> van het moederbord in de kast klikken, als het niet al aan het bord vastzit. Dit is het onderdeel dat iedereen vergeet en dat je dwingt alles weer los te halen.',
   'Dan de <b>afstandsbusjes</b> (standoffs): kleine messing schroefjes die het bord van de kast af houden. Er moet er precies één onder elk schroefgat zitten en nergens anders. Een losse standoff onder het bord maakt kortsluiting.',
   'Bord erop, schroeven er los in, dan pas aandraaien — en niet met kracht. Bij printplaten geldt: vast is vast genoeg.',
   'De <b>videokaart</b> gaat in de bovenste lange sleuf (PCIe x16). Slotplaatjes achteruit de kast, kaart erin tot de clip klikt, en vastschroeven. Grote kaarten hangen door: er zijn steuntjes voor, en die zijn geen luxe.'
  ],
  vragen:[
   {v:'Wat vergeet bijna iedereen?', o:['Het achterplaatje','De koelpasta','De voeding'], j:0,
    u:'En dan moet het bord er weer uit.'},
   {v:'Waar dienen de afstandsbusjes voor?', o:['Voor de koeling','Om kortsluiting met de kast te voorkomen','Voor de stevigheid'], j:1,
    u:'Eén onder elk schroefgat, en nergens anders eentje laten liggen.'}
  ]},

 {id:'p3-5', t:'Kabels', d:'Het saaiste en het belangrijkste stuk',
  uitleg:[
   'Vier kabels moeten er sowieso in. De <b>24-pins</b> naar het moederbord, de <b>8-pins CPU-stroom</b> naar linksboven op het bord, de <b>PCIe-stroom</b> naar de videokaart, en eventueel <b>SATA</b> naar een gewone schijf.',
   'Die 8-pins bovenaan is de meest vergeten kabel die er is. Zonder hem gebeurt er bij het aanzetten helemaal niets — geen beeld, geen piep — en denk je dat je bord stuk is.',
   'Dan de <b>frontpaneel-kabeltjes</b>: aan/uit, reset, ledjes, usb en audio. Dat zijn losse pinnetjes rechtsonder op het bord en het is het vervelendste klusje van de hele bouw. Het boekje van het moederbord heeft er een tekening van. Het aan/uit-knopje kan niet verkeerd om: dat is een simpel contact.',
   'Werk kabels weg achter de plaat achter het moederbord. Dat is niet alleen mooi: lucht die vrij kan stromen houdt je onderdelen koeler.'
  ],
  vragen:[
   {v:'Welke kabel wordt het vaakst vergeten?', o:['De 24-pins','De 8-pins CPU-stroom bovenaan','De SATA-kabel'], j:1,
    u:'Zonder die kabel start er niets en lijkt alles stuk.'},
   {v:'Waarom werk je kabels netjes weg?', o:['Alleen voor het uiterlijk','Voor de luchtstroom','Dat hoeft niet'], j:1,
    u:'Koeler is stiller en sneller.'}
  ]},

 {id:'p3-6', t:'De eerste start', d:'En de BIOS',
  uitleg:[
   'Voor je aanzet: kijk of alle stroomkabels vastzitten, of het geheugen echt is doorgeklikt en of er geen schroefje los in de kast ligt. Zet dan pas de stekker erin en de schakelaar achter op de voeding aan.',
   'Gaat hij aan en zie je beeld, dan kom je in de <b>BIOS</b> (of UEFI) — het scherm van het moederbord zelf, nog vóór Windows. Daar staat of hij je processor, je geheugen en je schijf ziet. Klopt dat, dan is je bouw goed.',
   'Zet daar één ding aan: <b>XMP</b> of <b>EXPO</b>. Zonder dat draait je geheugen op de trage standaardsnelheid in plaats van waarvoor je betaald hebt. Eén klik, zomaar een paar procent fps.',
   'Geen beeld? Ga rustig langs deze lijst: zit de 8-pins bovenaan erin, zit de monitor aan de <b>videokaart</b> en niet aan het moederbord, klikt het geheugen echt vast (haal het eruit en druk het opnieuw in), en zit de 24-pins goed. Dat is samen negen van de tien keer het probleem.'
  ],
  vragen:[
   {v:'Wat zet je in de BIOS meteen aan?', o:['XMP of EXPO','Overklokken','Niets'], j:0,
    u:'Zonder dat loopt je geheugen langzamer dan waarvoor je betaald hebt.'},
   {v:'Geen beeld. Waar zit de monitorkabel als het goed is?', o:['Op het moederbord','Op de videokaart','Maakt niet uit'], j:1,
    u:'Met een losse videokaart moet het scherm daaraan.'}
  ]},

 {id:'p3-7', t:'Windows of Linux', d:'Het besturingssysteem erop',
  uitleg:[
   'Zonder besturingssysteem is je pc een doos die de BIOS laat zien. Je maakt op een andere computer een USB-stick klaar en start daarvan op.',
   'Voor <b>Windows</b> gebruik je het Media Creation Tool van Microsoft. Dat maakt de stick in een paar klikken. Bij het installeren kies je de NVMe-schijf en laat je hem de indeling zelf doen.',
   'Voor <b>Linux</b> download je een iso (Ubuntu of Mint zijn de vriendelijkste) en zet je die met Rufus of Balena Etcher op een stick. Linux is gratis, snel op oudere machines en de plek waar je later als programmeur toch terechtkomt. Gamen werkt tegenwoordig verrassend goed via Proton, maar niet elk spel doet het.',
   'Na de installatie: de driver van je videokaart erop (nvidia.com of amd.com), en Windows helemaal laten bijwerken. Dan pas Steam en de rest.',
   'Wil je allebei? Dat kan met dual boot: twee systemen op één pc, kiezen bij het opstarten. Doe dat pas als het eerste systeem goed draait.'
  ],
  vragen:[
   {v:'Waarvan installeer je Windows?', o:['Van een USB-stick','Van internet in de BIOS','Van een cd'], j:0,
    u:'De stick maak je op een andere computer met het Media Creation Tool.'},
   {v:'Wat doe je meteen na de installatie?', o:['Spellen installeren','De driver van je videokaart erop','Overklokken'], j:1,
    u:'Zonder driver draait je kaart op een noodstand en haal je een fractie van je fps.'}
  ]}
]},

{id:'p4', n:'Werkend houden', ico:'🧰', u:'Onderhoud, problemen zoeken en veilig blijven', lessen:[

 {id:'p4-1', t:'Warmte en stof', d:'Waarom je pc na een jaar langzamer lijkt',
  uitleg:[
   'Een pc die na een jaar trager voelt is meestal niet versleten maar vies. Stof in de koelribben werkt als een deken.',
   'Maak hem één of twee keer per jaar schoon met perslucht, buiten of bij een open raam. Houd de ventilators tegen met je vinger terwijl je blaast: als ze vrij ronddraaien wekken ze stroom op en dat kunnen ze niet hebben.',
   'Wat zijn normale temperaturen? Onder belasting is de processor rond de 60 tot 80 graden prima en de videokaart rond de 60 tot 75. Boven de 90 graden gaat hij zichzelf afremmen. Meten kan met HWMonitor of MSI Afterburner.',
   'Wordt hij te heet terwijl hij schoon is, kijk dan naar de koelpasta (die droogt na drie of vier jaar uit) en naar de ventilatorrichting: voor naar binnen, achter en boven naar buiten.'
  ],
  vragen:[
   {v:'Wat is een normale processortemperatuur onder belasting?', o:['30 graden','60 tot 80 graden','Boven de 95'], j:1,
    u:'Boven de 90 gaat hij throttlen.'},
   {v:'Waarom houd je ventilators tegen bij het schoonblazen?', o:['Voor het geluid','Omdat ze anders stroom opwekken','Dat hoeft niet'], j:1,
    u:'Vrij ronddraaien maakt van een ventilator een dynamo.'}
  ]},

 {id:'p4-2', t:'Drivers en updates', d:'Software die bij je hardware hoort',
  uitleg:[
   'Een driver is het stukje software dat Windows vertelt hoe het met een onderdeel moet praten. De belangrijkste is die van je videokaart.',
   'Haal die altijd bij de bron: <code>nvidia.com</code> of <code>amd.com</code>. Nooit van een site die "driver updater" heet — dat is bijna altijd rommel of erger.',
   'Verder werken de meeste drivers vanzelf bij via Windows Update. De chipset-driver van je moederbord haal je één keer bij de fabrikant van het bord.',
   'Nieuwe drivers geven bij nieuwe spellen soms echt fps erbij. Draait alles goed, dan hoef je niet elke week bij te werken — "als het werkt, laat het werken" is een prima regel.'
  ],
  vragen:[
   {v:'Waar haal je de driver van je videokaart?', o:['Bij nvidia.com of amd.com','Bij een driver-updatesite','Uit de Microsoft Store'], j:0,
    u:'Altijd bij de bron; de rest is rommel of malware.'},
   {v:'Moet je alles altijd meteen bijwerken?', o:['Ja','Nee, als het goed draait mag het wachten','Nooit bijwerken'], j:1,
    u:'Behalve beveiligingsupdates — die wel.'}
  ]},

 {id:'p4-3', t:'Als het niet werkt', d:'Zoeken met systeem in plaats van gokken',
  uitleg:[
   'Als iets kapot is, is de verleiding groot om van alles tegelijk te proberen. Doe dat niet: dan weet je achteraf niet wat het was en kun je het niet nog eens oplossen.',
   'De methode: verander <b>één ding tegelijk</b> en kijk of het verschil maakt. Werkt het niet, zet het dan terug voordat je het volgende probeert.',
   'Kom je er niet uit, haal dan alles eruit behalve wat hij minimaal nodig heeft: moederbord, processor, koeler, één reepje geheugen, voeding. Start hij dan? Zet er dan één ding tegelijk bij tot het misgaat. Dan wéét je welk onderdeel het is.',
   'Veelvoorkomend, en de eerste dingen om na te lopen: geen beeld is meestal het geheugen dat niet doorgeklikt is of de vergeten 8-pins. Willekeurige herstarts zijn meestal de voeding of oververhitting. Piepjes bij het opstarten zijn een code — kijk in het boekje van het moederbord wat het patroon betekent.'
  ],
  vragen:[
   {v:'Wat is de regel bij zoeken naar een fout?', o:['Alles tegelijk proberen','Eén ding tegelijk veranderen','Meteen nieuwe onderdelen kopen'], j:1,
    u:'Anders weet je nooit wat het was.'},
   {v:'Willekeurige herstarts wijzen meestal op...', o:['De SSD','De voeding of te hoge temperaturen','Het toetsenbord'], j:1,
    u:'Beide zijn te meten voordat je iets vervangt.'}
  ]},

 {id:'p4-4', t:'Slim upgraden', d:'Wat je later bijzet',
  uitleg:[
   'Een pc die je zelf bouwt gooi je niet weg maar bouw je uit. De vraag is alleen: wat als eerste.',
   'De volgorde die het meest oplevert per euro: <b>meer RAM</b> als je er 8 GB in hebt, dan een <b>NVMe</b> als je nog van een gewone schijf start, dan een <b>videokaart</b> als je fps tekortkomt, en pas als laatste de <b>processor</b> — want daarvoor moet vaak het moederbord ook mee, en dan bouw je eigenlijk opnieuw.',
   'Denk daar bij het kopen al aan. Een voeding met marge en een moederbord met een sleuf over maken een upgrade over twee jaar tot een middag werk in plaats van een nieuwe pc.',
   'En kijk naar wat je écht doet. Als je spellen op 1080p speelt en 90 fps haalt, levert een duurdere kaart je niets op zolang je scherm 60 Hz is. Dan is een beter scherm de betere upgrade.'
  ],
  vragen:[
   {v:'Je hebt 8 GB RAM en een oude HDD. Wat eerst?', o:['Videokaart','RAM erbij en een NVMe','Processor'], j:1,
    u:'Dat zijn de goedkoopste stappen met het grootste verschil.'},
   {v:'Waarom is de processor vaak de laatste upgrade?', o:['Hij is het duurst','Vaak moet het moederbord mee','Hij gaat nooit stuk'], j:1,
    u:'En dan bouw je eigenlijk een nieuwe pc.'}
  ]},

 {id:'p4-5', t:'Veilig blijven', d:'Wachtwoorden, downloads en mensen die iets van je willen',
  uitleg:[
   'Je bouwt een mooie pc en dan verlies je je account aan iemand die je een gratis skin belooft. Dit hoort erbij.',
   '<b>Wachtwoorden:</b> voor elke site een andere. Dat kan alleen met een wachtwoordmanager (Bitwarden is gratis) of met een vast trucje dat per site verschilt. Zet <b>tweestapsverificatie</b> aan op je Google-, Steam- en Discord-account. Dan kan iemand met je wachtwoord er nog steeds niet in.',
   '<b>Downloads:</b> alleen van de officiële site of uit Steam. Gekraakte spellen en "gratis V-Bucks"-programma\'s zijn de nummer één manier waarop mensen van jouw leeftijd hun account kwijtraken.',
   '<b>Mensen:</b> niemand van Steam, Discord of een game vraagt ooit je wachtwoord of je code — als iemand dat doet is het altijd oplichterij, ook als het account van een vriend lijkt te zijn. Een link die je moet openen "om je prijs te claimen" is dat ook.',
   'En het belangrijkste: als er toch iets misgaat, vertel het meteen thuis. Er is niets zo erg dat je het alleen moet oplossen, en snel handelen scheelt vaak alles.'
  ],
  vragen:[
   {v:'Iemand op Discord vraagt je Steam-code om je een skin te geven. Wat doe je?', o:['Geven','Nooit geven, dit is oplichterij','Alleen bij een vriend'], j:1,
    u:'Ook als het account van een vriend lijkt: die is dan waarschijnlijk zelf gehackt.'},
   {v:'Wat is de sterkste bescherming van je accounts?', o:['Een lang wachtwoord','Tweestapsverificatie','Vaak wisselen'], j:1,
    u:'Dan is je wachtwoord alleen niet genoeg om binnen te komen.'}
  ]}
]}
];
