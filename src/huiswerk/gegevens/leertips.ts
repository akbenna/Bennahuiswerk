/**
 * LEERTIPS
 *
 * De tip van de dag rouleert; de rest staat in categorieën. Mechanisch
 * overgenomen uit de oude pagina.
 */

export interface Tipcategorie { kop: string; emoji: string; tips: Array<[string, string]> }

export const TIP_VAN_DE_DAG: string[] = [
  'Schrijf je formules vandaag één keer met de hand over. Schrijven plakt beter dan staren. ✍️',
  'Overhoor jezelf 5 minuten: dek het antwoord af en zeg het hardop. 🧠',
  'Bij elke som: eerst opschrijven wat je weet, mét eenheid. 📝',
  'Vastgelopen? Maak een tekening — de helft lost zichzelf op. ✏️',
  'Controleer je antwoord: is het logisch? Een auto van 4000 km/u klopt niet. 🤔',
  'Een fout is geen falen. Het is “nog niet”. Daar leer je het meest van. 💪',
  'Leg een som uit aan iemand anders. Snappen zij het? Dan ken jij het echt. 🗣️',
  'Liever elke dag 5 minuten dan 1 uur de avond voor de toets. ⏱️',
  'Werk 25 minuten, pauzeer 5. Je brein leert in blokjes. 🍅',
  'Begin een week vóór de toets, niet de avond ervoor. 📅',
  'Bij natuurkunde: reken eerst alles om naar standaardeenheden (m, s, kg). ⚖️',
  'Vergelijk jezelf met jezelf van gisteren, niet met de klas. 🌱',
];
export const TIPS_CATS: Tipcategorie[] = [
  {kop:'Beter onthouden', emoji:'🧠', tips:[
    ['Schrijf over, staar niet','Met de hand overschrijven zet stof veel beter vast dan herlezen.'],
    ['Klein en vaak','Elke dag 5 minuten werkt beter dan één lange avond stampen.'],
    ['Overhoor jezelf','Dek het antwoord af en zeg het hardop. Jezelf testen is de sterkste manier van leren.'],
    ['Koppel aan een beeld','Oppervlakte = het binnenste vullen; omtrek = het lint eromheen. Een plaatje blijft hangen.'],
    ['Leg het uit aan iemand','Kun je het uitleggen aan je ouder of broer/zus, dan ken je het echt.'],
  ]},
  {kop:'Sommen maken', emoji:'✍️', tips:[
    ['Altijd de 4 stappen','Gegeven → Gevraagd → Formule → Uitwerking. Ook bij makkelijke sommen — dan wordt het een gewoonte.'],
    ['Schrijf eerst op wat je weet','Met eenheid erbij. Dat haalt de paniek weg en laat zien wat je al hebt.'],
    ['Formule eerst leeg opschrijven','Dan pas invullen. Voorkomt slordigheidsfouten.'],
    ['Is dit logisch?','Eén controlevraag aan het eind vangt heel veel fouten.'],
    ['Teken het','Vooral bij meetkunde en natuurkunde: een schets lost de helft op.'],
  ]},
  {kop:'Toets voorbereiden', emoji:'📅', tips:[
    ['Begin een week eerder','Verdeel de stof over dagen. Cramming werkt slecht.'],
    ['Houd een foutenschrift bij','Schrijf elke fout + de verbetering op. Lees vlak voor de toets alleen dat.'],
    ['Maak oefentoetsen','Oefenen onder toets-omstandigheden went je aan de tijdsdruk.'],
    ['Slaap goed','Een uitgerust hoofd rekent beter dan een vermoeid hoofd dat extra blokte.'],
    ['Lees eerst de hele toets','Begin met de sommen die je zeker weet — dat geeft punten én rust.'],
  ]},
  {kop:'Volhouden & zelfvertrouwen', emoji:'💪', tips:[
    ['Fout = nog niet','Een fout is informatie, geen falen. Zo word je beter.'],
    ['Vier kleine stappen','Elke goede som is winst. Daarom geeft de app punten.'],
    ['Pauzeer slim','25 minuten werken, 5 minuten pauze. Korte blokjes werken beter dan uren door.'],
    ['Geen knobbel nodig','Je hebt geen wiskundeknobbel nodig — wel een vaste routine. Die leert iedereen.'],
  ]},
  {kop:'Speciaal voor natuurkunde', emoji:'🔬', tips:[
    ['Eerst eenheden omrekenen','De meeste fouten zitten in de eenheden, niet in de formule. Zet alles om naar m, s, kg vóór je invult.'],
    ['Snelheid omrekenen','km/u → m/s: delen door 3,6. m/s → km/u: keer 3,6.'],
    ['Gebruik het verhuisdriehoekje','Voor v = s/t, ρ = m/V en p = F/A: dek af wat je zoekt en lees de formule af — zonder algebra.'],
    ['Schrijf grootheid + eenheid','Niet “20”, maar “v = 20 m/s”. Zo weet je altijd waar een getal voor staat.'],
    ['Controleer de eenheid van je antwoord','Arbeid in joule (J), kracht in newton (N), vermogen in watt (W). Klopt de eenheid, dan klopt vaak de aanpak.'],
  ]},
];
