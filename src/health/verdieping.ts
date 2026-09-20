/**
 * VERDIEPEN: het boekje over afvallen, medicatie en wat je vasthoudt
 *
 * Acht stukken, en ze staan er voor iedereen hetzelfde. Net als `leren.ts` is
 * dit een boek en geen behandeling: er wordt niets van de gebruiker gelezen,
 * niets uitgerekend, en niets aangepast aan wie je bent.
 *
 * Dat is geen stijlkeuze maar de grens waar deze app aan de goede kant van
 * blijft. Onder MDCG 2019-11 is software die uitsluitend informatie ontsluit,
 * zonder patiëntspecifieke verwerking, geen medisch hulpmiddel. "Bij semaglutide
 * is ongeveer 40 procent van het verlies vetvrije massa" als vaste tekst mag.
 * Diezelfde zin met jóuw cijfers erin zou iets anders zijn.
 *
 * DAAROM IS `inDeApp` EEN VERWIJZING EN GEEN BEREKENING
 *
 * Het oorspronkelijke voorstel had per stuk een "wat jij eraan hebt" met de
 * eigen getallen van de lezer erin. Dat is bij het schrijven rechtgezet: hier
 * staat wáár in de app je het terugziet, en het rekenen gebeurt dáár. Het
 * verschil tussen die twee is precies het verschil tussen een boekje en een
 * hulpmiddel.
 *
 * WAT DIT BOEKJE ANDERS MAAKT DAN DE MEESTE
 *
 * Elk stuk heeft een veld `nietWeten`, en dat mag nooit leeg zijn. In deze markt
 * zijn de claims hard en het bewijs zacht; het enige echte onderscheid is zeggen
 * waar de zekerheid ophoudt. Een proef houdt dat vast, niet als stijlregel maar
 * omdat een stuk zonder dat veld het soort tekst is dat dit boekje juist niet
 * wil zijn.
 *
 * De bronnen staan in `health/ONDERZOEK-MEDISCH-AFVALLEN.md` met hun links.
 */

export interface Verdieping {
  id: string
  titel: string
  /** Eén zin in de dichte stand. */
  kort: string
  /** Wat we weten, met het getal en waar het vandaan komt. */
  weten: string[]
  /** Wat we niet weten. Nooit leeg: zie de kop. */
  nietWeten: string[]
  /** Waar in de app je dit terugziet. Een verwijzing, geen berekening. */
  inDeApp: string
  bron: string
}

