/**
 * BIOLOGIE VOOR 5 VWO
 *
 * Biologie was het dunste vak van Amaani: vijfendertig opgaven over zes
 * onderwerpen, en op niveau 1 bijna niets. Juist de onderwerpen die 5 vwo
 * kenmerken waren mager: kruisingen (met kansen, geslachtsgebonden en
 * dihybride), DNA en eiwitsynthese, regeling door hormonen en zenuwen, en
 * ecologie met de energiestroom door een voedselketen.
 *
 * Zes opgaven per onderwerp per niveau, zoals in `exact5vwo.ts`.
 *
 * MEERKEUZE WAAR HET OM BEGRIP GAAT
 *
 * Bij biologie is de grootste fout in een oefenapp dat een goed antwoord fout
 * wordt gerekend omdat het anders gespeld is ("mitochondriën", "mitochondria").
 * Gaat een vraag om begrip, dan staat hij hier als meerkeuze. Gaat hij om een
 * vakterm die je moet kennen, dan is het een invulvraag met de gangbare
 * varianten erbij. Kansen bij kruisingen worden in procenten gevraagd, om
 * dezelfde reden als bij wiskunde A (zie `wiskundea5vwo.ts`).
 *
 * De vaktermen en getallen volgen het gangbare gebruik in de Nederlandse
 * bovenbouw en Binas: rustpotentiaal ongeveer −70 mV, 23 chromosomen in een
 * geslachtscel, de 10 %-vuistregel voor de energieoverdracht tussen schakels.
 */
import type { Opgave } from './soorten'

type Ruw = Omit<Opgave, 'id'>

const PROCENT = 'Geef je antwoord in procenten.'

/* ============================================================== erfelijkheid */

