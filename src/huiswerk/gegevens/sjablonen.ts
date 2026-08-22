/**
 * DE SJABLONEN — opgaven met wisselende getallen
 *
 * Elke sjabloon-som krijgt bij elke beurt nieuwe getallen, zodat de méthode
 * geoefend wordt en niet het antwoord uit het hoofd geleerd wordt. `gen()`
 * levert de opgave zelf; het id blijft gelijk, want de Leitner-kaart hoort bij
 * het sjabloon en niet bij de getallen van vandaag.
 *
 * Het toeval komt als argument binnen en niet uit `Math.random`. Zo is een
 * sjabloon te toetsen: met een vaste bron rolt er elke keer dezelfde som uit,
 * en dan is te bewijzen dat het antwoord bij de vraag hoort.
 */
import type { Sjabloon, Toeval } from './soorten'

const rnd = (x: number, d?: number): number => {
  const f = Math.pow(10, d === undefined ? 2 : d)
  return Math.round(x * f) / f
}
/** Nederlandse komma voor de weergave. */
const nl = (x: number): string => String(rnd(x, 3)).replace('.', ',')
/** Het teken voor in een formule: `+ 3` of `− 3`, met een echt minteken. */
const pm = (b: number): string => (b >= 0 ? '+ ' + b : '− ' + (-b))
const EXP: Record<number, string> = { 1: '', 2: '²', 3: '³', 4: '⁴' }

/**
 * De sjablonen, met het toeval erin gehangen.
 *
 * `ri`, `pick` en `shuffle` komen uit `R` en niet uit `Math.random`. Ze staan
 * hier als gewone namen in bereik, zodat elke sjabloonbody letterlijk is wat
 * hij in de oude pagina was — en dat is precies de bedoeling: honderdtwintig
 * met de hand nagerekende sommen wil je niet overtypen.
 */
