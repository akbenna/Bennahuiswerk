/**
 * LEERTIPS
 *
 * Herzien en geordend naar wat er in het onderzoek daadwerkelijk uitkomt. De
 * volgorde van de categorieën is de volgorde van hoeveel het oplevert — de
 * eerste twee, jezelf overhoren en spreiden, halen het van alle andere samen.
 *
 * Twee dingen zijn met opzet zo geschreven:
 *
 * Bij elke tip staat *waarom* hij werkt, kort. Een kind dat begrijpt waarom
 * herlezen bedriegt, houdt het langer vol dan een kind dat alleen te horen
 * kreeg dat het moet.
 *
 * En er staat een categorie bij over wat *niet* werkt. Dat is geen stemming
 * maken: markeren, samenvatten tijdens het lezen en eindeloos herlezen zijn de
 * drie dingen die kinderen het meest doen en die het minst opleveren, en zolang
 * die tijd opsouperen komt de rest er niet bij.
 */

export interface Tipcategorie { kop: string; emoji: string; tips: Array<[string, string]> }

export const TIP_VAN_DE_DAG: string[] = [
  'Dek het antwoord af en zeg het hardop. Jezelf overhoren doet meer dan drie keer overlezen. 🧠',
  'Herlezen voelt goed omdat de tekst bekend wordt. Bekend is niet hetzelfde als gekend. 👀',
  'Vier keer een kwartier deze week levert meer op dan één uur morgenavond. Zelfde tijd. 📅',
  'Oefen je sommen eens door elkaar. Het voelt moeilijker en het werkt beter. 🎲',
  'Bij elke fout één zin: wat ging er mis? Dat is de snelste manier om vooruit te gaan. 🔍',
  'Maak de eerste stap belachelijk klein. Vijf sommen, niet "leren voor de toets". 🚀',
  'Leg het uit aan iemand anders. Waar je gaat haperen, zit het gat. 🗣️',
  'Telefoon in een andere kamer. Naast je op stil kost ook aandacht. 📵',
  'Vastgelopen? Maak een tekening — de helft lost zichzelf op. ✏️',
  'Controleer je antwoord: is het logisch? Een auto van 4000 km/u klopt niet. 🤔',
  'Reken bij natuurkunde eerst alles om naar m, s en kg. Daar zitten de meeste fouten. ⚖️',
  'Een fout is geen falen. Het is "nog niet" — en precies de plek waar je iets leert. 💪',
  'Werk 25 minuten, pauzeer 5. Je brein leert in blokjes. 🍅',
  'Vergelijk jezelf met jezelf van gisteren, niet met de klas. 🌱',
  'Sla een dag over en haal het dan op. Dat vergeten tussendoor maakt het juist sterker. 🔁',
]