const ERFELIJKHEID: Ruw[] = [
  {p:'amaani',v:'biologie',t:'Erfelijkheid',lvl:1,q:'Hoe heet een allel dat zich alleen in het fenotype uit als het dubbel aanwezig is?',a:'recessief',alt:['recessieve','een recessief allel'],h:['Het tegenovergestelde van dominant.'],s:'Recessief: alleen zichtbaar bij aa.'},
  {p:'amaani',v:'biologie',t:'Erfelijkheid',lvl:1,q:'Het genotype Aa heet ...',a:'heterozygoot',opties:['homozygoot','heterozygoot'],h:['Hetero = verschillend.'],s:'Twee verschillende allelen: heterozygoot.'},
  {p:'amaani',v:'biologie',t:'Erfelijkheid',lvl:1,q:'Het genotype AA heet ...',a:'homozygoot',opties:['homozygoot','heterozygoot'],h:['Homo = gelijk.'],s:'Twee gelijke allelen: homozygoot (dominant).'},
  {p:'amaani',v:'biologie',t:'Erfelijkheid',lvl:1,q:'De eigenschap die je kunt waarnemen (bijvoorbeeld de kleur) heet het ...',a:'fenotype',opties:['genotype','fenotype'],h:['Geno = de genen, feno = wat je ziet.'],s:'Fenotype: de waarneembare eigenschap. Genotype: de allelen.'},
  {p:'amaani',v:'biologie',t:'Erfelijkheid',lvl:1,q:'Hoeveel allelen van één gen heeft een gewone lichaamscel?',a:'2',h:['Eén van je vader, één van je moeder.'],s:'Twee: chromosomen komen in paren.'},
  {p:'amaani',v:'biologie',t:'Erfelijkheid',lvl:1,q:'Hoeveel chromosomen zitten er in een menselijke eicel?',a:'23',h:['Een geslachtscel heeft de helft van 46.'],s:'23: haploïd. Bij de bevruchting wordt het weer 46.'},

  {p:'amaani',v:'biologie',t:'Erfelijkheid',lvl:2,q:`Aa × Aa. Hoe groot is de kans op een nakomeling met genotype aa? ${PROCENT}`,a:'25',u:'%',h:['Maak een kruisingsschema van 2 bij 2.'],s:'AA, Aa, aA, aa: één van de vier is aa.\nKans 25 %.'},
  {p:'amaani',v:'biologie',t:'Erfelijkheid',lvl:2,q:`Aa × aa. Hoe groot is de kans op een nakomeling met genotype aa? ${PROCENT}`,a:'50',u:'%',h:['De ouder aa geeft altijd a.'],s:'Aa geeft A of a, elk 50 %. aa geeft altijd a.\nKans op aa: 50 %.'},
  {p:'amaani',v:'biologie',t:'Erfelijkheid',lvl:2,q:`AA × aa. Hoe groot is de kans op een nakomeling met genotype Aa? ${PROCENT}`,a:'100',u:'%',h:['Wat geeft elke ouder door?'],s:'AA geeft altijd A, aa altijd a.\nAlle nakomelingen zijn Aa: 100 %.'},
  {p:'amaani',v:'biologie',t:'Erfelijkheid',lvl:2,q:'Aa × Aa, A is dominant. In welke verhouding komen het dominante en het recessieve fenotype voor?',a:'3:1',alt:['3 : 1','3 op 1','75:25'],h:['Tel in het kruisingsschema hoeveel van de vier een A hebben.'],s:'AA, Aa, aA tonen het dominante fenotype, aa het recessieve.\nVerhouding 3 : 1.'},
  {p:'amaani',v:'biologie',t:'Erfelijkheid',lvl:2,q:`Aa × Aa. Een nakomeling heeft het dominante fenotype. Hoe groot is de kans dat hij heterozygoot is? ${PROCENT}`,a:'66,67',alt:['66,7','67','2/3'],u:'%',h:['Kijk alleen naar de drie met het dominante fenotype.'],s:'AA, Aa, aA: twee van de drie zijn heterozygoot.\n2/3 = 66,67 %.'},
  {p:'amaani',v:'biologie',t:'Erfelijkheid',lvl:2,q:`Hemofilie is X-chromosomaal recessief. Moeder is draagster (XᴴXʰ), vader is gezond (XᴴY). Hoe groot is de kans dat een zoon hemofilie heeft? ${PROCENT}`,a:'50',u:'%',h:['Een zoon krijgt zijn X altijd van zijn moeder.'],s:'Een zoon krijgt Y van vader en Xᴴ of Xʰ van moeder.\nKans op XʰY: 50 %.'},

  {p:'amaani',v:'biologie',t:'Erfelijkheid',lvl:3,q:`AaBb × AaBb, twee genen die onafhankelijk overerven. Hoe groot is de kans op aabb? ${PROCENT}`,a:'6,25',alt:['1/16'],u:'%',h:['Reken per gen: kans op aa en kans op bb.','Vermenigvuldig de kansen.'],s:'P(aa) = ¼ en P(bb) = ¼.\nP(aabb) = ¼ × ¼ = 1/16 = 6,25 %.'},
  {p:'amaani',v:'biologie',t:'Erfelijkheid',lvl:3,q:`AaBb × AaBb. Hoe groot is de kans op een nakomeling met voor beide eigenschappen het dominante fenotype? ${PROCENT}`,a:'56,25',alt:['9/16'],u:'%',h:['P(dominant fenotype voor A) = ¾.','De klassieke verhouding 9 : 3 : 3 : 1.'],s:'¾ × ¾ = 9/16 = 56,25 %.'},
  {p:'amaani',v:'biologie',t:'Erfelijkheid',lvl:3,q:`AaBb × aabb (testkruising). Hoe groot is de kans op aabb? ${PROCENT}`,a:'25',u:'%',h:['De aabb-ouder geeft altijd ab.','AaBb geeft vier soorten geslachtscellen.'],s:'AaBb geeft AB, Ab, aB, ab (elk ¼).\nAlleen ab + ab geeft aabb: 25 %.'},
  {p:'amaani',v:'biologie',t:'Erfelijkheid',lvl:3,q:`Kleurenblindheid is X-chromosomaal recessief. Vader is kleurenblind (XᵈY), moeder is homozygoot normaal (XᴰXᴰ). Hoe groot is de kans dat een dochter draagster is? ${PROCENT}`,a:'100',u:'%',h:['Een dochter krijgt altijd de X van haar vader.'],s:'Elke dochter krijgt Xᵈ van vader en Xᴰ van moeder: XᴰXᵈ.\nAlle dochters zijn draagster: 100 %.'},
  {p:'amaani',v:'biologie',t:'Erfelijkheid',lvl:3,q:`Zelfde ouders: vader XᵈY, moeder XᴰXᴰ. Hoe groot is de kans dat een zoon kleurenblind is? ${PROCENT}`,a:'0',u:'%',h:['Van wie krijgt een zoon zijn X?'],s:'Een zoon krijgt Y van vader en Xᴰ van moeder.\nKans 0 %.'},
  {p:'amaani',v:'biologie',t:'Erfelijkheid',lvl:3,q:`Twee gezonde ouders krijgen een kind met een autosomaal recessieve ziekte. Hoe groot is de kans dat hun volgende kind de ziekte ook heeft? ${PROCENT}`,a:'25',u:'%',h:['Wat moeten de genotypen van de ouders dan zijn?'],s:'Gezond maar een ziek kind: beide ouders zijn Aa.\nAa × Aa geeft aa met kans 25 %, bij elk kind opnieuw.'},
]

