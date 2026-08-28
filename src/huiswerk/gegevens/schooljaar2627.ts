/**
 * DE AANVULLING VOOR SCHOOLJAAR 2026/27
 *
 * Nieuwe oefenstof op het niveau waar de kinderen NU zitten. Los van `seed.ts`,
 * en dat is met opzet: die lijst is het verslag van de overzetting uit de oude
 * pagina en staat onder een vingerafdruk in de gouden waarden. Zou nieuwe stof
 * daar tussen komen, dan moest dat bewijs elk jaar opnieuw weggegooid worden om
 * de app kloppend te krijgen — en dan bewijst het niets meer.
 *
 * Eigen id-reeks (`nw26_*`), dus geen enkele `seed_*` verschuift en geen
 * Leitner-kaart raakt los van zijn geschiedenis.
 *
 * Waar deze opgaven op mikken staat in `CURRICULUM-aansluiting.md`: bij Amine de
 * vier onderdelen waar zijn rapport zwak op stond (werkwoordspelling,
 * woordenschat, opzoeken) plus de rekendomeinen van de doorstroomtoets; bij
 * Amaani de gaten in wiskunde A (verwachtingswaarde, combinatoriek,
 * groeifactoren), molrekenen en samengestelde natuurkunde.
 *
 * Wassima staat er niet bij. Zij doet 2 havo over en heeft voor dat jaar al
 * ruim driehonderd opgaven; nieuwe 3-havo-stof zou haar juist een jaar te ver
 * vooruit zetten.
 *
 * Elk rekenkundig antwoord hieronder is nagerekend voordat het hier terechtkwam,
 * en `schooljaar.proef.ts` rekent ze bij elke proefdraai opnieuw na.
 */
import type { Opgave } from './soorten'

