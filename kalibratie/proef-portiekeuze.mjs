#!/usr/bin/env node
/**
 * PROEF OP DE PORTIEKEUZE
 *
 * De app heeft geen bouwstap en geen testraamwerk, en dat hoeft ook niet. Maar
 * de portiekeuze rekent met getallen die in een dagtotaal belanden, en zulke
 * getallen horen niet alleen door een mens op een scherm bekeken te zijn.
 *
 * Dit bestand laadt het script uit index.html in een lege omgeving — geen
 * browser, geen netwerk — en voert de drie wegen na: een gerecht uit de
 * bibliotheek, een product uit NEVO met een huishoudmaat, en een eigen product.
 *
 * De antwoorden in proef-gegevens.json komen letterlijk uit kal_gerecht() en
 * kal_portiematen() op de echte database, op 22 augustus 2026. Eén ding is
 * toegevoegd en dat staat er ook bij: een vierde portie zonder icoon, met een
 * label van meerdere woorden. Die bestaat in de bibliotheek niet, maar er is
 * niets dat hem verbiedt, en zonder die proef bleef een fout staan waarbij het
 * eerste woord van zo'n label wegviel — 'Kwart van de schaal' werd 'van de
 * schaal'. Verandert de bibliotheek, dan verandert dit bestand mee; dat is de
 * bedoeling en niet een gebrek.
 *
 *   node kalibratie/proef-portiekeuze.mjs
 *
 * Afsluitcode 0 als alles klopt, 1 als er iets niet klopt.
 */
import fs from 'node:fs';
import vm from 'node:vm';

const hier = new URL('.', import.meta.url).pathname;
const vast = JSON.parse(fs.readFileSync(hier + 'proef-gegevens.json', 'utf8'));
const html = fs.readFileSync(hier + 'index.html', 'utf8');
let js = html.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
js += `\nglobalThis.__ = { get S(){return S}, get portie(){return portie}, set portie(v){portie=v} };`;

const opgeslagen = [];
let B = null;
const el = sel => ({set innerHTML(v){}, onkeydown:null, textContent:'', dataset:{},
  remove(){}, setAttribute(){},
  // het echte veld wordt bij elke hertekening gevuld uit portie.gram
  get value(){ return sel === '#p-gram' ? String((B && B.portie && B.portie.gram) ?? '') : ''; }});
const ctx = {
  console, navigator:{}, addEventListener(){},
  localStorage:{getItem:()=>null, setItem(){}},
  alert: m => { throw new Error('alert: '+m); },
  document:{querySelector:sel=>el(sel), querySelectorAll:()=>[], body:{insertAdjacentHTML(){}}},
  window:{scrollTo(){}},
  fetch: async (url, opt) => {
    const fn = url.split('/rpc/')[1];
    const body = JSON.parse(opt.body);
    if(fn === 'kal_regels_toevoegen'){ opgeslagen.push(...body.p_regels); return json([]); }
    if(!(fn in vast)) throw new Error('geen vast antwoord voor ' + fn);
    return json(vast[fn]);
  },
};
const json = d => ({ok:true, json: async()=>d});
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(js, ctx);
B = ctx.__;
B.S.token = 'proef';
ctx.teken = () => {};

let fouten = 0;
const eis = (wat, kreeg, verwacht) => {
  const goed = JSON.stringify(kreeg) === JSON.stringify(verwacht);
  if(!goed) fouten++;
  console.log((goed?'  ok   ':'  FOUT ') + wat + ': ' + JSON.stringify(kreeg) +
              (goed?'':'  (verwacht ' + JSON.stringify(verwacht) + ')'));
};

// =========================================================== A. een gerecht ==
console.log('\nA. GERECHT UIT DE BIBLIOTHEEK — Harira');
await ctx.kiesGerecht('e92abc69-040a-47d5-8b0b-c01e2c025b92');
eis('vier porties', ctx.portieOpties().length, 4);
eis('kom staat voorgekozen', ctx.portieOpties()[B.portie.gekozen].label, '🥣 Kom');
eis('kom, kcal', ctx.portieOpties()[0].kcal_punt, 155);
eis('kom, band', [ctx.portieOpties()[0].kcal_laag, ctx.portieOpties()[0].kcal_hoog], [124,197]);