/* ================================================================ cel & dna */

const DNA: Ruw[] = [
  {p:'amaani',v:'biologie',t:'Cel & DNA',lvl:1,q:'Welke base vormt in DNA een paar met adenine (A)?',a:'T',alt:['thymine'],h:['In DNA: A met ..., G met C.'],s:'A paart met T, G met C.'},
  {p:'amaani',v:'biologie',t:'Cel & DNA',lvl:1,q:'Welke base vormt een paar met guanine (G)?',a:'C',alt:['cytosine'],h:['G en ... vormen drie waterstofbruggen.'],s:'G paart met C.'},
  {p:'amaani',v:'biologie',t:'Cel & DNA',lvl:1,q:'Welke base zit in RNA in plaats van thymine (T)?',a:'U',alt:['uracil'],h:['De U van ...'],s:'In RNA: uracil (U) in plaats van thymine.'},
  {p:'amaani',v:'biologie',t:'Cel & DNA',lvl:1,q:'Uit hoeveel basen bestaat een codon?',a:'3',h:['Een triplet.'],s:'Drie basen vormen één codon, dat codeert voor één aminozuur.'},
  {p:'amaani',v:'biologie',t:'Cel & DNA',lvl:1,q:'Waar vindt de translatie plaats?',a:'ribosoom',opties:['ribosoom','celkern','mitochondrion'],h:['Waar wordt het eiwit in elkaar gezet?'],s:'Op de ribosomen, in het cytoplasma.'},
  {p:'amaani',v:'biologie',t:'Cel & DNA',lvl:1,q:'Waar vindt de transcriptie plaats (bij mens en dier)?',a:'celkern',opties:['ribosoom','celkern','celmembraan'],h:['Waar ligt het DNA?'],s:'In de celkern: daar wordt van DNA een mRNA-kopie gemaakt.'},

  {p:'amaani',v:'biologie',t:'Cel & DNA',lvl:2,q:'Geef de complementaire DNA-streng van ATGCCA.',a:'TACGGT',h:['A met T, G met C.'],s:'A→T, T→A, G→C, C→G, C→G, A→T.\nTACGGT.'},
  {p:'amaani',v:'biologie',t:'Cel & DNA',lvl:2,q:'De matrijsstreng van het DNA is TACGGT. Geef het mRNA dat ervan wordt afgeschreven.',a:'AUGCCA',h:['Complementair, maar U in plaats van T.'],s:'T→A, A→U, C→G, G→C, G→C, T→A.\nAUGCCA.'},
  {p:'amaani',v:'biologie',t:'Cel & DNA',lvl:2,q:'De matrijsstreng is TTACGA. Geef het mRNA.',a:'AAUGCU',h:['Complementair, met U in plaats van T.'],s:'T→A, T→A, A→U, C→G, G→C, A→U.\nAAUGCU.'},
  {p:'amaani',v:'biologie',t:'Cel & DNA',lvl:2,q:'Een stuk mRNA van 30 basen wordt helemaal vertaald, zonder stopcodon. Voor hoeveel aminozuren codeert het?',a:'10',h:['Drie basen per aminozuur.'],s:'30 ÷ 3 = 10 aminozuren.'},
  {p:'amaani',v:'biologie',t:'Cel & DNA',lvl:2,q:'Welk codon is het startcodon?',a:'AUG',h:['Het codeert ook voor methionine.'],s:'AUG: start, en codeert voor methionine.'},
  {p:'amaani',v:'biologie',t:'Cel & DNA',lvl:2,q:'Hoeveel verschillende codons zijn er mogelijk?',a:'64',h:['Vier basen, drie plaatsen.'],s:'4 × 4 × 4 = 64.'},

  {p:'amaani',v:'biologie',t:'Cel & DNA',lvl:3,q:'Een eiwit bestaat uit 150 aminozuren. Hoeveel basen telt het coderende deel van het mRNA, inclusief het stopcodon?',a:'453',h:['Drie basen per aminozuur.','Het stopcodon codeert niet voor een aminozuur maar telt wel mee.'],s:'150 × 3 = 450, plus 3 voor het stopcodon: 453.'},
  {p:'amaani',v:'biologie',t:'Cel & DNA',lvl:3,q:'Een puntmutatie in de derde base van een codon verandert het aminozuur vaak niet. Waardoor?',a:'meerdere codons coderen voor hetzelfde aminozuur',opties:['meerdere codons coderen voor hetzelfde aminozuur','de derde base wordt niet afgelezen','het ribosoom herstelt de fout'],h:['64 codons, maar maar 20 aminozuren.'],s:'De code is gedegenereerd (redundant): 64 codons voor 20 aminozuren.\nVaak verschillen codons voor hetzelfde aminozuur juist in de derde base.'},
  {p:'amaani',v:'biologie',t:'Cel & DNA',lvl:3,q:'Vooraan in een gen verdwijnt één base (deletie). Wat is het gevolg?',a:'een leesraamverschuiving',opties:['een leesraamverschuiving','één ander aminozuur','geen verandering'],h:['Codons worden per drie gelezen.'],s:'Alle codons erna worden anders ingedeeld: een leesraamverschuiving (frameshift). Het eiwit is meestal onbruikbaar.'},
  {p:'amaani',v:'biologie',t:'Cel & DNA',lvl:3,q:'In een DNA-molecuul is 30 % van de basen adenine. Hoeveel procent is guanine?',a:'20',u:'%',h:['A = T, en G = C.','A + T + G + C = 100 %.'],s:'A = 30 %, dus T = 30 %.\nG + C = 40 %, dus G = 20 %.'},
  {p:'amaani',v:'biologie',t:'Cel & DNA',lvl:3,q:'In een DNA-molecuul is 18 % van de basen cytosine. Hoeveel procent is adenine?',a:'32',u:'%',h:['C = G.'],s:'C = G = 18 %, samen 36 %.\nA + T = 64 %, dus A = 32 %.'},
  {p:'amaani',v:'biologie',t:'Cel & DNA',lvl:3,q:'Welk soort RNA brengt aminozuren naar het ribosoom?',a:'tRNA',opties:['mRNA','tRNA','rRNA'],h:['t van transport (transfer).'],s:'tRNA, met het anticodon dat past op het codon van het mRNA.'},
]

