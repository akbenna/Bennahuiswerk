import type { Insigne, Niveau, Spoor } from './soorten'

/* =============================================================================
   BELONING — niveaus, insignes en tarieven.
   Geld verdien je met leren: lessen, memoriseren, oefenkaarten en de examens.
   Het bidden zelf staat standaard buiten de beloning; zie de uitleg bij Ouder.
============================================================================= */
export const NIVEAUS: Niveau[] = [[0,'Eerste stap','🌱'],[120,'Op weg','🚶'],[300,'Vaste voet','🧭'],[600,'Kenner','📗'],
  [1000,'Gids','🕯️'],[1600,'Voorbeeld','🌟'],[2400,'Draagster','🏛️'],[3500,'Meester','👑']];

export const TARIEF = { les:0.50, hifz:1.50, examenWudu:1.00, examenSalah:1.50, missie:0.50, reeks7:1.00, gebed:0.10, gebedDagMax:0.50, weekbudget:10 };
export const XP = { les:20, kaart:2, hifzNiveau:15, gebed:5, missie:25, examen:60 };

export const INSIGNES: Insigne[] = [
 {id:'i-wudu',  n:'Wassing onder de knie', ico:'💧', u:'Het wassings-examen gehaald'},
 {id:'i-salah', n:'Het gebed op volgorde',  ico:'🕌', u:'Het gebeds-examen gehaald'},
 {id:'i-fatiha',n:'Al-Fatiha uit het hoofd',ico:'📖', u:'Al-Fatiha helemaal gememoriseerd'},
 {id:'i-drie',  n:'Drie soera\'s',          ico:'📚', u:'Drie soera\'s gememoriseerd'},
 {id:'i-tien',  n:'Tien soera\'s',          ico:'🏆', u:'Tien teksten gememoriseerd'},
 {id:'i-mod1',  n:'Eerste module af',       ico:'🎓', u:'Een hele module uitgelezen en gehaald'},
 {id:'i-alles', n:'Het hele leerpad',       ico:'🌠', u:'Alle lessen van alle modules gehaald'},
 {id:'i-reeks7',n:'Zeven dagen op rij',     ico:'🔥', u:'Zeven dagen achter elkaar geoefend'},
 {id:'i-reeks30',n:'Dertig dagen op rij',   ico:'🌙', u:'Dertig dagen achter elkaar geoefend'},
 {id:'i-vijf',  n:'Alle vijf op één dag',   ico:'⭐', u:'Op één dag alle vijf gebeden afgevinkt'},
 {id:'i-vijf7', n:'Een week alle vijf',     ico:'✨', u:'Zeven dagen achter elkaar alle vijf'},
 {id:'i-duas',  n:'Du\'a-kenner',           ico:'🤲', u:'Alle du\'a\'s van de dag geoefend'}
];

export const MODKLEUR: string[] =['k','info','paars','goed','let'];
export const SPOREN: Record<Spoor, { n: string; u: string }> = {1:{n:'7–9 jaar', u:'Korte lessen, veel beeld'},2:{n:'10–12 jaar', u:'Meer uitleg en achtergrond'},3:{n:'13 jaar en ouder', u:'Met verdieping en fiqh-termen'}};
