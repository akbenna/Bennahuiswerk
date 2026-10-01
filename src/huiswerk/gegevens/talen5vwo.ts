/**
 * NEDERLANDS EN ENGELS VOOR 5 VWO
 *
 * Wat er bij Amaani ontbrak, gemeten tegen de examenstof:
 *
 *   Nederlands  drogredenen hadden geen eigen tegel, terwijl argumentatie het
 *               hart is van het centraal examen; formuleren (stijlfouten) had
 *               één opgave; op niveau 1 stond bijna niets
 *   Engels      geen conditionals en geen signaalwoorden (linking words), die
 *               bij leesvaardigheid steeds terugkomen; niets op niveau 1
 *
 * Zes opgaven per onderwerp per niveau, zoals in `exact5vwo.ts`.
 *
 * Bij het herkennen van een drogreden, een stijlfout of een tekstverband is het
 * antwoord een vakterm die op tien manieren te spellen is. Daarom zijn dat
 * meerkeuzevragen. Bij Engels wordt de werkwoordsvorm ingetypt, met de
 * samengetrokken vormen (I’ve, she’s, won’t) als goed antwoord erbij, en via
 * `metVarianten` met een rechte of een gekrulde apostrof.
 *
 * De namen van de drogredenen volgen het gangbare gebruik in de methodes voor
 * het examen Nederlands vwo.
 */
import type { Opgave } from './soorten'
import { metVarianten } from './frans5vwo'

type Ruw = Omit<Opgave, 'id'>

const DR = {
  aanval: 'persoonlijke aanval',
  dilemma: 'vals dilemma',
  generalisatie: 'overhaaste generalisatie',
  cirkel: 'cirkelredenering',
  stroman: 'vertekenen van een standpunt (stroman)',
  hellend: 'hellend vlak',
  oorzaak: 'onjuist oorzakelijk verband',
  autoriteit: 'onjuist beroep op autoriteit',
  bewijslast: 'ontduiken van de bewijslast',
  publiek: 'bespelen van het publiek',
  vergelijking: 'onjuiste vergelijking',
}
/** Vier opties: het goede antwoord en drie andere, in een vaste volgorde. */
const vier = (goed: string, ...anders: string[]): string[] =>
  [goed, ...anders].sort((a, b) => a.localeCompare(b, 'nl'))

/* ============================================================== drogredenen */

