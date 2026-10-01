/**
 * SCHEIKUNDE EN NATUURKUNDE VOOR 5 VWO
 *
 * Wat er bij Amaani ontbrak of dun was, gemeten tegen de stof van 5 vwo:
 *
 *   scheikunde   zuren en basen (vijf opgaven, niets op niveau 3), redox en
 *                evenwicht (allebei nul)
 *   natuurkunde  krachten ontbinden en cirkelbeweging met gravitatie (allebei
 *                nul), trillingen en golven (niets op niveau 3)
 *
 * Krachten ontbinden staat er met een reden bij. Amaani heeft wiskunde A, en
 * daar zit geen goniometrie in; natuurkunde gaat ervan uit dat je sinus en
 * cosinus kunt gebruiken. Dat gat zit dus niet in het natuurkundeboek maar
 * tussen twee vakken in, en daar zoekt niemand.
 *
 * Zes opgaven per onderwerp per niveau, de maat van de rest van deze aanvulling
 * (zie `schooljaar2627.ts`): met minder geeft de moeilijkheidsknop een stapel
 * waarin het buurniveau de meerderheid heeft.
 *
 * DE GETALLEN WORDEN UITGEREKEND, NIET INGETIKT
 *
 * Elk rekenantwoord hieronder komt uit de formule zelf (`r4`), met de getallen
 * die ook in de vraag staan. Een tikfout in een antwoord kan dus niet; een fout
 * in een formule wel, en daarom rekent `exact5vwo.proef.ts` een deel opnieuw na
 * met losse formules. Constanten zoals in Binas: g = 9,81 m/s²,
 * G = 6,674·10⁻¹¹ N m² kg⁻², M(aarde) = 5,97·10²⁴ kg, R(aarde) = 6,371·10⁶ m.
 *
 * Antwoorden zijn bewust groter dan 1 waar dat kan (mmol/L in plaats van mol/L,
 * km/s, cm): de nakijker accepteert een absolute afwijking van 0,01, en bij een
 * antwoord van 0,0032 zou dan alles goed zijn.
 */
import type { Opgave } from './soorten'

type Ruw = Omit<Opgave, 'id'>

const G_AARDE = 9.81
const G_GRAV = 6.674e-11
const M_AARDE = 5.97e24
const R_AARDE = 6.371e6

const graden = (d: number): number => d * Math.PI / 180

/** Op vier significante cijfers, met een komma: zo staat het in de uitwerking,
 *  en de nakijker leest de komma als punt. */
export function r4(x: number): string {
  const n = Number(x.toPrecision(4))
  return String(n).replace('.', ',')
}

const ja = ['ja', 'nee']
const kant = ['naar rechts', 'naar links']

/* =============================================================== scheikunde */

const ZUUR: Ruw[] = [
  {p:'amaani',v:'scheikunde',t:'Zuur & base',lvl:1,q:'Bereken de pH van een oplossing met [H₃O⁺] = 1,0·10⁻³ mol/L.',a:'3,00',alt:['3'],h:['pH = −log [H₃O⁺].','De macht van 10 zegt het al.'],s:'pH = −log(1,0·10⁻³) = 3,00.\nTwee significante cijfers in de concentratie geeft twee decimalen in de pH.'},
  {p:'amaani',v:'scheikunde',t:'Zuur & base',lvl:1,q:'Bereken de pH van een oplossing met [H₃O⁺] = 1,0·10⁻⁵ mol/L.',a:'5,00',alt:['5'],h:['pH = −log [H₃O⁺].'],s:'pH = −log(1,0·10⁻⁵) = 5,00.'},
  {p:'amaani',v:'scheikunde',t:'Zuur & base',lvl:1,q:'Een oplossing heeft pH 4. Is die zuur, neutraal of basisch?',a:'zuur',opties:['zuur','neutraal','basisch'],h:['Neutraal is pH 7 bij 298 K.'],s:'Onder 7 is zuur, 7 is neutraal, boven 7 is basisch.\npH 4: zuur.'},
  {p:'amaani',v:'scheikunde',t:'Zuur & base',lvl:1,q:'Een oplossing heeft pH 9. Is die zuur, neutraal of basisch?',a:'basisch',opties:['zuur','neutraal','basisch'],h:['Neutraal is pH 7 bij 298 K.'],s:'Boven 7 is basisch.\npH 9: basisch.'},
  {p:'amaani',v:'scheikunde',t:'Zuur & base',lvl:1,q:'Wat geeft een zuur af in een zuur-basereactie?',a:'H⁺',opties:['H⁺','OH⁻','e⁻'],h:['Zuur = deeltjesdonor. Welk deeltje?'],s:'Een zuur is een H⁺-donor, een base een H⁺-acceptor.\nElektronen horen bij redox, niet bij zuur-base.'},
  {p:'amaani',v:'scheikunde',t:'Zuur & base',lvl:1,q:'Een oplossing heeft pOH 4,00 bij 298 K. Bereken de pH.',a:'10,00',alt:['10'],h:['pH + pOH = 14,00 bij 298 K.'],s:'pH = 14,00 − 4,00 = 10,00.'},

  {p:'amaani',v:'scheikunde',t:'Zuur & base',lvl:2,q:'Bereken de pH van 1,0·10⁻² M natronloog (NaOH, een sterke base).',a:'12,00',alt:['12'],h:['NaOH splitst volledig: [OH⁻] = 1,0·10⁻² mol/L.','Reken eerst de pOH uit.'],s:'[OH⁻] = 1,0·10⁻² → pOH = 2,00.\npH = 14,00 − 2,00 = 12,00.'},
  {p:'amaani',v:'scheikunde',t:'Zuur & base',lvl:2,q:'Bereken de pH van 1,0·10⁻³ M natronloog.',a:'11,00',alt:['11'],h:['NaOH is een sterke base.','Eerst pOH, dan pH.'],s:'[OH⁻] = 1,0·10⁻³ → pOH = 3,00.\npH = 14,00 − 3,00 = 11,00.'},
  {p:'amaani',v:'scheikunde',t:'Zuur & base',lvl:2,q:'Bereken de pH van 0,020 M zoutzuur (HCl, een sterk zuur).',a:r4(-Math.log10(0.020)),h:['Een sterk zuur splitst volledig: [H₃O⁺] = c(HCl).','pH = −log [H₃O⁺].'],s:`[H₃O⁺] = 0,020 mol/L.\npH = −log(0,020) = ${r4(-Math.log10(0.020))}, afgerond 1,70.`},
  {p:'amaani',v:'scheikunde',t:'Zuur & base',lvl:2,q:'Bereken de pH van 0,0050 M zoutzuur.',a:r4(-Math.log10(0.0050)),h:['Sterk zuur: [H₃O⁺] = c(HCl).'],s:`pH = −log(0,0050) = ${r4(-Math.log10(0.0050))}, afgerond 2,30.`},
  {p:'amaani',v:'scheikunde',t:'Zuur & base',lvl:2,q:'Een oplossing heeft pH 2,50. Bereken [H₃O⁺] in mmol/L.',a:r4(10 ** -2.5 * 1000),u:'mmol/L',h:['[H₃O⁺] = 10^(−pH) in mol/L.','Keer 1000 voor mmol/L.'],s:`[H₃O⁺] = 10^(−2,50) = ${r4(10 ** -2.5)} mol/L = ${r4(10 ** -2.5 * 1000)} mmol/L.`},
  {p:'amaani',v:'scheikunde',t:'Zuur & base',lvl:2,q:'Een oplossing heeft pH 1,80. Bereken [H₃O⁺] in mmol/L.',a:r4(10 ** -1.8 * 1000),u:'mmol/L',h:['[H₃O⁺] = 10^(−pH) in mol/L.'],s:`[H₃O⁺] = 10^(−1,80) = ${r4(10 ** -1.8)} mol/L = ${r4(10 ** -1.8 * 1000)} mmol/L.`},

  {p:'amaani',v:'scheikunde',t:'Zuur & base',lvl:3,q:'Je verdunt 10 mL zoutzuur met pH 1,00 tot 1,0 L. Wat is de nieuwe pH?',a:'3,00',alt:['3'],h:['Hoeveel keer verdun je?','Bij een sterk zuur gaat de pH bij elke verdunning ×10 met 1 omhoog.'],s:'Van 10 mL naar 1000 mL is 100 keer verdunnen.\n[H₃O⁺] wordt 100 keer zo klein: van 10⁻¹ naar 10⁻³.\npH = 3,00.'},
  {p:'amaani',v:'scheikunde',t:'Zuur & base',lvl:3,q:'Bereken de pH van 0,10 M azijnzuur. Kz = 1,8·10⁻⁵. Neem aan dat [HZ] ≈ 0,10 blijft.',a:r4(-Math.log10(Math.sqrt(1.8e-5 * 0.10))),h:['Zwak zuur: Kz = [H₃O⁺]² ÷ [HZ].','[H₃O⁺] = √(Kz · c).'],s:`[H₃O⁺]² = 1,8·10⁻⁵ × 0,10 = 1,8·10⁻⁶.\n[H₃O⁺] = ${r4(Math.sqrt(1.8e-6))} mol/L.\npH = ${r4(-Math.log10(Math.sqrt(1.8e-6)))}, afgerond 2,87.`},
  {p:'amaani',v:'scheikunde',t:'Zuur & base',lvl:3,q:'Bereken de pH van 0,010 M azijnzuur. Kz = 1,8·10⁻⁵. Neem aan dat [HZ] ≈ 0,010 blijft.',a:r4(-Math.log10(Math.sqrt(1.8e-5 * 0.010))),h:['[H₃O⁺] = √(Kz · c).'],s:`[H₃O⁺] = √(1,8·10⁻⁷) = ${r4(Math.sqrt(1.8e-7))} mol/L.\npH = ${r4(-Math.log10(Math.sqrt(1.8e-7)))}, afgerond 3,37.`},
  {p:'amaani',v:'scheikunde',t:'Zuur & base',lvl:3,q:'20,0 mL zoutzuur wordt precies geneutraliseerd door 15,0 mL 0,100 M natronloog. Bereken de concentratie van het zoutzuur in mmol/L.',a:r4(15.0 * 0.100 / 20.0 * 1000),u:'mmol/L',h:['n(OH⁻) = V × c. Werk in mL en mmol/mL: dan komt er mmol uit.','Bij het equivalentiepunt is n(H₃O⁺) = n(OH⁻).'],s:'n(OH⁻) = 15,0 mL × 0,100 mmol/mL = 1,50 mmol.\nn(HCl) = 1,50 mmol in 20,0 mL.\nc = 1,50 ÷ 20,0 = 0,0750 mol/L = 75,0 mmol/L.'},
  {p:'amaani',v:'scheikunde',t:'Zuur & base',lvl:3,q:'Welke oplossing heeft de laagste pH: 0,10 M zoutzuur of 0,10 M azijnzuur?',a:'zoutzuur',opties:['zoutzuur','azijnzuur','even laag'],h:['Welk zuur splitst volledig?'],s:'Zoutzuur is een sterk zuur en splitst volledig: [H₃O⁺] = 0,10, pH 1,00.\nAzijnzuur is zwak; maar een klein deel splitst, pH ongeveer 2,87.\nDus zoutzuur.'},
  {p:'amaani',v:'scheikunde',t:'Zuur & base',lvl:3,q:'Je verdunt 0,10 M azijnzuur 100 keer. Gaat de pH dan ook met precies 2 omhoog?',a:'nee',opties:ja,h:['Bij een zwak zuur hangt [H₃O⁺] af van √c.'],s:'Bij een zwak zuur is [H₃O⁺] = √(Kz · c).\nc 100 keer kleiner maakt [H₃O⁺] maar √100 = 10 keer kleiner.\nDe pH gaat dus ongeveer 1 omhoog, niet 2.'},
]