export const TIPS_CATS: Tipcategorie[] = [
  {
    kop: 'Jezelf overhoren — dit levert het meeste op', emoji: '🧠',
    tips: [
      ['Dicht en opzeggen',
        'Lees een stukje, klap het boek dicht en vertel het na. Wat er dan niet uitkomt, ken je '
        + 'nog niet. Dat is precies wat je wilde weten.'],
      ['Afdekken bij woordjes',
        'Dek de vertaling af en zeg hem hardop vóór je kijkt. Het gokken zelf zet het vast, ook '
        + 'als je het mis hebt.'],
      ['Bedenk je eigen toetsvragen',
        'Welke drie vragen zou de leraar hierover stellen? Ze bedenken dwingt je te kijken wat '
        + 'de kern is.'],
      ['Leg het uit aan iemand',
        'Aan je ouder, je broer of aan de muur. De plek waar je gaat haperen is het gat.'],
      ['Bekend is niet gekend',
        'Herlezen laat de tekst vertrouwd voelen, en dat gevoel verwar je makkelijk met kennen. '
        + 'De enige eerlijke test is: kun je het zonder te kijken?'],
    ],
  },
  {
    kop: 'Verdelen over dagen', emoji: '📅',
    tips: [
      ['Kort en vaak wint',
        'Vier keer een kwartier over de week levert meer blijvende kennis op dan één uur op de '
        + 'avond ervoor. Dezelfde tijd, ander resultaat.'],
      ['Vergeten hoort erbij',
        'Juist doordat je tussendoor een beetje vergeet, wordt het ophalen daarna zwaarder — en '
        + 'daardoor blijft het beter zitten. Elke dag herhalen is minder nuttig dan om de dag.'],
      ['Begin een week eerder',
        'Niet om langer te werken, maar om dezelfde uren te verdelen.'],
      ['Haal oude stof terug',
        'Pak eens iets van vorige maand. Voelt onhandig, werkt goed.'],
      ['Klein dagdoel, elke dag',
        'Een doel dat je altijd haalt werkt beter dan een groot doel dat je meestal mist.'],
    ],
  },
  {
    kop: 'Door elkaar oefenen', emoji: '🎲',
    tips: [
      ['Niet twintig van hetzelfde',
        'Bij twintig sommen van één soort weet je na de eerste al welke aanpak het is. Dan oefen '
        + 'je alleen het uitrekenen, niet het herkennen.'],
      ['Op de toets staan ze door elkaar',
        'Daar moet je éérst zien welk soort het is. Dat kun je alleen oefenen als ze gemengd staan.'],
      ['Het voelt slechter en werkt beter',
        'Gemengd oefenen gaat langzamer en je maakt meer fouten. Toch scoor je er later hoger mee. '
        + 'Laat dat gevoel je niet misleiden.'],
      ['Sluit af met een mix',
        'Eerst een soort oefenen mag. Eindig dan met een ronde door elkaar.'],
    ],
  },
  {
    kop: 'Iets doen met je fouten', emoji: '🔍',
    tips: [
      ['Waarom, niet wat',
        'Het goede antwoord overnemen leert je niets. Zoek de oorzaak: rekenfout, verkeerde '
        + 'formule, of de vraag verkeerd gelezen?'],
      ['Eén zin per fout',
        '"Ik vergat de eenheid." Meer hoeft niet. Lees vlak voor de toets alleen die zinnen.'],
      ['Maak hem later opnieuw',
        'Niet meteen — dan weet je het antwoord nog. Over een paar dagen.'],
      ['Kijk verder dan het cijfer',
        'Een toets terug is gratis informatie over wat je nog niet kunt. Het cijfer zegt daar '
        + 'niets over.'],
    ],
  },
  {
    kop: 'Sommen maken', emoji: '✍️',
    tips: [
      ['Altijd de vier stappen',
        'Gegeven → Gevraagd → Formule → Uitwerking. Ook bij makkelijke sommen; dan wordt het '
        + 'een gewoonte die je onder toetsdruk vasthoudt.'],
      ['Formule eerst leeg opschrijven',
        'Dan pas invullen. Dat scheelt de meeste slordigheidsfouten.'],
      ['Schrijf op wat je weet, met eenheid',
        'Niet "20", maar "v = 20 m/s". Dat haalt de paniek weg en laat zien wat je al hebt.'],
      ['Teken het',
        'Vooral bij meetkunde en natuurkunde. Een schets lost de helft op.'],
      ['Is dit logisch?',
        'Eén controlevraag aan het eind vangt heel veel fouten.'],
    ],
  },
  {
    kop: 'Beginnen en volhouden', emoji: '🚀',
    tips: [
      ['Maak de eerste stap te klein om te weigeren',
        'Niet "leren voor de toets" maar "vijf sommen". Uitstel komt zelden door luiheid; meestal '
        + 'is de eerste stap te groot gemaakt.'],
      ['Telefoon uit de kamer',
        'Naast je op stil kost ook aandacht — je weet dat hij er ligt.'],
      ['25 en 5',
        'Vijfentwintig minuten werken, vijf pauze. Korte blokjes houden langer vol dan uren door.'],
      ['Eerst zelf, dan hulp',
        'Een paar minuten zelf worstelen maakt de uitleg daarna veel effectiever. Meteen hulp '
        + 'vragen slaat dat stuk over.'],
      ['Geen knobbel nodig',
        'Je hebt geen wiskundeknobbel nodig — wel een vaste routine. Die leert iedereen.'],
    ],
  },
  {
    kop: 'Wat minder oplevert dan je denkt', emoji: '⚠️',
    tips: [
      ['Markeren met een stift',
        'Het voelt productief en het is bijna niets waard. Je hebt de tekst dan gesorteerd, niet '
        + 'geleerd. Overhoor jezelf over hetzelfde stuk en je merkt het verschil.'],
      ['Steeds opnieuw lezen',
        'De meest gebruikte manier van leren en een van de zwakste. Twee keer lezen en dan jezelf '
        + 'overhoren verslaat vier keer lezen ruimschoots.'],
      ['Samenvatten terwijl je leest',
        'Overschrijven met het boek open is vooral kopiëren. Doe het boek dicht en schrijf op wat '
        + 'je nog weet — dan wordt het wél oefening.'],
      ['Leren "in jouw leerstijl"',
        'Het idee dat je beter leert als de uitleg bij je type past — beeld, geluid, doen — is '
        + 'goed onderzocht en het houdt geen stand. Je hebt wel voorkeuren, maar leren gaat er '
        + 'niet beter van. Wat wél telt is wat je doet.'],
      ['De hele avond doorwerken',
        'Na een uur of twee levert een uur extra bijna niets meer op. Dat uur op een andere dag '
        + 'wél.'],
    ],
  },
]
