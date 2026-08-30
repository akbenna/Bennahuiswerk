/**
 * DE NEGEN INGANGEN
 *
 * Ze staan hier als gegevens en niet als HTML, want de lijst die je te zien
 * krijgt hangt af van wie je bent. Letterlijk overgenomen uit de oude
 * index.html; alleen de icoonpaden zijn absoluut gemaakt, want na de bouw staat
 * de pagina niet meer per se op de wortel.
 */

export type Groep = 'kind' | 'groot'

export interface AppTegel {
  id: string
  naam: string
  href: string
  ico: string
  /** De kleurnaam; wordt --<k> en --<k>-bg in de stijl. */
  k: string
  /** Eén regel voor op een kleine tegel: wat je er doet, in drie of vier
   *  woorden. `zin` is te lang voor een tegel van tien centimeter breed, en
   *  `detail[0]` is een kenmerk en geen omschrijving. */
  kort: string
  groep: Groep
  wie: string
  zin: string
  detail: string[]
  /** De oude naam, klein naast de nieuwe. */
  oud?: string
  /** Diezelfde naam in het Arabisch. */
  ar?: string
}

export const APPS: readonly AppTegel[] = [
 {id:'huiswerk', naam:'Huiswerk', href:'huiswerk/', ico:'/iconen/huiswerk.svg', k:'huiswerk', groep:'kind', kort:'Oefenen op jouw niveau',
  wie:'Selma · Amine · Wassima · Amaani',
  zin:'Oefenen op je eigen niveau, met een scorebord voor het hele gezin, een weektaak en een ouder-dashboard voor papa en mama. Werkt ook zonder internet. De spelletjes staan nu apart.',
  detail:['Alle vakken','Dit jaar en volgend jaar','Weektaak','Wedstrijd met een vriend','Toegangscode per kind']},

 {id:'bidaya', naam:'Islam leren', href:'noer/', ico:'/iconen/islam.svg', k:'islam', groep:'kind', kort:'Geloof, gebed en verhalen',
  oud:'Noer', ar:'نور الإسلام', wie:'Selma · Amine · Wassima · Amaani',
  zin:'Een brede kennismaking met de islam voor zeven tot vijftien jaar — geloof, gedrag, de Koran, de verhalen van de profeten en het leven hier. En daarnaast een complete begeleiding bij het leren bidden, met echte recitatie erbij.',
  detail:['Vijftien modules, 87 lessen','Eigen leerlijn per leeftijd','Leren bidden stap voor stap','Bijzondere gebeden','Gebedstijden en qibla']},

 {id:'lisan', naam:'Arabisch', href:'arabisch/', ico:'/iconen/arabisch.svg', k:'arabisch', groep:'kind', kort:'Lezen, schrijven, spreken',
  oud:'Lisan', ar:'لِسَان', wie:'Hanae en de kinderen',
  zin:'Arabisch leren lezen, begrijpen en spreken. De app kiest op je leeftijd wat je krijgt aangeboden — van de eerste letters tot het lezen van een hele alinea.',
  detail:['Eigen spoor per leeftijd','Alle 28 letters','Spel voor de kinderen']},

 {id:'bunyan', naam:'Computers & Code', href:'bunyan/', ico:'/iconen/code.svg', k:'code', groep:'kind', kort:'Python en pc bouwen',
  oud:'Bunyan', ar:'بُنْيَان', wie:'Amine',
  zin:'Leren coderen en een pc bouwen. Python draait in de app zelf, met foutmeldingen in gewoon Nederlands — en er is een bouwbank waarin je een computer samenstelt en ziet wat hij haalt.',
  detail:['Vanaf 10 jaar','63 lessen','Python, HTML en JavaScript','Zakgeld per les']},

 {id:'raha', naam:'Spelletjes', href:'spellen/', ico:'/iconen/spelletjes.svg', k:'spel', groep:'kind', kort:'Vijftien spelletjes',
  oud:'Raha', ar:'رَاحَة', wie:'Voor iedereen',
  zin:'Even afschakelen: dertien spelletjes plus de twee grote. Vrije tijd is een gunst — dus: even pauze, en daarna weer verder.',
  detail:['Mollen meppen','Reken-race','Arabische letterjacht','Records blijven staan']},

 /* DE DRIE CURSUSSEN, ELK ALS EIGEN TEGEL

    Ze stonden eerst als één tegel "Academie" met een snelbalk onderaan de
    startpagina erbij. Dat was twee keer half: de tegel zei niet waar een cursus
    over ging, en de snelbalk was een tweede weg naar hetzelfde. Nu drie tegels
    naast de andere apps, elk met wie hem kan gebruiken en waarvoor.

    Kompas staat hier bij de kinderen, Verbind en Podium verderop bij de
    groten. Dat is geen
    slordigheid: Kompas is in kindertaal geschreven en bruikbaar vanaf groep 4,
    Verbind en Podium gaan over netwerken en spreken voor publiek. Wil je dat
    anders, dan is het één woord: `groep`. */
 {id:'kompas', naam:'Kompas', href:'huiswerk/cursussen/kompas.html', ico:'/iconen/kompas.svg',
  k:'academie', groep:'kind', kort:'Slim leren en focus',
  wie:'Vanaf groep 4',
  zin:'Twintig lessen over hoe je leert in plaats van wat je leert: je aandacht vasthouden, je week plannen, dingen onthouden die blijven zitten, en rustig blijven bij een toets.',
  detail:['Twintig lessen','Kenniskaarten','Leer-simulator','In kindertaal']},

 {id:'health', naam:'BennaHealth', href:'health/', ico:'/iconen/health.svg', k:'health', groep:'groot', kort:'Je energiebalans gemeten',
  oud:'Kalibratie', ar:'', wie:'Abdelkader',
  zin:'Het dagelijks verbruik gemeten uit de gewichtstrend in plaats van geschat uit een formule — met het interval erbij. Vaste maaltijden worden één keer geijkt en schuiven daarna mee met wat je van de olie en de melk weet.',
  detail:['Voor volwassenen','Elke ochtend wegen','Interval bij elk getal','Marokkaans en Turks','Werkt zonder internet']},

 {id:'verbind', naam:'Verbind', href:'huiswerk/cursussen/communicatie.html', ico:'/iconen/verbind.svg',
  k:'academie', groep:'groot', kort:'Communicatie en netwerken',
  wie:'Vanaf de bovenbouw',
  zin:'Eenentwintig lessen over een gesprek beginnen met iemand die je niet kent, aardig overkomen zonder jezelf weg te cijferen, en een netwerk opbouwen dat later iets waard is.',
  detail:['21 lessen in 6 modules','Gesprekssimulator','Kenniskaarten','Reflectielogboek']},

 {id:'podium', naam:'Podium', href:'huiswerk/cursussen/presenteren.html', ico:'/iconen/podium.svg',
  k:'academie', groep:'groot', kort:'Presenteren en spreken',
  wie:'Vanaf de bovenbouw',
  zin:'Twintig lessen over voor een groep staan: je zenuwen de baas, een verhaal dat een kop en een staart heeft, en wat je doet als iemand een vraag stelt die je niet had zien aankomen.',
  detail:['Twintig lessen','Presentatiesimulator','Kenniskaarten','Ook voor spreekbeurten']},

 {id:'sanad', naam:'Geloofsstudie', href:'sanad/', ico:'/iconen/geloofsstudie.svg', k:'geloof', groep:'groot', kort:'Achtentwintig weken fiqh',
  oud:'Sanad', ar:'سند', wie:'Abdelkader',
  zin:'Achtentwintig weken Malikitische fiqh, usul, ‘aqida, bronnenkritiek en medische ethiek — elke week met een fragment uit de oorspronkelijke tekst.',
  detail:['Eén week per week','Arabisch met vertaling','Kaarten voor herhaling']},

 {id:'rasikh', naam:'Koran uit je hoofd', href:'rasikh/', ico:'/iconen/koran.svg', k:'koran', groep:'groot', kort:'Memoriseren en herhalen',
  oud:'Rasikh', ar:'رَاسِخ', wie:'Abdelkader',
  zin:'De Koran uit je hoofd leren en — dat is het moeilijke deel — vasthouden. Zes stappen per aya, en een systeem dat pas nieuwe stof geeft als de herhalingen bij zijn.',
  detail:['Voor volwassenen','25 minuten per dag','Herhalen op ritme','Verwarpunten apart']}
]