const DROGREDENEN: Ruw[] = [
  {p:'amaani',v:'nederlands',t:'Drogredenen',lvl:1,q:'Iemand valt de persoon aan in plaats van diens argumenten. Welke drogreden is dat?',a:DR.aanval,opties:vier(DR.aanval, DR.dilemma, DR.cirkel, DR.hellend),h:['Op de man spelen, niet op de bal.'],s:'Persoonlijke aanval (ad hominem): de persoon wordt onderuitgehaald, het argument blijft onbesproken.'},
  {p:'amaani',v:'nederlands',t:'Drogredenen',lvl:1,q:'Iemand doet alsof er maar twee keuzes zijn, terwijl er meer mogelijkheden zijn. Welke drogreden?',a:DR.dilemma,opties:vier(DR.dilemma, DR.aanval, DR.generalisatie, DR.stroman),h:['Of ... of ..., en verder niets?'],s:'Vals dilemma: er worden twee uitersten voorgesteld alsof er niets tussen zit.'},
  {p:'amaani',v:'nederlands',t:'Drogredenen',lvl:1,q:'Iemand trekt een algemene conclusie uit te weinig gevallen. Welke drogreden?',a:DR.generalisatie,opties:vier(DR.generalisatie, DR.vergelijking, DR.cirkel, DR.dilemma),h:['Eén of twee voorbeelden worden een regel.'],s:'Overhaaste generalisatie: te weinig of niet-representatieve gevallen.'},
  {p:'amaani',v:'nederlands',t:'Drogredenen',lvl:1,q:'Het standpunt wordt in andere woorden als argument gebruikt. Welke drogreden?',a:DR.cirkel,opties:vier(DR.cirkel, DR.aanval, DR.hellend, DR.oorzaak),h:['Je komt uit waar je begon.'],s:'Cirkelredenering: het argument zegt hetzelfde als het standpunt.'},
  {p:'amaani',v:'nederlands',t:'Drogredenen',lvl:1,q:'Het standpunt van de tegenstander wordt overdreven of verdraaid weergegeven, zodat het makkelijk aan te vallen is. Welke drogreden?',a:DR.stroman,opties:vier(DR.stroman, DR.aanval, DR.dilemma, DR.autoriteit),h:['Je bestrijdt een pop die je zelf hebt neergezet.'],s:'Vertekenen van een standpunt (stroman): je valt een standpunt aan dat de ander niet heeft.'},
  {p:'amaani',v:'nederlands',t:'Drogredenen',lvl:1,q:'Volgens de spreker leidt één kleine stap onvermijdelijk tot een ramp. Welke drogreden?',a:DR.hellend,opties:vier(DR.hellend, DR.oorzaak, DR.generalisatie, DR.cirkel),h:['Als je eenmaal begint te glijden ...'],s:'Hellend vlak: een reeks steeds ergere gevolgen zonder bewijs dat ze echt volgen.'},

  {p:'amaani',v:'nederlands',t:'Drogredenen',lvl:2,q:'"Je moet niet luisteren naar wat Mark over het klimaat zegt, hij rijdt zelf in een dikke auto." Welke drogreden?',a:DR.aanval,opties:vier(DR.aanval, DR.stroman, DR.autoriteit, DR.vergelijking),h:['Wordt hier het argument bestreden of Mark zelf?'],s:'Persoonlijke aanval: wat Mark doet, zegt niets over of zijn argument klopt.'},
  {p:'amaani',v:'nederlands',t:'Drogredenen',lvl:2,q:'"Mijn buurman en zijn zoon zijn allebei slecht in rekenen, dus mannen kunnen niet rekenen." Welke drogreden?',a:DR.generalisatie,opties:vier(DR.generalisatie, DR.oorzaak, DR.cirkel, DR.aanval),h:['Hoeveel gevallen worden er genoemd?'],s:'Overhaaste generalisatie: twee mensen zeggen niets over alle mannen.'},
  {p:'amaani',v:'nederlands',t:'Drogredenen',lvl:2,q:'"Of we verbieden alle auto’s in de binnenstad, of de stad stikt in de uitlaatgassen." Welke drogreden?',a:DR.dilemma,opties:vier(DR.dilemma, DR.hellend, DR.stroman, DR.publiek),h:['Zijn er echt maar twee mogelijkheden?'],s:'Vals dilemma: er zijn tussenvormen, zoals milieuzones of minder parkeerplaatsen.'},
  {p:'amaani',v:'nederlands',t:'Drogredenen',lvl:2,q:'"Sinds de nieuwe burgemeester er is, regent het vaker. Hij brengt ongeluk." Welke drogreden?',a:DR.oorzaak,opties:vier(DR.oorzaak, DR.generalisatie, DR.aanval, DR.dilemma),h:['Na iets is nog niet dóór iets.'],s:'Onjuist oorzakelijk verband: twee dingen gebeuren na elkaar, maar het een veroorzaakt het ander niet.'},
  {p:'amaani',v:'nederlands',t:'Drogredenen',lvl:2,q:'"Deze tandpasta is de beste, want voetballer X gebruikt hem ook." Welke drogreden?',a:DR.autoriteit,opties:vier(DR.autoriteit, DR.publiek, DR.generalisatie, DR.vergelijking),h:['Is een voetballer deskundig op het gebied van tandpasta?'],s:'Onjuist beroep op autoriteit: de voetballer is geen deskundige op dit terrein.'},
  {p:'amaani',v:'nederlands',t:'Drogredenen',lvl:2,q:'"Als we huiswerk afschaffen, gaan leerlingen straks ook toetsen weigeren, en dan stort het hele onderwijs in." Welke drogreden?',a:DR.hellend,opties:vier(DR.hellend, DR.dilemma, DR.oorzaak, DR.cirkel),h:['Een kleine stap met steeds ergere gevolgen.'],s:'Hellend vlak: dat het een tot het ander leidt, wordt niet onderbouwd.'},

  {p:'amaani',v:'nederlands',t:'Drogredenen',lvl:3,q:'A: "Ik wil wat minder vlees eten." B: "Jij wilt dus dat iedereen veganist wordt!" Welke drogreden maakt B?',a:DR.stroman,opties:vier(DR.stroman, DR.dilemma, DR.hellend, DR.aanval),h:['Zegt A dat?'],s:'Vertekenen van een standpunt: B maakt van "minder vlees" iets veel extremers en valt dat aan.'},
  {p:'amaani',v:'nederlands',t:'Drogredenen',lvl:3,q:'"Dat mijn plan werkt? Bewijs jij maar eens dat het níet werkt." Welke drogreden?',a:DR.bewijslast,opties:vier(DR.bewijslast, DR.cirkel, DR.stroman, DR.publiek),h:['Wie moet hier eigenlijk iets bewijzen?'],s:'Ontduiken van de bewijslast: wie een standpunt inneemt, moet het zelf verdedigen.'},
  {p:'amaani',v:'nederlands',t:'Drogredenen',lvl:3,q:'"Dit medicijn werkt goed, want het zorgt ervoor dat mensen er beter van worden." Welke drogreden?',a:DR.cirkel,opties:vier(DR.cirkel, DR.autoriteit, DR.oorzaak, DR.generalisatie),h:['Is "beter worden" iets anders dan "goed werken"?'],s:'Cirkelredenering: het argument herhaalt het standpunt.'},
  {p:'amaani',v:'nederlands',t:'Drogredenen',lvl:3,q:'"Steun dit plan nou gewoon, al je vrienden doen het ook." Welke drogreden?',a:DR.publiek,opties:vier(DR.publiek, DR.autoriteit, DR.aanval, DR.generalisatie),h:['Waarom zou het plan goed zijn? Omdat veel mensen het vinden?'],s:'Bespelen van het publiek: er wordt ingespeeld op groepsdruk in plaats van op argumenten.'},
  {p:'amaani',v:'nederlands',t:'Drogredenen',lvl:3,q:'"Scholen zijn net fabrieken: daar komt ook steeds hetzelfde product uit. Dus moeten scholen efficiënter werken, net als fabrieken." Welke drogreden?',a:DR.vergelijking,opties:vier(DR.vergelijking, DR.generalisatie, DR.stroman, DR.dilemma),h:['Lijken scholen op de punten die ertoe doen echt op fabrieken?'],s:'Onjuiste vergelijking: leerlingen zijn geen producten; de gelijkenis gaat niet op voor het punt dat gemaakt wordt.'},
  {p:'amaani',v:'nederlands',t:'Drogredenen',lvl:3,q:'"Volgens het RIVM, op basis van groot onderzoek, beschermt vaccinatie tegen mazelen." Is dit een drogreden?',a:'nee, een terecht beroep op deskundigheid',opties:['nee, een terecht beroep op deskundigheid','ja, een onjuist beroep op autoriteit'],h:['Is het RIVM deskundig op dit gebied, en wordt er onderzoek genoemd?'],s:'Een beroep op een autoriteit is pas een drogreden als die autoriteit niet deskundig is op dat gebied. Het RIVM is dat wel.'},
]