const REDOX: Ruw[] = [
  {p:'amaani',v:'scheikunde',t:'Redox',lvl:1,q:'Neemt een oxidator elektronen op of staat hij ze af?',a:'neemt op',opties:['neemt op','staat af'],h:['OIL RIG: Oxidation Is Loss, Reduction Is Gain.','De oxidator wordt zelf gereduceerd.'],s:'De oxidator neemt elektronen op (en wordt daarbij gereduceerd).'},
  {p:'amaani',v:'scheikunde',t:'Redox',lvl:1,q:'Neemt een reductor elektronen op of staat hij ze af?',a:'staat af',opties:['neemt op','staat af'],h:['De reductor wordt zelf geoxideerd.'],s:'De reductor staat elektronen af (en wordt daarbij geoxideerd).'},
  {p:'amaani',v:'scheikunde',t:'Redox',lvl:1,q:'Zn → Zn²⁺ + 2 e⁻. Is zink hier oxidator of reductor?',a:'reductor',opties:['oxidator','reductor'],h:['Staan de elektronen rechts? Dan worden ze afgestaan.'],s:'Zink staat 2 elektronen af: zink is de reductor.'},
  {p:'amaani',v:'scheikunde',t:'Redox',lvl:1,q:'Cu²⁺ + 2 e⁻ → Cu. Is Cu²⁺ hier oxidator of reductor?',a:'oxidator',opties:['oxidator','reductor'],h:['Staan de elektronen links? Dan worden ze opgenomen.'],s:'Cu²⁺ neemt 2 elektronen op: Cu²⁺ is de oxidator.'},
  {p:'amaani',v:'scheikunde',t:'Redox',lvl:1,q:'Hoeveel elektronen staat een aluminiumatoom af als het Al³⁺ wordt?',a:'3',h:['De lading zegt hoeveel elektronen er weg zijn.'],s:'Al → Al³⁺ + 3 e⁻.'},
  {p:'amaani',v:'scheikunde',t:'Redox',lvl:1,q:'Hoeveel elektronen neemt één Cl₂-molecuul op als het 2 Cl⁻ wordt?',a:'2',h:['Twee atomen, elk één elektron erbij.'],s:'Cl₂ + 2 e⁻ → 2 Cl⁻.'},

  {p:'amaani',v:'scheikunde',t:'Redox',lvl:2,q:'Je zet een staafje zink in een oplossing met Cu²⁺. Verloopt er een reactie? (Binas 48: Cu²⁺/Cu +0,34 V, Zn²⁺/Zn −0,76 V)',a:'ja',opties:ja,h:['Er is reactie als de oxidator hoger in de tabel staat dan de reductor.','Oxidator: Cu²⁺. Reductor: Zn.'],s:'Oxidator Cu²⁺ (+0,34 V) staat boven reductor Zn (−0,76 V).\nDus ja: Zn + Cu²⁺ → Zn²⁺ + Cu.'},
  {p:'amaani',v:'scheikunde',t:'Redox',lvl:2,q:'Je zet een koperen staafje in een oplossing met Zn²⁺. Verloopt er een reactie? (Cu²⁺/Cu +0,34 V, Zn²⁺/Zn −0,76 V)',a:'nee',opties:ja,h:['Oxidator: Zn²⁺. Reductor: Cu.','Staat de oxidator hoger dan de reductor?'],s:'Oxidator Zn²⁺ (−0,76 V) staat onder reductor Cu (+0,34 V).\nDus nee.'},
  {p:'amaani',v:'scheikunde',t:'Redox',lvl:2,q:'Je zet een koperen draad in een oplossing met Ag⁺. Verloopt er een reactie? (Ag⁺/Ag +0,80 V, Cu²⁺/Cu +0,34 V)',a:'ja',opties:ja,h:['Oxidator: Ag⁺. Reductor: Cu.'],s:'Ag⁺ (+0,80 V) staat boven Cu (+0,34 V).\nDus ja: er slaat zilver neer en de oplossing kleurt blauw door Cu²⁺.'},
  {p:'amaani',v:'scheikunde',t:'Redox',lvl:2,q:'Je zet een zilveren staafje in een oplossing met Cu²⁺. Verloopt er een reactie? (Ag⁺/Ag +0,80 V, Cu²⁺/Cu +0,34 V)',a:'nee',opties:ja,h:['Oxidator: Cu²⁺. Reductor: Ag.'],s:'Cu²⁺ (+0,34 V) staat onder Ag (+0,80 V).\nDus nee.'},
  {p:'amaani',v:'scheikunde',t:'Redox',lvl:2,q:'Je voegt broomwater (Br₂) toe aan een oplossing met I⁻. Verloopt er een reactie? (Br₂/Br⁻ +1,07 V, I₂/I⁻ +0,54 V)',a:'ja',opties:ja,h:['Oxidator: Br₂. Reductor: I⁻.'],s:'Br₂ (+1,07 V) staat boven I⁻ (+0,54 V).\nDus ja: Br₂ + 2 I⁻ → 2 Br⁻ + I₂.'},
  {p:'amaani',v:'scheikunde',t:'Redox',lvl:2,q:'Je voegt jood (I₂) toe aan een oplossing met Cl⁻. Verloopt er een reactie? (Cl₂/Cl⁻ +1,36 V, I₂/I⁻ +0,54 V)',a:'nee',opties:ja,h:['Oxidator: I₂. Reductor: Cl⁻.'],s:'I₂ (+0,54 V) staat onder Cl⁻ (+1,36 V).\nDus nee.'},

  {p:'amaani',v:'scheikunde',t:'Redox',lvl:3,q:'Al reageert met Cu²⁺. Al → Al³⁺ + 3 e⁻ en Cu²⁺ + 2 e⁻ → Cu. Met welk getal vermenigvuldig je de halfreactie van Al om de elektronen gelijk te krijgen?',a:'2',h:['Zoek het kleinste gemene veelvoud van 3 en 2.'],s:'3 en 2: kleinste gemene veelvoud 6.\nAl × 2 (6 e⁻), Cu²⁺ × 3 (6 e⁻).\n2 Al + 3 Cu²⁺ → 2 Al³⁺ + 3 Cu.'},
  {p:'amaani',v:'scheikunde',t:'Redox',lvl:3,q:'Zelfde reactie: Al → Al³⁺ + 3 e⁻ en Cu²⁺ + 2 e⁻ → Cu. Met welk getal vermenigvuldig je de halfreactie van Cu²⁺?',a:'3',h:['Het kleinste gemene veelvoud van 3 en 2 is 6.'],s:'Cu²⁺ × 3 geeft 6 e⁻, net als Al × 2.\n2 Al + 3 Cu²⁺ → 2 Al³⁺ + 3 Cu.'},
  {p:'amaani',v:'scheikunde',t:'Redox',lvl:3,q:'13,1 g zink reageert volledig met Cu²⁺ (Zn + Cu²⁺ → Zn²⁺ + Cu). Hoeveel gram koper ontstaat er? (Zn 65,38 g/mol, Cu 63,55 g/mol)',a:r4(13.1 / 65.38 * 63.55),u:'g',h:['Eerst mol zink: n = m ÷ M.','De verhouding Zn : Cu is 1 : 1.'],s:`n(Zn) = 13,1 ÷ 65,38 = ${r4(13.1 / 65.38)} mol.\nn(Cu) = ${r4(13.1 / 65.38)} mol.\nm(Cu) = ${r4(13.1 / 65.38)} × 63,55 = ${r4(13.1 / 65.38 * 63.55)} g.`},
  {p:'amaani',v:'scheikunde',t:'Redox',lvl:3,q:'6,35 g koper reageert volledig met Ag⁺ (Cu + 2 Ag⁺ → Cu²⁺ + 2 Ag). Hoeveel gram zilver ontstaat er? (Cu 63,55 g/mol, Ag 107,87 g/mol)',a:r4(6.35 / 63.55 * 2 * 107.87),u:'g',h:['Eerst mol koper.','Let op de verhouding Cu : Ag = 1 : 2.'],s:`n(Cu) = 6,35 ÷ 63,55 = ${r4(6.35 / 63.55)} mol.\nn(Ag) = 2 × ${r4(6.35 / 63.55)} = ${r4(2 * 6.35 / 63.55)} mol.\nm(Ag) = ${r4(2 * 6.35 / 63.55)} × 107,87 = ${r4(6.35 / 63.55 * 2 * 107.87)} g.`},
  {p:'amaani',v:'scheikunde',t:'Redox',lvl:3,q:'Welk deeltje is de sterkste oxidator: Cu²⁺ (+0,34 V), Zn²⁺ (−0,76 V) of Ag⁺ (+0,80 V)?',a:'Ag⁺',opties:['Cu²⁺','Zn²⁺','Ag⁺'],h:['De sterkste oxidator heeft de hoogste standaardpotentiaal.'],s:'Hoe hoger in Binas 48, hoe sterker de oxidator.\nAg⁺ met +0,80 V.'},
  {p:'amaani',v:'scheikunde',t:'Redox',lvl:3,q:'Welk metaal is de sterkste reductor: Mg (−2,37 V), Fe (−0,44 V) of Cu (+0,34 V)?',a:'Mg',opties:['Mg','Fe','Cu'],h:['De sterkste reductor staat het laagst in de tabel.'],s:'Hoe lager de standaardpotentiaal van het koppel, hoe sterker de reductor.\nMg met −2,37 V: een onedel metaal.'},
]

