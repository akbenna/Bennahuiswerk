/**
 * BASISUITLEG PER ONDERWERP
 *
 * Eén alinea per onderwerp, in gewone taal, met bij de meetkunde een tekening
 * erbij. Bedoeld voor het kind dat vastloopt en niet wil vragen. Mechanisch
 * overgenomen uit de oude pagina.
 */
import type { Illustratie } from './soorten'

export interface Uitlegstuk {
  ill?: Illustratie
  tekst: string
  /**
   * De uitgewerkte som uit haar eigen boek, stap voor stap, in de bewoording
   * van de methode. Staat gratis in de doos boven de som.
   *
   * Dit is er bijgekomen voor Wassima. Zij doet 2 havo over en is onzeker over
   * dit vak, en dan is een alinea uitleg te weinig: wat helpt is precies de
   * som zien die de docent op het bord deed, met dezelfde stappen eronder. Een
   * hint kost punten, dit niet. Opzoeken hoe het moet hoort geen straf te zijn.
   */
  voorbeeld?: string
}

export const UITLEG: Record<string, Uitlegstuk> = {
  'Oppervlakte & omtrek':{ill:{type:'rechthoek',l:8,b:5}, tekst:'De omtrek is het lint eromheen: tel alle zijden op. De oppervlakte is de ruimte erbinnen. Bij een rechthoek: omtrek = 2 × (lengte + breedte), oppervlakte = lengte × breedte. Let op: omtrek in cm, oppervlakte in cm².'},
  'Pythagoras':{ill:{type:'pyth',a:3,b:4,c:'?'}, tekst:'Dit gebruik je alleen bij een rechthoekige driehoek (met een hoek van 90°). De langste zijde, tegenover de rechte hoek, heet de schuine zijde. Er geldt: a² + b² = c², met c de schuine zijde.'},
  'Hoeken':{ill:{type:'hoeken',h:[50,70,'?']}, tekst:'De drie hoeken van een driehoek zijn samen altijd 180°. Bij een vierhoek samen 360°. Weet je er een paar, dan reken je de laatste uit door af te trekken.'},
  'Inhoud':{ill:{type:'balk',l:10,b:4,h:3}, tekst:'Inhoud is hoeveel er ín past. Bij een balk: lengte × breedte × hoogte. Bij een kubus zijn alle ribben even lang: z × z × z. Inhoud reken je in kubieke centimeters (cm³).'},
  'Procenten':{tekst:'Procent betekent “per honderd”. Wil je weten hoeveel procent iets is: deel ÷ geheel × 100. Bij korting reken je met een groeifactor: 20% korting betekent × 0,80.'},
  'Vergelijkingen':{tekst:'Een vergelijking is een weegschaal die in evenwicht is. Wat je links doet, doe je ook rechts. Zo houd je de balans en krijg je x in zijn eentje aan één kant.'},
  'Lineaire formules':{tekst:'Een rechte lijn schrijf je als y = a·x + b. De a vertelt hoe schuin de lijn loopt (hoeveel omhoog per stap naar rechts). De b is waar de lijn de verticale as kruist.'},
  'Snelheid':{tekst:'Snelheid is afstand gedeeld door tijd: v = s ÷ t. Tip: teken een driehoekje met s bovenaan en v en t eronder. Dek af wat je zoekt, dan zie je wat je moet doen.'},
  'Dichtheid':{tekst:'Dichtheid zegt hoe zwaar iets is voor zijn grootte: ρ = m ÷ V (massa gedeeld door volume). Is het lichter dan water (1 g/cm³), dan drijft het.'},
  'Kracht & zwaartekracht':{tekst:'Een kracht meet je in newton (N). De zwaartekracht trekt alles naar de aarde: Fz = m × g. In de onderbouw reken je met g = 10 N/kg. Werken twee even grote krachten tegen elkaar in, dan is de nettokracht 0 en is het voorwerp in evenwicht.'},
  'Veerkracht':{tekst:'Hoe verder je een veer uitrekt, hoe groter de kracht die hij terug geeft: Fveer = C × u. Hierin is C de veerconstante (N/m) en u de uitrekking (m).'},
  'Stroom & spanning':{tekst:'Spanning (U, in volt) is de "duw", stroom (I, in ampère) is hoeveel er stroomt en weerstand (R, in ohm) remt af. De wet van Ohm verbindt ze: U = I × R. Het vermogen is P = U × I.'},
  'Energie & vermogen':{tekst:'Energie meet je in joule (J), vermogen in watt (W). Vermogen is energie per seconde: P = E ÷ t. Andersom: E = P × t.'},
  'Geluid':{tekst:'Geluid gaat in lucht ongeveer 340 m/s. Afstand reken je met s = v × t. Bij een echo gaat het geluid heen én terug, dus deel de totale afstand door 2.'},
  'Druk':{tekst:'Druk is kracht verdeeld over een oppervlak: p = F ÷ A, in pascal (Pa = N/m²). Dezelfde kracht op een klein oppervlak geeft een grote druk (denk aan een scherpe punaise).'},
  'Tijd & eeuwen':{tekst:'Een eeuw is 100 jaar. Om de eeuw te vinden: neem de eerste twee cijfers van het jaartal en tel er 1 bij op. Voorbeeld: 1602 → 16 + 1 = de 17e eeuw. (De jaren 1601–1700 horen bij de 17e eeuw.)'},
  'Opstand tegen Spanje':{tekst:'In 1568 kwamen de Nederlanden in opstand tegen de Spaanse koning. Dit werd de Tachtigjarige Oorlog (1568–1648), met Willem van Oranje als leider. In 1648 (Vrede van Münster) werd de Republiek onafhankelijk.'},
  'Gouden Eeuw & Republiek':{tekst:'In de 17e eeuw (de Gouden Eeuw) was de Republiek der Zeven Verenigde Nederlanden rijk door handel. De VOC (1602) handelde in Azië, de WIC op Amerika en West-Afrika.'},
  'Handel & slavernij':{tekst:'Bij de driehoekshandel voeren schepen van Europa naar Afrika (ruilgoederen), van Afrika naar Amerika (tot slaaf gemaakte mensen) en van Amerika terug naar Europa (suiker, katoen). De WIC speelde hierin een grote rol.'},
  'Verlichting':{tekst:'De Verlichting (18e eeuw) was een stroming waarin denkers het verstand (de rede) centraal stelden. Ze vonden dat niet één koning alle macht moest hebben (geen absolute vorst) en pleitten voor vrijheid en gelijkheid.'},
  'Franse Revolutie':{tekst:'In 1789 kwam het Franse volk in opstand tegen de koning. Met de bestorming van de Bastille begon de Franse Revolutie. De leuze: vrijheid, gelijkheid, broederschap.'},
  // exacte fundament-onderwerpen voor Wassima (extra uitleg + beeld)
  'Rekenvolgorde':{tekst:'Volgorde van rekenen: 1) haakjes, 2) machten/wortels, 3) keer en delen, 4) plus en min (van links naar rechts). Ezelsbruggetje: "Meneer Van Dale Wacht Op Antwoord". Dus 3 + 4 × 2 = 3 + 8 = 11, niet 14.'},
  'Negatieve getallen':{ill:{type:'getallenlijn',van:-6,tot:6,punt:0}, tekst:'Gebruik de getallenlijn: plus = naar rechts, min = naar links. Twee keer hetzelfde teken (min × min of min ÷ min) geeft plus; verschillende tekens geven min.'},
  'Breuken':{ill:{type:'breukstrook',delen:4,gevuld:3}, tekst:'Een breuk is een deel van een geheel: bovenaan staat de teller (hoeveel delen), onderaan de noemer (in hoeveel delen verdeeld). "3/4 van een getal" = eerst ÷ 4 (één deel), dan × 3.'},
  /* Paragraaf 1.4. De tikregel gaat hier over de breuk: een gemengde breuk
     wordt bij het nakijken onleesbaar, dus die vragen we niet. */
  'Het omgekeerde van een getal':{tekst:'Twee getallen zijn elkaars omgekeerde als hun product 1 is. Bij een breuk draai je teller en noemer om: het omgekeerde van 3/4 is 4/3. Een heel getal schrijf je eerst als breuk: 5 = 5/1, dus het omgekeerde is 1/5. Het minteken blijft staan, en 0 heeft geen omgekeerde. Typ een breuk met een schuine streep: 3/4. Een onechte breuk laat je staan, dus 3/2 en niet 1 1/2.', voorbeeld:'5/7 · 7/5 = 35/35 = 1\ndaarom heten 5/7 en 7/5 elkaars omgekeerde\n\nhet omgekeerde van 3\n= het omgekeerde van 3/1\n= 1/3\n\nhet omgekeerde van −2 1/3\n= het omgekeerde van −7/3\n= −3/7'},
  'Delen door een breuk':{tekst:'Delen door een breuk is vermenigvuldigen met het omgekeerde ervan: 6 : 1/2 = 6 · 2 = 12. Draai dus de tweede breuk om en maak er keer van. Een heel getal schrijf je als breuk (3 = 3/1) en een gemengde breuk maak je eerst onecht (2 1/2 = 5/2). Kijk aan het eind of je nog kunt vereenvoudigen. Typ een breuk met een schuine streep: 3/4. Een onechte breuk laat je staan, dus 3/2 en niet 1 1/2.', voorbeeld:'3/5 : 7/11\n= 3/5 · 11/7\n= 33/35\n\n3/8 : 6\n= 3/8 · 1/6\n= 3/48 = 1/16\n\n4 : −2/3\n= 4/1 · −3/2\n= −12/2 = −6\n\n2 1/2 : 1 2/3\n= 5/2 : 5/3\n= 5/2 · 3/5\n= 15/10 = 3/2'},
  'Breuken met letters':{tekst:'Ook met letters geldt: breuk keer breuk is teller keer teller gedeeld door noemer keer noemer, en delen is keer het omgekeerde. Dus 3/7 · x/y = 3x/7y en 5/a : 3/b = 5/a · b/3 = 5b/3a. Kijk daarna of teller en noemer door hetzelfde getal kunnen: 3q/9p wordt q/3p. Typ een breuk met een schuine streep: 3/4. Een onechte breuk laat je staan, dus 3/2 en niet 1 1/2.', voorbeeld:'a/6b · 3/c\n= 3a/6bc\n= a/2bc\n\n5/a · b\n= 5/a · b/1\n= 5b/a\n\n3/p : 9/q\n= 3/p · q/9\n= 3q/9p\n= q/3p'},
  /* Paragraaf 1.5 van haar boek, vijf regels, vijf onderwerpen. De tikregel
     staat er telkens bij: op het scherm staat a⁵, maar dat typt niemand in. */
  'Machten vermenigvuldigen':{tekst:'Hebben twee machten hetzelfde grondtal, dan tel je bij vermenigvuldigen de exponenten op: a³ · a² = a⁵. Het grondtal blijft staan. Staan er getallen voor, dan gaan die gewoon keer elkaar: 3a⁵ · 4a³ = 12a⁸. Verschillen de grondtallen, dan mag je niets optellen: 2a³ · 5b⁴ = 10a³b⁴. Typ een macht als a5; een dakje mag ook (a^5).', voorbeeld:'2x³ · 4x² = 8x⁵\nwant 2 · 4 = 8 en 3 + 2 = 5\n\n2a⁶ · −3a = −6a⁷\nwant a is a¹, dus 6 + 1 = 7\n\n−9p⁵ · −7p³ · −p⁸ = −63p¹⁶\nwant −9 · −7 · −1 = −63 en 5 + 3 + 8 = 16\n\n7r³ · −q² = −7q²r³\nwant de grondtallen zijn niet hetzelfde'},
  'Gelijksoortige termen':{tekst:'Twee termen zijn gelijksoortig als ze dezelfde letter met dezelfde exponent hebben. Alleen die mag je samennemen: 2a³ + 4a³ = 6a³. Bij 2a⁵ + 3a⁶ lukt dat niet, want de exponenten verschillen. Let op het verschil met keer: a⁵ + a⁵ = 2a⁵, maar a⁵ · a⁵ = a¹⁰. Typ een macht als a5; een dakje mag ook (a^5).', voorbeeld:'4p⁶ + 3p⁶ = 7p⁶\n9a⁵ − 3a⁵ = 6a⁵\n3a²b + a²b = 4a²b\n5x²y³ − 6x²y³ = −x²y³\n\n2a⁵ + 3a⁶ kan niet\n2a³b + 4ab² kan niet\nde termen zijn niet gelijksoortig\n\nlet op het verschil:\na⁵ + a⁵ = 2a⁵\na⁵ · a⁵ = a¹⁰'},
  'Macht van een macht':{tekst:'Staat er een macht van een macht, dan vermenigvuldig je de exponenten: (a²)³ = a⁶, want 2 × 3 = 6. Niet optellen. Een getal vóór de haakjes doet niet mee in de macht: 5(a³)⁶ = 5a¹⁸. Typ een macht als a5; een dakje mag ook (a^5).', voorbeeld:'(a⁵)³ · 2a⁶\n= a¹⁵ · 2a⁶\n= 2a²¹\n\n5(a³)⁶ − 6(a⁹)²\n= 5a¹⁸ − 6a¹⁸\n= −a¹⁸\n\n(a²)³ · 2a · a⁴\n= a⁶ · 2a · a⁴\n= 2a¹¹'},
  'Macht van een product':{tekst:'Bij een macht van een product krijgt elke factor die macht: (ab)⁵ = a⁵b⁵ en (5x)³ = 125x³. Het getal gaat dus mee. Een minteken binnen de haakjes gaat ook mee: (−3p)³ = −27p³, maar (−2q)⁴ = 16q⁴, want een even exponent maakt er een plus van. Staat het minteken buiten de haakjes, dan blijft het buiten. Typ een macht als a5; een dakje mag ook (a^5).', voorbeeld:'(pq)³ = p³q³\n\n(−4p)³\n= (−4)³ · p³\n= −64p³\n\n(a³b²)⁵\n= (a³)⁵ · (b²)⁵\n= a¹⁵b¹⁰'},
  'Machten delen':{tekst:'Bij delen trek je de exponenten van elkaar af: a¹² ÷ a⁷ = a⁵. De getallen deel je gewoon: 12a¹⁰ ÷ 4a² = 3a⁸. Boven en onder hetzelfde geeft 1, en daarom is a⁰ = 1. Typ een macht als a5; een dakje mag ook (a^5).', voorbeeld:'a¹²/a⁷ = a⁵\np⁵/p = p⁴\nx⁸/x⁸ = 1\n\n12a¹⁰/4a²\n= 12/4 · a¹⁰/a²\n= 3a⁸\n\n6a⁵/2a² = 3a³\n\nen a⁵/a⁵ = a⁰ = 1'},
  'Machten & wortels':{tekst:'Een macht is herhaald vermenigvuldigen: 5² = 5 × 5 = 25 en 2³ = 2 × 2 × 2 = 8. De wortel is het omgekeerde: √49 = 7, want 7 × 7 = 49.'},
  'Verhoudingen & schaal':{tekst:'Bij een verhouding gaat alles met dezelfde factor mee: 2× zoveel appels → 2× de prijs. Een verhoudingstabel helpt. Schaal 1 : 100 000 betekent: 1 cm op de kaart is 100 000 cm (= 1 km) in het echt.'},
  'Statistiek':{tekst:'Gemiddelde = som ÷ aantal. Mediaan = het middelste getal (eerst op volgorde zetten). Modus = het getal dat het vaakst voorkomt.'},
  'Haakjes & herleiden':{tekst:'Herleiden = korter schrijven. Gelijke termen tel je op: 2x + 3x = 5x. Haakjes wegwerken: vermenigvuldig het getal vóór de haakjes met álles erbinnen: 3(x + 2) = 3x + 6.'},
  'Grootheden & eenheden':{tekst:'Reken in de natuurkunde altijd eerst om naar standaardeenheden. Onthoud: 1 km = 1000 m · 1 m = 100 cm · 1 kg = 1000 g · 1 minuut = 60 s · 1 uur = 3600 s. De meeste fouten zitten in de eenheden, niet in de formule.'},
  'Temperatuur & warmte':{tekst:'Temperatuur meet je in graden Celsius (°C) met een thermometer. Water bevriest bij 0 °C en kookt bij 100 °C. Warmte stroomt altijd van warm naar koud.'},
  'Licht':{tekst:'Licht beweegt in rechte lijnen. Op een glad oppervlak (spiegel) kaatst het netjes terug: dat heet weerkaatsing of reflectie. Daardoor kun je jezelf in de spiegel zien.'},
  'Magnetisme':{tekst:'Een magneet heeft een noordpool en een zuidpool. Gelijke polen (noord-noord of zuid-zuid) stoten elkaar af; ongelijke polen (noord-zuid) trekken elkaar aan.'},
  'Elektrische schakelingen':{tekst:'Stroom loopt alleen door een gesloten (dichte) kring. In een serieschakeling is er één pad: gaat één lampje stuk, dan gaat alles uit. In een parallelschakeling blijven de andere branden.'},
  'Beweging (afstand-tijd)':{tekst:'Snelheid = afstand ÷ tijd. Let op de eenheid: km in een uur geeft km/u, meter in een seconde geeft m/s. Afstand = snelheid × tijd; tijd = afstand ÷ snelheid.'},
  // Amaani · bovenbouw
  'Kwadratische functies':{tekst:'Een kwadratische functie f(x) = ax² + bx + c geeft een parabool. Is a > 0 dan opent hij naar boven (dal), is a < 0 dan naar beneden (berg). De top ligt precies midden tussen de twee nulpunten. Functiewaarde berekenen = x invullen.'},
  'Vergelijkingen oplossen':{tekst:'Werk stap voor stap naar x toe (doe links en rechts hetzelfde). Bij x² = a → worteltrekken. Bij een product = 0 is elke factor afzonderlijk 0. De discriminant D = b² − 4ac vertelt hoeveel oplossingen er zijn (D>0: twee, D=0: één, D<0: geen).'},
  'Procentuele groei':{tekst:'Groeifactor = 1 + p/100 (toename) of 1 − p/100 (afname). Per n perioden: vermenigvuldig met de groeifactor tot de macht n. Andersom: de factor per halve periode is de wortel uit de factor per hele periode.'},
  'Logaritmen':{tekst:'De logaritme is de omgekeerde van een macht. log(x) (grondtal 10) beantwoordt: "10 tot welke macht is x?". Dus log(1000) = 3 want 10³ = 1000, en 10^x = 1000 geeft x = 3.'},
  'Krachten & evenwicht':{tekst:'Krachten in dezelfde richting tel je op, in tegengestelde richting trek je af. De resultante (nettokracht) is hun som met richting. Is de resultante 0, dan is er evenwicht. Veerkracht: F = C × u.'},
  'Golven & trillingen':{tekst:'Frequentie f (in hertz) is het aantal trillingen per seconde; trillingstijd T is de duur van één trilling: T = 1/f en f = 1/T. Voor een golf geldt v = f × λ (golfsnelheid = frequentie × golflengte).'},
  'Radioactiviteit':{tekst:'Na elke halveringstijd is nog de helft van de radioactieve stof over. Na n halveringstijden is dus (½)ⁿ over. Reken in stappen: elke halveringstijd × ½.'},
  // Amine (groep 7/8)
  'Tafels & keer':{tekst:'Ken de tafels van 1 t/m 12 uit je hoofd: dat scheelt enorm bij grote sommen. Tip: 12 × 6 = 10 × 6 + 2 × 6 = 60 + 12 = 72.'},
  'Meten & maten':{tekst:'Onthoud de "trappetjes": 1 km = 1000 m · 1 m = 100 cm · 1 cm = 10 mm · 1 kg = 1000 g · 1 liter = 1000 ml. Naar een kleinere eenheid → keer; naar een grotere → delen.'},
  'Tijd & klok':{tekst:'1 uur = 60 minuten. Reken duur uit door eerst hele uren te tellen en dan de losse minuten. Een half uur = 30 minuten = 0,5 uur.'},
  'Kommagetallen':{tekst:'Zet bij + en − de komma netjes onder elkaar. Bij × 10 gaat de komma één plaats naar rechts, bij × 100 twee plaatsen. Bij ÷ 10 juist naar links.'},
  'Zinsontleden':{tekst:'De persoonsvorm vind je door de zin in een andere tijd te zetten: het werkwoord dat verandert, is de persoonsvorm. Het onderwerp vind je met de vraag "wie of wat + persoonsvorm?".'},
  'Signaalwoorden':{tekst:'Signaalwoorden verraden het verband in een tekst: "omdat/want" = reden, "maar/echter" = tegenstelling, "daardoor/dus" = gevolg, "eerst/daarna" = volgorde.'},
  'Alfabetiseren':{tekst:'In een woordenboek staan woorden op alfabet. Begint het met dezelfde letter? Kijk dan naar de tweede letter, dan de derde, enzovoort.'},
  'Verhoudingen':{tekst:'Bij een verhouding gaat alles met dezelfde factor mee. Maak een verhoudingstabel: weet je dat 2 stuks € 3 kosten, dan kosten 4 stuks (×2) € 6. Bij "2 : 3" reken je eerst uit hoeveel één "deel" is.'},
  'Afronden & schatten':{tekst:'Afronden: kijk naar het cijfer rechts van de plek waar je afrondt. Is dat 5 of meer → naar boven, anders naar beneden. Schatten doe je door eerst af te ronden en dan makkelijk te rekenen.'},
  // Scheikunde (Amaani)
  'Atoombouw':{tekst:'Een atoom heeft een kern met protonen (+) en neutronen (neutraal); daaromheen bewegen elektronen (−). Het atoomnummer = het aantal protonen, en dat bepaalt welk element het is.'},
  'Symbolen & atomen':{tekst:'Elk element heeft een symbool van één of twee letters (de eerste is een hoofdletter): waterstof H, zuurstof O, koolstof C, natrium Na, ijzer Fe. Je vindt ze in het periodiek systeem.'},
  'Moleculen':{tekst:'Een molecuulformule vertelt welke en hoeveel atomen er in zitten. Het kleine getal (index) hoort bij het atoom ervóór: H₂O = 2 waterstof + 1 zuurstof = 3 atomen.'},
  'Reactievergelijkingen':{tekst:'In een reactie blijven atomen behouden: links en rechts evenveel van elke soort. De grote getallen vóór een stof (coëfficiënten) zorgen voor die balans, bijv. 2 H₂ + O₂ → 2 H₂O.'},
  'Zuur & base':{tekst:'De pH-schaal loopt van 0 tot 14. pH 7 is neutraal (zuiver water), lager dan 7 is zuur, hoger dan 7 is basisch.'},
  'Rekenen (mol)':{tekst:'1 mol = 6,02 × 10²³ deeltjes (getal van Avogadro). Massa = aantal mol × molaire massa (g/mol), en aantal mol = massa ÷ molaire massa.'},
  /* ---- Leerkaarten voor de curriculum-aansluiting (juli 2026) ---- */
  // Selma & Amine · rekenen
  'Getallen tot 100.000':{tekst:'Kijk naar de plaats van elk cijfer: eenheden, tientallen, honderdtallen, duizendtallen, tienduizendtallen. Zo lees en schrijf je grote getallen. Afronden op duizendtallen? Kijk naar het honderdtal: 5 of meer → naar boven, anders naar beneden.'},
  'Delen met rest':{tekst:'Soms past de deler niet precies. Zoek het grootste product dat er nog ín past; wat overblijft is de rest. 17 ÷ 5: 5 × 3 = 15 past, en 17 − 15 = 2, dus rest 2.'},
  'Vermenigvuldigen (groter)':{tekst:'Splits het grote getal: 12 × 8 = (10 × 8) + (2 × 8) = 80 + 16 = 96. Bij ronde tientallen los je het op via de tafel: 6 × 40 = 6 × 4 × 10 = 240.'},
  'Oppervlakte (hokjes)':{tekst:'Oppervlakte is hoeveel vierkante hokjes erin passen. Bij een rechthoek: lengte × breedte. 5 hokjes lang en 3 breed → 5 × 3 = 15 hokjes.'},
  'Verhoudingstabel':{tekst:'In een verhoudingstabel gaat alles met dezelfde factor mee. Weet je dat 2 stuks € 1 kosten, dan kosten 6 stuks (× 3) → € 3. Zoek eerst de factor tussen de kolommen.'},
  'Tabellen & grafieken':{tekst:'Lees eerst af wat er op de assen of in de kolommen staat. Bij een staafdiagram is de hoogte van de staaf de waarde. Optellen, vergelijken of het grootste zoeken doe je daarna.'},
  'Meten & meetkunde':{tekst:'Reken met de juiste eenheid: 1 m = 100 cm, 1 kg = 1000 g. Oppervlakte = lengte × breedte (in cm²), omtrek = alle zijden samen (in cm).'},
  'Verbanden':{tekst:'Een verband laat zien hoe twee dingen samenhangen: in een tabel, grafiek of formule. Het gemiddelde reken je uit met som ÷ aantal.'},
  // Selma & Amine · taal
  'Werkwoordspelling':{tekst:"Tegenwoordige tijd: ik = de stam (zonder t); hij/zij/het = stam + t. Verleden tijd en voltooid deelwoord: eindigt de stam op een letter uit 't kofschip (t, k, f, s, ch, p)? Dan +te / +t, anders +de / +d."},
  'Niet-werkwoordspelling':{tekst:'Luister goed: lange ij (fiets) of korte ei (eiland)? au (auto) of ou (koud)? Twijfel je over d of t aan het eind, verleng het woord: koud → koude, dus met een d.'},
  'Leestekens & hoofdletters':{tekst:'Een zin begint met een hoofdletter en eindigt met . ? of !. Namen van personen, landen en steden krijgen een hoofdletter; dagen en maanden niet. De dubbele punt (:) staat vóór een opsomming of uitleg.'},
  'Hoofdletters & leestekens':{tekst:'Een zin begint met een hoofdletter en eindigt met . ? of !. Namen van personen, landen en steden krijgen een hoofdletter; dagen en maanden niet.'},
  'Samenstellingen':{tekst:'Een samenstelling is één woord van twee woorden: voetbal + veld = voetbalveld. Soms komt er een tussen-n of tussen-s bij, zoals pannenkoek en stationsplein.'},
  'Verkleinwoorden':{tekst:'Een verkleinwoord maak je met -je, -tje, -pje of -etje: boom → boompje, stoel → stoeltje, bloem → bloemetje.'},
  'Open en gesloten lettergreep':{tekst:'Lange klank in een open lettergreep: één klinker (bomen). Korte klank: verdubbel de medeklinker (ballen). Zo blijft de klank goed bij het meervoud.'},
  'au/ou':{tekst:'Dezelfde klank, twee spellingen. Veel woorden ken je uit je hoofd: kou, koud, hout, vrouw (ou) tegenover auto, blauw, dauw (au).'},
  'ei/ij':{tekst:'De korte ei (eiland) en de lange ij (fiets) klinken hetzelfde. Woorden leer je uit je hoofd: trein, klein (ei) tegenover wijn, fijn (ij).'},
  // Amine · lezen & studievaardigheden
  'Woordenschat':{tekst:'Snap je een woord niet? Kijk naar de zin eromheen (de context) voor een hint, let op bekende delen (mono = één), en bedenk een synoniem dat je wél kent.'},
  'Samenvatten':{tekst:'Zoek per alinea de kernzin: de zin met de hoofdgedachte. Laat voorbeelden en details weg. Een goede samenvatting bevat alleen de hoofdzaken, in je eigen woorden.'},
  'Feit of mening':{tekst:'Een feit kun je controleren of bewijzen (Parijs ligt in Frankrijk). Een mening is wat iemand vindt (Parijs is de mooiste stad) en verschilt per persoon.'},
  'Verwijswoorden':{tekst:'Woorden als hij, die, dat en deze verwijzen naar iets dat eerder genoemd is. Vraag je af: naar wie of wat verwijst dit woord? Vul het even in om te controleren.'},
  'Interpreteren':{tekst:'Soms staat het antwoord niet letterlijk in de tekst; je leidt het af. Let op signalen (een rood hoofd → schaamte) en lees tussen de regels door.'},
  'Volgorde':{tekst:'Een verhaal heeft een begin, een midden en een einde. Signaalwoorden als eerst, daarna en ten slotte helpen je de juiste volgorde te vinden.'},
  'Opzoeken':{tekst:'Zoek slim: de inhoudsopgave (voorin) geeft de hoofdstukken, het register (achterin) geeft op alfabet de bladzijde van een onderwerp, en het woordenboek geeft de betekenis.'},
  // Wassima · wiskunde/natuurkunde verdieping
  'Kwadratische verbanden':{tekst:'Bij y = x² hoort een parabool. Functiewaarde berekenen: vul x in en werk de macht eerst uit. y = x² − 3 bij x = 5 → 25 − 3 = 22.'},
  'Machten':{tekst:'Een macht is herhaald vermenigvuldigen: 2⁴ = 2 × 2 × 2 × 2 = 16 en 3³ = 27. De exponent (het kleine getal) zegt hoe vaak.'},
  'Stelsels':{tekst:'Bij een stelsel horen twee vergelijkingen die tegelijk kloppen. Weet je één waarde, vul die in de andere in: x + y = 10 met x = 6 → y = 4.'},
  // Amaani · wiskunde A / scheikunde / natuurkunde
  'Kansrekening':{tekst:'Kans = gunstige uitkomsten ÷ alle uitkomsten. Twee dingen ná elkaar (en-regel): kansen vermenigvuldigen. Twee keer kop: 1/2 × 1/2 = 1/4.'},
  'Tellen (combinatoriek)':{tekst:'Op hoeveel manieren? Voor een rij van n verschillende dingen: n! (3! = 3 × 2 × 1 = 6). Kies je een groepje waarbij de volgorde niet telt, gebruik dan combinaties C(n,k).'},
  'Exponentiële groei':{tekst:'Bij vaste procentuele groei vermenigvuldig je elke periode met de groeifactor: +10% → × 1,1; −20% → × 0,8. Over meerdere jaren: de factor tot de macht van het aantal jaren.'},
  'Procenten & groeifactor':{tekst:'Groeifactor = 1 + p/100 bij toename, 1 − p/100 bij afname. Handig om ineens mee te rekenen: 15% erbij = × 1,15; 20% eraf = × 0,80.'},
  'Molverhoudingen':{tekst:'De coëfficiënten in de reactievergelijking geven de molverhouding. 2 H₂ + O₂ → 2 H₂O betekent H₂ : O₂ : H₂O = 2 : 1 : 2. Reken daarmee om tussen de stoffen.'},
  'Molmassa':{tekst:"De molaire massa (g/mol) tel je op uit de atoommassa's. O₂ = 2 × 16 = 32 g/mol. Massa = aantal mol × molaire massa."},
  'Concentratie':{tekst:'Concentratie = aantal mol ÷ volume (mol/L). 0,5 mol in 2 L → 0,5 ÷ 2 = 0,25 mol/L. Meer stof of minder water geeft een hogere concentratie.'},
  'Zuren en basen':{tekst:'De pH-schaal loopt van 0 tot 14. Onder 7 is zuur, precies 7 is neutraal, boven 7 is basisch. Hoe verder van 7, hoe sterker.'},
  'Rekenen aan reacties':{tekst:'Gebruik de molverhouding uit de kloppende reactievergelijking. 2 H₂ + O₂ → 2 H₂O: voor 8 mol H₂ heb je 8 × ½ = 4 mol O₂ nodig.'},
  'Kracht & versnelling':{tekst:'De tweede wet van Newton: F = m × a (kracht in N, massa in kg, versnelling in m/s²). Zoek je a, dan a = F ÷ m.'},
  'Zwaartekracht':{tekst:'De zwaartekracht trekt alles naar de aarde: Fz = m × g. In de bovenbouw reken je vaak met g = 9,81 N/kg; in de onderbouw met g = 10 N/kg.'},
  'Arbeid & energie':{tekst:'Arbeid W = F × s (kracht × verplaatsing), in joule (J). Vermogen is arbeid per seconde: P = W ÷ t.'},
  'Elektriciteit':{tekst:'Wet van Ohm: U = I × R (spanning in V, stroom in A, weerstand in Ω). Vermogen: P = U × I (in watt).'},
  // Zaakvakken
  'Cel':{tekst:'De cel is de bouwsteen van het leven. In de celkern ligt het DNA (de erfelijke informatie). Daaromheen zit het cytoplasma, omsloten door het celmembraan.'},
  'Vertering':{tekst:'De vertering begint in de mond (kauwen + speeksel), gaat via de slokdarm naar de maag en dan de dunne darm, waar voedingsstoffen in het bloed worden opgenomen.'},
  'Klimaat':{tekst:'Het klimaat is het gemiddelde weer over lange tijd. Bij de evenaar (0° breedte) is het warm; naar de polen toe wordt het kouder. Zo ontstaan klimaatzones.'},
  'Fotosynthese':{tekst:'Planten maken met licht hun eigen voedsel: ze nemen koolstofdioxide (CO₂) en water op en maken glucose, waarbij zuurstof (O₂) vrijkomt.'},
  'Inflatie':{tekst:'Inflatie is een algehele stijging van het prijspeil: met hetzelfde geld kun je minder kopen. Een beetje inflatie is normaal; veel inflatie maakt sparen minder waard.'},
  'Industriële revolutie':{tekst:'Vanaf het einde van de 18e eeuw begon in Engeland de Industriële Revolutie: machines (de stoommachine) en fabrieken veranderden werk, steden en samenleving ingrijpend.'},
  'Wereldoorlogen':{tekst:'De Eerste Wereldoorlog duurde van 1914 tot 1918, de Tweede van 1939 tot 1945. Nederland was in WOI neutraal, maar in WOII bezet (1940–1945).'},
  'Sparen & rente':{tekst:'Rente is de vergoeding voor sparen of lenen, in procenten per jaar. 2% over € 100 = € 2 per jaar. Bij samengestelde rente krijg je rente over rente.'},
  // Talen
  'Tenses':{tekst:'Present simple voor gewoontes: bij he/she/it komt er -s bij (he goes). Present continuous voor iets dat nu bezig is: to be + werkwoord+ing (he is going).'},
  'Naamvallen':{tekst:'In het Duits verandert het lidwoord met de naamval. Nominatief (onderwerp): der (m.), die (v.), das (o.). In de accusatief wordt der → den.'},
  'Werkwoorden':{tekst:'Leer de kernwerkwoorden uit je hoofd. Frans être (zijn): je suis, tu es, il est. Duits sein: ich bin, du bist, er ist.'},
};
