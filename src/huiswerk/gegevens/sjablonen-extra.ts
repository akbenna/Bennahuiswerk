/**
 * DE TWEEDE VOORRAAD SJABLONEN
 *
 * Waarom dit een apart bestand is, en geen aanvulling op `sjablonen.ts`: die
 * lijst is het verslag van de overzetting uit de oude pagina en ligt onder een
 * vingerafdruk in de gouden waarden — aantal én volgorde van de id's. Nieuwe
 * sjablonen daartussen zetten betekent dat bewijs weggooien. Dezelfde reden
 * waarom `schooljaar2627.ts` naast `seed.ts` staat.
 *
 * WAAROM SJABLONEN EN NIET LOSSE OPGAVEN
 *
 * Een onderwerp als `Delen` had drie vaste sommen, één per niveau. Dat is geen
 * voorraad maar een rijtje: wie er twee keer doorheen gaat kent de antwoorden
 * uit zijn hoofd, en dan oefent hij zijn geheugen in plaats van de methode. Een
 * sjabloon raakt niet op. Vandaar dat de rekenkundige onderwerpen hier sjablonen
 * krijgen en geen tiental extra vaste sommen.
 *
 * Waar het om taal en kennis gaat kan dat niet met getallen, en daar trekt een
 * sjabloon uit een lijst die met de hand is nagelopen. Ook dan geldt: één
 * sjabloon, tien tot twintig verschillende vragen, en een Leitner-kaart die over
 * de regel gaat en niet over één woord.
 *
 * DE PROEF
 *
 * `sjablonen-extra.proef.ts` draait elk sjabloon hieronder honderden keren en
 * rekent het antwoord terug uit de getallen die in de vraag staan — dus uit wat
 * het kind leest, niet uit dezelfde variabele. Wie hier een som verandert, moet
 * daar de narekening meeveranderen; dat is precies de bedoeling.
 *
 * Het toeval komt als argument binnen, net als in `sjablonen.ts`.
 */
import type { Sjabloon, Toeval } from './soorten'