/* ================================================================== regeling */

const REGELING: Ruw[] = [
  {p:'amaani',v:'biologie',t:'Regeling',lvl:1,q:'Welk hormoon verlaagt de glucoseconcentratie in het bloed?',a:'insuline',h:['Gemaakt in de alvleesklier, na een maaltijd.'],s:'Insuline: cellen nemen glucose op, de lever slaat het op als glycogeen.'},
  {p:'amaani',v:'biologie',t:'Regeling',lvl:1,q:'Welk orgaan maakt insuline?',a:'alvleesklier',alt:['pancreas','de alvleesklier'],h:['Eilandjes van Langerhans.'],s:'De alvleesklier (eilandjes van Langerhans).'},
  {p:'amaani',v:'biologie',t:'Regeling',lvl:1,q:'Welk hormoon uit de alvleesklier verhoogt de glucoseconcentratie in het bloed?',a:'glucagon',h:['De tegenspeler van insuline.'],s:'Glucagon: de lever zet glycogeen om in glucose.'},
  {p:'amaani',v:'biologie',t:'Regeling',lvl:1,q:'Hoe worden hormonen door het lichaam vervoerd?',a:'met het bloed',opties:['met het bloed','via zenuwen','via de lymfe'],h:['Hormoonklieren hebben geen afvoerbuis.'],s:'Hormoonklieren geven hun hormonen direct af aan het bloed.'},
  {p:'amaani',v:'biologie',t:'Regeling',lvl:1,q:'Welke klieren maken adrenaline?',a:'bijnieren',alt:['bijnier','de bijnieren','bijniermerg'],h:['Ze liggen boven op de nieren.'],s:'De bijnieren (het bijniermerg).'},
  {p:'amaani',v:'biologie',t:'Regeling',lvl:1,q:'Hoe heet de overgang tussen twee zenuwcellen?',a:'synaps',alt:['synapsen','de synaps'],h:['Daar wordt het signaal chemisch doorgegeven.'],s:'Een synaps: een smalle spleet waar een neurotransmitter het signaal overbrengt.'},

  {p:'amaani',v:'biologie',t:'Regeling',lvl:2,q:'Hoe heet het constant houden van het inwendig milieu?',a:'homeostase',alt:['homeostasis'],h:['Homeo = gelijk, stase = blijven.'],s:'Homeostase: bijvoorbeeld de temperatuur en de glucoseconcentratie van het bloed.'},
  {p:'amaani',v:'biologie',t:'Regeling',lvl:2,q:'Bij negatieve terugkoppeling wordt een afwijking ...',a:'tegengewerkt',opties:['tegengewerkt','versterkt'],h:['Denk aan een thermostaat.'],s:'Negatieve terugkoppeling werkt de afwijking tegen, zodat de waarde terugkeert naar de normwaarde.'},
  {p:'amaani',v:'biologie',t:'Regeling',lvl:2,q:'Welke hormoonklier stuurt veel andere hormoonklieren aan?',a:'hypofyse',alt:['de hypofyse','hersenaanhangsel'],h:['Ligt onder de hersenen, wordt aangestuurd door de hypothalamus.'],s:'De hypofyse, op zijn beurt aangestuurd door de hypothalamus.'},
  {p:'amaani',v:'biologie',t:'Regeling',lvl:2,q:'Welk hormoon zorgt ervoor dat de nieren meer water terugnemen?',a:'ADH',alt:['antidiuretisch hormoon','vasopressine'],h:['Anti-diurese: minder urine.'],s:'ADH (antidiuretisch hormoon), afgegeven door de hypofyse.'},
  {p:'amaani',v:'biologie',t:'Regeling',lvl:2,q:'Hoe heet de stof die in een synaps het signaal van de ene naar de andere zenuwcel overbrengt?',a:'neurotransmitter',alt:['neurotransmitters','een neurotransmitter','transmitterstof'],h:['Neuro + transmitter (overbrenger).'],s:'Een neurotransmitter, bijvoorbeeld acetylcholine.'},
  {p:'amaani',v:'biologie',t:'Regeling',lvl:2,q:'Een reflex zoals het terugtrekken van je hand loopt via ...',a:'het ruggenmerg',opties:['het ruggenmerg','de grote hersenen'],h:['Een reflex is sneller dan bewust reageren.'],s:'Via het ruggenmerg: de grote hersenen komen er pas daarna bij.'},

  {p:'amaani',v:'biologie',t:'Regeling',lvl:3,q:'De glucoseconcentratie in het bloed daalt te ver. Onder invloed van welk hormoon zet de lever glycogeen om in glucose?',a:'glucagon',h:['De tegenspeler van insuline.'],s:'Glucagon, uit de alvleesklier.\nNegatieve terugkoppeling: de daling wordt tegengewerkt.'},
  {p:'amaani',v:'biologie',t:'Regeling',lvl:3,q:'Iemand drinkt veel water. Wat gebeurt er met de afgifte van ADH?',a:'neemt af',opties:['neemt af','neemt toe','blijft gelijk'],h:['Het lichaam wil het teveel aan water kwijt.'],s:'Minder ADH: de nieren nemen minder water terug en er komt meer, verdunde urine.'},
  {p:'amaani',v:'biologie',t:'Regeling',lvl:3,q:'Wat is er aan de hand bij diabetes type 1?',a:'de alvleesklier maakt (bijna) geen insuline',opties:['de alvleesklier maakt (bijna) geen insuline','de cellen reageren slecht op insuline','er is te veel glucagon'],h:['Type 1 is een auto-immuunziekte.'],s:'Bij type 1 vernietigt het afweersysteem de cellen die insuline maken.\nBij type 2 reageren de cellen slecht op insuline.'},
  {p:'amaani',v:'biologie',t:'Regeling',lvl:3,q:'Bij het begin van een actiepotentiaal stromen er ionen de zenuwcel in. Welke?',a:'natriumionen',opties:['natriumionen','kaliumionen','chloride-ionen'],h:['Daarna stromen kaliumionen naar buiten.'],s:'Eerst stromen Na⁺-ionen naar binnen (depolarisatie), daarna K⁺-ionen naar buiten (repolarisatie).'},
  {p:'amaani',v:'biologie',t:'Regeling',lvl:3,q:'Hoe groot is de rustpotentiaal van een zenuwcel ongeveer?',a:'−70 mV',opties:['−70 mV','+40 mV','0 mV'],h:['De binnenkant is negatief ten opzichte van de buitenkant.'],s:'Ongeveer −70 mV. Bij een actiepotentiaal schiet hij kort naar ongeveer +40 mV.'},
  {p:'amaani',v:'biologie',t:'Regeling',lvl:3,q:'Hoe heet de isolerende laag om veel axonen, die de impulsgeleiding versnelt?',a:'myelineschede',alt:['myeline','myelinelaag','mergschede'],h:['Een vetrijke laag, gemaakt door cellen van Schwann.'],s:'De myelineschede (mergschede): de impuls springt van insnoering naar insnoering.'},
]

