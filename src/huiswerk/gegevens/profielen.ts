/**
 * WIE ER OEFENEN, EN WAARMEE
 *
 * Wat een kind te zien krijgt hangt af van zijn profiel: welke vakken, welk
 * thema, en of er zakgeld tegenover staat.
 *
 * TWEE LIJSTEN, EN WAAROM
 *
 * `PROFIELEN_OUD` is het verslag van de overzetting: regel voor regel wat er in
 * de oude pagina stond. De gouden waarden leggen daar een vingerafdruk op, en
 * dat is geen sier — het is het bewijs dat er bij het ombouwen geen letter is
 * verschoven. Die lijst hoort dus nooit meer te veranderen.
 *
 * `PROFIELEN` is waar de kinderen nu zitten. Elk jaar in augustus schuift die op
 * en de andere niet. Zou het één lijst zijn, dan moest je bij elke
 * septemberwijziging het migratiebewijs weggooien om de app kloppend te krijgen
 * — en dan bewijst het niets meer.
 *
 * Het jaar zelf staat in `schooljaar.ts`, met daarbij wie er is overgegaan en
 * wie niet.
 */
import type { Profielkaart, Thema } from './soorten'
import { KLASSEN } from './schooljaar'

/** Het verslag van de overzetting. Niet aanpassen; zie de kop. */
export const PROFIELEN_OUD: Record<string, Profielkaart> = {
  wassima:{naam:'Wassima', niveau:'2 havo', volgend:'3 havo', emoji:'🌱', kleur:'linear-gradient(135deg,#5EA03A,#48792c)', vakken:['wiskunde','natuurkunde','nederlands','engels','frans','duits','biologie','aardrijkskunde','geschiedenis','economie'], beloning:true},
  amaani: {naam:'Amaani',  niveau:'4 vwo',  volgend:'5 vwo',  emoji:'🚀', kleur:'linear-gradient(135deg,#3a6ea0,#2c5680)', vakken:['wiskundeA','natuurkunde','scheikunde','nederlands','engels','frans','biologie','aardrijkskunde','geschiedenis','economie'], beloning:true},
  amine:  {naam:'Amine',   niveau:'groep 7', volgend:'groep 8', emoji:'⚽', kleur:'linear-gradient(135deg,#2e8b57,#1f6e43)', vakken:['rekenen','taal','lezen','studievaardigheden','engels'], thema:'voetbal', beloning:true},
  selma:  {naam:'Selma',   niveau:'groep 4', volgend:'groep 5', emoji:'🌸', kleur:'linear-gradient(135deg,#d95b9a,#b34584)', vakken:['rekenen','taal','lezen'], beloning:true},
};

/**
 * De profielen zoals ze dit schooljaar gelden: hetzelfde als hierboven, maar met
 * de klas van nu erin. Dit is wat de app overal gebruikt.
 */
export const PROFIELEN: Record<string, Profielkaart> = Object.fromEntries(
  Object.entries(PROFIELEN_OUD).map(([pid, prof]) => {
    const klas = KLASSEN[pid]
    return [pid, klas ? { ...prof, niveau: klas.niveau, volgend: klas.volgend } : prof]
  }),
)

export const THEMAS: Record<string, Thema> = {
  standaard:{ xp:'punten', doel:'sommen', goal:'✅ Goed gedaan!', feest:['🎉','⭐','🎊','✨','👏'],
    rangen:[[0,'Starter','🌱'],[100,'Op dreef','⭐'],[250,'Kanjer','🌟'],[500,'Uitblinker','🏅'],[900,'Ster','💫'],[1400,'Meester','🎓'],[2000,'Kampioen','🏆'],[3000,'Legende','👑']] },
  voetbal:{ xp:'XP', doel:'doelpunten', goal:'⚽ GOAL!', feest:['⚽','🥅','🎉','🔥','👟'],
    rangen:[[0,'Pupil','⚽'],[100,'Talent','🌟'],[250,'Basisspeler','👕'],[500,'Uitblinker','⭐'],[900,'Aanvoerder','🎽'],[1400,'Topscorer','🥅'],[2000,'Kampioen','🏆'],[3000,'Legende','👑']] },
};