/* ================================================================ formuleren */

const FOUT = {
  pleonasme: 'pleonasme',
  tautologie: 'tautologie',
  contaminatie: 'contaminatie',
  incongruentie: 'incongruentie',
  ontkenning: 'dubbele ontkenning',
  samentrekking: 'onjuiste samentrekking',
  beknopt: 'onjuiste beknopte bijzin',
  verwijzing: 'onjuiste verwijzing',
}

const FORMULEREN: Ruw[] = [
  {p:'amaani',v:'nederlands',t:'Formuleren',lvl:1,q:'"Een witte schimmel." Welke stijlfout?',a:FOUT.pleonasme,opties:vier(FOUT.pleonasme, FOUT.tautologie, FOUT.contaminatie, FOUT.incongruentie),h:['Een schimmel (paard) is altijd wit.'],s:'Pleonasme: het bijvoeglijk naamwoord zegt iets wat al in het zelfstandig naamwoord zit.'},
  {p:'amaani',v:'nederlands',t:'Formuleren',lvl:1,q:'"Hij was al reeds vertrokken." Welke stijlfout?',a:FOUT.tautologie,opties:vier(FOUT.tautologie, FOUT.pleonasme, FOUT.contaminatie, FOUT.ontkenning),h:['"al" en "reeds" betekenen hetzelfde.'],s:'Tautologie: twee woorden met dezelfde betekenis naast elkaar.'},
  {p:'amaani',v:'nederlands',t:'Formuleren',lvl:1,q:'"Het loont de moeite waard om dat museum te bezoeken." Welke stijlfout?',a:FOUT.contaminatie,opties:vier(FOUT.contaminatie, FOUT.tautologie, FOUT.pleonasme, FOUT.samentrekking),h:['Twee uitdrukkingen door elkaar: "het loont de moeite" en "het is de moeite waard".'],s:'Contaminatie: twee uitdrukkingen zijn in elkaar geschoven. Kies er één.'},
  {p:'amaani',v:'nederlands',t:'Formuleren',lvl:1,q:'"Een groep leerlingen hebben een petitie getekend." Welke stijlfout?',a:FOUT.incongruentie,opties:vier(FOUT.incongruentie, FOUT.verwijzing, FOUT.contaminatie, FOUT.samentrekking),h:['Wat is het onderwerp: de groep of de leerlingen?'],s:'Incongruentie: het onderwerp "een groep" is enkelvoud, dus "heeft".'},
  {p:'amaani',v:'nederlands',t:'Formuleren',lvl:1,q:'"Het meisje die daar loopt, is mijn zus." Welk woord is fout?',a:'die',h:['Het is "het meisje".'],s:'Bij een het-woord hoort "dat": het meisje dat daar loopt.'},
  {p:'amaani',v:'nederlands',t:'Formuleren',lvl:1,q:'"Niemand heeft niets gezien." (bedoeld: niemand heeft iets gezien) Welke stijlfout?',a:FOUT.ontkenning,opties:vier(FOUT.ontkenning, FOUT.tautologie, FOUT.pleonasme, FOUT.incongruentie),h:['Twee keer "niet".'],s:'Dubbele ontkenning: letterlijk staat er dat iedereen iets heeft gezien.'},

  {p:'amaani',v:'nederlands',t:'Formuleren',lvl:2,q:'"Het bedrijf heeft hun winst verhoogd." Welk woord moet er in plaats van "hun"?',a:'zijn',h:['Het bedrijf is enkelvoud en onzijdig.'],s:'Het bedrijf → zijn winst.'},
  {p:'amaani',v:'nederlands',t:'Formuleren',lvl:2,q:'"De reden waarom hij laat was, is omdat de trein vertraging had." Welke stijlfout?',a:FOUT.contaminatie,opties:vier(FOUT.contaminatie, FOUT.tautologie, FOUT.pleonasme, FOUT.verwijzing),h:['"De reden is dat" en "omdat" zijn door elkaar gegaan.'],s:'Contaminatie. Goed: "De reden is dat de trein vertraging had" of "Hij was laat omdat ..."'},
  {p:'amaani',v:'nederlands',t:'Formuleren',lvl:2,q:'"Fietsend naar school begon het te regenen." Welke stijlfout?',a:FOUT.beknopt,opties:vier(FOUT.beknopt, FOUT.samentrekking, FOUT.incongruentie, FOUT.verwijzing),h:['Wie fietst er volgens deze zin?'],s:'Onjuiste beknopte bijzin: het onderwerp van de hoofdzin ("het") fietst niet. Goed: "Toen ik naar school fietste, begon het te regenen."'},
  {p:'amaani',v:'nederlands',t:'Formuleren',lvl:2,q:'"Ik heb een boek gelezen en naar huis gefietst." Welke stijlfout?',a:FOUT.samentrekking,opties:vier(FOUT.samentrekking, FOUT.contaminatie, FOUT.beknopt, FOUT.tautologie),h:['Bij "gefietst" hoort "ben", niet "heb".'],s:'Onjuiste samentrekking: "heb" kan niet voor "gefietst" dienen. Goed: "... gelezen en ben naar huis gefietst."'},
  {p:'amaani',v:'nederlands',t:'Formuleren',lvl:2,q:'"Maar hij kwam echter niet opdagen." Welke stijlfout?',a:FOUT.tautologie,opties:vier(FOUT.tautologie, FOUT.pleonasme, FOUT.contaminatie, FOUT.ontkenning),h:['"maar" en "echter" betekenen hetzelfde.'],s:'Tautologie: twee woorden van dezelfde soort met dezelfde betekenis. Kies "maar" of "echter".'},
  {p:'amaani',v:'nederlands',t:'Formuleren',lvl:2,q:'"De meeste kinderen van de klas is ziek." Welk woord moet er in plaats van "is"?',a:'zijn',h:['Het onderwerp is "de meeste kinderen".'],s:'Meervoud onderwerp, meervoud persoonsvorm: zijn.'},

  {p:'amaani',v:'nederlands',t:'Formuleren',lvl:3,q:'"Het team, dat al jaren samenwerkt, hebben de prijs gewonnen." Welk woord is fout?',a:'hebben',h:['Zoek het onderwerp; de bijzin ertussen leidt af.'],s:'Het onderwerp is "het team", enkelvoud: het team heeft de prijs gewonnen.'},
  {p:'amaani',v:'nederlands',t:'Formuleren',lvl:3,q:'"De directie heeft besloten dat zij de regels niet meer gaan veranderen." Welk woord is fout?',a:'gaan',h:['"zij" verwijst naar de directie: enkelvoud.'],s:'De directie (zij, enkelvoud) gaat de regels niet meer veranderen.'},
  {p:'amaani',v:'nederlands',t:'Formuleren',lvl:3,q:'"Als leerling van 5 vwo vindt de mentor dat ik meer moet plannen." Wie is volgens deze zin de leerling van 5 vwo?',a:'de mentor',opties:['de mentor','ik'],h:['De bepaling vooraan hoort bij het onderwerp van de zin.'],s:'Letterlijk staat er dat de mentor leerling van 5 vwo is. Goed: "De mentor vindt dat ik, als leerling van 5 vwo, meer moet plannen."'},
  {p:'amaani',v:'nederlands',t:'Formuleren',lvl:3,q:'"Hij is ziek geworden en twee weken thuisgebleven." Is deze samentrekking juist?',a:'ja',opties:['ja','nee'],h:['Kan "is" bij beide voltooide deelwoorden?'],s:'Ja: "is ziek geworden" en "is thuisgebleven" hebben allebei "is".'},
  {p:'amaani',v:'nederlands',t:'Formuleren',lvl:3,q:'"Zij heeft hard gewerkt en geslaagd." Is deze samentrekking juist?',a:'nee',opties:['ja','nee'],h:['Heeft geslaagd, of is geslaagd?'],s:'Nee: "is geslaagd". Goed: "Zij heeft hard gewerkt en is geslaagd."'},
  {p:'amaani',v:'nederlands',t:'Formuleren',lvl:3,q:'Waarom is "een korte samenvatting" géén pleonasme?',a:'een samenvatting kan ook lang zijn',opties:['een samenvatting kan ook lang zijn','omdat kort en samenvatting verschillende woordsoorten zijn','omdat het een tautologie is'],h:['Een pleonasme zegt iets wat altijd al waar is.'],s:'"Kort" voegt iets toe: een samenvatting is niet altijd kort. Bij "witte sneeuw" voegt "wit" niets toe.'},
]