/* ================================================================= ecologie */

const ECOLOGIE: Ruw[] = [
  {p:'amaani',v:'biologie',t:'Ecologie',lvl:1,q:'Hoe heet een organisme dat dode resten afbreekt tot anorganische stoffen?',a:'reducent',alt:['reducenten','afbreker','afbrekers','opruimer'],h:['Bijvoorbeeld bacteriën en schimmels.'],s:'Een reducent: bacteriën en schimmels maken de stoffen weer beschikbaar voor producenten.'},
  {p:'amaani',v:'biologie',t:'Ecologie',lvl:1,q:'Een konijn eet gras. Wat voor consument is het konijn?',a:'consument van de eerste orde',opties:['consument van de eerste orde','consument van de tweede orde','producent'],h:['Hoeveel schakels zit het konijn na de producent?'],s:'Gras is de producent, het konijn eet die: consument van de eerste orde (herbivoor).'},
  {p:'amaani',v:'biologie',t:'Ecologie',lvl:1,q:'Waar komt vrijwel alle energie in een ecosysteem vandaan?',a:'de zon',alt:['zon','zonlicht','licht','van de zon'],h:['Producenten leggen die vast bij de fotosynthese.'],s:'Van de zon: producenten leggen lichtenergie vast als chemische energie.'},
  {p:'amaani',v:'biologie',t:'Ecologie',lvl:1,q:'Bij de fotosynthese nemen planten CO₂ op. Welk gas geven ze af?',a:'zuurstof',alt:['o2','o₂','zuurstofgas'],h:['Het gas dat jij inademt.'],s:'Zuurstof (O₂).'},
  {p:'amaani',v:'biologie',t:'Ecologie',lvl:1,q:'Hoe heet een groep organismen van dezelfde soort in hetzelfde gebied?',a:'populatie',alt:['een populatie'],h:['Niet een levensgemeenschap: dat zijn meerdere soorten.'],s:'Een populatie. Alle populaties samen in een gebied vormen een levensgemeenschap.'},
  {p:'amaani',v:'biologie',t:'Ecologie',lvl:1,q:'Hoe heet het geheel van met elkaar verbonden voedselketens in een ecosysteem?',a:'voedselweb',alt:['een voedselweb'],h:['Ketens die elkaar kruisen.'],s:'Een voedselweb.'},

  {p:'amaani',v:'biologie',t:'Ecologie',lvl:2,q:'Producenten leggen 10 000 kJ vast. Per schakel gaat ongeveer 10 % door. Hoeveel kJ komt er bij de consumenten van de eerste orde?',a:'1000',u:'kJ',h:['10 % van 10 000.'],s:'10 000 × 0,10 = 1000 kJ.'},
  {p:'amaani',v:'biologie',t:'Ecologie',lvl:2,q:'Producenten leggen 10 000 kJ vast, 10 % per schakel. Hoeveel kJ komt er bij de consumenten van de tweede orde?',a:'100',u:'kJ',h:['Twee keer 10 %.'],s:'10 000 × 0,10 × 0,10 = 100 kJ.'},
  {p:'amaani',v:'biologie',t:'Ecologie',lvl:2,q:'Producenten leggen 50 000 kJ vast, 10 % per schakel. Hoeveel kJ komt er bij de consumenten van de derde orde?',a:'50',u:'kJ',h:['Drie keer 10 %.'],s:'50 000 × 0,10³ = 50 kJ.'},
  {p:'amaani',v:'biologie',t:'Ecologie',lvl:2,q:'Waarom zijn voedselketens zelden langer dan vier of vijf schakels?',a:'bij elke schakel gaat veel energie verloren',opties:['bij elke schakel gaat veel energie verloren','er zijn te weinig soorten','predatoren eten geen andere predatoren'],h:['Wat gebeurt er met de 90 % die niet doorgaat?'],s:'Bij elke schakel gaat het grootste deel verloren als warmte (dissimilatie) en in onverteerde resten. Na een paar schakels is er te weinig over.'},
  {p:'amaani',v:'biologie',t:'Ecologie',lvl:2,q:'Door welk proces van alle organismen komt CO₂ in de lucht?',a:'dissimilatie',opties:['dissimilatie','fotosynthese','assimilatie'],h:['Het tegenovergestelde van de fotosynthese.'],s:'Dissimilatie (verbranding in de cel): glucose + O₂ → CO₂ + H₂O + energie.'},
  {p:'amaani',v:'biologie',t:'Ecologie',lvl:2,q:'Stikstofbindende bacteriën zetten N₂ uit de lucht om in ...',a:'ammonium',opties:['ammonium','nitraat','glucose'],h:['Daarna maken nitrificerende bacteriën er nitraat van.'],s:'In ammonium (NH₄⁺). Nitrificerende bacteriën zetten dat daarna om in nitraat.'},

  {p:'amaani',v:'biologie',t:'Ecologie',lvl:3,q:'In een ecosysteem is 2000 kg biomassa aan producenten. Per schakel wordt 15 % doorgegeven. Hoeveel kg biomassa is er bij de consumenten van de tweede orde?',a:'45',u:'kg',h:['Twee keer 15 %.'],s:'2000 × 0,15 × 0,15 = 45 kg.'},
  {p:'amaani',v:'biologie',t:'Ecologie',lvl:3,q:'De brutoproductie van een plant is 5000 kJ, de dissimilatie 2000 kJ. Hoe groot is de nettoproductie?',a:'3000',u:'kJ',h:['Netto = bruto − dissimilatie.'],s:'5000 − 2000 = 3000 kJ.'},
  {p:'amaani',v:'biologie',t:'Ecologie',lvl:3,q:'Een consument neemt 800 kJ op en legt daarvan 80 kJ vast in nieuwe biomassa. Bereken de ecologische efficiëntie.',a:'10',u:'%',h:['Vastgelegd ÷ opgenomen × 100 %.'],s:'80 ÷ 800 × 100 % = 10 %.'},
  {p:'amaani',v:'biologie',t:'Ecologie',lvl:3,q:'Een populatie van 1000 dieren groeit elk jaar met 20 %. Hoe groot is de populatie na 3 jaar?',a:'1728',h:['Groeifactor 1,2 per jaar.'],s:'1000 × 1,2³ = 1728.'},
  {p:'amaani',v:'biologie',t:'Ecologie',lvl:3,q:'Bij logistische groei vlakt de groei van een populatie af. Waardoor?',a:'de draagkracht van het milieu',opties:['de draagkracht van het milieu','de dieren worden ouder','de geboortes stoppen plotseling'],h:['Voedsel, ruimte en nestplaatsen zijn beperkt.'],s:'Door de draagkracht: de beperkte hoeveelheid voedsel, ruimte en nestplaatsen. De populatie stabiliseert rond die grens.'},
  {p:'amaani',v:'biologie',t:'Ecologie',lvl:3,q:'Een gif dat niet wordt afgebroken, hoopt zich het sterkst op in ...',a:'de toppredatoren',opties:['de toppredatoren','de producenten','de reducenten'],h:['Elke schakel eet veel van de schakel eronder.'],s:'In de toppredatoren: bij elke schakel stijgt de concentratie (biologische versterking, accumulatie).'},
]

export const BIOLOGIE_5VWO: Ruw[] = [...ERFELIJKHEID, ...DNA, ...REGELING, ...ECOLOGIE]