const EVENWICHT: Ruw[] = [
  {p:'amaani',v:'scheikunde',t:'Evenwicht',lvl:1,q:'In een evenwicht zijn de reactiesnelheden naar links en naar rechts ...',a:'gelijk',opties:['gelijk','nul','verschillend'],h:['Er gebeurt nog wel iets, maar het levert netto niets op.'],s:'Een evenwicht is dynamisch: beide reacties lopen door, even snel.\nDaardoor veranderen de concentraties niet meer.'},
  {p:'amaani',v:'scheikunde',t:'Evenwicht',lvl:1,q:'Verandert een katalysator de ligging van een evenwicht?',a:'nee',opties:ja,h:['Een katalysator versnelt beide richtingen evenveel.'],s:'Nee. Het evenwicht is wel sneller bereikt, maar het ligt op dezelfde plek.'},
  {p:'amaani',v:'scheikunde',t:'Evenwicht',lvl:1,q:'Telt een vaste stof mee in de evenwichtsvoorwaarde K?',a:'nee',opties:ja,h:['In K staan concentraties. Heeft een vaste stof een concentratie die verandert?'],s:'Nee. Vaste stoffen (en water als oplosmiddel) laat je weg uit K.'},
  {p:'amaani',v:'scheikunde',t:'Evenwicht',lvl:1,q:'A + B ⇌ C. Je voegt extra A toe. Welke kant verschuift het evenwicht op?',a:'naar rechts',opties:kant,h:['Het evenwicht reageert de verandering weg.'],s:'Er is meer A: het evenwicht verbruikt A en schuift naar rechts.'},
  {p:'amaani',v:'scheikunde',t:'Evenwicht',lvl:1,q:'A + B ⇌ C. Je haalt C weg. Welke kant verschuift het evenwicht op?',a:'naar rechts',opties:kant,h:['Het evenwicht vult aan wat je weghaalt.'],s:'Er is minder C: het evenwicht maakt C bij en schuift naar rechts.'},
  {p:'amaani',v:'scheikunde',t:'Evenwicht',lvl:1,q:'A + B ⇌ C. Je voegt extra C toe. Welke kant verschuift het evenwicht op?',a:'naar links',opties:kant,h:['Het evenwicht verbruikt wat je toevoegt.'],s:'Er is meer C: het evenwicht verbruikt C en schuift naar links.'},

  {p:'amaani',v:'scheikunde',t:'Evenwicht',lvl:2,q:'N₂ + 3 H₂ ⇌ 2 NH₃ is exotherm naar rechts. De temperatuur gaat omhoog. Welke kant verschuift het evenwicht op?',a:'naar links',opties:kant,h:['Bij een hogere temperatuur verschuift het evenwicht naar de endotherme kant.'],s:'Naar rechts is exotherm, dus naar links is endotherm.\nTemperatuur omhoog: naar de endotherme kant, naar links.'},
  {p:'amaani',v:'scheikunde',t:'Evenwicht',lvl:2,q:'N₂ + 3 H₂ ⇌ 2 NH₃, alles gas. De druk gaat omhoog. Welke kant verschuift het evenwicht op?',a:'naar rechts',opties:kant,h:['Tel de gasmoleculen links en rechts.','Bij hogere druk: naar de kant met minder gasmoleculen.'],s:'Links 1 + 3 = 4 gasmoleculen, rechts 2.\nHogere druk: naar de kant met minder, dus naar rechts.'},
  {p:'amaani',v:'scheikunde',t:'Evenwicht',lvl:2,q:'H₂ + I₂ ⇌ 2 HI, alles gas. De druk gaat omhoog. Wat gebeurt er met het evenwicht?',a:'geen verschuiving',opties:['naar rechts','naar links','geen verschuiving'],h:['Tel de gasmoleculen links en rechts.'],s:'Links 2 gasmoleculen, rechts ook 2.\nDe druk maakt dan niets uit: geen verschuiving.'},
  {p:'amaani',v:'scheikunde',t:'Evenwicht',lvl:2,q:'N₂O₄ ⇌ 2 NO₂ is endotherm naar rechts. De temperatuur gaat omhoog. Welke kant verschuift het evenwicht op?',a:'naar rechts',opties:kant,h:['Hogere temperatuur: naar de endotherme kant.'],s:'Naar rechts is endotherm.\nTemperatuur omhoog: naar rechts, het gas wordt bruiner door NO₂.'},
  {p:'amaani',v:'scheikunde',t:'Evenwicht',lvl:2,q:'N₂ + 3 H₂ ⇌ 2 NH₃. Welke macht krijgt [NH₃] in de evenwichtsvoorwaarde?',a:'2',h:['De coëfficiënt wordt de macht.'],s:'K = [NH₃]² ÷ ([N₂] · [H₂]³).\n[NH₃] staat in het kwadraat.'},
  {p:'amaani',v:'scheikunde',t:'Evenwicht',lvl:2,q:'N₂ + 3 H₂ ⇌ 2 NH₃. Welke macht krijgt [H₂] in de evenwichtsvoorwaarde?',a:'3',h:['De coëfficiënt wordt de macht.'],s:'K = [NH₃]² ÷ ([N₂] · [H₂]³).\n[H₂] staat tot de derde.'},

  {p:'amaani',v:'scheikunde',t:'Evenwicht',lvl:3,q:'A ⇌ B. In evenwicht is [A] = 0,20 mol/L en [B] = 0,60 mol/L. Bereken K.',a:r4(0.60 / 0.20),h:['K = [B] ÷ [A].'],s:'K = 0,60 ÷ 0,20 = 3,0.'},
  {p:'amaani',v:'scheikunde',t:'Evenwicht',lvl:3,q:'H₂ + I₂ ⇌ 2 HI. In evenwicht: [H₂] = 0,10, [I₂] = 0,10 en [HI] = 0,70 mol/L. Bereken K.',a:r4(0.70 ** 2 / (0.10 * 0.10)),h:['K = [HI]² ÷ ([H₂] · [I₂]).'],s:`K = 0,70² ÷ (0,10 × 0,10) = 0,49 ÷ 0,010 = ${r4(0.70 ** 2 / (0.10 * 0.10))}.`},
  {p:'amaani',v:'scheikunde',t:'Evenwicht',lvl:3,q:'2 NO₂ ⇌ N₂O₄. In evenwicht: [NO₂] = 0,20 en [N₂O₄] = 0,40 mol/L. Bereken K.',a:r4(0.40 / 0.20 ** 2),h:['K = [N₂O₄] ÷ [NO₂]².'],s:`K = 0,40 ÷ 0,20² = 0,40 ÷ 0,040 = ${r4(0.40 / 0.20 ** 2)}.`},
  {p:'amaani',v:'scheikunde',t:'Evenwicht',lvl:3,q:'N₂ + 3 H₂ ⇌ 2 NH₃. In evenwicht: [N₂] = 0,10, [H₂] = 0,50 en [NH₃] = 0,20 mol/L. Bereken K.',a:r4(0.20 ** 2 / (0.10 * 0.50 ** 3)),h:['K = [NH₃]² ÷ ([N₂] · [H₂]³).','0,50³ = 0,125.'],s:`K = 0,20² ÷ (0,10 × 0,50³) = 0,040 ÷ 0,0125 = ${r4(0.20 ** 2 / (0.10 * 0.50 ** 3))}.`},
  {p:'amaani',v:'scheikunde',t:'Evenwicht',lvl:3,q:'Fe³⁺ + SCN⁻ ⇌ FeSCN²⁺. In evenwicht: [Fe³⁺] = 0,010, [SCN⁻] = 0,020 en [FeSCN²⁺] = 0,040 mol/L. Bereken K.',a:r4(0.040 / (0.010 * 0.020)),h:['K = [FeSCN²⁺] ÷ ([Fe³⁺] · [SCN⁻]).'],s:`K = 0,040 ÷ (0,010 × 0,020) = 0,040 ÷ 0,00020 = ${r4(0.040 / (0.010 * 0.020))}.`},
  {p:'amaani',v:'scheikunde',t:'Evenwicht',lvl:3,q:'Voor een reactie is K = 4,0. Op een moment is de concentratiebreuk Q = 2,0. Welke kant loopt de reactie op?',a:'naar rechts',opties:kant,h:['Q < K: er is nog te weinig product.'],s:'Q is kleiner dan K: er moet nog product bij.\nDe reactie loopt naar rechts tot Q = K.'},
]