export const VERDIEPINGEN: readonly Verdieping[] = [
  {
    id: 'trap',
    titel: 'De Nederlandse trap: waar medicatie staat',
    kort: 'Medicatie is in Nederland geen eerste stap, en de lat ligt hoger dan de bijsluiter.',
    weten: [
      'Afvallen loopt in Nederland langs een trap. Onderaan staat wat je zelf doet. Daarboven '
        + 'staat de gecombineerde leefstijlinterventie, de GLI: twee jaar begeleiding op voeding, '
        + 'bewegen en gedrag, volledig vergoed uit de basisverzekering, zonder eigen risico en '
        + 'zonder eigen bijdrage. Je hebt er wel een verwijzing van je huisarts voor nodig: '
        + 'zonder verwijzing geen deelname en geen vergoeding.',
      'Er zijn zeven erkende programma’s: BeweegKuur, SLIMMER, CooL, Samen Sportief in '
        + 'Beweging, X-Fittt, Keer Diabetes2 Om en Keer Diabetes2 Om intensief. Ze verschillen in '
        + 'lengte van de behandelfase en in wie je begeleidt; CooL is de enige die door één '
        + 'persoon wordt gegeven, een leefstijlcoach.',
      'Medicatie staat een trede hóger, en dat is het punt dat het vaakst misgaat. De tekst in '
        + 'de bijsluiter, de Europese registratie, noemt een veel lagere drempel dan waarop een '
        + 'Nederlandse huisarts mag starten. De NHG-Standaard Obesitas van augustus 2026 vraagt '
        + 'een aanzienlijk hogere BMI, mét gewichtsgerelateerde aandoeningen, én dat je eerst '
        + 'minstens een jaar gemotiveerd aan een leefstijlprogramma hebt meegedaan zonder '
        + 'voldoende resultaat. De standaard noemt het uitdrukkelijk "aanvullend aanbod": geen '
        + 'huisarts is verplicht het te leveren.',
      'Bovenaan staat de operatie. Die komt pas in beeld als de treden eronder onvoldoende '
        + 'hebben opgeleverd.',
    ],
    nietWeten: [
      'In dit stuk staan geen BMI-grenzen. Die staan op Profiel, bij je traject, met beide '
        + 'drempelsets erbij en met de reden waarom de app niet zegt of jij eroverheen komt. '
        + 'Hier gaat het om de volgorde van de trap, en een getal zou daar de aandacht van '
        + 'wegnemen.',
      'En waar jíj op die trap staat, kan deze app niet zeggen. Dat is een oordeel van je '
        + 'huisarts en niet van een scherm.',
    ],
    inDeApp: 'Nog nergens. Dit stuk beschrijft de trap; de app plaatst je er niet op.',
    bron: 'NHG-Standaard Obesitas, augustus 2026; RIVM over de '
      + 'erkende GLI-programma’s.',
  },
  {
    id: 'glp1',
    titel: 'Wat GLP-1 doet, en wat je ervan merkt',
    kort: 'Een hormoon dat je verzadiging nabootst, met een opbouwschema en een paar signalen die tellen.',
    weten: [
      'GLP-1 is een hormoon dat je darm zelf maakt na het eten. Het remt je eetlust en vertraagt '
        + 'de maaglediging, waardoor je eerder vol zit en dat langer blijft. Middelen als '
        + 'semaglutide en liraglutide bootsen dat hormoon na; tirzepatide werkt op twee '
        + 'hormoonroutes tegelijk.',
      'De dosis wordt in stappen opgebouwd over meerdere maanden. Dat is niet om te rekken maar '
        + 'om de bijwerkingen draaglijk te houden: misselijkheid, een vol gevoel, boeren, lichte '
        + 'diarree of juist obstipatie, hoofdpijn. Die nemen bij de meeste mensen af naarmate het '
        + 'lichaam went.',
      'Een paar signalen zijn geen gewenning en horen dezelfde dag bij je arts te komen: hevige '
        + 'buikpijn die naar je rug uitstraalt, aanhoudend braken, geel worden van je huid of '
        + 'oogwit, of tekenen van uitdroging.',
      'Bij de erkende middelen voor gewichtsbehandeling is in onderzoek gemiddeld 15 tot ruim 20 '
        + 'procent gewichtsverlies gezien over ruim een jaar (68 tot 72 weken), met '
        + 'leefstijlbegeleiding erbij.',
    ],
    nietWeten: [
      'Die percentages komen uit onderzoek bij geselecteerde deelnemers die allemaal ook '
        + 'begeleiding kregen. In de dagelijkse praktijk valt het lager uit. Hoevéél lager is '
        + 'niet goed bekend.',
      'Wat langdurig gebruik over tien of twintig jaar doet, is onbekend: de middelen bestaan '
        + 'daar nog niet lang genoeg voor. Het Zorginstituut noemde dit als een van de redenen om '
        + 'ze niet in het basispakket op te nemen.',
    ],
    inDeApp: 'De app schrijft niets voor en beoordeelt geen dosering. Wat hij wel doet is bijhouden '
      + 'wat er gebeurt: je gewichtstrend op Inzicht, en op Beweging wat je spieren vasthoudt.',
    bron: 'EMA-productinformatie; STEP- en SURMOUNT-onderzoeken; Zorginstituut Nederland.',
  },
  {
    id: 'stoppen',
    titel: 'Wat er gebeurt als je stopt',
    kort: 'Een jaar na staken was tweederde van het verlies terug. Dat is het belangrijkste getal dat er is.',
    weten: [
      'In de vervolgstudie van STEP-1 werden 327 deelnemers een jaar gevolgd nadat ze met '
        + 'semaglutide én met de leefstijlbegeleiding waren gestopt. Ze wonnen gemiddeld '
        + 'tweederde van het verloren gewicht terug.',
      'Van het oorspronkelijke verlies van ruim 17 procent bleef netto 5,6 procent over. Van de '
        + 'deelnemers hield ongeveer 48 procent minstens 5 procent verlies vast. Een deel zat weer '
        + 'op of boven het startgewicht.',
      'De verbeteringen in bloeddruk, vetten en bloedsuiker liepen mee terug.',
      'Wat dat zegt is niet dat het middel niet werkt. Het zegt dat het de aandoening niet '
        + 'oplost maar openhoudt, en dat alles afhangt van wat er tijdens en ná de behandeling '
        + 'gebeurt.',
    ],
    nietWeten: [
      'Hoe je verantwoord afbouwt is niet onderzocht. Het Zorginstituut noemde dat met zoveel '
        + 'woorden: er zijn geen studies naar afbouwen als het gewicht voldoende is gedaald.',
      'Waaróm de ene persoon vasthoudt en de andere niet, is grotendeels onbekend.',
    ],
    inDeApp: 'Je gewichtstrend op Inzicht loopt door zolang je weegt, ook als een behandeling '
      + 'stopt. Dat is precies de periode waarin een trend het meest zegt.',
    bron: 'Wilding e.a., STEP-1-vervolgstudie, Diabetes Obesity and Metabolism, 2022 (n=327).',
  },
  {
    id: 'eiwit',
    titel: 'Waarom eiwit nu zwaarder telt',
    kort: 'Er is een drempel per maaltijd die los staat van je dagtotaal, en juist in een tekort telt die.',
    weten: [
      'Spieraanmaak komt pas op gang boven een bepaalde hoeveelheid eiwit in één maaltijd. Bij '
        + 'ouderen ligt die rond de 30 gram; sommige onderzoeken noemen 35 tot 40. Onder die '
        + 'drempel gebeurt er weinig, ook als je dagtotaal klopt.',
      'In een calorietekort is de aanmaak onderdrukt en de afbraak verhoogd. Daardoor telt het '
        + 'halen van die drempel bij élke maaltijd zwaarder dan het dagtotaal. Het is dan '
        + 'belangrijker hóé je het verdeelt dan of je aan je som komt.',
      'Voor de dag als geheel wordt tijdens afvallen 1,2 tot 1,6 gram eiwit per kilo lichaams'
        + 'gewicht genoemd, en bij actief spierbehoud soms meer.',
      'Praktisch: liever twee of drie maaltijden die de drempel ruim halen dan vier die er net '
        + 'onder blijven.',
    ],
    nietWeten: [
      'De richting van dit advies is goed onderbouwd, de grootte niet. In een overzicht van '
        + 'twintig studies naar eiwit en vetvrije massa vonden er drie een duidelijk verschil, en '
        + 'maar één daarvan ging over mensen boven de vijftig.',
      'Of de bovenkant van die reeks (1,6 gram per kilo en meer) beter is dan 1,2, is niet '
        + 'overtuigend aangetoond.',
      'En waar de drempel precies ligt, verschilt per persoon en per eiwitbron. Dertig gram is '
        + 'een richtgetal en geen schakelaar.',
    ],
    inDeApp: 'Op Beweging, bij "Wat je spieren vasthoudt", staat per maaltijd of je erboven '
      + 'uitkwam. Ligt je dagdoel gedeeld door drie onder de drempel, dan zegt de app dat erbij.',
    bron: 'Onderzoek naar eiwitverdeling en lichaamssamenstelling (Frontiers in Nutrition, 2024) '
      + 'en naar eiwit en vetvrije massa bij gewichtsverlies.',
  },
  {
    id: 'spier',
    titel: 'Wat je verliest naast vet',
    kort: 'Bij semaglutide was ongeveer 40 procent van het verlies vetvrije massa. Daar valt iets aan te doen.',
    weten: [
      'Een weegschaal telt kilo’s en zegt niet waar ze vandaan komen. In de '
        + 'lichaamssamenstellingsstudie bij STEP-1 was ongeveer 40 procent van wat er verdween '
        + 'vetvrije massa; bij tirzepatide in SURMOUNT-1 ongeveer 25 procent.',
      'Vetvrije massa is niet alleen spier: er zit ook vocht en orgaanweefsel in, en een deel '
        + 'van dat verlies is normaal bij afvallen. Maar spier zit er wel in, en spier die weg is '
        + 'komt er niet vanzelf terug.',
      'Wie er meer risico op loopt: mensen boven de 65, mensen die al weinig spiermassa hadden, '
        + 'en mensen die weinig bewegen of te weinig eiwit binnenkrijgen.',
      'Wat ertegen helpt is niet omstreden: genoeg eiwit, krachttraining, en het in de gaten '
        + 'houden. In kleine reeksen bij mensen die drie tot vijf keer per week krachttraining '
        + 'deden en op hun eiwit letten, bleef de vetvrije massa vrijwel gelijk of nam zelfs toe, '
        + 'bij een gewichtsverlies van 13 tot 33 procent.',
    ],
    nietWeten: [
      'Die reeksen zijn klein en niet geloot: mensen die uit zichzelf drie keer per week trainen '
        + 'verschillen op meer dingen dan hun training. Het is de beste aanwijzing die er is, geen '
        + 'bewijs van oorzaak.',
      'Hoeveel spierverlies bij afvallen te véél is, en vanaf wanneer het op langere termijn '
        + 'kwaad doet, is niet vastgesteld.',
    ],
    inDeApp: 'Op Beweging staat "Wat je spieren vasthoudt": eiwit per maaltijd, krachtsessies, en '
      + 'een test waarbij je vijf keer uit een stoel opstaat.',
    bron: 'Substudies van STEP-1 en SURMOUNT-1; casusreeksen over behoud van vetvrije massa (2025).',
  },
  {
    id: 'bot',
    titel: 'Bot, en waarom het bewijs elkaar tegenspreekt',
    kort: 'Twee goede onderzoeken, twee verschillende uitkomsten. Dat hoort je te weten.',
    weten: [
      'Snel gewichtsverlies kost botdichtheid, en dat geldt voor elke manier van afvallen, ook '
        + 'zonder medicatie. Minder gewicht betekent minder belasting, en bot past zich daaraan '
        + 'aan.',
      'Over GLP-1 daarbovenop spreken de onderzoeken elkaar tegen. In één studie verlaagde een '
        + 'jaar semaglutide de botdichtheid van de heup met 2,6 procent en van de onderrug met '
        + '2,1 procent ten opzichte van placebo, met meer botafbraak zonder dat de aanmaak '
        + 'meeging. Dat was een kleine studie: 64 deelnemers, allemaal met een verhoogd risico '
        + 'op botbreuken, en een lagere dosering dan bij gewichtsbehandeling gebruikelijk is. Een '
        + 'samenvattend onderzoek bij mensen met diabetes type 2 vond juist een verbetering.',
      'Wat er overblijft: andere mensen, andere uitkomst. Dat snel afvallen bot kost staat vast; '
        + 'hoeveel GLP-1 daar bovenop komt, niet.',
      'Waar wel overeenstemming over is: genoeg calcium en vitamine D, en belasting. Kracht'
        + 'training doet voor bot hetzelfde als voor spier.',
    ],
    nietWeten: [
      'Of dit verschil in botdichtheid ook leidt tot meer botbreuken, is niet aangetoond. '
        + 'Botdichtheid is een tussenmaat en geen uitkomst.',
      'En welke van de twee uitkomsten voor wie geldt, is niet uitgezocht.',
    ],
    inDeApp: 'Onder "Wat ontbreekt er?" op Vandaag staat of er een reden is om vitamine D bij te '
      + 'nemen. Die regel volgt de Gezondheidsraad en staat er om je botten.',
    bron: 'Onderzoek naar botdichtheid bij GLP-1 (Frontiers in Aging, 2025) en een samenvattend '
      + 'onderzoek bij diabetes type 2 (2025).',
  },
  {
    id: 'meerdanbmi',
    titel: 'Meer dan een BMI',
    kort: 'Sinds 2025 is er een definitie die niet op één getal leunt.',
    weten: [
      'BMI is gewicht gedeeld door je lengte in het kwadraat. Het zegt iets over een groep en '
        + 'weinig over een persoon: het kent geen verschil tussen spier en vet, en niet tussen '
        + 'vet om je organen en vet op je heupen.',
      'In januari 2025 stelde een internationale commissie in The Lancet een andere aanpak voor. '
        + 'Obesitas wordt daar overmaat lichaamsvet, vast te stellen met een directe meting of met '
        + 'minstens twee maten samen, bijvoorbeeld BMI én middelomtrek.',
      'En er komt een onderscheid bij dat er eerder niet was. Klinische obesitas is een ziekte'
        + 'toestand waarbij er aantoonbaar iets niet goed werkt in je lichaam of je dagelijks '
        + 'functioneren beperkt is. Preklinische obesitas is overmaat vet zonder die schade, wel '
        + 'met een verhoogd risico voor later.',
      'De bedoeling is behandeling te richten op wie er nú last van heeft, en niet op een getal.',
    ],
    nietWeten: [
      'Deze definitie is nieuw en nog niet overal overgenomen. De Nederlandse richtlijnen en de '
        + 'vergoedingsregels werken op dit moment nog met BMI-grenzen.',
      'Of het onderscheid tussen klinisch en preklinisch in de praktijk tot betere zorg leidt, '
        + 'moet zich nog bewijzen.',
    ],
    inDeApp: 'Op Gezondheid staan je middelomtrek en bloeddruk naast je BMI, met de grenzen die '
      + 'daarbij horen. Meer maten naast elkaar is precies waar deze definitie om vraagt.',
    bron: 'Lancet Diabetes & Endocrinology Commission, Definition and diagnostic criteria of '
      + 'clinical obesity, januari 2025.',
  },
  {
    id: 'volhouden',
    titel: 'Wat volhouden voorspelt, en de valkuil van meten',
    kort: 'Regelmatig wegen is de sterkste voorspeller. En meten kan ook tegen je gaan werken.',
    weten: [
      'Het National Weight Control Registry volgt mensen die minstens een jaar een fors '
        + 'gewichtsverlies vasthielden. De sterkste gedragsvoorspeller die daaruit komt is '
        + 'regelmatig wegen: wie minder vaak weegt, komt vaker aan. Wegen werkt als vroeg alarm: '
        + 'je ziet iets aankomen terwijl het nog klein is.',
      'Wat verder samenhangt met terugval: minder bewegen in je vrije tijd, minder greep op wat '
        + 'je eet, en een groter aandeel vet in je inname.',
      'En dan de kant die zelden genoemd wordt. In een onderzoek uit 2025 bleek dat mensen die '
        + 'wéér waren aangekomen juist méér belangstelling hadden voor apps en technologie om bij '
        + 'te houden, maar ook meer schuld, ontmoediging en klachten over hun lichaamsbeeld '
        + 'rapporteerden als ze die gebruikten.',
      'Meer meten is dus niet vanzelf beter. Het ontwerp bepaalt of een cijfer een handvat wordt '
        + 'of een oordeel.',
    ],
    nietWeten: [
      'De mensen in dat register zijn een sterk geselecteerde groep: ze melden zich zelf aan '
        + 'omdat het gelukt is. Wat daar aan gedrag uit komt, is geen slaagkans voor iedereen.',
      'En het blijft samenhang, geen oorzaak. Of vaker wegen ervóór zorgt dat je vasthoudt, of '
        + 'dat wie het volhoudt nu eenmaal vaker weegt, is uit deze gegevens niet op te maken.',
    ],
    inDeApp: 'Deze app toont je gewicht als trend met een band eromheen, en niet als los cijfer '
      + 'dat elke dag anders is. Dat is met opzet: een schommeling van een kilo is meestal vocht.',
    bron: 'National Weight Control Registry; onderzoek naar zelfmonitoring en terugval (2025).',
  },
]