/* ============================================================ tekstverbanden */

const VB = {
  opsomming: 'opsomming', tegenstelling: 'tegenstelling', oorzaak: 'oorzaak-gevolg', voorbeeld: 'voorbeeld',
  conclusie: 'conclusie', doel: 'doel', voorwaarde: 'voorwaarde', middel: 'middel', toegeving: 'toegeving',
  vergelijking: 'vergelijking', tijd: 'tijd (volgorde)',
}

const VERBANDEN: Ruw[] = [
  {p:'amaani',v:'nederlands',t:'Tekstverbanden',lvl:1,q:'Welk verband geeft "bovendien" aan?',a:VB.opsomming,opties:vier(VB.opsomming, VB.tegenstelling, VB.conclusie, VB.voorbeeld),h:['Er komt nog iets bij.'],s:'Opsomming: bovendien, ook, daarnaast, verder.'},
  {p:'amaani',v:'nederlands',t:'Tekstverbanden',lvl:1,q:'Welk verband geeft "maar" aan?',a:VB.tegenstelling,opties:vier(VB.tegenstelling, VB.opsomming, VB.oorzaak, VB.doel),h:['Er volgt iets anders dan je verwacht.'],s:'Tegenstelling: maar, echter, daarentegen.'},
  {p:'amaani',v:'nederlands',t:'Tekstverbanden',lvl:1,q:'Welk verband geeft "bijvoorbeeld" aan?',a:VB.voorbeeld,opties:vier(VB.voorbeeld, VB.conclusie, VB.vergelijking, VB.opsomming),h:['Het woord zegt het al.'],s:'Voorbeeld: bijvoorbeeld, zo, zoals.'},
  {p:'amaani',v:'nederlands',t:'Tekstverbanden',lvl:1,q:'Welk verband geeft "kortom" aan?',a:VB.conclusie,opties:vier(VB.conclusie, VB.voorbeeld, VB.tegenstelling, VB.tijd),h:['Wat komt er na "kortom" meestal?'],s:'Conclusie of samenvatting: kortom, dus, concluderend.'},
  {p:'amaani',v:'nederlands',t:'Tekstverbanden',lvl:1,q:'"Ze spaart om een scooter te kopen." Welk verband geeft "om ... te" aan?',a:VB.doel,opties:vier(VB.doel, VB.oorzaak, VB.middel, VB.voorwaarde),h:['Waarvóór spaart ze?'],s:'Doel: om ... te, opdat, zodat (als het bedoeld is).'},
  {p:'amaani',v:'nederlands',t:'Tekstverbanden',lvl:1,q:'"Als het regent, blijf ik thuis." Welk verband geeft "als" hier aan?',a:VB.voorwaarde,opties:vier(VB.voorwaarde, VB.tijd, VB.vergelijking, VB.doel),h:['Alleen in dat geval.'],s:'Voorwaarde: als, mits, tenzij, indien.'},

  {p:'amaani',v:'nederlands',t:'Tekstverbanden',lvl:2,q:'Welk verband geeft "door middel van" aan?',a:VB.middel,opties:vier(VB.middel, VB.oorzaak, VB.doel, VB.voorbeeld),h:['Waarmee doe je het?'],s:'Middel: door middel van, met behulp van, door te.'},
  {p:'amaani',v:'nederlands',t:'Tekstverbanden',lvl:2,q:'Welk verband geeft "ondanks" aan?',a:VB.toegeving,opties:vier(VB.toegeving, VB.oorzaak, VB.opsomming, VB.conclusie),h:['Iets gebeurt, hoewel je het tegendeel zou verwachten.'],s:'Toegeving: ondanks, hoewel, weliswaar ... maar.'},
  {p:'amaani',v:'nederlands',t:'Tekstverbanden',lvl:2,q:'Welk verband geeft "daardoor" aan?',a:VB.oorzaak,opties:vier(VB.oorzaak, VB.doel, VB.middel, VB.tegenstelling),h:['Het een gebeurt door het ander.'],s:'Oorzaak-gevolg: daardoor, doordat, waardoor, met als gevolg.'},
  {p:'amaani',v:'nederlands',t:'Tekstverbanden',lvl:2,q:'"De bus had vertraging. Ik was dus te laat." Welk verband geeft "dus" aan?',a:VB.conclusie,opties:vier(VB.conclusie, VB.opsomming, VB.voorbeeld, VB.toegeving),h:['Wat volgt er uit het voorgaande?'],s:'Conclusie (gevolgtrekking): dus, daarom, derhalve.'},
  {p:'amaani',v:'nederlands',t:'Tekstverbanden',lvl:2,q:'Welk verband geeft "evenals" aan?',a:VB.vergelijking,opties:vier(VB.vergelijking, VB.opsomming, VB.tegenstelling, VB.voorwaarde),h:['Net zoals.'],s:'Vergelijking: evenals, net als, zoals, eveneens.'},
  {p:'amaani',v:'nederlands',t:'Tekstverbanden',lvl:2,q:'"Je mag mee, mits je op tijd thuis bent." Welk verband geeft "mits" aan?',a:VB.voorwaarde,opties:vier(VB.voorwaarde, VB.toegeving, VB.doel, VB.tijd),h:['Op voorwaarde dat.'],s:'Voorwaarde: mits = op voorwaarde dat.'},

  {p:'amaani',v:'nederlands',t:'Tekstverbanden',lvl:3,q:'"Het museum trekt steeds minder bezoekers. De toegangsprijs is vorig jaar verdubbeld." Welk verband is er tussen de twee zinnen?',a:VB.oorzaak,opties:vier(VB.oorzaak, VB.tegenstelling, VB.opsomming, VB.voorbeeld),h:['Er staat geen signaalwoord. Waarom komen er minder bezoekers?'],s:'Oorzaak-gevolg: de tweede zin geeft de oorzaak van de eerste. Zonder signaalwoord moet je het verband zelf afleiden.'},
  {p:'amaani',v:'nederlands',t:'Tekstverbanden',lvl:3,q:'"Veel jongeren slapen te weinig. Zo gaat een op de drie pas na middernacht naar bed." Welk verband geeft "zo" hier aan?',a:VB.voorbeeld,opties:vier(VB.voorbeeld, VB.conclusie, VB.vergelijking, VB.middel),h:['De tweede zin maakt de eerste concreet.'],s:'Voorbeeld: "zo" leidt hier een concreet geval in. (Let op: "zo" kan ook vergelijking of conclusie zijn; het hangt van de zin af.)'},
  {p:'amaani',v:'nederlands',t:'Tekstverbanden',lvl:3,q:'"Thuiswerken bespaart veel reistijd. Toch voelen veel thuiswerkers zich eenzaam." Welk verband?',a:VB.tegenstelling,opties:vier(VB.tegenstelling, VB.oorzaak, VB.opsomming, VB.conclusie),h:['Een voordeel, en dan ...'],s:'Tegenstelling: "toch" zet een nadeel tegenover het voordeel.'},
  {p:'amaani',v:'nederlands',t:'Tekstverbanden',lvl:3,q:'"De gemeente plant bomen langs de straten. Zo wil zij de hitte in de zomer beperken." Welk verband?',a:VB.doel,opties:vier(VB.doel, VB.voorbeeld, VB.oorzaak, VB.tegenstelling),h:['Waaróm plant de gemeente bomen?'],s:'Doel: de tweede zin noemt waarvoor de bomen geplant worden. Let op: "zo" is hier geen voorbeeld maar "op die manier".'},
  {p:'amaani',v:'nederlands',t:'Tekstverbanden',lvl:3,q:'"Eerst lees je de vragen. Daarna lees je de tekst." Welk verband?',a:VB.tijd,opties:vier(VB.tijd, VB.opsomming, VB.voorwaarde, VB.conclusie),h:['Eerst ..., daarna ...'],s:'Tijd (chronologie): eerst, daarna, vervolgens, ten slotte.'},
  {p:'amaani',v:'nederlands',t:'Tekstverbanden',lvl:3,q:'"Hoewel de proef mislukte, leerden de onderzoekers er veel van." Welk verband?',a:VB.toegeving,opties:vier(VB.toegeving, VB.tegenstelling, VB.oorzaak, VB.tijd),h:['Je geeft iets toe, en toch ...'],s:'Toegeving: het mislukken wordt toegegeven, maar het leverde toch iets op.'},
]