/* ============================================================== natuurkunde */

const F100 = { cos30: 100 * Math.cos(graden(30)), sin30: 100 * Math.sin(graden(30)) }

const KRACHTEN: Ruw[] = [
  {p:'amaani',v:'natuurkunde',t:'Krachten ontbinden',lvl:1,q:'Een kracht van 100 N werkt onder 30° met de horizontaal. Bereken de horizontale component Fx.',a:r4(F100.cos30),u:'N',h:['Fx = F · cos α (α met de horizontaal).','Rekenmachine op graden (DEG).'],s:`Fx = 100 × cos 30° = 100 × ${r4(Math.cos(graden(30)))} = ${r4(F100.cos30)} N.`},
  {p:'amaani',v:'natuurkunde',t:'Krachten ontbinden',lvl:1,q:'Een kracht van 100 N werkt onder 30° met de horizontaal. Bereken de verticale component Fy.',a:r4(F100.sin30),u:'N',h:['Fy = F · sin α.'],s:`Fy = 100 × sin 30° = 100 × 0,5 = ${r4(F100.sin30)} N.`},
  {p:'amaani',v:'natuurkunde',t:'Krachten ontbinden',lvl:1,q:'Een kracht van 50 N werkt onder 60° met de horizontaal. Bereken Fx.',a:r4(50 * Math.cos(graden(60))),u:'N',h:['Fx = F · cos α.'],s:`Fx = 50 × cos 60° = 50 × 0,5 = ${r4(50 * Math.cos(graden(60)))} N.`},
  {p:'amaani',v:'natuurkunde',t:'Krachten ontbinden',lvl:1,q:'Een kracht van 50 N werkt onder 60° met de horizontaal. Bereken Fy.',a:r4(50 * Math.sin(graden(60))),u:'N',h:['Fy = F · sin α.'],s:`Fy = 50 × sin 60° = 50 × ${r4(Math.sin(graden(60)))} = ${r4(50 * Math.sin(graden(60)))} N.`},
  {p:'amaani',v:'natuurkunde',t:'Krachten ontbinden',lvl:1,q:'Twee krachten van 30 N en 40 N staan loodrecht op elkaar. Bereken de grootte van de resulterende kracht.',a:r4(Math.hypot(30, 40)),u:'N',h:['Loodrecht: gebruik Pythagoras.'],s:`F = √(30² + 40²) = √2500 = ${r4(Math.hypot(30, 40))} N.`},
  {p:'amaani',v:'natuurkunde',t:'Krachten ontbinden',lvl:1,q:'Twee krachten van 12 N en 5,0 N staan loodrecht op elkaar. Bereken de resulterende kracht.',a:r4(Math.hypot(12, 5)),u:'N',h:['Pythagoras.'],s:`F = √(12² + 5,0²) = √169 = ${r4(Math.hypot(12, 5))} N.`},

  {p:'amaani',v:'natuurkunde',t:'Krachten ontbinden',lvl:2,q:'Een kracht van 200 N werkt onder 25° met de horizontaal. Bereken Fx.',a:r4(200 * Math.cos(graden(25))),u:'N',h:['Fx = F · cos α.'],s:`Fx = 200 × cos 25° = ${r4(200 * Math.cos(graden(25)))} N.`},
  {p:'amaani',v:'natuurkunde',t:'Krachten ontbinden',lvl:2,q:'Een kracht van 200 N werkt onder 25° met de horizontaal. Bereken Fy.',a:r4(200 * Math.sin(graden(25))),u:'N',h:['Fy = F · sin α.'],s:`Fy = 200 × sin 25° = ${r4(200 * Math.sin(graden(25)))} N.`},
  {p:'amaani',v:'natuurkunde',t:'Krachten ontbinden',lvl:2,q:'Een resulterende kracht heeft Fx = 12 N en Fy = 5,0 N. Bereken de hoek met de horizontaal in graden.',a:r4(Math.atan2(5, 12) * 180 / Math.PI),u:'°',h:['tan α = Fy ÷ Fx.','α = tan⁻¹(...) op de rekenmachine, in graden.'],s:`tan α = 5,0 ÷ 12 = ${r4(5 / 12)}.\nα = tan⁻¹(${r4(5 / 12)}) = ${r4(Math.atan2(5, 12) * 180 / Math.PI)}°.`},
  {p:'amaani',v:'natuurkunde',t:'Krachten ontbinden',lvl:2,q:'Een resulterende kracht heeft Fx = 40 N en Fy = 30 N. Bereken de hoek met de horizontaal in graden.',a:r4(Math.atan2(30, 40) * 180 / Math.PI),u:'°',h:['tan α = Fy ÷ Fx.'],s:`tan α = 30 ÷ 40 = 0,75.\nα = tan⁻¹(0,75) = ${r4(Math.atan2(30, 40) * 180 / Math.PI)}°.`},
  {p:'amaani',v:'natuurkunde',t:'Krachten ontbinden',lvl:2,q:'Een blok van 10 kg staat op een helling van 30°. Bereken de component van de zwaartekracht langs de helling. (g = 9,81 m/s²)',a:r4(10 * G_AARDE * Math.sin(graden(30))),u:'N',h:['Fz = m · g.','Langs de helling: Fz · sin α.'],s:`Fz = 10 × 9,81 = ${r4(10 * G_AARDE)} N.\nLangs de helling: ${r4(10 * G_AARDE)} × sin 30° = ${r4(10 * G_AARDE * Math.sin(graden(30)))} N.`},
  {p:'amaani',v:'natuurkunde',t:'Krachten ontbinden',lvl:2,q:'Een blok van 10 kg staat op een helling van 30°. Bereken de component van de zwaartekracht loodrecht op de helling. (g = 9,81 m/s²)',a:r4(10 * G_AARDE * Math.cos(graden(30))),u:'N',h:['Loodrecht op de helling: Fz · cos α.'],s:`Fz = ${r4(10 * G_AARDE)} N.\nLoodrecht: ${r4(10 * G_AARDE)} × cos 30° = ${r4(10 * G_AARDE * Math.cos(graden(30)))} N.`},

  {p:'amaani',v:'natuurkunde',t:'Krachten ontbinden',lvl:3,q:'Een slee van 20 kg staat op een helling van 20°. Bereken de normaalkracht. (g = 9,81 m/s², geen andere krachten loodrecht op de helling)',a:r4(20 * G_AARDE * Math.cos(graden(20))),u:'N',h:['De normaalkracht compenseert de component van Fz loodrecht op de helling.'],s:`Fz = 20 × 9,81 = ${r4(20 * G_AARDE)} N.\nFn = Fz · cos 20° = ${r4(20 * G_AARDE * Math.cos(graden(20)))} N.`},
  {p:'amaani',v:'natuurkunde',t:'Krachten ontbinden',lvl:3,q:'Je houdt een blok van 5,0 kg stil op een wrijvingsloze helling van 40° met een kracht evenwijdig aan de helling. Hoe groot is die kracht? (g = 9,81 m/s²)',a:r4(5 * G_AARDE * Math.sin(graden(40))),u:'N',h:['Stilstand: de resulterende kracht langs de helling is nul.'],s:`Je kracht = Fz · sin 40° = 5,0 × 9,81 × ${r4(Math.sin(graden(40)))} = ${r4(5 * G_AARDE * Math.sin(graden(40)))} N.`},
  {p:'amaani',v:'natuurkunde',t:'Krachten ontbinden',lvl:3,q:'Een kist van 50 kg wordt over een wrijvingsloze vloer getrokken met 300 N onder 35° boven de horizontaal. Bereken de versnelling.',a:r4(300 * Math.cos(graden(35)) / 50),u:'m/s²',h:['Alleen de horizontale component versnelt de kist.','a = Fx ÷ m.'],s:`Fx = 300 × cos 35° = ${r4(300 * Math.cos(graden(35)))} N.\na = ${r4(300 * Math.cos(graden(35)))} ÷ 50 = ${r4(300 * Math.cos(graden(35)) / 50)} m/s².`},
  {p:'amaani',v:'natuurkunde',t:'Krachten ontbinden',lvl:3,q:'Dezelfde kist van 50 kg, getrokken met 300 N onder 35° boven de horizontaal. Bereken de normaalkracht van de vloer. (g = 9,81 m/s²)',a:r4(50 * G_AARDE - 300 * Math.sin(graden(35))),u:'N',h:['De trekkracht tilt een beetje mee: Fy werkt omhoog.','Fn + Fy = Fz.'],s:`Fz = 50 × 9,81 = ${r4(50 * G_AARDE)} N.\nFy = 300 × sin 35° = ${r4(300 * Math.sin(graden(35)))} N.\nFn = ${r4(50 * G_AARDE)} − ${r4(300 * Math.sin(graden(35)))} = ${r4(50 * G_AARDE - 300 * Math.sin(graden(35)))} N.`},
  {p:'amaani',v:'natuurkunde',t:'Krachten ontbinden',lvl:3,q:'Een lamp van 2,0 kg hangt aan twee kabels die elk 30° met de horizontaal maken (symmetrisch). Bereken de spankracht in één kabel. (g = 9,81 m/s²)',a:r4(2 * G_AARDE / (2 * Math.sin(graden(30)))),u:'N',h:['De verticale componenten van beide kabels samen dragen de lamp.','2 · Fs · sin 30° = m · g.'],s:`m · g = 2,0 × 9,81 = ${r4(2 * G_AARDE)} N.\n2 · Fs · sin 30° = ${r4(2 * G_AARDE)} → Fs = ${r4(2 * G_AARDE / (2 * Math.sin(graden(30))))} N.\nEen vlakke kabel moet dus harder trekken dan je zou denken.`},
  {p:'amaani',v:'natuurkunde',t:'Krachten ontbinden',lvl:3,q:'Een kracht van 80 N moet een horizontale component van 60 N hebben. Onder welke hoek met de horizontaal moet hij werken? (in graden)',a:r4(Math.acos(60 / 80) * 180 / Math.PI),u:'°',h:['cos α = Fx ÷ F.','α = cos⁻¹(...).'],s:`cos α = 60 ÷ 80 = 0,75.\nα = cos⁻¹(0,75) = ${r4(Math.acos(0.75) * 180 / Math.PI)}°.`},
]