export function sjablonen(R: Toeval): Sjabloon[] {
  const { ri, pick, shuffle } = R
  return [
  /* ----- Wassima · wiskunde ----- */
  {id:'tpl_proc_korting',p:'wassima',v:'wiskunde',t:'Procenten',lvl:2,gen:()=>{
    const prijs=20*ri(1,6), k=pick([10,25,50,75]), f=(100-k)/100, n=prijs*f;
    return {q:`Een ${pick(['trui','jas','spel','boek','tas'])} van € ${prijs} krijgt ${k}% korting. Hoeveel kost hij nu?`,
      a:String(n),u:'€',h:[`${k}% korting → je betaalt ${100-k}% van de prijs.`,`Groeifactor = ${nl(f)}. Vermenigvuldig de oude prijs hiermee.`],
      s:`Groeifactor = ${nl(f)}.\n${prijs} × ${nl(f)} = € ${n}.`};
  }},
  {id:'tpl_proc_deel',p:'wassima',v:'wiskunde',t:'Procenten',lvl:1,gen:()=>{
    const aantal=10*ri(2,5), pct=pick([10,20,30,40,50,60,70,80]), deel=aantal*pct/100;
    return {q:`In een groep van ${aantal} leerlingen zijn er ${deel} meisjes. Hoeveel procent is dat?`,
      a:String(pct),u:'%',h:['% = (deel ÷ geheel) × 100.'],s:`(${deel} ÷ ${aantal}) × 100 = ${pct}%.`};
  }},
  {id:'tpl_verg_lin',p:'wassima',v:'wiskunde',t:'Vergelijkingen',lvl:2,gen:()=>{
    const a=ri(2,6), x=ri(2,9), b=ri(1,9), c=a*x+b;
    return {q:`Los op: ${a}x + ${b} = ${c}. Wat is x?`,a:String(x),
      h:[`Werk eerst de + ${b} weg, daarna de × ${a}.`],
      s:`${a}x + ${b} = ${c} → − ${b} → ${a}x = ${c-b} → ÷ ${a} → x = ${x}.`};
  }},
  {id:'tpl_lin_invul',p:'wassima',v:'wiskunde',t:'Lineaire formules',lvl:1,gen:()=>{
    const a=pick([-4,-3,-2,2,3,4,5]), b=ri(-5,9), x=ri(2,7), y=a*x+b;
    return {q:`Gegeven y = ${a}x ${pm(b)}. Bereken y als x = ${x}.`,a:String(y),
      h:[`Vul x = ${x} in de formule in.`],s:`y = ${a} × ${x} ${pm(b)} = ${a*x} ${pm(b)} = ${y}.`};
  }},
  {id:'tpl_opp_recht',p:'wassima',v:'wiskunde',t:'Oppervlakte & omtrek',lvl:1,gen:()=>{
    const l=ri(5,15), b=ri(3,12);
    return {q:`Een rechthoek is ${l} cm lang en ${b} cm breed. Bereken de oppervlakte.`,a:String(l*b),u:'cm²',
      ill:{type:'rechthoek',l,b},h:['oppervlakte = lengte × breedte.'],s:`opp = ${l} × ${b} = ${l*b} cm².`};
  }},
  {id:'tpl_omtrek_recht',p:'wassima',v:'wiskunde',t:'Oppervlakte & omtrek',lvl:1,gen:()=>{
    const l=ri(5,15), b=ri(3,12);
    return {q:`Een rechthoek is ${l} cm lang en ${b} cm breed. Bereken de omtrek.`,a:String(2*(l+b)),u:'cm',
      ill:{type:'rechthoek',l,b},h:['omtrek = 2 × (lengte + breedte).'],s:`omtrek = 2 × (${l} + ${b}) = 2 × ${l+b} = ${2*(l+b)} cm.`};
  }},
  {id:'tpl_pyth',p:'wassima',v:'wiskunde',t:'Pythagoras',lvl:2,gen:()=>{
    const tr=pick([[3,4,5],[6,8,10],[5,12,13],[8,15,17],[9,12,15],[7,24,25],[20,21,29]] as const);
    const a=tr[0], b=tr[1], c=tr[2];
    return {q:`Rechthoekige driehoek met rechthoekszijden ${a} cm en ${b} cm. Bereken de schuine zijde.`,a:String(c),u:'cm',
      ill:{type:'pyth',a,b,c:'?'},h:['a² + b² = c², met c de schuine zijde.',`c = √(${a*a} + ${b*b}) = √${a*a+b*b}.`],
      s:`c = √(${a}² + ${b}²) = √(${a*a} + ${b*b}) = √${a*a+b*b} = ${c} cm.`};
  }},
  {id:'tpl_inhoud_balk',p:'wassima',v:'wiskunde',t:'Inhoud',lvl:1,gen:()=>{
    const l=ri(3,10), b=ri(2,8), h=ri(2,6);
    return {q:`Een balk is ${l} cm × ${b} cm × ${h} cm. Bereken de inhoud.`,a:String(l*b*h),u:'cm³',
      ill:{type:'balk',l,b,h},h:['inhoud = lengte × breedte × hoogte.'],s:`${l} × ${b} × ${h} = ${l*b*h} cm³.`};
  }},
  /* ----- Wassima · natuurkunde ----- */
  {id:'tpl_snelheid',p:'wassima',v:'natuurkunde',t:'Snelheid',lvl:1,gen:()=>{
    const v=ri(2,12), t=pick([5,10,15,20,25,30]), s=v*t;
    return {q:`Iemand legt ${s} m af in ${t} s. Bereken de snelheid.`,a:String(v),u:'m/s',
      h:['v = s ÷ t.'],s:`v = ${s} ÷ ${t} = ${v} m/s.`};
  }},
  {id:'tpl_kmu',p:'wassima',v:'natuurkunde',t:'Snelheid',lvl:2,gen:()=>{
    const ms=pick([5,10,15,20,25,30]), kmu=ms*3.6;
    return {q:`Een voertuig rijdt ${nl(kmu)} km/u. Hoeveel m/s is dat?`,a:String(ms),u:'m/s',
      h:['Van km/u naar m/s: delen door 3,6.'],s:`${nl(kmu)} ÷ 3,6 = ${ms} m/s.`};
  }},
  {id:'tpl_dichtheid',p:'wassima',v:'natuurkunde',t:'Dichtheid',lvl:2,gen:()=>{
    const rho=ri(2,9), V=pick([10,20,25,50,100]), m=rho*V;
    return {q:`Een blok heeft massa ${m} g en volume ${V} cm³. Bereken de dichtheid.`,a:String(rho),u:'g/cm³',
      h:['ρ = m ÷ V.'],s:`ρ = ${m} ÷ ${V} = ${rho} g/cm³.`};
  }},
  {id:'tpl_zwaarte',p:'wassima',v:'natuurkunde',t:'Kracht & zwaartekracht',lvl:1,gen:()=>{
    const m=ri(2,20);
    return {q:`Bereken de zwaartekracht op ${m} kg. (g = 10 N/kg)`,a:String(m*10),u:'N',
      h:['Fz = m × g.'],s:`Fz = m × g = ${m} × 10 = ${m*10} N.`};
  }},
  /* ----- Amaani · wiskunde A ----- */
  {id:'tpl_groeifactor',p:'amaani',v:'wiskundeA',t:'Groeifactoren',lvl:1,gen:()=>{
    const p=pick([2,3,4,5,8,10,12,20,25]), up=pick([true,false]), gf=rnd(up?1+p/100:1-p/100,2);
    return {q:`Een bedrag ${up?'stijgt':'daalt'} met ${p}%. Wat is de groeifactor?`,a:String(gf),
      h:[`${up?'Toename':'Afname'} met p%: groeifactor = ${up?'1 + p/100':'1 − p/100'}.`],
      s:`${up?'1 +':'1 −'} ${p}/100 = ${nl(gf)}.`};
  }},
  {id:'tpl_exp',p:'amaani',v:'wiskundeA',t:'Exponentieel verband',lvl:2,gen:()=>{
    const b=pick([100,200,500,1000]), g=pick([1.1,1.2,1.5,2]), t=ri(2,3), N=rnd(b*Math.pow(g,t),2);
    return {q:`Gegeven N = ${b} × ${nl(g)}^t. Bereken N bij t = ${t}.`,a:String(N),
      h:[`Reken eerst ${nl(g)}^${t} uit.`,`${nl(g)}^${t} = ${nl(rnd(Math.pow(g,t),4))}.`],
      s:`N = ${b} × ${nl(g)}^${t} = ${b} × ${nl(rnd(Math.pow(g,t),4))} = ${nl(N)}.`};
  }},
  {id:'tpl_diff',p:'amaani',v:'wiskundeA',t:'Differentiëren',lvl:2,gen:()=>{
    const n=pick([2,3,4]), x=ri(2,5), fp=n*Math.pow(x,n-1);
    return {q:`Gegeven f(x) = x${EXP[n]}, met afgeleide f′(x) = ${n}x${EXP[n-1]}. Bereken f′(${x}).`,a:String(fp),
      h:[`Vul x = ${x} in de afgeleide ${n}x${EXP[n-1]} in.`],
      s:`f′(${x}) = ${n} × ${x}${EXP[n-1]} = ${n} × ${Math.pow(x,n-1)} = ${fp}.`};
  }},
  {id:'tpl_gemiddelde',p:'amaani',v:'wiskundeA',t:'Statistiek',lvl:1,gen:()=>{
    const m=ri(4,9), nums=shuffle([m-2,m-1,m,m+1,m+2]);
    return {q:`Bereken het gemiddelde van ${nums.join(', ')}.`,a:String(m),
      h:['gemiddelde = som ÷ aantal.'],s:`(${nums.join(' + ')}) ÷ 5 = ${5*m} ÷ 5 = ${m}.`};
  }},
  /* ----- Amaani · natuurkunde ----- */
  {id:'tpl_newton',p:'amaani',v:'natuurkunde',t:'Krachten (Newton)',lvl:2,gen:()=>{
    const m=pick([500,800,1000,1200,1500,2000]), a=ri(2,6);
    return {q:`Een voorwerp van ${m} kg versnelt met ${a} m/s². Bereken de nettokracht.`,a:String(m*a),u:'N',
      h:['Tweede wet van Newton: F = m × a.'],s:`F = ${m} × ${a} = ${m*a} N.`};
  }},
  {id:'tpl_arbeid',p:'amaani',v:'natuurkunde',t:'Arbeid & energie',lvl:2,gen:()=>{
    const F=pick([20,30,40,50,60,80,100]), s=ri(2,12);
    return {q:`Een kracht van ${F} N verplaatst een voorwerp ${s} m. Bereken de arbeid.`,a:String(F*s),u:'J',
      h:['W = F × s.'],s:`W = ${F} × ${s} = ${F*s} J.`};
  }},
  {id:'tpl_vermogen',p:'amaani',v:'natuurkunde',t:'Vermogen',lvl:2,gen:()=>{
    const P=pick([10,20,50,100]), t=pick([5,10,15,20,30,60]), E=P*t;
    return {q:`Een apparaat levert ${E} J in ${t} s. Bereken het vermogen.`,a:String(P),u:'W',
      h:['P = E ÷ t.'],s:`P = ${E} ÷ ${t} = ${P} W.`};
  }},
  /* ----- Wassima · fundament-drills (wisselende getallen) ----- */
  {id:'tpl_rekenvolgorde',p:'wassima',v:'wiskunde',t:'Rekenvolgorde',lvl:1,gen:()=>{
    const a=ri(2,9), b=ri(2,9), c=ri(2,5);
    return {q:`Reken uit: ${a} + ${b} × ${c}`,a:String(a+b*c),
      h:['Keer gaat vóór plus: doe eerst de × .'],s:`${b} × ${c} = ${b*c}; ${a} + ${b*c} = ${a+b*c}.`};
  }},
  {id:'tpl_neg_optel',p:'wassima',v:'wiskunde',t:'Negatieve getallen',lvl:1,gen:()=>{
    const a=ri(-5,5), b=ri(-5,5), ans=a+b;
    return {q:`Reken uit: ${a} ${pm(b)}`,a:String(ans),ill:{type:'getallenlijn',van:-10,tot:10,punt:ans},
      h:['Gebruik de getallenlijn: plus = naar rechts, min = naar links.'],s:`${a} ${pm(b)} = ${ans}.`};
  }},
  {id:'tpl_kwadraat',p:'wassima',v:'wiskunde',t:'Machten & wortels',lvl:1,gen:()=>{
    const n=ri(2,15);
    return {q:`Reken uit: ${n}²`,a:String(n*n),h:[`${n}² = ${n} × ${n}.`],s:`${n} × ${n} = ${n*n}.`};
  }},
  {id:'tpl_breuk_van',p:'wassima',v:'wiskunde',t:'Breuken',lvl:2,gen:()=>{
    const noemer=pick([2,3,4,5,10]), teller=ri(1,noemer-1), getal=noemer*ri(2,12), deel=getal/noemer*teller;
    return {q:`Wat is ${teller}/${noemer} van ${getal}?`,a:String(deel),
      h:[`Eerst ÷ ${noemer} (één deel), dan × ${teller}.`],s:`${getal} ÷ ${noemer} = ${getal/noemer}, en × ${teller} = ${deel}.`};
  }},
  {id:'tpl_eenheden',p:'wassima',v:'natuurkunde',t:'Grootheden & eenheden',lvl:1,gen:()=>{
    const o=pick([['km',1000,'m'],['m',100,'cm'],['kg',1000,'g'],['minuten',60,'seconden']] as const), val=ri(2,12);
    return {q:`Hoeveel ${o[2]} is ${val} ${o[0]}?`,a:String(val*o[1]),
      h:[`1 ${o[0]} = ${o[1]} ${o[2]}.`],s:`${val} × ${o[1]} = ${val*o[1]} ${o[2]}.`};
  }},
  {id:'tpl_haakjes',p:'wassima',v:'wiskunde',t:'Haakjes & herleiden',lvl:2,gen:()=>{
    const a=ri(2,6), b=ri(1,9);
    return {q:`Werk de haakjes weg: ${a}(x + ${b}). Schrijf als ax + b.`,a:`${a}x+${a*b}`,alt:[`${a}x + ${a*b}`],
      h:[`Vermenigvuldig de ${a} met x én met ${b}.`],s:`${a} × x + ${a} × ${b} = ${a}x + ${a*b}.`};
  }},
  /* ----- Amaani · drills (wisselende getallen) ----- */
  {id:'tpl_golfsnelheid',p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:2,gen:()=>{
    const f=ri(2,8), lam=ri(2,6);
    return {q:`Een golf heeft frequentie ${f} Hz en golflengte ${lam} m. Bereken de golfsnelheid. (v = f·λ)`,a:String(f*lam),u:'m/s',
      h:['v = f × λ.'],s:`v = ${f} × ${lam} = ${f*lam} m/s.`};
  }},
  {id:'tpl_trillingstijd',p:'amaani',v:'natuurkunde',t:'Golven & trillingen',lvl:1,gen:()=>{
    const f=pick([2,4,5,8,10,20]), T=rnd(1/f,4);
    return {q:`Een trilling heeft frequentie ${f} Hz. Bereken de trillingstijd T. (T = 1/f)`,a:String(T),alt:[nl(T)],u:'s',
      h:['T = 1 ÷ f.'],s:`T = 1 ÷ ${f} = ${nl(T)} s.`};
  }},
  {id:'tpl_resultante',p:'amaani',v:'natuurkunde',t:'Krachten & evenwicht',lvl:1,gen:()=>{
    const a=ri(10,90), b=ri(10,90);
    return {q:`Twee krachten van ${a} N en ${b} N werken in dezelfde richting. Bereken de resultante.`,a:String(a+b),u:'N',
      h:['Zelfde richting → optellen.'],s:`${a} + ${b} = ${a+b} N.`};
  }},
  {id:'tpl_fveer',p:'amaani',v:'natuurkunde',t:'Krachten & evenwicht',lvl:2,gen:()=>{
    const C=pick([100,150,200,250,300]), u=pick([0.1,0.2,0.3,0.5]), F=rnd(C*u,2);
    return {q:`Een veer met veerconstante C = ${C} N/m wordt ${nl(u)} m uitgerekt. Bereken de veerkracht. (F = C·u)`,a:String(F),u:'N',
      h:['F = C × u.'],s:`F = ${C} × ${nl(u)} = ${nl(F)} N.`};
  }},
  {id:'tpl_funceval',p:'amaani',v:'wiskundeA',t:'Kwadratische functies',lvl:2,gen:()=>{
    const b=ri(-5,5), c=ri(-5,9), x=ri(-3,5), val=x*x+b*x+c;
    return {q:`Gegeven f(x) = x² ${pm(b)}x ${pm(c)}. Bereken f(${x}).`,a:String(val),
      h:[`Vul x = ${x} in en let op de tekens.`],s:`f(${x}) = (${x})² ${pm(b)}·${x} ${pm(c)} = ${x*x} ${pm(b*x)} ${pm(c)} = ${val}.`};
  }},
  /* ----- Amine · reken-drills (wisselende getallen) ----- */
  {id:'tpl_am_optel',p:'amine',v:'rekenen',t:'Optellen & aftrekken',lvl:1,gen:()=>{
    const a=ri(120,899), b=ri(50,500);
    return {q:`Reken uit: ${a} + ${b}`,a:String(a+b),h:['Tel honderdtallen, tientallen en eenheden apart op.'],s:`${a} + ${b} = ${a+b}.`};
  }},
  {id:'tpl_am_aftrek',p:'amine',v:'rekenen',t:'Optellen & aftrekken',lvl:2,gen:()=>{
    const a=ri(400,999), b=ri(50,a-50);
    return {q:`Reken uit: ${a} − ${b}`,a:String(a-b),h:['Tel op vanaf het kleine getal naar het grote.'],s:`${a} − ${b} = ${a-b}.`};
  }},
  {id:'tpl_am_tafel',p:'amine',v:'rekenen',t:'Tafels & keer',lvl:1,gen:()=>{
    const a=ri(2,12), b=ri(2,12);
    return {q:`Reken uit: ${a} × ${b}`,a:String(a*b),h:[`Tafel van ${b}.`],s:`${a} × ${b} = ${a*b}.`};
  }},
  {id:'tpl_am_deel',p:'amine',v:'rekenen',t:'Delen',lvl:2,gen:()=>{
    const b=ri(2,12), q=ri(2,12), a=b*q;
    return {q:`Reken uit: ${a} ÷ ${b}`,a:String(q),h:[`Welk getal × ${b} = ${a}?`],s:`${b} × ${q} = ${a} → ${a} ÷ ${b} = ${q}.`};
  }},
  {id:'tpl_am_procent',p:'amine',v:'rekenen',t:'Procenten',lvl:2,gen:()=>{
    const pct=pick([10,25,50]), getal=pick([20,40,60,80,100,200]), ans=getal*pct/100;
    return {q:`Hoeveel is ${pct}% van ${getal}?`,a:String(ans),
      h:[pct===50?'50% = de helft.':pct===10?'10% = ÷ 10.':'25% = ÷ 4.'],s:`${pct}% van ${getal} = ${ans}.`};
  }},
  {id:'tpl_am_keer10',p:'amine',v:'rekenen',t:'Kommagetallen',lvl:2,gen:()=>{
    const x=pick([1.5,2.3,0.7,3.2,12.5,4.6]);
    return {q:`Reken uit: ${nl(x)} × 10`,a:String(rnd(x*10,2)),h:['× 10 → de komma één plaats naar rechts.'],s:`${nl(x)} × 10 = ${nl(x*10)}.`};
  }},
  {id:'tpl_am_wisselgeld',p:'amine',v:'rekenen',t:'Geld & rekenen',lvl:1,gen:()=>{
    const prijs=ri(1,19);
    return {q:`Je koopt voor € ${prijs} en betaalt met € 20. Hoeveel krijg je terug?`,a:String(20-prijs),u:'€',
      h:['Wisselgeld = betaald − prijs.'],s:`20 − ${prijs} = € ${20-prijs}.`};
  }},
  {id:'tpl_am_maten',p:'amine',v:'rekenen',t:'Meten & maten',lvl:1,gen:()=>{
    const o=pick([['meter',100,'cm'],['kilogram',1000,'gram'],['liter',1000,'ml'],['uur',60,'minuten']] as const), val=ri(2,9);
    return {q:`Hoeveel ${o[2]} is ${val} ${o[0]}?`,a:String(val*o[1]),h:[`1 ${o[0]} = ${o[1]} ${o[2]}.`],s:`${val} × ${o[1]} = ${val*o[1]} ${o[2]}.`};
  }},
  {id:'tpl_am_verhouding',p:'amine',v:'rekenen',t:'Verhoudingen',lvl:2,gen:()=>{
    const per=ri(2,6), a=ri(2,4), k=pick([2,3,4]), b=a*k;
    return {q:`${a} ${pick(['pennen','appels','stickers','knikkers'])} kosten samen € ${a*per}. Wat kosten ${b} stuks?`,a:String(b*per),u:'€',
      h:[`${b} is ${k}× zoveel als ${a}.`],s:`Per stuk: ${a*per} ÷ ${a} = € ${per}; ${b} × ${per} = € ${b*per}.`};
  }},
  {id:'tpl_am_afronden',p:'amine',v:'rekenen',t:'Afronden & schatten',lvl:1,gen:()=>{
    const n=ri(11,989), r=Math.round(n/10)*10;
    return {q:`Rond af op tientallen: ${n}`,a:String(r),h:['Kijk naar het laatste cijfer: 5 of meer → naar boven.'],s:`${n} → ${r}.`};
  }},
  /* ----- Selma · groep 4 (dit jaar, oneindig oefenen) ----- */
  {id:'tpl_se4_plus',p:'selma',v:'rekenen',t:'Optellen tot 100',lvl:1,gen:()=>{
    const a=ri(10,60), b=ri(2,30);
    return {q:`Reken uit: ${a} + ${b}`,a:String(a+b),h:['Tel eerst de tientallen, dan de eenheden.'],s:`${a} + ${b} = ${a+b}.`};
  }},
  {id:'tpl_se4_min',p:'selma',v:'rekenen',t:'Aftrekken tot 100',lvl:1,gen:()=>{
    const a=ri(30,99), b=ri(2,a-10);
    return {q:`Reken uit: ${a} − ${b}`,a:String(a-b),h:['Haal eerst de tientallen eraf.'],s:`${a} − ${b} = ${a-b}.`};
  }},
  {id:'tpl_se4_tafel',p:'selma',v:'rekenen',t:'Tafels & keer',lvl:1,gen:()=>{
    const a=pick([1,2,3,4,5,10]), b=ri(1,10);
    return {q:`Reken uit: ${a} × ${b}`,a:String(a*b),h:[`Tafel van ${a}.`],s:`${a} × ${b} = ${a*b}.`};
  }},
  {id:'tpl_se4_helft',p:'selma',v:'rekenen',t:'Breuken',lvl:1,gen:()=>{
    const h=ri(2,15), n=h*2;
    return {q:`Wat is de helft van ${n}?`,a:String(h),h:['De helft = ÷ 2.'],s:`${n} ÷ 2 = ${h}.`};
  }},
  /* ----- Selma · groep 5 (oneindig oefenen) ----- */
  {id:'tpl_se_tafel',p:'selma',jaar:'next',v:'rekenen',t:'Tafels & keer',lvl:1,gen:()=>{
    const a=ri(2,10), b=ri(2,10);
    return {q:`Reken uit: ${a} × ${b}`,a:String(a*b),h:[`Tafel van ${b}.`],s:`${a} × ${b} = ${a*b}.`};
  }},
  {id:'tpl_se_deel',p:'selma',jaar:'next',v:'rekenen',t:'Delen',lvl:2,gen:()=>{
    const b=ri(2,10), q=ri(2,10), a=b*q;
    return {q:`Reken uit: ${a} ÷ ${b}`,a:String(q),h:[`Welk getal × ${b} = ${a}?`],s:`${b} × ${q} = ${a} → ${a} ÷ ${b} = ${q}.`};
  }},
  {id:'tpl_se_plus',p:'selma',jaar:'next',v:'rekenen',t:'Optellen tot 1000',lvl:1,gen:()=>{
    const a=ri(120,700), b=ri(50,290);
    return {q:`Reken uit: ${a} + ${b}`,a:String(a+b),h:['Tel honderdtallen, tientallen en eenheden apart op.'],s:`${a} + ${b} = ${a+b}.`};
  }},
  {id:'tpl_se_min',p:'selma',jaar:'next',v:'rekenen',t:'Aftrekken tot 1000',lvl:2,gen:()=>{
    const a=ri(300,999), b=ri(50,a-50);
    return {q:`Reken uit: ${a} − ${b}`,a:String(a-b),h:['Tel op vanaf het kleine getal naar het grote.'],s:`${a} − ${b} = ${a-b}.`};
  }},
  {id:'tpl_se_geld',p:'selma',jaar:'next',v:'rekenen',t:'Geld',lvl:1,gen:()=>{
    const prijs=ri(1,9);
    return {q:`Je koopt voor € ${prijs} en betaalt met € 10. Hoeveel krijg je terug?`,a:String(10-prijs),u:'€',
      h:['Wisselgeld = betaald − prijs.'],s:`10 − ${prijs} = € ${10-prijs}.`};
  }},
  {id:'tpl_se_maten',p:'selma',jaar:'next',v:'rekenen',t:'Meten & maten',lvl:1,gen:()=>{
    const o=pick([['meter',100,'cm'],['kilogram',1000,'gram'],['liter',1000,'ml']] as const), val=ri(2,9);
    return {q:`Hoeveel ${o[2]} is ${val} ${o[0]}?`,a:String(val*o[1]),u:o[2],h:[`1 ${o[0]} = ${o[1]} ${o[2]}.`],s:`${val} × ${o[1]} = ${val*o[1]} ${o[2]}.`};
  }},
  {id:'tpl_se_helft',p:'selma',jaar:'next',v:'rekenen',t:'Breuken',lvl:1,gen:()=>{
    const h=ri(3,25), n=h*2;
    return {q:`Wat is de helft van ${n}?`,a:String(h),h:['De helft = ÷ 2.'],s:`${n} ÷ 2 = ${h}.`};
  }},
  {id:'tpl_se_afronden',p:'selma',jaar:'next',v:'rekenen',t:'Getallen tot 1000',lvl:2,gen:()=>{
    const n=ri(110,890), r=Math.round(n/10)*10;
    return {q:`Rond af op tientallen: ${n}`,a:String(r),h:['Kijk naar het laatste cijfer: 5 of meer → naar boven.'],s:`${n} → ${r}.`};
  }},
  {id:'tpl_se_verhouding',p:'selma',jaar:'next',v:'rekenen',t:'Verhoudingstabellen',lvl:2,gen:()=>{
    const per=ri(2,6), a=ri(2,4), k=pick([2,3,4]), b=a*k;
    return {q:`${a} ${pick(['appels','stickers','knikkers','broodjes'])} kosten samen € ${a*per}. Wat kosten ${b} stuks?`,a:String(b*per),u:'€',
      h:[`${b} is ${k}× zoveel als ${a}.`],s:`Per stuk: ${a*per} ÷ ${a} = € ${per}; ${b} × ${per} = € ${b*per}.`};
  }},
  {id:'tpl_se_kommageld',p:'selma',jaar:'next',v:'rekenen',t:'Kommagetallen',lvl:2,gen:()=>{
    const c1=ri(1,8)+0.5, c2=ri(1,8)+0.5;
    return {q:`Reken uit: € ${nl(c1)} + € ${nl(c2)}`,a:String(c1+c2),u:'€',
      h:['Tel de hele euro\'s en de halve euro\'s apart op.'],s:`€ ${nl(c1)} + € ${nl(c2)} = € ${nl(c1+c2)}.`};
  }},
  /* ----- Amaani · exact (oneindig oefenen) ----- */
  {id:'tpl_am_massa',p:'amaani',v:'scheikunde',t:'Rekenen (mol)',lvl:2,gen:()=>{
    const stof=pick([['H2O',18],['CO2',44],['CH4',16],['O2',32],['NaCl',58]] as const), n=pick([2,3,4,0.5,5]);
    return {q:`Hoeveel gram is ${nl(n)} mol ${stof[0]}? (molaire massa ${stof[1]} g/mol)`,a:String(rnd(n*stof[1],2)),u:'g',
      h:['massa = aantal mol × molaire massa.'],s:`${nl(n)} × ${stof[1]} = ${nl(n*stof[1])} g.`};
  }},
  {id:'tpl_am_pui',p:'amaani',v:'natuurkunde',t:'Elektriciteit',lvl:2,gen:()=>{
    const U=pick([12,24,230]), I=ri(2,8);
    return {q:`Vermogen P = U·I. Bereken P bij U = ${U} V en I = ${I} A.`,a:String(U*I),u:'W',
      h:['P = U × I.'],s:`P = ${U} × ${I} = ${U*I} W.`};
  }},
  {id:'tpl_am_snelheid',p:'amaani',v:'natuurkunde',t:'Kinematica',lvl:2,gen:()=>{
    const v=pick([40,50,60,80,90]), t=ri(2,4), s=v*t;
    return {q:`Een auto rijdt ${s} km in ${t} uur. Bereken de gemiddelde snelheid. (v = s ÷ t)`,a:String(v),u:'km/u',
      h:[`${s} ÷ ${t}.`],s:`v = ${s} ÷ ${t} = ${v} km/u.`};
  }},
  {id:'tpl_am_kans',p:'amaani',v:'wiskundeA',t:'Kansrekening',lvl:2,gen:()=>{
    const r=ri(1,4), b=ri(1,4), tot=r+b;
    return {q:`Een zak heeft ${r} rode en ${b} blauwe knikkers. Kans op een rode? (geef als breuk)`,a:`${r}/${tot}`,
      h:['gunstig ÷ totaal.'],s:`${r} rood van ${tot} totaal → ${r}/${tot}.`};
  }},
  ]
}