/** Een geldbedrag zoals het op een prijskaartje staat: altijd twee decimalen. */
const geld = (x: number): string => x.toFixed(2).replace('.', ',')
/** Een getal met een vast aantal decimalen, Nederlands genoteerd. */
const vast = (x: number, d: number): string => x.toFixed(d).replace('.', ',')
/** Enkelvoud of meervoud, zodat er geen "1 halveringstijden" op het scherm komt. */
const mv = (n: number, enk: string, meerv: string): string => `${n} ${n === 1 ? enk : meerv}`
/** Nederlandse komma voor de weergave. */
const nl = (x: number): string => String(Math.round(x * 1000) / 1000).replace('.', ',')
/** Het teken voor in een formule: `+ 3` of `− 3`, met een echt minteken. */
const pm = (b: number): string => (b >= 0 ? '+ ' + b : '− ' + (-b))
/** Machten als bovenschrift, voor in een formule. */
const EXP: Record<number, string> = { 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶' }
/** Het aantal combinaties van k uit n, zonder faculteiten die overlopen. */
const combinaties = (n: number, k: number): number => {
  let uit = 1
  for (let i = 1; i <= k; i++) uit = uit * (n - k + i) / i
  return Math.round(uit)
}
/** Afronden op een vast aantal decimalen. */
const rond = (x: number, d: number): number => Math.round(x * 10 ** d) / 10 ** d
/** Een geldbedrag op hele centen, zodat 3 × 1,25 niet als 3,7500000001 eindigt. */
const eur = (x: number): number => Math.round(x * 100) / 100
/** Een tijd als klokje, met voorloopnul op de minuten. */
const klok = (u: number, m: number): string => `${u}:${String(m).padStart(2, '0')}`

/* --------------------------------------------------------------- woordlijsten
   Alles hieronder is met de hand nagelopen. De proef controleert wat er
   mechanisch aan te controleren valt — geen dubbele regels, een antwoord dat
   tussen de opties staat, een afleider die niet toevallig ook goed is. */

/** Woorden met ei of ij. De afleider ontstaat door het ene in het andere om te
 *  zetten. Elk woord hier is nagelopen: de omgezette vorm bestaat niet, dus er
 *  is nooit twijfel welke van de twee goed is. `ijs` staat er bijvoorbeeld niet
 *  bij, want `eis` is gewoon een woord. */
const EIIJ = ['trein', 'klein', 'geit', 'rijden', 'kijken', 'pijn', 'plein', 'lijm',
  'keizer', 'vijf', 'eiland', 'wijzer', 'wijn', 'meisje', 'schrijven', 'krijt'] as const

/** Woorden met au of ou, op dezelfde manier nagelopen: `rauw` staat er niet bij
 *  omdat `rouw` bestaat. */
const AUOU = ['blauw', 'goud', 'pauw', 'koud', 'nauw', 'vrouw', 'saus', 'hout',
  'flauw', 'zout', 'schouder', 'kabouter', 'lauw', 'auto', 'kous', 'woud'] as const

/** Een d of een t aan het eind, met het meervoud erbij. Het meervoud staat in de
 *  vraag: dat ís de regel — verleng het woord en je hoort welke letter het is. */
const DOFT: ReadonlyArray<readonly [string, string]> = [
  ['hond', 'honden'], ['kat', 'katten'], ['hand', 'handen'], ['gat', 'gaten'],
  ['bed', 'bedden'], ['pet', 'petten'], ['hoed', 'hoeden'], ['voet', 'voeten'],
  ['brood', 'broden'], ['boot', 'boten'], ['wind', 'winden'], ['hoofd', 'hoofden'],
  ['paard', 'paarden'], ['hout', 'houten'], ['land', 'landen'], ['pot', 'potten'],
]

/** Verkleinwoorden, met de vorm die erbij hoort. */
const KLEIN: ReadonlyArray<readonly [string, string]> = [
  ['boom', 'boompje'], ['huis', 'huisje'], ['bal', 'balletje'], ['kat', 'katje'],
  ['ster', 'sterretje'], ['man', 'mannetje'], ['raam', 'raampje'], ['ring', 'ringetje'],
  ['stoel', 'stoeltje'], ['tafel', 'tafeltje'], ['auto', 'autootje'], ['paraplu', 'parapluutje'],
  ['koning', 'koninkje'], ['bloem', 'bloempje'], ['schoen', 'schoentje'], ['brief', 'briefje'],
]

/** Meervouden, inclusief de onregelmatige die een kind moet kennen. */
const MEERVOUD: ReadonlyArray<readonly [string, string]> = [
  ['bal', 'ballen'], ['pen', 'pennen'], ['bos', 'bossen'], ['vis', 'vissen'],
  ['maan', 'manen'], ['boom', 'bomen'], ['muur', 'muren'], ['poot', 'poten'],
  ['kind', 'kinderen'], ['ei', 'eieren'], ['koe', 'koeien'], ['schoen', 'schoenen'],
  ['huis', 'huizen'], ['brief', 'brieven'], ['neus', 'neuzen'], ['druif', 'druiven'],
]

/** Korte of lange klank. De korte staat in een gesloten lettergreep; bij de
 *  lange wordt de lettergreep in het meervoud open. */
const KLANK: ReadonlyArray<readonly [string, 'korte klank' | 'lange klank']> = [
  ['bal', 'korte klank'], ['maan', 'lange klank'], ['pen', 'korte klank'],
  ['boom', 'lange klank'], ['vis', 'korte klank'], ['muur', 'lange klank'],
  ['bos', 'korte klank'], ['poot', 'lange klank'], ['kip', 'korte klank'],
  ['deur', 'lange klank'], ['zon', 'korte klank'], ['boot', 'lange klank'],
]

/** ng of nk, altijd in een zin — los zijn het vaak twee bestaande woorden, en
 *  dan is er geen goed antwoord. */
const NGNK: ReadonlyArray<readonly [string, string, string]> = [
  ['Ik ben ... voor de grote hond.', 'bang', 'bank'],
  ['Het geld ligt op de ....', 'bank', 'bang'],
  ['Zij draagt een gouden ... om haar vinger.', 'ring', 'rink'],
  ['Ik ... een glas water.', 'drink', 'dring'],
  ['De vogels ... in de ochtend.', 'zingen', 'zinken'],
  ['Ik moet even goed ... over die vraag.', 'denken', 'dengen'],
  ['De poes is nog heel ....', 'jong', 'jonk'],
  ['Hij zit op een harde houten ....', 'bank', 'bang'],
]

/** Woorden op -cht. De fout (-gt) bestaat in geen van deze gevallen. */
const CHT: ReadonlyArray<readonly [string, string]> = [
  ['Het is donker in de ...', 'nacht'], ['Doe het ... eens aan', 'licht'],
  ['De deken voelt lekker ...', 'zacht'], ['Ga eens ... zitten', 'recht'],
  ['We nemen de ... naar Spanje', 'vlucht'], ['In Amsterdam ligt een ...', 'gracht'],
  ['Ik ... al een uur op de bus', 'wacht'], ['Met veel ... duwde hij de deur open', 'kracht'],
  ['Doe de deur ...', 'dicht'], ['De ... is fris vanmorgen', 'lucht'],
]

/** Klankgroepen, geteld zoals een kind ze hakt. */
const HAK: ReadonlyArray<readonly [string, number]> = [
  ['banaan', 2], ['tomaat', 2], ['olifant', 3], ['vakantie', 3], ['tafel', 2],
  ['computer', 3], ['paraplu', 3], ['kabouter', 3], ['sinaasappel', 4], ['winter', 2],
  ['schoolplein', 2], ['appel', 2], ['televisie', 4], ['kameel', 2],
]

/** Samenstellingen die zonder tussenletter aan elkaar gaan. */
const SAMEN: ReadonlyArray<readonly [string, string]> = [
  ['tand', 'borstel'], ['voet', 'bal'], ['school', 'plein'], ['brand', 'weer'],
  ['zwem', 'bad'], ['regen', 'jas'], ['huis', 'deur'], ['speel', 'goed'],
  ['tuin', 'stoel'], ['hand', 'doek'], ['slaap', 'kamer'], ['boeken', 'kast'],
]

/** Synoniemen voor Amine, met twee afleiders die er duidelijk naast zitten. */
const SYNONIEM: ReadonlyArray<readonly [string, string, string, string]> = [
  ['moeilijk', 'lastig', 'makkelijk', 'vrolijk'], ['snel', 'vlug', 'traag', 'zwaar'],
  ['beginnen', 'starten', 'stoppen', 'vergeten'], ['bang', 'angstig', 'dapper', 'boos'],
  ['groot', 'enorm', 'piepklein', 'smal'], ['blij', 'vrolijk', 'verdrietig', 'moe'],
  ['kiezen', 'selecteren', 'weggooien', 'tellen'], ['kalm', 'rustig', 'druk', 'luid'],
  ['proberen', 'pogen', 'opgeven', 'slapen'], ['belangrijk', 'wezenlijk', 'onzinnig', 'duur'],
]

/** Antoniemen: hetzelfde, maar dan het tegenovergestelde. */
const ANTONIEM: ReadonlyArray<readonly [string, string, string, string]> = [
  ['vroeg', 'laat', 'snel', 'stil'], ['zwaar', 'licht', 'groot', 'nat'],
  ['altijd', 'nooit', 'soms', 'vaak'], ['binnen', 'buiten', 'boven', 'naast'],
  ['winnen', 'verliezen', 'spelen', 'trainen'], ['open', 'dicht', 'hoog', 'breed'],
  ['vrolijk', 'somber', 'grappig', 'luid'], ['schuldig', 'onschuldig', 'boos', 'eerlijk'],
]

/** Woordsoorten, elk woord in een zin waarin het maar één ding kan zijn. */
const WOORDSOORT: ReadonlyArray<readonly [string, string, string]> = [
  ['De hond blaft hard.', 'hond', 'zelfstandig naamwoord'],
  ['De hond blaft hard.', 'blaft', 'werkwoord'],
  ['Het is een snelle auto.', 'snelle', 'bijvoeglijk naamwoord'],
  ['Zij fietst naar school.', 'zij', 'persoonlijk voornaamwoord'],
  ['Ik zie de maan.', 'de', 'lidwoord'],
  ['Hij loopt langzaam.', 'langzaam', 'bijwoord'],
  ['De tafel staat in de kamer.', 'tafel', 'zelfstandig naamwoord'],
  ['Wij eten een warme maaltijd.', 'warme', 'bijvoeglijk naamwoord'],
]
const WOORDSOORTEN = ['zelfstandig naamwoord', 'werkwoord', 'bijvoeglijk naamwoord',
  'persoonlijk voornaamwoord', 'lidwoord', 'bijwoord'] as const

/** Het onderwerp van een zin: wie of wat het werkwoord doet. */
const ONDERWERP: ReadonlyArray<readonly [string, string, string, string]> = [
  ['De buurman wast zijn auto.', 'de buurman', 'zijn auto', 'wast'],
  ['Mijn zus leest een dik boek.', 'mijn zus', 'een dik boek', 'leest'],
  ['In de tuin bloeien de rozen.', 'de rozen', 'in de tuin', 'bloeien'],
  ['Morgen komt de monteur langs.', 'de monteur', 'morgen', 'komt'],
  ['De kinderen bouwen een hut.', 'de kinderen', 'een hut', 'bouwen'],
  ['Op zondag slaapt hij uit.', 'hij', 'op zondag', 'slaapt'],
]

/** Engelse telwoorden, met de hand nagelopen. */
const ENGELS_GETAL: ReadonlyArray<readonly [number, string]> = [
  [3, 'three'], [7, 'seven'], [9, 'nine'], [11, 'eleven'], [12, 'twelve'], [13, 'thirteen'],
  [15, 'fifteen'], [18, 'eighteen'], [20, 'twenty'], [21, 'twenty-one'], [30, 'thirty'],
  [40, 'forty'], [45, 'forty-five'], [50, 'fifty'], [60, 'sixty'], [80, 'eighty'],
  [90, 'ninety'], [100, 'a hundred'],
]

/** Duitse lidwoorden bij woorden die Wassima in haar boek tegenkomt. */
const DUITS_LIDWOORD: ReadonlyArray<readonly [string, 'der' | 'die' | 'das', string]> = [
  ['Haus', 'das', 'huis'], ['Schule', 'die', 'school'], ['Vater', 'der', 'vader'],
  ['Mutter', 'die', 'moeder'], ['Buch', 'das', 'boek'], ['Tisch', 'der', 'tafel'],
  ['Fenster', 'das', 'raam'], ['Stadt', 'die', 'stad'], ['Hund', 'der', 'hond'],
  ['Katze', 'die', 'kat'], ['Auto', 'das', 'auto'], ['Lehrer', 'der', 'leraar'],
  ['Tür', 'die', 'deur'], ['Kind', 'das', 'kind'], ['Bruder', 'der', 'broer'],
  ['Schwester', 'die', 'zus'],
]

/** Franse lidwoorden, idem. */
const FRANS_LIDWOORD: ReadonlyArray<readonly [string, 'le' | 'la', string]> = [
  ['maison', 'la', 'huis'], ['livre', 'le', 'boek'], ['table', 'la', 'tafel'],
  ['père', 'le', 'vader'], ['mère', 'la', 'moeder'], ['chien', 'le', 'hond'],
  ['voiture', 'la', 'auto'], ['école', 'la', 'school'], ['frère', 'le', 'broer'],
  ['sœur', 'la', 'zus'], ['jardin', 'le', 'tuin'], ['fenêtre', 'la', 'raam'],
  ['garçon', 'le', 'jongen'], ['fille', 'la', 'meisje'], ['professeur', 'le', 'leraar'],
  ['ville', 'la', 'stad'],
]

/** Molmassa's, afgerond zoals in Binas. */
const MOLMASSA: ReadonlyArray<readonly [string, string, number]> = [
  ['H₂O', 'water', 18.02], ['CO₂', 'koolstofdioxide', 44.01], ['NaCl', 'keukenzout', 58.44],
  ['O₂', 'zuurstof', 32.00], ['CH₄', 'methaan', 16.04], ['NH₃', 'ammoniak', 17.03],
  ['C₆H₁₂O₆', 'glucose', 180.16], ['H₂SO₄', 'zwavelzuur', 98.08], ['CaCO₃', 'kalk', 100.09],
  ['N₂', 'stikstof', 28.02],
]

/** Woorden om op alfabet te zetten. De proef sorteert ze zelf, dus deze lijst
 *  hoeft alleen maar uit losse woorden te bestaan. */
const ALFABET = ['meeuw', 'meel', 'meisje', 'maan', 'modder', 'mist', 'markt', 'muur',
  'kabel', 'kaars', 'kist', 'koffer', 'kraan', 'krijt', 'zeep', 'zolder', 'zomer', 'zwaan',
  'appel', 'anker', 'adem', 'auto', 'berg', 'brood', 'bezem', 'bloem'] as const

/**
 * De woordlijsten, bij elkaar, voor de proef. Die controleert wat er mechanisch
 * aan te controleren valt: geen dubbele regels, een afleider die echt verschilt,
 * een antwoord dat tussen de opties staat. De betekenis zelf is met de hand
 * nagelopen — dat kan een proef niet voor je doen.
 */
export const LIJSTEN = {
  EIIJ, AUOU, DOFT, KLEIN, MEERVOUD, KLANK, NGNK, CHT, HAK, SAMEN,
  SYNONIEM, ANTONIEM, WOORDSOORT, WOORDSOORTEN, ONDERWERP, ENGELS_GETAL,
  DUITS_LIDWOORD, FRANS_LIDWOORD, MOLMASSA, ALFABET,
} as const

/**
 * De tweede voorraad sjablonen, met het toeval erin gehangen.
 *
 * Dezelfde vorm als `sjablonen()`: `ri`, `pick` en `shuffle` staan als gewone
 * namen in bereik, zodat elke sjabloonbody op zichzelf te lezen is.
 */
export function extraSjablonen(R: Toeval): Sjabloon[] {
  const { ri, pick, shuffle } = R
  return [
  /* ===================================================== Selma · groep 5 === */
  {id:'xs_deelrest',p:'selma',v:'rekenen',t:'Delen met rest',lvl:2,gen:()=>{
    const b=ri(3,9), q=ri(3,12), r=ri(1,b-1), a=b*q+r;
    return {q:`Je verdeelt ${a} knikkers eerlijk over ${b} kinderen. Hoeveel knikkers houd je over?`,
      a:String(r),h:[`Hoe vaak past ${b} helemaal in ${a}?`,`${b} × ${q} = ${b*q}.`],
      s:`${b} × ${q} = ${b*q}.\n${a} − ${b*q} = ${r}.\nElk kind krijgt er ${q} en je houdt ${r} over.`};
  }},
  {id:'xs_deelheel',p:'selma',v:'rekenen',t:'Delen met rest',lvl:2,gen:()=>{
    const b=ri(3,9), q=ri(3,12), r=ri(1,b-1), a=b*q+r;
    return {q:`Hoe vaak past ${b} helemaal in ${a}?`,a:String(q),
      h:[`Tel met sprongen van ${b} omhoog.`,`${b} × ${q} = ${b*q}, en dat past nog.`],
      s:`${b} × ${q} = ${b*q}, dat past.\n${b} × ${q+1} = ${b*(q+1)}, dat is te veel.\nDus ${b} past ${q} keer, met ${r} over.`};
  }},
  {id:'xs_keergroter',p:'selma',v:'rekenen',t:'Vermenigvuldigen (groter)',lvl:2,gen:()=>{
    const a=ri(12,48), b=ri(3,9), t=Math.floor(a/10)*10, e=a-t;
    return {q:`Reken uit: ${a} × ${b}`,a:String(a*b),
      h:[`Splits ${a} in ${t} en ${e}.`,`Doe ${t} × ${b} en ${e} × ${b} apart.`],
      s:`${t} × ${b} = ${t*b}\n${e} × ${b} = ${e*b}\n${t*b} + ${e*b} = ${a*b}.`};
  }},
  {id:'xs_evenoneven',p:'selma',v:'rekenen',t:'Even & oneven',lvl:1,gen:()=>{
    const n=ri(11,99), even=n%2===0;
    return {q:`Is ${n} even of oneven?`,a:even?'even':'oneven',opties:['even','oneven'],
      h:['Kijk alleen naar het laatste cijfer.','0, 2, 4, 6 en 8 zijn even.'],
      s:`Het laatste cijfer van ${n} is ${n%10}.\nDat cijfer is ${even?'even':'oneven'}, dus ${n} is ${even?'even':'oneven'}.`};
  }},
  {id:'xs_rij',p:'selma',v:'rekenen',t:'Rijen & patronen',lvl:2,gen:()=>{
    const start=ri(2,20), stap=pick([2,3,4,5,10]), r=[0,1,2,3].map((i)=>start+i*stap);
    return {q:`Welk getal komt hierna? ${r.join(', ')}, ...`,a:String(start+4*stap),
      h:['Kijk hoeveel erbij komt van het ene getal naar het volgende.',`Er komt steeds ${stap} bij.`],
      s:`Van ${r[0]} naar ${r[1]} is + ${stap}.\n${r[3]} + ${stap} = ${start+4*stap}.`};
  }},
  {id:'xs_plaatswaarde',p:'selma',v:'rekenen',t:'Getallen tot 100.000',lvl:2,gen:()=>{
    const n=ri(10000,99999);
    const plek=pick([['tienduizendtallen',10000],['duizendtallen',1000],['honderdtallen',100],['tientallen',10]] as const);
    const cijfer=Math.floor(n/plek[1])%10;
    return {q:`Welk cijfer staat in de ${plek[0]} van ${n}?`,a:String(cijfer),
      h:['Tel van rechts naar links: eenheden, tientallen, honderdtallen, duizendtallen.'],
      s:`${n} = ${mv(Math.floor(n/10000),'tienduizendtal','tienduizendtallen')}, `
        +`${mv(Math.floor(n/1000)%10,'duizendtal','duizendtallen')}, `
        +`${mv(Math.floor(n/100)%10,'honderdtal','honderdtallen')}, `
        +`${mv(Math.floor(n/10)%10,'tiental','tientallen')} en ${mv(n%10,'eenheid','eenheden')}.\n`
        +`In de ${plek[0]} staat dus een ${cijfer}.`};
  }},
  {id:'xs_tabel',p:'selma',v:'rekenen',t:'Tabellen & grafieken',lvl:2,gen:()=>{
    const dagen=['maandag','dinsdag','woensdag','donderdag'] as const;
    const v=dagen.map(()=>ri(3,18));
    const totaal=v.reduce((s,x)=>s+x,0);
    return {q:`In de tabel staat hoeveel bladzijden Selma las: `
      +dagen.map((d,i)=>`${d} ${v[i]}`).join(', ')+`. Hoeveel bladzijden las ze samen?`,
      a:String(totaal),h:['Tel alle getallen uit de tabel bij elkaar op.'],
      s:`${v.join(' + ')} = ${totaal} bladzijden.`};
  }},
  {id:'xs_hokjes',p:'selma',v:'rekenen',t:'Oppervlakte (hokjes)',lvl:1,gen:()=>{
    const l=ri(3,9), b=ri(2,7);
    return {q:`Een rechthoek is ${l} hokjes lang en ${b} hokjes breed. Uit hoeveel hokjes bestaat hij?`,
      a:String(l*b),h:['Elke rij heeft evenveel hokjes.',`${b} rijen van ${l} hokjes.`],
      s:`${b} rijen van ${l} hokjes: ${b} × ${l} = ${l*b} hokjes.`};
  }},
  /* ----- Selma · taal ----- */
  {id:'xs_eiij',p:'selma',v:'taal',t:'ei of ij',lvl:2,gen:()=>{
    const w=pick(EIIJ), ij=w.includes('ij');
    const fout=ij?w.replace('ij','ei'):w.replace('ei','ij');
    return {q:'Welk woord is goed geschreven?',a:w,opties:shuffle([w,fout]),
      h:['Eén van de twee bestaat niet.','Zeg ze allebei hardop.'],
      s:`Het is "${w}", met de ${ij?'lange ij':'korte ei'}.\n"${fout}" bestaat niet.`};
  }},
  {id:'xs_auou',p:'selma',v:'taal',t:'au of ou',lvl:2,gen:()=>{
    const w=pick(AUOU), au=w.includes('au');
    const fout=au?w.replace('au','ou'):w.replace('ou','au');
    return {q:'Welk woord is goed geschreven?',a:w,opties:shuffle([w,fout]),
      h:['Eén van de twee bestaat niet.','Deze woorden leer je uit je hoofd.'],
      s:`Het is "${w}", met de ${au?'au':'ou'}.\n"${fout}" bestaat niet.`};
  }},
  {id:'xs_doft',p:'selma',v:'taal',t:'d of t aan het eind',lvl:2,gen:()=>{
    const paar=pick(DOFT), enk=paar[0], mv=paar[1];
    const laatste=enk.slice(-1);
    const fout=enk.slice(0,-1)+(laatste==='d'?'t':'d');
    return {q:`Het meervoud is "${mv}". Hoe schrijf je het enkelvoud?`,a:enk,opties:shuffle([enk,fout]),
      h:['Maak het woord langer en luister welke letter je dan hoort.'],
      s:`In "${mv}" hoor je een ${laatste}.\nDus het enkelvoud schrijf je met een ${laatste}: "${enk}".`};
  }},
  {id:'xs_verkleinwoord',p:'selma',v:'taal',t:'Verkleinwoorden',lvl:1,gen:()=>{
    const paar=pick(KLEIN);
    return {q:`Wat is het verkleinwoord van "${paar[0]}"?`,a:paar[1],
      h:['Er komt -je, -tje, -pje of -etje achter.'],s:`${paar[0]} → ${paar[1]}.`};
  }},
  {id:'xs_meervoud',p:'selma',v:'taal',t:'Meervoud',lvl:1,gen:()=>{
    const paar=pick(MEERVOUD);
    return {q:`Wat is het meervoud van "${paar[0]}"?`,a:paar[1],
      h:['Zeg het hardop: hoor je een korte of een lange klank?'],s:`${paar[0]} → ${paar[1]}.`};
  }},
  {id:'xs_klank',p:'selma',v:'taal',t:'Korte en lange klank',lvl:2,gen:()=>{
    const paar=pick(KLANK);
    return {q:`Heeft "${paar[0]}" een korte of een lange klank?`,a:paar[1],
      opties:['korte klank','lange klank'],
      h:['Zeg het woord hardop en luister naar de klinker.'],
      s:`"${paar[0]}" heeft een ${paar[1]}.\nBij een korte klank verdubbel je de medeklinker in het meervoud; bij een lange klank haal je juist een klinker weg.`};
  }},
  {id:'xs_ngnk',p:'selma',v:'taal',t:'ng of nk',lvl:1,gen:()=>{
    const r=pick(NGNK);
    return {q:`Vul in: ${r[0]}`,a:r[1],opties:shuffle([r[1],r[2]]),
      h:['Zeg de zin hardop met allebei de woorden.'],
      s:`In deze zin hoort "${r[1]}".`};
  }},
  {id:'xs_cht',p:'selma',v:'taal',t:'cht-woorden',lvl:2,gen:()=>{
    const r=pick(CHT), fout=r[1].replace('cht','gt');
    return {q:`Vul in: ${r[0]}`,a:r[1],opties:shuffle([r[1],fout]),
      h:['Je hoort "gt", maar je schrijft bijna altijd "cht".'],
      s:`Het is "${r[1]}". Woorden met deze klank schrijf je met cht; "${fout}" bestaat niet.\nDe bekende uitzonderingen zijn woorden als "zegt" en "legt".`};
  }},
  {id:'xs_hak',p:'selma',v:'taal',t:'Hakwoorden & klankgroepen',lvl:2,gen:()=>{
    const r=pick(HAK);
    return {q:`In hoeveel klankgroepen hak je "${r[0]}"?`,a:String(r[1]),
      h:['Klap het woord hardop mee.'],s:`"${r[0]}" heeft ${r[1]} klankgroepen.`};
  }},
  {id:'xs_samenstelling',p:'selma',v:'taal',t:'Samenstellingen',lvl:1,gen:()=>{
    const r=pick(SAMEN);
    return {q:`Maak er één woord van: ${r[0]} + ${r[1]}`,a:r[0]+r[1],
      h:['Een samenstelling schrijf je aan elkaar.'],s:`${r[0]} + ${r[1]} = ${r[0]+r[1]}.`};
  }},
  /* ===================================================== Amine · groep 8 === */
  {id:'xa_coordinaten',p:'amine',v:'rekenen',t:'Coördinaten',lvl:1,gen:()=>{
    const x=ri(1,9), y=ri(1,9);
    return {q:`Vanaf de oorsprong ga je ${x} naar rechts en ${y} omhoog. Wat zijn de coördinaten van dat punt? Schrijf ze als (x, y).`,
      a:`(${x}, ${y})`,alt:[`${x},${y}`,`(${x},${y})`],
      h:['Eerst hoe ver naar rechts, dan hoe ver omhoog.'],
      s:`Eerst de x: ${x} naar rechts.\nDan de y: ${y} omhoog.\nDus (${x}, ${y}).`};
  }},
  {id:'xa_geld',p:'amine',v:'rekenen',t:'Geld',lvl:2,gen:()=>{
    const n=ri(2,4), p=pick([1.25,1.5,1.75,2.25,2.5]), tot=eur(n*p), terug=eur(20-tot);
    return {q:`Je koopt ${n} broden van € ${geld(p)} en betaalt met € 20. Hoeveel krijg je terug?`,
      a:nl(terug),u:'€',h:[`Reken eerst uit wat ${n} broden samen kosten.`],
      s:`${n} × ${geld(p)} = € ${geld(tot)}.\n20,00 − ${geld(tot)} = € ${geld(terug)}.`};
  }},
  {id:'xa_tijd',p:'amine',v:'rekenen',t:'Tijd',lvl:2,gen:()=>{
    const u=ri(1,5), m=pick([5,10,15,20,25,35,40,45,50]);
    return {q:`Hoeveel minuten is ${u} uur en ${m} minuten?`,a:String(u*60+m),u:'minuten',
      h:['1 uur = 60 minuten.'],s:`${u} × 60 = ${u*60}.\n${u*60} + ${m} = ${u*60+m} minuten.`};
  }},
  {id:'xa_verbanden',p:'amine',v:'rekenen',t:'Verbanden',lvl:2,gen:()=>{
    const start=pick([3,4,5]), per=pick([1.5,2,2.5]), km=ri(4,15), tot=eur(start+per*km);
    return {q:`Een taxi rekent € ${geld(start)} instaptarief en daarnaast € ${geld(per)} per kilometer. Wat kost een rit van ${km} km?`,
      a:nl(tot),u:'€',h:['Eerst de kilometers, daarna het instaptarief erbij.',
        `${km} × ${geld(per)} = ${geld(eur(per*km))}.`],
      s:`${km} × ${geld(per)} = € ${geld(eur(per*km))}.\n${geld(eur(per*km))} + ${geld(start)} = € ${geld(tot)}.`};
  }},
  {id:'xa_formulex',p:'amine',v:'rekenen',t:'Formules met x',lvl:2,gen:()=>{
    const a=ri(2,9), b=ri(1,20), x=ri(2,12);
    return {q:`Gegeven y = ${a}x + ${b}. Bereken y als x = ${x}.`,a:String(a*x+b),
      h:[`Vul x = ${x} in.`,'Eerst keer, dan plus.'],
      s:`y = ${a} × ${x} + ${b}\n= ${a*x} + ${b}\n= ${a*x+b}.`};
  }},
  {id:'xa_hoeken',p:'amine',v:'rekenen',t:'Hoeken',lvl:2,gen:()=>{
    const a=ri(25,80), b=ri(25,80);
    return {q:`Twee hoeken van een driehoek zijn ${a}° en ${b}°. Hoe groot is de derde hoek?`,
      a:String(180-a-b),u:'°',h:['De hoeken van een driehoek zijn samen 180°.'],
      s:`${a} + ${b} = ${a+b}.\n180 − ${a+b} = ${180-a-b}°.`};
  }},
  {id:'xa_gemiddelde',p:'amine',v:'rekenen',t:'Gemiddelde',lvl:2,gen:()=>{
    const c=[0,0,0,0,0].map(()=>ri(4,10)), som=c.reduce((s,x)=>s+x,0), gem=Math.round(som/5*10)/10;
    return {q:`Amine haalt de cijfers ${c.join(', ')}. Wat is zijn gemiddelde?`,a:nl(gem),
      h:['Tel alles op en deel door hoeveel cijfers het zijn.'],
      s:`${c.join(' + ')} = ${som}.\n${som} ÷ 5 = ${nl(gem)}.`};
  }},
  {id:'xa_maten2',p:'amine',v:'rekenen',t:'Meten & meetkunde',lvl:2,gen:()=>{
    const o=pick([['dm²','cm²',100],['m²','dm²',100],['m²','cm²',10000]] as const), n=ri(2,9);
    return {q:`Hoeveel ${o[1]} is ${n} ${o[0]}?`,a:String(n*o[2]),u:o[1],
      h:[`1 ${o[0]} = ${o[2]} ${o[1]}.`,'Bij oppervlaktematen ga je met stappen van 100.'],
      s:`1 ${o[0]} = ${o[2]} ${o[1]}.\n${n} × ${o[2]} = ${n*o[2]} ${o[1]}.`};
  }},
  {id:'xa_schaal',p:'amine',v:'rekenen',t:'Schaal',lvl:3,gen:()=>{
    const s=pick([200,500,1000,2000,5000]), cm=ri(2,12), m=cm*s/100;
    return {q:`Op een kaart met schaal 1 : ${s} is een weg ${cm} cm lang. Hoeveel meter is dat in het echt?`,
      a:String(m),u:'m',h:[`1 cm op de kaart is ${s} cm in het echt.`,'100 cm = 1 m.'],
      s:`${cm} × ${s} = ${cm*s} cm.\n${cm*s} ÷ 100 = ${m} m.`};
  }},
  {id:'xa_inhoud',p:'amine',v:'rekenen',t:'Inhoud',lvl:2,gen:()=>{
    const r=ri(2,9);
    return {q:`Een kubus heeft ribben van ${r} cm. Bereken de inhoud.`,a:String(r*r*r),u:'cm³',
      h:['Inhoud = lengte × breedte × hoogte.','Bij een kubus zijn alle ribben even lang.'],
      s:`${r} × ${r} × ${r} = ${r*r*r} cm³.`};
  }},
  {id:'xa_meetkunde',p:'amine',v:'rekenen',t:'Meetkunde',lvl:1,gen:()=>{
    const z=ri(3,15);
    return {q:`Een vierkant heeft een omtrek van ${4*z} cm. Hoe lang is één zijde?`,a:String(z),u:'cm',
      h:['Een vierkant heeft vier even lange zijden.'],s:`${4*z} ÷ 4 = ${z} cm.`};
  }},
  {id:'xa_negatief',p:'amine',v:'rekenen',t:'Negatieve getallen',lvl:2,gen:()=>{
    const t1=ri(-4,8), d=ri(5,15);
    return {q:`Het is ${t1} °C. Het wordt ${d} graden kouder. Hoeveel graden is het dan?`,
      a:String(t1-d),u:'°C',h:['Tel op de getallenlijn naar links.',`Vanaf ${t1} ga je ${d} stappen omlaag.`],
      s:`${t1} − ${d} = ${t1-d} °C.`};
  }},
  {id:'xa_driehoek',p:'amine',v:'rekenen',t:'Oppervlakte & omtrek',lvl:2,gen:()=>{
    const b=2*ri(2,9), h=ri(3,12);
    return {q:`Een driehoek heeft een basis van ${b} cm en een hoogte van ${h} cm. Bereken de oppervlakte.`,
      a:String(b*h/2),u:'cm²',h:['oppervlakte driehoek = basis × hoogte ÷ 2.'],
      s:`${b} × ${h} = ${b*h}.\n${b*h} ÷ 2 = ${b*h/2} cm².`};
  }},
  {id:'xa_omtrek',p:'amine',v:'rekenen',t:'Oppervlakte & omtrek',lvl:1,gen:()=>{
    const l=ri(4,20), b=ri(3,15);
    return {q:`Een rechthoek is ${l} cm lang en ${b} cm breed. Bereken de omtrek.`,
      a:String(2*(l+b)),u:'cm',h:['omtrek = 2 × (lengte + breedte).'],
      s:`${l} + ${b} = ${l+b}.\n2 × ${l+b} = ${2*(l+b)} cm.`};
  }},
  {id:'xa_klok',p:'amine',v:'rekenen',t:'Tijd & klok',lvl:2,gen:()=>{
    const h1=ri(6,20), m1=pick([0,10,15,20,25,30,40,45,50]), d=pick([20,25,35,40,50,55,70,85]);
    const totaal=h1*60+m1+d, hh=Math.floor(totaal/60)%24, mm=totaal%60;
    return {q:`Een trein vertrekt om ${klok(h1,m1)} en doet er ${d} minuten over. Hoe laat komt hij aan?`,
      a:klok(hh,mm),alt:[`${hh}.${String(mm).padStart(2,'0')}`],
      h:['Tel eerst de hele uren erbij, dan de losse minuten.'],
      s:`${klok(h1,m1)} + ${d} minuten.\n${h1*60+m1} + ${d} = ${totaal} minuten na middernacht.\n${totaal} ÷ 60 = ${Math.floor(totaal/60)} uur en ${mm} minuten → ${klok(hh,mm)}.`};
  }},
  {id:'xa_breukdeel',p:'amine',v:'rekenen',t:'Breuken',lvl:2,gen:()=>{
    const n=pick([2,3,4,5,6,8,10]), t=ri(1,n-1), g=n*ri(2,12);
    return {q:`Hoeveel is ${t}/${n} van ${g}?`,a:String(g*t/n),
      h:[`Deel eerst door ${n}, vermenigvuldig daarna met ${t}.`],
      s:`${g} ÷ ${n} = ${g/n}.\n${g/n} × ${t} = ${g*t/n}.`};
  }},
  {id:'xa_breukvereenvoudig',p:'amine',v:'rekenen',t:'Breuken',lvl:3,gen:()=>{
    const pq=pick([[1,2],[1,3],[2,3],[1,4],[3,4],[1,5],[2,5],[3,5],[4,5],[1,6],[5,6],[3,8],[5,8],[7,8]] as const);
    const k=ri(2,9), p=pq[0], q=pq[1];
    return {q:`Vereenvoudig de breuk ${p*k}/${q*k}. Schrijf je antwoord als breuk, bijvoorbeeld 3/4.`,
      a:`${p}/${q}`,h:[`Door welk getal kun je ${p*k} én ${q*k} delen?`,`Deel allebei door ${k}.`],
      s:`${p*k} ÷ ${k} = ${p} en ${q*k} ÷ ${k} = ${q}.\nDus ${p*k}/${q*k} = ${p}/${q}.`};
  }},
  {id:'xa_grafiek',p:'amine',v:'rekenen',t:'Grafieken & tabellen',lvl:2,gen:()=>{
    const dag=['maandag','dinsdag','woensdag','donderdag','vrijdag'] as const;
    const v=dag.map(()=>ri(2,28)), hoog=Math.max(...v), laag=Math.min(...v);
    return {q:`In de grafiek staat het aantal bezoekers per dag: `
      +dag.map((d,i)=>`${d} ${v[i]}`).join(', ')+`. Hoeveel scheelt de drukste dag met de rustigste?`,
      a:String(hoog-laag),h:['Zoek eerst de hoogste en de laagste waarde.'],
      s:`Hoogste: ${hoog}. Laagste: ${laag}.\n${hoog} − ${laag} = ${hoog-laag}.`};
  }},
  {id:'xa_redactie',p:'amine',v:'rekenen',t:'Redactiesommen',lvl:3,gen:()=>{
    const k=pick([20,24,25,30]), p=ri(3,9), perKind=ri(2,6), bus=k*perKind;
    return {q:`Een klas van ${k} kinderen gaat op excursie. Een kaartje kost € ${p} per kind en de bus kost samen € ${bus}. Hoeveel betaalt elk kind als ze alles eerlijk delen?`,
      a:String(p+perKind),u:'€',h:['Verdeel eerst de bus over de kinderen.',`${bus} ÷ ${k} = ${perKind}.`],
      s:`De bus per kind: ${bus} ÷ ${k} = € ${perKind}.\nSamen met het kaartje: ${p} + ${perKind} = € ${p+perKind}.`};
  }},
  {id:'xa_afronden100',p:'amine',v:'rekenen',t:'Afronden & schatten',lvl:2,gen:()=>{
    const n=ri(120,9800), r=Math.round(n/100)*100;
    return {q:`Rond af op honderdtallen: ${n}`,a:String(r),
      h:['Kijk naar het cijfer van de tientallen: 5 of meer → naar boven.'],
      s:`Het tiental van ${n} is ${Math.floor(n/10)%10}, dus ${Math.floor(n/10)%10>=5?'naar boven':'naar beneden'}.\n${n} → ${r}.`};
  }},
  /* ----- Amine · taal, Engels en studievaardigheden ----- */
  {id:'xa_synoniem',p:'amine',v:'taal',t:'Synoniemen & antoniemen',lvl:2,gen:()=>{
    const r=pick(SYNONIEM);
    return {q:`Welk woord betekent ongeveer hetzelfde als "${r[0]}"?`,a:r[1],
      opties:shuffle([r[1],r[2],r[3]]),h:['Zoek het woord dat je op dezelfde plek in een zin kunt zetten.'],
      s:`"${r[0]}" en "${r[1]}" betekenen ongeveer hetzelfde.`};
  }},
  {id:'xa_antoniem',p:'amine',v:'taal',t:'Synoniemen & antoniemen',lvl:2,gen:()=>{
    const r=pick(ANTONIEM);
    return {q:`Wat is het tegenovergestelde van "${r[0]}"?`,a:r[1],
      opties:shuffle([r[1],r[2],r[3]]),h:['Zoek het woord dat er precies tegenin gaat.'],
      s:`Het tegenovergestelde van "${r[0]}" is "${r[1]}".`};
  }},
  {id:'xa_woordsoort',p:'amine',v:'taal',t:'Woordsoorten',lvl:2,gen:()=>{
    const r=pick(WOORDSOORT);
    const anders=shuffle(WOORDSOORTEN.filter((w)=>w!==r[2])).slice(0,2);
    return {q:`"${r[0]}" — welke woordsoort is "${r[1]}" in deze zin?`,a:r[2],
      opties:shuffle([r[2],...anders]),
      h:['Vraag je af wat het woord doet: noemt het een ding, een handeling of een eigenschap?'],
      s:`"${r[1]}" is hier een ${r[2]}.`};
  }},
  {id:'xa_onderwerp',p:'amine',v:'taal',t:'Zinsontleden',lvl:2,gen:()=>{
    const r=pick(ONDERWERP);
    return {q:`Wat is het onderwerp in deze zin? "${r[0]}"`,a:r[1],opties:shuffle([r[1],r[2],r[3]]),
      h:[`Zoek eerst het werkwoord: "${r[3]}".`,`Vraag dan: wie of wat ${r[3]}?`],
      s:`Het werkwoord is "${r[3]}".\nWie of wat ${r[3]}? — ${r[1]}. Dat is het onderwerp.`};
  }},
  {id:'xa_engelsgetal',p:'amine',v:'engels',t:'Getallen',lvl:2,gen:()=>{
    const r=pick(ENGELS_GETAL);
    return {q:`How do you write ${r[0]} in English?`,a:r[1],
      h:['Let op de spelling.'],s:`${r[0]} = ${r[1]}.`};
  }},
  {id:'xa_alfabet',p:'amine',v:'studievaardigheden',t:'Alfabetiseren',lvl:2,gen:()=>{
    const drie=shuffle(ALFABET).slice(0,3);
    const eerste=[...drie].sort()[0] as string;
    return {q:`Welk woord staat vooraan in het woordenboek? ${drie.join(', ')}`,a:eerste,
      opties:[...drie],h:['Vergelijk eerst de eerste letter; zijn die gelijk, dan de tweede.'],
      s:`Op alfabet: ${[...drie].sort().join(' – ')}.\nDus "${eerste}" staat vooraan.`};
  }},
  {id:'xa_eeuw',p:'amine',v:'studievaardigheden',t:'Tijdlijn',lvl:2,gen:()=>{
    const j=ri(1101,2000), eeuw=Math.ceil(j/100);
    return {q:`In welke eeuw valt het jaar ${j}? Geef alleen het getal.`,a:String(eeuw),
      h:['De jaren 1 tot en met 100 zijn de 1e eeuw.','Neem de eerste twee cijfers en tel er 1 bij op — behalve bij een rond honderdtal.'],
      s:`${j} valt tussen ${(eeuw-1)*100+1} en ${eeuw*100}.\nDat is de ${eeuw}e eeuw.`};
  }},
  /* ==================================================== Wassima · 2 havo === */
  {id:'xw_gemiddelde',p:'wassima',v:'wiskunde',t:'Statistiek',lvl:1,gen:()=>{
    const c=[0,0,0,0,0,0].map(()=>ri(2,10)), som=c.reduce((s,x)=>s+x,0), gem=rond(som/6,2);
    return {q:`Bereken het gemiddelde van ${c.join(', ')}.`,a:nl(gem),
      h:['Tel alles op en deel door het aantal getallen.'],
      s:`${c.join(' + ')} = ${som}.\n${som} ÷ 6 = ${nl(gem)}.`};
  }},
  {id:'xw_mediaan',p:'wassima',v:'wiskunde',t:'Statistiek',lvl:2,gen:()=>{
    const c=[0,0,0,0,0].map(()=>ri(1,30)), gesorteerd=[...c].sort((a,b)=>a-b);
    return {q:`Bereken de mediaan van ${c.join(', ')}.`,a:String(gesorteerd[2]),
      h:['Zet de getallen eerst op volgorde.','De mediaan is het middelste getal.'],
      s:`Op volgorde: ${gesorteerd.join(', ')}.\nHet middelste getal is ${gesorteerd[2]}.`};
  }},
  {id:'xw_hoeken',p:'wassima',v:'wiskunde',t:'Hoeken',lvl:1,gen:()=>{
    const a=ri(20,160);
    return {q:`Twee hoeken liggen naast elkaar op een rechte lijn. De ene is ${a}°. Hoe groot is de andere?`,
      a:String(180-a),u:'°',h:['Een gestrekte hoek is 180°.'],s:`180 − ${a} = ${180-a}°.`};
  }},
  {id:'xw_schaal',p:'wassima',v:'wiskunde',t:'Verhoudingen & schaal',lvl:2,gen:()=>{
    const s=pick([500,1000,2500,5000,25000]), cm=ri(2,16), m=cm*s/100;
    return {q:`Op een kaart met schaal 1 : ${s} is een pad ${cm} cm lang. Hoeveel meter is dat in werkelijkheid?`,
      a:String(m),u:'m',h:[`1 cm op de kaart is ${s} cm in het echt.`,'Deel daarna door 100 voor meters.'],
      s:`${cm} × ${s} = ${cm*s} cm.\n${cm*s} ÷ 100 = ${m} m.`};
  }},
  {id:'xw_snelheid',p:'wassima',v:'natuurkunde',t:'Beweging (afstand-tijd)',lvl:2,gen:()=>{
    const v=ri(3,25), t=ri(4,30), s2=v*t;
    return {q:`Een fietser legt ${s2} m af in ${t} s. Bereken zijn gemiddelde snelheid.`,
      a:String(v),u:'m/s',h:['v = s ÷ t.'],s:`v = ${s2} ÷ ${t} = ${v} m/s.`};
  }},
  {id:'xw_druk',p:'wassima',v:'natuurkunde',t:'Druk',lvl:2,gen:()=>{
    const F=pick([20,40,50,100,200,250,400]), A=pick([0.02,0.05,0.1,0.25,0.5]), p2=Math.round(F/A);
    return {q:`Een kracht van ${F} N drukt op een oppervlak van ${nl(A)} m². Bereken de druk.`,
      a:String(p2),u:'Pa',h:['p = F ÷ A.','1 Pa = 1 N/m².'],
      s:`p = ${F} ÷ ${nl(A)} = ${p2} Pa.`};
  }},
  {id:'xw_serie',p:'wassima',v:'natuurkunde',t:'Elektrische schakelingen',lvl:1,gen:()=>{
    const r1=ri(2,40), r2=ri(2,40);
    return {q:`Twee weerstanden van ${r1} Ω en ${r2} Ω staan in serie. Bereken de vervangingsweerstand.`,
      a:String(r1+r2),u:'Ω',h:['In serie tel je de weerstanden op.'],
      s:`R = ${r1} + ${r2} = ${r1+r2} Ω.`};
  }},
  {id:'xw_ohm',p:'wassima',v:'natuurkunde',t:'Stroom & spanning',lvl:2,gen:()=>{
    const I=pick([0.2,0.5,1,1.5,2,2.5]), R2=ri(4,40), U=rond(I*R2,2);
    return {q:`Door een weerstand van ${R2} Ω loopt een stroom van ${nl(I)} A. Bereken de spanning.`,
      a:nl(U),u:'V',h:['U = I × R.'],s:`U = ${nl(I)} × ${R2} = ${nl(U)} V.`};
  }},
  {id:'xw_energie',p:'wassima',v:'natuurkunde',t:'Energie & vermogen',lvl:2,gen:()=>{
    const P=pick([40,60,100,500,1000,1500,2000]), t=ri(10,600), E=P*t;
    return {q:`Een apparaat van ${P} W staat ${t} s aan. Hoeveel energie gebruikt het?`,
      a:String(E),u:'J',h:['E = P × t, met t in seconden.'],s:`E = ${P} × ${t} = ${E} J.`};
  }},
  {id:'xw_warmte',p:'wassima',v:'natuurkunde',t:'Temperatuur & warmte',lvl:3,gen:()=>{
    const m=ri(1,5), dT=ri(5,50), Q=4180*m*dT;
    return {q:`Hoeveel warmte is er nodig om ${m} kg water ${dT} °C op te warmen? Neem c = 4180 J/(kg·°C).`,
      a:String(Q),u:'J',h:['Q = c × m × ΔT.'],s:`Q = 4180 × ${m} × ${dT} = ${Q} J.`};
  }},
  {id:'xw_veer',p:'wassima',v:'natuurkunde',t:'Veerkracht',lvl:2,gen:()=>{
    const C=ri(10,60), u=pick([0.05,0.1,0.15,0.2,0.25]), F=rond(C*u,2);
    return {q:`Een veer met veerconstante ${C} N/m wordt ${nl(u)} m uitgerekt. Bereken de veerkracht.`,
      a:nl(F),u:'N',h:['F = C × u.','Let op: u in meters.'],s:`F = ${C} × ${nl(u)} = ${nl(F)} N.`};
  }},
  {id:'xw_geluid',p:'wassima',v:'natuurkunde',t:'Geluid',lvl:2,gen:()=>{
    const t=ri(2,12), v=340, s2=v*t;
    return {q:`Geluid legt in lucht ongeveer 340 m per seconde af. Hoe ver komt het geluid in ${t} s?`,
      a:String(s2),u:'m',h:['s = v × t.'],s:`s = 340 × ${t} = ${s2} m.`};
  }},
  {id:'xw_btw',p:'wassima',v:'economie',t:'Geld & rekenen',lvl:2,gen:()=>{
    const prijs=100*ri(1,9), incl=eur(prijs*1.21);
    return {q:`Een product kost € ${prijs} exclusief btw. De btw is 21%. Wat kost het inclusief btw?`,
      a:nl(incl),u:'€',h:['Inclusief btw = × 1,21.'],
      s:`21% van ${prijs} = ${geld(eur(prijs*0.21))}.\n${prijs},00 + ${geld(eur(prijs*0.21))} = € ${geld(incl)}.`};
  }},
  {id:'xw_rente',p:'wassima',v:'economie',t:'Sparen & rente',lvl:2,gen:()=>{
    const bedrag=100*ri(2,20), pct=pick([1,2,2.5,3,4,5]), rente=eur(bedrag*pct/100);
    return {q:`Je zet € ${bedrag} op een spaarrekening met ${nl(pct)}% rente per jaar. Hoeveel rente krijg je na één jaar?`,
      a:nl(rente),u:'€',h:[`${nl(pct)}% van ${bedrag} uitrekenen.`],
      s:`${nl(pct)}% van ${bedrag} = ${bedrag} × ${nl(pct/100)} = € ${geld(rente)}.`};
  }},
  {id:'xw_eeuw',p:'wassima',v:'geschiedenis',t:'Tijd & eeuwen',lvl:1,gen:()=>{
    const j=ri(1201,1999), eeuw=Math.ceil(j/100);
    return {q:`In welke eeuw valt het jaar ${j}? Geef alleen het getal.`,a:String(eeuw),
      h:['De jaren 1 tot en met 100 vormen de 1e eeuw.'],
      s:`${j} ligt tussen ${(eeuw-1)*100+1} en ${eeuw*100}: de ${eeuw}e eeuw.`};
  }},
  {id:'xw_duitslidwoord',p:'wassima',v:'duits',t:'Lidwoorden (der/die/das)',lvl:2,gen:()=>{
    const r=pick(DUITS_LIDWOORD);
    return {q:`Welk lidwoord hoort bij "${r[0]}" (${r[2]})?`,a:r[1],opties:['der','die','das'],
      h:['Het lidwoord leer je bij het woord, niet uit een regel.'],
      s:`Het is ${r[1]} ${r[0]} — Nederlands: de/het ${r[2]}.`};
  }},
  {id:'xw_franslidwoord',p:'wassima',v:'frans',t:'Lidwoorden (le/la)',lvl:2,gen:()=>{
    const r=pick(FRANS_LIDWOORD);
    return {q:`Welk lidwoord hoort bij "${r[0]}" (${r[2]})?`,a:r[1],opties:['le','la'],
      h:['Le is mannelijk, la is vrouwelijk.'],
      s:`Het is ${r[1]} ${r[0]} — Nederlands: de/het ${r[2]}.`};
  }},
  {id:'xw_zinsdeel',p:'wassima',v:'nederlands',t:'Zinsdelen',lvl:2,gen:()=>{
    const r=pick(ONDERWERP);
    return {q:`Wat is het onderwerp in deze zin? "${r[0]}"`,a:r[1],opties:shuffle([r[1],r[2],r[3]]),
      h:[`Zoek eerst de persoonsvorm: "${r[3]}".`,`Vraag dan: wie of wat ${r[3]}?`],
      s:`De persoonsvorm is "${r[3]}".\nWie of wat ${r[3]}? — ${r[1]}.`};
  }},
  /* ===================================================== Amaani · 5 vwo === */
  {id:'xm_groeifactor',p:'amaani',v:'wiskundeA',t:'Procenten & groeifactor',lvl:1,gen:()=>{
    const pct=pick([1,2,3,4,5,8,10,12,15,20,25]), omlaag=ri(0,1)===1;
    const g=rond(omlaag?1-pct/100:1+pct/100,4);
    return {q:`Een bedrag ${omlaag?'daalt':'groeit'} met ${pct}% per jaar. Wat is de groeifactor?`,
      a:nl(g),h:[`Groeifactor = 1 ${omlaag?'−':'+'} ${pct}/100.`],
      s:`g = 1 ${omlaag?'−':'+'} ${nl(pct/100)} = ${nl(g)}.`};
  }},
  {id:'xm_machten',p:'amaani',v:'wiskundeA',t:'Machten & exponenten',lvl:1,gen:()=>{
    const a=ri(2,9), n=ri(2,4);
    return {q:`Reken uit: ${a}${EXP[n]}`,a:String(a**n),
      h:[`${a}${EXP[n]} betekent ${a} ${n} keer met zichzelf vermenigvuldigen.`],
      s:`${Array(n).fill(a).join(' × ')} = ${a**n}.`};
  }},
  {id:'xm_vergelijking',p:'amaani',v:'wiskundeA',t:'Vergelijkingen oplossen',lvl:2,gen:()=>{
    const p1=ri(1,9); let p2=ri(1,9); if(p2===p1) p2=p1===9?1:p1+1;
    const groot=Math.max(p1,p2), klein=Math.min(p1,p2);
    return {q:`Los op: x² ${pm(-(p1+p2))}x ${pm(p1*p2)} = 0. Geef de grootste oplossing.`,
      a:String(groot),h:['Ontbind in factoren: welke twee getallen vermenigvuldig je tot '
        +`${p1*p2} en tel je op tot ${p1+p2}?`],
      s:`(x − ${klein})(x − ${groot}) = 0.\nDus x = ${klein} of x = ${groot}.\nDe grootste is ${groot}.`};
  }},
  {id:'xm_rij',p:'amaani',v:'wiskundeA',t:'Rijen',lvl:2,gen:()=>{
    const a1=ri(2,20), d=ri(2,9), n=ri(5,20);
    return {q:`Een rekenkundige rij begint met ${a1} en heeft verschil ${d}. Wat is de ${n}e term?`,
      a:String(a1+(n-1)*d),h:['aₙ = a₁ + (n − 1) × d.'],
      s:`a${n} = ${a1} + (${n} − 1) × ${d}\n= ${a1} + ${(n-1)*d}\n= ${a1+(n-1)*d}.`};
  }},
  {id:'xm_zwaarde',p:'amaani',v:'wiskundeA',t:'Normale verdeling',lvl:2,gen:()=>{
    const mu=10*ri(5,20), sd=pick([2,4,5,10,20]), k=pick([-2,-1.5,-1,0.5,1,1.5,2]);
    const x=rond(mu+k*sd,2);
    return {q:`Een normale verdeling heeft μ = ${mu} en σ = ${sd}. Bereken de z-waarde van x = ${nl(x)}.`,
      a:nl(k),h:['z = (x − μ) ÷ σ.'],
      s:`z = (${nl(x)} − ${mu}) ÷ ${sd}\n= ${nl(rond(x-mu,2))} ÷ ${sd}\n= ${nl(k)}.`};
  }},
  {id:'xm_verwachting',p:'amaani',v:'wiskundeA',t:'Verwachtingswaarde',lvl:2,gen:()=>{
    const pw=pick([0.1,0.2,0.25,0.4,0.5]), w=ri(2,20), v=ri(1,10);
    const E=rond(pw*w-(1-pw)*v,2);
    return {q:`Bij een spel win je € ${w} met kans ${nl(pw)} en verlies je € ${v} met kans ${nl(rond(1-pw,2))}. Wat is de verwachte opbrengst per spel?`,
      a:nl(E),u:'€',h:['Vermenigvuldig elke uitkomst met zijn kans en tel op.','Verlies telt negatief.'],
      s:`E = ${nl(pw)} × ${w} + ${nl(rond(1-pw,2))} × (−${v})\n= ${nl(rond(pw*w,2))} − ${nl(rond((1-pw)*v,2))}\n= ${nl(E)} euro.`};
  }},
  {id:'xm_log',p:'amaani',v:'wiskundeA',t:'Logaritmen (gevorderd)',lvl:2,gen:()=>{
    const g=pick([2,3,5,10]), k=ri(2,5);
    return {q:`Los op: ${g}^x = ${g**k}`,a:String(k),
      h:[`Hoe vaak moet je ${g} met zichzelf vermenigvuldigen om ${g**k} te krijgen?`,
        `x = ${g}log(${g**k}).`],
      s:`${Array(k).fill(g).join(' × ')} = ${g**k}.\nDus x = ${k}.`};
  }},
  {id:'xm_afgeleide',p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:3,gen:()=>{
    const a=ri(1,5), b=ri(-6,6), c=ri(-9,9), x=ri(1,6);
    const acc=3*a*x*x+2*b*x;
    return {q:`Gegeven f(x) = ${a}x³ ${pm(b)}x² ${pm(c)}. Bereken f'(${x}).`,a:String(acc),
      h:['Differentieer term voor term: de macht komt ervoor en gaat er één omlaag.',
        `f'(x) = ${3*a}x² ${pm(2*b)}x.`],
      s:`f'(x) = ${3*a}x² ${pm(2*b)}x\nf'(${x}) = ${3*a} × ${x*x} ${pm(2*b*x)} = ${3*a*x*x} ${pm(2*b*x)} = ${acc}.`};
  }},
  {id:'xm_expgroei',p:'amaani',v:'wiskundeA',t:'Exponentiële groei',lvl:2,gen:()=>{
    const b=100*ri(1,20), g=pick([1.05,1.1,1.2,0.9,0.8]), t=ri(2,6), eind=rond(b*g**t,2);
    return {q:`Een beginwaarde van ${b} verandert met groeifactor ${nl(g)} per jaar. Wat is de waarde na ${t} jaar? Rond af op twee decimalen.`,
      a:nl(eind),h:['eindwaarde = beginwaarde × groeifactor^tijd.'],
      s:`${b} × ${nl(g)}${EXP[t] ?? '^'+t} = ${nl(eind)}.`};
  }},
  {id:'xm_combinaties',p:'amaani',v:'wiskundeA',t:'Tellen (combinatoriek)',lvl:2,gen:()=>{
    const n=ri(5,10), k=ri(2,3), c=combinaties(n,k);
    return {q:`Uit ${n} personen kies je een groepje van ${k}. De volgorde doet er niet toe. Hoeveel groepjes zijn er?`,
      a:String(c),h:['Volgorde doet er niet toe → combinaties.',`C(${n}, ${k}) = ${n}! / (${k}! × ${n-k}!).`],
      s:`C(${n}, ${k}) = ${c}.`};
  }},
  {id:'xm_binomiaal',p:'amaani',v:'wiskundeA',t:'Binomiale verdeling',lvl:3,gen:()=>{
    const n=ri(4,8), k=ri(1,n-1), kans=rond(combinaties(n,k)/2**n,3);
    return {q:`Je gooit ${n} keer met een eerlijke munt. Wat is de kans op precies ${k} keer kop? Rond af op drie decimalen.`,
      a:nl(kans),h:[`P(X = k) = C(${n}, ${k}) × 0,5^${n}.`,`C(${n}, ${k}) = ${combinaties(n,k)}.`],
      s:`P(X = ${k}) = ${combinaties(n,k)} × 0,5^${n}\n= ${combinaties(n,k)} ÷ ${2**n}\n= ${nl(kans)}.`};
  }},
  {id:'xm_pyth',p:'amaani',v:'wiskundeA',t:'Meetkunde',lvl:1,gen:()=>{
    const tr=pick([[3,4,5],[6,8,10],[5,12,13],[8,15,17],[9,12,15],[7,24,25]] as const);
    return {q:`Een rechthoekige driehoek heeft rechthoekszijden van ${tr[0]} en ${tr[1]}. Bereken de schuine zijde.`,
      a:String(tr[2]),h:['a² + b² = c².'],
      s:`c = √(${tr[0]}² + ${tr[1]}²) = √${tr[0]**2+tr[1]**2} = ${tr[2]}.`};
  }},
  /* ----- Amaani · natuurkunde en scheikunde ----- */
  {id:'xm_kracht',p:'amaani',v:'natuurkunde',t:'Kracht & versnelling',lvl:2,gen:()=>{
    const m=pick([2,5,10,20,50,80,1200]), a=pick([0.5,1,1.5,2,2.5,3]), F=rond(m*a,2);
    return {q:`Een voorwerp van ${m} kg versnelt met ${nl(a)} m/s². Bereken de resulterende kracht.`,
      a:nl(F),u:'N',h:['F = m × a.'],s:`F = ${m} × ${nl(a)} = ${nl(F)} N.`};
  }},
  {id:'xm_zwaarte',p:'amaani',v:'natuurkunde',t:'Zwaartekracht',lvl:1,gen:()=>{
    const m=ri(2,90), Fz=rond(m*9.81,2);
    return {q:`Bereken de zwaartekracht op een massa van ${m} kg. Neem g = 9,81 m/s².`,
      a:nl(Fz),u:'N',h:['Fz = m × g.'],s:`Fz = ${m} × 9,81 = ${nl(Fz)} N.`};
  }},
  {id:'xm_ezwaarte',p:'amaani',v:'natuurkunde',t:'Energiebehoud',lvl:2,gen:()=>{
    const m=ri(1,20), h=ri(2,20), E=rond(m*9.81*h,1);
    return {q:`Hoeveel zwaarte-energie heeft ${m} kg op ${h} m hoogte? Neem g = 9,81 m/s².`,
      a:nl(E),u:'J',h:['Ez = m × g × h.'],s:`Ez = ${m} × 9,81 × ${h} = ${nl(E)} J.`};
  }},
  {id:'xm_vermogen',p:'amaani',v:'natuurkunde',t:'Vermogen',lvl:2,gen:()=>{
    const P=pick([50,100,250,500,1000,2000]), t=ri(5,120), E=P*t;
    return {q:`Een motor levert ${E} J in ${t} s. Bereken het vermogen.`,
      a:String(P),u:'W',h:['P = E ÷ t.'],s:`P = ${E} ÷ ${t} = ${P} W.`};
  }},
  {id:'xm_rendement',p:'amaani',v:'natuurkunde',t:'Rendement',lvl:2,gen:()=>{
    const eIn=100*ri(2,20), pct=pick([10,20,25,40,50,60,75,80]), nuttig=eIn*pct/100;
    return {q:`Een apparaat krijgt ${eIn} J en levert ${nuttig} J nuttige energie. Bereken het rendement.`,
      a:String(pct),u:'%',h:['rendement = nuttig ÷ toegevoerd × 100%.'],
      s:`${nuttig} ÷ ${eIn} = ${nl(pct/100)}.\n× 100% = ${pct}%.`};
  }},
  {id:'xm_halvering',p:'amaani',v:'natuurkunde',t:'Radioactiviteit',lvl:2,gen:()=>{
    const n=ri(1,5), rest=ri(10,200), N0=rest*2**n;
    return {q:`Van ${N0} radioactieve kernen zijn er na ${mv(n,'halveringstijd','halveringstijden')} nog hoeveel over?`,
      a:String(rest),h:['Na elke halveringstijd blijft de helft over.',
        `Na ${mv(n,'halveringstijd','halveringstijden')} is dat delen door ${2**n}.`],
      s:`${N0} ÷ ${2**n} = ${rest} kernen.`};
  }},
  {id:'xm_gaswet',p:'amaani',v:'natuurkunde',t:'Gaswet',lvl:3,gen:()=>{
    const p1=pick([1,2,4,5,10]), V1=pick([4,6,8,12]);
    /* Een deler van V1, zodat de nieuwe druk een heel getal is en de vraag geen
       afrondingsinstructie nodig heeft. */
    const V2=pick([1,2,3,4,6].filter((d)=>V1%d===0&&d<V1));
    const p2=p1*V1/V2;
    return {q:`Een gas heeft een druk van ${p1} bar bij een volume van ${V1} L. Bij gelijke temperatuur wordt het volume ${V2} L. Bereken de nieuwe druk.`,
      a:String(p2),u:'bar',h:['Bij gelijke temperatuur geldt p₁V₁ = p₂V₂.'],
      s:`p₂ = (${p1} × ${V1}) ÷ ${V2} = ${p1*V1} ÷ ${V2} = ${p2} bar.`};
  }},
  {id:'xm_warmte',p:'amaani',v:'natuurkunde',t:'Warmte',lvl:3,gen:()=>{
    const m=ri(1,8), dT=ri(5,60), Q=4180*m*dT;
    return {q:`Hoeveel warmte is er nodig om ${m} kg water ${dT} °C op te warmen? Neem c = 4180 J/(kg·K).`,
      a:String(Q),u:'J',h:['Q = c × m × ΔT.'],s:`Q = 4180 × ${m} × ${dT} = ${Q} J.`};
  }},
  {id:'xm_snelheid',p:'amaani',v:'natuurkunde',t:'Snelheid',lvl:1,gen:()=>{
    const v=ri(2,40), t=ri(3,60), s2=v*t;
    return {q:`Een voorwerp legt ${s2} m af in ${t} s. Bereken de gemiddelde snelheid.`,
      a:String(v),u:'m/s',h:['v = s ÷ t.'],s:`v = ${s2} ÷ ${t} = ${v} m/s.`};
  }},
  {id:'xm_beweging',p:'amaani',v:'natuurkunde',t:'Bewegingsvergelijkingen',lvl:3,gen:()=>{
    const a=pick([2,4,6,8,10]), t=ri(2,8), s2=rond(0.5*a*t*t,2);
    return {q:`Een voorwerp start uit stilstand en versnelt met ${a} m/s². Hoeveel meter legt het af in ${t} s?`,
      a:nl(s2),u:'m',h:['s = ½ × a × t².'],
      s:`s = ½ × ${a} × ${t}² = ½ × ${a} × ${t*t} = ${nl(s2)} m.`};
  }},
  {id:'xm_molmassa',p:'amaani',v:'scheikunde',t:'Molmassa',lvl:2,gen:()=>{
    const r=pick(MOLMASSA);
    return {q:`Wat is de molmassa van ${r[0]} (${r[1]})? Geef het antwoord in g/mol.`,
      a:String(r[2]),u:'g/mol',h:['Tel de atoommassa’s van alle atomen in de formule op.'],
      s:`M(${r[0]}) = ${nl(r[2])} g/mol.`};
  }},
  {id:'xm_concentratie',p:'amaani',v:'scheikunde',t:'Concentratie',lvl:2,gen:()=>{
    const n=pick([0.1,0.2,0.25,0.5,1,2]), V=pick([0.25,0.5,1,2,4]), c=rond(n/V,3);
    return {q:`Je lost ${nl(n)} mol op tot ${nl(V)} L oplossing. Bereken de concentratie.`,
      a:nl(c),u:'mol/L',h:['c = n ÷ V, met V in liter.'],
      s:`c = ${nl(n)} ÷ ${nl(V)} = ${nl(c)} mol/L.`};
  }},
  {id:'xm_inflatie',p:'amaani',v:'economie',t:'Inflatie',lvl:3,gen:()=>{
    const nom=pick([2,3,4,5,6]), inf=pick([1,2,3]);
    const reeel=rond(((1+nom/100)/(1+inf/100)-1)*100,1);
    return {q:`Het nominale loon stijgt met ${nom}% en de inflatie is ${inf}%. Bereken de reële loonstijging in procenten. Rond af op één decimaal.`,
      a:nl(reeel),u:'%',h:['Deel de groeifactoren op elkaar, niet de percentages.',
        `(1 + ${nl(nom/100)}) ÷ (1 + ${nl(inf/100)}).`],
      s:`${vast(1+nom/100,2)} ÷ ${vast(1+inf/100,2)} = ${vast((1+nom/100)/(1+inf/100),4)}.\n`
        +`Dat is een reële ${reeel<0?'daling':'stijging'} van ${vast(Math.abs(reeel),1)}%.`};
  }},
  {id:'xm_elasticiteit',p:'amaani',v:'economie',t:'Elasticiteit',lvl:2,gen:()=>{
    const dp=pick([5,10,20,25]), dq=pick([2,5,10,15,20,30]), e=rond(-dq/dp,2);
    return {q:`De prijs stijgt met ${dp}% en de gevraagde hoeveelheid daalt met ${dq}%. Bereken de prijselasticiteit van de vraag.`,
      a:nl(e),h:['elasticiteit = %verandering hoeveelheid ÷ %verandering prijs.',
        'Een daling telt negatief.'],
      s:`E = (−${dq}) ÷ ${dp} = ${nl(e)}.`};
  }},
  ]
}