/* ===================================================================== engels */

const TENSES: Ruw[] = [
  {p:'amaani',v:'engels',t:'Tenses',lvl:1,q:'Present perfect: She ___ (finish) her homework.',a:'has finished',alt:['she’s finished','’s finished'],h:['has/have + past participle.'],s:'She has finished her homework.'},
  {p:'amaani',v:'engels',t:'Tenses',lvl:1,q:'Past simple: Yesterday we ___ (go) to the cinema.',a:'went',h:['go is onregelmatig: go, went, gone.'],s:'Yesterday → past simple: we went.'},
  {p:'amaani',v:'engels',t:'Tenses',lvl:1,q:'Present continuous: Look! It ___ (rain).',a:'is raining',alt:['’s raining'],h:['am/is/are + -ing.','"Look!": het gebeurt nu.'],s:'It is raining.'},
  {p:'amaani',v:'engels',t:'Tenses',lvl:1,q:'Wat is de past simple van "to write"?',a:'wrote',h:['write, wrote, written.'],s:'write, wrote, written.'},
  {p:'amaani',v:'engels',t:'Tenses',lvl:1,q:'Wat is het past participle (voltooid deelwoord) van "to speak"?',a:'spoken',h:['speak, spoke, ...'],s:'speak, spoke, spoken.'},
  {p:'amaani',v:'engels',t:'Tenses',lvl:1,q:'Future: I think it ___ (be) cold tomorrow.',a:'will be',alt:['’ll be'],h:['Een voorspelling: will + hele werkwoord.'],s:'I think it will be cold tomorrow.'},

  {p:'amaani',v:'engels',t:'Tenses',lvl:2,q:'I ___ (live) here since 2015.',a:'have lived',alt:['’ve lived','have been living','’ve been living'],h:['"since": iets begon in het verleden en loopt nog door.'],s:'Present perfect: I have lived here since 2015 (en woon er nog).'},
  {p:'amaani',v:'engels',t:'Tenses',lvl:2,q:'She ___ (visit) London last year.',a:'visited',h:['"last year": een afgesloten moment.'],s:'Past simple bij een afgesloten tijdstip: she visited.'},
  {p:'amaani',v:'engels',t:'Tenses',lvl:2,q:'Have you ever ___ (be) to Spain?',a:'been',h:['Het past participle van "be".'],s:'Have you ever been to Spain?'},
  {p:'amaani',v:'engels',t:'Tenses',lvl:2,q:'We ___ (not / see) him yet.',a:'haven’t seen',alt:['have not seen'],h:['"yet": present perfect.'],s:'We haven’t seen him yet.'},
  {p:'amaani',v:'engels',t:'Tenses',lvl:2,q:'When I came home, my brother ___ (watch) TV.',a:'was watching',h:['Een handeling die bezig was toen er iets anders gebeurde.'],s:'Past continuous: was watching.'},
  {p:'amaani',v:'engels',t:'Tenses',lvl:2,q:'By the time we arrived, the film ___ (start).',a:'had started',alt:['’d started'],h:['Wat gebeurde er eerst, vóór een ander moment in het verleden?'],s:'Past perfect: the film had started (voordat wij aankwamen).'},

  {p:'amaani',v:'engels',t:'Tenses',lvl:3,q:'I ___ (wait) for an hour now. Where are you?',a:'have been waiting',alt:['’ve been waiting'],h:['Het duurt al een uur en is nog bezig.'],s:'Present perfect continuous: I have been waiting.'},
  {p:'amaani',v:'engels',t:'Tenses',lvl:3,q:'This time next week, I ___ (lie) on the beach.',a:'will be lying',alt:['’ll be lying'],h:['Op een moment in de toekomst ben je ermee bezig.'],s:'Future continuous: I will be lying on the beach.'},
  {p:'amaani',v:'engels',t:'Tenses',lvl:3,q:'She said that she ___ (lose) her keys. (indirecte rede)',a:'had lost',alt:['’d lost'],h:['Directe rede: "I have lost my keys." Eén stap terug in de tijd.'],s:'In de indirecte rede schuift de present perfect naar de past perfect: had lost.'},
  {p:'amaani',v:'engels',t:'Tenses',lvl:3,q:'He ___ (work) at the company for ten years before he retired.',a:'had worked',alt:['had been working','’d worked','’d been working'],h:['Een periode vóór een moment in het verleden.'],s:'Past perfect: he had worked there for ten years before he retired.'},
  {p:'amaani',v:'engels',t:'Tenses',lvl:3,q:'According to the timetable, the train ___ (leave) at 8.15 tomorrow.',a:'leaves',h:['Een dienstregeling ligt vast.'],s:'Present simple voor een vast schema in de toekomst: the train leaves.'},
  {p:'amaani',v:'engels',t:'Tenses',lvl:3,q:'"I ___ my keys. I can’t get in." Kies.',a:'have lost',opties:['have lost','lost'],h:['Heeft het verleden gevolg voor nu?'],s:'Present perfect: het verlies heeft nu nog gevolgen (ik kom er niet in).'},
]