B.portie.metOptioneel = true;
eis('met lamsvlees', ctx.portieOpties()[0].kcal_punt, 179);
eis('band blijft over de portie gaan', [ctx.portieOpties()[0].kcal_laag, ctx.portieOpties()[0].kcal_hoog], [143,227]);
B.portie.metOptioneel = false;

ctx.zetAantal(1);                                   // twee kommen
eis('aantal', B.portie.aantal, 2);
await ctx.portieLoggen();
const r1 = opgeslagen.at(-1);
eis('twee kommen, kcal', r1.kcal_punt, 310);
eis('twee kommen, gram', r1.gram_equivalent, 600);
eis('eiwit', r1.eiwit_g, 12.6);
eis('graad C (gevalideerd, alles gekoppeld)', r1.conf, 'C');
eis('herkomst', r1.bron, 'bibliotheek');
eis('dish_id meegestuurd', r1.dish_id, 'e92abc69-040a-47d5-8b0b-c01e2c025b92');
eis('geen band zonder onzekerheid', r1.onzekerheidsbronnen.length > 0, true);
console.log('  naam:', r1.naam);
console.log('  onzekerheid:'); r1.onzekerheidsbronnen.forEach(t=>console.log('   ·', t));

console.log('\n  een portie zonder icoon mag niet half wegvallen:');
await ctx.kiesGerecht('e92abc69-040a-47d5-8b0b-c01e2c025b92');
ctx.kiesPortie(3);
const zi = ctx.portieOpties()[3];
eis('label heel', zi.label, 'Kwart van de schaal');
eis('onzekerheid noemt de hele portie', ctx.portieOnzeker(zi)[0], 'portie geschat als Kwart van de schaal, 240–380 g');
await ctx.portieLoggen();
eis('naam heel', opgeslagen.at(-1).naam, 'Harira · Kwart van de schaal (300 g)');

// ====================================================== B. huishoudmaten ====
console.log('\nB. NEVO MET HUISHOUDMAAT — Tarwebrood bruin');
await ctx.uitTabel('236');
eis('twee maten', ctx.portieOpties().map(o=>o.label), ['snee','broodje']);
eis('snee = 35 g', ctx.portieOpties()[0].gram, 35);
eis('snee, kcal', ctx.portieOpties()[0].kcal_punt, 84);
eis('snee, band uit de maat', [ctx.portieOpties()[0].kcal_laag, ctx.portieOpties()[0].kcal_hoog], [60,108]);
ctx.zetAantal(1); ctx.zetAantal(1);                 // drie sneetjes
await ctx.portieLoggen();
const r2 = opgeslagen.at(-1);
eis('drie sneetjes, kcal', r2.kcal_punt, 252);
eis('drie sneetjes, gram', r2.gram_equivalent, 105);
eis('nevo_code meegestuurd', r2.nevo_code, '236');
eis('graad C', r2.conf, 'C');
console.log('  naam:', r2.naam);
console.log('  onzekerheid:'); r2.onzekerheidsbronnen.forEach(t=>console.log('   ·', t));

console.log('\n  afwegen wint van de maat:');
await ctx.uitTabel('236');
ctx.zetGram('68');
const g = ctx.portieOpties()[B.portie.gekozen];
eis('afgewogen gekozen', g.label, 'afgewogen');
eis('68 g brood', g.kcal_punt, 163);
eis('smalle band uit de tabel, niet uit de maat', [g.kcal_laag, g.kcal_hoog], [155,170]);
await ctx.portieLoggen();
console.log('  onzekerheid:'); opgeslagen.at(-1).onzekerheidsbronnen.forEach(t=>console.log('   ·', t));

// ======================================================= D. eigen product ===
console.log('\nD. EIGEN PRODUCT');
B.S.producten.push({id:'p1', naam:'Griekse yoghurt 10%', per:150, eenheid:'g',
                    kcal:171, eiwit_g:8.7, vet_g:15, koolhydraat_g:5.4, vezel_g:0, conf:'A'});
ctx.kiesEigen('p1');
eis('één optie', ctx.portieOpties().length, 1);
eis('etiketwaarde', ctx.portieOpties()[0].kcal_punt, 171);
await ctx.portieLoggen();
const r3 = opgeslagen.at(-1);
eis('graad A blijft A', r3.conf, 'A');
console.log('  naam:', r3.naam);

console.log(fouten ? `\n${fouten} FOUTEN` : '\nAlles klopt.');
process.exit(fouten ? 1 : 0);
