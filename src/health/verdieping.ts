/**
 * VERDIEPEN: het boekje over afvallen, medicatie en wat je vasthoudt
 *
 * Elf stukken, en ze staan er voor iedereen hetzelfde. Net als `leren.ts` is
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
      'De getallen uit het onderzoek, alle met leefstijlbegeleiding erbij. Semaglutide gaf in '
        + 'STEP-1 gemiddeld 17,3 procent gewichtsverlies over 68 weken. Tirzepatide, dat op twee '
        + 'hormoonroutes werkt, gaf in SURMOUNT-1 ongeveer 22,5 procent over 72 weken, waarbij '
        + 'meer dan de helft van de deelnemers minstens 20 procent verloor. In SURMOUNT-5 zijn de '
        + 'twee rechtstreeks vergeleken en kwam tirzepatide er beter uit. De tablet met '
        + 'semaglutide haalt 5 tot 10 procent; de NHG-Standaard raadt die niet aan.',
      'En wat het kost, want dat hoort erbij. Bij obesitas zonder diabetes type 2 worden deze '
        + 'middelen in Nederland niet vergoed: je betaalt ze zelf, in de orde van honderdvijftig '
        + 'tot driehonderdvijftig euro per maand. Het Zorginstituut adviseerde in juli 2024 tegen '
        + 'opname in het basispakket en de minister nam dat over. Niet omdat het middel niet '
        + 'werkt, dat noemde het instituut bewezen, maar omdat niet vast te stellen is bij wie het '
        + 'de meeste gezondheidswinst geeft, er geen onderzoek is naar verantwoord afbouwen, en '
        + 'het onbekend is of langdurig gebruik blijvend helpt.',
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
        + 'onder blijven. Wat er ongeveer in zit: honderd gram bereide kipfilet komt rond de 30 '
        + 'gram uit, honderd gram kabeljauw rond de 24, een schep wei-eiwit van dertig gram rond '
        + 'de 27, een schaaltje magere kwark van 250 gram rond de 25, drie eieren rond de 19, en '
        + 'een schaaltje Griekse yoghurt van 150 gram rond de 12. Eén bron haalt de drempel dus '
        + 'lang niet altijd alleen.',
      'Waar dat per kilo op slaat, maakt uit. Bij obesitas rekenen met je actuele gewicht geeft '
        + 'een doel dat te hoog is; de Amsterdamse groep die hier onderzoek naar doet houdt aan '
        + 'dat je het gewicht maximeert op wat bij een BMI van 30 hoort. Deze app rekent zo, en '
        + 'op Profiel staat welke uitkomst dat voor jou geeft.',
    ],
    nietWeten: [
      'De richting van dit advies is goed onderbouwd, de grootte niet. In een overzicht van '
        + 'twintig studies naar eiwit en vetvrije massa vonden er drie een duidelijk verschil, en '
        + 'maar één daarvan ging over mensen boven de vijftig.',
      'Of de bovenkant van die reeks (1,6 gram per kilo en meer) beter is dan 1,2, is niet '
        + 'overtuigend aangetoond.',
      'En waar de drempel precies ligt, verschilt per persoon en per eiwitbron. Dertig gram is '
        + 'een richtgetal en geen schakelaar.',
      'De verklaring die je overal leest, dat het om de hoeveelheid leucine in een maaltijd '
        + 'gaat, is een werkhypothese. Een systematisch overzicht vond wel verband tussen '
        + 'leucine en spieraanmaak bij ouderen, maar kon geen enkele drempelwaarde vaststellen en '
        + 'geen maat in het bloed die voorspelt wie reageert.',
      'Er bestaat trouwens geen enkel onderzoek dat de eiwitbehoefte bij obesitas rechtstreeks '
        + 'heeft bepaald. Alles wat hierboven staat is afgeleid uit ander bewijs.',
    ],
    inDeApp: 'Op Beweging, bij "Wat je spieren vasthoudt", staat per maaltijd of je erboven '
      + 'uitkwam. Ligt je dagdoel gedeeld door drie onder de drempel, dan zegt de app dat erbij.',
    bron: 'Onderzoek naar eiwitverdeling en lichaamssamenstelling (Frontiers in Nutrition, 2024); '
      + 'Weijs, Current Opinion in Clinical Nutrition and Metabolic Care, 2025; Wilkinson e.a., '
      + 'Physiological Reports, 2023, over de leucinedrempel.',
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
      'Voor krachttraining is het bewijs harder dan voor de rest. In een samenvatting van zes '
        + 'gelote onderzoeken hield krachttraining 93,5 procent tegen van het verlies aan '
        + 'vetvrije massa dat door de caloriebeperking kwam, zonder dat het vetverlies eronder '
        + 'leed. Het schema in alle zes was hetzelfde: drie keer per week, twaalf tot '
        + 'vierentwintig weken.',
      'En andersom: zonder beweging erbij verloor 81 procent van de onderzochte groepen meer dan '
        + 'een zesde van het gewichtsverlies als vetvrije massa, tegen 39 procent van de groepen '
        + 'die wél bewogen. Het gaat dus niet om hoe snel je afvalt alleen, maar om wat je '
        + 'ondertussen van je lichaam vraagt.',
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
    bron: 'Substudies van STEP-1 en SURMOUNT-1; casusreeksen over behoud van vetvrije massa '
      + '(2025); Sardeli e.a., Nutrients, 2018 (zes gelote onderzoeken); Weinheimer e.a., '
      + 'Nutrition Reviews, 2010.',
  },
  {
    id: 'slaap',
    titel: 'Slaap, en waar je gewichtsverlies vandaan komt',
    kort: 'Bij te weinig slaap verschuift het verlies van vet naar spier, bij precies hetzelfde eten.',
    weten: [
      'Slaap staat niet naast het afvallen maar erin. In een onderzoek volgden dezelfde mensen '
        + 'twee keer veertien dagen hetzelfde caloriearme dieet: één keer met 8,5 uur '
        + 'slaapgelegenheid per nacht, één keer met 5,5 uur. Ze verloren allebei de keren '
        + 'evenveel gewicht.',
      'Alleen kwam dat gewicht ergens anders vandaan. Bij de korte nachten daalde het aandeel '
        + 'vet in het verlies met 55 procent en steeg het verlies aan vetvrije massa met 60 '
        + 'procent. Dezelfde kilo’s op de weegschaal, een andere uitkomst in je lichaam. De '
        + 'deelnemers hadden bij de korte nachten ook meer honger.',
      'Snurken en slaapapneu zijn een apart verhaal, en daar wijst het bewijs de andere kant op '
        + 'dan vaak gedacht wordt. Afvallen helpt tegen apneu: bij ongeveer tien kilo '
        + 'gewichtsverlies daalde het aantal ademstops met bijna tien per uur. Andersom werkt '
        + 'het niet. Twee samenvattingen van onderzoek vinden dat mensen die met CPAP beginnen '
        + 'gemiddeld iets aankomen in plaats van af te vallen.',
      'Daaruit volgt een volgorde: behandel de apneu om de apneu, en het gewicht daarnaast. Niet '
        + 'het een in de verwachting dat het ander vanzelf meekomt.',
    ],
    nietWeten: [
      'Dat slaaponderzoek ging over tien mensen, in een laboratorium, veertien dagen per keer. '
        + 'Strak opgezet, en een heel kleine groep. Of thuis een uur langer slapen hetzelfde doet, '
        + 'is er niet mee aangetoond.',
      'Het was bovendien opgelegd slaaptekort. Of iemand die uit zichzelf kort slaapt dezelfde '
        + 'verschuiving laat zien, en of die terugdraait zodra hij meer gaat slapen, is niet '
        + 'onderzocht.',
    ],
    inDeApp: 'Op Gezondheid staat de STOP-BANG-vragenlijst voor slaapapneu, met wat de uitslag '
      + 'wel en niet betekent. Je slaapuren vul je in op Vandaag; ze staan naast je stappen op '
      + 'Beweging.',
    bron: 'Nedeltcheva e.a., Annals of Internal Medicine, 2010 (n=10); Foster e.a., Sleep AHEAD, '
      + 'Archives of Internal Medicine, 2009; meta-analyses over CPAP en gewicht (Thorax, 2015; '
      + 'Annals of the American Thoracic Society, 2021).',
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
      'Waaróm hetzelfde gewicht bij de een wel en bij de ander geen schade geeft, gaat over de '
        + 'opslag. Onderhuids vetweefsel kan meegroeien door nieuwe vetcellen aan te maken of door '
        + 'de bestaande te laten uitzetten. Die tweede weg loopt vast: uitgezette vetcellen komen '
        + 'zuurstof tekort, trekken ontstekingscellen aan, en zodra de opslag vol is stroomt het '
        + 'overschot door naar de buikholte, de lever, de spier en de alvleesklier. Daar geeft het '
        + 'wél insulineresistentie. Metabool gezonde obesitas is in dit beeld niets anders dan '
        + 'opslagcapaciteit die nog niet op is.',
      'Dat is geen theorie op papier. Bij paren met dezelfde BMI, dezelfde leeftijd, hetzelfde '
        + 'geslacht en dezelfde totale vetmassa, waarvan de een niets mankeerde en de ander '
        + 'diabetes, te hoge triglyceriden en hoge bloeddruk had, zat het verschil in twee dingen: '
        + 'vet in de buikholte op de MRI, en uitgezette vetcellen met ontstekingsmarkers in het '
        + 'weefsel zelf.',
      'Praktisch kun je daar één ding van meten zonder scanner: waar je omvang zit. De '
        + 'middelomtrek gedeeld door je lengte heeft één grens voor iedereen, 0,5, en is daarmee '
        + 'eerlijker dan een afkapwaarde in centimeters die voor elke lengte hetzelfde is.',
    ],
    nietWeten: [
      'Deze definitie is nieuw en nog niet overal overgenomen. De Nederlandse richtlijnen en de '
        + 'vergoedingsregels werken op dit moment nog met BMI-grenzen.',
      'Of het onderscheid tussen klinisch en preklinisch in de praktijk tot betere zorg leidt, '
        + 'moet zich nog bewijzen.',
    ],
    inDeApp: 'Op Gezondheid staan je middelomtrek en bloeddruk naast je BMI, met de grenzen die '
      + 'daarbij horen, en sinds kort ook je middel gedeeld door je lengte. Meer maten naast '
      + 'elkaar is precies waar deze definitie om vraagt.',
    bron: 'Lancet Diabetes & Endocrinology Commission, Definition and diagnostic criteria of '
      + 'clinical obesity, januari 2025.',
  },
  {
    id: 'heterogeen',
    titel: 'Waarom dezelfde behandeling bij de een wel werkt en bij de ander niet',
    kort: 'Obesitas is niet één ziekte. Bij elke behandeling bestaan superresponders en non-responders.',
    weten: [
      'Bij elke vorm van behandeling, van leefstijl tot medicatie tot chirurgie, zijn er mensen '
        + 'bij wie het uitzonderlijk goed werkt en mensen bij wie er vrijwel niets gebeurt. Voor '
        + 'de incretines wordt non-respons meestal gelegd bij minder dan 5 procent '
        + 'gewichtsverlies. In een overzicht dat in september 2026 op een nascholing werd '
        + 'gepresenteerd ging het om ongeveer 13 procent van de volwassenen op semaglutide, '
        + 'ongeveer 27 procent van de jongeren, minder dan 10 procent bij de hoogste dosering '
        + 'tirzepatide, en over alles samen 15 tot 20 procent.',
      'De verklaring die daarvoor gezocht wordt is dat er niet één obesitas is maar een handvol '
        + 'verschillende, met een verschillende motor eronder. In Leipzig werd bij ongeveer 1.500 '
        + 'mensen weefsel uit de buikholte en van onder de huid onderzocht, en liet men de computer '
        + 'zonder vooraf opgelegde indeling groepen zoeken. Er kwamen er vijf uit: een kleine '
        + 'groep die metabool niets mankeerde, een grote groep waar alles tegelijk misging, en drie '
        + 'die niemand had voorspeld. Bij één daarvan bleef het cortisol de hele dag hoog in plaats '
        + 'van te dalen; bij een andere was een te hoog nuchter insuline het eerste dat afweek.',
      'Van een andere kant benaderd komen er vier eetprofielen uit, gemeten met een ochtend vol '
        + 'testmaaltijden en scans. Een hongerig brein: pas na veel calorieën vol raken. Een '
        + 'hongerige darm: normaal vol na een normale portie, maar binnen een uur of twee weer '
        + 'honger omdat de maag snel leegt. Emotionele honger: eten bij spanning en verlangen, niet '
        + 'bij honger. En een trage verbranding: weinig spiermassa en een laag verbruik.',
      'Het aantrekkelijke van die indeling is dat er per profiel een andere behandeling bij hoort, '
        + 'en dat sommige gegevens die kant op wijzen. Hetzelfde kenmerk voorspelde bij twee '
        + 'middelen met een verschillend aangrijpingspunt de respons in tégengestelde richting. Dat '
        + 'is precies wat je van een mechanistische voorspeller verwacht en het is moeilijk toeval '
        + 'te noemen.',
    ],
    nietWeten: [
      'Bijna alles hierboven is samenhang en groepsindeling, geen bewezen oorzaak. De vijf '
        + 'weefselgroepen zijn nog niet gepubliceerd, en één ervan kon zelfs niet geduid worden. Of '
        + 'een te hoog nuchter insuline de motor is of het gevolg, is met die gegevens niet uit te '
        + 'maken; de onderzoeker noemt het zelf een hypothese.',
      'De trials achter de eetprofielen zijn klein, en de uitsplitsing naar profiel is meestal '
        + 'achteraf gedaan binnen een studie van enkele tientallen mensen. Dat is een aanwijzing '
        + 'waarop je een volgende studie bouwt, geen grond om nu een middel te kiezen.',
      'En dan de herkomst. Die nascholing werd betaald door een bedrijf dat een van de besproken '
        + 'middelen in de Benelux verkoopt, en alle drie de sprekers kwamen langs een eigen route '
        + 'bij dat middel uit. Dat maakt het niet onwaar. Het betekent dat je op herhaling door een '
        + 'groep zonder dat belang wacht voordat je het als vaststaand aanneemt.',
    ],
    inDeApp: 'Nergens, en dat is met opzet. Deze app kent jouw profiel niet en gaat er ook niet '
      + 'naar raden. Wat er wel staat is wat er werkelijk te meten valt: je middelomtrek en de '
      + 'verhouding met je lengte op Gezondheid, en je eigen trend op Inzicht.',
    bron: 'Nascholing over de behandeling van obesitas, september 2026, georganiseerd door Good '
      + 'Life Pharma, met M. Blüher (Universiteit Leipzig), R. Vangoitsenhoven (UZ Leuven) en '
      + 'A. Acosta (Mayo Clinic); Acosta e.a. over appetijtfenotypes.',
  },
  {
    id: 'foodnoise',
    titel: 'Food noise: waarom honger niet hetzelfde is als behoefte',
    kort: 'Er gaan twee systemen over eten, en het ene kan het andere overstemmen.',
    weten: [
      'Het eerste systeem houdt je energie in balans. Ghreline uit een lege maag meldt honger, '
        + 'leptine uit je vetweefsel meldt hoeveel voorraad er is, en in een kern onderin je '
        + 'hersenen sturen die twee een rem en een gaspedaal aan. Dat systeem past bij het beeld '
        + 'van calorieën erin en calorieën eruit.',
      'Het tweede gaat over beloning en loopt op dopamine. Dat het bestaat merk je met kerst: '
        + 'twee dagen achter elkaar vier gangen heeft niets met energiebehoefte te maken, en als '
        + 'niemand nog een hap kan komen de zelfgebakken koekjes en eten we door. Het tweede '
        + 'systeem kan het eerste overstemmen, en dat is de kern van wat food noise heet.',
      'Beloning werkt bovendien vooruit. Na een paar herhalingen verschuift de dopaminereactie van '
        + 'het eten zelf naar het signaal dat het aankondigt, en blijft de beloning dan uit, dan '
        + 'zakt dopamine juist onder de rustwaarde. Dat negatieve signaal is krachtig, en het is de '
        + 'reden dat "gewoon nee zeggen" iets anders is dan het lijkt.',
      'En je voorkeur is niet vast. In een onderzoek kregen mensen acht weken lang dagelijks een '
        + 'tussendoortje. Bij een vetarm tussendoortje bleef hun waardering van vetarm eten gelijk; '
        + 'bij een vet en zoet tussendoortje gingen ze vetarm eten mínder lekker vinden. De '
        + 'omgeving verandert dus niet alleen hoeveel je eet maar ook wat je lekker vindt.',
      'Dat het ook in calorieën doortelt, liet een onderzoek op een afdeling zien waar alles '
        + 'gewogen werd. Twintig mensen kregen in wisselende volgorde twee weken bewerkt en twee '
        + 'weken onbewerkt eten, gelijkgemaakt op aangeboden calorieën, energiedichtheid, '
        + 'macronutriënten, suiker, vezels en zout, en ze mochten eten wat ze wilden. Op het '
        + 'bewerkte eten aten ze ongeveer 508 kcal per dag meer, kwamen ze 0,9 kg aan, en op het '
        + 'onbewerkte vielen ze 0,9 kg af.',
    ],
    nietWeten: [
      'Waar je dit zou moeten meten, weet niemand. Een PET-scan is duur, en bij de gebruikte '
        + 'tracers meet hij hoeveel receptoren er vrij zijn en niet hoeveel dopamine er vrijkomt: '
        + 'een lager signaal kan betekenen dat er minder receptoren zijn óf dat er meer eigen '
        + 'dopamine op zit. Die dubbelzinnigheid verklaart een flink deel van de literatuur die '
        + 'elkaar tegenspreekt.',
      'In bloed of urine meten helpt niet. Het dopamine dat je daar vindt komt grotendeels uit de '
        + 'nieren en de darm, en dopamine komt de bloed-hersenbarrière niet over. Een perifere '
        + 'maat meet vrijwel zeker iets anders dan het systeem waar het om gaat.',
      'De beeldvormende studies bij mensen zijn oud en klein, en de twee onderzoeken hierboven '
        + 'gaan over twintig mensen gedurende vier weken en enkele tientallen gedurende acht. De '
        + 'richting is consistent, de grootte van het effect staat niet vast.',
    ],
    inDeApp: 'Op Vandaag leg je vast wát je at, niet waaróm. Deze app vraagt niet of je uit honger '
      + 'of uit spanning at: dat is een oordeel dat een scherm niet kan maken. Wat hij wel laat '
      + 'zien is de verdeling over de dag en wat er nog in past.',
    bron: 'Onderzoek naar dopamine bij inname (Cell Metabolism, 2019) en naar voorkeur na acht '
      + 'weken (Cell Metabolism, 2023); Hall e.a. over bewerkt voedsel (Cell Metabolism, 2019, '
      + 'n=20); nascholing september 2026.',
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