const CONDITIONALS: Ruw[] = [
  {p:'amaani',v:'engels',t:'Conditionals',lvl:1,q:'If you heat ice, it ___ (melt).',a:'melts',h:['Altijd waar: zero conditional.'],s:'Zero conditional: if + present, present. It melts.'},
  {p:'amaani',v:'engels',t:'Conditionals',lvl:1,q:'If it rains tomorrow, we ___ (stay) at home.',a:'will stay',alt:['’ll stay'],h:['Een reële mogelijkheid: first conditional.'],s:'First conditional: if + present, will + werkwoord.'},
  {p:'amaani',v:'engels',t:'Conditionals',lvl:1,q:'If I ___ (be) rich, I would travel the world.',a:'were',alt:['was'],h:['Second conditional: if + past simple.'],s:'If I were rich ... (were is netjes, was hoor je ook).'},
  {p:'amaani',v:'engels',t:'Conditionals',lvl:1,q:'Welk type is: "If I had known, I would have come."?',a:'third',opties:['first','second','third'],h:['had + past participle, would have + past participle.'],s:'Third conditional: over het verleden, en het is niet gebeurd.'},
  {p:'amaani',v:'engels',t:'Conditionals',lvl:1,q:'Welk type is: "If I win, I will buy a car."?',a:'first',opties:['first','second','third'],h:['if + present, will.'],s:'First conditional: een echte mogelijkheid in de toekomst.'},
  {p:'amaani',v:'engels',t:'Conditionals',lvl:1,q:'Welk type is: "If I won, I would buy a car."?',a:'second',opties:['first','second','third'],h:['if + past simple, would.'],s:'Second conditional: denkbeeldig of onwaarschijnlijk.'},

  {p:'amaani',v:'engels',t:'Conditionals',lvl:2,q:'If I ___ (know) the answer, I would tell you.',a:'knew',h:['Second conditional: if + past simple.'],s:'If I knew the answer, I would tell you.'},
  {p:'amaani',v:'engels',t:'Conditionals',lvl:2,q:'If she had left earlier, she ___ (not / miss) the train.',a:'wouldn’t have missed',alt:['would not have missed'],h:['Third conditional: would have + past participle.'],s:'She wouldn’t have missed the train.'},
  {p:'amaani',v:'engels',t:'Conditionals',lvl:2,q:'Unless you hurry, you ___ (be) late.',a:'will be',alt:['’ll be'],h:['unless = if not; first conditional.'],s:'Unless you hurry (= if you don’t hurry), you will be late.'},
  {p:'amaani',v:'engels',t:'Conditionals',lvl:2,q:'If they ___ (invite) me, I would have gone.',a:'had invited',alt:['’d invited'],h:['Third conditional: if + past perfect.'],s:'If they had invited me, I would have gone.'},
  {p:'amaani',v:'engels',t:'Conditionals',lvl:2,q:'What would you do if you ___ (find) a wallet in the street?',a:'found',h:['Second conditional.'],s:'If you found a wallet ...'},
  {p:'amaani',v:'engels',t:'Conditionals',lvl:2,q:'If water ___ (reach) 100 °C, it boils.',a:'reaches',h:['Een natuurwet: zero conditional.'],s:'If water reaches 100 °C, it boils.'},

  {p:'amaani',v:'engels',t:'Conditionals',lvl:3,q:'If I had studied medicine, I ___ (be) a doctor now.',a:'would be',alt:['’d be'],h:['Gemengd: de oorzaak ligt in het verleden, het gevolg is nu.'],s:'Mixed conditional: if + past perfect, would + werkwoord (nu).'},
  {p:'amaani',v:'engels',t:'Conditionals',lvl:3,q:'If I were you, I ___ (apologise).',a:'would apologise',alt:['would apologize','’d apologise','’d apologize'],h:['Een advies met "If I were you".'],s:'If I were you, I would apologise.'},
  {p:'amaani',v:'engels',t:'Conditionals',lvl:3,q:'___ I known, I would have helped. (één woord, zonder "if")',a:'had',h:['Inversie: het hulpwerkwoord komt vooraan.'],s:'Had I known = If I had known. Formeel, en komt voor in examenteksten.'},
  {p:'amaani',v:'engels',t:'Conditionals',lvl:3,q:'I wish I ___ (have) more time.',a:'had',h:['wish over nu: past simple.'],s:'I wish I had more time (maar die heb ik niet).'},
  {p:'amaani',v:'engels',t:'Conditionals',lvl:3,q:'I wish I ___ (not / say) that yesterday.',a:'hadn’t said',alt:['had not said'],h:['wish over het verleden: past perfect.'],s:'I wish I hadn’t said that (maar ik heb het wel gezegd).'},
  {p:'amaani',v:'engels',t:'Conditionals',lvl:3,q:'Provided that you ___ (finish) on time, you can go out.',a:'finish',h:['provided that = op voorwaarde dat; first conditional.'],s:'Provided that you finish on time ... (present simple, geen will).'},
]