const RUW: Omit<Opgave, 'id'>[] = [
  {p:'amine',v:'taal',t:'Voltooid deelwoord',lvl:1,q:'Vul in: hij heeft gisteren hard ... (werken)',a:'gewerkt',h:['Kijk naar de laatste letter van de stam.','Zit die in ’t kofschip? Dan een t.'],s:'De stam van "werken" eindigt op een letter die je toetst aan ’t kofschip.\nk zit in ’t kofschip → t.\nDus: gewerkt.'},
  {p:'amine',v:'taal',t:'Voltooid deelwoord',lvl:1,q:'Vul in: ik had er zo op ... (hopen)',a:'gehoopt',h:['Kijk naar de laatste letter van de stam.','Zit die in ’t kofschip? Dan een t.'],s:'De stam van "hopen" eindigt op een letter die je toetst aan ’t kofschip.\np zit in ’t kofschip → t.\nDus: gehoopt.'},
  {p:'amine',v:'taal',t:'Voltooid deelwoord',lvl:1,q:'Vul in: de hond heeft de hele nacht ... (blaffen)',a:'geblaft',h:['Kijk naar de laatste letter van de stam.','Zit die in ’t kofschip? Dan een t.'],s:'De stam van "blaffen" eindigt op een letter die je toetst aan ’t kofschip.\nf zit in ’t kofschip → t.\nDus: geblaft.'},
  {p:'amine',v:'taal',t:'Voltooid deelwoord',lvl:1,q:'Vul in: ik heb vanochtend de bus ... (missen)',a:'gemist',h:['Kijk naar de laatste letter van de stam.','Zit die in ’t kofschip? Dan een t.'],s:'De stam van "missen" eindigt op een letter die je toetst aan ’t kofschip.\ns zit in ’t kofschip → t.\nDus: gemist.'},
  {p:'amine',v:'taal',t:'Voltooid deelwoord',lvl:1,q:'Vul in: zij heeft alle woordjes ... (leren)',a:'geleerd',h:['Kijk naar de laatste letter van de stam.','Zit die in ’t kofschip? Dan een t.'],s:'De stam van "leren" eindigt op een letter die je toetst aan ’t kofschip.\nr zit niet in ’t kofschip → d.\nDus: geleerd.'},
  {p:'amine',v:'taal',t:'Voltooid deelwoord',lvl:1,q:'Vul in: ze hebben hier een nieuwe school ... (bouwen)',a:'gebouwd',h:['Kijk naar de laatste letter van de stam.','Zit die in ’t kofschip? Dan een t.'],s:'De stam van "bouwen" eindigt op een letter die je toetst aan ’t kofschip.\nw zit niet in ’t kofschip → d.\nDus: gebouwd.'},
  {p:'amine',v:'taal',t:'Voltooid deelwoord',lvl:3,q:'Vul in: we zijn vorige maand ... (verhuizen)',a:'verhuisd',h:['Je hóórt een s, maar kijk naar de infinitief.','De stam is "verhuiz", met een z.'],s:'Je hoort "verhuist", maar de stam van verhuizen is verhuiz-.\nDe z zit niet in ’t kofschip, dus een d: verhuisd.\nDe z wordt aan het eind wel als s geschreven.'},
  {p:'amine',v:'taal',t:'Voltooid deelwoord',lvl:3,q:'Vul in: hij heeft het mij ... (beloven)',a:'beloofd',h:['Je hoort een f, maar de stam heeft een v.'],s:'De stam van beloven is beloov-.\nDe v zit niet in ’t kofschip, dus een d: beloofd.'},
  {p:'amine',v:'taal',t:'Werkwoordspelling',lvl:3,q:'Hij ... elke dag groter. (worden)',a:'wordt',h:['Zoek eerst het onderwerp.','Staat het onderwerp vóór of achter het werkwoord?'],s:'stam word + t = wordt.\nDus: wordt.'},
  {p:'amine',v:'taal',t:'Werkwoordspelling',lvl:3,q:'Ik ... elke dag groter. (worden)',a:'word',h:['Zoek eerst het onderwerp.','Staat het onderwerp vóór of achter het werkwoord?'],s:'bij ik nooit een t: word.\nDus: word.'},
  {p:'amine',v:'taal',t:'Werkwoordspelling',lvl:3,q:'... jij morgen twaalf? (worden)',a:'word',h:['Zoek eerst het onderwerp.','Staat het onderwerp vóór of achter het werkwoord?'],s:'het onderwerp staat achter het werkwoord, dan valt de t weg.\nDus: word.'},
  {p:'amine',v:'taal',t:'Werkwoordspelling',lvl:3,q:'Jij ... morgen twaalf. (worden)',a:'wordt',h:['Zoek eerst het onderwerp.','Staat het onderwerp vóór of achter het werkwoord?'],s:'jij vóór het werkwoord: stam + t.\nDus: wordt.'},
  {p:'amine',v:'taal',t:'Werkwoordspelling',lvl:3,q:'Hij ... altijd netjes. (antwoorden)',a:'antwoordt',h:['Zoek eerst het onderwerp.','Staat het onderwerp vóór of achter het werkwoord?'],s:'stam antwoord + t.\nDus: antwoordt.'},
  {p:'amine',v:'taal',t:'Woordenschat in context',lvl:2,q:'"De uitleg was beknopt." Wat betekent beknopt?',a:'kort en to the point',opties:['kort en to the point','erg ingewikkeld','helemaal fout'],h:['Lees de zin nog eens en let op wat er gebeurt.'],s:'Beknopt betekent: in weinig woorden gezegd.'},
  {p:'amine',v:'taal',t:'Woordenschat in context',lvl:2,q:'"Hij deed het schoorvoetend." Wat betekent schoorvoetend?',a:'met tegenzin',opties:['met tegenzin','heel snel','met veel plezier'],h:['Lees de zin nog eens en let op wat er gebeurt.'],s:'Schoorvoetend betekent aarzelend, met tegenzin.'},
  {p:'amine',v:'taal',t:'Woordenschat in context',lvl:2,q:'"Zijn verhaal was aannemelijk." Wat betekent aannemelijk?',a:'geloofwaardig',opties:['geloofwaardig','onbegrijpelijk','verzonnen'],h:['Lees de zin nog eens en let op wat er gebeurt.'],s:'Aannemelijk betekent: je kunt het geloven.'},
  {p:'amine',v:'taal',t:'Woordenschat in context',lvl:2,q:'"De maatregel bleek averechts te werken." Wat betekent averechts?',a:'het tegenovergestelde van wat je wilde',opties:['het tegenovergestelde van wat je wilde','precies goed','veel te duur'],h:['Lees de zin nog eens en let op wat er gebeurt.'],s:'Averechts betekent: het pakt andersom uit dan bedoeld.'},
  {p:'amine',v:'studievaardigheden',t:'Opzoeken',lvl:2,q:'In welk deel van een boek vind je op welke bladzijde het woord "vulkaan" staat?',a:'het register',opties:['het register','de inhoudsopgave','het voorwoord'],h:['Denk aan waar in het boek je moet zijn.'],s:'Het register staat achterin en gaat op alfabet per onderwerp.\nDe inhoudsopgave gaat per hoofdstuk.'},
  {p:'amine',v:'studievaardigheden',t:'Opzoeken',lvl:2,q:'Je zoekt in het woordenboek het woord "meeuw". Tussen welke twee woorden staat het?',a:'meel en meisje',opties:['meel en meisje','maan en meel','mist en modder'],h:['Denk aan waar in het boek je moet zijn.'],s:'Op alfabet: meel – meeuw – meisje.'},
  {p:'amine',v:'studievaardigheden',t:'Opzoeken',lvl:2,q:'Waar kijk je voor de betekenis van een moeilijk woord in een schoolboek?',a:'de begrippenlijst',opties:['de begrippenlijst','de inhoudsopgave','het colofon'],h:['Denk aan waar in het boek je moet zijn.'],s:'De begrippenlijst legt de vaktermen uit.'},
  {p:'amine',v:'rekenen',t:'Procenten',lvl:2,q:'Een jas kost € 80. Je krijgt 25% korting. Wat betaal je?',a:'60',u:'euro',h:['25% van 80 is de korting.','Trek die van 80 af.'],s:'25% van 80 = 20.\n80 − 20 = 60 euro.'},
  {p:'amine',v:'rekenen',t:'Procenten',lvl:3,q:'Na 20% korting kost een spel € 48. Wat was de oude prijs?',a:'60',u:'euro',h:['Je betaalt 80% van de oude prijs.','48 is dus 80%.'],s:'48 is 80% van de oude prijs.\n1% = 48 ÷ 80 = 0,60.\n100% = 60 euro.'},
  {p:'amine',v:'rekenen',t:'Procenten',lvl:2,q:'Een fiets kost € 200 exclusief btw. De btw is 21%. Wat kost hij inclusief btw?',a:'242',u:'euro',h:['21% van 200 komt erbij.'],s:'21% van 200 = 42.\n200 + 42 = 242 euro.'},
  {p:'amine',v:'rekenen',t:'Schaal',lvl:3,q:'Op een kaart met schaal 1 : 25 000 is een weg 4 cm lang. Hoeveel kilometer is dat in het echt?',a:'1',u:'km',h:['1 cm op de kaart is 25 000 cm in het echt.','100 000 cm = 1 km.'],s:'4 × 25 000 = 100 000 cm.\n100 000 cm = 1000 m = 1 km.'},
  {p:'amine',v:'rekenen',t:'Inhoud',lvl:2,q:'Een balk is 3 cm bij 4 cm bij 5 cm. Wat is de inhoud?',a:'60',u:'cm³',h:['Inhoud = lengte × breedte × hoogte.'],s:'3 × 4 × 5 = 60 cm³.'},
  {p:'amine',v:'rekenen',t:'Gemiddelde',lvl:2,q:'Amine haalt de cijfers 6, 7, 8, 5 en 9. Wat is zijn gemiddelde?',a:'7',h:['Tel alles op en deel door het aantal cijfers.'],s:'6 + 7 + 8 + 5 + 9 = 35.\n35 ÷ 5 = 7.'},
  {p:'amine',v:'rekenen',t:'Verhoudingen',lvl:3,q:'Twee broers verdelen € 40 in de verhouding 3 : 5. Hoeveel krijgt de jongste (het deel 3)?',a:'15',u:'euro',h:['3 + 5 = 8 delen samen.','Eerst één deel uitrekenen.'],s:'Samen 8 delen. € 40 ÷ 8 = € 5 per deel.\n3 delen = 3 × 5 = 15 euro.'},
  {p:'amine',v:'rekenen',t:'Oppervlakte & omtrek',lvl:2,q:'Een driehoek heeft een basis van 8 cm en een hoogte van 5 cm. Wat is de oppervlakte?',a:'20',u:'cm²',h:['Oppervlakte driehoek = basis × hoogte ÷ 2.'],s:'8 × 5 = 40.\n40 ÷ 2 = 20 cm².'},
  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:1,q:'Je gooit één zuivere dobbelsteen. Wat is de verwachtingswaarde van het aantal ogen?',a:'3,5',alt:['3.5'],h:['Elke uitkomst heeft kans 1/6.','E(X) = Σ x · P(x).'],s:'E(X) = (1+2+3+4+5+6)/6 = 21/6 = 3,5.'},
  {p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:3,q:'Bij een spel win je € 5 met kans 0,2 en verlies je € 2 met kans 0,8. Wat is de verwachte opbrengst per spel in euro?',a:'-0,60',alt:['-0.60','-0,6','-0.6','−0,60','−0,6'],h:['Vermenigvuldig elke uitkomst met zijn kans.','Verlies telt negatief.'],s:'E = 0,2 × 5 + 0,8 × (−2)\n= 1 − 1,6 = −0,60 euro.\nOp de lange duur verlies je dus 60 cent per spel.'},
  {p:'amaani',v:'wiskundeA',t:'Tellen (combinatoriek)',lvl:2,q:'Uit 10 leerlingen kies je een groepje van 3. De volgorde doet er niet toe. Hoeveel groepjes zijn er?',a:'120',h:['Volgorde doet er niet toe → combinaties.','C(10,3) = 10!/(3!·7!).'],s:'C(10,3) = (10×9×8)/(3×2×1) = 720/6 = 120.'},
  {p:'amaani',v:'wiskundeA',t:'Tellen (combinatoriek)',lvl:2,q:'Op hoeveel volgordes kun je 5 verschillende boeken naast elkaar zetten?',a:'120',h:['Nu doet de volgorde er wél toe.'],s:'5! = 5×4×3×2×1 = 120.'},
  {p:'amaani',v:'wiskundeA',t:'Kansrekening',lvl:3,q:'In een zak zitten 5 rode en 3 blauwe knikkers. Je pakt er twee zonder terugleggen. Wat is de kans dat ze allebei rood zijn? Geef een breuk.',a:'5/14',alt:['0,357','0.357'],h:['Eerst: 5 van de 8.','Daarna is er één rode wég — en één knikker minder in totaal.'],s:'P = 5/8 × 4/7 = 20/56 = 5/14 ≈ 0,357.'},
  {p:'amaani',v:'wiskundeA',t:'Groeifactoren',lvl:2,q:'Een bedrag groeit met 3% per jaar. Met welke factor is het na 10 jaar gegroeid? Geef 3 decimalen.',a:'1,344',alt:['1.344'],h:['Groeifactor per jaar = 1,03.','Over 10 jaar: g¹⁰.'],s:'g = 1,03.\n1,03¹⁰ ≈ 1,344.\nHet bedrag is dus met ruim 34% gegroeid, niet met 30%.'},
  {p:'amaani',v:'wiskundeA',t:'Exponentiële groei',lvl:3,q:'Een stof neemt af met groeifactor 0,9 per jaar. Wat is de halveringstijd in jaren? Geef 2 decimalen.',a:'6,58',alt:['6.58'],h:['Los op: 0,9^t = 0,5.','Neem aan beide kanten de logaritme.'],s:'0,9^t = 0,5\nt = log(0,5) / log(0,9) ≈ 6,58 jaar.'},
  {p:'amaani',v:'wiskundeA',t:'Groeifactoren',lvl:3,q:'Een populatie groeit in 5 jaar van 200 naar 260. Wat is de groeifactor per jaar? Geef 3 decimalen.',a:'1,054',alt:['1.054'],h:['g⁵ = 260/200.','Neem de vijfdemachtswortel.'],s:'g⁵ = 1,3\ng = 1,3^(1/5) ≈ 1,054.\nDat is ruim 5,4% per jaar.'},
  {p:'amaani',v:'scheikunde',t:'Rekenen (mol)',lvl:2,q:'Hoeveel mol is 36,0 gram water? (M(H₂O) = 18,02 g/mol). Geef 1 decimaal.',a:'2,0',alt:['2.0','2'],u:'mol',h:['n = m / M.'],s:'n = 36,0 / 18,02 ≈ 2,0 mol.'},
  {p:'amaani',v:'scheikunde',t:'Rekenen (mol)',lvl:2,q:'Hoeveel gram is 0,50 mol NaCl? (M = 58,44 g/mol). Geef 1 decimaal.',a:'29,2',alt:['29.2'],u:'g',h:['m = n × M.'],s:'m = 0,50 × 58,44 = 29,2 g.'},
  {p:'amaani',v:'scheikunde',t:'Reactievergelijkingen',lvl:3,q:'Maak kloppend: C₃H₈ + ... O₂ → 3 CO₂ + 4 H₂O. Welk getal hoort voor O₂?',a:'5',h:['Tel eerst de zuurstofatomen rechts.','3×2 + 4×1 = 10 zuurstofatomen.'],s:'Rechts: 3 CO₂ geeft 6 O, 4 H₂O geeft 4 O → samen 10 O.\nLinks moet dat ook 10 zijn: 5 × O₂ = 10 O.\nDus 5.'},
  {p:'amaani',v:'natuurkunde',t:'Samengestelde vraagstukken',lvl:2,q:'Een auto van 1200 kg versnelt in 8,0 s van stilstand naar 20 m/s. Wat is de versnelling? Geef 1 decimaal.',a:'2,5',alt:['2.5'],u:'m/s²',h:['a = Δv / Δt.'],s:'a = (20 − 0) / 8,0 = 2,5 m/s².'},
  {p:'amaani',v:'natuurkunde',t:'Samengestelde vraagstukken',lvl:2,q:'Diezelfde auto (1200 kg) versnelt met 2,5 m/s². Welke resulterende kracht hoort daarbij?',a:'3000',u:'N',h:['F = m · a.'],s:'F = 1200 × 2,5 = 3000 N.'},
  {p:'amaani',v:'natuurkunde',t:'Samengestelde vraagstukken',lvl:3,q:'Wat is de kinetische energie van die auto (1200 kg) bij 20 m/s?',a:'240000',alt:['2,4·10^5','2.4e5'],u:'J',h:['E_k = ½ m v².','Kwadrateer de snelheid eerst.'],s:'E_k = ½ × 1200 × 20²\n= 600 × 400 = 240 000 J = 2,4·10⁵ J.'},
  {p:'amaani',v:'natuurkunde',t:'Samengestelde vraagstukken',lvl:3,q:'Die 240 000 J wordt in 8,0 s opgebouwd. Welk gemiddeld vermogen hoort daarbij?',a:'30000',alt:['3,0·10^4'],u:'W',h:['P = E / t.'],s:'P = 240 000 / 8,0 = 30 000 W = 30 kW.'},
  {p:'amaani',v:'natuurkunde',t:'Samengestelde vraagstukken',lvl:3,q:'Een kraan tilt 500 kg 12 m omhoog. Hoeveel arbeid verricht hij? (g = 9,81 m/s²)',a:'58860',alt:['5,9·10^4','58900'],u:'J',h:['W = F · s, en F = m · g.'],s:'F = 500 × 9,81 = 4905 N.\nW = 4905 × 12 = 58 860 J ≈ 5,9·10⁴ J.'},
  {p:'selma',v:'rekenen',t:'Tafels & keer',lvl:2,q:'Reken uit: 7 × 8',a:'56',h:['Weet je 7 × 4? Dat is 28. Dan nog een keer zoveel.'],s:'7 × 8 = 56.'},
  {p:'selma',v:'rekenen',t:'Tafels & keer',lvl:2,q:'Reken uit: 6 × 9',a:'54',h:['6 × 10 = 60. Daar gaat één keer 6 vanaf.'],s:'6 × 10 = 60, min 6 = 54.'},
  {p:'selma',v:'rekenen',t:'Optellen tot 100',lvl:2,q:'Reken uit: 47 + 38',a:'85',h:['Doe eerst 47 + 40, en haal er dan 2 af.'],s:'47 + 40 = 87.\n87 − 2 = 85.'},
  {p:'selma',v:'rekenen',t:'Aftrekken tot 100',lvl:2,q:'Reken uit: 92 − 47',a:'45',h:['Doe eerst 92 − 50, en tel er dan 3 bij op.'],s:'92 − 50 = 42.\n42 + 3 = 45.'},
  {p:'selma',v:'rekenen',t:'Geld',lvl:2,q:'Iets kost € 3,50. Je betaalt samen met je zus, ieder de helft. Hoeveel betaal jij?',a:'1,75',alt:['1.75'],u:'euro',h:['De helft van 3 euro is 1,50.','De helft van 50 cent is 25 cent.'],s:'€ 3,50 ÷ 2 = € 1,75.'},
  {p:'selma',v:'rekenen',t:'Delen',lvl:1,q:'Reken uit: 35 : 5',a:'7',h:['Hoe vaak past 5 in 35?'],s:'5 × 7 = 35, dus 35 : 5 = 7.'},
  {p:'selma',v:'taal',t:'Werkwoorden (nu)',lvl:2,q:'Vul in: de hond ... (blaffen, nu, hij)',a:'blaft',h:['Zoek eerst wie er iets doet.'],s:'stam blaf + t = blaft.'},
  {p:'selma',v:'taal',t:'Werkwoorden (nu)',lvl:2,q:'Vul in: ik ... naar school. (lopen)',a:'loop',h:['Zoek eerst wie er iets doet.'],s:'bij ik alleen de stam: loop.'},
  {p:'selma',v:'taal',t:'Werkwoorden (nu)',lvl:2,q:'Vul in: jij ... mooi. (tekenen)',a:'tekent',h:['Zoek eerst wie er iets doet.'],s:'jij vóór het werkwoord: stam + t.'},
]

/** De aanvulling, elk met de id die hij in de opslag heeft. */
export const NIEUW2627: Opgave[] = RUW.map((e, i) => ({ ...e, id: 'nw26_' + i }))