const v_sat = Math.sqrt(G_GRAV * M_AARDE / 7.0e6)
const T_maan = 27.3 * 24 * 3600
const CIRKEL: Ruw[] = [
  {p:'amaani',v:'natuurkunde',t:'Cirkelbeweging & gravitatie',lvl:1,q:'Een voorwerp draait in een cirkel met straal 2,0 m en omlooptijd 4,0 s. Bereken de baansnelheid.',a:r4(2 * Math.PI * 2.0 / 4.0),u:'m/s',h:['v = 2πr ÷ T.'],s:`v = 2π × 2,0 ÷ 4,0 = ${r4(2 * Math.PI * 2.0 / 4.0)} m/s.`},
  {p:'amaani',v:'natuurkunde',t:'Cirkelbeweging & gravitatie',lvl:1,q:'Een draaimolen doet één rondje in 0,25 s. Bereken de frequentie.',a:r4(1 / 0.25),u:'Hz',h:['f = 1 ÷ T.'],s:'f = 1 ÷ 0,25 = 4,0 Hz.'},
  {p:'amaani',v:'natuurkunde',t:'Cirkelbeweging & gravitatie',lvl:1,q:'Een balletje van 0,50 kg draait met 4,0 m/s in een cirkel met straal 2,0 m. Bereken de middelpuntzoekende kracht.',a:r4(0.50 * 4.0 ** 2 / 2.0),u:'N',h:['Fmpz = m · v² ÷ r.'],s:`Fmpz = 0,50 × 4,0² ÷ 2,0 = ${r4(0.50 * 16 / 2)} N.`},
  {p:'amaani',v:'natuurkunde',t:'Cirkelbeweging & gravitatie',lvl:1,q:'Waar wijst de middelpuntzoekende kracht naartoe?',a:'naar het middelpunt',opties:['naar het middelpunt','naar buiten','langs de baan'],h:['De naam zegt het al.'],s:'Naar het middelpunt van de cirkel. "Naar buiten gedrukt worden" is traagheid, geen kracht.'},
  {p:'amaani',v:'natuurkunde',t:'Cirkelbeweging & gravitatie',lvl:1,q:'Een auto rijdt met 10 m/s door een bocht met straal 50 m. Bereken de middelpuntzoekende versnelling.',a:r4(10 ** 2 / 50),u:'m/s²',h:['a = v² ÷ r.'],s:'a = 10² ÷ 50 = 2,0 m/s².'},
  {p:'amaani',v:'natuurkunde',t:'Cirkelbeweging & gravitatie',lvl:1,q:'Een punt op een wiel met straal 0,30 m maakt 2,0 omwentelingen per seconde. Bereken de baansnelheid.',a:r4(2 * Math.PI * 0.30 * 2.0),u:'m/s',h:['2,0 omwentelingen per seconde: T = 0,50 s.','v = 2πr ÷ T.'],s:`T = 1 ÷ 2,0 = 0,50 s.\nv = 2π × 0,30 ÷ 0,50 = ${r4(2 * Math.PI * 0.30 * 2.0)} m/s.`},

  {p:'amaani',v:'natuurkunde',t:'Cirkelbeweging & gravitatie',lvl:2,q:'Een auto van 1200 kg rijdt met 15 m/s door een bocht met straal 50 m. Hoe groot moet de wrijvingskracht van de banden zijn?',a:r4(1200 * 15 ** 2 / 50),u:'N',h:['De wrijving levert de middelpuntzoekende kracht.','Fmpz = m · v² ÷ r.'],s:`Fmpz = 1200 × 15² ÷ 50 = ${r4(1200 * 225 / 50)} N.`},
  {p:'amaani',v:'natuurkunde',t:'Cirkelbeweging & gravitatie',lvl:2,q:'Dezelfde bocht, maar de auto rijdt twee keer zo snel. Hoeveel keer zo groot wordt de benodigde middelpuntzoekende kracht?',a:'4',h:['Fmpz hangt af van v².'],s:'v twee keer zo groot: v² vier keer zo groot.\nDus vier keer zoveel kracht nodig. Daarom vliegen auto’s die te hard gaan de bocht uit.'},
  {p:'amaani',v:'natuurkunde',t:'Cirkelbeweging & gravitatie',lvl:2,q:'Bereken de gravitatiekracht van de aarde op een persoon van 70 kg aan het aardoppervlak. (G = 6,674·10⁻¹¹, M = 5,97·10²⁴ kg, R = 6,371·10⁶ m)',a:r4(G_GRAV * M_AARDE * 70 / R_AARDE ** 2),u:'N',h:['Fg = G · m · M ÷ r².','r is de straal van de aarde.'],s:`Fg = 6,674·10⁻¹¹ × 70 × 5,97·10²⁴ ÷ (6,371·10⁶)² = ${r4(G_GRAV * M_AARDE * 70 / R_AARDE ** 2)} N.\nDat is (bijna) m · g: zo hangen g en G samen.`},
  {p:'amaani',v:'natuurkunde',t:'Cirkelbeweging & gravitatie',lvl:2,q:'De afstand tot het middelpunt van de aarde wordt twee keer zo groot. Hoeveel keer zo klein wordt de gravitatiekracht?',a:'4',h:['Fg hangt af van 1 ÷ r².'],s:'r twee keer zo groot: r² vier keer zo groot.\nFg wordt vier keer zo klein.'},
  {p:'amaani',v:'natuurkunde',t:'Cirkelbeweging & gravitatie',lvl:2,q:'Bereken de valversnelling op een hoogte waar je twee keer zo ver van het middelpunt van de aarde bent als aan het oppervlak. (g aan het oppervlak = 9,81 m/s²)',a:r4(G_AARDE / 4),u:'m/s²',h:['g hangt af van 1 ÷ r².'],s:`g = 9,81 ÷ 2² = ${r4(G_AARDE / 4)} m/s².`},
  {p:'amaani',v:'natuurkunde',t:'Cirkelbeweging & gravitatie',lvl:2,q:'Een kogeltje van 0,20 kg aan een touw van 0,80 m draait rond met omlooptijd 0,50 s. Bereken de spankracht (horizontaal vlak, zwaartekracht verwaarlozen).',a:r4(0.20 * (2 * Math.PI * 0.80 / 0.50) ** 2 / 0.80),u:'N',h:['Eerst v = 2πr ÷ T.','Dan Fmpz = m · v² ÷ r; die levert het touw.'],s:`v = 2π × 0,80 ÷ 0,50 = ${r4(2 * Math.PI * 0.80 / 0.50)} m/s.\nFs = 0,20 × ${r4(2 * Math.PI * 0.80 / 0.50)}² ÷ 0,80 = ${r4(0.20 * (2 * Math.PI * 0.80 / 0.50) ** 2 / 0.80)} N.`},

  {p:'amaani',v:'natuurkunde',t:'Cirkelbeweging & gravitatie',lvl:3,q:'Een satelliet draait om de aarde op r = 7,0·10⁶ m van het middelpunt. Bereken de baansnelheid in km/s. (G = 6,674·10⁻¹¹, M = 5,97·10²⁴ kg)',a:r4(v_sat / 1000),u:'km/s',h:['De gravitatiekracht is de middelpuntzoekende kracht.','G · M · m ÷ r² = m · v² ÷ r, dus v = √(G · M ÷ r).'],s:`v = √(6,674·10⁻¹¹ × 5,97·10²⁴ ÷ 7,0·10⁶) = ${r4(v_sat)} m/s = ${r4(v_sat / 1000)} km/s.\nDe massa van de satelliet valt weg.`},
  {p:'amaani',v:'natuurkunde',t:'Cirkelbeweging & gravitatie',lvl:3,q:'Dezelfde satelliet (r = 7,0·10⁶ m, v uit de vorige som). Bereken de omlooptijd in minuten.',a:r4(2 * Math.PI * 7.0e6 / v_sat / 60),u:'min',h:['T = 2πr ÷ v.','Delen door 60 voor minuten.'],s:`T = 2π × 7,0·10⁶ ÷ ${r4(v_sat)} = ${r4(2 * Math.PI * 7.0e6 / v_sat)} s = ${r4(2 * Math.PI * 7.0e6 / v_sat / 60)} min.`},
  {p:'amaani',v:'natuurkunde',t:'Cirkelbeweging & gravitatie',lvl:3,q:'De maan draait op 3,84·10⁸ m van de aarde in 27,3 dagen rond. Bereken de baansnelheid van de maan in m/s.',a:r4(2 * Math.PI * 3.84e8 / T_maan),u:'m/s',h:['Reken de omlooptijd om naar seconden.','v = 2πr ÷ T.'],s:`T = 27,3 × 24 × 3600 = ${r4(T_maan)} s.\nv = 2π × 3,84·10⁸ ÷ ${r4(T_maan)} = ${r4(2 * Math.PI * 3.84e8 / T_maan)} m/s.`},
  {p:'amaani',v:'natuurkunde',t:'Cirkelbeweging & gravitatie',lvl:3,q:'Bereken uit de maanbaan (r = 3,84·10⁸ m, T = 27,3 dagen) de massa van de aarde, in 10²⁴ kg. (G = 6,674·10⁻¹¹)',a:r4(4 * Math.PI ** 2 * (3.84e8) ** 3 / (G_GRAV * T_maan ** 2) / 1e24),u:'·10²⁴ kg',h:['G · M ÷ r² = 4π² · r ÷ T².','Dus M = 4π² · r³ ÷ (G · T²).'],s:`M = 4π² × (3,84·10⁸)³ ÷ (6,674·10⁻¹¹ × ${r4(T_maan)}²) = ${r4(4 * Math.PI ** 2 * (3.84e8) ** 3 / (G_GRAV * T_maan ** 2) / 1e24)}·10²⁴ kg.\nDat ligt dicht bij de tabelwaarde 5,97·10²⁴ kg.`},
  {p:'amaani',v:'natuurkunde',t:'Cirkelbeweging & gravitatie',lvl:3,q:'Een geostationaire satelliet heeft een omlooptijd van 24,0 uur. Bereken zijn baanstraal in duizenden kilometers. (G = 6,674·10⁻¹¹, M = 5,97·10²⁴ kg)',a:r4(Math.cbrt(G_GRAV * M_AARDE * (24 * 3600) ** 2 / (4 * Math.PI ** 2)) / 1e6),u:'·1000 km',h:['r³ = G · M · T² ÷ 4π².','T in seconden: 86 400 s.'],s:`r³ = 6,674·10⁻¹¹ × 5,97·10²⁴ × 86 400² ÷ 4π².\nr = ${r4(Math.cbrt(G_GRAV * M_AARDE * (24 * 3600) ** 2 / (4 * Math.PI ** 2)))} m = ${r4(Math.cbrt(G_GRAV * M_AARDE * (24 * 3600) ** 2 / (4 * Math.PI ** 2)) / 1e6)} duizend km.`},
  {p:'amaani',v:'natuurkunde',t:'Cirkelbeweging & gravitatie',lvl:3,q:'Een karretje rijdt door een looping met straal 10 m. Bereken de kleinste snelheid bovenin waarbij het net niet loskomt. (g = 9,81 m/s²)',a:r4(Math.sqrt(G_AARDE * 10)),u:'m/s',h:['Bovenin levert alleen de zwaartekracht de middelpuntzoekende kracht.','m · g = m · v² ÷ r.'],s:`v² = g · r = 9,81 × 10 = ${r4(G_AARDE * 10)}.\nv = ${r4(Math.sqrt(G_AARDE * 10))} m/s.`},
]

