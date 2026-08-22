import type { Wudustap } from './soorten'

/* =============================================================================
   DE WASSING — stap voor stap.
   `deel` bepaalt welk lichaamsdeel oplicht in de tekening. `soort` zegt of het
   onderdeel verplicht is (fard) of iets wat de Profeet ﷺ deed (sunna).
   De indeling volgt de Malikitische school.
============================================================================= */
export const WUDU: Wudustap[] = [
 {id:'w1', t:'De intentie', deel:'', soort:'fard', kort:'Weet in je hart: ik ga nu de wassing doen.', tip:'Zeg de intentie niet hardop. Het is genoeg dat je wéét waarvoor je het doet — dat zit in je hoofd, niet in je mond.',
  hoe:['Je hoeft niets hardop te zeggen. Je weet gewoon waarvoor je het doet.','De intentie hoort aan het begin, bij het wassen van je gezicht of vlak ervoor.'],
  zeg:{aid:'t:bismillah', ar:'بِسْمِ اللَّهِ', tr:'Bismillah', nl:'In de naam van Allah'}},
 {id:'w2', t:'Je handen wassen', deel:'handen', soort:'sunna', aantal:'3×', kort:'Was je handen tot je polsen, rechts eerst.', tip:'Ring of horloge af, of schuif hem heen en weer. Onder een strak bandje komt geen water, en dan is die plek niet gewassen.',
  hoe:['Drie keer, rechts en dan links.','Tussen je vingers door.','Dit doe je vóór je je hand in het water steekt.']},
 {id:'w3', t:'Je mond spoelen', deel:'mond', soort:'sunna', aantal:'3×', kort:'Neem water in je mond en spoel goed.', tip:'Ben je aan het vasten? Spoel dan voorzichtig en slik niets door.',
  hoe:['Drie keer, met je rechterhand water opnemen.','Beweeg het water rond in je mond en spuug het uit.']},
 {id:'w4', t:'Je neus', deel:'neus', soort:'sunna', aantal:'3×', kort:'Water optrekken en weer uitsnuiten.', tip:'Niet te diep optrekken — je hoeft er niet van te hoesten. Snuit uit met je linkerhand.',
  hoe:['Trek water op met je rechterhand, snuit uit met je linker.','Drie keer. Rustig — niet te diep.']},
 {id:'w5', t:'Je gezicht wassen', deel:'gezicht', soort:'fard', aantal:'3×', kort:'Van je haargrens tot je kin, van oor tot oor — en wrijven.', tip:'Heb je een baard? Laat het water erdoorheen lopen en wrijf met natte vingers. Bij een dikke baard is de buitenkant genoeg.',
  hoe:['Neem water met beide handen.','Was van waar je haar begint tot onder je kin, en van oor tot oor.','<b>Wrijf erover met je hand.</b> Alleen water eroverheen laten lopen telt in deze school niet.','Vergeet niet: alles moet nat worden, geen droog plekje.']},
 {id:'w6', t:'Je armen tot de ellebogen', deel:'armen', soort:'fard', aantal:'3×', kort:'Rechts eerst, tot en met je elleboog, met wrijven.', tip:'Stroop je mouw ruim op tot bóven je elleboog. Blijft hij halverwege hangen, dan houd je een droge rand over.',
  hoe:['Begin bij je vingertoppen en ga door tot voorbij je elleboog.','De elleboog hoort erbij, niet er net onder.','Wrijf met je andere hand over je arm.','Eerst rechts, dan links.']},
 {id:'w7', t:'Je hoofd afvegen', deel:'hoofd', soort:'fard', aantal:'1×', kort:'Je hele hoofd, van voor naar achter en terug.', tip:'Maak je handen eerst opnieuw nat. Pet of hoofddoek gaat af: het gaat om je haar en je hoofdhuid.',
  hoe:['Maak je handen nat en leg ze op de voorkant van je hoofd.','Veeg naar achteren tot in je nek, en dan weer terug naar voren.','<b>Het hele hoofd</b> — niet een klein stukje. Dat is typisch voor de Malikitische school.']},
 {id:'w8', t:'Je oren', deel:'oren', soort:'sunna', aantal:'1×', kort:'Nieuw water pakken en je oren afvegen.', tip:'Nieuw water pakken, dus niet wat er nog aan je handen zit van je hoofd.',
  hoe:['Maak je handen opnieuw nat.','Wijsvinger in het oor, duim erachter.','Binnenkant en buitenkant.']},
 {id:'w9', t:'Je voeten wassen', deel:'voeten', soort:'fard', aantal:'3×', kort:'Tot en met je enkels, tussen je tenen door, rechts eerst.', tip:'In de moskee gaat het makkelijker met je voet ín de wasbak dan hangend op één been. Droog daarna tussen je tenen af, dat scheelt kou.',
  hoe:['Was je rechtervoet helemaal, tot voorbij je enkel.','Ga met je pink tussen je tenen door.','Wrijf over je voet.','Daarna de linker.','Draag je sokken over een geldige wassing? Dan mag je onder voorwaarden over je leren sokken (khuffayn) vegen in plaats van je voeten te wassen — vraag dat na bij je ouders.']},
 {id:'w10', t:'Klaar — en dan dit', deel:'', soort:'sunna', kort:'Sluit af met de getuigenis.', tip:'Heb je even tijd, bid dan meteen twee rak\'a. Dat hoort bij deze wassing en het is zonde om het moment te laten lopen.',
  hoe:['Kijk omhoog en zeg de shahada. Wie dat doet, staan volgens de overlevering alle acht poorten van het paradijs open.'],
  zeg:{aid:'t:wudu-shahada', ar:'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
       tr:'Ashhadu an la ilaha illa llahu wahdahu la sharika lah, wa ashhadu anna Muhammadan \'abduhu wa rasuluh',
       nl:'Ik getuig dat er geen god is dan Allah alleen, zonder deelgenoot, en ik getuig dat Mohammed Zijn dienaar en boodschapper is.'}}
];
export const WUDU_REGELS: Record<string, string[]> = {
  fard:['De intentie','Je gezicht wassen','Je armen tot en met de ellebogen','Je hele hoofd afvegen','Je voeten tot en met de enkels','Wrijven (dalk)','Aaneengesloten doorgaan (fawr)'],
  sunna:['Je handen wassen vóór je in het water gaat','Je mond spoelen','Water optrekken in de neus','De neus uitsnuiten','Je oren afvegen','Nieuw water voor de oren','Het hoofd terugvegen','De volgorde aanhouden'],
  breekt:['Plassen, poepen, een wind laten','Diep in slaap vallen','Bewusteloos raken, flauwvallen','Iets anders wat uit het lichaam komt langs de gewone weg'],
  breektNiet:['Bloeden uit een wondje','Overgeven','Lachen (buiten het gebed)','Een dier aanraken','Twijfel zonder zekerheid']
};