const LINKING: Ruw[] = [
  {p:'amaani',v:'engels',t:'Linking words',lvl:1,q:'Wat betekent "however"?',a:'echter',alt:['maar','toch'],h:['Een tegenstelling.'],s:'however = echter, maar.'},
  {p:'amaani',v:'engels',t:'Linking words',lvl:1,q:'Wat betekent "therefore"?',a:'daarom',alt:['dus','daardoor','om die reden'],h:['Een conclusie of gevolg.'],s:'therefore = daarom, dus.'},
  {p:'amaani',v:'engels',t:'Linking words',lvl:1,q:'Wat betekent "moreover"?',a:'bovendien',alt:['daarnaast','verder','ook'],h:['Er komt nog iets bij.'],s:'moreover = bovendien.'},
  {p:'amaani',v:'engels',t:'Linking words',lvl:1,q:'Wat betekent "despite"?',a:'ondanks',alt:['ondanks dat','in weerwil van'],h:['Toegeving.'],s:'despite = ondanks.'},
  {p:'amaani',v:'engels',t:'Linking words',lvl:1,q:'Wat betekent "whereas"?',a:'terwijl',alt:['daarentegen','terwijl daarentegen'],h:['Twee dingen tegenover elkaar.'],s:'whereas = terwijl (tegenstellend), daarentegen.'},
  {p:'amaani',v:'engels',t:'Linking words',lvl:1,q:'Wat betekent "for instance"?',a:'bijvoorbeeld',alt:['zoals','bv','bv.','bijv','bijv.'],h:['Een voorbeeld volgt.'],s:'for instance = for example = bijvoorbeeld.'},

  {p:'amaani',v:'engels',t:'Linking words',lvl:2,q:'"The plan is cheap. ___, it is not very effective."',a:'However',opties:['However','Therefore','Moreover'],h:['Goedkoop, maar ...'],s:'However: er volgt een tegenstelling.'},
  {p:'amaani',v:'engels',t:'Linking words',lvl:2,q:'"He trained very hard. ___, he won the race."',a:'As a result',opties:['As a result','Nevertheless','For instance'],h:['Wat volgt uit hard trainen?'],s:'As a result: een gevolg.'},
  {p:'amaani',v:'engels',t:'Linking words',lvl:2,q:'"___ the rain, the match went on."',a:'Despite',opties:['Despite','Although','Because'],h:['Er volgt geen zin maar een zelfstandig naamwoord.'],s:'Despite + zelfstandig naamwoord: despite the rain. (Although + zin: although it rained.)'},
  {p:'amaani',v:'engels',t:'Linking words',lvl:2,q:'"She is very clever; ___, she is extremely kind."',a:'moreover',opties:['moreover','however','otherwise'],h:['Er komt nog een positieve eigenschap bij.'],s:'moreover: opsomming.'},
  {p:'amaani',v:'engels',t:'Linking words',lvl:2,q:'"Some people like tea, ___ others prefer coffee."',a:'whereas',opties:['whereas','because','so'],h:['Twee groepen tegenover elkaar.'],s:'whereas: tegenstelling tussen twee dingen.'},
  {p:'amaani',v:'engels',t:'Linking words',lvl:2,q:'"You can go out ___ you finish your homework first."',a:'provided that',opties:['provided that','unless','in spite of'],h:['Op voorwaarde dat.'],s:'provided that = op voorwaarde dat.'},

  {p:'amaani',v:'engels',t:'Linking words',lvl:3,q:'"Admittedly, the new policy has some benefits." Welke functie heeft "admittedly"?',a:'toegeving',opties:['toegeving','conclusie','voorbeeld'],h:['De schrijver geeft iets toe, en daarna komt meestal "but".'],s:'Toegeving: admittedly = toegegeven. Daarna volgt vaak de eigenlijke mening van de schrijver.'},
  {p:'amaani',v:'engels',t:'Linking words',lvl:3,q:'Welke functie heeft "In short" aan het begin van een alinea?',a:'samenvatting',opties:['samenvatting','tegenstelling','opsomming'],h:['Kort gezegd.'],s:'In short = kortom: samenvatting of conclusie. Belangrijk bij vragen naar de hoofdgedachte.'},
  {p:'amaani',v:'engels',t:'Linking words',lvl:3,q:'Wat geeft "consequently" aan?',a:'gevolg',opties:['gevolg','tegenstelling','voorbeeld'],h:['Als consequentie.'],s:'consequently = daardoor, als gevolg daarvan.'},
  {p:'amaani',v:'engels',t:'Linking words',lvl:3,q:'Wat geeft "nevertheless" aan?',a:'tegenstelling',opties:['tegenstelling','oorzaak','opsomming'],h:['Toch, desondanks.'],s:'nevertheless = toch, desondanks: tegenstelling (met een toegeving ervoor).'},
  {p:'amaani',v:'engels',t:'Linking words',lvl:3,q:'Wat geeft "namely" aan?',a:'toelichting',opties:['toelichting','tegenstelling','conclusie'],h:['Namelijk.'],s:'namely = namelijk: er volgt een uitleg of specificatie.'},
  {p:'amaani',v:'engels',t:'Linking words',lvl:3,q:'"Prices rose sharply; hence many families cut back on spending." Wat geeft "hence" aan?',a:'gevolg',opties:['gevolg','toegeving','vergelijking'],h:['Daarom, vandaar.'],s:'hence = daarom, vandaar: gevolg of conclusie.'},
]

export const TALEN_5VWO: Ruw[] = [
  ...DROGREDENEN, ...FORMULEREN, ...VERBANDEN,
  ...[...TENSES, ...CONDITIONALS, ...LINKING].map(metVarianten),
]