const GOLVEN: Ruw[] = [
  {p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:1,q:'Een trilling heeft een trillingstijd van 0,020 s. Bereken de frequentie.',a:r4(1 / 0.020),u:'Hz',h:['f = 1 ÷ T.'],s:'f = 1 ÷ 0,020 = 50 Hz.'},
  {p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:1,q:'Een toon heeft een frequentie van 250 Hz. Bereken de trillingstijd in milliseconden.',a:r4(1 / 250 * 1000),u:'ms',h:['T = 1 ÷ f.','Keer 1000 voor ms.'],s:'T = 1 ÷ 250 = 0,0040 s = 4,0 ms.'},
  {p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:1,q:'Een golf heeft een golflengte van 2,0 m en een frequentie van 170 Hz. Bereken de golfsnelheid.',a:r4(2.0 * 170),u:'m/s',h:['v = λ · f.'],s:'v = 2,0 × 170 = 340 m/s: dat is geluid in lucht.'},
  {p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:1,q:'Geluid van 680 Hz gaat met 340 m/s door de lucht. Bereken de golflengte in cm.',a:r4(340 / 680 * 100),u:'cm',h:['λ = v ÷ f.'],s:'λ = 340 ÷ 680 = 0,50 m = 50 cm.'},
  {p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:1,q:'Bij een golf staat de trilling loodrecht op de richting waarin de golf zich voortplant. Hoe heet zo’n golf?',a:'transversaal',opties:['transversaal','longitudinaal'],h:['Denk aan een touw dat je op en neer beweegt.'],s:'Loodrecht: transversaal. Evenwijdig (zoals geluid): longitudinaal.'},
  {p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:1,q:'Je telt 20 trillingen in 8,0 s. Bereken de frequentie.',a:r4(20 / 8.0),u:'Hz',h:['f = aantal trillingen ÷ tijd.'],s:'f = 20 ÷ 8,0 = 2,5 Hz. (T = 0,40 s.)'},

  {p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:2,q:'Bereken de trillingstijd van een slinger met een lengte van 1,00 m. (g = 9,81 m/s²)',a:r4(2 * Math.PI * Math.sqrt(1.00 / G_AARDE)),u:'s',h:['T = 2π · √(l ÷ g).'],s:`T = 2π × √(1,00 ÷ 9,81) = ${r4(2 * Math.PI * Math.sqrt(1.00 / G_AARDE))} s.`},
  {p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:2,q:'Bereken de trillingstijd van een slinger met een lengte van 0,25 m. (g = 9,81 m/s²)',a:r4(2 * Math.PI * Math.sqrt(0.25 / G_AARDE)),u:'s',h:['T = 2π · √(l ÷ g).'],s:`T = 2π × √(0,25 ÷ 9,81) = ${r4(2 * Math.PI * Math.sqrt(0.25 / G_AARDE))} s.`},
  {p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:2,q:'Een massa van 0,50 kg hangt aan een veer met C = 20 N/m. Bereken de trillingstijd.',a:r4(2 * Math.PI * Math.sqrt(0.50 / 20)),u:'s',h:['T = 2π · √(m ÷ C).'],s:`T = 2π × √(0,50 ÷ 20) = ${r4(2 * Math.PI * Math.sqrt(0.50 / 20))} s.`},
  {p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:2,q:'Een slinger wordt vier keer zo lang. Hoeveel keer zo groot wordt de trillingstijd?',a:'2',h:['T hangt af van √l.'],s:'√4 = 2: de trillingstijd wordt twee keer zo groot.'},
  {p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:2,q:'De massa aan een veer wordt twee keer zo groot. Hoeveel keer zo groot wordt de trillingstijd?',a:r4(Math.SQRT2),h:['T hangt af van √m.'],s:`√2 = ${r4(Math.SQRT2)}.`},
  {p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:2,q:'Geluid is in lucht een ... golf.',a:'longitudinale',opties:['transversale','longitudinale'],h:['De luchtdeeltjes bewegen heen en weer in de richting van de golf.'],s:'Geluid in lucht: verdichtingen en verdunningen in de richting van de golf, dus longitudinaal.'},

  {p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:3,q:'Een gitaarsnaar van 0,65 m trilt in de grondtoon. De golfsnelheid in de snaar is 260 m/s. Bereken de frequentie.',a:r4(260 / (2 * 0.65)),u:'Hz',h:['Bij een snaar (twee vaste uiteinden) is de grondtoon λ = 2L.','f = v ÷ λ.'],s:`λ = 2 × 0,65 = 1,30 m.\nf = 260 ÷ 1,30 = ${r4(260 / 1.30)} Hz.`},
  {p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:3,q:'Dezelfde snaar (0,65 m, 260 m/s). Bereken de frequentie van de eerste boventoon.',a:r4(260 / 0.65),u:'Hz',h:['De eerste boventoon van een snaar heeft λ = L.'],s:`λ = 0,65 m.\nf = 260 ÷ 0,65 = ${r4(260 / 0.65)} Hz: twee keer de grondtoon.`},
  {p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:3,q:'Een buis van 0,85 m is aan één kant dicht. Bereken de frequentie van de grondtoon. (v = 340 m/s)',a:r4(340 / (4 * 0.85)),u:'Hz',h:['Eén kant open, één kant dicht: grondtoon λ = 4L.'],s:`λ = 4 × 0,85 = 3,4 m.\nf = 340 ÷ 3,4 = ${r4(340 / 3.4)} Hz.`},
  {p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:3,q:'Een buis van 0,85 m is aan beide kanten open. Bereken de frequentie van de grondtoon. (v = 340 m/s)',a:r4(340 / (2 * 0.85)),u:'Hz',h:['Twee open uiteinden: grondtoon λ = 2L.'],s:`λ = 2 × 0,85 = 1,7 m.\nf = 340 ÷ 1,7 = ${r4(340 / 1.7)} Hz.`},
  {p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:3,q:'Een slinger heeft een trillingstijd van 1,50 s. Bereken de lengte in cm. (g = 9,81 m/s²)',a:r4(G_AARDE * 1.50 ** 2 / (4 * Math.PI ** 2) * 100),u:'cm',h:['T = 2π · √(l ÷ g), dus l = g · T² ÷ 4π².'],s:`l = 9,81 × 1,50² ÷ 4π² = ${r4(G_AARDE * 2.25 / (4 * Math.PI ** 2))} m = ${r4(G_AARDE * 2.25 / (4 * Math.PI ** 2) * 100)} cm.`},
  {p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:3,q:'Een harmonische trilling: u(t) = A · sin(2π · t ÷ T) met A = 4,0 cm en T = 2,0 s. Bereken u op t = 0,25 s, in cm.',a:r4(4.0 * Math.sin(2 * Math.PI * 0.25 / 2.0)),u:'cm',h:['Rekenmachine op radialen (RAD), of reken de fase om naar graden: t ÷ T × 360°.'],s:`2π × 0,25 ÷ 2,0 = π/4 rad (45°).\nu = 4,0 × sin 45° = ${r4(4.0 * Math.sin(Math.PI / 4))} cm.`},
]

export const EXACT_5VWO: Ruw[] = [...ZUUR, ...REDOX, ...EVENWICHT, ...KRACHTEN, ...CIRKEL, ...GOLVEN]