export const VAKNAAM: Record<string, string> = {wiskunde:'Wiskunde', natuurkunde:'Natuurkunde', wiskundeA:'Wiskunde A', geschiedenis:'Geschiedenis',
  nederlands:'Nederlands', engels:'Engels', frans:'Frans', duits:'Duits', biologie:'Biologie',
  aardrijkskunde:'Aardrijkskunde', economie:'Economie', scheikunde:'Scheikunde',
  rekenen:'Rekenen', taal:'Taal', lezen:'Begrijpend lezen', studievaardigheden:'Studievaardigheden'};

/* Onderwerp → teken. Zeven onderwerpen stonden hier twee keer in, elke keer met
   hetzelfde teken; JavaScript hield stilzwijgend de laatste aan. TypeScript
   wijst ze aan, dus de eerdere kopieën zijn eruit — de uitkomst is regel voor
   regel dezelfde. */
export const ONDERWERPICOON: Record<string, string> = {
  'Procenten':'％','Vergelijkingen':'⚖️','Lineaire formules':'📈','Oppervlakte & omtrek':'⬛',
  'Pythagoras':'📐','Hoeken':'📐','Inhoud':'🧊','Snelheid':'🚴','Dichtheid':'⚗️',
  'Groeifactoren':'📊','Exponentieel verband':'📈','Formules herleiden':'🔤','Statistiek':'📊',
  'Differentiëren':'📉','Kansrekening':'🎲','Bewegingsvergelijkingen':'🏎️',
  'Kinematica':'🏃','Krachten (Newton)':'💪','Arbeid & energie':'⚡','Vermogen':'🔌','Elektriciteit':'🔋',
  'Rendement':'♻️','Warmte':'🔥',
  'Kracht & zwaartekracht':'🏋️','Veerkracht':'🪀','Stroom & spanning':'🔌','Energie & vermogen':'⚡','Geluid':'🔊','Druk':'🎈',
  'Tijd & eeuwen':'⏳','Opstand tegen Spanje':'⚔️','Gouden Eeuw & Republiek':'🚢','Handel & slavernij':'🌍','Verlichting':'🕯️','Franse Revolutie':'🇫🇷',
  // talen & zaakvakken
  'Werkwoordspelling':'✏️','Woordsoorten':'🔤','Spelling':'📝','Woordenschat':'💬','Onregelmatige werkwoorden':'🔁','Grammatica':'🔡','Grammatica (tenses)':'⏱️',
  'Lidwoorden (le/la)':'🇫🇷','Lidwoorden (der/die/das)':'🇩🇪','Getallen':'🔢','Argumentatie':'🗣️','Stijlfiguren':'🎭','Spelling & stijl':'🖋️',
  'De cel':'🔬','Het menselijk lichaam':'🫀','Planten':'🌿','Cel & DNA':'🧬','Ecologie':'🌳',
  'Topografie':'🗺️','Klimaat & weer':'🌦️','Water & landschap':'🏞️','Aarde & klimaat':'🌋','Bevolking & globalisering':'🌐',
  'Geld & rekenen':'💶','Begrippen':'📖','Markt':'📈','Symbolen & atomen':'⚛️','Moleculen':'🧪','Zuur & base':'🧫',
  'Industriële revolutie':'🏭','Wereldoorlogen':'🎖️',
  // exacte fundamenten (Wassima) + bovenbouw (Amaani)
  'Rekenvolgorde':'🧮','Negatieve getallen':'➖','Machten & wortels':'🔢','Verhoudingen & schaal':'📐','Haakjes & herleiden':'🔠',
  'Grootheden & eenheden':'📏','Temperatuur & warmte':'🌡️','Licht':'💡','Magnetisme':'🧲','Elektrische schakelingen':'🔌','Beweging (afstand-tijd)':'🏃',
  'Kwadratische functies':'📈','Vergelijkingen oplossen':'🟰','Machten & exponenten':'🔢','Procentuele groei':'📊','Logaritmen':'🔟','Rijen':'🔢',
  'Krachten & evenwicht':'⚖️','Golven & trillingen':'🌊','Schakelingen':'🔌','Radioactiviteit':'☢️',
  // Amine (groep 7/8)
  'Optellen & aftrekken':'➕','Delen':'➗','Kommagetallen':'🔢','Meetkunde':'⬛',
  'Grafieken & tabellen':'📊','Redactiesommen':'🧩','Zinsontleden':'🧩','Woordenschat & spreekwoorden':'💬',
  'Leestekens & hoofdletters':'🔡','Tekst begrijpen':'📖','Signaalwoorden':'🔗','Alfabetiseren':'🔠','Kaart & schaal':'🗺️','Grafieken & tabellen lezen':'📊',
  'Verhoudingen':'⚖️','Afronden & schatten':'🎯','Synoniemen & antoniemen':'🔁','Hoofdgedachte':'💡','Verwijswoorden':'🔗','Woordenboek & informatie':'📚','Roosters & tabellen':'🗓️','Zinnen & vragen':'💬',
  'Atoombouw':'⚛️','Reactievergelijkingen':'⚗️','Rekenen (mol)':'🧮',
  'Tekstverbanden':'🔗','Staatsvormen':'🏛️','Werkwoorden (être/avoir)':'🇫🇷',
  'Werkwoorden':'🔤','Ontdekkingsreizen':'🧭','Koude Oorlog':'❄️','Dekolonisatie':'🌍','Spreekwoorden':'🗣️',
  // volgend jaar
  'Kwadratische vergelijkingen':'🟰','Stelsels':'🔢','Goniometrie':'📐','Krachten (resultante)':'➡️','Normale verdeling':'🔔','Binomiale verdeling':'🎲',
  'Logaritmen (gevorderd)':'🔟','Energiebehoud':'⚡','Gaswet':'🌡️','Concentratie':'🧪','Formules met x':'🔤','Coördinaten':'📈',
  'Reactiesnelheid':'⏱️','Tijdlijn':'📜','Feit of mening':'💭','Soorten teksten':'📰','Woordbetekenis':'📖','Conclusie':'🔍','Samenvatten':'🗒️','Opzoeken':'🔎',
  // Selma (groep 5)
  'Getallen tot 1000':'🔢','Optellen tot 1000':'➕','Aftrekken tot 1000':'➖','Geld':'💶','Verhaaltjessommen':'🧩','Tabellen & grafieken':'📊','Schaal':'🗺️','Gemiddelde':'📊',
  'Korte en lange klank':'🔤','ei of ij':'✏️','au of ou':'✏️','Verkleinwoorden':'🧸','Hakwoorden & klankgroepen':'🔨','d of t aan het eind':'📝','Meervoud':'🔁','Werkwoorden (nu)':'🏃','Wie, wat, waar, waarom':'❓','Volgorde':'🔢',
  'Leesteksten':'📚','ng of nk':'🔤','cht-woorden':'📝','Samenstellingen':'🔗','Verhoudingstabellen':'⚖️',
  'Molverhoudingen':'🧮',
  // Wassima · zaakvakken & talen verdieping
  'Vertering':'🍎','Ademhaling':'🫁','Bloedsomloop':'❤️','Fotosynthese':'🌱',
  'Klimaatzones':'🌍','Kaartvaardigheden':'🧭','Bevolking':'👥','Endogeen & exogeen':'🌋','Tenses':'⏱️',
  'Naamvallen (Akkusativ)':'🇩🇪','Passé composé':'🇫🇷','Naamvallen':'🇩🇪',
  'Hormonen':'🧬','Erfelijkheid':'🧬','Evolutie':'🦎','Platentektoniek':'🌋','Globalisering':'🌐','Conjunctuur':'📉','Marktvormen':'🏪','Elasticiteit':'📊',
  'Getallen tot 100':'🔢','Optellen tot 100':'➕','Aftrekken tot 100':'➖','Even & oneven':'🔀','Rijen & patronen':'🔢','Tafels & keer':'✖️','Tijd & klok':'🕐','Meten & maten':'📏','Breuken':'🍕',
};

